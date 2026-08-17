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
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

import {
  GenesisUniverse,
} from '../../domain/universe/genesis-universe';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  InitialGalaxyGenerator,
} from './initial-galaxy-generator';

describe(
  'InitialGalaxyGenerator',
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
      'should always generate the canonical initial galaxy index',
      () => {
        const galaxy =
          InitialGalaxyGenerator
            .generate(
              canonicalGenerationKey,
            );

        expect(
          galaxy.index,
        ).toBe(
          GenesisUniverse
            .INITIAL_GALAXY_INDEX,
        );

        expect(
          galaxy.index,
        ).toBe(
          0n,
        );
      },
    );

    it(
      'should preserve the exact universe generation key',
      () => {
        const galaxy =
          InitialGalaxyGenerator
            .generate(
              canonicalGenerationKey,
            );

        expect(
          galaxy.generationKey,
        ).toBe(
          canonicalGenerationKey,
        );
      },
    );

    it(
      'should reproduce the shared Android V1 initial galaxy seed',
      () => {
        const galaxy =
          InitialGalaxyGenerator
            .generate(
              canonicalGenerationKey,
            );

        expect(
          galaxy.seed
            .normalizedValue,
        ).toBe(
          '8BA08585BCBD4D3041C1FD9EEBD048E4',
        );
      },
    );

    it(
      'should reproduce the canonical Android V1 initial galaxy physical vector',
      () => {
        const galaxy =
          InitialGalaxyGenerator
            .generate(
              canonicalGenerationKey,
            );

        expect(
          galaxy.type,
        ).toBe(
          GalaxyType.ELLIPTICAL,
        );

        expect(
          galaxy
            .physicalProperties
            .ageBillionYears,
        ).toBe(
          10.107100969452105,
        );

        expect(
          galaxy
            .physicalProperties
            .diameterLightYears,
        ).toBe(
          171801.38478681122,
        );

        expect(
          galaxy
            .physicalProperties
            .totalMassSolarMasses,
        ).toBe(
          5.0144255724751245e11,
        );

        expect(
          galaxy
            .physicalProperties
            .stellarPopulation,
        ).toBe(
          244730302878n,
        );

        expect(
          galaxy
            .physicalProperties
            .metallicitySolarRatio,
        ).toBe(
          1.3261045785469736,
        );

        expect(
          galaxy
            .physicalProperties
            .starFormationRateSolarMassesPerYear,
        ).toBe(
          0.19950335429750066,
        );

        expect(
          galaxy
            .physicalProperties
            .structure
            .spiralArmCount,
        ).toBe(
          0,
        );
      },
    );

    it(
      'should reproduce the canonical Android V1 nuclear vector',
      () => {
        const galaxy =
          InitialGalaxyGenerator
            .generate(
              canonicalGenerationKey,
            );

        expect(
          galaxy.nucleus,
        ).not.toBeNull();

        expect(
          galaxy.nucleus
            ?.state,
        ).toBe(
          GalacticNucleusState
            .QUIESCENT,
        );

        expect(
          galaxy.nucleus
            ?.supermassiveBlackHole,
        ).not.toBeNull();

        expect(
          galaxy.nucleus
            ?.supermassiveBlackHole
            ?.massSolarMasses,
        ).toBe(
          1.3908163761111212e8,
        );
      },
    );

    it(
      'should be exactly deterministic for the same generation key',
      () => {
        const first =
          InitialGalaxyGenerator
            .generate(
              canonicalGenerationKey,
            );

        const second =
          InitialGalaxyGenerator
            .generate(
              canonicalGenerationKey,
            );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should change the initial galaxy when the universe seed changes',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const first =
          InitialGalaxyGenerator
            .generate(
              canonicalGenerationKey,
            );

        const second =
          InitialGalaxyGenerator
            .generate(
              otherGenerationKey,
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
      'should remain independent of unrelated generation query order',
      () => {
        const before =
          InitialGalaxyGenerator
            .generate(
              canonicalGenerationKey,
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
              123456789n,
            ),
          );

        const after =
          InitialGalaxyGenerator
            .generate(
              canonicalGenerationKey,
            );

        expect(
          after,
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should generate all canonical galaxy types across a deterministic V1 root sample',
      () => {
        const generatedTypes =
          new Set<GalaxyType>();

        for (
          let index =
            0n;
          index <
            512n;
          index +=
            1n
        ) {
          const seed =
            universeSeedFromInteger(
              index,
            );

          const generationKey =
            new UniverseGenerationKey(
              seed,
              GeneratorVersion.V1,
            );

          const galaxy =
            InitialGalaxyGenerator
              .generate(
                generationKey,
              );

          generatedTypes.add(
            galaxy.type,
          );

          if (
            generatedTypes.size ===
            GalaxyType.values.length
          ) {
            break;
          }
        }

        expect(
          generatedTypes,
        ).toEqual(
          new Set(
            GalaxyType.values,
          ),
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
            InitialGalaxyGenerator
              .generate(
                unsupportedGenerationKey,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should generate designation without preimplementing exploration state',
      () => {
        const galaxy =
          InitialGalaxyGenerator
            .generate(
              canonicalGenerationKey,
            );

        expect(
          galaxy
            .designation
            .name,
        ).toBe(
          'Caeloria',
        );

        expect(
          galaxy
            .designation
            .proceduralCode,
        ).toBe(
          'GEN-V1-G0-8BA08585BCBD4D3041C1FD9EEBD048E4',
        );

        expect(
          'explorationState' in
            galaxy,
        ).toBe(
          false,
        );
      },
    );
  },
);

function universeSeedFromInteger(
  value:
    bigint,
): UniverseSeed {

  const normalized =
    value
      .toString(
        16,
      )
      .toUpperCase()
      .padStart(
        32,
        '0',
      );

  const canonical =
    normalized
      .match(
        /.{4}/g,
      )
      ?.join(
        '-',
      );

  if (
    canonical ===
    undefined
  ) {
    throw new Error(
      'Could not build deterministic test UniverseSeed.',
    );
  }

  return UniverseSeed.parse(
    canonical,
  );
}