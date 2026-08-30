import {
  BodyLocator,
  MoonLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
  MoonSeed,
} from '../seed/hierarchical-seeds';

import {
  MoonDesignation,
  moonRomanNumeralV1,
} from './moon-designation';

import {
  type PlanetaryDesignation,
} from './planetary-designation';

describe(
  'MoonDesignation point 21.8',
  () => {
    const bodyLocator =
      new BodyLocator(
        0n,
        0n,
        0n,
        0n,
      );

    const bodySeed =
      new BodySeed(
        '11111111111111111111111111111111',
      );

    const planetDesignation = {
      planetOrdinal:
        1,
      bodyLocator,
      bodySeed,
      name:
        'Jotheria b',
      proceduralCode:
        `GEN-V1-TEST-P1-b-BODY-${bodySeed.normalizedValue}`,
    } as unknown as PlanetaryDesignation;

    it(
      'should layer stable Roman numerals over the frozen planet designation',
      () => {
        expect(
          [
            1,
            2,
            4,
            9,
            40,
            99,
            120,
          ].map(
            moonRomanNumeralV1,
          ),
        ).toEqual([
          'I',
          'II',
          'IV',
          'IX',
          'XL',
          'XCIX',
          'CXX',
        ]);

        const locator =
          new MoonLocator(
            0n,
            0n,
            0n,
            0n,
            1n,
          );

        const seed =
          new MoonSeed(
            '9A402F82942B4E228C369B21A956FEAC',
          );

        const designation =
          new MoonDesignation(
            planetDesignation,
            2,
            locator,
            seed,
            'II',
          );

        expect(
          designation.name,
        ).toBe(
          'Jotheria b II',
        );

        expect(
          designation.proceduralCode,
        ).toBe(
          `${planetDesignation.proceduralCode}-M2-II-MOON-${seed.normalizedValue}`,
        );
      },
    );

    it(
      'should reject an ordinal/locator mismatch, wrong Roman numeral or non-MoonSeed input',
      () => {
        const locator =
          new MoonLocator(
            0n,
            0n,
            0n,
            0n,
            0n,
          );

        const seed =
          new MoonSeed(
            '053E4E0C703A9D4E62E91AB5EE7EC55F',
          );

        expect(
          () =>
            new MoonDesignation(
              planetDesignation,
              2,
              locator,
              seed,
              'II',
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new MoonDesignation(
              planetDesignation,
              1,
              locator,
              seed,
              'II',
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new MoonDesignation(
              planetDesignation,
              1,
              locator,
              bodySeed as unknown as MoonSeed,
              'I',
            ),
        ).toThrow(
          RangeError,
        );

        for (
          const invalidOrdinal
          of [
            0,
            1.5,
            4_000,
          ]
        ) {
          expect(
            () =>
              moonRomanNumeralV1(
                invalidOrdinal,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );
  },
);
