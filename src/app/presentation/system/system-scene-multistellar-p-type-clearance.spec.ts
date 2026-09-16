import {
  buildSystemSceneMultistellarPTypeClearanceV51,
  SystemSceneMultistellarPTypeConsistencyRegimeV51,
} from './system-scene-multistellar-p-type-clearance';

describe('SystemScene multistellar P-type clearance V5.1', () => {
  it('should keep a physically consistent BINARY pair inside the P-type presentation core instead of shrinking stars to points', () => {
    const result =
      buildSystemSceneMultistellarPTypeClearanceV51({
        architecture: 'BINARY',
        stellarOuterExcursionAu: 0.42,
        circumbinaryStabilityInnerEdgeAu: 1.55,
        nearestPlanetPeriapsisAu: 1.82,
        uncompressedStellarCenterEnvelopeScene: 1.08,
        projectedStabilityInnerEdgeScene: 1.62,
        projectedNearestPlanetPeriapsisScene: 1.78,
      });

    expect(result.consistencyRegime).toBe(
      SystemSceneMultistellarPTypeConsistencyRegimeV51.CONSISTENT,
    );
    expect(result.presentationCompressed).toBe(true);
    expect(result.innerPairPresentationScale).toBeGreaterThan(0);
    expect(result.innerPairPresentationScale).toBeLessThan(1);
    expect(
      result.uncompressedStellarCenterEnvelopeScene *
        result.innerPairPresentationScale,
    ).toBeLessThanOrEqual(
      result.targetStellarCenterEnvelopeScene! + 1e-12,
    );
  });

  it('should diagnose an old P-type planet inside the current stability floor but still provide a renderer-only compaction', () => {
    const result =
      buildSystemSceneMultistellarPTypeClearanceV51({
        architecture: 'BINARY',
        stellarOuterExcursionAu: 0.30,
        circumbinaryStabilityInnerEdgeAu: 4.0,
        nearestPlanetPeriapsisAu: 1.15,
        uncompressedStellarCenterEnvelopeScene: 1.60,
        projectedStabilityInnerEdgeScene: 2.65,
        projectedNearestPlanetPeriapsisScene: 1.10,
      });

    expect(result.consistencyRegime).toBe(
      SystemSceneMultistellarPTypeConsistencyRegimeV51
        .LEGACY_PLANET_INSIDE_STABILITY_FLOOR,
    );
    expect(result.visualClearanceBoundaryScene).toBe(1.10);
    expect(result.presentationCompressed).toBe(true);
    expect(
      result.uncompressedStellarCenterEnvelopeScene *
        result.innerPairPresentationScale,
    ).toBeCloseTo(1.10 * 0.36, 12);
  });

  it('should compact only the inner A-B hierarchy in a TRIPLE against the local P-type annulus', () => {
    const result =
      buildSystemSceneMultistellarPTypeClearanceV51({
        architecture: 'TRIPLE',
        stellarOuterExcursionAu: 0.24,
        circumbinaryStabilityInnerEdgeAu: 0.95,
        nearestPlanetPeriapsisAu: 1.10,
        uncompressedStellarCenterEnvelopeScene: 0.92,
        projectedStabilityInnerEdgeScene: 1.36,
        projectedNearestPlanetPeriapsisScene: 1.50,
      });

    expect(result.architecture).toBe('TRIPLE');
    expect(result.consistencyRegime).toBe(
      SystemSceneMultistellarPTypeConsistencyRegimeV51.CONSISTENT,
    );
    expect(result.targetStellarCenterEnvelopeScene).toBeCloseTo(
      1.36 * 0.36,
      12,
    );
    expect(result.presentationCompressed).toBe(true);
  });

  it('should preserve the original inner stellar motion when it already fits comfortably inside the P-type region', () => {
    const result =
      buildSystemSceneMultistellarPTypeClearanceV51({
        architecture: 'BINARY',
        stellarOuterExcursionAu: 0.20,
        circumbinaryStabilityInnerEdgeAu: 2.5,
        nearestPlanetPeriapsisAu: 3.0,
        uncompressedStellarCenterEnvelopeScene: 0.38,
        projectedStabilityInnerEdgeScene: 1.80,
        projectedNearestPlanetPeriapsisScene: 2.0,
      });

    expect(result.innerPairPresentationScale).toBe(1);
    expect(result.presentationCompressed).toBe(false);
  });
});
