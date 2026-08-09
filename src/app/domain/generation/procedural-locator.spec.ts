import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  SectorLocator,
  SystemLocator,
} from './procedural-locator';

describe(
  'ProceduralLocator',
  () => {
    const LONG_MIN =
      -(1n << 63n);

    const LONG_MAX =
      (1n << 63n) - 1n;

    it(
      'should preserve the canonical Android locator hierarchy',
      () => {
        expect(
          new GalaxyLocator(
            0n,
          ),
        ).toEqual({
          galaxyIndex:
            0n,
        });

        expect(
          new SectorLocator(
            0n,
            123456789n,
          ),
        ).toEqual({
          galaxyIndex:
            0n,

          sectorKey:
            123456789n,
        });

        expect(
          new GalacticObjectLocator(
            0n,
            123456789n,
            7n,
          ),
        ).toEqual({
          galaxyIndex:
            0n,

          sectorKey:
            123456789n,

          galacticObjectIndex:
            7n,
        });

        expect(
          new SystemLocator(
            0n,
            123456789n,
            7n,
          ),
        ).toEqual({
          galaxyIndex:
            0n,

          sectorKey:
            123456789n,

          galacticObjectIndex:
            7n,
        });

        expect(
          new BodyLocator(
            0n,
            123456789n,
            7n,
            3n,
          ),
        ).toEqual({
          galaxyIndex:
            0n,

          sectorKey:
            123456789n,

          galacticObjectIndex:
            7n,

          bodyIndex:
            3n,
        });

        expect(
          new CivilizationLocator(
            0n,
            123456789n,
            7n,
            3n,
            1n,
          ),
        ).toEqual({
          galaxyIndex:
            0n,

          sectorKey:
            123456789n,

          galacticObjectIndex:
            7n,

          bodyIndex:
            3n,

          civilizationIndex:
            1n,
        });
      },
    );

    it(
      'should reject a negative galaxy index',
      () => {
        expect(
          () =>
            new GalaxyLocator(
              -1n,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a galaxy index above Long.MAX_VALUE',
      () => {
        expect(
          () =>
            new GalaxyLocator(
              LONG_MAX +
                1n,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should accept Long.MIN_VALUE as sectorKey',
      () => {
        expect(
          new SectorLocator(
            0n,
            LONG_MIN,
          ).sectorKey,
        ).toBe(
          LONG_MIN,
        );
      },
    );

    it(
      'should accept Long.MAX_VALUE as sectorKey',
      () => {
        expect(
          new SectorLocator(
            0n,
            LONG_MAX,
          ).sectorKey,
        ).toBe(
          LONG_MAX,
        );
      },
    );

    it(
      'should reject a sectorKey outside the Long range',
      () => {
        expect(
          () =>
            new SectorLocator(
              0n,
              LONG_MAX +
                1n,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new SectorLocator(
              0n,
              LONG_MIN -
                1n,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a negative galactic object index',
      () => {
        expect(
          () =>
            new GalacticObjectLocator(
              0n,
              0n,
              -1n,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a galactic object index above Long.MAX_VALUE',
      () => {
        expect(
          () =>
            new SystemLocator(
              0n,
              0n,
              LONG_MAX +
                1n,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a negative body index',
      () => {
        expect(
          () =>
            new BodyLocator(
              0n,
              0n,
              0n,
              -1n,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a negative civilization index',
      () => {
        expect(
          () =>
            new CivilizationLocator(
              0n,
              0n,
              0n,
              0n,
              -1n,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should preserve the exact SystemLocator field names',
      () => {
        const locator =
          new SystemLocator(
            5n,
            -9n,
            12n,
          );

        expect(
          Object.keys(
            locator,
          ),
        ).toEqual([
          'galaxyIndex',
          'sectorKey',
          'galacticObjectIndex',
        ]);
      },
    );

    it(
      'should not store universe identity, version or target seed',
      () => {
        const locator =
          new CivilizationLocator(
            0n,
            123456789n,
            7n,
            3n,
            1n,
          );

        expect(
          Object.keys(
            locator,
          ),
        ).toEqual([
          'galaxyIndex',
          'sectorKey',
          'galacticObjectIndex',
          'bodyIndex',
          'civilizationIndex',
        ]);
      },
    );
  },
);