const CONSISTENCY_TOLERANCE =
  1e-9;

const V1_MEANINGFUL_PHASE_FRACTION =
  0.08;

/**
 * Point-20.7 coarse phase distribution of the modeled accessible water inventory.
 *
 * These regimes describe the water made available to the point-20.7 surface
 * hydrosphere proxy. They are not claims about local weather, clouds, rivers,
 * groundwater or detailed ocean circulation.
 */
export enum PlanetWaterPhaseRegime {
  NONE =
    'NONE',

  ICE =
    'ICE',

  LIQUID =
    'LIQUID',

  VAPOR =
    'VAPOR',

  ICE_AND_LIQUID =
    'ICE_AND_LIQUID',

  LIQUID_AND_VAPOR =
    'LIQUID_AND_VAPOR',

  ICE_AND_VAPOR =
    'ICE_AND_VAPOR',

  MIXED =
    'MIXED',

  DEEP_ENVELOPE =
    'DEEP_ENVELOPE',
}

export function planetWaterPhaseRegimeForFractions01(
  iceFraction01:
    number | null,

  liquidFraction01:
    number | null,

  vaporFraction01:
    number | null,

  isDeepEnvelope:
    boolean,
): PlanetWaterPhaseRegime {

  if (
    isDeepEnvelope
  ) {
    if (
      iceFraction01 !==
        null ||
      liquidFraction01 !==
        null ||
      vaporFraction01 !==
        null
    ) {
      throw new RangeError(
        'Deep-envelope water-phase classification requires null solid-surface phase fractions.',
      );
    }

    return PlanetWaterPhaseRegime.DEEP_ENVELOPE;
  }

  assertNormalized(
    iceFraction01,
    'iceFraction01',
  );

  assertNormalized(
    liquidFraction01,
    'liquidFraction01',
  );

  assertNormalized(
    vaporFraction01,
    'vaporFraction01',
  );

  const total =
    iceFraction01! +
    liquidFraction01! +
    vaporFraction01!;

  if (
    total <=
    CONSISTENCY_TOLERANCE
  ) {
    return PlanetWaterPhaseRegime.NONE;
  }

  if (
    Math.abs(
      total -
      1,
    ) >
    CONSISTENCY_TOLERANCE
  ) {
    throw new RangeError(
      'Non-empty point-20.7 water phase fractions must sum to 1.',
    );
  }

  const icePresent =
    iceFraction01! >=
    V1_MEANINGFUL_PHASE_FRACTION;

  const liquidPresent =
    liquidFraction01! >=
    V1_MEANINGFUL_PHASE_FRACTION;

  const vaporPresent =
    vaporFraction01! >=
    V1_MEANINGFUL_PHASE_FRACTION;

  if (
    icePresent &&
    liquidPresent &&
    vaporPresent
  ) {
    return PlanetWaterPhaseRegime.MIXED;
  }

  if (
    icePresent &&
    liquidPresent
  ) {
    return PlanetWaterPhaseRegime.ICE_AND_LIQUID;
  }

  if (
    liquidPresent &&
    vaporPresent
  ) {
    return PlanetWaterPhaseRegime.LIQUID_AND_VAPOR;
  }

  if (
    icePresent &&
    vaporPresent
  ) {
    return PlanetWaterPhaseRegime.ICE_AND_VAPOR;
  }

  if (
    liquidFraction01! >=
      iceFraction01! &&
    liquidFraction01! >=
      vaporFraction01!
  ) {
    return PlanetWaterPhaseRegime.LIQUID;
  }

  if (
    iceFraction01! >=
    vaporFraction01!
  ) {
    return PlanetWaterPhaseRegime.ICE;
  }

  return PlanetWaterPhaseRegime.VAPOR;
}

function assertNormalized(
  value:
    number | null,

  propertyName:
    string,
): void {

  if (
    value ===
      null ||
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${propertyName} must be finite and in [0, 1].`,
    );
  }
}
