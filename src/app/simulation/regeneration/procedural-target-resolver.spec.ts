import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  MoonLocator,
  SectorLocator,
  SystemLocator,
  type ProceduralLocator
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  MoonSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ProceduralTargetResolver,
} from './procedural-target-resolver';

describe(
  'ProceduralTargetResolver',
  () => {
    const root =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    const generationKey =
      new UniverseGenerationKey(
        root,
        GeneratorVersion.V1,
      );

    it(
      'should preserve every official Android V1 target seed vector',
      () => {
        const vectors =
          [
            {
              locator:
                new GalaxyLocator(
                  0n,
                ),

              expected:
                '8BA08585BCBD4D3041C1FD9EEBD048E4',
            },

            {
              locator:
                new SectorLocator(
                  0n,
                  123456789n,
                ),

              expected:
                '02DF63D582A1F3E9BFB71AA643FDBB92',
            },

            {
              locator:
                new GalacticObjectLocator(
                  0n,
                  123456789n,
                  7n,
                ),

              expected:
                '22D2E7D76E3C1EB35611802BC34E378E',
            },

            {
              locator:
                new SystemLocator(
                  0n,
                  123456789n,
                  7n,
                ),

              expected:
                '58691B1E4E539DBA3EB173F795FDE7E2',
            },

            {
              locator:
                new BodyLocator(
                  0n,
                  123456789n,
                  7n,
                  3n,
                ),

              expected:
                '86FE2CB4F2CC4678D23F310333F15EF7',
            },

            {
              locator:
                new CivilizationLocator(
                  0n,
                  123456789n,
                  7n,
                  3n,
                  1n,
                ),

              expected:
                'ED3EC33F28E7B841CBDE4307F71D3C64',
            },
          ] as const;

        for (
          const vector
          of vectors
        ) {
          expect(
            ProceduralTargetResolver
              .resolveTargetSeed(
                generationKey,
                vector.locator,
              )
              .normalizedValue,
          ).toBe(
            vector.expected,
          );
        }
      },
    );

    it(
      'should append MoonLocator derivation without changing any frozen earlier V1 seed vector',
      () => {
        const locator =
          new MoonLocator(
            0n,
            123456789n,
            7n,
            3n,
            1n,
          );

        const resolvedSeed =
          ProceduralTargetResolver
            .resolveTargetSeed(
              generationKey,
              locator,
            );

        expect(
          resolvedSeed
            .normalizedValue,
        ).toBe(
          '63F161F291867DD1319F443367BABC5A',
        );

        expect(
          resolvedSeed,
        ).toBeInstanceOf(
          MoonSeed,
        );

        if (
          !(
            resolvedSeed instanceof
            MoonSeed
          )
        ) {
          throw new TypeError(
            'MoonLocator must resolve to MoonSeed.',
          );
        }

        expect(
          resolvedSeed.kind,
        ).toBe(
          'moon',
        );
      },
    );

    it(
      'should regenerate the same target seed repeatedly',
      () => {
        const locator =
          new BodyLocator(
            0n,
            123456789n,
            7n,
            3n,
          );

        const expected =
          ProceduralTargetResolver
            .resolveTargetSeed(
              generationKey,
              locator,
            )
            .normalizedValue;

        for (
          let index = 0;
          index < 100;
          index += 1
        ) {
          expect(
            ProceduralTargetResolver
              .resolveTargetSeed(
                generationKey,
                locator,
              )
              .normalizedValue,
          ).toBe(
            expected,
          );
        }
      },
    );

    it(
      'should distinguish System and GalacticObject at the same index',
      () => {
        const objectSeed =
          ProceduralTargetResolver
            .resolveTargetSeed(
              generationKey,
              new GalacticObjectLocator(
                0n,
                123456789n,
                7n,
              ),
            )
            .normalizedValue;

        const systemSeed =
          ProceduralTargetResolver
            .resolveTargetSeed(
              generationKey,
              new SystemLocator(
                0n,
                123456789n,
                7n,
              ),
            )
            .normalizedValue;

        expect(
          objectSeed,
        ).not.toBe(
          systemSeed,
        );
      },
    );

    it(
      'should isolate identical locators across different universe seeds',
      () => {
        const otherKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const locator =
          new SystemLocator(
            0n,
            123456789n,
            7n,
          );

        expect(
          ProceduralTargetResolver
            .resolveTargetSeed(
              generationKey,
              locator,
            )
            .normalizedValue,
        ).not.toBe(
          ProceduralTargetResolver
            .resolveTargetSeed(
              otherKey,
              locator,
            )
            .normalizedValue,
        );
      },
    );

    it(
      'should support signed Long sector keys',
      () => {
        const locator =
          new SectorLocator(
            1n,
            -(1n << 63n),
          );

        expect(
          ProceduralTargetResolver
            .resolveTargetSeed(
              generationKey,
              locator,
            )
            .normalizedValue,
        ).toMatch(
          /^[0-9A-F]{32}$/,
        );
      },
    );

    it(
      'should reject an unsupported runtime locator',
      () => {
        const unsupported =
          {
            galaxyIndex:
              0n,

            sectorKey:
              0n,

            galacticObjectIndex:
              0n,

            bodyIndex:
              0n,

            civilizationIndex:
              0n,
          } as unknown as
            ProceduralLocator;

        expect(
          () =>
            ProceduralTargetResolver
              .resolveTargetSeed(
                generationKey,
                unsupported,
              ),
        ).toThrow(
          TypeError,
        );
      },
    );

  },
);