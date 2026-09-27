import {
  GalacticObjectLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GalaxyRegion,
} from '../../domain/sector/galaxy-region';

import {
  V2GalaxySectorContentLimiter,
} from './v2-galaxy-sector-content-limiter';

describe(
  'V2GalaxySectorContentLimiter',
  () => {
    it(
      'should group the concentric GalaxyRegion bands into 3 / 2 / 2 / 1 / 1 objects',
      () => {
        expect(
          V2GalaxySectorContentLimiter
            .maxObjectCountForRegion(
              GalaxyRegion.CENTRAL,
            ),
        ).toBe(3);

        expect(
          V2GalaxySectorContentLimiter
            .maxObjectCountForRegion(
              GalaxyRegion.INNER,
            ),
        ).toBe(2);

        expect(
          V2GalaxySectorContentLimiter
            .maxObjectCountForRegion(
              GalaxyRegion.MIDDLE,
            ),
        ).toBe(2);

        expect(
          V2GalaxySectorContentLimiter
            .maxObjectCountForRegion(
              GalaxyRegion.OUTER,
            ),
        ).toBe(1);

        expect(
          V2GalaxySectorContentLimiter
            .maxObjectCountForRegion(
              GalaxyRegion.OUTSIDE_NOMINAL,
            ),
        ).toBe(1);
      },
    );

    it(
      'should cap a dense central sector at three while preserving both populated families',
      () => {
        const result =
          V2GalaxySectorContentLimiter
            .limit(
              GalaxyRegion.CENTRAL,
              systems(15),
              objects(2),
            );

        expect(
          result.systemLocators.length +
          result.galacticObjectLocators.length,
        ).toBe(3);

        expect(
          result.systemLocators.length,
        ).toBeGreaterThan(0);

        expect(
          result.galacticObjectLocators.length,
        ).toBeGreaterThan(0);
      },
    );

    it(
      'should preserve compact sequential locator prefixes after limiting',
      () => {
        const result =
          V2GalaxySectorContentLimiter
            .limit(
              GalaxyRegion.INNER,
              systems(12),
              objects(4),
            );

        expect(
          result.systemLocators.map(
            (locator) =>
              locator.galacticObjectIndex,
          ),
        ).toEqual(
          Array.from(
            {
              length:
                result.systemLocators.length,
            },
            (
              _,
              index,
            ) =>
              BigInt(index),
          ),
        );

        expect(
          result.galacticObjectLocators.map(
            (locator) =>
              locator.galacticObjectIndex,
          ),
        ).toEqual(
          Array.from(
            {
              length:
                result.galacticObjectLocators.length,
            },
            (
              _,
              index,
            ) =>
              BigInt(index),
          ),
        );
      },
    );

    it(
      'should keep GalacticObject index zero when a central mixed sector is limited',
      () => {
        const result =
          V2GalaxySectorContentLimiter
            .limit(
              GalaxyRegion.CENTRAL,
              systems(20),
              objects(5),
            );

        expect(
          result.galacticObjectLocators.some(
            (locator) =>
              locator.galacticObjectIndex ===
              0n,
          ),
        ).toBe(true);
      },
    );

    it(
      'should leave a sector unchanged when it is already below its radial cap',
      () => {
        const result =
          V2GalaxySectorContentLimiter
            .limit(
              GalaxyRegion.MIDDLE,
              systems(1),
              objects(1),
            );

        expect(
          result.systemLocators,
        ).toEqual(
          systems(1),
        );

        expect(
          result.galacticObjectLocators,
        ).toEqual(
          objects(1),
        );
      },
    );
  },
);

function systems(
  count:
    number,
): readonly SystemLocator[] {
  return Array.from(
    {
      length:
        count,
    },
    (
      _,
      index,
    ) =>
      new SystemLocator(
        0n,
        0n,
        BigInt(index),
      ),
  );
}

function objects(
  count:
    number,
): readonly GalacticObjectLocator[] {
  return Array.from(
    {
      length:
        count,
    },
    (
      _,
      index,
    ) =>
      new GalacticObjectLocator(
        0n,
        0n,
        BigInt(index),
      ),
  );
}
