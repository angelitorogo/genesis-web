import {
  AtmosphereGas,
} from './atmosphere-gas';

/**
 * One point-20.2 gas component expressed as a mole/volume fraction.
 */
export class AtmosphereGasComponent {

  constructor(
    readonly gas:
      AtmosphereGas,

    readonly moleFraction01:
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
        'AtmosphereGasComponent requires a known AtmosphereGas.',
      );
    }

    if (
      !Number.isFinite(
        moleFraction01,
      ) ||
      moleFraction01 <=
        0 ||
      moleFraction01 >
        1
    ) {
      throw new RangeError(
        `moleFraction01 must be finite and in (0, 1]: ${moleFraction01}.`,
      );
    }
  }
}
