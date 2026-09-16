import {
  buildSystemSceneMultistellarCoreCompactionV52,
} from './system-scene-multistellar-core-compaction';

describe('SystemScene multistellar core compaction V5.2', () => {
  it('should apply the requested BINARY ratio directly to already-projected centre excursions', () => {
    const result = buildSystemSceneMultistellarCoreCompactionV52({
      architecture: 'BINARY',
      requestedPostProjectionScale: 0.30,
      uncompressedPrimaryCenterExcursionScene: 0.72,
      uncompressedSecondaryCenterExcursionScene: 0.54,
      targetStellarCenterEnvelopeScene: 0.216,
    });

    expect(result.postProjectionScale).toBe(0.30);
    expect(result.compressedPrimaryCenterExcursionScene).toBeCloseTo(0.216, 12);
    expect(result.compressedSecondaryCenterExcursionScene).toBeCloseTo(0.162, 12);
    expect(result.compressedStellarCenterEnvelopeScene).toBeCloseTo(0.216, 12);
    expect(result.targetSatisfied).toBe(true);
    expect(result.applied).toBe(true);
  });

  it('should leave an already-valid inner pair uncompressed', () => {
    const result = buildSystemSceneMultistellarCoreCompactionV52({
      architecture: 'TRIPLE',
      requestedPostProjectionScale: 1,
      uncompressedPrimaryCenterExcursionScene: 0.18,
      uncompressedSecondaryCenterExcursionScene: 0.16,
      targetStellarCenterEnvelopeScene: 0.20,
    });

    expect(result.postProjectionScale).toBe(1);
    expect(result.compressedStellarCenterEnvelopeScene).toBeCloseTo(0.18, 12);
    expect(result.targetSatisfied).toBe(true);
    expect(result.applied).toBe(false);
  });
});
