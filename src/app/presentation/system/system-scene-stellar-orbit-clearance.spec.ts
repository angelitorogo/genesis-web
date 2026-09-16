import {
  buildSystemSceneStellarOrbitClearanceV5,
} from './system-scene-stellar-orbit-clearance';

import {
  buildSystemSceneMultistellarPTypeClearanceV51,
} from './system-scene-multistellar-p-type-clearance';

describe('SystemScene stellar orbit clearance V5', () => {
  it('should aggressively contain a SINGLE photosphere and optical halo inside a very close planetary periapsis', () => {
    const clearance = buildSystemSceneStellarOrbitClearanceV5(
      [
        {
          id: 'star-a',
          label: 'A',
          baseRadiusScene: 0.42,
          baseOpticalRadiusScene: 0.54,
          maxCenterExcursionScene: 0,
          participatesInPlanetaryHostClearance: true,
        },
      ],
      0.50,
    );

    const star = clearance.stars[0]!;

    expect(clearance.version).toBe(5);
    expect(star.radiusScene).toBeLessThan(0.42);
    expect(star.opticalRadiusScene).toBeLessThan(0.54);
    expect(star.opticalRadiusScene).toBeGreaterThan(star.radiusScene);
    expect(clearance.hostPhotosphereEnvelopeRadiusScene).toBeLessThan(0.50);
    expect(clearance.hostOpticalEnvelopeRadiusScene).toBeLessThan(0.50);
    expect(clearance.actualOpticalClearanceScene).toBeGreaterThanOrEqual(
      clearance.requestedMinimumClearanceScene! - 1e-12,
    );
    expect(clearance.clearanceSatisfied).toBe(true);
  });

  it('should keep a BINARY P-type planetary periapsis outside both stellar photospheres and useful optical halo', () => {
    const clearance = buildSystemSceneStellarOrbitClearanceV5(
      [
        {
          id: 'star-a',
          label: 'A',
          baseRadiusScene: 0.30,
          baseOpticalRadiusScene: 0.44,
          maxCenterExcursionScene: 0.32,
          participatesInPlanetaryHostClearance: true,
        },
        {
          id: 'star-b',
          label: 'B',
          baseRadiusScene: 0.26,
          baseOpticalRadiusScene: 0.40,
          maxCenterExcursionScene: 0.28,
          participatesInPlanetaryHostClearance: true,
        },
      ],
      0.90,
    );

    expect(clearance.hostPhotosphereEnvelopeRadiusScene).toBeLessThan(
      clearance.hostOpticalEnvelopeRadiusScene,
    );
    expect(
      clearance.hostOpticalEnvelopeRadiusScene +
      clearance.requestedMinimumClearanceScene!,
    ).toBeLessThanOrEqual(0.90 + 1e-12);
    expect(clearance.stars.every(star => star.limited)).toBe(true);
    expect(clearance.clearanceSatisfied).toBe(true);
  });

  it('should constrain the inner A+B host in a hierarchical TRIPLE while leaving the distant tertiary outside the local P-type clearance contract', () => {
    const clearance = buildSystemSceneStellarOrbitClearanceV5(
      [
        {
          id: 'star-a',
          label: 'A',
          baseRadiusScene: 0.28,
          baseOpticalRadiusScene: 0.40,
          maxCenterExcursionScene: 0.27,
          participatesInPlanetaryHostClearance: true,
        },
        {
          id: 'star-b',
          label: 'B',
          baseRadiusScene: 0.24,
          baseOpticalRadiusScene: 0.36,
          maxCenterExcursionScene: 0.23,
          participatesInPlanetaryHostClearance: true,
        },
        {
          id: 'star-c',
          label: 'C',
          baseRadiusScene: 0.18,
          baseOpticalRadiusScene: 0.25,
          maxCenterExcursionScene: 3.0,
          participatesInPlanetaryHostClearance: false,
        },
      ],
      0.82,
    );

    const tertiary = clearance.stars.find(star => star.label === 'C')!;

    expect(clearance.hostOpticalEnvelopeRadiusScene).toBeLessThan(0.82);
    expect(clearance.clearanceSatisfied).toBe(true);
    expect(tertiary.radiusScene).toBe(0.18);
    expect(tertiary.opticalRadiusScene).toBe(0.25);
  });

  it('should preserve visible glow but cap it close to the downsized photosphere', () => {
    const clearance = buildSystemSceneStellarOrbitClearanceV5(
      [
        {
          id: 'star-a',
          label: 'A',
          baseRadiusScene: 0.50,
          baseOpticalRadiusScene: 0.72,
          maxCenterExcursionScene: 0,
          participatesInPlanetaryHostClearance: true,
        },
      ],
      0.62,
    );

    const star = clearance.stars[0]!;

    expect(star.opticalRadiusScene).toBeGreaterThan(star.radiusScene);
    expect(star.opticalRadiusScene).toBeLessThanOrEqual(
      star.radiusScene * 1.24 + 1e-12,
    );
    expect(star.opticalRadiusScene).toBeLessThan(0.72);
  });


  it('should degrade gracefully instead of throwing when a legacy multiple-star centre envelope already reaches the nearest projected planetary periapsis', () => {
    const clearance = buildSystemSceneStellarOrbitClearanceV5(
      [
        {
          id: 'star-a',
          label: 'A',
          baseRadiusScene: 0.24,
          baseOpticalRadiusScene: 0.36,
          maxCenterExcursionScene: 0.72,
          participatesInPlanetaryHostClearance: true,
        },
        {
          id: 'star-b',
          label: 'B',
          baseRadiusScene: 0.20,
          baseOpticalRadiusScene: 0.32,
          maxCenterExcursionScene: 0.58,
          participatesInPlanetaryHostClearance: true,
        },
      ],
      0.60,
    );

    expect(clearance.clearanceSatisfied).toBe(false);
    expect(clearance.clearanceMode).toBe(
      'BEST_EFFORT_GEOMETRIC_OVERLAP',
    );
    expect(clearance.geometricOverlapDetected).toBe(true);
    expect(clearance.limited).toBe(true);

    const primary = clearance.stars.find(star => star.label === 'A')!;
    expect(primary.radiusScene).toBeLessThanOrEqual(0.018 + 1e-12);
    expect(primary.opticalRadiusScene).toBeLessThanOrEqual(
      primary.radiusScene * 1.10 + 1e-12,
    );
  });

  it('should use V5.1 P-type centre compaction before V5 optical clearance so a legacy BINARY remains readable instead of reducing stars to points', () => {
    const pType = buildSystemSceneMultistellarPTypeClearanceV51({
      architecture: 'BINARY',
      stellarOuterExcursionAu: 0.35,
      circumbinaryStabilityInnerEdgeAu: 1.20,
      nearestPlanetPeriapsisAu: 0.95,
      uncompressedStellarCenterEnvelopeScene: 0.72,
      projectedStabilityInnerEdgeScene: 0.78,
      projectedNearestPlanetPeriapsisScene: 0.60,
    });

    const clearance = buildSystemSceneStellarOrbitClearanceV5(
      [
        {
          id: 'star-a',
          label: 'A',
          baseRadiusScene: 0.24,
          baseOpticalRadiusScene: 0.36,
          maxCenterExcursionScene:
            0.72 * pType.innerPairPresentationScale,
          participatesInPlanetaryHostClearance: true,
        },
        {
          id: 'star-b',
          label: 'B',
          baseRadiusScene: 0.20,
          baseOpticalRadiusScene: 0.32,
          maxCenterExcursionScene:
            0.58 * pType.innerPairPresentationScale,
          participatesInPlanetaryHostClearance: true,
        },
      ],
      0.60,
    );

    expect(pType.presentationCompressed).toBe(true);
    expect(clearance.clearanceMode).toBe('ENFORCED');
    expect(clearance.clearanceSatisfied).toBe(true);
    expect(clearance.geometricOverlapDetected).toBe(false);

    const primary = clearance.stars.find(star => star.label === 'A')!;
    expect(primary.radiusScene).toBeGreaterThan(0.05);
    expect(primary.opticalRadiusScene).toBeGreaterThan(primary.radiusScene);
    expect(
      clearance.hostOpticalEnvelopeRadiusScene +
        clearance.requestedMinimumClearanceScene!,
    ).toBeLessThanOrEqual(0.60 + 1e-12);
  });


});
