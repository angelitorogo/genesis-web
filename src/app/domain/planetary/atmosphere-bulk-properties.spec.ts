import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  ATMOSPHERE_V1_DEEP_ENVELOPE_REFERENCE_PRESSURE_PASCAL,
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
  PlanetType,
} from './planet-type';

describe(
  'AtmosphereBulkProperties point 20.2',
  () => {
    const locator =
      new BodyLocator(
        1n,
        2n,
        3n,
        0n,
      );

    const seed =
      new BodySeed(
        '11111111111111111111111111111111',
      );

    it(
      'should conserve a normalized solid-world gas inventory and its ideal-gas reference density',
      () => {
        const gasComponents = [
          new AtmosphereGasComponent(
            AtmosphereGas.NITROGEN,
            0.8,
          ),
          new AtmosphereGasComponent(
            AtmosphereGas.OXYGEN,
            0.2,
          ),
        ];

        const meanMolarMass =
          0.8 *
            atmosphereGasMolarMassGramsPerMole(
              AtmosphereGas.NITROGEN,
            ) +
          0.2 *
            atmosphereGasMolarMassGramsPerMole(
              AtmosphereGas.OXYGEN,
            );

        const pressure =
          101_325;

        const density =
          idealGasDensityKilogramsPerCubicMeter(
            pressure,
            ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
            meanMolarMass,
          );

        const bulk =
          new AtmosphereBulkProperties(
            1,
            locator,
            seed,
            PlanetType.ROCKY,
            1,
            1,
            1,
            0,
            0.1,
            1,
            0.3,
            AtmospherePressureRegime.MODERATE,
            pressure,
            pressure,
            ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
            density,
            meanMolarMass,
            gasComponents,
          );

        expect(
          Object.isFrozen(
            bulk.gasComponents,
          ),
        ).toBe(true);

        expect(
          bulk.hasGasInventory,
        ).toBe(true);

        expect(
          bulk.isVacuum,
        ).toBe(false);

        expect(
          bulk.referenceDensityKilogramsPerCubicMeter,
        ).toBeCloseTo(
          density,
          12,
        );
      },
    );

    it(
      'should represent a vacuum with zero pressure/density and no gas species',
      () => {
        const bulk =
          new AtmosphereBulkProperties(
            1,
            locator,
            seed,
            PlanetType.ROCKY,
            0.5,
            0.8,
            0.78,
            0,
            0,
            2,
            0.12,
            AtmospherePressureRegime.VACUUM,
            0,
            0,
            ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
            0,
            null,
            [],
          );

        expect(
          bulk.isVacuum,
        ).toBe(true);

        expect(
          bulk.gasComponents,
        ).toEqual([]);
      },
    );

    it(
      'should represent a deep envelope without inventing a solid surface pressure',
      () => {
        const gasComponents = [
          new AtmosphereGasComponent(
            AtmosphereGas.HYDROGEN,
            0.8,
          ),
          new AtmosphereGasComponent(
            AtmosphereGas.HELIUM,
            0.2,
          ),
        ];

        const meanMolarMass =
          0.8 *
            atmosphereGasMolarMassGramsPerMole(
              AtmosphereGas.HYDROGEN,
            ) +
          0.2 *
            atmosphereGasMolarMassGramsPerMole(
              AtmosphereGas.HELIUM,
            );

        const density =
          idealGasDensityKilogramsPerCubicMeter(
            ATMOSPHERE_V1_DEEP_ENVELOPE_REFERENCE_PRESSURE_PASCAL,
            ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
            meanMolarMass,
          );

        const bulk =
          new AtmosphereBulkProperties(
            1,
            locator,
            seed,
            PlanetType.GAS_GIANT,
            120,
            10,
            1.2,
            0.7,
            0.2,
            0.1,
            0.45,
            AtmospherePressureRegime.DEEP_ENVELOPE,
            null,
            ATMOSPHERE_V1_DEEP_ENVELOPE_REFERENCE_PRESSURE_PASCAL,
            ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
            density,
            meanMolarMass,
            gasComponents,
          );

        expect(
          bulk.isDeepEnvelope,
        ).toBe(true);

        expect(
          bulk.surfacePressurePascal,
        ).toBeNull();
      },
    );

    it(
      'should reject duplicate species, inconsistent pressure regimes or an inconsistent density',
      () => {
        const duplicate = [
          new AtmosphereGasComponent(
            AtmosphereGas.NITROGEN,
            0.5,
          ),
          new AtmosphereGasComponent(
            AtmosphereGas.NITROGEN,
            0.5,
          ),
        ];

        expect(
          () =>
            new AtmosphereBulkProperties(
              1,
              locator,
              seed,
              PlanetType.ROCKY,
              1,
              1,
              1,
              0,
              0.1,
              1,
              0.3,
              AtmospherePressureRegime.MODERATE,
              101_325,
              101_325,
              ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
              1,
              28,
              duplicate,
            ),
        ).toThrow(
          RangeError,
        );

        const nitrogen = [
          new AtmosphereGasComponent(
            AtmosphereGas.NITROGEN,
            1,
          ),
        ];

        const molarMass =
          atmosphereGasMolarMassGramsPerMole(
            AtmosphereGas.NITROGEN,
          );

        expect(
          () =>
            new AtmosphereBulkProperties(
              1,
              locator,
              seed,
              PlanetType.ROCKY,
              1,
              1,
              1,
              0,
              0.1,
              1,
              0.3,
              AtmospherePressureRegime.THIN,
              101_325,
              101_325,
              ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
              idealGasDensityKilogramsPerCubicMeter(
                101_325,
                ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
                molarMass,
              ),
              molarMass,
              nitrogen,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
