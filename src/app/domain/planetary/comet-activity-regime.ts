/**
 * Point-22.6 qualitative cometary activity state at one evaluated distance.
 *
 * These values are normalized simulation regimes, not gas-production rates.
 */
export const CometActivityRegime =
  Object.freeze({
    DORMANT:
      'DORMANT',

    WEAK:
      'WEAK',

    MODERATE:
      'MODERATE',

    STRONG:
      'STRONG',

    EXTREME:
      'EXTREME',
  } as const);

export type CometActivityRegime =
  typeof CometActivityRegime[
    keyof typeof CometActivityRegime
  ];

export function cometActivityRegimeV1(
  activityIndex01:
    number,
): CometActivityRegime {

  if (
    !Number.isFinite(
      activityIndex01,
    ) ||
    activityIndex01 <
      0 ||
    activityIndex01 >
      1
  ) {
    throw new RangeError(
      'activityIndex01 must be inside [0, 1].',
    );
  }

  if (
    activityIndex01 <
    0.04
  ) {
    return CometActivityRegime
      .DORMANT;
  }

  if (
    activityIndex01 <
    0.15
  ) {
    return CometActivityRegime
      .WEAK;
  }

  if (
    activityIndex01 <
    0.35
  ) {
    return CometActivityRegime
      .MODERATE;
  }

  if (
    activityIndex01 <
    0.65
  ) {
    return CometActivityRegime
      .STRONG;
  }

  return CometActivityRegime
    .EXTREME;
}
