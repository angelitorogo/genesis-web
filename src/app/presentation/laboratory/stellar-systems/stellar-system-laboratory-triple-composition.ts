import { type StellarSystemLaboratoryFamily } from './stellar-system-laboratory-fixtures';

import {
  projectSystemSceneMotionContributions,
} from '../../system/system-scene-motion-projection';

import {
  buildLinearFitSystemScale,
} from '../../system/system-scene-scale-projection';

import {
  type SystemSceneBodySnapshot,
  type SystemSceneHabitableZoneSnapshot,
  type SystemSceneMotionContributionSnapshot,
  type SystemSceneOrbitalMotionSnapshot,
  type SystemSceneOrbitSnapshot,
  type SystemSceneSnapshot,
} from '../../system/system-scene-snapshot';

import {
  systemSceneMoonPresentationTimeScale,
} from '../../system/system-scene-secondary-motion';

import {
  composeLaboratoryBinaryScene,
  LAB_MOON_MIN_ORBIT_SECONDS,
  LAB_MINOR_BODY_MIN_ORBIT_SECONDS,
  LAB_PLANET_MIN_ORBIT_SECONDS,
} from './stellar-system-laboratory-binary-composition';

/**
 * LABORATORY ONLY: hierarchical TRIPLE generated as (SINGLE A + SINGLE B) +
 * SINGLE C. A and B first form the already validated laboratory binary. That
 * complete binary then behaves as one mass centre in a wider binary orbit with
 * C. Each source SINGLE keeps its own planets, moons, belts, comets and HZ.
 */
const LOCAL_SYSTEM_RADIUS_SCENE = 2.15;
const LOCAL_MINOR_ORBIT_LIMIT_SCENE = 2.38;
const OUTER_PERIASTRON_SEPARATION_SCENE = 12.4;
const OUTER_ECCENTRICITY = 0.18;
export const LAB_TRIPLE_OUTER_ORBIT_SECONDS_PER_REVOLUTION = 720;

