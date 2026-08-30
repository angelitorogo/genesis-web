/**
 * Point-20.3 coarse long-term atmospheric-retention regimes.
 *
 * The regime classifies the surviving fraction of the point-20.2 source gas
 * inventory. DEEP_ENVELOPE remains distinct because phase-19 mini-Neptunes and
 * giants do not expose a solid surface pressure in the current model.
 */
export enum AtmosphereRetentionRegime {
  VACUUM =
    'VACUUM',

  SEVERELY_DEPLETED =
    'SEVERELY_DEPLETED',

  PARTIALLY_RETAINED =
    'PARTIALLY_RETAINED',

  WELL_RETAINED =
    'WELL_RETAINED',

  DEEP_ENVELOPE =
    'DEEP_ENVELOPE',
}

export const ATMOSPHERE_V1_SEVERE_RETENTION_MAX =
  0.10;

export const ATMOSPHERE_V1_PARTIAL_RETENTION_MAX =
  0.75;

export function atmosphereRetentionRegimeForRetainedMoleInventoryFraction01(
  retainedMoleInventoryFraction01:
    number,

  sourceVacuum:
    boolean,

  deepEnvelope:
    boolean,
): AtmosphereRetentionRegime {

  if (
    !Number.isFinite(
      retainedMoleInventoryFraction01,
    ) ||
    retainedMoleInventoryFraction01 <
      0 ||
    retainedMoleInventoryFraction01 >
      1
  ) {
    throw new RangeError(
      'retainedMoleInventoryFraction01 must be finite and in [0, 1].',
    );
  }

  if (
    sourceVacuum
  ) {
    if (
      retainedMoleInventoryFraction01 !==
      0 ||
      deepEnvelope
    ) {
      throw new RangeError(
        'A point-20.3 vacuum source must have zero retained inventory and cannot be a deep envelope.',
      );
    }

    return AtmosphereRetentionRegime.VACUUM;
  }

  if (
    deepEnvelope
  ) {
    return AtmosphereRetentionRegime.DEEP_ENVELOPE;
  }

  if (
    retainedMoleInventoryFraction01 <
    ATMOSPHERE_V1_SEVERE_RETENTION_MAX
  ) {
    return AtmosphereRetentionRegime.SEVERELY_DEPLETED;
  }

  if (
    retainedMoleInventoryFraction01 <
    ATMOSPHERE_V1_PARTIAL_RETENTION_MAX
  ) {
    return AtmosphereRetentionRegime.PARTIALLY_RETAINED;
  }

  return AtmosphereRetentionRegime.WELL_RETAINED;
}
