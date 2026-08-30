import {
  BodyLocator,
  SystemLocator,
} from '../generation/procedural-locator';

import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  Atmosphere,
} from './atmosphere';

import {
  ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
  AtmosphereBulkProperties,
  idealGasDensityKilogramsPerCubicMeter,
} from './atmosphere-bulk-properties';

import {
  AtmosphereGas,
  atmosphereGasMolarMassGramsPerMole,
} from './atmosphere-gas';

import {
  AtmosphereGasComponent,
} from './atmosphere-gas-component';

import {
  AtmosphereGreenhouseEffect,
} from './atmosphere-greenhouse-effect';

import {
  AtmosphereGreenhouseRegime,
} from './atmosphere-greenhouse-regime';

import {
  AtmospherePressureRegime,
} from './atmosphere-pressure-regime';

import {
  AtmosphereGasRetention,
} from './atmosphere-gas-retention';

import {
  AtmosphereRetentionRegime,
} from './atmosphere-retention-regime';

import {
  AtmosphereRetentionState,
} from './atmosphere-retention-state';

import {
  PlanetClimateState,
  planetaryEquilibriumTemperatureKelvin,
} from './planet-climate-state';

import {
  PlanetClimateStabilityRegime,
} from './planet-climate-stability-regime';

import {
  PlanetClimateVariabilityState,
} from './planet-climate-variability-state';

import {
  PlanetSurfaceWaterRegime,
} from './planet-surface-water-regime';

import {
  PlanetWaterInventory,
} from './planet-water-inventory';

import {
  PlanetWaterPhaseRegime,
} from './planet-water-phase-regime';

import {
  type Planet,
} from './planet';

import {
  PlanetType,
} from './planet-type';

import {
  type PlanetarySystem,
} from './planetary-system';

