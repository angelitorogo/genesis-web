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
  type Planet,
} from './planet';

import {
  PlanetType,
} from './planet-type';

import {
  type PlanetarySystem,
} from './planetary-system';

describe(
  'Atmosphere through point 20.3',
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
      'should preserve the exact Planet identity and expose point-20.2 source plus point-20.3 retained states',
      () => {
        const planet =
          planetFixture();

        const bulk =
          bulkFixture();

        const retention =
          retentionFixture(
            bulk,
          );

        const atmosphere =
          new Atmosphere(
            planet,
            bulk,
            retention,
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

        for (
          const laterProperty
          of [
            'greenhouseEffect',
            'climate',
            'waterInventory',
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

              return new Atmosphere(
                planet,
                bulk,
                retentionFixture(
                  bulk,
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

              return new Atmosphere(
                planet,
                bulk,
                retentionFixture(
                  bulk,
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

  },
);
