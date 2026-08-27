import {
  BodyLocator,
  GalaxyLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  StellarDesignationGenerator,
} from './stellar-designation-generator';

describe(
  'StellarDesignationGenerator point 15.6 V1',
  () => {
    const canonicalGenerationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const frozenVectors =
      Object.freeze([
        {
          locator:
            new SystemLocator(
              0n,
              0n,
              0n,
            ),

          systemSeed:
            'DC2EACC73FFB3E9388F8BEB9FEBE1F2E',

          name:
            'Jotheria',
        },
        {
          locator:
            new SystemLocator(
              0n,
              0n,
              1n,
            ),

          systemSeed:
            '9A2DAD2C4D324D59C54C8DFDB9E2F84F',

          name:
            'Penaoria',
        },
        {
          locator:
            new SystemLocator(
              0n,
              1n,
              0n,
            ),

          systemSeed:
            'EA6DED77F630A78134926EF59DFBB22A',

          name:
            'Chetos',
        },
        {
          locator:
            new SystemLocator(
              3n,
              27n,
              42n,
            ),

          systemSeed:
            '6BF845C5BFEA0020231206BF2E98AF24',

          name:
            'Gavien',
        },
        {
          locator:
            new SystemLocator(
              4n,
              -12n,
              7n,
            ),

          systemSeed:
            'F753D3827971534C387C9DC13663688F',

          name:
            'Curoria',
        },
        {
          locator:
            new SystemLocator(
              42n,
              123456789n,
              99n,
            ),

          systemSeed:
            '59FFCDD4E917743B77158CF7796EA6CC',

          name:
            'Zodus',
        },
      ]);

    it(
      'should reproduce the frozen point-15.6 V1 sample exactly',
      () => {
        for (
          const vector
          of frozenVectors
        ) {
          const resolvedSeed =
            ProceduralTargetResolver
              .resolveTargetSeed(
                canonicalGenerationKey,
                vector.locator,
              ) as SystemSeed;

          expect(
            resolvedSeed
              .normalizedValue,
          ).toBe(
            vector.systemSeed,
          );

          const designation =
            StellarDesignationGenerator
              .generate(
                canonicalGenerationKey,
                vector.locator,
              );

          expect(
            designation.name,
          ).toBe(
            vector.name,
          );

          expect(
            designation.proceduralCode,
          ).toBe(
            `GEN-V1-G${vector.locator.galaxyIndex}` +
            `-S${vector.locator.sectorKey}` +
            `-O${vector.locator.galacticObjectIndex}` +
            `-SYS-${vector.systemSeed}`,
          );
        }
      },
    );

    it(
      'should be exactly deterministic for the same generation key and SystemLocator',
      () => {
        const locator =
          new SystemLocator(
            3n,
            27n,
            42n,
          );

        const first =
          StellarDesignationGenerator
            .generate(
              canonicalGenerationKey,
              locator,
            );

        const second =
          StellarDesignationGenerator
            .generate(
              canonicalGenerationKey,
              locator,
            );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should remain independent of unrelated procedural query order',
      () => {
        const locator =
          new SystemLocator(
            0n,
            0n,
            0n,
          );

        const before =
          StellarDesignationGenerator
            .generate(
              canonicalGenerationKey,
              locator,
            );

        ProceduralTargetResolver
          .resolveTargetSeed(
            canonicalGenerationKey,
            new GalaxyLocator(
              42n,
            ),
          );

        ProceduralTargetResolver
          .resolveTargetSeed(
            canonicalGenerationKey,
            new BodyLocator(
              7n,
              -123n,
              987n,
              5n,
            ),
          );

        const after =
          StellarDesignationGenerator
            .generate(
              canonicalGenerationKey,
              locator,
            );

        expect(
          after,
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should build the technical code from the exact resolved SystemSeed and locator identity',
      () => {
        const locator =
          new SystemLocator(
            8n,
            -456n,
            123n,
          );

        const systemSeed =
          ProceduralTargetResolver
            .resolveTargetSeed(
              canonicalGenerationKey,
              locator,
            ) as SystemSeed;

        const designation =
          StellarDesignationGenerator
            .generate(
              canonicalGenerationKey,
              locator,
            );

        expect(
          designation.proceduralCode,
        ).toBe(
          `GEN-V1-G8-S-456-O123-SYS-${systemSeed.normalizedValue}`,
        );
      },
    );

    it(
      'should isolate the same SystemLocator across different universe seeds',
      () => {
        const locator =
          new SystemLocator(
            0n,
            0n,
            0n,
          );

        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const first =
          StellarDesignationGenerator
            .generate(
              canonicalGenerationKey,
              locator,
            );

        const second =
          StellarDesignationGenerator
            .generate(
              otherGenerationKey,
              locator,
            );

        expect(
          second.proceduralCode,
        ).not.toBe(
          first.proceduralCode,
        );
      },
    );

    it(
      'should keep technical designations unique across a representative local locator sample',
      () => {
        const codes =
          new Set<string>();

        for (
          let index =
            0n;
          index <
            2_048n;
          index +=
            1n
        ) {
          const designation =
            StellarDesignationGenerator
              .generate(
                canonicalGenerationKey,
                new SystemLocator(
                  2n,
                  -17n,
                  index,
                ),
              );

          expect(
            designation.name,
          ).toMatch(
            /^[A-Z][A-Za-z]+$/u,
          );

          expect(
            codes.has(
              designation.proceduralCode,
            ),
          ).toBe(
            false,
          );

          codes.add(
            designation.proceduralCode,
          );
        }

        expect(
          codes.size,
        ).toBe(
          2_048,
        );
      },
    );

    it(
      'should support the full signed-Long locator boundaries already accepted by SystemLocator',
      () => {
        const longMin =
          -9223372036854775808n;

        const longMax =
          9223372036854775807n;

        const designation =
          StellarDesignationGenerator
            .generate(
              canonicalGenerationKey,
              new SystemLocator(
                longMax,
                longMin,
                longMax,
              ),
            );

        expect(
          designation.proceduralCode,
        ).toMatch(
          /^GEN-V1-G9223372036854775807-S-9223372036854775808-O9223372036854775807-SYS-[0-9A-F]{32}$/u,
        );
      },
    );

    it(
      'should reject unsupported generator versions without inventing a V2 naming contract',
      () => {
        const unsupportedVersion =
          Object.freeze({
            name:
              'V2',

            code:
              2,
          }) as unknown as GeneratorVersion;

        const unsupported =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
            ),
            unsupportedVersion,
          );

        expect(
          () =>
            StellarDesignationGenerator
              .generate(
                unsupported,
                new SystemLocator(
                  0n,
                  0n,
                  0n,
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
