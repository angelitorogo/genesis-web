import {
  AtmosphereGas,
} from './atmosphere-gas';

const CONSISTENCY_TOLERANCE =
  1e-12;

/**
 * Point-20.4 traceable longwave contribution from one retained gas species.
 *
 * infraredWeight is a V1 effective longwave/CIA weight, not a laboratory
 * absorption coefficient. weightedMoleFraction is the species' retained mole
 * fraction multiplied by that weight and feeds the coarse optical-depth proxy.
 */
export class AtmosphereGreenhouseGasContribution {

  constructor(
    readonly gas:
      AtmosphereGas,

    readonly retainedMoleFraction01:
      number,

    readonly infraredWeight:
      number,

    readonly weightedMoleFraction:
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
        'AtmosphereGreenhouseGasContribution requires a known AtmosphereGas.',
      );
    }

    if (
      !Number.isFinite(
        retainedMoleFraction01,
      ) ||
      retainedMoleFraction01 <=
        0 ||
      retainedMoleFraction01 >
        1
    ) {
      throw new RangeError(
        `retainedMoleFraction01 must be finite and in (0, 1]: ${retainedMoleFraction01}.`,
      );
    }

    if (
      !Number.isFinite(
        infraredWeight,
      ) ||
      infraredWeight <=
        0
    ) {
      throw new RangeError(
        `infraredWeight must be finite and greater than 0: ${infraredWeight}.`,
      );
    }

    const expectedWeightedMoleFraction =
      retainedMoleFraction01 *
      infraredWeight;

    if (
      !approximatelyEqual(
        weightedMoleFraction,
        expectedWeightedMoleFraction,
      )
    ) {
      throw new RangeError(
        'weightedMoleFraction must equal retainedMoleFraction01 * infraredWeight.',
      );
    }
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
