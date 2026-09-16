export interface SystemSceneMultistellarCoreCompactionInputV52 {
  readonly architecture:
    'BINARY' |
    'TRIPLE';

  /** V5.1 requested scene-space compaction ratio. */
  readonly requestedPostProjectionScale:
    number;

  readonly uncompressedPrimaryCenterExcursionScene:
    number;

  readonly uncompressedSecondaryCenterExcursionScene:
    number;

  readonly targetStellarCenterEnvelopeScene:
    number | null;
}

export interface SystemSceneMultistellarCoreCompactionV52 {
  readonly version:
    5.2;

  readonly architecture:
    'BINARY' |
    'TRIPLE';

  /**
   * Presentation-only multiplier applied AFTER AU -> scene projection.
   * It must never be folded into the authoritative barycentric AU scale.
   */
  readonly postProjectionScale:
    number;

  readonly uncompressedPrimaryCenterExcursionScene:
    number;

  readonly uncompressedSecondaryCenterExcursionScene:
    number;

  readonly uncompressedStellarCenterEnvelopeScene:
    number;

  readonly compressedPrimaryCenterExcursionScene:
    number;

  readonly compressedSecondaryCenterExcursionScene:
    number;

  readonly compressedStellarCenterEnvelopeScene:
    number;

  readonly targetStellarCenterEnvelopeScene:
    number | null;

  readonly targetSatisfied:
    boolean;

  readonly applied:
    boolean;
}

const VALUE_TOLERANCE =
  1e-9;

/**
 * Renderer-only V5.2 post-projection compaction for the inner A-B subsystem.
 *
 * V5.1 correctly decided how much scene-space the inner stellar pair should
 * occupy, but BINARY/GLOBAL rendering accidentally folded that ratio into AU
 * before the non-linear radial projection. V5.2 freezes the rule that the
 * ratio is applied only after the physical barycentric orbit has been
 * projected to scene coordinates.
 */
export function buildSystemSceneMultistellarCoreCompactionV52(
  input:
    SystemSceneMultistellarCoreCompactionInputV52,
): SystemSceneMultistellarCoreCompactionV52 {

  assertNormalizedPositiveScale(
    input.requestedPostProjectionScale,
    'requestedPostProjectionScale',
  );

  assertNonNegativeFinite(
    input.uncompressedPrimaryCenterExcursionScene,
    'uncompressedPrimaryCenterExcursionScene',
  );

  assertNonNegativeFinite(
    input.uncompressedSecondaryCenterExcursionScene,
    'uncompressedSecondaryCenterExcursionScene',
  );

  const target =
    positiveFiniteOrNull(
      input.targetStellarCenterEnvelopeScene,
    );

  const uncompressedEnvelope =
    Math.max(
      input.uncompressedPrimaryCenterExcursionScene,
      input.uncompressedSecondaryCenterExcursionScene,
    );

  const postProjectionScale =
    clamp(
      input.requestedPostProjectionScale,
      1e-6,
      1,
    );

  const compressedPrimary =
    input.uncompressedPrimaryCenterExcursionScene *
    postProjectionScale;

  const compressedSecondary =
    input.uncompressedSecondaryCenterExcursionScene *
    postProjectionScale;

  const compressedEnvelope =
    Math.max(
      compressedPrimary,
      compressedSecondary,
    );

  const targetSatisfied =
    target === null ||
    compressedEnvelope <=
      target +
        VALUE_TOLERANCE;

  if (
    target !== null &&
    !targetSatisfied
  ) {
    throw new RangeError(
      'SystemScene V5.2 post-projection stellar core compaction must satisfy the V5.1 scene-space target.',
    );
  }

  return Object.freeze({
    version:
      5.2 as const,
    architecture:
      input.architecture,
    postProjectionScale,
    uncompressedPrimaryCenterExcursionScene:
      input.uncompressedPrimaryCenterExcursionScene,
    uncompressedSecondaryCenterExcursionScene:
      input.uncompressedSecondaryCenterExcursionScene,
    uncompressedStellarCenterEnvelopeScene:
      uncompressedEnvelope,
    compressedPrimaryCenterExcursionScene:
      compressedPrimary,
    compressedSecondaryCenterExcursionScene:
      compressedSecondary,
    compressedStellarCenterEnvelopeScene:
      compressedEnvelope,
    targetStellarCenterEnvelopeScene:
      target,
    targetSatisfied,
    applied:
      postProjectionScale <
      1 -
        VALUE_TOLERANCE,
  });
}

function assertNormalizedPositiveScale(
  value:
    number,

  label:
    string,
): void {

  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    value > 1 + VALUE_TOLERANCE
  ) {
    throw new RangeError(
      `${label} must be finite in the interval (0, 1]: ${String(value)}.`,
    );
  }
}

function assertNonNegativeFinite(
  value:
    number,

  label:
    string,
): void {

  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new RangeError(
      `${label} must be finite and non-negative: ${String(value)}.`,
    );
  }
}

function positiveFiniteOrNull(
  value:
    number | null,
): number | null {

  return value !== null &&
    Number.isFinite(value) &&
    value > 0
    ? value
    : null;
}

function clamp(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {

  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}
