import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalaxyGenerator,
} from './galaxy-generator';

import {
  InitialGalaxyGenerator,
} from './initial-galaxy-generator';

describe(
  'GalaxyGenerator',
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

    it(
      'should reproduce the initial galaxy exactly at index zero',
      () => {
        const general =
          GalaxyGenerator
            .generate(
              canonicalGenerationKey,
              0n,
            );

        const initial =
          InitialGalaxyGenerator
            .generate(
              canonicalGenerationKey,
            );

        expect(
          general,
        ).toEqual(
          initial,
        );

        expect(
          general.seed
            .normalizedValue,
        ).toBe(
          '8BA08585BCBD4D3041C1FD9EEBD048E4',
        );

        expect(
          general
            .designation
            .name,
        ).toBe(
          'Caeloria',
        );

        expect(
          general.type,
        ).toBe(
          GalaxyType.ELLIPTICAL,
        );

        expect(
          general
            .physicalProperties
            .ageBillionYears,
        ).toBe(
          10.107100969452105,
        );

        expect(
          general
            .physicalProperties
            .diameterLightYears,
        ).toBe(
          171801.38478681122,
        );

        expect(
          general
            .physicalProperties
            .totalMassSolarMasses,
        ).toBe(
          5.0144255724751245e11,
        );

        expect(
          general
            .physicalProperties
            .stellarPopulation,
        ).toBe(
          244730302878n,
        );

        expect(
          general
            .physicalProperties
            .metallicitySolarRatio,
        ).toBe(
          1.3261045785469736,
        );

        expect(
          general
            .physicalProperties
            .starFormationRateSolarMassesPerYear,
        ).toBe(
          0.19950335429750066,
        );

        expect(
          general.nucleus
            ?.state,
        ).toBe(
          GalacticNucleusState
            .QUIESCENT,
        );

        expect(
          general.nucleus
            ?.supermassiveBlackHole
            ?.massSolarMasses,
        ).toBe(
          1.3908163761111212e8,
        );
      },
    );

    it(
      'should reproduce the frozen Android V1 galaxy at index one',
      () => {
        const galaxy =
          GalaxyGenerator
            .generate(
              canonicalGenerationKey,
              1n,
            );

        expect(
          galaxy.index,
        ).toBe(
          1n,
        );

        expect(
          galaxy.seed
            .normalizedValue,
        ).toBe(
          'A448D6B11BAF31F30904C808DE482290',
        );

        expect(
          galaxy
            .designation
            .name,
        ).toBe(
          'Kelphiis',
        );

        expect(
          galaxy
            .designation
            .proceduralCode,
        ).toBe(
          'GEN-V1-G1-A448D6B11BAF31F30904C808DE482290',
        );

        expect(
          galaxy.type,
        ).toBe(
          GalaxyType
            .BARRED_SPIRAL,
        );

        expect(
          galaxy
            .physicalProperties
            .ageBillionYears,
        ).toBe(
          8.677118058866936,
        );

        expect(
          galaxy
            .physicalProperties
            .diameterLightYears,
        ).toBe(
          98386.73190800563,
        );

        expect(
          galaxy
            .physicalProperties
            .totalMassSolarMasses,
        ).toBe(
          7.40933519714729e11,
        );

        expect(
          galaxy
            .physicalProperties
            .stellarPopulation,
        ).toBe(
          166296722864n,
        );

        expect(
          galaxy
            .physicalProperties
            .metallicitySolarRatio,
        ).toBe(
          0.6200239541010955,
        );

        expect(
          galaxy
            .physicalProperties
            .starFormationRateSolarMassesPerYear,
        ).toBe(
          3.8398890157505643,
        );

        expect(
          galaxy.nucleus
            ?.state,
        ).toBe(
          GalacticNucleusState
            .QUIESCENT,
        );

        expect(
          galaxy.nucleus
            ?.supermassiveBlackHole
            ?.massSolarMasses,
        ).toBe(
          5562588.346894345,
        );
      },
    );

    it(
      'should always generate exactly the same galaxy for the same key and index',
      () => {
        const first =
          GalaxyGenerator
            .generate(
              canonicalGenerationKey,
              42n,
            );

        const second =
          GalaxyGenerator
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
      'should remain independent of galaxy query order',
      () => {
        const expected =
          GalaxyGenerator
            .generate(
              canonicalGenerationKey,
              42n,
            );

        GalaxyGenerator
          .generate(
            canonicalGenerationKey,
            1n,
          );

        GalaxyGenerator
          .generate(
            canonicalGenerationKey,
            987654321n,
          );

        GalaxyGenerator
          .generate(
            canonicalGenerationKey,
            0n,
          );

        const after =
          GalaxyGenerator
            .generate(
              canonicalGenerationKey,
              42n,
            );

        expect(
          after,
        ).toEqual(
          expected,
        );
      },
    );

    it(
      'should derive different GalaxySeed values for different galaxy indices',
      () => {
        const first =
          GalaxyGenerator
            .generate(
              canonicalGenerationKey,
              1n,
            );

        const second =
          GalaxyGenerator
            .generate(
              canonicalGenerationKey,
              2n,
            );

        expect(
          second.seed
            .normalizedValue,
        ).not.toBe(
          first.seed
            .normalizedValue,
        );
      },
    );

    it(
      'should derive a different GalaxySeed for the same index in another universe',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const first =
          GalaxyGenerator
            .generate(
              canonicalGenerationKey,
              42n,
            );

        const second =
          GalaxyGenerator
            .generate(
              otherGenerationKey,
              42n,
            );

        expect(
          second.seed
            .normalizedValue,
        ).not.toBe(
          first.seed
            .normalizedValue,
        );

        expect(
          second,
        ).not.toEqual(
          first,
        );
      },
    );

    it(
      'should support signed Long maximum galaxy index deterministically',
      () => {
        const longMax =
          (1n << 63n) -
          1n;

        const first =
          GalaxyGenerator
            .generate(
              canonicalGenerationKey,
              longMax,
            );

        const second =
          GalaxyGenerator
            .generate(
              canonicalGenerationKey,
              longMax,
            );

        expect(
          first.index,
        ).toBe(
          longMax,
        );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should reject negative galaxy indices',
      () => {
        expect(
          () =>
            GalaxyGenerator
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
      'should reject unsupported generator versions',
      () => {
        const unsupportedGenerationKey =
          {
            universeSeed:
              canonicalSeed,

            generatorVersion: {
              code:
                999,
            },
          } as unknown as
            UniverseGenerationKey;

        expect(
          () =>
            GalaxyGenerator
              .generate(
                unsupportedGenerationKey,
                0n,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should give every generated galaxy a nucleus while forbidding QUASAR in DWARF and IRREGULAR',
      () => {
        for (
          let index = 0n;
          index < 4_096n;
          index += 1n
        ) {
          const galaxy =
            GalaxyGenerator.generate(
              canonicalGenerationKey,
              index,
            );

          expect(
            galaxy.nucleus,
          ).not.toBeNull();

          if (
            galaxy.type ===
              GalaxyType.DWARF ||
            galaxy.type ===
              GalaxyType.IRREGULAR
          ) {
            expect(
              galaxy.nucleus
                ?.state,
            ).not.toBe(
              GalacticNucleusState.QUASAR,
            );
          }
        }
      },
      30_000,
    );

    it(
      'should generate an arbitrary high index directly without requiring previous galaxies',
      () => {
        const galaxy =
          GalaxyGenerator
            .generate(
              canonicalGenerationKey,
              42n,
            );

        expect(
          galaxy.index,
        ).toBe(
          42n,
        );

        expect(
          galaxy.seed
            .normalizedValue,
        ).toBe(
          '298A04D08C8A91EB972690963E9C13C8',
        );

        expect(
          galaxy
            .designation
            .name,
        ).toBe(
          'Kanaria',
        );

        expect(
          galaxy
            .designation
            .proceduralCode,
        ).toBe(
          'GEN-V1-G42-298A04D08C8A91EB972690963E9C13C8',
        );

        expect(
          galaxy.type,
        ).toBe(
          GalaxyType.IRREGULAR,
        );

        expect(
          galaxy
            .physicalProperties
            .ageBillionYears,
        ).toBe(
          8.356052968028186,
        );

        expect(
          galaxy
            .physicalProperties
            .diameterLightYears,
        ).toBe(
          37782.74720357112,
        );

        expect(
          galaxy
            .physicalProperties
            .totalMassSolarMasses,
        ).toBe(
          8.82013634015923e10,
        );

        expect(
          galaxy
            .physicalProperties
            .stellarPopulation,
        ).toBe(
          16568961023n,
        );

        expect(
          galaxy
            .physicalProperties
            .metallicitySolarRatio,
        ).toBe(
          0.6571260717595743,
        );

        expect(
          galaxy
            .physicalProperties
            .starFormationRateSolarMassesPerYear,
        ).toBe(
          4.166540664860973,
        );

        expect(
          galaxy.nucleus,
        ).not.toBeNull();

        expect(
          galaxy.nucleus
            ?.state,
        ).toBe(
          GalacticNucleusState.QUIESCENT,
        );

        expect(
          galaxy.nucleus
            ?.supermassiveBlackHole,
        ).toBeNull();
      },
    );
  },
);
