import {
  GiantMoonArchitectureRegime,
} from './giant-moon-architecture-regime';

import {
  GiantMoonSystemProfile,
} from './giant-moon-system-profile';

import {
  PlanetType,
} from './planet-type';

describe(
  'GiantMoonSystemProfile point 21.7',
  () => {
    it(
      'should preserve the relevant/minor split and giant-system summary counts',
      () => {
        const profile =
          new GiantMoonSystemProfile(
            2,
            PlanetType.GAS_GIANT,
            100,
            8,
            92,
            0.894,
            8,
            4,
            3,
            4,
            2,
            1,
            20,
            72,
            0.75,
            GiantMoonArchitectureRegime.RICH,
          );

        expect(
          profile.isApplicable,
        ).toBe(true);
        expect(
          profile.hasIrregularMinorPopulation,
        ).toBe(true);
      },
    );

    it(
      'should make giant specialization empty and non-applicable for rocky hosts',
      () => {
        const profile =
          new GiantMoonSystemProfile(
            1,
            PlanetType.ROCKY,
            3,
            2,
            1,
            0.7,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            GiantMoonArchitectureRegime.NOT_APPLICABLE,
          );

        expect(
          profile.isApplicable,
        ).toBe(false);
        expect(
          profile.hasIrregularMinorPopulation,
        ).toBe(false);
      },
    );

    it(
      'should reject an inconsistent giant minor-population split',
      () => {
        expect(
          () =>
            new GiantMoonSystemProfile(
              2,
              PlanetType.ICE_GIANT,
              35,
              8,
              27,
              1,
              8,
              3,
              4,
              4,
              1,
              1,
              10,
              10,
              0.5,
              GiantMoonArchitectureRegime.DEVELOPED,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
