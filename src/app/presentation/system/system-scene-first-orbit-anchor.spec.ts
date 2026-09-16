import {
  buildSingleAdaptiveSystemScaleV3,
  buildMultipleAdaptiveSystemScaleV3,
  buildTripleHierarchicalSystemScaleV3,
  SystemSceneProjectionSpace,
  systemSceneProjectAuVectorInSpace,
  systemSceneProjectedOverlayRadiusAuInSpace,
  systemSceneProjectedRadiusAuInSpace,
  type SystemSceneScaleSnapshot,
} from './system-scene-scale-projection';
import {
  buildSystemSceneFirstOrbitAnchorV53,
  SYSTEM_SCENE_FIRST_ORBIT_BODY_CLEARANCE_V53,
} from './system-scene-first-orbit-anchor';
import {
  buildSystemSceneHostVisualEnvelopeV3,
} from './system-scene-host-visual-envelope';
import {
  buildSystemSceneStellarOrbitClearanceV5,
} from './system-scene-stellar-orbit-clearance';
import {
  buildSystemSceneMultistellarPTypeClearanceV51,
} from './system-scene-multistellar-p-type-clearance';
import {
  buildSystemSceneMultistellarCoreCompactionV52,
} from './system-scene-multistellar-core-compaction';
import {
  buildSystemSceneMultistellarPresentationV4,
} from './system-scene-multistellar-presentation';

const FIRST_AU = 0.04;
const FIRST_BODY_RADIUS = 0.05;

function anchoredScale(
  architecture: 'SINGLE' | 'BINARY' | 'TRIPLE',
): {
  readonly original: SystemSceneScaleSnapshot;
  readonly scale: SystemSceneScaleSnapshot;
  readonly space: SystemSceneProjectionSpace;
} {
  const original = architecture === 'SINGLE'
    ? buildSingleAdaptiveSystemScaleV3({
        outerRadiusAu: 12,
        targetOuterRadiusScene: 4.8,
        innerPeriapsisAu: FIRST_AU,
        starRadiusScene: 0.34,
        maxPlanetRadiusScene: FIRST_BODY_RADIUS,
        habitableZoneInnerAu: 1,
        habitableZoneOuterAu: 2,
      })
    : architecture === 'BINARY'
      ? buildMultipleAdaptiveSystemScaleV3({
          architecture: 'BINARY',
          outerRadiusAu: 12,
          targetOuterRadiusScene: 4.8,
          innerBinaryPeriapsisAu: 0.012,
          primaryStarRadiusScene: 0.34,
          secondaryStarRadiusScene: 0.27,
          habitableZoneInnerAu: 1,
          habitableZoneOuterAu: 2,
        })
      : buildTripleHierarchicalSystemScaleV3({
          outerRadiusAu: 15,
          targetOuterRadiusScene: 4.8,
          innerBinaryPeriapsisAu: 0.012,
          innerBinaryApoapsisAu: 0.024,
          localPlanetOuterRadiusAu: 3,
          outerRelativePeriapsisAu: 5,
          outerRelativeApoapsisAu: 11,
          primaryStarRadiusScene: 0.34,
          secondaryStarRadiusScene: 0.27,
          tertiaryStarRadiusScene: 0.25,
          maxPlanetRadiusScene: FIRST_BODY_RADIUS,
          innerPairOuterScale: -0.3,
          tertiaryOuterScale: 0.7,
          habitableZoneInnerAu: 1,
          habitableZoneOuterAu: 2,
        });
  const space = architecture === 'TRIPLE'
    ? SystemSceneProjectionSpace.TRIPLE_LOCAL
    : SystemSceneProjectionSpace.GLOBAL;
  const anchor = buildSystemSceneFirstOrbitAnchorV53({
    architecture,
    projectionSpace: space,
    nearestPeriapsisAu: FIRST_AU,
    originalPeriapsisScene: systemSceneProjectedRadiusAuInSpace(
      FIRST_AU, original, space,
    ),
    localOuterRadiusScene: architecture === 'TRIPLE'
      ? original.tripleHierarchy!.local.targetOuterRadiusScene
      : original.targetOuterRadiusScene,
    basePrimaryRadiusScene: 0.34,
    baseSecondaryRadiusScene: architecture === 'SINGLE' ? 0 : 0.27,
    firstPlanetRadiusScene: FIRST_BODY_RADIUS,
  });
  expect(anchor).not.toBeNull();
  expect(anchor!.applied).toBe(true);
  return {
    original,
    scale: Object.freeze({ ...original, firstOrbitAnchor: anchor }),
    space,
  };
}

