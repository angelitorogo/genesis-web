const SIGNED_INT_MAX =
  2147483647;

/**
 * Physical structural parameters of a galaxy.
 *
 * Values such as concentration, flattening, asymmetry and bar strength are
 * normalized physical descriptors. They are not rendering parameters.
 *
 * Visual Three.js structure belongs to a later roadmap point.
 */
export class GalaxyStructure {

  constructor(
    readonly centralConcentration:
      number,

    readonly flattening:
      number,

    readonly asymmetry:
      number,

    readonly barStrength:
      number,

    readonly spiralArmCount:
      number,
  ) {
    assertNormalized(
      centralConcentration,
      'centralConcentration',
    );

    assertNormalized(
      flattening,
      'flattening',
    );

    assertNormalized(
      asymmetry,
      'asymmetry',
    );

    assertNormalized(
      barStrength,
      'barStrength',
    );

    if (
      !Number.isInteger(
        spiralArmCount,
      ) ||
      spiralArmCount <
        0 ||
      spiralArmCount >
        SIGNED_INT_MAX
    ) {
      throw new RangeError(
        `spiralArmCount must be a non-negative signed Int: ${spiralArmCount}.`,
      );
    }
  }
}

function assertNormalized(
  value:
    number,

  propertyName:
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
      `${propertyName} must be finite and in range [0, 1]: ${value}.`,
    );
  }
}