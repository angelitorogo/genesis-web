/**
 * Point-20.2 coarse pressure regimes.
 *
 * DEEP_ENVELOPE is intentionally separate because mini-Neptunes and giants do
 * not expose a solid surface pressure in the phase-19 model.
 */
export enum AtmospherePressureRegime {
  VACUUM =
    'VACUUM',

  TRACE =
    'TRACE',

  THIN =
    'THIN',

  MODERATE =
    'MODERATE',

  DENSE =
    'DENSE',

  EXTREME =
    'EXTREME',

  DEEP_ENVELOPE =
    'DEEP_ENVELOPE',
}

export function atmospherePressureRegimeForSurfacePressurePascal(
  surfacePressurePascal:
    number,
): AtmospherePressureRegime {

  if (
    !Number.isFinite(
      surfacePressurePascal,
    ) ||
    surfacePressurePascal <
      0
  ) {
    throw new RangeError(
      'surfacePressurePascal must be finite and non-negative.',
    );
  }

  if (
    surfacePressurePascal ===
    0
  ) {
    return AtmospherePressureRegime.VACUUM;
  }

  if (
    surfacePressurePascal <
    100
  ) {
    return AtmospherePressureRegime.TRACE;
  }

  if (
    surfacePressurePascal <
    50_000
  ) {
    return AtmospherePressureRegime.THIN;
  }

  if (
    surfacePressurePascal <
    300_000
  ) {
    return AtmospherePressureRegime.MODERATE;
  }

  if (
    surfacePressurePascal <
    3_000_000
  ) {
    return AtmospherePressureRegime.DENSE;
  }

  return AtmospherePressureRegime.EXTREME;
}
