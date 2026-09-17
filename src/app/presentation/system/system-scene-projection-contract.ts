import { projectSystemSceneMotionContributions } from './system-scene-motion-projection';
import { buildSystemSceneMinorBodyOrbitPresentationV1 } from './system-scene-minor-body-orbit-v1';
import { systemSceneMultihostProjectedRadiusV22 } from './system-scene-multihost-radial-projection';
import {
  type SystemSceneBodySnapshot,
  type SystemSceneMinorBodySnapshot,
  type SystemSceneMoonSnapshot,
  type SystemSceneMotionContributionSnapshot,
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

import {
  systemSceneProjectedRadiusAuInSpace,
} from './system-scene-scale-projection';

export const SYSTEM_SCENE_PROJECTION_AUTHORITY =
  Object.freeze({
    authoritativePhysicsSource:
      'DOMAIN_SNAPSHOT' as const,
    sceneRole:
      'READ_ONLY_VISUAL_PROJECTION' as const,
    allowsPhysicsWriteBack:
      false as const,
    allowsGroundTruthMutation:
      false as const,
  });

type SystemSceneBodyProjectionSnapshot =
  | SystemSceneBodySnapshot
  | SystemSceneMoonSnapshot
  | SystemSceneMinorBodySnapshot;

/**
 * Point-24.10 runtime boundary for the real Three.js renderer.
 *
 * SystemScene accepts only the immutable projection assembled before Three.js
 * is entered. This deliberately fails fast if a future caller tries to hand
 * the renderer a mutable physics/state object and therefore makes accidental
 * scene -> domain authority creep observable in tests instead of silently
 * permitting it.
 */
export function assertSystemSceneProjectionSnapshot(
  snapshot:
    SystemSceneSnapshot,
): void {

  assertFrozen(
    snapshot,
    'snapshot',
  );
  assertFrozen(
    snapshot.address,
    'snapshot.address',
  );

  // V2.2's scientific formation aggregate is opt-in and immutable. Its
  // planet identities must be separate from the frozen V1 snapshot identities.
  const formedV22 = snapshot.formedMultihostSystemV22;
  if (formedV22 !== undefined) {
    assertFrozen(formedV22, 'snapshot.formedMultihostSystemV22');
    assertFrozenArray(formedV22.planets, 'snapshot.formedMultihostSystemV22.planets',
      (planet, label) => {
        assertFrozen(planet, label);
        if (planet.origin !== 'V2_2_FORMED' ||
            !(planet.periapsisAu > 0 && planet.periapsisAu < planet.apoapsisAu) ||
            !(planet.massEarth > 0)) {
          throw new RangeError(`${label}: invalid V2.2 formed body.`);
        }
      });
    assertFrozenArray(formedV22.disks, 'snapshot.formedMultihostSystemV22.disks',
      (disk, label) => {
        assertFrozen(disk, label);
        assertFrozenArray(disk.planets, `${label}.planets`, assertFrozen);
      });
    const formedIds = new Set(formedV22.planets.map(planet => planet.id));
    if (snapshot.planets.some(planet => planet.id.startsWith('preview-')) ||
        snapshot.planets.some(planet => planet.id.startsWith('v22-') &&
          !formedIds.has(planet.id))) {
      throw new RangeError('V2.2 renderer cannot mix V2.1 test particles or foreign formation identities.');
    }
    const motions = new Map(snapshot.motions.map(motion => [motion.id, motion]));
    const orbits = new Map(snapshot.orbits.map(orbit => [orbit.id, orbit]));
    const renderedPlanets = new Map(snapshot.planets.map(planet => [planet.id, planet]));
    for (const planet of snapshot.planets.filter(body => formedIds.has(body.id))) {
      const host = planet.multihostOrbitV221;
      const orbit = planet.orbitId === null ? undefined : orbits.get(planet.orbitId);
      const motion = host === undefined ? undefined : motions.get(host.motionId);
      const local = host === undefined ? undefined : planet.motionContributions.find(
        contribution => contribution.motionId === host.motionId);
      if (host === undefined || !Object.isFrozen(host) ||
          !formedV22.planets.some(candidate => candidate.id === planet.id &&
            candidate.hostId === host.hostId && candidate.periodDays === host.orbitalPeriodDays) ||
          host.translationState !== 'ACTIVE' ||
          !(host.orbitalPeriodDays > 0) || motion === undefined ||
          orbit === undefined || orbit.kind !== 'planetary' ||
          orbit.motionId !== host.motionId || !(orbit.semiMajorScene > 0) ||
          local === undefined || !(local.presentationTimeScale !== undefined &&
          local.presentationTimeScale > 0) ||
          planet.motionContributions.length < (host.hostId === 'ABC' ? 1 :
            host.hostId === 'AB' && snapshot.multiplicityName === 'BINARY' ? 1 : 2)) {
        throw new RangeError(`V2.2.1 ${planet.id}: no rendered planet without host, orbit guide and live translation.`);
      }
      // A radial mapping that exists only on the body (not the guide) created
      // the apparent orbitless / free-floating worlds reported in V2.2.
      if (local.hostRadialProjectionV22 !== orbit.hostRadialProjectionV22) {
        throw new RangeError(`V2.2.1 ${planet.id}: orbit and translation must share one radial projection.`);
      }
      const later = projectSystemSceneMotionContributions(
        planet.motionContributions, id => motions.get(id),
        snapshot.simulation.epochSimulationDay +
          15 * snapshot.simulation.playbackDaysPerRealSecond, snapshot.scale);
      const moved = Math.hypot(later.x - planet.position.x,
        later.y - planet.position.y, later.z - planet.position.z);
      if (!(Number.isFinite(moved) && moved > 1e-7)) {
        throw new RangeError(`V2.2.1 ${planet.id}: planet must actually translate in the laboratory.`);
      }
    }
    for (const moon of snapshot.moons.filter(item => item.previewOnlyV221 === true)) {
      if (!renderedPlanets.has(moon.hostPlanetId) || !/\-moon-qa(?:-[12])?$/.test(moon.id) ||
          moon.spin.source !== 'V2_2_1_LAB_MOON' ||
          moon.orbitId === null || !orbits.has(moon.orbitId) ||
          moon.motionContributions.length !==
            renderedPlanets.get(moon.hostPlanetId)!.motionContributions.length + 1) {
        throw new RangeError('V2.2.1 moon proxy must be explicitly QA and orbit a visible V2 planet.');
      }
    }
    // V2.4.2: all A/B moons must be traceable to their immutable scientific
    // record and moving visible planet. The renderer cannot mint QA satellites
    // or modify a physical Roche/Hill-bounded orbit when limiting GPU draw count.
    const scienceMoons = snapshot.scientificMultihostMoonsV242;
    if (scienceMoons !== undefined) {
      if (snapshot.multiplicityName !== 'BINARY' ||
          snapshot.scientificMultihostPlanetsV241 === undefined ||
          scienceMoons.sourceSystemSeed !== formedV22.sourceSystemSeed ||
          scienceMoons.version !== 'V2_4_2_MOON_SCIENCE') {
        throw new RangeError('V2.4.2 scientific moon catalogue belongs only to the matching binary S-type laboratory.');
      }
      assertFrozen(scienceMoons, 'snapshot.scientificMultihostMoonsV242');
      assertFrozenArray(scienceMoons.moons, 'snapshot.scientificMultihostMoonsV242.moons', assertFrozen);
      assertFrozenArray(scienceMoons.systems, 'snapshot.scientificMultihostMoonsV242.systems', assertFrozen);
      const modelIds = new Set(scienceMoons.moons.map(moon => moon.id));
      if (modelIds.size !== scienceMoons.moons.length ||
          scienceMoons.moons.some(moon =>
            moon.version !== 'V2_4_2_S_TYPE_MOON' ||
            moon.origin !== 'V2_4_2_DETERMINISTIC_SATELLITE_MODEL' ||
            !(moon.massEarth > 0 && moon.periodDays > 0) ||
            moon.semiMajorAxisPlanetRadii * (1 - moon.eccentricity) <= moon.rocheLimitPlanetRadii ||
            moon.semiMajorAxisPlanetRadii * (1 + moon.eccentricity) >= moon.progradeOuterLimitPlanetRadii ||
            !formedV22.planets.some(parent => parent.id === moon.hostPlanetId &&
              parent.hostId === moon.hostId && parent.ordinal === moon.hostPlanetOrdinal)) ||
          scienceMoons.systems.some(system =>
            system.modeledMoonCount !== system.moons.length ||
            !Number.isInteger(system.estimatedTotalMoonCount) ||
            system.estimatedTotalMoonCount < system.modeledMoonCount ||
            system.moons.some(moon => moon.hostPlanetId !== system.hostPlanetId ||
              !modelIds.has(moon.id)))) {
        throw new RangeError('V2.4.2 moon catalogue violates physical bounds or parent identity.');
      }
      for (const moon of snapshot.moons.filter(item => item.scientificV242 === true)) {
        const physical = scienceMoons.moons.find(item => item.id === moon.id);
        const parent = renderedPlanets.get(moon.hostPlanetId);
        const guide = orbits.get(moon.orbitId);
        const local = moon.motionContributions.at(-1);
        const motion = local === undefined ? undefined : motions.get(local.motionId);
        if (physical === undefined || parent === undefined || guide?.kind !== 'moon' ||
            moon.previewOnlyV221 || moon.spin.source !== 'V2_4_2_SCIENTIFIC_MOON' ||
            guide.motionId !== local?.motionId || guide.anchorMotionContributions !== parent.motionContributions ||
            local?.linearScenePerAu === undefined || !(local.linearScenePerAu > 0) ||
            motion?.periodDays !== physical.periodDays ||
            motion.semiMajorAxisAu !== physical.semiMajorAxisAu ||
            moon.motionContributions.length !== parent.motionContributions.length + 1 ||
            !parent.motionContributions.every((part, index) => part === moon.motionContributions[index]) ||
            moon.visualPresentation.sourceMoonIdentity !== physical.formationSeedHex ||
            moon.visualPresentation.sourceMassEarth !== physical.massEarth ||
            moon.visualPresentation.sourceRadiusEarth !== physical.radiusEarth) {
          throw new RangeError(`V2.4.2 ${moon.id}: renderer has a moon without valid scientific source or planet-relative orbit.`);
        }
      }
      if (snapshot.moons.some(moon => moon.previewOnlyV221 === true) ||
          snapshot.moons.some(moon => moon.scientificV242 !== true)) {
        throw new RangeError('V2.4.2 binary laboratory must not mix legacy QA or barycentric V1 moon entities.');
      }
    }
    // V2.4.3 scientific host-local minor bodies supersede V2.3 QA only in
    // binary laboratory snapshots; never manufacture V1 persisted identities.
    const minorScience = snapshot.scientificMultihostMinorBodiesV243;
    if (minorScience !== undefined) {
      if (snapshot.multiplicityName !== 'BINARY' ||
          minorScience.sourceSystemSeed !== formedV22.sourceSystemSeed ||
          minorScience.version !== 'V2_4_3_MINOR_BODY_SCIENCE' ||
          snapshot.minorBodies.some(body => body.scientificV243 !== true || body.previewOnlyV23 === true) ||
          (snapshot.asteroidBelts ?? []).some(belt => belt.scientificV243 !== true || belt.previewOnlyV23 === true)) {
        throw new RangeError('V2.4.3 refuses mixed QA/V1 small bodies in the scientific binary laboratory.');
      }
      assertFrozen(minorScience, 'snapshot.scientificMultihostMinorBodiesV243');
      assertFrozenArray(minorScience.hosts, 'snapshot.scientificMultihostMinorBodiesV243.hosts', assertFrozen);
      assertFrozenArray(minorScience.belts, 'snapshot.scientificMultihostMinorBodiesV243.belts', assertFrozen);
      assertFrozenArray(minorScience.bodies, 'snapshot.scientificMultihostMinorBodiesV243.bodies', assertFrozen);
      const ids = new Set([...minorScience.belts, ...minorScience.bodies].map(item => item.id));
      if (ids.size !== minorScience.belts.length + minorScience.bodies.length ||
          minorScience.hosts.some(inventory => inventory.allocatedBeltMassEarth +
            inventory.allocatedCometReservoirEarth > inventory.remainingSolidsEarth * (1 + 1e-9) ||
            inventory.modeledAsteroidMassEarth > inventory.allocatedBeltMassEarth * (1 + 1e-9) ||
            inventory.modeledCometMassEarth > inventory.allocatedCometReservoirEarth * (1 + 1e-9) ||
            (inventory.cometReservoir === null && (inventory.allocatedCometReservoirEarth !== 0 ||
              inventory.bodies.some(body => body.kind === 'COMET'))) ||
            (inventory.cometReservoir !== null && (
              inventory.cometReservoir.hostId !== inventory.hostId ||
              inventory.cometReservoir.innerEdgeAu <= inventory.cometReservoir.snowLineAu ||
              inventory.cometReservoir.innerEdgeAu >= inventory.cometReservoir.outerEdgeAu))) ||
          minorScience.bodies.some(body => {
            const disk = formedV22.disks.find(value => value.hostId === body.hostId);
            const outer = disk === undefined ? 0 : Math.min(disk.window.referenceOuterAu,
              disk.window.outerStableAu ?? disk.window.referenceOuterAu);
            return body.version !== 'V2_4_3_S_TYPE_MINOR_BODY' ||
              body.source !== 'V2_4_3_DETERMINISTIC_RESIDUAL_FORMATION' ||
              disk === undefined || body.periapsisAu <= disk.window.innerStableAu ||
              body.apoapsisAu >= outer || !(body.massEarth > 0 && body.periodDays > 0) ||
              (body.kind === 'ASTEROID'
                ? disk.planets.some(planet => body.periapsisAu <= planet.apoapsisAu &&
                    body.apoapsisAu >= planet.periapsisAu) || body.cometOrbitClass !== undefined
                : (() => {
                    const host = minorScience.hosts.find(value => value.hostId === body.hostId);
                    const reservoir = host?.cometReservoir;
                    const crossing = disk.planets.some(planet =>
                      body.periapsisAu <= planet.apoapsisAu && body.apoapsisAu >= planet.periapsisAu);
                    return reservoir === undefined || reservoir === null ||
                      body.cometReservoirId !== reservoir.id ||
                      body.apoapsisAu <= reservoir.innerEdgeAu ||
                      body.apoapsisAu >= reservoir.outerEdgeAu ||
                      body.crossesPlanetaryRadialEnvelope !== crossing ||
                      (body.cometOrbitClass === 'RESERVOIR_BOUND'
                        ? crossing || body.periapsisAu <= reservoir.snowLineAu
                        : body.cometOrbitClass !== 'INBOUND_VISITOR' || !crossing ||
                          body.periapsisAu >= reservoir.innerEdgeAu);
                  })());
          })) {
        throw new RangeError('V2.4.3 scientific small-body provenance, bounds or mass budgets invalid.');
      }
      const physicalBodies = new Map(minorScience.bodies.map(body => [body.id, body]));
      const physicalBelts = new Map(minorScience.belts.map(belt => [belt.id, belt]));
      for (const body of snapshot.minorBodies) {
        const record = physicalBodies.get(body.id);
        const star = snapshot.stars.find(item => item.label === body.hostIdV243);
        const orbit = orbits.get(body.orbitId);
        const local = body.motionContributions.at(-1);
        const motion = local === undefined ? undefined : motions.get(local.motionId);
        const asteroid = record?.kind === 'ASTEROID';
        if (record === undefined || star === undefined ||
            record.hostId !== body.hostIdV243 || orbit?.kind !== 'minor-body' ||
            orbit.anchorMotionContributions !== star.motionContributions ||
            orbit.motionId !== local?.motionId || motion === undefined ||
            motion.semiMajorAxisAu !== record.semiMajorAxisAu ||
            motion.periodDays !== record.periodDays ||
            orbit.hostRadialProjectionV22 !== local?.hostRadialProjectionV22 ||
            (asteroid
              ? local?.hostRadialProjectionV22 === undefined || local.linearScenePerAu !== undefined
              : (() => {
                  const spec = snapshot.orbits.find(candidate =>
                    candidate.kind === 'planetary' &&
                    snapshot.planets.some(planet => planet.orbitId === candidate.id &&
                      planet.multihostOrbitV221?.hostId === record.hostId))?.hostRadialProjectionV22;
                  if (spec === undefined || local?.linearScenePerAu === undefined ||
                      orbit.linearScenePerAu !== local.linearScenePerAu ||
                      local.hostRadialProjectionV22 !== undefined ||
                      orbit.hostRadialProjectionV22 !== undefined ||
                      motion.longitudeAscendingNodeDegrees !== record.longitudeAscendingNodeDegrees ||
                      motion.argumentOfPeriapsisDegrees !== record.argumentOfPeriapsisDegrees) return true;
                  const ellipse = buildSystemSceneMinorBodyOrbitPresentationV1({
                    semiMajorAxisAu: record.semiMajorAxisAu,
                    eccentricity: record.eccentricity,
                    projectedSemiMajorScene: systemSceneMultihostProjectedRadiusV22(
                      record.semiMajorAxisAu, spec),
                    maximumVisibleStarRadiusScene: Math.max(
                      star.radiusScene, star.opticalRadiusScene ?? star.radiusScene),
                  });
                  return Math.abs(orbit.semiMajorScene - ellipse.semiMajorScene) > 1e-9 ||
                    Math.abs(orbit.semiMinorScene - ellipse.semiMinorScene) > 1e-9 ||
                    Math.abs(orbit.focusOffsetScene - ellipse.focusOffsetScene) > 1e-9 ||
                    Math.abs(local.linearScenePerAu -
                      ellipse.semiMajorScene / record.semiMajorAxisAu) > 1e-9;
                })()) ||
            body.motionContributions.length !== star.motionContributions.length + 1 ||
            !star.motionContributions.every((part, index) => part === body.motionContributions[index]) ||
            (asteroid ? body.asteroidPresentation?.source !== 'V2_4_3_SCIENTIFIC_REFERENCE' ||
                body.cometPresentation !== null :
                body.cometPresentation?.source !== 'V2_4_3_SCIENTIFIC_REFERENCE' ||
                body.asteroidPresentation !== null)) {
          throw new RangeError(`V2.4.3 ${body.id}: visible minor body lacks scientific identity, host or motion.`);
        }
      }
      for (const belt of snapshot.asteroidBelts ?? []) {
        const record = physicalBelts.get(belt.id);
        const star = snapshot.stars.find(item => item.label === belt.hostIdV243);
        if (record === undefined || star === undefined ||
            record.hostId !== belt.hostIdV243 ||
            belt.anchorMotionContributions !== star.motionContributions ||
            belt.innerEdgeAu !== record.innerEdgeAu || belt.outerEdgeAu !== record.outerEdgeAu ||
            belt.peakAu !== record.peakAu ||
            !(belt.innerRadiusScene > 0 && belt.innerRadiusScene < belt.peakRadiusScene! &&
              belt.peakRadiusScene! < belt.outerRadiusScene)) {
          throw new RangeError(`V2.4.3 ${belt.id}: visible belt lacks scientific identity or host.`);
        }
      }
    }

    // V2.3 experimental inventory must never masquerade as persisted V1
    // small bodies: every object follows one explicit stellar host and guide.
    if (snapshot.multiplicityName === 'BINARY') {
      if (snapshot.layers.minorBodyCount !== snapshot.minorBodies.length) {
        throw new RangeError('V2.3 minor-body layer count must equal its visible inventory.');
      }
      for (const body of snapshot.minorBodies.filter(item => item.previewOnlyV23)) {
        const star = snapshot.stars.find(item => item.label === body.hostIdV23);
        const orbit = orbits.get(body.orbitId);
        const local = body.motionContributions.at(-1);
        const motion = local === undefined ? undefined : motions.get(local.motionId);
        const asteroid = body.minorBodyKind.name === 'ASTEROID';
        if (star === undefined || orbit?.kind !== 'minor-body' ||
            orbit.anchorMotionContributions !== star.motionContributions ||
            local === undefined || motion === undefined || !(motion.periodDays > 0) ||
            orbit.motionId !== local.motionId ||
            orbit.hostRadialProjectionV22 !== local.hostRadialProjectionV22 ||
            body.motionContributions.length !== star.motionContributions.length + 1 ||
            !star.motionContributions.every((item, i) => body.motionContributions[i] === item) ||
            (asteroid ? body.asteroidPresentation?.source !== 'V2_3_EXPERIMENTAL' ||
                body.cometPresentation !== null :
                body.cometPresentation?.source !== 'V2_3_EXPERIMENTAL' ||
                body.asteroidPresentation !== null)) {
          throw new RangeError(`V2.3 ${body.id}: small body has no valid experimental provenance, stellar host or orbit.`);
        }
      }
      for (const belt of (snapshot.asteroidBelts ?? []).filter(item => item.previewOnlyV23)) {
        const star = snapshot.stars.find(item => item.label ===
          (belt.id.includes('-A-belt') ? 'A' : belt.id.includes('-B-belt') ? 'B' : 'NONE'));
        if (star === undefined || belt.anchorMotionContributions !== star.motionContributions ||
            !(belt.innerEdgeAu > 0 && belt.innerEdgeAu < belt.peakAu! &&
              belt.peakAu! < belt.outerEdgeAu && belt.innerRadiusScene > 0 &&
              belt.innerRadiusScene < belt.peakRadiusScene! &&
              belt.peakRadiusScene! < belt.outerRadiusScene)) {
          throw new RangeError(`V2.3 ${belt.id}: invalid experimental circumstellar belt.`);
        }
      }
    }
    if (snapshot.layers.moonCount !== snapshot.moons.length) {
      throw new RangeError('V2.2.1 moon layer count must match visible V1 and QA moons.');
    }
  }

  assertFrozenArray(
    snapshot.stars,
    'snapshot.stars',
    assertBodyProjection,
  );
  assertFrozenArray(
    snapshot.planets,
    'snapshot.planets',
    assertBodyProjection,
  );
  assertFrozenArray(
    snapshot.moons,
    'snapshot.moons',
    assertBodyProjection,
  );
  assertFrozenArray(
    snapshot.minorBodies,
    'snapshot.minorBodies',
    assertBodyProjection,
  );

  if (
    snapshot.asteroidBelts !==
      undefined
  ) {
    assertFrozenArray(
      snapshot.asteroidBelts,
      'snapshot.asteroidBelts',
      (
        belt,
        label,
      ) => {
        assertFrozen(
          belt,
          label,
        );
        assertMotionContributions(
          belt.anchorMotionContributions,
          `${label}.anchorMotionContributions`,
        );
      },
    );
  }

  assertFrozenArray(
    snapshot.orbits,
    'snapshot.orbits',
    (
      orbit,
      label,
    ) => {
      assertFrozen(
        orbit,
        label,
      );
      assertMotionContributions(
        orbit.anchorMotionContributions,
        `${label}.anchorMotionContributions`,
      );

      if (
        orbit.postProjectionScale !==
          undefined &&
        (
          !Number.isFinite(
            orbit.postProjectionScale,
          ) ||
          orbit.postProjectionScale <=
            0
        )
      ) {
        throw new RangeError(
          `${label}.postProjectionScale must be finite and > 0.`,
        );
      }
    },
  );

  assertFrozenArray(
    snapshot.motions,
    'snapshot.motions',
    (
      motion,
      label,
    ) => {
      assertFrozen(
        motion,
        label,
      );
    },
  );

  assertFrozenArray(
    snapshot.orbitalRiskTargets,
    'snapshot.orbitalRiskTargets',
    (
      target,
      label,
    ) => {
      assertFrozen(
        target,
        label,
      );
    },
  );

  assertFrozen(
    snapshot.layers,
    'snapshot.layers',
  );
  assertFrozen(
    snapshot.simulation,
    'snapshot.simulation',
  );
  assertFrozen(
    snapshot.scale,
    'snapshot.scale',
  );

  if (
    snapshot.hostVisualEnvelope !==
      undefined &&
    snapshot.hostVisualEnvelope !==
      null
  ) {
    assertFrozen(
      snapshot.hostVisualEnvelope,
      'snapshot.hostVisualEnvelope',
    );
    assertFrozenArray(
      snapshot.hostVisualEnvelope.stars,
      'snapshot.hostVisualEnvelope.stars',
      (
        star,
        label,
      ) => {
        assertFrozen(
          star,
          label,
        );
      },
    );
  }

  if (
    snapshot.multistellarPresentation !==
      undefined &&
    snapshot.multistellarPresentation !==
      null
  ) {
    assertFrozen(
      snapshot.multistellarPresentation,
      'snapshot.multistellarPresentation',
    );
    assertFrozenArray(
      snapshot.multistellarPresentation.stars,
      'snapshot.multistellarPresentation.stars',
      (
        star,
        label,
      ) => {
        assertFrozen(
          star,
          label,
        );
      },
    );

    const primary =
      snapshot.multistellarPresentation.stars.find(
        star =>
          star.label ===
          'A',
      );
    const secondary =
      snapshot.multistellarPresentation.stars.find(
        star =>
          star.label ===
          'B',
      );

    if (
      primary ===
        undefined ||
      secondary ===
        undefined ||
      primary.radiusScene +
        secondary.radiusScene >
        snapshot.multistellarPresentation
          .innerPairMinimumCenterSeparationScene +
          1e-9
    ) {
      throw new RangeError(
        'SystemScene V4 multistellar photospheres must remain separated at the inner-pair periapsis.',
      );
    }

    if (
      snapshot.multistellarPresentation
        .architecture ===
        'TRIPLE'
    ) {
      const tertiary =
        snapshot.multistellarPresentation.stars.find(
          star =>
            star.label ===
            'C',
        );

      const tertiaryMinimumSeparation =
        snapshot.multistellarPresentation
          .tertiaryMinimumCenterSeparationToInnerStarScene;

      if (
        tertiary ===
          undefined ||
        tertiaryMinimumSeparation ===
          null ||
        Math.max(
          primary.radiusScene,
          secondary.radiusScene,
        ) +
          tertiary.radiusScene >
          tertiaryMinimumSeparation +
            1e-9
      ) {
        throw new RangeError(
          'SystemScene V4 tertiary photosphere must remain separated from the inner stellar pair.',
        );
      }
    }
  }

  if (
    snapshot.multistellarPTypeClearance !==
      undefined &&
    snapshot.multistellarPTypeClearance !==
      null
  ) {
    const pTypeClearance =
      snapshot.multistellarPTypeClearance;

    assertFrozen(
      pTypeClearance,
      'snapshot.multistellarPTypeClearance',
    );

    if (
      !Number.isFinite(
        pTypeClearance.innerPairPresentationScale,
      ) ||
      pTypeClearance.innerPairPresentationScale <=
        0 ||
      pTypeClearance.innerPairPresentationScale >
        1 +
          1e-9
    ) {
      throw new RangeError(
        'SystemScene V5.1 inner-pair presentation scale must be finite in (0, 1].',
      );
    }

    if (
      pTypeClearance.presentationCompressed !==
      (
        pTypeClearance.innerPairPresentationScale <
        1 -
          1e-9
      )
    ) {
      throw new RangeError(
        'SystemScene V5.1 compression flag must match its inner-pair presentation scale.',
      );
    }

    if (
      pTypeClearance.targetStellarCenterEnvelopeScene !==
        null &&
      pTypeClearance.uncompressedStellarCenterEnvelopeScene *
        pTypeClearance.innerPairPresentationScale >
        pTypeClearance.targetStellarCenterEnvelopeScene +
          1e-8
    ) {
      throw new RangeError(
        'SystemScene V5.1 compressed stellar-centre envelope must remain inside its reserved P-type presentation core.',
      );
    }

    if (
      pTypeClearance.consistencyRegime ===
        'CONSISTENT' &&
      (
        pTypeClearance.circumbinaryStabilityInnerEdgeAu ===
          null ||
        pTypeClearance.stellarOuterExcursionAu >=
          pTypeClearance.circumbinaryStabilityInnerEdgeAu -
            1e-9 ||
        (
          pTypeClearance.nearestPlanetPeriapsisAu !==
            null &&
          pTypeClearance.nearestPlanetPeriapsisAu <
            pTypeClearance.circumbinaryStabilityInnerEdgeAu -
              1e-9
        )
      )
    ) {
      throw new RangeError(
        'SystemScene V5.1 CONSISTENT P-type diagnostics must preserve the authoritative AU ordering before presentation compaction.',
      );
    }
  }

  if (
    snapshot.multistellarCoreCompaction !==
      undefined &&
    snapshot.multistellarCoreCompaction !==
      null
  ) {
    const coreCompaction =
      snapshot.multistellarCoreCompaction;

    assertFrozen(
      coreCompaction,
      'snapshot.multistellarCoreCompaction',
    );

    if (
      !Number.isFinite(
        coreCompaction.postProjectionScale,
      ) ||
      coreCompaction.postProjectionScale <=
        0 ||
      coreCompaction.postProjectionScale >
        1 +
          1e-9
    ) {
      throw new RangeError(
        'SystemScene V5.2 post-projection core scale must be finite in (0, 1].',
      );
    }

    if (
      coreCompaction.compressedStellarCenterEnvelopeScene >
        coreCompaction.uncompressedStellarCenterEnvelopeScene +
          1e-9
    ) {
      throw new RangeError(
        'SystemScene V5.2 compressed stellar-centre envelope cannot exceed its uncompressed envelope.',
      );
    }

    if (
      coreCompaction.targetStellarCenterEnvelopeScene !==
        null &&
      (
        !coreCompaction.targetSatisfied ||
        coreCompaction.compressedStellarCenterEnvelopeScene >
          coreCompaction.targetStellarCenterEnvelopeScene +
            1e-8
      )
    ) {
      throw new RangeError(
        'SystemScene V5.2 post-projection stellar core must satisfy the reserved P-type presentation target.',
      );
    }

    if (
      snapshot.multistellarPTypeClearance !==
        undefined &&
      snapshot.multistellarPTypeClearance !==
        null &&
      Math.abs(
        coreCompaction.postProjectionScale -
          snapshot.multistellarPTypeClearance
            .innerPairPresentationScale,
      ) >
        1e-9
    ) {
      throw new RangeError(
        'SystemScene V5.2 post-projection scale must match the V5.1 requested scene-space compaction ratio.',
      );
    }
  }

  // V5.3: validate the immutable *final* projection, not merely a proposed
  // scale factor. The same first-periapsis anchor must reach the actual radial
  // projector used by orbital guides, planet motion, HZ and asteroid belts.
  const firstOrbitAnchor = snapshot.firstOrbitAnchor;
  if (firstOrbitAnchor !== undefined && firstOrbitAnchor !== null) {
    assertFrozen(firstOrbitAnchor, 'snapshot.firstOrbitAnchor');
    if (
      firstOrbitAnchor.applied &&
      firstOrbitAnchor.anchoredPeriapsisScene <=
        firstOrbitAnchor.originalPeriapsisScene
    ) {
      throw new RangeError('SystemScene V5.3 must expand an applied first-orbit anchor.');
    }
    const projectedFirst = systemSceneProjectedRadiusAuInSpace(
      firstOrbitAnchor.nearestPeriapsisAu,
      snapshot.scale,
      firstOrbitAnchor.projectionSpace,
    );
    if (Math.abs(projectedFirst - firstOrbitAnchor.anchoredPeriapsisScene) > 1e-8) {
      throw new RangeError('SystemScene V5.3 first-orbit anchor is not applied to the final radial projector.');
    }
    const v5 = snapshot.stellarOrbitClearance;
    if (v5 !== undefined && v5 !== null &&
      v5.clearanceMode === 'ENFORCED' &&
      v5.actualOpticalClearanceScene !== null &&
      v5.actualOpticalClearanceScene + 1e-9 <
        firstOrbitAnchor.minimumBodyToHaloGapScene +
        firstOrbitAnchor.firstPlanetRadiusScene
    ) {
      throw new RangeError('SystemScene V5.3 first planetary body must clear the host optical envelope by its fixed minimum gap.');
    }
  }

  if (
    snapshot.stellarOrbitClearance !==
      undefined &&
    snapshot.stellarOrbitClearance !==
      null
  ) {
    assertFrozen(
      snapshot.stellarOrbitClearance,
      'snapshot.stellarOrbitClearance',
    );
    assertFrozenArray(
      snapshot.stellarOrbitClearance.stars,
      'snapshot.stellarOrbitClearance.stars',
      (
        star,
        label,
      ) => {
        assertFrozen(
          star,
          label,
        );

        if (
          star.opticalRadiusScene +
            1e-9 <
          star.radiusScene
        ) {
          throw new RangeError(
            'SystemScene V5 optical radius cannot be smaller than its photosphere radius.',
          );
        }
      },
    );

    const clearance =
      snapshot.stellarOrbitClearance;

    if (
      clearance.nearestPlanetPeriapsisRadiusScene !==
        null
    ) {
      if (
        clearance.requestedMinimumClearanceScene ===
          null ||
        clearance.actualOpticalClearanceScene ===
          null
      ) {
        throw new RangeError(
          'SystemScene V5 planetary-periapsis clearance metadata must be complete when a nearest planetary periapsis exists.',
        );
      }

      if (
        clearance.clearanceSatisfied
      ) {
        if (
          clearance.clearanceMode !==
            'ENFORCED' ||
          clearance.geometricOverlapDetected ||
          clearance.hostOpticalEnvelopeRadiusScene +
            clearance.requestedMinimumClearanceScene >
            clearance.nearestPlanetPeriapsisRadiusScene +
              1e-9
        ) {
          throw new RangeError(
            'SystemScene V5 enforced optical clearance must remain outside the nearest visible planetary periapsis.',
          );
        }
      } else if (
        clearance.clearanceMode !==
          'BEST_EFFORT_GEOMETRIC_OVERLAP' ||
        !clearance.geometricOverlapDetected ||
        !clearance.limited
      ) {
        throw new RangeError(
          'SystemScene V5 unresolved radial-envelope overlap must be explicit, best-effort and visually limited instead of aborting the scene.',
        );
      }

      if (
        clearance.hostPhotosphereEnvelopeRadiusScene >
          clearance.hostOpticalEnvelopeRadiusScene +
            1e-9
      ) {
        throw new RangeError(
          'SystemScene V5 photosphere envelope cannot extend beyond its optical envelope.',
        );
      }
    }
  }

  if (
    snapshot.habitableZone !==
      null
  ) {
    assertFrozen(
      snapshot.habitableZone,
      'snapshot.habitableZone',
    );
    assertMotionContributions(
      snapshot.habitableZone
        .anchorMotionContributions,
      'snapshot.habitableZone.anchorMotionContributions',
    );
  }

  if (snapshot.multihostHabitableZonesV23 !== undefined) {
    if (snapshot.multiplicityName !== 'BINARY') {
      throw new RangeError('V2.3 local HZ is restricted to the binary laboratory.');
    }
    const ids = new Set<string>();
    assertFrozenArray(snapshot.multihostHabitableZonesV23,
      'snapshot.multihostHabitableZonesV23', (zone, label) => {
        assertFrozen(zone, label);
        assertMotionContributions(zone.anchorMotionContributions,
          `${label}.anchorMotionContributions`);
        const host = snapshot.stars.find(star => star.label === zone.hostId);
        if ((zone.hostId !== 'A' && zone.hostId !== 'B') || ids.has(zone.hostId) ||
          host === undefined ||
          zone.topology !== 'CIRCUMSTELLAR' ||
          zone.source !== 'V1_FLUX_REFERENCE_V23' ||
          zone.anchorMotionContributions !== host.motionContributions ||
          !(zone.radiativeInnerEdgeAu > 0 &&
            zone.radiativeOuterEdgeAu > zone.radiativeInnerEdgeAu) ||
          !(zone.radiativeInnerRadiusScene > 0 &&
            zone.radiativeOuterRadiusScene > zone.radiativeInnerRadiusScene) ||
          (zone.dynamicallyHabitableInnerEdgeAu === null) !==
            (zone.dynamicallyHabitableOuterEdgeAu === null) ||
          (zone.dynamicallyHabitableInnerRadiusScene === null) !==
            (zone.dynamicallyHabitableOuterRadiusScene === null)) {
          throw new RangeError(`${label}: invalid or duplicate host-local HZ.`);
        }
        if (zone.dynamicallyHabitableInnerEdgeAu !== null && (
          zone.dynamicallyHabitableOuterEdgeAu! <= zone.dynamicallyHabitableInnerEdgeAu ||
          zone.dynamicallyHabitableInnerEdgeAu < zone.radiativeInnerEdgeAu - 1e-10 ||
          zone.dynamicallyHabitableOuterEdgeAu! > zone.radiativeOuterEdgeAu + 1e-10)) {
          throw new RangeError(`${label}: dynamical HZ must be within its radiative reference.`);
        }
        ids.add(zone.hostId);
      });
  }
}

function assertBodyProjection(
  body:
    SystemSceneBodyProjectionSnapshot,

  label:
    string,
): void {

  assertFrozen(
    body,
    label,
  );
  assertFrozen(
    body.position,
    `${label}.position`,
  );

  if (
    body.kind ===
      'minor-body' &&
    body.asteroidPresentation !==
      null
  ) {
    assertFrozen(
      body.asteroidPresentation,
      `${label}.asteroidPresentation`,
    );
  }

  if (
    body.kind ===
      'minor-body' &&
    body.cometPresentation !==
      null
  ) {
    assertFrozen(
      body.cometPresentation,
      `${label}.cometPresentation`,
    );
  }

  if (
    body.kind ===
      'moon'
  ) {
    assertFrozen(
      body.visualPresentation,
      `${label}.visualPresentation`,
    );
  }

  if (
    body.kind !==
      'minor-body'
  ) {
    assertFrozen(
      body.spin,
      `${label}.spin`,
    );

    if (
      body.kind ===
        'planet' &&
      body.surfaceEnvironment !==
        null
    ) {
      assertFrozen(
        body.surfaceEnvironment,
        `${label}.surfaceEnvironment`,
      );
    }


    if (
      body.kind ===
        'planet' &&
      body.giantAtmosphere !==
        null
    ) {
      assertFrozen(
        body.giantAtmosphere,
        `${label}.giantAtmosphere`,
      );
    }

    if (
      body.kind ===
        'planet' &&
      body.specialPresentation !==
        null
    ) {
      assertFrozen(
        body.specialPresentation,
        `${label}.specialPresentation`,
      );
      assertFrozen(
        body.specialPresentation.oblateness,
        `${label}.specialPresentation.oblateness`,
      );
      assertFrozen(
        body.specialPresentation.sourceRarityTraits,
        `${label}.specialPresentation.sourceRarityTraits`,
      );

      if (
        body.specialPresentation.rings !==
          null
      ) {
        assertFrozen(
          body.specialPresentation.rings,
          `${label}.specialPresentation.rings`,
        );
      }
    }
  }

  assertMotionContributions(
    body.motionContributions,
    `${label}.motionContributions`,
  );
}

function assertMotionContributions(
  contributions:
    readonly SystemSceneMotionContributionSnapshot[],

  label:
    string,
): void {

  assertFrozenArray(
    contributions,
    label,
    (
      contribution,
      contributionLabel,
    ) => {
      assertFrozen(
        contribution,
        contributionLabel,
      );

      if (contribution.hostRadialProjectionV22 !== undefined) {
        const radial = contribution.hostRadialProjectionV22;
        assertFrozen(radial, `${contributionLabel}.hostRadialProjectionV22`);
        if (!(radial.firstPeriapsisAu > 0 &&
              radial.lastApoapsisAu > radial.firstPeriapsisAu &&
              radial.firstPeriapsisScene > 0 &&
              radial.lastApoapsisScene > radial.firstPeriapsisScene) ||
            contribution.linearScenePerAu !== undefined) {
          throw new RangeError('V2.2 host radial mapping must be monotone and exclusive of a linear override.');
        }
        if (radial.outerMinorBodyExtensionLimitSceneV243 !== undefined &&
          !(radial.outerMinorBodyExtensionLimitSceneV243 > 0 &&
            radial.outerMinorBodyExtensionLimitSceneV243 <= 0.13)) {
          throw new RangeError('V2.4.3 comet-only radial extension must remain inside A/B separation budget.');
        }
        if (radial.singleSystemScaleV233 !== undefined) {
          const single = radial.singleSystemScaleV233;
          assertFrozen(single, `${contributionLabel}.singleSystemScaleV233`);
          if (single.projectionMode !== 'SINGLE_PRESENTATION_V3' ||
              !(single.outerRadiusAu >= radial.lastApoapsisAu) ||
              !(single.targetOuterRadiusScene > 0)) {
            throw new RangeError('V2.3.3 binary host must reuse a valid frozen V1 SINGLE V3 projection.');
          }
        }
        if (radial.orbitLadderV233 !== undefined) {
          const ladder = radial.orbitLadderV233;
          assertFrozen(ladder, `${contributionLabel}.orbitLadderV233`);
          if (radial.singleSystemScaleV233 === undefined || ladder.length < 3 ||
              ladder[0]!.radiusAu !== radial.firstPeriapsisAu ||
              ladder[0]!.radiusScene !== radial.firstPeriapsisScene ||
              ladder.at(-1)!.radiusAu !== radial.lastApoapsisAu ||
              ladder.at(-1)!.radiusScene !== radial.lastApoapsisScene) {
            throw new RangeError('V2.3.3 binary orbit ladder must span the complete local disk.');
          }
          for (let index = 0; index < ladder.length; index++) {
            const anchor = ladder[index]!;
            assertFrozen(anchor, `${contributionLabel}.orbitLadderV233[${index}]`);
            if (!(Number.isFinite(anchor.radiusAu) && Number.isFinite(anchor.radiusScene)) ||
                (index > 0 && !(anchor.radiusAu > ladder[index - 1]!.radiusAu &&
                  anchor.radiusScene > ladder[index - 1]!.radiusScene))) {
              throw new RangeError('V2.3.3 binary orbit ladder must be strictly monotonic.');
            }
          }
        }
      }

      if (
        contribution.postProjectionScale !==
          undefined &&
        (
          !Number.isFinite(
            contribution.postProjectionScale,
          ) ||
          contribution.postProjectionScale <=
            0
        )
      ) {
        throw new RangeError(
          `${contributionLabel}.postProjectionScale must be finite and > 0.`,
        );
      }
    },
  );
}

function assertFrozenArray<T>(
  values:
    readonly T[],

  label:
    string,

  assertEntry:
    (
      value:
        T,
      entryLabel:
        string,
    ) => void,
): void {

  assertFrozen(
    values,
    label,
  );

  values.forEach(
    (
      value,
      index,
    ) => {
      assertEntry(
        value,
        `${label}[${index}]`,
      );
    },
  );
}

function assertFrozen(
  value:
    object,

  label:
    string,
): void {

  if (
    !Object.isFrozen(
      value,
    )
  ) {
    throw new TypeError(
      `SystemScene point 24.10 requires immutable presentation data: ${label} is mutable.`,
    );
  }
}
