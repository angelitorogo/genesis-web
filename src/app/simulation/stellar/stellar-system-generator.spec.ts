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
  CircumbinaryPlanetCompatibilityRegime,
} from '../../domain/planetary/circumbinary-planet-compatibility';

import {
  CircumbinaryPlanetaryStabilityRegime,
  CircumbinaryStellarEvolutionRegime,
} from '../../domain/habitability/circumbinary-habitability-assessment';

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
  'StellarSystemGenerator points 16.1-16.6',
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

        expect(
          system.circumbinaryPlanetCompatibility,
        ).toBeNull();

        expect(
          system.circumbinaryHabitabilityAssessment,
        ).toBeNull();

        expect(
          system.supportsCircumbinaryPlanets,
        ).toBe(false);

        expect(
          system.hasStableCircumbinaryHabitableZone,
        ).toBe(false);
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

        expect(
          binary.circumbinaryPlanetCompatibility?.regime,
        ).toBe(
          CircumbinaryPlanetCompatibilityRegime.OPEN_OUTER,
        );

        expect(
          binary.circumbinaryPlanetCompatibility?.minimumStableSemiMajorAxisAu,
        ).toBeCloseTo(
          2.027289676885401,
          10,
        );

        expect(
          binary.supportsCircumbinaryPlanets,
        ).toBe(true);

        expect(
          binary.circumbinaryHabitabilityAssessment,
        ).not.toBeNull();

        expect(
          binary.circumbinaryHabitabilityAssessment?.hostMultiplicity,
        ).toBe(
          StellarSystemMultiplicity.BINARY,
        );

        expect(
          binary.circumbinaryHabitabilityAssessment?.combinedReferenceLuminositySolar,
        ).toBeCloseTo(
          0.00027431417336456224,
          15,
        );

        expect(
          binary.circumbinaryHabitabilityAssessment?.radiativeHabitableInnerEdgeAu,
        ).toBeCloseTo(
          0.01574165221957765,
          12,
        );

        expect(
          binary.circumbinaryHabitabilityAssessment?.radiativeHabitableOuterEdgeAu,
        ).toBeCloseTo(
          0.027758700092031185,
          12,
        );

        expect(
          binary.circumbinaryHabitabilityAssessment?.planetaryStabilityRegime,
        ).toBe(
          CircumbinaryPlanetaryStabilityRegime.NO_STABLE_HABITABLE_ZONE,
        );

        expect(
          binary.circumbinaryHabitabilityAssessment?.stellarEvolutionRegime,
        ).toBe(
          CircumbinaryStellarEvolutionRegime.REFERENCE_ONLY,
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
      'should preserve the full signed-Long SystemLocator domain for BINARY while keeping orbit state at system level and not materializing planets',
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
          system.orbitHierarchy.innerOrbit,
        ).not.toBeNull();

        expect(
          system.orbitHierarchy.outerOrbit,
        ).toBeNull();

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
      'should materialize Jotheria as TRIPLE while preserving exactly the frozen A/B architecture',
      () => {
        const locator =
          new SystemLocator(
            0n,
            0n,
            0n,
          );

        const binary =
          StellarSystemGenerator
            .generateBinary(
              generationKey,
              locator,
              sector,
              population,
            );

        const triple =
          StellarSystemGenerator
            .generateTriple(
              generationKey,
              locator,
              sector,
              population,
            );

        expect(triple.seed).toEqual(binary.seed);
        expect(triple.designation).toEqual(binary.designation);
        expect(triple.primaryStar).toEqual(binary.primaryStar);
        expect(triple.secondaryCompanion).toEqual(
          binary.secondaryCompanion,
        );
        expect(triple.multiplicity).toBe(
          StellarSystemMultiplicity.TRIPLE,
        );
        expect(triple.stellarComponentCount).toBe(3);
        expect(triple.tertiaryCompanion).not.toBeNull();
        expect(triple.tertiaryCompanion?.designation.name).toBe(
          'Jotheria C',
        );
        expect(triple.tertiaryCompanion?.componentSeedHex).toBe(
          '75A7DEA10ADE3DDA8751B531D3C6FF81',
        );

        expect(triple.tertiaryCompanion?.componentSeedHex).not.toBe(
          triple.secondaryCompanion?.componentSeedHex,
        );

        expect(
          triple.circumbinaryPlanetCompatibility?.regime,
        ).toBe(
          CircumbinaryPlanetCompatibilityRegime.DYNAMICALLY_EXCLUDED,
        );

        expect(
          triple.circumbinaryPlanetCompatibility?.minimumStableSemiMajorAxisAu,
        ).toBeCloseTo(
          2.027289676885401,
          10,
        );

        expect(
          triple.circumbinaryPlanetCompatibility?.maximumStableSemiMajorAxisAu,
        ).toBeCloseTo(
          1.6940361339638363,
          10,
        );

        expect(
          triple.supportsCircumbinaryPlanets,
        ).toBe(false);

        expect(
          triple.circumbinaryHabitabilityAssessment,
        ).not.toBeNull();

        expect(
          triple.hasStableCircumbinaryHabitableZone,
        ).toBe(false);

        expect(
          triple.supportsPersistentCircumbinaryHabitability,
        ).toBe(false);

        expect(
          triple.circumbinaryHabitabilityAssessment?.radiativeHabitableInnerEdgeAu,
        ).toBeCloseTo(
          binary.circumbinaryHabitabilityAssessment!.radiativeHabitableInnerEdgeAu,
          12,
        );

        expect(
          triple.circumbinaryHabitabilityAssessment?.radiativeHabitableOuterEdgeAu,
        ).toBeCloseTo(
          binary.circumbinaryHabitabilityAssessment!.radiativeHabitableOuterEdgeAu,
          12,
        );
      },
    );

    it(
      'should not perturb the frozen BINARY result when a TRIPLE view of the same system is queried',
      () => {
        const locator =
          new SystemLocator(
            4n,
            -12n,
            7n,
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
          .generateTriple(
            generationKey,
            locator,
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

        expect(after).toEqual(before);
      },
    );

    it(
      'should make generic generate() deterministic and exactly equal to the selected explicit architecture',
      () => {
        for (
          let index = 0;
          index < 256;
          index += 1
        ) {
          const locator =
            new SystemLocator(
              BigInt(index % 7),
              BigInt(30_000 - index),
              BigInt(index),
            );

          const selected =
            StellarSystemGenerator
              .generate(
                generationKey,
                locator,
                sector,
                population,
              );

          const explicit =
            selected.multiplicity ===
              StellarSystemMultiplicity.SINGLE
              ? StellarSystemGenerator.generateSingle(
                  generationKey,
                  locator,
                  sector,
                  population,
                )
              : selected.multiplicity ===
                  StellarSystemMultiplicity.BINARY
                ? StellarSystemGenerator.generateBinary(
                    generationKey,
                    locator,
                    sector,
                    population,
                  )
                : StellarSystemGenerator.generateTriple(
                    generationKey,
                    locator,
                    sector,
                    population,
                  );

          expect(selected).toEqual(explicit);
        }
      },
      15_000,
    );

    it(
      'should preserve the full signed-Long SystemLocator domain for TRIPLE with the point-16.4 hierarchy isolated from companion identity',
      () => {
        const LONG_MIN =
          -(1n << 63n);

        const LONG_MAX =
          (1n << 63n) -
          1n;

        const system =
          StellarSystemGenerator
            .generateTriple(
              generationKey,
              new SystemLocator(
                LONG_MAX,
                LONG_MIN,
                LONG_MAX,
              ),
              sector,
              population,
            );

        expect(system.locator.galaxyIndex).toBe(LONG_MAX);
        expect(system.locator.sectorKey).toBe(LONG_MIN);
        expect(system.locator.galacticObjectIndex).toBe(LONG_MAX);
        expect(system.orbitHierarchy.innerOrbit).not.toBeNull();
        expect(system.orbitHierarchy.outerOrbit).not.toBeNull();
        expect('semiMajorAxisAu' in system.tertiaryCompanion!).toBe(false);
      },
    );

    it(
      'should keep 1024 C seeds unique and preserve A >= B >= C initial-mass ordering',
      () => {
        const cSeeds =
          new Set<string>();

        for (
          let index = 0;
          index < 1_024;
          index += 1
        ) {
          const locator =
            new SystemLocator(
              BigInt(index % 5),
              BigInt(index - 512),
              BigInt(index),
            );

          const triple =
            StellarSystemGenerator
              .generateTriple(
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

          const secondary =
            triple.secondaryCompanion!;

          const tertiary =
            triple.tertiaryCompanion!;

          expect(
            secondary.physicalProperties.initialMassSolar,
          ).toBeLessThanOrEqual(
            primaryPhysical.initialMassSolar,
          );

          expect(
            tertiary.physicalProperties.initialMassSolar,
          ).toBeLessThanOrEqual(
            secondary.physicalProperties.initialMassSolar,
          );

          expect(tertiary.componentSeedHex).not.toBe(
            secondary.componentSeedHex,
          );

          cSeeds.add(tertiary.componentSeedHex);
        }

        expect(cSeeds.size).toBe(1_024);
      },
      20_000,
    );

    it(
      'should preserve the A-B circumbinary inner edge from BINARY to TRIPLE while producing both bounded and C-excluded real triple architectures',
      () => {
        let bounded =
          0;

        let excluded =
          0;

        for (
          let index = 0;
          index < 256;
          index += 1
        ) {
          const locator =
            new SystemLocator(
              BigInt(index % 7),
              BigInt(index - 2_048),
              BigInt(index),
            );

          const binary =
            StellarSystemGenerator
              .generateBinary(
                generationKey,
                locator,
                sector,
                population,
              );

          const triple =
            StellarSystemGenerator
              .generateTriple(
                generationKey,
                locator,
                sector,
                population,
              );

          expect(
            triple.circumbinaryPlanetCompatibility?.minimumStableSemiMajorAxisAu,
          ).toBe(
            binary.circumbinaryPlanetCompatibility?.minimumStableSemiMajorAxisAu,
          );

          expect(
            binary.supportsCircumbinaryPlanets,
          ).toBe(true);

          if (
            triple.circumbinaryPlanetCompatibility?.regime ===
            CircumbinaryPlanetCompatibilityRegime.TERTIARY_BOUNDED
          ) {
            bounded +=
              1;

            expect(
              triple.supportsCircumbinaryPlanets,
            ).toBe(true);
          } else {
            excluded +=
              1;

            expect(
              triple.circumbinaryPlanetCompatibility?.regime,
            ).toBe(
              CircumbinaryPlanetCompatibilityRegime.DYNAMICALLY_EXCLUDED,
            );

            expect(
              triple.supportsCircumbinaryPlanets,
            ).toBe(false);
          }
        }

        expect(bounded).toBeGreaterThan(0);
        expect(excluded).toBeGreaterThan(0);
      },
      20_000,
    );

    it(
      'should reject an unsupported future GeneratorVersion for all point-16.5 architecture entry points',
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

        expect(
          () =>
            StellarSystemGenerator
              .generateTriple(
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
              .generate(
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
