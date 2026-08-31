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
  CometOrbitalElements,
} from './comet-orbital-elements';

import {
  CometPeriodRegime,
} from './comet-period-regime';

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
  'CometSystem point 22.6 V1',
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
      'should preserve the exact host system and summarize short/long relevant comets without storing one fixed activity state',
      () => {
        const host =
          systemFixture(
            5,
          );

        const shortComet =
          cometFixture(
            1,
            CometPeriodRegime
              .SHORT_PERIOD,
          );

        const longComet =
          cometFixture(
            2,
            CometPeriodRegime
              .LONG_PERIOD,
          );

        const system =
          new CometSystem(
            host,
            5,
            0.7,
            [
              shortComet,
              longComet,
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
        ).toBe(2);

        expect(
          system.shortPeriodCometCount,
        ).toBe(1);

        expect(
          system.longPeriodCometCount,
        ).toBe(1);

        expect(
          system.referenceLuminositySolar,
        ).toBe(1.5);

        expect(
          Object.isFrozen(
            system.relevantComets,
          ),
        ).toBe(true);

        expect(
          'activityState' in system,
        ).toBe(false);
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
        habitableZone: {
          referenceLuminositySolar:
            1.5,
        },
      } as unknown as PlanetarySystem;
    }

    function cometFixture(
      ordinal:
        number,

      periodRegime:
        CometPeriodRegime,
    ): RelevantComet {

      const periodYears =
        periodRegime ===
          CometPeriodRegime
            .SHORT_PERIOD
          ? 8
          : 1_000;

      const semiMajorAxisAu =
        periodYears **
          (2 / 3);

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
        new CometOrbitalElements(
          ordinal,
          1,
          semiMajorAxisAu,
          0.8,
          20,
          30,
          40,
          50,
          periodYears,
          periodRegime,
        ),
      );
    }
  },
);