function checkSharedProjection(
  original: SystemSceneScaleSnapshot,
  scale: SystemSceneScaleSnapshot,
  space: SystemSceneProjectionSpace,
): number {
  const project = (au: number) => systemSceneProjectedRadiusAuInSpace(
    au, scale, space,
  );
  const oldPeri = systemSceneProjectedRadiusAuInSpace(FIRST_AU, original, space);
  const peri = project(FIRST_AU);
  expect(peri).toBeGreaterThan(oldPeri);
  expect(peri).toBeCloseTo(scale.firstOrbitAnchor!.anchoredPeriapsisScene, 12);
  expect(Object.isFrozen(scale.firstOrbitAnchor)).toBe(true);
  expect(project(0)).toBe(0);
  const orderedAu = [0.001, 0.012, 0.025, FIRST_AU, 0.055, 0.1, 0.25, 0.5, 1, 2];
  const orderedScene = orderedAu.map(project);
  expect(orderedScene.every((value, index) =>
    index === 0 || value > orderedScene[index - 1]!,
  )).toBe(true);
  // The exterior is a single affine projection; no planet-by-planet spacing.
  const outerRatio = (project(0.25) - project(0.1)) /
    (project(0.5) - project(0.25));
  const originalRatio = (
    systemSceneProjectedRadiusAuInSpace(0.25, original, space) -
    systemSceneProjectedRadiusAuInSpace(0.1, original, space)
  ) / (
    systemSceneProjectedRadiusAuInSpace(0.5, original, space) -
    systemSceneProjectedRadiusAuInSpace(0.25, original, space)
  );
  expect(outerRatio).toBeCloseTo(originalRatio, 10);
  // Planet position, orbital guide, HZ boundary and belt use precisely one map.
  expect(systemSceneProjectAuVectorInSpace({ x: 0.25, y: 0, z: 0 }, scale, space).x)
    .toBeCloseTo(project(0.25), 12);
  for (const overlayAu of [0.06, 0.25, 1, 2]) {
    expect(systemSceneProjectedOverlayRadiusAuInSpace(overlayAu, scale, space))
      .toBeCloseTo(project(overlayAu), 12);
  }
  const fittedOuterAu = space === SystemSceneProjectionSpace.TRIPLE_LOCAL
    ? scale.tripleHierarchy!.local.outerRadiusAu
    : scale.outerRadiusAu;
  expect(project(fittedOuterAu)).toBeCloseTo(
    space === SystemSceneProjectionSpace.TRIPLE_LOCAL
      ? scale.tripleHierarchy!.local.targetOuterRadiusScene
      : scale.targetOuterRadiusScene,
    10,
  );
  return peri;
}

