import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
  SystemSeed,
} from '../seed/hierarchical-seeds';

import {
  StellarDesignation,
} from '../stellar/stellar-designation';

import {
  PlanetaryDesignation,
} from './planetary-designation';

describe(
  'PlanetaryDesignation point 18.8',
  () => {
    const systemDesignation =
      new StellarDesignation(
        'Jotheria',
        'GEN-V1-G0-S0-O0-SYS-DC2EACC73FFB3E9388F8BEB9FEBE1F2E',
      );

    it(
      'should layer one lowercase catalog suffix over the frozen stellar-system designation without changing planet identity',
      () => {
        const locator =
          new BodyLocator(
            0n,
            0n,
            0n,
            0n,
          );

        const seed =
          new BodySeed(
            '11111111111111111111111111111111',
          );

        const designation =
          new PlanetaryDesignation(
            systemDesignation,
            1,
            locator,
            seed,
            'b',
          );

        expect(
          designation.systemDesignation,
        ).toBe(
          systemDesignation,
        );

        expect(
          designation.planetOrdinal,
        ).toBe(1);

        expect(
          designation.bodyLocator,
        ).toBe(
          locator,
        );

        expect(
          designation.bodySeed,
        ).toBe(
          seed,
        );

        expect(
          designation.catalogSuffix,
        ).toBe('b');

        expect(
          designation.name,
        ).toBe(
          'Jotheria b',
        );

        expect(
          designation.proceduralCode,
        ).toBe(
          `${systemDesignation.proceduralCode}-P1-b-BODY-${seed.normalizedValue}`,
        );
      },
    );

    it(
      'should reject non-contiguous BodyLocator identity, non-BodySeed input or an invalid V1 suffix',
      () => {
        const validLocator =
          new BodyLocator(
            0n,
            0n,
            0n,
            0n,
          );

        const validSeed =
          new BodySeed(
            '11111111111111111111111111111111',
          );

        expect(
          () =>
            new PlanetaryDesignation(
              systemDesignation,
              2,
              validLocator,
              validSeed,
              'c',
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetaryDesignation(
              systemDesignation,
              1,
              validLocator,
              new SystemSeed(
                '22222222222222222222222222222222',
              ) as unknown as BodySeed,
              'b',
            ),
        ).toThrow(
          RangeError,
        );

        for (
          const invalidSuffix
          of [
            '',
            'a',
            'c',
            'A',
            'bb',
            ' b',
            'b ',
          ]
        ) {
          expect(
            () =>
              new PlanetaryDesignation(
                systemDesignation,
                1,
                validLocator,
                validSeed,
                invalidSuffix,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );
  },
);
