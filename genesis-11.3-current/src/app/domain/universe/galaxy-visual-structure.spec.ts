import {
  GalaxyVisualArm,
  GalaxyVisualBar,
  GalaxyVisualRegionLayout,
  GalaxyVisualStructure,
  GalaxyWindingDirection,
} from './galaxy-visual-structure';

describe(
  'Galaxy visual structure models',
  () => {
    it(
      'should enforce strictly ordered normalized visual regions',
      () => {
        const layout =
          new GalaxyVisualRegionLayout(
            0.15,
            0.40,
            0.70,
            1.00,
            1.30,
          );

        expect(
          layout.nominalOuterRadiusNormalized,
        ).toBe(
          1.0,
        );

        expect(
          () =>
            new GalaxyVisualRegionLayout(
              0.15,
              0.40,
              0.70,
              0.99,
              1.30,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyVisualRegionLayout(
              0.15,
              0.40,
              0.70,
              1.00,
              1.00,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyVisualRegionLayout(
              Number.NaN,
              0.40,
              0.70,
              1.00,
              1.30,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should validate spiral arm geometry contracts',
      () => {
        const arm =
          new GalaxyVisualArm(
            0,
            1.0,
            20.0,
            0.25,
            0.90,
            0.04,
            0.90,
          );

        expect(
          arm.index,
        ).toBe(
          0,
        );

        const invalidFactories = [
          () =>
            new GalaxyVisualArm(
              -1,
              1.0,
              20.0,
              0.25,
              0.90,
              0.04,
              0.90,
            ),
          () =>
            new GalaxyVisualArm(
              0,
              2 * Math.PI,
              20.0,
              0.25,
              0.90,
              0.04,
              0.90,
            ),
          () =>
            new GalaxyVisualArm(
              0,
              1.0,
              0.0,
              0.25,
              0.90,
              0.04,
              0.90,
            ),
          () =>
            new GalaxyVisualArm(
              0,
              1.0,
              20.0,
              0.90,
              0.90,
              0.04,
              0.90,
            ),
          () =>
            new GalaxyVisualArm(
              0,
              1.0,
              20.0,
              0.25,
              0.90,
              0.25,
              0.90,
            ),
          () =>
            new GalaxyVisualArm(
              0,
              1.0,
              20.0,
              0.25,
              0.90,
              0.04,
              1.1,
            ),
        ];

        for (
          const invalidFactory of
          invalidFactories
        ) {
          expect(
            invalidFactory,
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should validate central bar geometry contracts',
      () => {
        const bar =
          new GalaxyVisualBar(
            1.0,
            0.30,
            0.05,
            0.80,
          );

        expect(
          bar.halfLengthNormalized,
        ).toBe(
          0.30,
        );

        expect(
          () =>
            new GalaxyVisualBar(
              2 * Math.PI,
              0.30,
              0.05,
              0.80,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyVisualBar(
              1.0,
              0.30,
              0.30,
              0.80,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyVisualBar(
              1.0,
              0.30,
              0.05,
              -0.01,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should validate consolidated visual structure geometry',
      () => {
        const layout =
          new GalaxyVisualRegionLayout(
            0.15,
            0.40,
            0.70,
            1.00,
            1.30,
          );

        const arms = [
          new GalaxyVisualArm(
            0,
            0.2,
            20.0,
            0.25,
            0.90,
            0.04,
            0.90,
          ),
          new GalaxyVisualArm(
            1,
            3.2,
            20.0,
            0.25,
            0.90,
            0.04,
            0.90,
          ),
        ];

        const visual =
          new GalaxyVisualStructure(
            1.5,
            GalaxyWindingDirection.CLOCKWISE,
            0.20,
            0.85,
            2.5,
            layout,
            null,
            arms,
          );

        expect(
          visual.arms,
        ).toHaveLength(
          2,
        );

        expect(
          Object.isFrozen(
            visual.arms,
          ),
        ).toBe(
          true,
        );

        expect(
          () =>
            new GalaxyVisualStructure(
              2 * Math.PI,
              GalaxyWindingDirection.CLOCKWISE,
              0.20,
              0.85,
              2.5,
              layout,
              null,
              arms,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should require consecutive arm indices starting from zero',
      () => {
        const layout =
          new GalaxyVisualRegionLayout(
            0.15,
            0.40,
            0.70,
            1.00,
            1.30,
          );

        expect(
          () =>
            new GalaxyVisualStructure(
              1.0,
              GalaxyWindingDirection.COUNTERCLOCKWISE,
              0.20,
              0.85,
              2.5,
              layout,
              null,
              [
                new GalaxyVisualArm(
                  1,
                  1.0,
                  20.0,
                  0.25,
                  0.90,
                  0.04,
                  0.90,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
