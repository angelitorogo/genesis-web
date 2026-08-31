import {
  CometOrbitalElements,
} from './comet-orbital-elements';

import {
  CometPeriodRegime,
} from './comet-period-regime';

describe(
  'CometOrbitalElements point 22.6 V1',
  () => {
    it(
      'should preserve one bound Keplerian short-period orbit and expose its apsides',
      () => {
        const orbit =
          new CometOrbitalElements(
            1,
            1,
            4,
            0.75,
            15,
            20,
            30,
            40,
            8,
            CometPeriodRegime
              .SHORT_PERIOD,
          );

        expect(
          orbit.periapsisAu,
        ).toBe(1);

        expect(
          orbit.apoapsisAu,
        ).toBe(7);
      },
    );

    it(
      'should reject unbound eccentricity, inconsistent period or regime',
      () => {
        expect(
          () =>
            new CometOrbitalElements(
              1,
              1,
              4,
              1,
              0,
              0,
              0,
              0,
              8,
              CometPeriodRegime
                .SHORT_PERIOD,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new CometOrbitalElements(
              1,
              1,
              4,
              0.5,
              0,
              0,
              0,
              0,
              9,
              CometPeriodRegime
                .SHORT_PERIOD,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new CometOrbitalElements(
              1,
              1,
              100,
              0.9,
              0,
              0,
              0,
              0,
              1_000,
              CometPeriodRegime
                .SHORT_PERIOD,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
