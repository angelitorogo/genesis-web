import {
  AtmosphereGas,
} from './atmosphere-gas';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-20.3 retention result for one gas species from the point-20.2 source
 * atmosphere.
 *
 * sourceMoleFraction01 is frozen from point 20.2. retentionFraction01 and
 * lossFraction01 describe the fraction of that species' source inventory that
 * survives/is lost. retainedMoleFraction01 is the normalized composition of the
 * surviving atmosphere after all species have been filtered.
 */
export class AtmosphereGasRetention {

  constructor(
    readonly gas:
      AtmosphereGas,

    readonly sourceMoleFraction01:
      number,

    readonly retentionFraction01:
      number,

    readonly lossFraction01:
      number,

    readonly retainedMoleFraction01:
      number,
  ) {
    if (
      !Object.values(
        AtmosphereGas,
      ).includes(
        gas,
      )
    ) {
      throw new RangeError(
        'AtmosphereGasRetention requires a known AtmosphereGas.',
      );
    }

    assertPositiveNormalized(
      sourceMoleFraction01,
      'sourceMoleFraction01',
    );

    assertNormalized(
      retentionFraction01,
      'retentionFraction01',
    );

    assertNormalized(
      lossFraction01,
      'lossFraction01',
    );

    assertNormalized(
      retainedMoleFraction01,
      'retainedMoleFraction01',
    );

    if (
      !approximatelyEqual(
        retentionFraction01 +
          lossFraction01,
        1,
      )
    ) {
      throw new RangeError(
        'Point-20.3 gas retention and loss fractions must sum to 1.',
      );
    }

    if (
      retentionFraction01 ===
        0 &&
      retainedMoleFraction01 !==
        0
    ) {
      throw new RangeError(
        'A fully lost point-20.3 gas species cannot have a retained mole fraction.',
      );
    }
  }

  get isFullyLost():
    boolean {

    return this
      .retentionFraction01 ===
      0;
  }

  get isFullyRetained():
    boolean {

    return this
      .retentionFraction01 ===
      1;
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
      `${propertyName} must be finite and in [0, 1]: ${value}.`,
    );
  }
}

function assertPositiveNormalized(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${propertyName} must be finite and in (0, 1]: ${value}.`,
    );
  }
}

function approximatelyEqual(
  left:
    number,

  right:
    number,
): boolean {

  const scale =
    Math.max(
      1,
      Math.abs(
        left,
      ),
      Math.abs(
        right,
      ),
    );

  return (
    Math.abs(
      left -
      right,
    ) <=
    CONSISTENCY_TOLERANCE *
      scale
  );
}
