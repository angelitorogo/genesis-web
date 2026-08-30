/**
 * Point-21.5 first-order retained atmosphere regime for one relevant moon.
 *
 * These labels describe relative retention/column support only. They are not
 * pressure measurements and do not imply a particular gas composition.
 */
export enum MoonAtmosphereRegime {
  NONE = 'NONE',
  EXOSPHERE = 'EXOSPHERE',
  TRACE = 'TRACE',
  THIN = 'THIN',
  SUBSTANTIAL = 'SUBSTANTIAL',
}

export function moonAtmosphereRegimeForRetentionIndex01(
  atmosphereRetentionIndex01:
    number,
): MoonAtmosphereRegime {
  assertUnitInterval(
    atmosphereRetentionIndex01,
  );

  if (
    atmosphereRetentionIndex01 <
    0.06
  ) {
    return MoonAtmosphereRegime.NONE;
  }

  if (
    atmosphereRetentionIndex01 <
    0.20
  ) {
    return MoonAtmosphereRegime.EXOSPHERE;
  }

  if (
    atmosphereRetentionIndex01 <
    0.35
  ) {
    return MoonAtmosphereRegime.TRACE;
  }

  if (
    atmosphereRetentionIndex01 <
    0.42
  ) {
    return MoonAtmosphereRegime.THIN;
  }

  return MoonAtmosphereRegime.SUBSTANTIAL;
}

function assertUnitInterval(
  value:
    number,
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
      'atmosphereRetentionIndex01 must be finite in [0, 1].',
    );
  }
}
