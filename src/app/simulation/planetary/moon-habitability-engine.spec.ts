import {
  MoonAtmosphereRegime,
} from '../../domain/planetary/moon-atmosphere-regime';

import {
  MoonEnvironmentState,
} from '../../domain/planetary/moon-environment-state';

import {
  MoonGeologyRegime,
} from '../../domain/planetary/moon-geology-regime';

import {
  MoonHabitabilityRegime,
} from '../../domain/planetary/moon-habitability-regime';

import {
  MoonWaterRegime,
} from '../../domain/planetary/moon-water-regime';

import {
  MoonHabitabilityEngine,
} from './moon-habitability-engine';

describe(
  'MoonHabitabilityEngine point 21.6',
  () => {
    it(
      'should keep an Earth-Moon-scale dry nearly-airless body outside both candidate routes',
      () => {
        const state =
          MoonHabitabilityEngine
            .generate(
              environmentFixture({
                gravityEarth:
                  0.16355,
                temperatureKelvin:
                  275.30,
                atmosphereRetentionIndex01:
                  0.13448,
                atmosphereRegime:
                  MoonAtmosphereRegime.EXOSPHERE,
                waterInventoryIndex01:
                  0.06108,
                subsurfaceOceanPotentialIndex01:
                  0.05973,
                surfaceLiquidWaterPotentialIndex01:
                  0,
                waterRegime:
                  MoonWaterRegime.NONE,
                internalHeatRetentionIndex01:
                  0.31455,
                geologicalActivityIndex01:
                  0.27865,
                geologyRegime:
                  MoonGeologyRegime.LOW_ACTIVITY,
                tidalHeatingIndex01:
                  0.25933,
              }),
            );

        expect(
          state.habitabilityRegime,
        ).toBe(
          MoonHabitabilityRegime.NONE,
        );
        expect(
          state.isPotentiallyHabitable,
        ).toBe(false);
      },
    );

    it(
      'should classify a cold Titan-scale ocean-bearing moon as a subsurface candidate only',
      () => {
        const state =
          MoonHabitabilityEngine
            .generate(
              environmentFixture({
                gravityEarth:
                  0.138,
                temperatureKelvin:
                  79.58,
                atmosphereRetentionIndex01:
                  0.44656,
                atmosphereRegime:
                  MoonAtmosphereRegime.SUBSTANTIAL,
                waterInventoryIndex01:
                  0.841,
                subsurfaceOceanPotentialIndex01:
                  0.601315,
                surfaceLiquidWaterPotentialIndex01:
                  0,
                waterRegime:
                  MoonWaterRegime.ICE_AND_SUBSURFACE_OCEAN,
                internalHeatRetentionIndex01:
                  0.54283,
                geologicalActivityIndex01:
                  0.25499,
                geologyRegime:
                  MoonGeologyRegime.LOW_ACTIVITY,
                tidalHeatingIndex01:
                  0.10,
              }),
            );

        expect(
          state.habitabilityRegime,
        ).toBe(
          MoonHabitabilityRegime.SUBSURFACE_CANDIDATE,
        );
        expect(
          state.supportsPotentialSubsurfaceHabitability,
        ).toBe(true);
        expect(
          state.supportsPotentialSurfaceHabitability,
        ).toBe(false);
        expect(
          state.subsurfaceHabitabilityIndex01,
        ).toBeGreaterThan(0.30);
      },
    );

    it(
      'should distinguish surface-only and dual-route candidates',
      () => {
        const surfaceOnly =
          MoonHabitabilityEngine
            .generate(
              environmentFixture({
                gravityEarth:
                  0.30,
                temperatureKelvin:
                  290,
                atmosphereRetentionIndex01:
                  0.60,
                atmosphereRegime:
                  MoonAtmosphereRegime.SUBSTANTIAL,
                waterInventoryIndex01:
                  0.65,
                subsurfaceOceanPotentialIndex01:
                  0.25,
                surfaceLiquidWaterPotentialIndex01:
                  0.70,
                waterRegime:
                  MoonWaterRegime.SURFACE_LIQUID,
                internalHeatRetentionIndex01:
                  0.45,
                geologicalActivityIndex01:
                  0.40,
                geologyRegime:
                  MoonGeologyRegime.ACTIVE,
                tidalHeatingIndex01:
                  0.20,
              }),
            );

        const dual =
          MoonHabitabilityEngine
            .generate(
              environmentFixture({
                gravityEarth:
                  0.45,
                temperatureKelvin:
                  288,
                atmosphereRetentionIndex01:
                  0.70,
                atmosphereRegime:
                  MoonAtmosphereRegime.SUBSTANTIAL,
                waterInventoryIndex01:
                  0.80,
                subsurfaceOceanPotentialIndex01:
                  0.70,
                surfaceLiquidWaterPotentialIndex01:
                  0.65,
                waterRegime:
                  MoonWaterRegime.MIXED,
                internalHeatRetentionIndex01:
                  0.60,
                geologicalActivityIndex01:
                  0.55,
                geologyRegime:
                  MoonGeologyRegime.ACTIVE,
                tidalHeatingIndex01:
                  0.25,
              }),
            );

        expect(
          surfaceOnly.habitabilityRegime,
        ).toBe(
          MoonHabitabilityRegime.SURFACE_CANDIDATE,
        );
        expect(
          dual.habitabilityRegime,
        ).toBe(
          MoonHabitabilityRegime.SURFACE_AND_SUBSURFACE_CANDIDATE,
        );
        expect(
          dual.overallHabitabilityIndex01,
        ).toBeGreaterThan(
          0,
        );
      },
    );

    it(
      'should reject extreme tidal stress even when a synthetic environment exposes abundant water',
      () => {
        const state =
          MoonHabitabilityEngine
            .generate(
              environmentFixture({
                gravityEarth:
                  0.40,
                temperatureKelvin:
                  295,
                atmosphereRetentionIndex01:
                  0.70,
                atmosphereRegime:
                  MoonAtmosphereRegime.SUBSTANTIAL,
                waterInventoryIndex01:
                  0.90,
                subsurfaceOceanPotentialIndex01:
                  0.85,
                surfaceLiquidWaterPotentialIndex01:
                  0.80,
                waterRegime:
                  MoonWaterRegime.MIXED,
                internalHeatRetentionIndex01:
                  0.55,
                geologicalActivityIndex01:
                  0.90,
                geologyRegime:
                  MoonGeologyRegime.EXTREME,
                tidalHeatingIndex01:
                  1,
              }),
            );

        expect(
          state.tidalModerationIndex01,
        ).toBe(0);
        expect(
          state.habitabilityRegime,
        ).toBe(
          MoonHabitabilityRegime.NONE,
        );
      },
    );
  },
);

