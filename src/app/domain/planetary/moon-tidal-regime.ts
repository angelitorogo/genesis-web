/**
 * Point-21.4 qualitative heating/activity regime produced by sustained tides.
 *
 * This is deliberately an ordinal interpretation of a normalized proxy, not a
 * heat flux in W/m². Point 21.5 may consume the regime/index when estimating
 * lunar geology, but must not reinterpret it as an absolute thermal budget.
 */
export enum MoonTidalRegime {
  NEGLIGIBLE = 'NEGLIGIBLE',
  WEAK = 'WEAK',
  MODERATE = 'MODERATE',
  STRONG = 'STRONG',
  EXTREME = 'EXTREME',
}

export function moonTidalRegimeForHeatingIndex01(
  tidalHeatingIndex01:
    number,
): MoonTidalRegime {

  assertUnitInterval(
    tidalHeatingIndex01,
    'tidalHeatingIndex01',
  );

  if (
    tidalHeatingIndex01 <
    0.05
  ) {
    return MoonTidalRegime.NEGLIGIBLE;
  }

  if (
    tidalHeatingIndex01 <
    0.20
  ) {
    return MoonTidalRegime.WEAK;
  }

  if (
    tidalHeatingIndex01 <
    0.45
  ) {
    return MoonTidalRegime.MODERATE;
  }

  if (
    tidalHeatingIndex01 <
    0.75
  ) {
    return MoonTidalRegime.STRONG;
  }

  return MoonTidalRegime.EXTREME;
}

function assertUnitInterval(
  value:
    number,

  label:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${label} must be finite in [0, 1].`,
    );
  }
}
