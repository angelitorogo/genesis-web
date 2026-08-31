/**
 * Point-22.6 bound-comet orbital-period family.
 *
 * V1 follows the conventional 200-year split: SHORT_PERIOD is strictly below
 * 200 Julian years; LONG_PERIOD is 200 years or longer. Hyperbolic/unbound
 * trajectories remain reserved for point 22.8.
 */
export const CometPeriodRegime =
  Object.freeze({
    SHORT_PERIOD:
      'SHORT_PERIOD',

    LONG_PERIOD:
      'LONG_PERIOD',
  } as const);

export type CometPeriodRegime =
  typeof CometPeriodRegime[
    keyof typeof CometPeriodRegime
  ];

export const COMET_SHORT_PERIOD_LIMIT_YEARS =
  200;

export function cometPeriodRegimeV1(
  orbitalPeriodYears:
    number,
): CometPeriodRegime {

  if (
    !Number.isFinite(
      orbitalPeriodYears,
    ) ||
    orbitalPeriodYears <=
      0
  ) {
    throw new RangeError(
      'orbitalPeriodYears must be positive and finite.',
    );
  }

  return orbitalPeriodYears <
    COMET_SHORT_PERIOD_LIMIT_YEARS
    ? CometPeriodRegime
        .SHORT_PERIOD
    : CometPeriodRegime
        .LONG_PERIOD;
}
