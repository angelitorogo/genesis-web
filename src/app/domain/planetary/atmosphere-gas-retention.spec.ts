import {
  AtmosphereGas,
} from './atmosphere-gas';

import {
  AtmosphereGasRetention,
} from './atmosphere-gas-retention';

describe(
  'AtmosphereGasRetention point 20.3',
  () => {
    it(
      'should expose one normalized source/retained gas diagnostic',
      () => {
        const retention =
          new AtmosphereGasRetention(
            AtmosphereGas.NITROGEN,
            0.8,
            0.9,
            0.1,
            0.75,
          );

        expect(
          retention.gas,
        ).toBe(
          AtmosphereGas.NITROGEN,
        );

        expect(
          retention.isFullyLost,
        ).toBe(false);

        expect(
          retention.isFullyRetained,
        ).toBe(false);
      },
    );

    it(
      'should reject invalid or internally inconsistent fractions',
      () => {
        expect(
          () =>
            new AtmosphereGasRetention(
              AtmosphereGas.HELIUM,
              0.5,
              0.4,
              0.4,
              0.5,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new AtmosphereGasRetention(
              AtmosphereGas.HELIUM,
              0.5,
              0,
              1,
              0.2,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
