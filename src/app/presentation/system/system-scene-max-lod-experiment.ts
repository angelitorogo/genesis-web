/**
 * LODMAX.1 — opt-in, reversible stress experiment for GENESIS SystemScene.
 * Deliberately expensive: this mode is NOT the production LOD policy.
 * Only an exact URL query parameter can enable it. No persisted changes.
 */
export const SYSTEM_SCENE_MAX_LOD_TEXTURE_V1 = Object.freeze({width: 1024, height: 512});

export function systemSceneMaxLodExperimentEnabledV1(search: string): boolean {
  try {
    return new URLSearchParams(search).get('genesisLod') === 'max';
  } catch {
    return false;
  }
}

/** A separate opt-in reference run with the stock adaptive renderer. */
export function systemSceneLodBenchmarkTelemetryEnabledV1(search: string): boolean {
  try {
    const value = new URLSearchParams(search).get('genesisLod');
    return value === 'max' || value === 'adaptive';
  } catch {
    return false;
  }
}

/** Rough texture-memory estimate, not measured VRAM. */
export function systemSceneMaxLodTextureBudgetMiBV1(
  planetCount: number,
  moonCount: number,
  minorCount: number,
): number {
  if (![planetCount, moonCount, minorCount].every(n => Number.isSafeInteger(n) && n >= 0)) {
    throw new RangeError('Expected nonnegative body counts');
  }
  // A 1024x512 RGBA map occupies 2MiB before mipmaps; bodies may own
  // albedo, roughness, relief, normal, emission and clouds simultaneously.
  return 2 * (6 * planetCount + 6 * moonCount + minorCount);
}
