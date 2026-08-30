import {
  AtmosphereGas,
} from './atmosphere-gas';

import {
  AtmosphereGreenhouseGasContribution,
} from './atmosphere-greenhouse-gas-contribution';

describe(
  'AtmosphereGreenhouseGasContribution point 20.4',
  () => {
    it(
      'should preserve a traceable retained-mole weighted contribution',
      () => {
        const contribution =
          new AtmosphereGreenhouseGasContribution(
            AtmosphereGas.METHANE,
            0.02,
            4,
            0.08,
          );

        expect(
          contribution.weightedMoleFraction,
        ).toBe(0.08);
      },
    );

    it(
      'should reject inconsistent or non-positive contribution inputs',
      () => {
        expect(
          () =>
            new AtmosphereGreenhouseGasContribution(
              AtmosphereGas.CARBON_DIOXIDE,
              0.1,
              1,
              0.2,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new AtmosphereGreenhouseGasContribution(
              AtmosphereGas.CARBON_DIOXIDE,
              0.1,
              0,
              0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
