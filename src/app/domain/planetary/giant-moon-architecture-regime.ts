/**
 * Point-21.7 qualitative architecture of a gas/ice-giant satellite system.
 */
export enum GiantMoonArchitectureRegime {
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  DEPLETED = 'DEPLETED',
  SPARSE = 'SPARSE',
  DEVELOPED = 'DEVELOPED',
  RICH = 'RICH',
  COMPLEX = 'COMPLEX',
}

export function giantMoonArchitectureRegimeV1(
  isGiantHost:
    boolean,

  moonCount:
    number,

  richnessIndex01:
    number,
): GiantMoonArchitectureRegime {
  if (
    !Number.isInteger(
      moonCount,
    ) ||
    moonCount <
      0
  ) {
    throw new RangeError(
      'moonCount must be a non-negative integer.',
    );
  }

  if (
    !Number.isFinite(
      richnessIndex01,
    ) ||
    richnessIndex01 <
      0 ||
    richnessIndex01 >
      1
  ) {
    throw new RangeError(
      'richnessIndex01 must be finite in [0, 1].',
    );
  }

  if (
    !isGiantHost
  ) {
    return GiantMoonArchitectureRegime.NOT_APPLICABLE;
  }

  if (
    moonCount ===
    0
  ) {
    return GiantMoonArchitectureRegime.DEPLETED;
  }

  if (
    richnessIndex01 <
    0.30
  ) {
    return GiantMoonArchitectureRegime.SPARSE;
  }

  if (
    richnessIndex01 <
    0.60
  ) {
    return GiantMoonArchitectureRegime.DEVELOPED;
  }

  if (
    richnessIndex01 <
    0.82
  ) {
    return GiantMoonArchitectureRegime.RICH;
  }

  return GiantMoonArchitectureRegime.COMPLEX;
}
