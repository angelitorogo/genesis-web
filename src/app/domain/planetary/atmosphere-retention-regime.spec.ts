import {
  AtmosphereRetentionRegime,
  atmosphereRetentionRegimeForRetainedMoleInventoryFraction01,
} from './atmosphere-retention-regime';

describe(
  'AtmosphereRetentionRegime point 20.3',
  () => {
    it(
      'should freeze the five V1 atmospheric-retention regimes',
      () => {
        expect(
          Object.values(
            AtmosphereRetentionRegime,
          ),
        ).toEqual([
          'VACUUM',
          'SEVERELY_DEPLETED',
          'PARTIALLY_RETAINED',
          'WELL_RETAINED',
          'DEEP_ENVELOPE',
        ]);
      },
    );


    it(
      'should classify the frozen V1 retention boundaries and deep-envelope/vacuum semantics',
      () => {
        expect(
          atmosphereRetentionRegimeForRetainedMoleInventoryFraction01(
            0.09,
            false,
            false,
          ),
        ).toBe(
          AtmosphereRetentionRegime.SEVERELY_DEPLETED,
        );

        expect(
          atmosphereRetentionRegimeForRetainedMoleInventoryFraction01(
            0.10,
            false,
            false,
          ),
        ).toBe(
          AtmosphereRetentionRegime.PARTIALLY_RETAINED,
        );

        expect(
          atmosphereRetentionRegimeForRetainedMoleInventoryFraction01(
            0.75,
            false,
            false,
          ),
        ).toBe(
          AtmosphereRetentionRegime.WELL_RETAINED,
        );

        expect(
          atmosphereRetentionRegimeForRetainedMoleInventoryFraction01(
            0.9,
            false,
            true,
          ),
        ).toBe(
          AtmosphereRetentionRegime.DEEP_ENVELOPE,
        );

        expect(
          atmosphereRetentionRegimeForRetainedMoleInventoryFraction01(
            0,
            true,
            false,
          ),
        ).toBe(
          AtmosphereRetentionRegime.VACUUM,
        );
      },
    );
  },
);
