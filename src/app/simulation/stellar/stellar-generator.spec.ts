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
  STELLAR_EVOLUTION_V1_MAX_INITIAL_MASS_SOLAR,
  STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR,
  StellarEvolutionInput,
} from '../../domain/stellar/stellar-evolution-input';

import {
  StellarActivityRegime,
} from '../../domain/stellar/stellar-activity-regime';

import {
  StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';

import {
  STELLAR_LIFETIME_V1_MAX_AGE_BILLION_YEARS,
  StellarLifetimeProfile,
} from '../../domain/stellar/stellar-lifetime-profile';

import {
  StellarEvolutionState,
} from '../../domain/stellar/stellar-evolution-state';

import {
  StellarPopulationProfile,
  StellarPopulationRegime,
} from '../../domain/stellar/stellar-population-profile';

import {
  StellarSpectrumProfile,
} from '../../domain/spectroscopy/stellar-spectrum-profile';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  StellarEvolutionEngine,
} from './stellar-evolution-engine';

import {
  StellarGenerator,
} from './stellar-generator';

describe(
  'StellarGenerator points 15.1-15.4',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const sectorPopulation =
      new GalaxySectorStellarPopulationProperties(
        1.0,
        8.0,
      );

    const mixedProfile =
      new StellarPopulationProfile(
        8.0,
        0.35,
        0.20,
        0.45,
        0.35,
        0.88,
        0.72,
        0.18,
        0.55,
        StellarPopulationRegime.MIXED,
      );


    const lifetimeFor =
      (
        initialMassSolar:
          number,

        ageBillionYears:
          number,
      ): StellarLifetimeProfile => {

        const assessment =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              new StellarEvolutionInput(
                initialMassSolar,
                sectorPopulation
                  .characteristicMetallicitySolarRatio,
                ageBillionYears,
              ),
            );

        const mainSequenceLifetime =
          assessment
            .mainSequenceLifetimeBillionYears;

        const postMainSequenceDuration =
          assessment
            .postMainSequenceDurationBillionYears;

        if (
          mainSequenceLifetime ===
            null ||
          postMainSequenceDuration ===
            null
        ) {
          return new StellarLifetimeProfile(
            ageBillionYears,
            null,
            null,
            assessment,
          );
        }

        const terminalAge =
          mainSequenceLifetime +
          postMainSequenceDuration;

        return new StellarLifetimeProfile(
          ageBillionYears,
          terminalAge,
          Math.max(
            0,
            terminalAge -
              ageBillionYears,
          ),
          assessment,
        );
      };

    it(
      'should generate exactly deterministic physical properties for the same versioned system and environment',
      () => {
        const locator =
          new SystemLocator(
            0n,
            123456789n,
            7n,
          );

        const first =
          StellarGenerator
            .generatePhysicalProperties(
              generationKey,
              locator,
              sectorPopulation,
              mixedProfile,
            );

        const second =
          StellarGenerator
            .generatePhysicalProperties(
              generationKey,
              locator,
              sectorPopulation,
              mixedProfile,
            );

        expect(
          second,
        ).toEqual(
          first,
        );

        expect(
          first.currentMassSolar,
        ).toBe(
          first.initialMassSolar,
        );
      },
    );

    it(
      'should isolate physical entropy by SystemLocator so neighboring systems need not share the same star',
      () => {
        const first =
          StellarGenerator
            .generatePhysicalProperties(
              generationKey,
              new SystemLocator(
                0n,
                123456789n,
                7n,
              ),
              sectorPopulation,
              mixedProfile,
            );

        const second =
          StellarGenerator
            .generatePhysicalProperties(
              generationKey,
              new SystemLocator(
                0n,
                123456789n,
                8n,
              ),
              sectorPopulation,
              mixedProfile,
            );

        expect(
          second,
        ).not.toEqual(
          first,
        );
      },
    );

    it(
      'should keep thousands of generated initial masses inside the phase-14 evolution envelope',
      () => {
        for (
          let index =
            0n;
          index <
            2_048n;
          index +=
            1n
        ) {
          const properties =
            StellarGenerator
              .generatePhysicalProperties(
                generationKey,
                new SystemLocator(
                  0n,
                  42n,
                  index,
                ),
                sectorPopulation,
                mixedProfile,
              );

          expect(
            properties
              .initialMassSolar,
          ).toBeGreaterThanOrEqual(
            STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR,
          );

          expect(
            properties
              .initialMassSolar,
          ).toBeLessThanOrEqual(
            STELLAR_EVOLUTION_V1_MAX_INITIAL_MASS_SOLAR,
          );

          expect(
            Number.isFinite(
              properties.radiusSolar,
            ),
          ).toBe(
            true,
          );

          expect(
            Number.isFinite(
              properties.luminositySolar,
            ),
          ).toBe(
            true,
          );

          expect(
            Number.isFinite(
              properties.effectiveTemperatureKelvin,
            ),
          ).toBe(
            true,
          );
        }
      },
    );

    it(
      'should satisfy the normalized Stefan-Boltzmann radius-luminosity-temperature relation',
      () => {
        for (
          let index =
            0n;
          index <
            256n;
          index +=
            1n
        ) {
          const properties =
            StellarGenerator
              .generatePhysicalProperties(
                generationKey,
                new SystemLocator(
                  2n,
                  -17n,
                  index,
                ),
                sectorPopulation,
                mixedProfile,
              );

          const reconstructedTemperature =
            5_772 *
            (
              properties
                .luminositySolar /
              properties
                .radiusSolar **
                2
            ) **
              0.25;

          expect(
            properties
              .effectiveTemperatureKelvin,
          ).toBeCloseTo(
            reconstructedTemperature,
            10,
          );
        }
      },
    );

    it(
      'should keep point-15.1 temperatures compatible with the existing point-13.2 stellar spectroscopy input envelope',
      () => {
        for (
          let index =
            0n;
          index <
            512n;
          index +=
            1n
        ) {
          const properties =
            StellarGenerator
              .generatePhysicalProperties(
                generationKey,
                new SystemLocator(
                  4n,
                  81n,
                  index,
                ),
                sectorPopulation,
                mixedProfile,
              );

          expect(
            () =>
              new StellarSpectrumProfile(
                properties
                  .effectiveTemperatureKelvin,
              ),
          ).not.toThrow();
        }
      },
    );

    it(
      'should keep the point-15.3 age/remnant boundary out of the 15.1 physical stream',
      () => {
        const locator =
          new SystemLocator(
            0n,
            7n,
            99n,
          );

        const youngLowRemnant =
          new StellarPopulationProfile(
            1.0,
            0.35,
            0.20,
            0.45,
            0.35,
            0.88,
            0.72,
            0.18,
            0.05,
            StellarPopulationRegime.MIXED,
          );

        const oldHighRemnant =
          new StellarPopulationProfile(
            13.0,
            0.35,
            0.20,
            0.45,
            0.35,
            0.88,
            0.72,
            0.18,
            0.95,
            StellarPopulationRegime.OLD_QUIESCENT,
          );

        expect(
          StellarGenerator
            .generatePhysicalProperties(
              generationKey,
              locator,
              sectorPopulation,
              youngLowRemnant,
            ),
        ).toEqual(
          StellarGenerator
            .generatePhysicalProperties(
              generationKey,
              locator,
              sectorPopulation,
              oldHighRemnant,
            ),
        );
      },
    );

    it(
      'should make an active high-mass-favored population yield more massive progenitors than an old quiescent population over the same system locators',
      () => {
        const active =
          new StellarPopulationProfile(
            1.0,
            0.90,
            0.75,
            0.20,
            0.05,
            0.72,
            0.50,
            0.95,
            0.05,
            StellarPopulationRegime.YOUNG_ACTIVE,
          );

        const quiescent =
          new StellarPopulationProfile(
            12.0,
            0.05,
            0.08,
            0.22,
            0.70,
            0.95,
            0.72,
            0.01,
            0.92,
            StellarPopulationRegime.OLD_QUIESCENT,
          );

        let activeHighMassCount =
          0;

        let quiescentHighMassCount =
          0;

        for (
          let index =
            0n;
          index <
            4_096n;
          index +=
            1n
        ) {
          const locator =
            new SystemLocator(
              1n,
              5n,
              index,
            );

          const activeMass =
            StellarGenerator
              .generatePhysicalProperties(
                generationKey,
                locator,
                sectorPopulation,
                active,
              )
              .initialMassSolar;

          const quiescentMass =
            StellarGenerator
              .generatePhysicalProperties(
                generationKey,
                locator,
                sectorPopulation,
                quiescent,
              )
              .initialMassSolar;

          if (
            activeMass >=
            2.10
          ) {
            activeHighMassCount +=
              1;
          }

          if (
            quiescentMass >=
            2.10
          ) {
            quiescentHighMassCount +=
              1;
          }
        }

        expect(
          activeHighMassCount,
        ).toBeGreaterThan(
          quiescentHighMassCount,
        );
      },
    );

    it(
      'should derive a solar reference baseline as detailed G2 without any extra random draw',
      () => {
        const physical =
          new StellarPhysicalProperties(
            1.0,
            1.0,
            1.0,
            1.0,
            5_772,
          );

        const first =
          StellarGenerator
            .generateSpectralAppearance(
              generationKey,
              physical,
              sectorPopulation,
            );

        const second =
          StellarGenerator
            .generateSpectralAppearance(
              generationKey,
              physical,
              sectorPopulation,
            );

        expect(
          first,
        ).toEqual(
          second,
        );

        expect(
          first
            .spectralType
            .designation,
        ).toBe(
          'G2',
        );
      },
    );

    it(
      'should preserve the frozen phase-14 broad family for generated reference stars while adding only the detailed subtype and color',
      () => {
        for (
          let index =
            0n;
          index <
            1_024n;
          index +=
            1n
        ) {
          const locator =
            new SystemLocator(
              3n,
              27n,
              index,
            );

          const physical =
            StellarGenerator
              .generatePhysicalProperties(
                generationKey,
                locator,
                sectorPopulation,
                mixedProfile,
              );

          const appearance =
            StellarGenerator
              .generateSpectralAppearance(
                generationKey,
                physical,
                sectorPopulation,
              );

          const referenceEvolution =
            StellarEvolutionEngine
              .evaluate(
                generationKey,
                new StellarEvolutionInput(
                  physical
                    .initialMassSolar,
                  sectorPopulation
                    .characteristicMetallicitySolarRatio,
                  0,
                ),
              );

          const expectedFamily =
            referenceEvolution
              .mainSequenceClass
              ?.name ??
            referenceEvolution
              .brownDwarfClass
              ?.name;

          expect(
            expectedFamily,
          ).toBeDefined();

          expect(
            appearance
              .spectralType
              .family,
          ).toBe(
            expectedFamily,
          );

          expect(
            appearance
              .spectralType
              .subtype,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            appearance
              .spectralType
              .subtype,
          ).toBeLessThanOrEqual(
            9,
          );
        }
      },
    );

    it(
      'should keep point-15.2 classification observationally pure with respect to the frozen 15.1 physical baseline',
      () => {
        const locator =
          new SystemLocator(
            0n,
            -4n,
            73n,
          );

        const before =
          StellarGenerator
            .generatePhysicalProperties(
              generationKey,
              locator,
              sectorPopulation,
              mixedProfile,
            );

        StellarGenerator
          .generateSpectralAppearance(
            generationKey,
            before,
            sectorPopulation,
          );

        const after =
          StellarGenerator
            .generatePhysicalProperties(
              generationKey,
              locator,
              sectorPopulation,
              mixedProfile,
            );

        expect(
          after,
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should generate a deterministic point-15.3 age and remaining-life profile from an isolated age branch',
      () => {
        const locator =
          new SystemLocator(
            0n,
            123456789n,
            17n,
          );

        const physical =
          StellarGenerator
            .generatePhysicalProperties(
              generationKey,
              locator,
              sectorPopulation,
              mixedProfile,
            );

        const first =
          StellarGenerator
            .generateLifetimeProfile(
              generationKey,
              locator,
              physical,
              sectorPopulation,
              mixedProfile,
            );

        const second =
          StellarGenerator
            .generateLifetimeProfile(
              generationKey,
              locator,
              physical,
              sectorPopulation,
              mixedProfile,
            );

        expect(
          second,
        ).toEqual(
          first,
        );

        expect(
          first.ageBillionYears,
        ).toBeGreaterThanOrEqual(
          0,
        );

        expect(
          first.ageBillionYears,
        ).toBeLessThanOrEqual(
          STELLAR_LIFETIME_V1_MAX_AGE_BILLION_YEARS,
        );
      },
    );

    it(
      'should derive remaining life exactly from the frozen phase-14 lifetime without inventing a finite brown-dwarf endpoint',
      () => {
        for (
          let index =
            0n;
          index <
            1_024n;
          index +=
            1n
        ) {
          const locator =
            new SystemLocator(
              5n,
              -19n,
              index,
            );

          const physical =
            StellarGenerator
              .generatePhysicalProperties(
                generationKey,
                locator,
                sectorPopulation,
                mixedProfile,
              );

          const lifetime =
            StellarGenerator
              .generateLifetimeProfile(
                generationKey,
                locator,
                physical,
                sectorPopulation,
                mixedProfile,
              );

          const assessment =
            lifetime
              .evolutionAssessment;

          if (
            assessment
              .evolutionState
              .name ===
            StellarEvolutionState
              .BROWN_DWARF
              .name
          ) {
            expect(
              lifetime.terminalAgeBillionYears,
            ).toBeNull();

            expect(
              lifetime.remainingLifeBillionYears,
            ).toBeNull();

            continue;
          }

          const mainSequenceLifetime =
            assessment
              .mainSequenceLifetimeBillionYears;

          const postMainSequenceDuration =
            assessment
              .postMainSequenceDurationBillionYears;

          expect(
            mainSequenceLifetime,
          ).not.toBeNull();

          expect(
            postMainSequenceDuration,
          ).not.toBeNull();

          const terminalAge =
            mainSequenceLifetime! +
            postMainSequenceDuration!;

          expect(
            lifetime.terminalAgeBillionYears,
          ).toBeCloseTo(
            terminalAge,
            12,
          );

          expect(
            lifetime.remainingLifeBillionYears,
          ).toBeCloseTo(
            Math.max(
              0,
              terminalAge -
                lifetime.ageBillionYears,
            ),
            12,
          );
        }
      },
    );

    it(
      'should make old high-remnant populations systematically older without changing point-15.1 physical properties',
      () => {
        const lowRemnant =
          new StellarPopulationProfile(
            8.0,
            0.05,
            0,
            0,
            1,
            0.88,
            0.72,
            0.18,
            0,
            StellarPopulationRegime.OLD_QUIESCENT,
          );

        const highRemnant =
          new StellarPopulationProfile(
            8.0,
            0.05,
            0,
            0,
            1,
            0.88,
            0.72,
            0.18,
            1,
            StellarPopulationRegime.OLD_QUIESCENT,
          );

        let lowAgeSum =
          0;

        let highAgeSum =
          0;

        for (
          let index =
            0n;
          index <
            512n;
          index +=
            1n
        ) {
          const locator =
            new SystemLocator(
              6n,
              23n,
              index,
            );

          const lowPhysical =
            StellarGenerator
              .generatePhysicalProperties(
                generationKey,
                locator,
                sectorPopulation,
                lowRemnant,
              );

          const highPhysical =
            StellarGenerator
              .generatePhysicalProperties(
                generationKey,
                locator,
                sectorPopulation,
                highRemnant,
              );

          expect(
            highPhysical,
          ).toEqual(
            lowPhysical,
          );

          lowAgeSum +=
            StellarGenerator
              .generateLifetimeProfile(
                generationKey,
                locator,
                lowPhysical,
                sectorPopulation,
                lowRemnant,
              )
              .ageBillionYears;

          highAgeSum +=
            StellarGenerator
              .generateLifetimeProfile(
                generationKey,
                locator,
                highPhysical,
                sectorPopulation,
                highRemnant,
              )
              .ageBillionYears;
        }

        expect(
          highAgeSum,
        ).toBeGreaterThan(
          lowAgeSum,
        );
      },
    );

    it(
      'should materialize the canonical current Star from the exact point-15.3 evolution assessment',
      () => {
        for (
          let index =
            0n;
          index <
            512n;
          index +=
            1n
        ) {
          const locator =
            new SystemLocator(
              7n,
              31n,
              index,
            );

          const physical =
            StellarGenerator
              .generatePhysicalProperties(
                generationKey,
                locator,
                sectorPopulation,
                mixedProfile,
              );

          const lifetime =
            StellarGenerator
              .generateLifetimeProfile(
                generationKey,
                locator,
                physical,
                sectorPopulation,
                mixedProfile,
              );

          const star =
            StellarGenerator
              .generateStar(
                generationKey,
                locator,
                sectorPopulation,
                mixedProfile,
              );

          const assessment =
            lifetime
              .evolutionAssessment;

          expect(
            star.locator,
          ).toEqual(
            locator,
          );

          expect(
            star.evolutionState.name,
          ).toBe(
            assessment.evolutionState.name,
          );

          expect(
            star.mainSequenceClass?.name ??
              null,
          ).toBe(
            assessment.mainSequenceClass?.name ??
              null,
          );

          expect(
            star.brownDwarfClass?.name ??
              null,
          ).toBe(
            assessment.brownDwarfClass?.name ??
              null,
          );

          expect(
            star.postMainSequenceStage?.name ??
              null,
          ).toBe(
            assessment.postMainSequenceStage?.name ??
              null,
          );

          expect(
            star.whiteDwarfComposition?.name ??
              null,
          ).toBe(
            assessment.whiteDwarfComposition?.name ??
              null,
          );

          expect(
            star.neutronStarFormationChannel?.name ??
              null,
          ).toBe(
            assessment.neutronStarFormationChannel?.name ??
              null,
          );

          expect(
            star.blackHoleFormationChannel?.name ??
              null,
          ).toBe(
            assessment.blackHoleFormationChannel?.name ??
              null,
          );
        }
      },
    );

    it(
      'should keep age generation isolated from both the frozen physical baseline and point-15.2 reference spectral appearance',
      () => {
        const locator =
          new SystemLocator(
            8n,
            -41n,
            3n,
          );

        const physicalBefore =
          StellarGenerator
            .generatePhysicalProperties(
              generationKey,
              locator,
              sectorPopulation,
              mixedProfile,
            );

        const appearanceBefore =
          StellarGenerator
            .generateSpectralAppearance(
              generationKey,
              physicalBefore,
              sectorPopulation,
            );

        StellarGenerator
          .generateLifetimeProfile(
            generationKey,
            locator,
            physicalBefore,
            sectorPopulation,
            mixedProfile,
          );

        const physicalAfter =
          StellarGenerator
            .generatePhysicalProperties(
              generationKey,
              locator,
              sectorPopulation,
              mixedProfile,
            );

        const appearanceAfter =
          StellarGenerator
            .generateSpectralAppearance(
              generationKey,
              physicalAfter,
              sectorPopulation,
            );

        expect(
          physicalAfter,
        ).toEqual(
          physicalBefore,
        );

        expect(
          appearanceAfter,
        ).toEqual(
          appearanceBefore,
        );
      },
    );

    it(
      'should generate exactly deterministic point-15.4 activity and flare statistics from an isolated branch',
      () => {
        const locator =
          new SystemLocator(
            3n,
            -91n,
            4n,
          );

        const physical =
          new StellarPhysicalProperties(
            1.0,
            1.0,
            1.0,
            1.0,
            5_772,
          );

        const lifetime =
          lifetimeFor(
            1.0,
            2.0,
          );

        const first =
          StellarGenerator
            .generateActivityProfile(
              generationKey,
              locator,
              physical,
              lifetime,
            );

        const second =
          StellarGenerator
            .generateActivityProfile(
              generationKey,
              locator,
              physical,
              lifetime,
            );

        expect(
          second,
        ).toEqual(
          first,
        );

        expect(
          first.ordinaryFlareModelApplicable,
        ).toBe(
          true,
        );

        expect(
          first.regime?.name,
        ).toBe(
          StellarActivityRegime
            .fromActivityIndex(
              first.magneticActivityIndex!,
            )
            .name,
        );
      },
    );

    it(
      'should make a younger solar-type main-sequence star more magnetically active than the same star at an older age',
      () => {
        const locator =
          new SystemLocator(
            1n,
            9n,
            5n,
          );

        const physical =
          new StellarPhysicalProperties(
            1.0,
            1.0,
            1.0,
            1.0,
            5_772,
          );

        const young =
          StellarGenerator
            .generateActivityProfile(
              generationKey,
              locator,
              physical,
              lifetimeFor(
                1.0,
                0.10,
              ),
            );

        const old =
          StellarGenerator
            .generateActivityProfile(
              generationKey,
              locator,
              physical,
              lifetimeFor(
                1.0,
                6.0,
              ),
            );

        expect(
          young.magneticActivityIndex!,
        ).toBeGreaterThan(
          old.magneticActivityIndex!,
        );

        expect(
          young.flareRatePerDay!,
        ).toBeGreaterThan(
          old.flareRatePerDay!,
        );
      },
    );

    it(
      'should keep cool low-mass main-sequence stars more flare-active than solar-type stars at the same young age',
      () => {
        const locator =
          new SystemLocator(
            4n,
            31n,
            2n,
          );

        const coolDwarf =
          StellarGenerator
            .generateActivityProfile(
              generationKey,
              locator,
              new StellarPhysicalProperties(
                0.30,
                0.30,
                0.31,
                0.012,
                3_420,
              ),
              lifetimeFor(
                0.30,
                0.5,
              ),
            );

        const solarType =
          StellarGenerator
            .generateActivityProfile(
              generationKey,
              locator,
              new StellarPhysicalProperties(
                1.0,
                1.0,
                1.0,
                1.0,
                5_772,
              ),
              lifetimeFor(
                1.0,
                0.5,
              ),
            );

        expect(
          coolDwarf.magneticActivityIndex!,
        ).toBeGreaterThan(
          solarType.magneticActivityIndex!,
        );

        expect(
          coolDwarf.flareRatePerDay!,
        ).toBeGreaterThan(
          solarType.flareRatePerDay!,
        );
      },
    );

    it(
      'should cool brown-dwarf activity with age while keeping ordinary flare statistics finite',
      () => {
        const locator =
          new SystemLocator(
            5n,
            -7n,
            1n,
          );

        const physical =
          new StellarPhysicalProperties(
            0.05,
            0.05,
            0.10,
            0.0001,
            1_800,
          );

        const young =
          StellarGenerator
            .generateActivityProfile(
              generationKey,
              locator,
              physical,
              lifetimeFor(
                0.05,
                0.05,
              ),
            );

        const old =
          StellarGenerator
            .generateActivityProfile(
              generationKey,
              locator,
              physical,
              lifetimeFor(
                0.05,
                10.0,
              ),
            );

        expect(
          young.magneticActivityIndex!,
        ).toBeGreaterThan(
          old.magneticActivityIndex!,
        );

        expect(
          young.flareRatePerDay!,
        ).toBeGreaterThan(
          old.flareRatePerDay!,
        );

        expect(
          old.maximumFlareEnergyJoules!,
        ).toBeGreaterThanOrEqual(
          old.typicalFlareEnergyJoules!,
        );
      },
    );

    it(
      'should keep compact remnants outside the ordinary photospheric flare model',
      () => {
        const locator =
          new SystemLocator(
            7n,
            17n,
            9n,
          );

        const whiteDwarfLifetime =
          lifetimeFor(
            1.0,
            12.0,
          );

        expect(
          whiteDwarfLifetime
            .evolutionAssessment
            .evolutionState
            .name,
        ).toBe(
          StellarEvolutionState.WHITE_DWARF.name,
        );

        const activity =
          StellarGenerator
            .generateActivityProfile(
              generationKey,
              locator,
              new StellarPhysicalProperties(
                1.0,
                1.0,
                1.0,
                1.0,
                5_772,
              ),
              whiteDwarfLifetime,
            );

        expect(
          activity,
        ).toEqual(
          expect.objectContaining({
            ordinaryFlareModelApplicable:
              false,
            magneticActivityIndex:
              null,
            regime:
              null,
            flareRatePerDay:
              null,
            typicalFlareEnergyJoules:
              null,
            maximumFlareEnergyJoules:
              null,
          }),
        );
      },
    );

    it(
      'should keep hundreds of generated point-15.4 profiles finite, bounded and coherent with their current phase-14 state',
      () => {
        for (
          let index =
            0n;
          index <
            512n;
          index +=
            1n
        ) {
          const locator =
            new SystemLocator(
              2n,
              404n,
              index,
            );

          const physical =
            StellarGenerator
              .generatePhysicalProperties(
                generationKey,
                locator,
                sectorPopulation,
                mixedProfile,
              );

          const lifetime =
            StellarGenerator
              .generateLifetimeProfile(
                generationKey,
                locator,
                physical,
                sectorPopulation,
                mixedProfile,
              );

          const activity =
            StellarGenerator
              .generateActivityProfile(
                generationKey,
                locator,
                physical,
                lifetime,
              );

          const compactRemnant =
            [
              StellarEvolutionState.WHITE_DWARF.name,
              StellarEvolutionState.NEUTRON_STAR.name,
              StellarEvolutionState.STELLAR_BLACK_HOLE.name,
            ].includes(
              lifetime
                .evolutionAssessment
                .evolutionState
                .name,
            );

          if (
            compactRemnant
          ) {
            expect(
              activity.ordinaryFlareModelApplicable,
            ).toBe(
              false,
            );

            expect(
              activity.magneticActivityIndex,
            ).toBeNull();

            continue;
          }

          expect(
            activity.ordinaryFlareModelApplicable,
          ).toBe(
            true,
          );

          expect(
            activity.magneticActivityIndex!,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            activity.magneticActivityIndex!,
          ).toBeLessThanOrEqual(
            1,
          );

          expect(
            activity.flareRatePerDay!,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            Number.isFinite(
              activity.typicalFlareEnergyJoules!,
            ),
          ).toBe(
            true,
          );

          expect(
            activity.maximumFlareEnergyJoules!,
          ).toBeGreaterThanOrEqual(
            activity.typicalFlareEnergyJoules!,
          );
        }
      },
    );

    it(
      'should keep point-15.4 activity entropy isolated from physical, spectral and age outputs',
      () => {
        const locator =
          new SystemLocator(
            8n,
            -52n,
            11n,
          );

        const physicalBefore =
          StellarGenerator
            .generatePhysicalProperties(
              generationKey,
              locator,
              sectorPopulation,
              mixedProfile,
            );

        const appearanceBefore =
          StellarGenerator
            .generateSpectralAppearance(
              generationKey,
              physicalBefore,
              sectorPopulation,
            );

        const lifetimeBefore =
          StellarGenerator
            .generateLifetimeProfile(
              generationKey,
              locator,
              physicalBefore,
              sectorPopulation,
              mixedProfile,
            );

        StellarGenerator
          .generateActivityProfile(
            generationKey,
            locator,
            physicalBefore,
            lifetimeBefore,
          );

        const physicalAfter =
          StellarGenerator
            .generatePhysicalProperties(
              generationKey,
              locator,
              sectorPopulation,
              mixedProfile,
            );

        const appearanceAfter =
          StellarGenerator
            .generateSpectralAppearance(
              generationKey,
              physicalAfter,
              sectorPopulation,
            );

        const lifetimeAfter =
          StellarGenerator
            .generateLifetimeProfile(
              generationKey,
              locator,
              physicalAfter,
              sectorPopulation,
              mixedProfile,
            );

        expect(
          physicalAfter,
        ).toEqual(
          physicalBefore,
        );

        expect(
          appearanceAfter,
        ).toEqual(
          appearanceBefore,
        );

        expect(
          lifetimeAfter,
        ).toEqual(
          lifetimeBefore,
        );
      },
    );

    it(
      'should reject unsupported generator versions without consuming procedural state',
      () => {
        const unsupported =
          {
            universeSeed:
              generationKey.universeSeed,
            generatorVersion: {
              code:
                999,
            },
          } as unknown as
            UniverseGenerationKey;

        expect(
          () =>
            StellarGenerator
              .generatePhysicalProperties(
                unsupported,
                new SystemLocator(
                  0n,
                  0n,
                  0n,
                ),
                sectorPopulation,
                mixedProfile,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            StellarGenerator
              .generateSpectralAppearance(
                unsupported,
                new StellarPhysicalProperties(
                  1.0,
                  1.0,
                  1.0,
                  1.0,
                  5_772,
                ),
                sectorPopulation,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            StellarGenerator
              .generateLifetimeProfile(
                unsupported,
                new SystemLocator(
                  0n,
                  0n,
                  0n,
                ),
                new StellarPhysicalProperties(
                  1.0,
                  1.0,
                  1.0,
                  1.0,
                  5_772,
                ),
                sectorPopulation,
                mixedProfile,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            StellarGenerator
              .generateActivityProfile(
                unsupported,
                new SystemLocator(
                  0n,
                  0n,
                  0n,
                ),
                new StellarPhysicalProperties(
                  1.0,
                  1.0,
                  1.0,
                  1.0,
                  5_772,
                ),
                lifetimeFor(
                  1.0,
                  1.0,
                ),
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            StellarGenerator
              .generateStar(
                unsupported,
                new SystemLocator(
                  0n,
                  0n,
                  0n,
                ),
                sectorPopulation,
                mixedProfile,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
