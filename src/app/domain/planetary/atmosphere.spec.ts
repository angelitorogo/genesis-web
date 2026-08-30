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
  type Planet,
} from './planet';

import {
  PlanetType,
} from './planet-type';

import {
  type PlanetarySystem,
} from './planetary-system';

describe(
  'Atmosphere through point 20.2',
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
      'should preserve the exact Planet identity and expose the point-20.2 bulk state',
      () => {
        const planet =
          planetFixture();

        const bulk =
          bulkFixture();

        const atmosphere =
          new Atmosphere(
            planet,
            bulk,
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

        for (
          const laterProperty
          of [
            'retentionAssessment',
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
            new Atmosphere(
              planet,
              bulkFixture({
                bodyLocator:
                  wrongLocator,
              }),
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new Atmosphere(
              planet,
              bulkFixture({
                sourceMassEarth:
                  2,
              }),
            ),
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
  },
);
