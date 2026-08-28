import {
  stellarVisualRadiusScale,
} from './stellar-visual-radius-scale';

describe(
  'stellarVisualRadiusScale point 16.7',
  () => {
    it(
      'should keep one solar radius as the neutral visual size',
      () => {
        expect(
          stellarVisualRadiusScale(
            1,
          ),
        ).toBe(1);
      },
    );

    it(
      'should preserve physical ordering while compressing extreme radius differences',
      () => {
        const tiny =
          stellarVisualRadiusScale(
            0.01,
          );

        const small =
          stellarVisualRadiusScale(
            0.1,
          );

        const solar =
          stellarVisualRadiusScale(
            1,
          );

        const large =
          stellarVisualRadiusScale(
            10,
          );

        const giant =
          stellarVisualRadiusScale(
            1_000,
          );

        expect(tiny).toBeGreaterThanOrEqual(0.68);
        expect(tiny).toBeLessThan(small);
        expect(small).toBeLessThan(solar);
        expect(solar).toBeLessThan(large);
        expect(large).toBeLessThan(giant);
        expect(giant).toBeLessThanOrEqual(1.36);

        expect(
          giant /
            tiny,
        ).toBeLessThanOrEqual(2);
      },
    );

    it(
      'should make ordinary sub-solar and super-solar radii visibly different without making them literal-scale',
      () => {
        expect(
          stellarVisualRadiusScale(
            0.1,
          ),
        ).toBeLessThan(0.75);

        expect(
          stellarVisualRadiusScale(
            10,
          ),
        ).toBeGreaterThan(1.25);
      },
    );

    it(
      'should fall back to the neutral scale for invalid presentation input',
      () => {
        expect(
          stellarVisualRadiusScale(
            0,
          ),
        ).toBe(1);

        expect(
          stellarVisualRadiusScale(
            Number.NaN,
          ),
        ).toBe(1);
      },
    );
  },
);