export function composeLaboratoryTripleScene(
  singleA: SystemSceneSnapshot,
  singleB: SystemSceneSnapshot,
  singleC: SystemSceneSnapshot,
  family: StellarSystemLaboratoryFamily,
  massesSolar: readonly [number, number, number],
): SystemSceneSnapshot {
  const [massA, massB, massC] = massesSolar;
  if ([singleA, singleB, singleC].some(source =>
    source.multiplicityName !== 'SINGLE' || source.stars.length !== 1)) {
    throw new RangeError('Triple laboratory assembly requires three COMPLETE SINGLE sources.');
  }
  if ([massA, massB, massC].some(mass => !Number.isFinite(mass) || mass <= 0)) {
    throw new RangeError('All three source-star masses must come from catalogued SINGLE cards.');
  }

  // Build the inner hierarchy from exactly the same two-SINGLE generator used
  // by the laboratory BINARY. No second triple/planetary generator exists.
  const inner = composeLaboratoryBinaryScene(
    singleA,
    singleB,
    family,
    [massA, massB],
  );
  const innerMotion = inner.motions.find(motion => motion.id === 'lab-binary-relative');
  if (innerMotion === undefined) {
    throw new Error('The laboratory TRIPLE requires the generated inner A-B binary motion.');
  }

  const massAB = massA + massB;
  const innerExtentAu = innerMotion.semiMajorAxisAu * (1 + innerMotion.eccentricity) +
    Math.max(outerRadiusAu(singleA), outerRadiusAu(singleB));
  const cExtentAu = outerRadiusAu(singleC);
  // Hierarchical spacing policy: outer periastron is well outside both the
  // complete A-B subsystem and C's complete SINGLE system. It is deliberately
  // conservative presentation geometry, not an N-body stability certificate.
  const outerSemiMajorAxisAu = 9 * Math.max(innerExtentAu, cExtentAu) /
    (1 - OUTER_ECCENTRICITY);
  const outerMotion: SystemSceneOrbitalMotionSnapshot = Object.freeze({
    id: 'lab-triple-outer-relative',
    semiMajorAxisAu: outerSemiMajorAxisAu,
    eccentricity: OUTER_ECCENTRICITY,
    periodDays: 365.25 * Math.sqrt(outerSemiMajorAxisAu ** 3 / (massAB + massC)),
    rotationDegrees: 151,
    inclinationDegrees: 31,
    epochMeanAnomalyDegrees: 128,
  });

  const playbackDaysPerRealSecond = singleA.simulation.playbackDaysPerRealSecond;
  const outerScenePerAu = OUTER_PERIASTRON_SEPARATION_SCENE /
    (outerMotion.semiMajorAxisAu * (1 - outerMotion.eccentricity));
  const outerTimeScale = outerMotion.periodDays /
    (playbackDaysPerRealSecond * LAB_TRIPLE_OUTER_ORBIT_SECONDS_PER_REVOLUTION);
  const outerAnchorAB: SystemSceneMotionContributionSnapshot = Object.freeze({
    motionId: outerMotion.id,
    scale: -massC / (massAB + massC),
    linearScenePerAu: outerScenePerAu,
    presentationTimeScale: outerTimeScale,
  });
  const outerAnchorC: SystemSceneMotionContributionSnapshot = Object.freeze({
    motionId: outerMotion.id,
    scale: massAB / (massAB + massC),
    linearScenePerAu: outerScenePerAu,
    presentationTimeScale: outerTimeScale,
  });

  const outerApoapsisScene = outerMotion.semiMajorAxisAu *
    (1 + outerMotion.eccentricity) * outerScenePerAu;
  const innerSceneRadius = Math.max(
    ...inner.stars.map(star => vectorLength(star.position) + (star.opticalRadiusScene ?? star.radiusScene)),
    ...inner.planets.map(planet => vectorLength(planet.position) + planet.radiusScene),
    3.0,
  );
  const globalRadius = Math.max(
    Math.abs(outerAnchorAB.scale) * outerApoapsisScene + innerSceneRadius,
    Math.abs(outerAnchorC.scale) * outerApoapsisScene + LOCAL_MINOR_ORBIT_LIMIT_SCENE,
  ) + 0.5;
  const scale = buildLinearFitSystemScale(outerMotion.semiMajorAxisAu, globalRadius);
  const motions: SystemSceneOrbitalMotionSnapshot[] = [outerMotion, ...inner.motions];
  const resolveMotion = (id: string) => motions.find(motion => motion.id === id);
  const withOuterAB = (
    parts: readonly SystemSceneMotionContributionSnapshot[],
  ): readonly SystemSceneMotionContributionSnapshot[] => Object.freeze([
    outerAnchorAB,
    ...parts,
  ]);
  const position = (parts: readonly SystemSceneMotionContributionSnapshot[]) =>
    Object.freeze(projectSystemSceneMotionContributions(parts, resolveMotion, 0, scale));

  // Shift the complete inner binary as a rigid hierarchy. Its internal A-B
  // motion and every A/B local orbit remain untouched.
  const stars: SystemSceneBodySnapshot[] = inner.stars.map(star => {
    const parts = withOuterAB(star.motionContributions);
    return Object.freeze({ ...star, motionContributions: parts, position: position(parts) });
  });
  const planets: SystemSceneBodySnapshot[] = inner.planets.map(planet => {
    const parts = withOuterAB(planet.motionContributions);
    return Object.freeze({ ...planet, motionContributions: parts, position: position(parts) });
  });
  const moons: SystemSceneSnapshot['moons'][number][] = inner.moons.map(moon => {
    const parts = withOuterAB(moon.motionContributions);
    return Object.freeze({ ...moon, motionContributions: parts, position: position(parts) });
  });
  const minorBodies: SystemSceneSnapshot['minorBodies'][number][] = inner.minorBodies.map(body => {
    const parts = withOuterAB(body.motionContributions);
    return Object.freeze({ ...body, motionContributions: parts, position: position(parts) });
  });
  const orbits: SystemSceneOrbitSnapshot[] = inner.orbits.map(orbit => Object.freeze({
    ...orbit,
    anchorMotionContributions: withOuterAB(orbit.anchorMotionContributions),
  }));
  const zones: SystemSceneHabitableZoneSnapshot[] = (inner.habitableZones ??
    (inner.habitableZone === null ? [] : [inner.habitableZone])).map(zone => Object.freeze({
      ...zone,
      anchorMotionContributions: withOuterAB(zone.anchorMotionContributions),
    }));
  const belts: NonNullable<SystemSceneSnapshot['asteroidBelts']>[number][] =
    (inner.asteroidBelts ?? []).map(belt => Object.freeze({
      ...belt,
      anchorMotionContributions: withOuterAB(belt.anchorMotionContributions),
    }));
  const riskTargets: SystemSceneSnapshot['orbitalRiskTargets'][number][] = [
    ...inner.orbitalRiskTargets,
  ];

  // Show the outer binary hierarchy explicitly: the A-B barycentre and C both
  // orbit the global barycentre. A/B stellar guides remain nested inside it.
  const outerOrbit = (
    id: string,
    label: string,
    weight: number,
    anchors: readonly SystemSceneMotionContributionSnapshot[],
  ): SystemSceneOrbitSnapshot => {
    const semiMajorScene = Math.abs(weight) * outerMotion.semiMajorAxisAu * outerScenePerAu;
    return Object.freeze({
      id,
      kind: 'stellar',
      label,
      colorHex: '#CFA86C',
      opacity: 0.34,
      semiMajorScene,
      semiMinorScene: semiMajorScene * Math.sqrt(1 - outerMotion.eccentricity ** 2),
      focusOffsetScene: semiMajorScene * outerMotion.eccentricity,
      rotationDegrees: outerMotion.rotationDegrees,
      inclinationDegrees: outerMotion.inclinationDegrees,
      motionId: outerMotion.id,
      motionScale: weight,
      linearScenePerAu: outerScenePerAu,
      anchorMotionContributions: anchors,
    });
  };
  orbits.unshift(
    outerOrbit('lab-orbit-barycenter-ab', 'Órbita exterior del subsistema A–B', outerAnchorAB.scale, Object.freeze([])),
    outerOrbit('lab-orbit-star-c', 'Órbita estelar C', outerAnchorC.scale, Object.freeze([])),
  );

  // Materialize C from its own complete SINGLE snapshot using the exact same
  // local presentation constraints as A and B in the laboratory binary.
  appendSingleC({
    source: singleC,
    scaleFactor: LOCAL_SYSTEM_RADIUS_SCENE / localReferenceRadius(singleC),
    anchor: outerAnchorC,
    globalScale: scale,
    motions,
    orbits,
    stars,
    planets,
    moons,
    minorBodies,
    zones,
    belts,
    riskTargets,
    playbackDaysPerRealSecond,
  });

  const availableRisks = riskTargets.filter(risk => risk.severity !== 'CROSSING');
  const crossingRisks = riskTargets.filter(risk => risk.severity === 'CROSSING');
  return Object.freeze({
    ...inner,
    address: Object.freeze({
      galaxyIndex: family.locator.galaxyIndex.toString(),
      sectorKey: family.locator.sectorKey.toString(),
      galacticObjectIndex: family.locator.galacticObjectIndex.toString(),
    }),
    proceduralIdentity: `LAB-TRIPLE-${family.systemSeedHex}-${singleA.proceduralIdentity}-${singleB.proceduralIdentity}-${singleC.proceduralIdentity}`,
    title: `Triple jerárquico de tres sistemas simples · familia ${family.id}`,
    multiplicityName: 'TRIPLE',
    componentCount: 3,
    accessibleLabel: 'Sistema triple jerárquico: dos sistemas simples A y B forman un binario interior completo; ese binario y un tercer sistema simple C forman un segundo binario exterior. Cada estrella conserva su propia población y zona habitable.',
    stars: Object.freeze(stars),
    planets: Object.freeze(planets),
    moons: Object.freeze(moons),
    minorBodies: Object.freeze(minorBodies),
    asteroidBelts: Object.freeze(belts),
    habitableZone: zones[0] ?? null,
    habitableZones: Object.freeze(zones),
    hostVisualEnvelope: null,
    multistellarPresentation: null,
    multistellarPTypeClearance: null,
    multistellarCoreCompaction: null,
    stellarOrbitClearance: null,
    firstOrbitAnchor: null,
    orbitalRiskTargets: Object.freeze(riskTargets),
    layers: Object.freeze({
      moonCount: moons.length,
      minorBodyCount: minorBodies.length,
      habitableZoneAvailable: zones.length > 0,
      orbitalRiskTargetCount: availableRisks.length,
      orbitalCrossingTargetCount: crossingRisks.length,
      orbitalApproachTargetCount: availableRisks.filter(risk => risk.severity === 'APPROACH').length,
      orbitalCollisionGeometryTargetCount: availableRisks.filter(risk => risk.severity === 'COLLISION_GEOMETRY').length,
    }),
    orbits: Object.freeze(orbits),
    motions: Object.freeze(motions),
    simulation: Object.freeze({ epochSimulationDay: 0, playbackDaysPerRealSecond }),
    scale,
  });
}

