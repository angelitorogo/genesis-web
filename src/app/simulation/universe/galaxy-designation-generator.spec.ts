import {
  GalaxyLocator,
  SectorLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type GalaxySeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  GalaxyDesignationGenerator,
} from './galaxy-designation-generator';

describe(
  'GalaxyDesignationGenerator',
  () => {
    const canonicalSeed =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    const canonicalGenerationKey =
      new UniverseGenerationKey(
        canonicalSeed,
        GeneratorVersion.V1,
      );

    const androidVectors =
      Object.freeze([
        {
          galaxyIndex:
            0n,

          seed:
            '8BA08585BCBD4D3041C1FD9EEBD048E4',

          name:
            'Caeloria',
        },

        {
          galaxyIndex:
            1n,

          seed:
            'A448D6B11BAF31F30904C808DE482290',

          name:
            'Kelphiis',
        },

        {
          galaxyIndex:
            2n,

          seed:
            '36476A29035F432790C617E3E6D3D5A6',

          name:
            'Delzenyria',
        },

        {
          galaxyIndex:
            3n,

          seed:
            'EFED806D7A693EAE0FA47F004B80F283',

          name:
            'Galuraa',
        },

        {
          galaxyIndex:
            4n,

          seed:
            '5B805E7DE08A3F8D5DE08518C8B44209',

          name:
            'Velthea',
        },

        {
          galaxyIndex:
            5n,

          seed:
            '287F7A5C179FC9878442A87A60319522',

          name:
            'Vaxisar',
        },

        {
          galaxyIndex:
            10n,

          seed:
            'F82C0D9235ACD25AADA3127CE850F8BF',

          name:
            'Lyrquiea',
        },

        {
          galaxyIndex:
            42n,

          seed:
            '298A04D08C8A91EB972690963E9C13C8',

          name:
            'Kanaria',
        },
      ]);

    it(
      'should reproduce the canonical Android V1 initial galaxy designation',
      () => {
        const designation =
          GalaxyDesignationGenerator
            .generate(
              canonicalGenerationKey,
              0n,
            );

        expect(
          designation.name,
        ).toBe(
          'Caeloria',
        );

        expect(
          designation
            .proceduralCode,
        ).toBe(
          'GEN-V1-G0-8BA08585BCBD4D3041C1FD9EEBD048E4',
        );
      },
    );

    it(
      'should reproduce the exact Android V1 designation sample',
      () => {
        for (
          const vector
          of androidVectors
        ) {
          const designation =
            GalaxyDesignationGenerator
              .generate(
                canonicalGenerationKey,
                vector.galaxyIndex,
              );

          expect(
            designation.name,
          ).toBe(
            vector.name,
          );

          expect(
            designation
              .proceduralCode,
          ).toBe(
            `GEN-V1-G${vector.galaxyIndex}-${vector.seed}`,
          );
        }
      },
    );

    it(
      'should be exactly deterministic for the same generation key and galaxy index',
      () => {
        const first =
          GalaxyDesignationGenerator
            .generate(
              canonicalGenerationKey,
              42n,
            );

        const second =
          GalaxyDesignationGenerator
            .generate(
              canonicalGenerationKey,
              42n,
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
        const before =
          GalaxyDesignationGenerator
            .generate(
              canonicalGenerationKey,
              0n,
            );

        ProceduralTargetResolver
          .resolveTargetSeed(
            canonicalGenerationKey,
            new SectorLocator(
              42n,
              123456789n,
            ),
          );

        ProceduralTargetResolver
          .resolveTargetSeed(
            canonicalGenerationKey,
            new GalaxyLocator(
              10n,
            ),
          );

        const after =
          GalaxyDesignationGenerator
            .generate(
              canonicalGenerationKey,
              0n,
            );

        expect(
          after,
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should isolate identical galaxy indices across different universe seeds',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const first =
          GalaxyDesignationGenerator
            .generate(
              canonicalGenerationKey,
              0n,
            );

        const second =
          GalaxyDesignationGenerator
            .generate(
              otherGenerationKey,
              0n,
            );

        expect(
          second.proceduralCode,
        ).not.toBe(
          first.proceduralCode,
        );
      },
    );

    it(
      'should build the procedural code from the exact resolved GalaxySeed',
      () => {
        const galaxyIndex =
          42n;

        const galaxySeed =
          ProceduralTargetResolver
            .resolveTargetSeed(
              canonicalGenerationKey,
              new GalaxyLocator(
                galaxyIndex,
              ),
            ) as GalaxySeed;

        const designation =
          GalaxyDesignationGenerator
            .generate(
              canonicalGenerationKey,
              galaxyIndex,
            );

        expect(
          designation
            .proceduralCode,
        ).toBe(
          `GEN-V1-G42-${galaxySeed.normalizedValue}`,
        );
      },
    );

    it(
      'should support signed Long.MAX_VALUE deterministically',
      () => {
        const longMax =
          9223372036854775807n;

        const first =
          GalaxyDesignationGenerator
            .generate(
              canonicalGenerationKey,
              longMax,
            );

        const second =
          GalaxyDesignationGenerator
            .generate(
              canonicalGenerationKey,
              longMax,
            );

        expect(
          second,
        ).toEqual(
          first,
        );

        expect(
          first.proceduralCode,
        ).toMatch(
          /^GEN-V1-G9223372036854775807-[0-9A-F]{32}$/,
        );
      },
    );

    it(
      'should reject negative galaxy indices',
      () => {
        expect(
          () =>
            GalaxyDesignationGenerator
              .generate(
                canonicalGenerationKey,
                -1n,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject values above signed Long.MAX_VALUE',
      () => {
        expect(
          () =>
            GalaxyDesignationGenerator
              .generate(
                canonicalGenerationKey,
                9223372036854775808n,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);