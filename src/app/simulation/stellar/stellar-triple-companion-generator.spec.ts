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

import {
  StellarTripleCompanionGenerator,
} from './stellar-triple-companion-generator';

describe(
  'StellarTripleCompanionGenerator point 16.3',
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

        const secondaryCompanion =
          StellarBinaryCompanionGenerator
            .generate(
              generationKey,
              systemSeed,
              designation,
              primaryPhysicalProperties,
              primaryLifetimeProfile,
              sector,
            );

        return {
          systemSeed,
          designation,
          primaryPhysicalProperties,
          primaryLifetimeProfile,
          secondaryCompanion,
        };
      };

    const generateFor =
      (
        locator:
          SystemLocator,
      ) => {
        const inputs =
          inputsFor(locator);

        return StellarTripleCompanionGenerator
          .generate(
            generationKey,
            inputs.systemSeed,
            inputs.designation,
            inputs.primaryPhysicalProperties,
            inputs.secondaryCompanion,
            inputs.primaryLifetimeProfile,
            sector,
          );
      };

    it(
      'should materialize canonical Jotheria C independently from the frozen B branch',
      () => {
        const locator =
          new SystemLocator(
            0n,
            0n,
            0n,
          );

        const inputs =
          inputsFor(locator);

        const companion =
          StellarTripleCompanionGenerator
            .generate(
              generationKey,
              inputs.systemSeed,
              inputs.designation,
              inputs.primaryPhysicalProperties,
              inputs.secondaryCompanion,
              inputs.primaryLifetimeProfile,
              sector,
            );

        expect(companion.componentLabel).toBe(
          StellarSystemComponentLabel.C,
        );

        expect(companion.componentSeedHex).toBe(
          '75A7DEA10ADE3DDA8751B531D3C6FF81',
        );

        expect(companion.componentSeedHex).not.toBe(
          inputs.secondaryCompanion.componentSeedHex,
        );

        expect(companion.designation.name).toBe(
          'Jotheria C',
        );

        expect(companion.designation.proceduralCode).toBe(
          'GEN-V1-G0-S0-O0-SYS-DC2EACC73FFB3E9388F8BEB9FEBE1F2E-C',
        );

        expect(companion.massRatioToPrimary).toBeCloseTo(
          0.2633837094317727,
          14,
        );

        expect(companion.physicalProperties.initialMassSolar).toBeCloseTo(
          0.017266022645765877,
          14,
        );

        expect(companion.physicalProperties.initialMassSolar).toBeLessThanOrEqual(
          inputs.secondaryCompanion.physicalProperties.initialMassSolar,
        );

        expect(companion.spectralAppearance.spectralType.designation).toBe(
          'L9',
        );

        expect(companion.lifetimeProfile.ageBillionYears).toBe(
          inputs.primaryLifetimeProfile.ageBillionYears,
        );
      },
    );

    it(
      'should be exactly deterministic and independent from unrelated C query order',
      () => {
        const locator =
          new SystemLocator(
            4n,
            -12n,
            7n,
          );

        const before =
          generateFor(locator);

        generateFor(
          new SystemLocator(
            42n,
            123456789n,
            99n,
          ),
        );

        const after =
          generateFor(locator);

        expect(after).toEqual(before);
      },
    );

    it(
      'should keep C coeval with A and ordered A >= B >= C across 1024 systems',
      () => {
        for (
          let index = 0;
          index < 1_024;
          index += 1
        ) {
          const locator =
            new SystemLocator(
              BigInt(index % 7),
              BigInt(index - 512),
              BigInt(index),
            );

          const inputs =
            inputsFor(locator);

          const companion =
            StellarTripleCompanionGenerator
              .generate(
                generationKey,
                inputs.systemSeed,
                inputs.designation,
                inputs.primaryPhysicalProperties,
                inputs.secondaryCompanion,
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
            inputs.secondaryCompanion.physicalProperties.initialMassSolar,
          );

          expect(
            inputs.secondaryCompanion.physicalProperties.initialMassSolar,
          ).toBeLessThanOrEqual(
            inputs.primaryPhysicalProperties.initialMassSolar,
          );

          expect(companion.massRatioToPrimary).toBeGreaterThan(0);
          expect(companion.massRatioToPrimary).toBeLessThanOrEqual(
            inputs.secondaryCompanion.massRatioToPrimary,
          );
        }
      },
      15_000,
    );

    it(
      'should derive unique C identities across 1024 addressed systems without orbital state',
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
                BigInt(index % 5),
                BigInt(20_000 - index),
                BigInt(index),
              ),
            );

          componentSeeds.add(
            companion.componentSeedHex,
          );

          expect(
            'semiMajorAxisAu' in companion,
          ).toBe(false);

          expect(
            'orbit' in companion,
          ).toBe(false);
        }

        expect(componentSeeds.size).toBe(1_024);
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
          inputsFor(locator);

        const unsupportedVersion =
          Object.freeze({
            name: 'V2',
            code: 2,
          }) as unknown as GeneratorVersion;

        const fakeV2 =
          new UniverseGenerationKey(
            generationKey.universeSeed,
            unsupportedVersion,
          );

        expect(
          () =>
            StellarTripleCompanionGenerator
              .generate(
                fakeV2,
                inputs.systemSeed,
                inputs.designation,
                inputs.primaryPhysicalProperties,
                inputs.secondaryCompanion,
                inputs.primaryLifetimeProfile,
                sector,
              ),
        ).toThrow(RangeError);
      },
    );
  },
);
