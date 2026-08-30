import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetClimateStabilityRegime,
} from './planet-climate-stability-regime';

import {
  PlanetClimateVariabilityState,
} from './planet-climate-variability-state';

describe(
  'PlanetClimateVariabilityState point 20.6',
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
      'should preserve a coherent solid-surface variability envelope',
      () => {
        const state =
          new PlanetClimateVariabilityState(
            1,
            locator,
            seed,
            255,
            288,
            0.0167,
            23.4,
            24,
            24.07,
            101_325,
            0.55,
            0.4,
            0.05,
            0.6,
            12,
            24,
            264,
            312,
            0.84,
            PlanetClimateStabilityRegime.STABLE,
          );

        expect(
          state.hasDefinedSolidSurfaceExtremes,
        ).toBe(true);

        expect(
          state.approximateSurfaceTemperatureRangeKelvin,
        ).toBe(48);
      },
    );

    it(
      'should require null solid-surface extrema for deep envelopes',
      () => {
        const state =
          new PlanetClimateVariabilityState(
            1,
            locator,
            seed,
            120,
            null,
            0.04,
            5,
            10,
            10.1,
            null,
            0.8,
            0.08,
            0.11,
            0.98,
            null,
            null,
            null,
            null,
            null,
            PlanetClimateStabilityRegime.DEEP_ENVELOPE,
          );

        expect(
          state.hasDefinedSolidSurfaceExtremes,
        ).toBe(false);

        expect(
          state.approximateSurfaceTemperatureRangeKelvin,
        ).toBeNull();
      },
    );

    it(
      'should reject a regime that contradicts the stability index',
      () => {
        expect(
          () =>
            new PlanetClimateVariabilityState(
              1,
              locator,
              seed,
              255,
              288,
              0.02,
              20,
              24,
              24.1,
              100_000,
              0.5,
              0.3,
              0.06,
              0.6,
              10,
              20,
              268,
              308,
              0.9,
              PlanetClimateStabilityRegime.EXTREME,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
