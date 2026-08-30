import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
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
  AtmosphereGasRetention,
} from './atmosphere-gas-retention';

import {
  AtmospherePressureRegime,
} from './atmosphere-pressure-regime';

import {
  AtmosphereRetentionRegime,
} from './atmosphere-retention-regime';

import {
  AtmosphereRetentionState,
} from './atmosphere-retention-state';

describe(
  'AtmosphereRetentionState point 20.3',
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
      'should conserve source inventory while normalizing the surviving gas mixture and retained pressure',
      () => {
        const sourcePressure =
          100_000;

        const retainedInventory =
          0.5;

        const retainedPressure =
          sourcePressure *
          retainedInventory;

        const gasRetentions = [
          new AtmosphereGasRetention(
            AtmosphereGas.HYDROGEN,
            0.5,
            0.2,
            0.8,
            0.2,
          ),
          new AtmosphereGasRetention(
            AtmosphereGas.NITROGEN,
            0.5,
            0.8,
            0.2,
            0.8,
          ),
        ];

        const retainedGasComponents = [
          new AtmosphereGasComponent(
            AtmosphereGas.HYDROGEN,
            0.2,
          ),
          new AtmosphereGasComponent(
            AtmosphereGas.NITROGEN,
            0.8,
          ),
        ];

        const meanMolarMass =
          0.2 *
            atmosphereGasMolarMassGramsPerMole(
              AtmosphereGas.HYDROGEN,
            ) +
          0.8 *
            atmosphereGasMolarMassGramsPerMole(
              AtmosphereGas.NITROGEN,
            );

        const density =
          idealGasDensityKilogramsPerCubicMeter(
            retainedPressure,
            ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
            meanMolarMass,
          );

        const state =
          new AtmosphereRetentionState(
            1,
            locator,
            seed,
            AtmospherePressureRegime.MODERATE,
            sourcePressure,
            1,
            0.3,
            11.186,
            1,
            retainedInventory,
            0.5,
            AtmosphereRetentionRegime.PARTIALLY_RETAINED,
            AtmospherePressureRegime.MODERATE,
            retainedPressure,
            retainedPressure,
            ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
            density,
            meanMolarMass,
            gasRetentions,
            retainedGasComponents,
          );

        expect(
          Object.isFrozen(
            state.gasRetentions,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            state.retainedGasComponents,
          ),
        ).toBe(true);

        expect(
          state.retainedSurfacePressurePascal,
        ).toBe(
          retainedPressure,
        );

        expect(
          state.retainedMeanMolarMassGramsPerMole,
        ).toBeCloseTo(
          meanMolarMass,
          12,
        );
      },
    );

    it(
      'should preserve a source vacuum as an empty retained vacuum',
      () => {
        const state =
          new AtmosphereRetentionState(
            1,
            locator,
            seed,
            AtmospherePressureRegime.VACUUM,
            0,
            5,
            0.1,
            8,
            1.2,
            0,
            0,
            AtmosphereRetentionRegime.VACUUM,
            AtmospherePressureRegime.VACUUM,
            0,
            0,
            ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
            0,
            null,
            [],
            [],
          );

        expect(
          state.isVacuum,
        ).toBe(true);

        expect(
          state.hasRetainedGasInventory,
        ).toBe(false);
      },
    );

    it(
      'should reject a retained pressure that does not match the surviving source inventory',
      () => {
        const gasRetentions = [
          new AtmosphereGasRetention(
            AtmosphereGas.NITROGEN,
            1,
            0.5,
            0.5,
            1,
          ),
        ];

        const retainedGasComponents = [
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
            new AtmosphereRetentionState(
              1,
              locator,
              seed,
              AtmospherePressureRegime.MODERATE,
              100_000,
              1,
              0.3,
              11.186,
              1,
              0.5,
              0.5,
              AtmosphereRetentionRegime.PARTIALLY_RETAINED,
              AtmospherePressureRegime.THIN,
              40_000,
              40_000,
              ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
              idealGasDensityKilogramsPerCubicMeter(
                40_000,
                ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
                molarMass,
              ),
              molarMass,
              gasRetentions,
              retainedGasComponents,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
