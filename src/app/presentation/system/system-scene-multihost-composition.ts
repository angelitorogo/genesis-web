import { buildV2CometVisualOrbit, type V2CometVisualOrbit,
  V2_COMET_MAX_LOCAL_APOAPSIS_SCENE } from './system-scene-v2-comet-orbit-presentation';
import { type BodyLocator } from '../../domain/generation/procedural-locator';
import { StellarMultihostPublicTargetIndex } from '../../simulation/stellar/stellar-multihost-public-target-index';
import { type GeneratedMultipleHost, type MultihostLabel } from '../../simulation/stellar/stellar-multihost-formation';
import {
  stellarMultihostPublicMoonDesignation,
  stellarMultihostPublicPlanetDesignation,
} from '../../simulation/stellar/stellar-multihost-public-designation';
import { projectSystemSceneMotionContributions } from './system-scene-motion-projection';
import { buildLinearFitSystemScale } from './system-scene-scale-projection';
import { systemSceneMoonPresentationTimeScale } from './system-scene-secondary-motion';
import { v2PlanetTimeScale } from './system-scene-v2-planet-cadence';
import { assertSystemSceneProjectionSnapshot } from './system-scene-projection-contract';
import { SystemSceneMultihostMaterializedSources } from './system-scene-multihost-materialized-sources';
import {
  type SystemSceneSnapshot, type SystemSceneBodySnapshot, type SystemSceneOrbitalMotionSnapshot,
  type SystemSceneMotionContributionSnapshot, type SystemSceneOrbitSnapshot,
  type SystemSceneHabitableZoneSnapshot,
} from './system-scene-snapshot';
import { appendSystemSceneMultihostCircumbinary } from './system-scene-multihost-circumbinary-projection';

/** Stage 7: pure opt-in composition of already generated sources. No generation,
 * route switch, writes, private child scopes, or reassignment of planets. */
export interface MultihostComposedPlanetBinding {
  readonly publicLocator: BodyLocator;
  readonly host: MultihostLabel | 'AB';
  readonly sceneBodyId: string;
}
export interface MultihostComposedScene {
  readonly snapshot: SystemSceneSnapshot;
  readonly planetBindings: readonly MultihostComposedPlanetBinding[];
}

const LOCAL_RADIUS = 2.15;
const INNER_VISUAL_SECONDS = 300;
const OUTER_VISUAL_SECONDS = 720;
const PLANET_MIN_SECONDS = 100;
const MOON_MIN_SECONDS = 42;
const MINOR_MIN_SECONDS = 90;

export class SystemSceneMultihostComposition {
  private constructor() {}