interface AppendSingleCOptions {
  readonly source: SystemSceneSnapshot;
  readonly scaleFactor: number;
  readonly anchor: SystemSceneMotionContributionSnapshot;
  readonly globalScale: SystemSceneSnapshot['scale'];
  readonly motions: SystemSceneOrbitalMotionSnapshot[];
  readonly orbits: SystemSceneOrbitSnapshot[];
  readonly stars: SystemSceneBodySnapshot[];
  readonly planets: SystemSceneBodySnapshot[];
  readonly moons: SystemSceneSnapshot['moons'][number][];
  readonly minorBodies: SystemSceneSnapshot['minorBodies'][number][];
  readonly zones: SystemSceneHabitableZoneSnapshot[];
  readonly belts: NonNullable<SystemSceneSnapshot['asteroidBelts']>[number][];
  readonly riskTargets: SystemSceneSnapshot['orbitalRiskTargets'][number][];
  readonly playbackDaysPerRealSecond: number;
}

function appendSingleC(options: AppendSingleCOptions): void {
  const {
    source, scaleFactor, anchor, globalScale, motions, orbits, stars, planets,
    moons, minorBodies, zones, belts, riskTargets, playbackDaysPerRealSecond,
  } = options;
  const prefix = 'lab-c-';
  const motionId = (id: string): string => `${prefix}${id}`;
  const orbitId = (id: string): string => `${prefix}${id}`;
  const bodyId = (id: string): string => `${prefix}${id}`;
  const motionById = new Map(source.motions.map(motion => [motion.id, motion]));
  const guideByMotion = new Map(source.orbits.filter(orbit => orbit.motionId !== null)
    .map(orbit => [orbit.motionId!, orbit]));
  const linearByMotion = new Map<string, number>();

  for (const motion of source.motions) {
    const guide = guideByMotion.get(motion.id);
    const originalSemiMajorScene = guide?.semiMajorScene ??
      motion.semiMajorAxisAu * source.scale.orbitScaleScenePerAu;
    const projected = originalSemiMajorScene * scaleFactor;
    const semiMajorScene = guide?.kind === 'minor-body'
      ? Math.min(projected, LOCAL_MINOR_ORBIT_LIMIT_SCENE / (1 + motion.eccentricity))
      : projected;
    const weight = Math.abs(guide?.motionScale ?? 1);
    linearByMotion.set(motion.id, semiMajorScene / (motion.semiMajorAxisAu * (weight || 1)));
    motions.push(Object.freeze({ ...motion, id: motionId(motion.id) }));
  }

  const contributions = (
    sourceParts: readonly SystemSceneMotionContributionSnapshot[],
  ): readonly SystemSceneMotionContributionSnapshot[] => Object.freeze([
    anchor,
    ...sourceParts.map(contribution => {
      const localMotion = motionById.get(contribution.motionId);
      const isMoon = contribution.motionId.startsWith('moon-');
      const isPlanet = contribution.motionId.startsWith('planet-');
      const existingScale = isMoon && localMotion !== undefined
        ? Math.min(
            contribution.presentationTimeScale ?? 1,
            systemSceneMoonPresentationTimeScale(localMotion.periodDays, playbackDaysPerRealSecond),
          )
        : contribution.presentationTimeScale ?? 1;
      const minimumOrbitSeconds = isMoon
        ? LAB_MOON_MIN_ORBIT_SECONDS
        : isPlanet
          ? LAB_PLANET_MIN_ORBIT_SECONDS
          : LAB_MINOR_BODY_MIN_ORBIT_SECONDS;
      const presentationTimeScale = localMotion === undefined
        ? existingScale
        : Math.min(existingScale,
            localMotion.periodDays / (playbackDaysPerRealSecond * minimumOrbitSeconds));
      return Object.freeze({
        motionId: motionId(contribution.motionId),
        scale: contribution.scale,
        linearScenePerAu: linearByMotion.get(contribution.motionId) ??
          contribution.linearScenePerAu ?? source.scale.orbitScaleScenePerAu * scaleFactor,
        presentationTimeScale,
      });
    }),
  ]);
  const position = (parts: readonly SystemSceneMotionContributionSnapshot[]) =>
    Object.freeze(projectSystemSceneMotionContributions(
      parts,
      id => motions.find(motion => motion.id === id),
      0,
      globalScale,
    ));

  const sourceStar = source.stars[0]!;
  const starParts = Object.freeze([anchor]);
  const radiusScene = Math.min(0.24, Math.max(0.075, sourceStar.radiusScene * scaleFactor));
  stars.push(Object.freeze({
    ...sourceStar,
    id: bodyId(sourceStar.id),
    label: 'C',
    title: `${sourceStar.title} · estrella C`,
    orbitId: 'lab-orbit-star-c',
    motionContributions: starParts,
    position: position(starParts),
    radiusScene,
    opticalRadiusScene: Math.max(radiusScene, Math.min(
      0.30,
      (sourceStar.opticalRadiusScene ?? sourceStar.radiusScene) * scaleFactor,
    )),
  }));

  for (const orbit of source.orbits) {
    const motion = orbit.motionId === null ? undefined : motionById.get(orbit.motionId);
    const linear = orbit.motionId === null ? undefined : linearByMotion.get(orbit.motionId);
    const semiMajorScene = motion !== undefined && linear !== undefined
      ? motion.semiMajorAxisAu * Math.abs(orbit.motionScale) * linear
      : orbit.semiMajorScene * scaleFactor;
    orbits.push(Object.freeze({
      ...orbit,
      id: orbitId(orbit.id),
      label: `C · ${orbit.label}`,
      semiMajorScene,
      semiMinorScene: semiMajorScene *
        (orbit.semiMajorScene > 0 ? orbit.semiMinorScene / orbit.semiMajorScene : 1),
      focusOffsetScene: semiMajorScene *
        (orbit.semiMajorScene > 0 ? orbit.focusOffsetScene / orbit.semiMajorScene : 0),
      motionId: orbit.motionId === null ? null : motionId(orbit.motionId),
      anchorMotionContributions: contributions(orbit.anchorMotionContributions),
      ...(linear === undefined ? { linearScenePerAu: undefined } : { linearScenePerAu: linear }),
      postProjectionScale: undefined,
    }));
  }

  for (const planet of source.planets) {
    const parts = contributions(planet.motionContributions);
    planets.push(Object.freeze({
      ...planet,
      id: bodyId(planet.id),
      label: `C · ${planet.label}`,
      title: `C · ${planet.title}`,
      orbitId: planet.orbitId === null ? null : orbitId(planet.orbitId),
      radiusScene: planet.radiusScene * scaleFactor,
      position: position(parts),
      motionContributions: parts,
    }));
  }
  for (const moon of source.moons) {
    const parts = contributions(moon.motionContributions);
    moons.push(Object.freeze({
      ...moon,
      id: bodyId(moon.id),
      hostPlanetId: bodyId(moon.hostPlanetId),
      label: `C · ${moon.label}`,
      title: `C · ${moon.title}`,
      orbitId: orbitId(moon.orbitId),
      radiusScene: moon.radiusScene * scaleFactor,
      position: position(parts),
      motionContributions: parts,
      visualPresentation: Object.freeze({
        ...moon.visualPresentation,
        presentationRadiusScene: moon.visualPresentation.presentationRadiusScene * scaleFactor,
      }),
    }));
  }
  for (const body of source.minorBodies) {
    const parts = contributions(body.motionContributions);
    minorBodies.push(Object.freeze({
      ...body,
      id: bodyId(body.id),
      label: `C · ${body.label}`,
      title: `C · ${body.title}`,
      orbitId: orbitId(body.orbitId),
      radiusScene: body.radiusScene * scaleFactor,
      position: position(parts),
      motionContributions: parts,
    }));
  }
  if (source.habitableZone !== null) {
    const zone = source.habitableZone;
    zones.push(Object.freeze({
      ...zone,
      radiativeInnerRadiusScene: zone.radiativeInnerRadiusScene * scaleFactor,
      radiativeOuterRadiusScene: zone.radiativeOuterRadiusScene * scaleFactor,
      dynamicallyHabitableInnerRadiusScene: zone.dynamicallyHabitableInnerRadiusScene === null
        ? null : zone.dynamicallyHabitableInnerRadiusScene * scaleFactor,
      dynamicallyHabitableOuterRadiusScene: zone.dynamicallyHabitableOuterRadiusScene === null
        ? null : zone.dynamicallyHabitableOuterRadiusScene * scaleFactor,
      anchorMotionContributions: Object.freeze([anchor]),
    }));
  }
  for (const belt of source.asteroidBelts ?? []) {
    belts.push(Object.freeze({
      ...belt,
      id: bodyId(belt.id),
      label: `C · ${belt.label}`,
      innerRadiusScene: belt.innerRadiusScene * scaleFactor,
      outerRadiusScene: belt.outerRadiusScene * scaleFactor,
      peakRadiusScene: belt.peakRadiusScene === null ? null : belt.peakRadiusScene * scaleFactor,
      anchorMotionContributions: contributions(belt.anchorMotionContributions),
    }));
  }
  for (const risk of source.orbitalRiskTargets) {
    riskTargets.push(Object.freeze({
      ...risk,
      id: bodyId(risk.id),
      targetBodyId: bodyId(risk.targetBodyId),
      targetOrbitId: orbitId(risk.targetOrbitId),
      targetLabel: `C · ${risk.targetLabel}`,
    }));
  }
}

