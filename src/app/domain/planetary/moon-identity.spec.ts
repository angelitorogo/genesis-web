import {
  BodyLocator,
  MoonLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
  MoonSeed,
} from '../seed/hierarchical-seeds';

import {
  type PlanetaryDesignation,
} from './planetary-designation';

import {
  MoonDesignation,
} from './moon-designation';

import {
  MoonIdentity,
} from './moon-identity';

describe(
  'MoonIdentity point 21.8',
  () => {
    it(
      'should bind one MoonLocator/MoonSeed/designation below the exact host Body identity',
      () => {
        const hostLocator =
          new BodyLocator(
            4n,
            -9n,
            12n,
            1n,
          );

        const hostSeed =
          new BodySeed(
            '22222222222222222222222222222222',
          );

        const locator =
          new MoonLocator(
            4n,
            -9n,
            12n,
            1n,
            0n,
          );

        const seed =
          new MoonSeed(
            '7D93A05C9E4018E6C47006B2BF176B19',
          );

        const planetDesignation = {
          planetOrdinal:
            2,
          bodyLocator:
            hostLocator,
          bodySeed:
            hostSeed,
          name:
            'Jotheria c',
          proceduralCode:
            'GEN-TEST-P2-c-BODY-2222',
        } as unknown as PlanetaryDesignation;

        const designation =
          new MoonDesignation(
            planetDesignation,
            1,
            locator,
            seed,
            'I',
          );

        const identity =
          new MoonIdentity(
            2,
            hostLocator,
            hostSeed,
            1,
            locator,
            seed,
            designation,
          );

        expect(
          identity.locator,
        ).toBe(locator);
        expect(
          identity.seed,
        ).toBe(seed);
        expect(
          identity.designation,
        ).toBe(designation);
      },
    );

    it(
      'should reject a MoonLocator or designation belonging to another local ordinal',
      () => {
        const hostLocator =
          new BodyLocator(
            4n,
            -9n,
            12n,
            1n,
          );

        const hostSeed =
          new BodySeed(
            '22222222222222222222222222222222',
          );

        const locator =
          new MoonLocator(
            4n,
            -9n,
            12n,
            1n,
            0n,
          );

        const seed =
          new MoonSeed(
            '7D93A05C9E4018E6C47006B2BF176B19',
          );

        const planetDesignation = {
          planetOrdinal:
            2,
          bodyLocator:
            hostLocator,
          bodySeed:
            hostSeed,
          name:
            'Jotheria c',
          proceduralCode:
            'GEN-TEST-P2-c-BODY-2222',
        } as unknown as PlanetaryDesignation;

        const designation =
          new MoonDesignation(
            planetDesignation,
            1,
            locator,
            seed,
            'I',
          );

        expect(
          () =>
            new MoonIdentity(
              2,
              hostLocator,
              hostSeed,
              2,
              locator,
              seed,
              designation,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
