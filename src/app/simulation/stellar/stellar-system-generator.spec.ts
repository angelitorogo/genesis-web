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
  'StellarSystemGenerator points 16.1-16.2',
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
      'should preserve the complete frozen point-16.1 SINGLE materialization',
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
          system.secondaryCompanion,
        ).toBeNull();
      },
    );

    it(
      'should materialize Jotheria as BINARY while preserving exactly the same SystemSeed, base designation and canonical A primary',
      () => {
        const locator =
          new SystemLocator(
            0n,
            0n,
            0n,
          );

        const single =
          StellarSystemGenerator
            .generateSingle(
              generationKey,
              locator,
              sector,
              population,
            );

        const binary =
          StellarSystemGenerator
            .generateBinary(
              generationKey,
              locator,
              sector,
              population,
            );

        expect(
          binary.seed.normalizedValue,
        ).toBe(
          single.seed.normalizedValue,
        );

        expect(
          binary.designation,
        ).toEqual(
          single.designation,
        );

        expect(
          binary.designation.name,
        ).toBe(
          'Jotheria',
        );

        expect(
          binary.primaryStar,
        ).toEqual(
          single.primaryStar,
        );

        expect(
          binary.primaryComponentDesignation.name,
        ).toBe(
          'Jotheria A',
        );

        expect(
          binary.secondaryCompanion?.designation.name,
        ).toBe(
          'Jotheria B',
        );

        expect(
          binary.secondaryCompanion?.componentSeedHex,
        ).toBe(
          'A923624CF3ECDC5ED386CC9414F16BF2',
        );

        expect(
          binary.multiplicity,
        ).toBe(
          StellarSystemMultiplicity.BINARY,
        );

        expect(
          binary.stellarComponentCount,
        ).toBe(
          2,
        );

        expect(
          binary.isMultiple,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should not perturb the frozen SINGLE result when a BINARY view of the same system is queried',
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
          .generateBinary(
            generationKey,
            locator,
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
      'should generate binary systems exactly deterministically and independently from unrelated query order',
      () => {
        const locator =
          new SystemLocator(
            3n,
            27n,
            42n,
          );

        const before =
          StellarSystemGenerator
            .generateBinary(
              generationKey,
              locator,
              sector,
              population,
            );

        StellarSystemGenerator
          .generateBinary(
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
            .generateBinary(
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
      'should preserve the full signed-Long SystemLocator domain for BINARY without materializing orbit or planets',
      () => {
        const LONG_MIN =
          -(1n << 63n);

        const LONG_MAX =
          (1n << 63n) -
          1n;

        const system =
          StellarSystemGenerator
            .generateBinary(
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
          'orbit' in
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

        expect(
          'semiMajorAxisAu' in
            system.secondaryCompanion!,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should keep 1024 binary component seeds unique while preserving the canonical primary as the more massive/equal component',
      () => {
        const componentSeeds =
          new Set<string>();

        for (
          let index = 0;
          index < 1_024;
          index += 1
        ) {
          const locator =
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
            );

          const binary =
            StellarSystemGenerator
              .generateBinary(
                generationKey,
                locator,
                sector,
                population,
              );

          const primaryPhysical =
            StellarGenerator
              .generatePhysicalProperties(
                generationKey,
                locator,
                sector,
                population,
              );

          const companion =
            binary.secondaryCompanion!;

          expect(
            companion.physicalProperties.initialMassSolar,
          ).toBeLessThanOrEqual(
            primaryPhysical.initialMassSolar,
          );

          componentSeeds.add(
            companion.componentSeedHex,
          );
        }

        expect(
          componentSeeds.size,
        ).toBe(
          1_024,
        );
      },
      15_000,
    );

    it(
      'should reject an unsupported future GeneratorVersion for both explicit architectures',
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
            generationKey.universeSeed,
            unsupportedVersion,
          );

        const locator =
          new SystemLocator(
            0n,
            0n,
            0n,
          );

        expect(
          () =>
            StellarSystemGenerator
              .generateSingle(
                fakeV2,
                locator,
                sector,
                population,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            StellarSystemGenerator
              .generateBinary(
                fakeV2,
                locator,
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
