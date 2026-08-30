import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  AtmosphereGreenhouseRegime,
} from './atmosphere-greenhouse-regime';

import {
  PlanetClimateState,
  planetaryEquilibriumTemperatureKelvin,
} from './planet-climate-state';

describe(
  'PlanetClimateState point 20.5',
  () => {
    const locator =
      new BodyLocator(
        2n,
        -5n,
        15n,
        0n,
      );

    const seed =
      new BodySeed(
        '11111111111111111111111111111111',
      );

    it(
      'should preserve the V1 equilibrium relation and a coherent greenhouse-amplified mean surface temperature',
      () => {
        const insolation =
          1;

        const albedo =
          0.30;

        const equilibrium =
          planetaryEquilibriumTemperatureKelvin(
            insolation,
            albedo,
          );

        const amplification =
          1.126;

        const surface =
          equilibrium *
          amplification;

        const climate =
          new PlanetClimateState(
            1,
            locator,
            seed,
            insolation,
            albedo,
            AtmosphereGreenhouseRegime.MODERATE,
            0.81,
            amplification,
            insolation *
              (
                1 -
                albedo
              ),
            equilibrium,
            surface,
            surface -
              equilibrium,
          );

        expect(
          equilibrium,
        ).toBeCloseTo(
          254.6,
          1,
        );

        expect(
          climate.meanSurfaceTemperatureKelvin,
        ).toBeCloseTo(
          287,
          0,
        );

        expect(
          climate.greenhouseSurfaceWarmingKelvin,
        ).toBeGreaterThan(30);

        expect(
          climate.hasDefinedSolidSurfaceTemperature,
        ).toBe(true);
      },
    );

    it(
      'should preserve a top-of-atmosphere equilibrium temperature but no solid-surface temperature for deep envelopes',
      () => {
        const equilibrium =
          planetaryEquilibriumTemperatureKelvin(
            0.5,
            0.4,
          );

        const climate =
          new PlanetClimateState(
            1,
            locator,
            seed,
            0.5,
            0.4,
            AtmosphereGreenhouseRegime.DEEP_ENVELOPE,
            6,
            null,
            0.3,
            equilibrium,
            null,
            null,
          );

        expect(
          climate.equilibriumTemperatureKelvin,
        ).toBeGreaterThan(0);

        expect(
          climate.meanSurfaceTemperatureKelvin,
        ).toBeNull();

        expect(
          climate.isDeepEnvelopeThermalState,
        ).toBe(true);
      },
    );

    it(
      'should reject inconsistent equilibrium, surface and deep-envelope semantics',
      () => {
        const equilibrium =
          planetaryEquilibriumTemperatureKelvin(
            1,
            0.3,
          );

        expect(
          () =>
            new PlanetClimateState(
              1,
              locator,
              seed,
              1,
              0.3,
              AtmosphereGreenhouseRegime.NONE,
              0,
              1,
              0.7,
              equilibrium +
                10,
              equilibrium,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetClimateState(
              1,
              locator,
              seed,
              1,
              0.3,
              AtmosphereGreenhouseRegime.MODERATE,
              1,
              1.2,
              0.7,
              equilibrium,
              equilibrium,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetClimateState(
              1,
              locator,
              seed,
              1,
              0.3,
              AtmosphereGreenhouseRegime.DEEP_ENVELOPE,
              4,
              1,
              0.7,
              equilibrium,
              equilibrium,
              0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