describe('SystemScene V5.3 stellar readability + shared first-orbit anchor', () => {
  it('SINGLE: expands a very close first orbit while visibly enlarging the star and protecting the full planet body', () => {
    const { original, scale, space } = anchoredScale('SINGLE');
    const peri = checkSharedProjection(original, scale, space);
    const hz = systemSceneProjectedOverlayRadiusAuInSpace(1, scale, space);
    const host = buildSystemSceneHostVisualEnvelopeV3([
      { id: 'A', baseRadiusScene: 0.34, maxCenterExcursionScene: 0,
        participatesInHabitableZoneHost: true },
    ], hz, peri);
    const result = buildSystemSceneStellarOrbitClearanceV5(
      host.stars.map(star => ({
        id: star.id, label: 'A', baseRadiusScene: star.radiusScene,
        baseOpticalRadiusScene: star.opticalRadiusScene,
        maxCenterExcursionScene: 0, participatesInPlanetaryHostClearance: true,
      })),
      peri,
      scale.firstOrbitAnchor!.targetPhotosphereRadiusScene,
      FIRST_BODY_RADIUS,
    );
    expect(result.stars[0]!.radiusScene).toBeGreaterThan(0.16);
    expect(result.stars[0]!.opticalRadiusScene).toBeGreaterThan(result.stars[0]!.radiusScene);
    expect(result.clearanceMode).toBe('ENFORCED');
    expect(result.actualOpticalClearanceScene!).toBeGreaterThanOrEqual(
      SYSTEM_SCENE_FIRST_ORBIT_BODY_CLEARANCE_V53 + FIRST_BODY_RADIUS - 1e-9,
    );
    expect(peri - FIRST_BODY_RADIUS).toBeGreaterThan(
      result.hostOpticalEnvelopeRadiusScene + SYSTEM_SCENE_FIRST_ORBIT_BODY_CLEARANCE_V53,
    );
  });

  it('BINARY P-type: reserves the full A+B excursions, restores star readability and maintains an external planet/body gap', () => {
    const { original, scale, space } = anchoredScale('BINARY');
    const peri = checkSharedProjection(original, scale, space);
    const excursion = systemSceneProjectedRadiusAuInSpace(0.012, scale, space);
    const stable = systemSceneProjectedRadiusAuInSpace(0.03, scale, space);
    const pType = buildSystemSceneMultistellarPTypeClearanceV51({
      architecture: 'BINARY', stellarOuterExcursionAu: 0.012,
      circumbinaryStabilityInnerEdgeAu: 0.03,
      nearestPlanetPeriapsisAu: FIRST_AU,
      uncompressedStellarCenterEnvelopeScene: excursion,
      projectedStabilityInnerEdgeScene: stable,
      projectedNearestPlanetPeriapsisScene: peri,
    }, 0.46);
    const compaction = buildSystemSceneMultistellarCoreCompactionV52({
      architecture: 'BINARY', requestedPostProjectionScale: pType.innerPairPresentationScale,
      uncompressedPrimaryCenterExcursionScene: excursion,
      uncompressedSecondaryCenterExcursionScene: excursion,
      targetStellarCenterEnvelopeScene: pType.targetStellarCenterEnvelopeScene,
    });
    const centre = compaction.compressedStellarCenterEnvelopeScene;
    const host = buildSystemSceneHostVisualEnvelopeV3([
      { id: 'A', baseRadiusScene: 0.34, maxCenterExcursionScene: centre,
        participatesInHabitableZoneHost: true },
      { id: 'B', baseRadiusScene: 0.27, maxCenterExcursionScene: centre,
        participatesInHabitableZoneHost: true },
    ], systemSceneProjectedOverlayRadiusAuInSpace(1, scale, space), peri);
    const separation = 2 * systemSceneProjectedRadiusAuInSpace(0.006, scale, space) *
      compaction.postProjectionScale;
    const pair = buildSystemSceneMultistellarPresentationV4(
      'BINARY', host.stars.map((star, i) => ({
        id: star.id, label: i ? 'B' : 'A',
        baseRadiusScene: star.radiusScene, opticalRadiusScene: star.opticalRadiusScene,
      })), separation, null,
    );
    const clearance = buildSystemSceneStellarOrbitClearanceV5(
      pair.stars.map(star => ({
        id: star.id, label: star.label, baseRadiusScene: star.radiusScene,
        baseOpticalRadiusScene: star.opticalRadiusScene,
        maxCenterExcursionScene: centre,
        participatesInPlanetaryHostClearance: true,
      })), peri, scale.firstOrbitAnchor!.targetPhotosphereRadiusScene, FIRST_BODY_RADIUS,
    );
    expect(pair.stars[0]!.radiusScene).toBeGreaterThan(0.075);
    expect(compaction.targetSatisfied).toBe(true);
    expect(clearance.clearanceSatisfied).toBe(true);
    expect(clearance.hostOpticalEnvelopeRadiusScene + FIRST_BODY_RADIUS +
      SYSTEM_SCENE_FIRST_ORBIT_BODY_CLEARANCE_V53).toBeLessThanOrEqual(peri + 1e-9);
    expect(pType.physicalPlanetClearanceAu).toBeCloseTo(0.028, 12);
  });

  it('TRIPLE: anchors only the A+B local P-type geometry while preserving C outer hierarchy, HZ and belt alignment', () => {
    const { original, scale, space } = anchoredScale('TRIPLE');
    const peri = checkSharedProjection(original, scale, space);
    const outerAu = 5;
    expect(systemSceneProjectedRadiusAuInSpace(
      outerAu, scale, SystemSceneProjectionSpace.TRIPLE_OUTER,
    )).toBeCloseTo(systemSceneProjectedRadiusAuInSpace(
      outerAu, original, SystemSceneProjectionSpace.TRIPLE_OUTER,
    ), 12);
    expect(systemSceneProjectedRadiusAuInSpace(
      0.012, scale, space,
    )).toBeLessThan(peri);
    expect(scale.firstOrbitAnchor?.projectionSpace).toBe(
      SystemSceneProjectionSpace.TRIPLE_LOCAL,
    );
    // C's orbital projection is independent; planets/HZ/belts share local radial map.
    expect(systemSceneProjectedOverlayRadiusAuInSpace(0.1, scale, space))
      .toBeCloseTo(systemSceneProjectedRadiusAuInSpace(0.1, scale, space), 12);
    expect(peri).toBeGreaterThan(1.0);
  });

  it('does not invent a first planetary orbit for planetless systems', () => {
    expect(buildSystemSceneFirstOrbitAnchorV53({
      architecture: 'SINGLE', projectionSpace: SystemSceneProjectionSpace.GLOBAL,
      nearestPeriapsisAu: null, originalPeriapsisScene: null,
      localOuterRadiusScene: 4.8, basePrimaryRadiusScene: 0.3,
      baseSecondaryRadiusScene: 0, firstPlanetRadiusScene: 0,
    })).toBeNull();
  });
});
