import {
  AtmosphereGreenhouseRegime,
  atmosphereGreenhouseRegimeForOpticalDepthProxy,
} from './atmosphere-greenhouse-regime';

describe(
  'AtmosphereGreenhouseRegime point 20.4',
  () => {
    it(
      'should expose the frozen V1 regime set',
      () => {
        expect(
          Object.values(
            AtmosphereGreenhouseRegime,
          ),
        ).toEqual([
          'NONE',
          'NEGLIGIBLE',
          'WEAK',
          'MODERATE',
          'STRONG',
          'EXTREME',
          'DEEP_ENVELOPE',
        ]);
      },
    );

    it(
      'should classify the frozen optical-depth boundaries and deep envelopes',
      () => {
        expect(
          atmosphereGreenhouseRegimeForOpticalDepthProxy(
            0,
            false,
          ),
        ).toBe(
          AtmosphereGreenhouseRegime.NONE,
        );

        expect(
          atmosphereGreenhouseRegimeForOpticalDepthProxy(
            0.049,
            false,
          ),
        ).toBe(
          AtmosphereGreenhouseRegime.NEGLIGIBLE,
        );

        expect(
          atmosphereGreenhouseRegimeForOpticalDepthProxy(
            0.05,
            false,
          ),
        ).toBe(
          AtmosphereGreenhouseRegime.WEAK,
        );

        expect(
          atmosphereGreenhouseRegimeForOpticalDepthProxy(
            0.30,
            false,
          ),
        ).toBe(
          AtmosphereGreenhouseRegime.MODERATE,
        );

        expect(
          atmosphereGreenhouseRegimeForOpticalDepthProxy(
            1,
            false,
          ),
        ).toBe(
          AtmosphereGreenhouseRegime.STRONG,
        );

        expect(
          atmosphereGreenhouseRegimeForOpticalDepthProxy(
            3,
            false,
          ),
        ).toBe(
          AtmosphereGreenhouseRegime.EXTREME,
        );

        expect(
          atmosphereGreenhouseRegimeForOpticalDepthProxy(
            4,
            true,
          ),
        ).toBe(
          AtmosphereGreenhouseRegime.DEEP_ENVELOPE,
        );
      },
    );
  },
);
