import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  SystemLocator,
} from '../generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  SystemSeed,
} from '../seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  CometIdentity,
} from './comet-identity';

import {
  CometNucleusProperties,
} from './comet-nucleus-properties';

import {
  CometSystem,
} from './comet-system';

import {
  type PlanetarySystem,
} from './planetary-system';

import {
  RelevantComet,
} from './relevant-comet';

describe(
  'CometSystem point 22.5 V1',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const locator =
      new SystemLocator(
        6n,
        113n,
        9n,
      );

    const seed =
      new SystemSeed(
        '22222222222222222222222222222222',
      );

    it(
      'should preserve the exact host system and freeze a contiguous relevant-comet sample',
      () => {
        const host =
          systemFixture(
            5,
          );

        const comet =
          cometFixture(
            1,
          );

        const system =
          new CometSystem(
            host,
            5,
            0.7,
            [
              comet,
            ],
          );

        expect(
          system.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          system.systemLocator,
        ).toBe(
          locator,
        );

        expect(
          system.systemSeed,
        ).toBe(
          seed,
        );

        expect(
          system.relevantCometCount,
        ).toBe(1);

        expect(
          system.hasRelevantComets,
        ).toBe(true);

        expect(
          Object.isFrozen(
            system.relevantComets,
          ),
        ).toBe(true);
      },
    );

    it(
      'should require an empty zero-support comet system when no residual dust exists',
      () => {
        const host =
          systemFixture(
            0,
          );

        expect(
          () =>
            new CometSystem(
              host,
              0,
              0.2,
              [],
            ),
        ).toThrow(
          RangeError,
        );

        const empty =
          new CometSystem(
            host,
            0,
            0,
            [],
          );

        expect(
          empty.hasRelevantComets,
        ).toBe(false);
      },
    );

    function systemFixture(
      residualDustMassEarth:
        number,
    ): PlanetarySystem {

      return {
        generationKey,
        locator,
        seed,
        formationBlueprint: {
          residualDustMassEarth,
        },
      } as unknown as PlanetarySystem;
    }

    function cometFixture(
      ordinal:
        number,
    ): RelevantComet {

      return new RelevantComet(
        new CometIdentity(
          locator,
          seed,
          ordinal,
          ordinal ===
              1
            ? '0123456789ABCDEFFEDCBA9876543210'
            : 'FEDCBA98765432100123456789ABCDEF',
        ),
        new CometNucleusProperties(
          ordinal,
          18,
          0.62,
          0.38,
          0.6,
          0.5,
          0.04,
          0.8,
        ),
      );
    }
  },
);