interface EnvironmentFixtureOptions {
  readonly gravityEarth:
    number;
  readonly temperatureKelvin:
    number;
  readonly atmosphereRetentionIndex01:
    number;
  readonly atmosphereRegime:
    MoonAtmosphereRegime;
  readonly waterInventoryIndex01:
    number;
  readonly subsurfaceOceanPotentialIndex01:
    number;
  readonly surfaceLiquidWaterPotentialIndex01:
    number;
  readonly waterRegime:
    MoonWaterRegime;
  readonly internalHeatRetentionIndex01:
    number;
  readonly geologicalActivityIndex01:
    number;
  readonly geologyRegime:
    MoonGeologyRegime;
  readonly tidalHeatingIndex01:
    number;
}

function environmentFixture(
  options:
    EnvironmentFixtureOptions,
): MoonEnvironmentState {
  const equilibriumTemperatureKelvin =
    Math.min(
      options.temperatureKelvin,
      Math.max(
        1,
        options.temperatureKelvin -
          5,
      ),
    );

  return new MoonEnvironmentState(
    1,
    1,
    0.03,
    0.40,
    2.5,
    options.gravityEarth,
    1,
    options.tidalHeatingIndex01,
    0.50,
    0.30,
    equilibriumTemperatureKelvin,
    options.temperatureKelvin,
    options.atmosphereRetentionIndex01,
    options.atmosphereRegime,
    options.waterInventoryIndex01,
    options.subsurfaceOceanPotentialIndex01,
    options.surfaceLiquidWaterPotentialIndex01,
    options.waterRegime,
    options.internalHeatRetentionIndex01,
    options.geologicalActivityIndex01,
    options.geologyRegime,
  );
}
