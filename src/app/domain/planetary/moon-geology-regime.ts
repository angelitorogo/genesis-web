/**
 * Point-21.5 approximate present-day geological activity regime for one moon.
 */
export enum MoonGeologyRegime {
  INERT = 'INERT',
  LOW_ACTIVITY = 'LOW_ACTIVITY',
  ACTIVE = 'ACTIVE',
  TIDALLY_ACTIVE = 'TIDALLY_ACTIVE',
  EXTREME = 'EXTREME',
}

export function moonGeologyRegimeV1(
  geologicalActivityIndex01:
    number,

  tidalHeatingIndex01:
    number,
): MoonGeologyRegime {
  assertUnitInterval(
    geologicalActivityIndex01,
    'geologicalActivityIndex01',
  );

  assertUnitInterval(
    tidalHeatingIndex01,
    'tidalHeatingIndex01',
  );

  if (
    geologicalActivityIndex01 <
    0.10
  ) {
    return MoonGeologyRegime.INERT;
  }

  if (
    geologicalActivityIndex01 <
    0.28
  ) {
    return MoonGeologyRegime.LOW_ACTIVITY;
  }

  if (
    geologicalActivityIndex01 >=
      0.85 ||
    tidalHeatingIndex01 >=
      0.90
  ) {
    return MoonGeologyRegime.EXTREME;
  }

  if (
    tidalHeatingIndex01 >=
    0.45
  ) {
    return MoonGeologyRegime.TIDALLY_ACTIVE;
  }

  return MoonGeologyRegime.ACTIVE;
}

function assertUnitInterval(
  value:
    number,

  name:
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
      `${name} must be finite in [0, 1].`,
    );
  }
}
