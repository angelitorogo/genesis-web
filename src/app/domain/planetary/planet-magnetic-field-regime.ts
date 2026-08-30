/**
 * Point-20.9 coarse intrinsic planetary magnetic-field families.
 *
 * These regimes describe the present V1 dynamo/field proxy only. They are not
 * measurements in tesla/gauss and they do not by themselves imply a particular
 * surface-radiation environment; point 20.10 owns that downstream assessment.
 */
export enum PlanetMagneticFieldRegime {
  NONE =
    'NONE',

  WEAK =
    'WEAK',

  MODERATE =
    'MODERATE',

  STRONG =
    'STRONG',

  VERY_STRONG =
    'VERY_STRONG',
}

export function planetMagneticFieldRegimeForIndex01(
  fieldIndex01:
    number,
): PlanetMagneticFieldRegime {

  assertNormalized(
    fieldIndex01,
  );

  if (
    fieldIndex01 <
    0.08
  ) {
    return PlanetMagneticFieldRegime
      .NONE;
  }

  if (
    fieldIndex01 <
    0.30
  ) {
    return PlanetMagneticFieldRegime
      .WEAK;
  }

  if (
    fieldIndex01 <
    0.50
  ) {
    return PlanetMagneticFieldRegime
      .MODERATE;
  }

  if (
    fieldIndex01 <
    0.72
  ) {
    return PlanetMagneticFieldRegime
      .STRONG;
  }

  return PlanetMagneticFieldRegime
    .VERY_STRONG;
}

function assertNormalized(
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
      `fieldIndex01 must be finite and in [0, 1]: ${value}.`,
    );
  }
}