  static build(formation: GeneratedMultipleHost, materialized: SystemSceneMultihostMaterializedSources): MultihostComposedScene {
    const sources = materialized.singles;
    const base = sources[0]?.snapshot;
    if (!base || sources.length !== formation.components.length ||
        sources.some((source, index) => source.label !== formation.components[index]?.label ||
          source.snapshot.stars.length !== 1 || source.snapshot.multiplicityName !== 'SINGLE' ||
          source.snapshot.address.galacticObjectIndex !== formation.parentLocator.galacticObjectIndex.toString() ||
          source.snapshot.address.galaxyIndex !== formation.parentLocator.galaxyIndex.toString() ||
          source.snapshot.address.sectorKey !== formation.parentLocator.sectorKey.toString())) {
      throw new RangeError('Multihost scene requires matching, fully materialized SINGLE source snapshots.');
    }
    const [a, b, c] = formation.components;
    if (!a || !b || (formation.outerOrbit !== null) !== (c !== undefined)) {
      throw new RangeError('Generated stellar hierarchy is incomplete.');
    }
    if (base.universeSeed !== formation.parentGenerationKey.universeSeed.serialize() ||
        base.generatorVersionCode !== formation.parentGenerationKey.generatorVersionCode) {
      throw new RangeError('Multihost scene parent universe identity does not match the generated aggregate.');
    }
    const massA = a.physical.initialMassSolar;
    const massB = b.physical.initialMassSolar;
    const massAB = massA + massB;
    const massC = c?.physical.initialMassSolar ?? 0;
    const playback = base.simulation.playbackDaysPerRealSecond;
    const innerPhysical = formation.innerOrbit;
    const innerScale = 6 / innerPhysical.periastronAu;
    const inner: SystemSceneOrbitalMotionSnapshot = Object.freeze({
      id: 'multihost-ab-relative', semiMajorAxisAu: innerPhysical.semiMajorAxisAu,
      eccentricity: innerPhysical.eccentricity, periodDays: innerPhysical.periodDays,
      rotationDegrees: 24, inclinationDegrees: 18, epochMeanAnomalyDegrees: 0,
    });
    const outerPhysical = formation.outerOrbit;
    const pOuter = Math.max(0, ...formation.circumbinary.planets.map(p => p.orbit.apoastronAu));
    const innerDisplayEnvelope = Math.max(6 * (1 + inner.eccentricity) / (1 - inner.eccentricity) + LOCAL_RADIUS,
      pOuter * innerScale + 0.6);
    const outerScale = outerPhysical === null ? 0 :
      Math.max(18, innerDisplayEnvelope + LOCAL_RADIUS + 3) / outerPhysical.periastronAu;
    const outer: SystemSceneOrbitalMotionSnapshot | null = outerPhysical === null ? null : Object.freeze({
      id: 'multihost-abc-relative', semiMajorAxisAu: outerPhysical.semiMajorAxisAu,
      eccentricity: outerPhysical.eccentricity, periodDays: outerPhysical.periodDays,
      rotationDegrees: 151, inclinationDegrees: 31, epochMeanAnomalyDegrees: 128,
    });
    const innerTime = inner.periodDays / (playback * INNER_VISUAL_SECONDS);
    const outerTime = outer === null ? 1 : outer.periodDays / (playback * OUTER_VISUAL_SECONDS);
    const contribution = (motion: SystemSceneOrbitalMotionSnapshot, weight: number,
      scenePerAu: number, time: number): SystemSceneMotionContributionSnapshot => Object.freeze({
        motionId: motion.id, scale: weight, linearScenePerAu: scenePerAu, presentationTimeScale: time,
      });
    const outerAB = outer === null ? [] : [contribution(outer, -massC / (massAB + massC), outerScale, outerTime)];
    const outerC = outer === null ? [] : [contribution(outer, massAB / (massAB + massC), outerScale, outerTime)];
    const anchors: Readonly<Record<MultihostLabel, readonly SystemSceneMotionContributionSnapshot[]>> = {
      A: Object.freeze([...outerAB, contribution(inner, -massB / massAB, innerScale, innerTime)]),
      B: Object.freeze([...outerAB, contribution(inner, massA / massAB, innerScale, innerTime)]),
      C: Object.freeze([...outerC]),
    };
    const orbitEnvelope = outer === null
      ? Math.max(innerDisplayEnvelope, LOCAL_RADIUS + 6 * (1 + inner.eccentricity) / (1 - inner.eccentricity))
      : Math.max(innerDisplayEnvelope + Math.abs(outerAB[0]!.scale) * outerPhysical!.apoastronAu * outerScale,
        LOCAL_RADIUS + Math.abs(outerC[0]!.scale) * outerPhysical!.apoastronAu * outerScale);
    // Motion definitions carry genuine physical AU. Presentation magnifications
    // are per-contribution and NEVER written to their orbital elements.
    const scale = buildLinearFitSystemScale(
      Math.max(outerPhysical?.semiMajorAxisAu ?? innerPhysical.semiMajorAxisAu, pOuter, 1),
      orbitEnvelope + 0.8,
    );
    const motions: SystemSceneOrbitalMotionSnapshot[] = outer === null ? [inner] : [outer, inner];
    const orbits: SystemSceneOrbitSnapshot[] = [];
    const stars: SystemSceneBodySnapshot[] = [];
    const planets: SystemSceneBodySnapshot[] = [];
    const moons: SystemSceneSnapshot['moons'][number][] = [];
    const minorBodies: SystemSceneSnapshot['minorBodies'][number][] = [];
    const belts: NonNullable<SystemSceneSnapshot['asteroidBelts']>[number][] = [];
    const zones: SystemSceneHabitableZoneSnapshot[] = [];
    const risks: SystemSceneSnapshot['orbitalRiskTargets'][number][] = [];
    const publicTargets = StellarMultihostPublicTargetIndex.build(formation);
    const resolveMotion = (id: string) => motions.find(m => m.id === id);
    const position = (parts: readonly SystemSceneMotionContributionSnapshot[]) =>
      Object.freeze(projectSystemSceneMotionContributions(parts, resolveMotion, 0, scale));
    const guide = (id: string, label: string, motion: SystemSceneOrbitalMotionSnapshot,
      weight: number, scenePerAu: number,
      parent: readonly SystemSceneMotionContributionSnapshot[]): SystemSceneOrbitSnapshot => {
      const axis = Math.abs(weight) * motion.semiMajorAxisAu * scenePerAu;
      return Object.freeze({ id, label, kind: 'stellar', colorHex: '#CFA86C', opacity: 0.35,
        semiMajorScene: axis, semiMinorScene: axis * Math.sqrt(1 - motion.eccentricity ** 2),
        focusOffsetScene: axis * motion.eccentricity, rotationDegrees: motion.rotationDegrees,
        inclinationDegrees: motion.inclinationDegrees, motionId: motion.id, motionScale: weight,
        linearScenePerAu: scenePerAu, anchorMotionContributions: parent });
    };
    if (outer) {
      orbits.push(guide('mh-orbit-barycenter-ab', 'Baricentro A–B', outer, outerAB[0]!.scale, outerScale, Object.freeze([])));
      orbits.push(guide('mh-orbit-star-c', 'Órbita de C', outer, outerC[0]!.scale, outerScale, Object.freeze([])));
    }
    orbits.push(guide('mh-orbit-star-a', 'Órbita de A', inner, -massB / massAB, innerScale, Object.freeze([...outerAB])));
    orbits.push(guide('mh-orbit-star-b', 'Órbita de B', inner, massA / massAB, innerScale, Object.freeze([...outerAB])));

    for (const source of sources) {
      const prefix = `mh-${source.label.toLowerCase()}-`;
      const local = source.snapshot;
      const publicPlanetNames = new Map<SystemSceneBodySnapshot, string>();
      const publicOrbitNames = new Map<string, string>();
      for (const binding of materialized.boundPlanets.filter(candidate => candidate.host === source.label)) {
        const designation = stellarMultihostPublicPlanetDesignation(
          materialized.publicSystemDesignation, source.label, binding.sourcePlanetOrdinal,
        );
        publicPlanetNames.set(binding.body, designation);
        if (binding.body.orbitId !== null) publicOrbitNames.set(binding.body.orbitId, designation);
      }
      const publicMoonNames = new Map<string, string>();
      for (const moon of local.moons) {
        const publicMoon = publicTargets.moons.find(candidate =>
          candidate.relevantMoon !== null &&
          candidate.parent.host === source.label &&
          candidate.parent.sourcePlanetOrdinal === moon.hostPlanetOrdinal &&
          candidate.sourceIdentity.designation.romanNumeral === moon.label);
        if (publicMoon === undefined) {
          throw new Error('Projected multihost moon has no canonical public identity.');
        }
        const designation = stellarMultihostPublicMoonDesignation(
          materialized.publicSystemDesignation,
          source.label,
          publicMoon.parent.sourcePlanetOrdinal,
          publicMoon.sourceIdentity.moonOrdinal,
        );
        publicMoonNames.set(moon.id, designation);
        publicOrbitNames.set(moon.orbitId, designation);
      }
      const localRadius = Math.max(0.6, ...local.stars.map(star => star.radiusScene * 3.1),
        ...local.planets.map(planet => {
          const orbit = local.orbits.find(o => o.id === planet.orbitId);
          const motion = local.motions.find(m => m.id === orbit?.motionId);
          return (orbit?.semiMajorScene ?? 0) * (1 + (motion?.eccentricity ?? 0)) + planet.radiusScene;
        }), ...(local.asteroidBelts ?? []).map(belt => belt.outerRadiusScene),
        local.habitableZone?.radiativeOuterRadiusScene ?? 0);
      const factor = LOCAL_RADIUS / localRadius;
      const hostAnchor = anchors[source.label];
      const namespaced = (id: string) => prefix + id;
      const motionIndex = new Map(local.motions.map(m => [m.id, m]));
      const orbitByMotion = new Map(local.orbits.filter(o => o.motionId !== null).map(o => [o.motionId!, o]));
      const rankedPlanetMotions = local.planets.map(planet => {
        const motionId = planet.motionContributions.at(-1)?.motionId;
        const motion = motionId === undefined ? undefined : motionIndex.get(motionId);
        if (!motionId || !motion || orbitByMotion.get(motionId)?.kind !== 'planetary') {
          throw new Error('V2 stellar host has an unbound planet presentation motion.');
        }
        return { motionId, radiusAu: motion.semiMajorAxisAu };
      }).sort((a, b) => a.radiusAu - b.radiusAu);
      const planetRank = new Map(rankedPlanetMotions.map((item, index) => [item.motionId, index + 1]));
      const scales = new Map<string, number>();
      const cometVisuals = new Map<string, V2CometVisualOrbit>();
      const ownStar = local.stars[0]!;
      const localStarRadius = base.generatorVersionCode === 2
        ? Math.max(0.055, Math.min(0.19, ownStar.radiusScene * factor))
        : Math.max(0.075, Math.min(0.24, ownStar.radiusScene * factor));
      const localStarOpticalRadius = Math.max(localStarRadius,
        Math.min(base.generatorVersionCode === 2 ? 0.235 : 0.3,
          (ownStar.opticalRadiusScene ?? ownStar.radiusScene) * factor));
      for (const motion of local.motions) {
        const guideForMotion = orbitByMotion.get(motion.id);
        const rawAxis = (guideForMotion?.semiMajorScene ??
          motion.semiMajorAxisAu * local.scale.orbitScaleScenePerAu) * factor;
        const comet = base.generatorVersionCode === 2 && guideForMotion?.kind === 'minor-body' &&
          guideForMotion.presentationEccentricity !== undefined;
        const visual = comet ? buildV2CometVisualOrbit({
          physicalSemiMajorScene: rawAxis,
          physicalEccentricity: motion.eccentricity,
          starOpticalRadiusScene: localStarOpticalRadius,
          cometRadiusScene: local.minorBodies.find(body =>
            body.motionContributions.at(-1)?.motionId === motion.id)?.radiusScene ?? 0,
          maximumApoapsisScene: V2_COMET_MAX_LOCAL_APOAPSIS_SCENE,
        }) : null;
        if (visual !== null) cometVisuals.set(motion.id, visual);
        const visualAxis = visual?.semiMajorScene ?? (guideForMotion?.kind === 'minor-body'
          ? Math.min(rawAxis, 2.38 / (1 + motion.eccentricity)) : rawAxis);
        const weight = Math.abs(guideForMotion?.motionScale ?? 1);
        scales.set(motion.id, visualAxis / (motion.semiMajorAxisAu * (weight || 1)));
        motions.push(Object.freeze({ ...motion, id: namespaced(motion.id) }));
      }
      const partsFor = (parts: readonly SystemSceneMotionContributionSnapshot[]): readonly SystemSceneMotionContributionSnapshot[] =>
        Object.freeze([...hostAnchor, ...parts.map(part => {
          const physical = motionIndex.get(part.motionId);
          const radialRank = planetRank.get(part.motionId);
          const minimum = part.motionId.startsWith('moon-') ? MOON_MIN_SECONDS :
            part.motionId.startsWith('planet-') ? PLANET_MIN_SECONDS : MINOR_MIN_SECONDS;
          const previousTime = part.presentationTimeScale ?? 1;
          // Each materialized host can have a different local playback clock.
          // Preserve its category/rank-defined VISUAL duration on the aggregate
          // clock; do not impose the legacy 90-second minimum on V2 minors.
          const minorCadence = base.generatorVersionCode === 2 &&
            part.motionId.startsWith('minor-') && physical !== undefined
              ? previousTime * local.simulation.playbackDaysPerRealSecond / playback
              : null;
          const planetCadence = radialRank !== undefined && physical && base.generatorVersionCode === 2
            ? v2PlanetTimeScale(physical.periodDays, playback, physical.semiMajorAxisAu,
                radialRank, rankedPlanetMotions.length) : null;
          return Object.freeze({ ...part, motionId: namespaced(part.motionId),
            ...(cometVisuals.has(part.motionId)
              ? { presentationEccentricity: cometVisuals.get(part.motionId)!.eccentricity } : {}),
            linearScenePerAu: scales.get(part.motionId) ?? part.linearScenePerAu ?? local.scale.orbitScaleScenePerAu * factor,
            presentationTimeScale: planetCadence ?? minorCadence ?? (physical === undefined ? previousTime : Math.min(previousTime,
              physical.periodDays / (playback * minimum),
              part.motionId.startsWith('moon-') ? systemSceneMoonPresentationTimeScale(physical.periodDays, playback) : 1)),
          });
        })]);
      const star = local.stars[0]!;
      // V2 source radii are already reduced once. Keep frozen V1 presentation.
      const isV2 = formation.parentGenerationKey.generatorVersionCode === 2;
      const starRadius = isV2
        ? Math.max(0.055, Math.min(0.19, star.radiusScene * factor))
        : Math.max(0.075, Math.min(0.24, star.radiusScene * factor));
      stars.push(Object.freeze({ ...star, id: namespaced(star.id), label: source.label,
        title: source.publicStellarDesignation, orbitId: `mh-orbit-star-${source.label.toLowerCase()}`,
        motionContributions: hostAnchor, position: position(hostAnchor), radiusScene: starRadius,
        opticalRadiusScene: Math.max(starRadius, Math.min(isV2 ? 0.235 : 0.3,
          (star.opticalRadiusScene ?? star.radiusScene) * factor)), }));
      for (const orbit of local.orbits) {
        const physical = orbit.motionId === null ? undefined : motionIndex.get(orbit.motionId);
        const linear = orbit.motionId === null ? undefined : scales.get(orbit.motionId);
        const semi = physical && linear !== undefined
          ? physical.semiMajorAxisAu * Math.abs(orbit.motionScale) * linear : orbit.semiMajorScene * factor;
        const cometVisual = orbit.motionId === null ? undefined : cometVisuals.get(orbit.motionId);
        orbits.push(Object.freeze({ ...orbit, id: namespaced(orbit.id),
          label: publicOrbitNames.get(orbit.id) ?? `${source.label} · ${orbit.label}`,
          semiMajorScene: semi,
          semiMinorScene: cometVisual?.semiMinorScene ??
            semi * (orbit.semiMajorScene ? orbit.semiMinorScene / orbit.semiMajorScene : 1),
          focusOffsetScene: cometVisual?.focusOffsetScene ??
            semi * (orbit.semiMajorScene ? orbit.focusOffsetScene / orbit.semiMajorScene : 0),
          ...(cometVisual === undefined ? {} : { presentationEccentricity: cometVisual.eccentricity }),
          motionId: orbit.motionId === null ? null : namespaced(orbit.motionId),
          anchorMotionContributions: partsFor(orbit.anchorMotionContributions),
          linearScenePerAu: linear, postProjectionScale: undefined }));
      }
      for (const planet of local.planets) {
        const parts = partsFor(planet.motionContributions);
        const publicDesignation = publicPlanetNames.get(planet);
        if (publicDesignation === undefined) {
          throw new Error('Projected multihost planet has no canonical public identity.');
        }
        planets.push(Object.freeze({ ...planet, id: namespaced(planet.id), label: publicDesignation,
          title: publicDesignation,
          orbitId: planet.orbitId === null ? null : namespaced(planet.orbitId),
          radiusScene: planet.radiusScene * factor,
          position: position(parts), motionContributions: parts }));
      }
      for (const moon of local.moons) {
        const planetIdentity = formation.publicPlanets.find(entry =>
          entry.host === source.label && entry.sourcePlanetOrdinal === moon.hostPlanetOrdinal);
        if (planetIdentity === undefined) {
          throw new Error('Moon source has no public parent planet in the same stellar host.');
        }
        const parts = partsFor(moon.motionContributions);
        const publicDesignation = publicMoonNames.get(moon.id);
        if (publicDesignation === undefined) {
          throw new Error('Projected multihost moon has no canonical public designation.');
        }
        moons.push(Object.freeze({ ...moon, id: namespaced(moon.id), hostPlanetId: namespaced(moon.hostPlanetId),
          hostPlanetOrdinal: Number(planetIdentity.publicLocator.bodyIndex) + 1,
          label: `${source.label} · ${moon.label}`, title: publicDesignation,
          orbitId: namespaced(moon.orbitId), radiusScene: moon.radiusScene * factor,
          visualPresentation: Object.freeze({ ...moon.visualPresentation,
            presentationRadiusScene: moon.visualPresentation.presentationRadiusScene * factor }),
          position: position(parts), motionContributions: parts }));
      }
      for (const minor of local.minorBodies) {
        const parts = partsFor(minor.motionContributions);
        minorBodies.push(Object.freeze({ ...minor, id: namespaced(minor.id), label: `${source.label} · ${minor.label}`,
          title: `${source.label} · ${minor.title}`, orbitId: namespaced(minor.orbitId),
          radiusScene: minor.radiusScene * factor, position: position(parts), motionContributions: parts,
          cometPresentation: minor.cometPresentation === null ? null : Object.freeze({
            ...minor.cometPresentation,
            presentationTimeScale: parts.at(-1)!.presentationTimeScale ?? 1,
            ...(parts.at(-1)!.presentationCometPhaseWarp === undefined ? {} :
              { presentationCometPhaseWarp: parts.at(-1)!.presentationCometPhaseWarp }),
          }), }));
      }
      for (const zone of local.habitableZones ?? (local.habitableZone ? [local.habitableZone] : [])) {
        zones.push(Object.freeze({ ...zone,
          radiativeInnerRadiusScene: zone.radiativeInnerRadiusScene * factor,
          radiativeOuterRadiusScene: zone.radiativeOuterRadiusScene * factor,
          dynamicallyHabitableInnerRadiusScene: zone.dynamicallyHabitableInnerRadiusScene === null ? null :
            zone.dynamicallyHabitableInnerRadiusScene * factor,
          dynamicallyHabitableOuterRadiusScene: zone.dynamicallyHabitableOuterRadiusScene === null ? null :
            zone.dynamicallyHabitableOuterRadiusScene * factor,
          anchorMotionContributions: hostAnchor }));
      }
      for (const belt of local.asteroidBelts ?? []) {
        belts.push(Object.freeze({ ...belt, id: namespaced(belt.id), label: `${source.label} · ${belt.label}`,
          innerRadiusScene: belt.innerRadiusScene * factor,
          outerRadiusScene: belt.outerRadiusScene * factor,
          peakRadiusScene: belt.peakRadiusScene === null ? null : belt.peakRadiusScene * factor,
          anchorMotionContributions: partsFor(belt.anchorMotionContributions) }));
      }
      for (const risk of local.orbitalRiskTargets) {
        risks.push(Object.freeze({ ...risk, id: namespaced(risk.id), targetBodyId: namespaced(risk.targetBodyId),
          targetOrbitId: namespaced(risk.targetOrbitId), targetLabel: `${source.label} · ${risk.targetLabel}` }));
      }
    }
    const crossing = risks.filter(r => r.severity === 'CROSSING');
    const available = risks.filter(r => r.severity !== 'CROSSING');
    const composite: SystemSceneSnapshot = Object.freeze({ ...base,
      proceduralIdentity: base.proceduralIdentity,
      title: `${base.title} · ${c ? 'triple jerárquico' : 'binario'} multihost`,
      multiplicityName: c ? 'TRIPLE' : 'BINARY', componentCount: formation.components.length,
      accessibleLabel: `${base.accessibleLabel} ${formation.components.length} sistemas simples completos ligados por órbitas estelares jerárquicas.`,
      stars: Object.freeze(stars), planets: Object.freeze(planets), moons: Object.freeze(moons),
      minorBodies: Object.freeze(minorBodies), asteroidBelts: Object.freeze(belts),
      habitableZone: zones[0] ?? null, habitableZones: Object.freeze(zones),
      hostVisualEnvelope: null, multistellarPresentation: null, multistellarPTypeClearance: null,
      multistellarCoreCompaction: null, stellarOrbitClearance: null, firstOrbitAnchor: null,
      orbitalRiskTargets: Object.freeze(risks),
      layers: Object.freeze({ moonCount: moons.length, minorBodyCount: minorBodies.length,
        habitableZoneAvailable: zones.length > 0, orbitalRiskTargetCount: available.length,
        orbitalCrossingTargetCount: crossing.length,
        orbitalApproachTargetCount: available.filter(r => r.severity === 'APPROACH').length,
        orbitalCollisionGeometryTargetCount: available.filter(r => r.severity === 'COLLISION_GEOMETRY').length }),
      orbits: Object.freeze(orbits), motions: Object.freeze(motions),
      simulation: Object.freeze({ epochSimulationDay: 0, playbackDaysPerRealSecond: playback }), scale });
    const final = appendSystemSceneMultihostCircumbinary(
      composite, formation, innerScale, Object.freeze([...outerAB]), materialized.publicSystemDesignation,
    );
    const bindings = formation.publicPlanets.map(entry => {
      const bodyId = entry.host === 'AB' ? `mh-p-planet-${entry.sourcePlanetOrdinal}` :
        `mh-${entry.host.toLowerCase()}-planet-${entry.sourcePlanetOrdinal}`;
      const body = final.planets.find(planet => planet.id === bodyId);
      if (!body || final.planets.filter(planet => planet.id === bodyId).length !== 1) {
        throw new Error(`Missing or duplicated rendered public planet ${entry.publicLocator.bodyIndex}.`);
      }
      return Object.freeze({ publicLocator: entry.publicLocator, host: entry.host, sceneBodyId: bodyId });
    });
    if (bindings.length !== final.planets.length || final.moons.length !==
        formation.publicPlanets.reduce((count, p) => count + p.moonSystem.relevantMoonCount, 0)) {
      throw new Error('Multihost composition does not cover the exact generated planet/moon population.');
    }
    // Stage 8: public scientific routes are keyed by the *generated* catalogue,
    // never by the source planet's ordinal or a renderer-only id suffix.
    const planetRoutes = Object.freeze(bindings.map(binding => Object.freeze({
      sceneBodyId: binding.sceneBodyId, bodyIndex: binding.publicLocator.bodyIndex.toString(),
    })));
    const moonRoutes = Object.freeze(StellarMultihostPublicTargetIndex.build(formation).moons
      .filter(moon => moon.relevantMoon !== null).map(moon => {
        const planet = formation.publicPlanets[Number(moon.publicLocator.bodyIndex)]!;
        const parentId = planet.host === 'AB'
          ? `mh-p-planet-${planet.sourcePlanetOrdinal}`
          : `mh-${planet.host.toLowerCase()}-planet-${planet.sourcePlanetOrdinal}`;
        const moonId = planet.host === 'AB'
          ? `mh-p-moon-${planet.sourcePlanetOrdinal}-${moon.sourceIdentity.moonOrdinal}`
          : `mh-${planet.host.toLowerCase()}-moon-${planet.sourcePlanetOrdinal}-${moon.sourceIdentity.moonOrdinal}`;
        if (final.moons.filter(body => body.id === moonId && body.hostPlanetId === parentId).length !== 1) {
          throw new Error('A public moon is absent from its exact rendered host planet.');
        }
        return Object.freeze({ sceneBodyId: moonId,
          bodyIndex: moon.publicLocator.bodyIndex.toString(),
          moonIndex: moon.publicLocator.moonIndex.toString() });
      }));
    if (new Set(planetRoutes.map(route => route.sceneBodyId)).size !== planetRoutes.length ||
        new Set(moonRoutes.map(route => route.sceneBodyId)).size !== moonRoutes.length ||
        moonRoutes.length !== final.moons.length) {
      throw new Error('Multihost scientific route bindings are incomplete or duplicated.');
    }
    const routedSnapshot = Object.freeze({ ...final,
      scientificPlanetBindings: planetRoutes, scientificMoonBindings: moonRoutes });
    assertSystemSceneProjectionSnapshot(routedSnapshot);
    return Object.freeze({ snapshot: routedSnapshot, planetBindings: Object.freeze(bindings) });
  }
}
