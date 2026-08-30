import {
  GiantMoonArchitectureRegime,
  giantMoonArchitectureRegimeV1,
} from './giant-moon-architecture-regime';

describe(
  'GiantMoonArchitectureRegime point 21.7',
  () => {
    it(
      'should distinguish non-applicable, depleted and progressively richer giant systems',
      () => {
        expect(
          giantMoonArchitectureRegimeV1(
            false,
            3,
            0.5,
          ),
        ).toBe(
          GiantMoonArchitectureRegime.NOT_APPLICABLE,
        );

        expect(
          giantMoonArchitectureRegimeV1(
            true,
            0,
            0,
          ),
        ).toBe(
          GiantMoonArchitectureRegime.DEPLETED,
        );

        expect(
          giantMoonArchitectureRegimeV1(
            true,
            5,
            0.2,
          ),
        ).toBe(
          GiantMoonArchitectureRegime.SPARSE,
        );

        expect(
          giantMoonArchitectureRegimeV1(
            true,
            20,
            0.5,
          ),
        ).toBe(
          GiantMoonArchitectureRegime.DEVELOPED,
        );

        expect(
          giantMoonArchitectureRegimeV1(
            true,
            50,
            0.7,
          ),
        ).toBe(
          GiantMoonArchitectureRegime.RICH,
        );

        expect(
          giantMoonArchitectureRegimeV1(
            true,
            100,
            0.9,
          ),
        ).toBe(
          GiantMoonArchitectureRegime.COMPLEX,
        );
      },
    );
  },
);