function outerRadiusAu(source: SystemSceneSnapshot): number {
  return Math.max(
    0.2,
    source.habitableZone?.radiativeOuterEdgeAu ?? 0,
    ...source.planets.map(planet => {
      const orbit = source.orbits.find(candidate => candidate.id === planet.orbitId);
      const motion = source.motions.find(candidate => candidate.id === orbit?.motionId);
      return motion === undefined ? 0 : motion.semiMajorAxisAu * (1 + motion.eccentricity);
    }),
  );
}

function localReferenceRadius(source: SystemSceneSnapshot): number {
  return Math.max(
    0.6,
    ...source.stars.map(star => star.radiusScene * 3.1),
    ...source.planets.map(planet => {
      const orbit = source.orbits.find(candidate => candidate.id === planet.orbitId);
      const motion = source.motions.find(candidate => candidate.id === orbit?.motionId);
      return (orbit?.semiMajorScene ?? 0) * (1 + (motion?.eccentricity ?? 0)) + planet.radiusScene;
    }),
    ...(source.asteroidBelts?.map(belt => belt.outerRadiusScene) ?? []),
    source.habitableZone?.radiativeOuterRadiusScene ?? 0,
  );
}

function vectorLength(vector: { readonly x: number; readonly y: number; readonly z: number }): number {
  return Math.hypot(vector.x, vector.y, vector.z);
}
