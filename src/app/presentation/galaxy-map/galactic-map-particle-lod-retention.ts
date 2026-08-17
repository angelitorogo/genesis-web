import {
  GalacticMapLodLevel,
  galacticMapParticleRetentionRatio,
} from './galactic-map-lod-policy';

const UINT32_SCALE =
  4_294_967_296;

/**
 * Frozen deterministic point-10.8 sample-retention rule, extracted as a pure
 * point-10.9 shared primitive so main-thread reference tests and the Web Worker
 * cannot drift apart.
 */
export function particleRetainedForLod(
  sourceIndex:
    number,

  lodLevel:
    GalacticMapLodLevel,
): boolean {

  if (
    !Number.isInteger(
      sourceIndex,
    ) ||
    sourceIndex <
      0
  ) {
    throw new RangeError(
      'sourceIndex must be a non-negative integer.',
    );
  }

  if (
    lodLevel ===
      GalacticMapLodLevel.DETAIL
  ) {
    return true;
  }

  const retention =
    galacticMapParticleRetentionRatio(
      lodLevel,
    );

  return deterministicUnit(
    sourceIndex,
  ) <
    retention;
}

function deterministicUnit(
  sourceIndex:
    number,
): number {

  let value =
    sourceIndex ^
    0x9e3779b9;

  value =
    Math.imul(
      value ^
        (
          value >>>
          16
        ),
      0x85ebca6b,
    );

  value =
    Math.imul(
      value ^
        (
          value >>>
          13
        ),
      0xc2b2ae35,
    );

  value =
    value ^
    (
      value >>>
      16
    );

  return (
    value >>>
    0
  ) /
    UINT32_SCALE;
}
