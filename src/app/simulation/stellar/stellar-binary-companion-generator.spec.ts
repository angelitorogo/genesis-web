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
  StellarSystemComponentLabel,
} from '../../domain/stellar/stellar-system-component-label';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  StellarBinaryCompanionGenerator,
} from './stellar-binary-companion-generator';

import {
  StellarDesignationGenerator,
} from './stellar-designation-generator';

import {
  StellarGenerator,
} from './stellar-generator';

describe(
  'StellarBinaryCompanionGenerator point 16.2',
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

    const inputsFor =
      (
        locator:
          SystemLocator,
      ) => {
        const systemSeed =
          ProceduralTargetResolver
            .resolveTargetSeed(
              generationKey,
              locator,
            ) as SystemSeed;

        const designation =
          StellarDesignationGenerator
            .generate(
              generationKey,
              locator,
            );

        const primaryPhysicalProperties =
          StellarGenerator
            .generatePhysicalProperties(
              generationKey,
              locator,
              sector,
              population,
            );

        const primaryLifetimeProfile =
          StellarGenerator
            .generateLifetimeProfile(
              generationKey,
              locator,
              primaryPhysicalProperties,
              sector,
              population,
            );

        return {
          systemSeed,
          designation,
          primaryPhysicalProperties,
          primaryLifetimeProfile,
        };
      };

    const generateFor =
      (
        locator:
          SystemLocator,
      ) => {
        const inputs =
          inputsFor(
            locator,
          );

        return StellarBinaryCompanionGenerator
          .generate(
            generationKey,
            inputs.systemSeed,
            inputs.designation,
            inputs.primaryPhysicalProperties,
            inputs.primaryLifetimeProfile,
            sector,
          );
      };

    it(
      'should freeze the canonical Jotheria B identity without changing the point-15.6 system designation',
      () => {
        const locator =
          new SystemLocator(
            0n,
            0n,
            0n,
          );

        const inputs =
          inputsFor(
            locator,
          );

        const companion =
          StellarBinaryCompanionGenerator
            .generate(
              generationKey,
              inputs.systemSeed,
              inputs.designation,
              inputs.primaryPhysicalProperties,
              inputs.primaryLifetimeProfile,
              sector,
            );

        expect(
          companion.componentLabel,
        ).toBe(
          StellarSystemComponentLabel.B,
        );

        expect(
          companion.componentSeedHex,
        ).toBe(
          'A923624CF3ECDC5ED386CC9414F16BF2',
        );

        expect(
          companion.designation.name,
        ).toBe(
          'Jotheria B',
        );

        expect(
          companion.designation.proceduralCode,
        ).toBe(
          'GEN-V1-G0-S0-O0-SYS-DC2EACC73FFB3E9388F8BEB9FEBE1F2E-B',
        );

        expect(
          companion.massRatioToPrimary,
        ).toBeCloseTo(
          0.3604711278662204,
          14,
        );

        expect(
          companion.physicalProperties.initialMassSolar,
        ).toBeCloseTo(
          0.023630552817068502,
          14,
        );

        expect(
          companion.spectralAppearance.spectralType.designation,
        ).toBe(
          'L9',
        );

        expect(
          inputs.designation.name,
        ).toBe(
          'Jotheria',
        );
      },
    );

    it(
      'should be exactly deterministic and independent from unrelated companion query order',
      () => {
        const locator =
          new SystemLocator(
            4n,
            -12n,
            7n,
          );

        const before =
          generateFor(
            locator,
          );

        generateFor(
          new SystemLocator(
            42n,
            123456789n,
            99n,
          ),
        );

        const after =
          generateFor(
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
      'should keep B coeval with A and never more massive than the canonical primary',
      () => {
        for (
          let index = 0;
          index < 1_024;
          index += 1
        ) {
          const locator =
            new SystemLocator(
              BigInt(
                index % 7,
              ),
              BigInt(
                index -
                512,
              ),
              BigInt(
                index,
              ),
            );

          const inputs =
            inputsFor(
              locator,
            );

          const companion =
            StellarBinaryCompanionGenerator
              .generate(
                generationKey,
                inputs.systemSeed,
                inputs.designation,
                inputs.primaryPhysicalProperties,
                inputs.primaryLifetimeProfile,
                sector,
              );

          expect(
            companion.lifetimeProfile.ageBillionYears,
          ).toBe(
            inputs.primaryLifetimeProfile.ageBillionYears,
          );

          expect(
            companion.physicalProperties.initialMassSolar,
          ).toBeLessThanOrEqual(
            inputs.primaryPhysicalProperties.initialMassSolar,
          );

          expect(
            companion.massRatioToPrimary,
          ).toBeGreaterThan(
            0,
          );

          expect(
            companion.massRatioToPrimary,
          ).toBeLessThanOrEqual(
            1,
          );
        }
      },
      15_000,
    );

    it(
      'should derive unique B identities across 1024 addressed systems without creating bodies or orbital state',
      () => {
        const componentSeeds =
          new Set<string>();

        for (
          let index = 0;
          index < 1_024;
          index += 1
        ) {
          const companion =
            generateFor(
              new SystemLocator(
                BigInt(
                  index % 5,
                ),
                BigInt(
                  10_000 -
                  index,
                ),
                BigInt(
                  index,
                ),
              ),
            );

          componentSeeds.add(
            companion.componentSeedHex,
          );

          expect(
            'semiMajorAxisAu' in
              companion,
          ).toBe(
            false,
          );

          expect(
            'bodyLocators' in
              companion,
          ).toBe(
            false,
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
      'should reject an unsupported future GeneratorVersion',
      () => {
        const locator =
          new SystemLocator(
            0n,
            0n,
            0n,
          );

        const inputs =
          inputsFor(
            locator,
          );

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

        expect(
          () =>
            StellarBinaryCompanionGenerator
              .generate(
                fakeV2,
                inputs.systemSeed,
                inputs.designation,
                inputs.primaryPhysicalProperties,
                inputs.primaryLifetimeProfile,
                sector,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
