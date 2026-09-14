import {
  WorldEarthComparisonAssembler,
} from './world-earth-comparison';

describe(
  'WorldEarthComparisonAssembler point 26.9',
  () => {

    it(
      'should preserve linear diameter ratios while normalizing the larger body to 100 percent',
      () => {
        const larger =
          WorldEarthComparisonAssembler
            .build({
              worldLabel:
                'Mundo grande',
              massEarth:
                8,
              radiusEarth:
                2,
              densityGramsPerCubicCentimeter:
                4.2,
              surfaceGravityEarth:
                2,
            });

        expect(
          larger.worldDiameterPercent,
        ).toBe(100);
        expect(
          larger.earthDiameterPercent,
        ).toBe(50);
        expect(
          larger.surfaceAreaEarth,
        ).toBe(4);
        expect(
          larger.volumeEarth,
        ).toBe(8);

        const smaller =
          WorldEarthComparisonAssembler
            .build({
              worldLabel:
                'Mundo pequeño',
              massEarth:
                0.012,
              radiusEarth:
                0.27,
              densityGramsPerCubicCentimeter:
                3.3,
              surfaceGravityEarth:
                0.165,
            });

        expect(
          smaller.earthDiameterPercent,
        ).toBe(100);
        expect(
          smaller.worldDiameterPercent,
        ).toBeCloseTo(
          27,
          8,
        );
        expect(
          smaller.surfaceAreaEarth,
        ).toBeCloseTo(
          0.0729,
          8,
        );
        expect(
          smaller.volumeEarth,
        ).toBeCloseTo(
          0.019683,
          8,
        );
      },
    );

    it(
      'should compare density against the fixed Earth reference without mutating physical input',
      () => {
        const result =
          WorldEarthComparisonAssembler
            .build({
              worldLabel:
                'Tierra de control',
              massEarth:
                1,
              radiusEarth:
                1,
              densityGramsPerCubicCentimeter:
                5.514,
              surfaceGravityEarth:
                1,
            });

        expect(result.densityEarth).toBe(1);
        expect(result.surfaceAreaEarth).toBe(1);
        expect(result.volumeEarth).toBe(1);
        expect(result.earthDiameterPercent).toBe(100);
        expect(result.worldDiameterPercent).toBe(100);
        expect(Object.isFrozen(result)).toBe(true);
      },
    );

    it(
      'should reject invalid comparison inputs',
      () => {
        expect(
          () =>
            WorldEarthComparisonAssembler
              .build({
                worldLabel:
                  'Inválido',
                massEarth:
                  1,
                radiusEarth:
                  0,
                densityGramsPerCubicCentimeter:
                  5,
                surfaceGravityEarth:
                  1,
              }),
        ).toThrow(
          /radiusEarth/,
        );
      },
    );
  },
);
