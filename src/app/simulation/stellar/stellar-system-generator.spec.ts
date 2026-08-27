import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorStellarPopulationProperties,
} from '../../domain/sector/galaxy-sector-stellar-population-properties';

import {
  type SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  StellarPopulationProfile,
  StellarPopulationRegime,
} from '../../domain/stellar/stellar-population-profile';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  StellarDesignationGenerator,
} from './stellar-designation-generator';

import {
  StellarGenerator,
} from './stellar-generator';

import {
  StellarSystemGenerator,
} from './stellar-system-generator';

describe(
  'StellarSystemGenerator point 16.1',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const sector =
      new GalaxySectorStellarPopulationProperties(
        1.0,
        4.6,
      );

    const population =
      new StellarPopulationProfile(
        4.6,
        0.45,
        0.20,
        0.55,
        0.25,
        0.82,
        0.72,
        0.30,
        0.22,
        StellarPopulationRegime.MIXED,
      );

    it(
      'should materialize the canonical V1 SystemSeed, designation and point-15 primary without a new seed level',
      () => {
        const locator =
          new SystemLocator(
            0n,
            0n,
            0n,
          );

        const system =
          StellarSystemGenerator
            .generateSingle(
              generationKey,
              locator,
              sector,
              population,
            );

        const directSeed =
          ProceduralTargetResolver
            .resolveTargetSeed(
              generationKey,
              locator,
            ) as SystemSeed;

        const directDesignation =
          StellarDesignationGenerator
            .generate(
              generationKey,
              locator,
            );

        const directStar =
          StellarGenerator
            .generateStar(
              generationKey,
              locator,
              sector,
              population,
            );

        expect(
          system.seed.normalizedValue,
        ).toBe(
          'DC2EACC73FFB3E9388F8BEB9FEBE1F2E',
        );

        expect(
          system.seed.normalizedValue,
        ).toBe(
          directSeed.normalizedValue,
        );

        expect(
          system.designation,
        ).toEqual(
          directDesignation,
        );

        expect(
          system.designation.name,
        ).toBe(
          'Jotheria',
        );

        expect(
          system.primaryStar,
        ).toEqual(
          directStar,
        );

        expect(
          system.multiplicity,
        ).toBe(
          StellarSystemMultiplicity.SINGLE,
        );

        expect(
          system.stellarComponentCount,
        ).toBe(
          1,
        );

        expect(
          system.isMultiple,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should be exactly deterministic and independent from unrelated simple-system query order',
      () => {
        const locator =
          new SystemLocator(
            4n,
            -12n,
            7n,
          );

        const before =
          StellarSystemGenerator
            .generateSingle(
              generationKey,
              locator,
              sector,
              population,
            );

        StellarSystemGenerator
          .generateSingle(
            generationKey,
            new SystemLocator(
              42n,
              123456789n,
              99n,
            ),
            sector,
            population,
          );

        const after =
          StellarSystemGenerator
            .generateSingle(
              generationKey,
              locator,
              sector,
              population,
            );

        expect(
          after,
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should preserve the complete signed-Long SystemLocator domain without materializing bodies',
      () => {
        const LONG_MIN =
          -(1n << 63n);

        const LONG_MAX =
          (1n << 63n) -
          1n;

        const system =
          StellarSystemGenerator
            .generateSingle(
              generationKey,
              new SystemLocator(
                LONG_MAX,
                LONG_MIN,
                LONG_MAX,
              ),
              sector,
              population,
            );

        expect(
          system.locator.galaxyIndex,
        ).toBe(
          LONG_MAX,
        );

        expect(
          system.locator.sectorKey,
        ).toBe(
          LONG_MIN,
        );

        expect(
          system.locator.galacticObjectIndex,
        ).toBe(
          LONG_MAX,
        );

        expect(
          'bodyLocators' in
            system,
        ).toBe(
          false,
        );

        expect(
          'planets' in
            system,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should keep 1024 addressed systems single while preserving unique canonical SystemSeeds',
      () => {
        const seedHexes =
          new Set<string>();

        for (
          let index = 0;
          index < 1024;
          index += 1
        ) {
          const system =
            StellarSystemGenerator
              .generateSingle(
                generationKey,
                new SystemLocator(
                  BigInt(
                    index % 5,
                  ),
                  BigInt(
                    index -
                    512,
                  ),
                  BigInt(
                    index,
                  ),
                ),
                sector,
                population,
              );

          expect(
            system.multiplicity,
          ).toBe(
            StellarSystemMultiplicity.SINGLE,
          );

          expect(
            system.stellarComponentCount,
          ).toBe(
            1,
          );

          seedHexes.add(
            system.seed.normalizedValue,
          );
        }

        expect(
          seedHexes.size,
        ).toBe(
          1024,
        );
      },
      15_000,
    );

    it(
      'should reject an unsupported future GeneratorVersion instead of silently changing V1',
      () => {
        const unsupportedVersion =
          Object.freeze({
            name:
              'V2',

            code:
              2,
          }) as unknown as GeneratorVersion;

        const fakeV2 =
          new UniverseGenerationKey(
            generationKey
              .universeSeed,
            unsupportedVersion,
          );

        expect(
          () =>
            StellarSystemGenerator
              .generateSingle(
                fakeV2,
                new SystemLocator(
                  0n,
                  0n,
                  0n,
                ),
                sector,
                population,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
