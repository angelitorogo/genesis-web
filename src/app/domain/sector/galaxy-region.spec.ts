import {
  GalaxyRegion,
} from './galaxy-region';

describe(
  'GalaxyRegion',
  () => {
    it(
      'should preserve the frozen V1 codes',
      () => {
        expect(
          GalaxyRegion
            .CENTRAL
            .code,
        ).toBe(
          1,
        );

        expect(
          GalaxyRegion
            .INNER
            .code,
        ).toBe(
          2,
        );

        expect(
          GalaxyRegion
            .MIDDLE
            .code,
        ).toBe(
          3,
        );

        expect(
          GalaxyRegion
            .OUTER
            .code,
        ).toBe(
          4,
        );

        expect(
          GalaxyRegion
            .OUTSIDE_NOMINAL
            .code,
        ).toBe(
          5,
        );
      },
    );

    it(
      'should expose every canonical region exactly once',
      () => {
        expect(
          GalaxyRegion.values,
        ).toEqual([
          GalaxyRegion.CENTRAL,
          GalaxyRegion.INNER,
          GalaxyRegion.MIDDLE,
          GalaxyRegion.OUTER,
          GalaxyRegion.OUTSIDE_NOMINAL,
        ]);
      },
    );

    it(
      'should resolve known codes',
      () => {
        expect(
          GalaxyRegion
            .fromCode(
              1,
            ),
        ).toBe(
          GalaxyRegion.CENTRAL,
        );

        expect(
          GalaxyRegion
            .fromCode(
              5,
            ),
        ).toBe(
          GalaxyRegion
            .OUTSIDE_NOMINAL,
        );
      },
    );

    it(
      'should return null for an unknown code',
      () => {
        expect(
          GalaxyRegion
            .fromCodeOrNull(
              999,
            ),
        ).toBeNull();
      },
    );

    it(
      'should reject an unknown code',
      () => {
        expect(
          () =>
            GalaxyRegion
              .fromCode(
                999,
              ),
        ).toThrow(
          'Unknown GalaxyRegion code: 999.',
        );
      },
    );
  },
);