describe(
  'Atmosphere through point 20.7',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const systemLocator =
      new SystemLocator(
        4n,
        -9n,
        12n,
      );

    const locator =
      new BodyLocator(
        4n,
        -9n,
        12n,
        1n,
      );

    const seed =
      new BodySeed(
        '22222222222222222222222222222222',
      );

    it(
      'should preserve exact identity and expose point-20.2 through point-20.7 atmosphere/climate/water states',
      () => {
        const planet =
          planetFixture();

        const bulk =
          bulkFixture();

        const retention =
          retentionFixture(
            bulk,
          );

        const greenhouse =
          greenhouseFixture(
            retention,
          );

        const climate =
          climateFixture(
            greenhouse,
          );

        const variability =
          climateVariabilityFixture(
            planet,
            retention,
            greenhouse,
            climate,
          );

        const waterInventory =
          waterInventoryFixture(
            planet,
            retention,
            climate,
            variability,
          );

        const atmosphere =
          new Atmosphere(
            planet,
            bulk,
            retention,
            greenhouse,
            climate,
            variability,
            waterInventory,
          );

        expect(
          atmosphere.hostPlanet,
        ).toBe(
          planet,
        );

        expect(
          atmosphere.bulkProperties,
        ).toBe(
          bulk,
        );

        expect(
          atmosphere.locator,
        ).toBe(
          locator,
        );

        expect(
          atmosphere.seed,
        ).toBe(
          seed,
        );

        expect(
          atmosphere.surfacePressurePascal,
        ).toBe(101_325);

        expect(
          atmosphere.referenceDensityKilogramsPerCubicMeter,
        ).toBeGreaterThan(0);

        expect(
          atmosphere.gasComposition,
        ).toHaveLength(1);

        expect(
          atmosphere.retentionState,
        ).toBe(
          retention,
        );

        expect(
          atmosphere.retainedSurfacePressurePascal,
        ).toBe(101_325);

        expect(
          atmosphere.retainedGasComposition,
        ).toHaveLength(1);

        expect(
          atmosphere.greenhouseEffect,
        ).toBe(
          greenhouse,
        );

        expect(
          atmosphere.greenhouseRegime,
        ).toBe(
          AtmosphereGreenhouseRegime.NONE,
        );

        expect(
          atmosphere.greenhouseTemperatureAmplificationFactor,
        ).toBe(1);

        expect(
          atmosphere.climateState,
        ).toBe(
          climate,
        );

        expect(
          atmosphere.meanSurfaceTemperatureKelvin,
        ).toBeCloseTo(
          atmosphere.equilibriumTemperatureKelvin,
          12,
        );

        expect(
          atmosphere.greenhouseSurfaceWarmingKelvin,
        ).toBe(0);

        expect(
          atmosphere.climateVariabilityState,
        ).toBe(
          variability,
        );

        expect(
          atmosphere.minimumSurfaceTemperatureKelvin,
        ).not.toBeNull();

        expect(
          atmosphere.maximumSurfaceTemperatureKelvin,
        ).not.toBeNull();

        expect(
          atmosphere.waterInventory,
        ).toBe(
          waterInventory,
        );

        expect(
          atmosphere.waterInventoryIndex01,
        ).toBe(0.3);

        expect(
          atmosphere.waterPhaseRegime,
        ).toBe(
          PlanetWaterPhaseRegime.ICE_AND_LIQUID,
        );

        expect(
          atmosphere.surfaceWaterRegime,
        ).toBe(
          PlanetSurfaceWaterRegime.SEAS,
        );

        for (
          const laterProperty
          of [
            'geology',
            'magnetosphere',
            'surfaceRadiation',
          ]
        ) {
          expect(
            laterProperty in
              atmosphere,
          ).toBe(false);
        }
      },
    );

    it(
      'should reject bulk properties from another body or with altered phase-19 source values',
      () => {
        const planet =
          planetFixture();

        const wrongLocator =
          new BodyLocator(
            4n,
            -9n,
            12n,
            0n,
          );

        expect(
          () =>
            (() => {
              const bulk =
                bulkFixture({
                  bodyLocator:
                    wrongLocator,
                });

              const retention =
                retentionFixture(
                  bulk,
                );

              const greenhouse =
                greenhouseFixture(
                  retention,
                );

              const climate =
                climateFixture(
                  greenhouse,
                );

              const variability =
                climateVariabilityFixture(
                  planet,
                  retention,
                  greenhouse,
                  climate,
                );

              return new Atmosphere(
                planet,
                bulk,
                retention,
                greenhouse,
                climate,
                variability,
                waterInventoryFixture(
                  planet,
                  retention,
                  climate,
                  variability,
                ),
              );
            })(),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            (() => {
              const bulk =
                bulkFixture({
                  sourceMassEarth:
                    2,
                });

              const retention =
                retentionFixture(
                  bulk,
                );

              const greenhouse =
                greenhouseFixture(
                  retention,
                );

              const climate =
                climateFixture(
                  greenhouse,
                );

              const variability =
                climateVariabilityFixture(
                  planet,
                  retention,
                  greenhouse,
                  climate,
                );

              return new Atmosphere(
                planet,
                bulk,
                retention,
                greenhouse,
                climate,
                variability,
                waterInventoryFixture(
                  planet,
                  retention,
                  climate,
                  variability,
                ),
              );
            })(),
        ).toThrow(
          RangeError,
        );
      },
    );

    function planetFixture(
      overrides:
        Partial<Planet> = {},
    ): Planet {

      const system = {
        generationKey,
        locator:
          systemLocator,
        planetCount:
          2,
      } as PlanetarySystem;

      return {
        generationKey,
        hostPlanetarySystem:
          system,
        systemLocator,
        planetOrdinal:
          2,
        locator,
        seed,
        designation: {
          name:
            'Testara c',
        },
        name:
          'Testara c',
        planetType:
          PlanetType.ROCKY,
        massEarth:
          1.2,
        radiusEarth:
          1.05,
        surfaceGravityEarth:
          1.08,
        physicalProperties: {
          envelopeMassFraction01:
            0.015,
        },
        internalComposition: {
          iceBearingFractionOfSolids01:
            0.2,
        },
        typeClassification: {
          referenceMeanInsolationEarth:
            0.92,
        },
        referenceBondAlbedo01:
          0.21,
        orbit: {
          eccentricity:
            0.03,
        },
        axialTiltDegrees:
          24,
        rotationPeriodHours:
          24,
        dayLengthHours:
          24.1,
        isTypePhysicallyCoherent:
          true,
        ...overrides,
      } as unknown as Planet;
    }

    function bulkFixture(
      overrides:
        Partial<AtmosphereBulkProperties> = {},
    ): AtmosphereBulkProperties {

      const gasComponents = [
        new AtmosphereGasComponent(
          AtmosphereGas.NITROGEN,
          1,
        ),
      ];

      const meanMolarMass =
        atmosphereGasMolarMassGramsPerMole(
          AtmosphereGas.NITROGEN,
        );

      const pressure =
        101_325;

      const values = {
        planetOrdinal:
          2,
        bodyLocator:
          locator,
        bodySeed:
          seed,
        sourcePlanetType:
          PlanetType.ROCKY,
        sourceMassEarth:
          1.2,
        sourceRadiusEarth:
          1.05,
        sourceSurfaceGravityEarth:
          1.08,
        sourceEnvelopeMassFraction01:
          0.015,
        sourceIceBearingInteriorFraction01:
          0.2,
        sourceReferenceMeanInsolationEarth:
          0.92,
        sourceReferenceBondAlbedo01:
          0.21,
        pressureRegime:
          AtmospherePressureRegime.MODERATE,
        surfacePressurePascal:
          pressure,
        densityReferencePressurePascal:
          pressure,
        densityReferenceTemperatureKelvin:
          ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
        referenceDensityKilogramsPerCubicMeter:
          idealGasDensityKilogramsPerCubicMeter(
            pressure,
            ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
            meanMolarMass,
          ),
        meanMolarMassGramsPerMole:
          meanMolarMass,
        gasComponents,
        ...overrides,
      };

      return new AtmosphereBulkProperties(
        values.planetOrdinal,
        values.bodyLocator,
        values.bodySeed,
        values.sourcePlanetType,
        values.sourceMassEarth,
        values.sourceRadiusEarth,
        values.sourceSurfaceGravityEarth,
        values.sourceEnvelopeMassFraction01,
        values.sourceIceBearingInteriorFraction01,
        values.sourceReferenceMeanInsolationEarth,
        values.sourceReferenceBondAlbedo01,
        values.pressureRegime,
        values.surfacePressurePascal,
        values.densityReferencePressurePascal,
        values.densityReferenceTemperatureKelvin,
        values.referenceDensityKilogramsPerCubicMeter,
        values.meanMolarMassGramsPerMole,
        values.gasComponents,
      );
    }

    function retentionFixture(
      bulk:
        AtmosphereBulkProperties,
    ): AtmosphereRetentionState {

      const gasRetentions =
        bulk.gasComponents.map(
          component =>
            new AtmosphereGasRetention(
              component.gas,
              component.moleFraction01,
              1,
              0,
              component.moleFraction01,
            ),
        );

      return new AtmosphereRetentionState(
        bulk.planetOrdinal,
        bulk.bodyLocator,
        bulk.bodySeed,
        bulk.pressureRegime,
        bulk.surfacePressurePascal,
        bulk.sourceReferenceMeanInsolationEarth,
        bulk.sourceReferenceBondAlbedo01,
        12,
        1,
        1,
        0,
        AtmosphereRetentionRegime.WELL_RETAINED,
        bulk.pressureRegime,
        bulk.surfacePressurePascal,
        bulk.densityReferencePressurePascal,
        bulk.densityReferenceTemperatureKelvin,
        bulk.referenceDensityKilogramsPerCubicMeter,
        bulk.meanMolarMassGramsPerMole,
        gasRetentions,
        bulk.gasComponents,
      );
    }

    function greenhouseFixture(
      retention:
        AtmosphereRetentionState,
    ): AtmosphereGreenhouseEffect {

      return new AtmosphereGreenhouseEffect(
        retention.planetOrdinal,
        retention.bodyLocator,
        retention.bodySeed,
        retention.retentionRegime,
        retention.retainedPressureRegime,
        retention.retainedSurfacePressurePascal,
        retention.retainedMoleInventoryFraction01,
        retention.sourceReferenceMeanInsolationEarth,
        retention.sourceReferenceBondAlbedo01,
        0,
        0,
        1,
        0,
        0,
        0,
        1,
        AtmosphereGreenhouseRegime.NONE,
        [],
      );
    }

    function climateFixture(
      greenhouse:
        AtmosphereGreenhouseEffect,
    ): PlanetClimateState {

      const equilibriumTemperatureKelvin =
        planetaryEquilibriumTemperatureKelvin(
          greenhouse.sourceReferenceMeanInsolationEarth,
          greenhouse.sourceReferenceBondAlbedo01,
        );

      return new PlanetClimateState(
        greenhouse.planetOrdinal,
        greenhouse.bodyLocator,
        greenhouse.bodySeed,
        greenhouse.sourceReferenceMeanInsolationEarth,
        greenhouse.sourceReferenceBondAlbedo01,
        greenhouse.regime,
        greenhouse.infraredOpticalDepthProxy,
        greenhouse.temperatureAmplificationFactor,
        greenhouse.sourceReferenceMeanInsolationEarth *
          (
            1 -
            greenhouse.sourceReferenceBondAlbedo01
          ),
        equilibriumTemperatureKelvin,
        equilibriumTemperatureKelvin,
        0,
      );
    }

    function climateVariabilityFixture(
      planet:
        Planet,

      retention:
        AtmosphereRetentionState,

      greenhouse:
        AtmosphereGreenhouseEffect,

      climate:
        PlanetClimateState,
    ): PlanetClimateVariabilityState {

      return new PlanetClimateVariabilityState(
        planet.planetOrdinal,
        planet.locator,
        planet.seed,
        climate.equilibriumTemperatureKelvin,
        climate.meanSurfaceTemperatureKelvin,
        planet.orbit.eccentricity,
        planet.axialTiltDegrees,
        planet.rotationPeriodHours,
        planet.dayLengthHours,
        retention.retainedSurfacePressurePascal,
        greenhouse.longwaveTrappingFraction01,
        0.4,
        0.08,
        0.6,
        10,
        20,
        climate.meanSurfaceTemperatureKelvin! -
          20,
        climate.meanSurfaceTemperatureKelvin! +
          20,
        0.84,
        PlanetClimateStabilityRegime.STABLE,
      );
    }

    function waterInventoryFixture(
      planet:
        Planet,

      retention:
        AtmosphereRetentionState,

      climate:
        PlanetClimateState,

      variability:
        PlanetClimateVariabilityState,
    ): PlanetWaterInventory {

      return new PlanetWaterInventory(
        planet.planetOrdinal,
        planet.locator,
        planet.seed,
        planet.planetType,
        planet.internalComposition
          .iceBearingFractionOfSolids01,
        retention.retainedSurfacePressurePascal,
        0,
        climate.meanSurfaceTemperatureKelvin,
        variability.minimumSurfaceTemperatureKelvin,
        variability.maximumSurfaceTemperatureKelvin,
        variability.stabilityIndex01,
        0.3,
        0.5,
        0.5,
        0,
        0.2,
        0.1,
        PlanetWaterPhaseRegime.ICE_AND_LIQUID,
        PlanetSurfaceWaterRegime.SEAS,
        true,
      );
    }

  },
);
