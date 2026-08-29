import {
  BodyLocator,
  SystemLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  StellarDesignation,
} from '../stellar/stellar-designation';

import {
  PlanetaryDesignation,
} from './planetary-designation';

import {
  PlanetarySystemDesignationCatalog,
} from './planetary-system-designation-catalog';

describe(
  'PlanetarySystemDesignationCatalog point 18.8',
  () => {
    const locator =
      new SystemLocator(
        0n,
        0n,
        0n,
      );

    const systemDesignation =
      new StellarDesignation(
        'Jotheria',
        'GEN-V1-G0-S0-O0-SYS-DC2EACC73FFB3E9388F8BEB9FEBE1F2E',
      );

    function designation(
      ordinal:
        number,

      suffix:
        string,
    ): PlanetaryDesignation {

      return new PlanetaryDesignation(
        systemDesignation,
        ordinal,
        new BodyLocator(
          locator.galaxyIndex,
          locator.sectorKey,
          locator.galacticObjectIndex,
          BigInt(
            ordinal -
              1,
          ),
        ),
        new BodySeed(
          ordinal ===
              1
            ? '11111111111111111111111111111111'
            : ordinal ===
                2
              ? '22222222222222222222222222222222'
              : '33333333333333333333333333333333',
        ),
        suffix,
      );
    }

    it(
      'should preserve an ordered immutable one-to-one designation catalog',
      () => {
        const catalog =
          new PlanetarySystemDesignationCatalog(
            locator,
            systemDesignation,
            3,
            [
              designation(
                1,
                'b',
              ),
              designation(
                2,
                'c',
              ),
              designation(
                3,
                'd',
              ),
            ],
          );

        expect(
          catalog.planetCount,
        ).toBe(3);

        expect(
          catalog.hasDesignations,
        ).toBe(true);

        expect(
          catalog.designations.map(
            value =>
              value.name,
          ),
        ).toEqual([
          'Jotheria b',
          'Jotheria c',
          'Jotheria d',
        ]);

        expect(
          Object.isFrozen(
            catalog.designations,
          ),
        ).toBe(true);
      },
    );

    it(
      'should support a genuinely planet-free system without inventing labels',
      () => {
        const catalog =
          new PlanetarySystemDesignationCatalog(
            locator,
            systemDesignation,
            0,
            [],
          );

        expect(
          catalog.designations,
        ).toEqual([]);

        expect(
          catalog.hasDesignations,
        ).toBe(false);
      },
    );

    it(
      'should reject count, order, system-locator or parent-designation mismatches',
      () => {
        expect(
          () =>
            new PlanetarySystemDesignationCatalog(
              locator,
              systemDesignation,
              2,
              [
                designation(
                  1,
                  'b',
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetarySystemDesignationCatalog(
              locator,
              systemDesignation,
              1,
              [
                designation(
                  2,
                  'c',
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        const foreignLocatorDesignation =
          new PlanetaryDesignation(
            systemDesignation,
            1,
            new BodyLocator(
              1n,
              0n,
              0n,
              0n,
            ),
            new BodySeed(
              '44444444444444444444444444444444',
            ),
            'b',
          );

        expect(
          () =>
            new PlanetarySystemDesignationCatalog(
              locator,
              systemDesignation,
              1,
              [
                foreignLocatorDesignation,
              ],
            ),
        ).toThrow(
          RangeError,
        );

        const otherSystemDesignation =
          new StellarDesignation(
            'Penaoria',
            'GEN-V1-G0-S0-O1-SYS-9A2DAD2C4D324D59C54C8DFDB9E2F84F',
          );

        const wrongParent =
          new PlanetaryDesignation(
            otherSystemDesignation,
            1,
            new BodyLocator(
              locator.galaxyIndex,
              locator.sectorKey,
              locator.galacticObjectIndex,
              0n,
            ),
            new BodySeed(
              '55555555555555555555555555555555',
            ),
            'b',
          );

        expect(
          () =>
            new PlanetarySystemDesignationCatalog(
              locator,
              systemDesignation,
              1,
              [
                wrongParent,
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
