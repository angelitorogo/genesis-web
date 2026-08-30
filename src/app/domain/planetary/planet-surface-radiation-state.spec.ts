import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetMagneticFieldRegime,
} from './planet-magnetic-field-regime';

import {
  PlanetMagnetosphereRegime,
} from './planet-magnetosphere-regime';

import {
  PlanetRadiationProtectionRegime,
} from './planet-radiation-protection-regime';

import {
  PlanetSurfaceRadiationRegime,
} from './planet-surface-radiation-regime';

import {
  PlanetSurfaceRadiationState,
} from './planet-surface-radiation-state';

import {
  PlanetType,
} from './planet-type';

describe(
  'PlanetSurfaceRadiationState point 20.10',
  () => {
    const locator =
      new BodyLocator(
        2n,
        -7n,
        5n,
        0n,
      );

    const seed =
      new BodySeed(
        '11111111111111111111111111111111',
      );

    it(
      'should materialize a coherent protected solid-surface radiation state',
      () => {
        const state =
          new PlanetSurfaceRadiationState(
            1,
            locator,
            seed,
            PlanetType.ROCKY,
            1,
            1,
            101_325,
            1,
            0.56,
            PlanetMagneticFieldRegime.STRONG,
            PlanetMagnetosphereRegime.GLOBAL,
            0.50,
            0.707,
            0.614,
            1,
            0.80,
            0.56,
            0.912,
            0.44,
            0.70,
            0.062,
            0.28,
            0.16,
            PlanetSurfaceRadiationRegime.LOW,
            PlanetRadiationProtectionRegime.STRONG,
            true,
          );

        expect(
          state.hasModeledSolidSurface,
        ).toBe(true);

        expect(
          state.hasEffectiveSurfaceRadiationProtection,
        ).toBe(true);
      },
    );

    it(
      'should preserve a deep-envelope environmental load without inventing surface exposure',
      () => {
        const state =
          new PlanetSurfaceRadiationState(
            1,
            locator,
            seed,
            PlanetType.GAS_GIANT,
            2.5,
            0.037,
            null,
            0.037,
            0.91,
            PlanetMagneticFieldRegime.VERY_STRONG,
            PlanetMagnetosphereRegime.EXTENDED,
            0.036,
            0.189,
            0.120,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            PlanetSurfaceRadiationRegime.DEEP_ENVELOPE,
            PlanetRadiationProtectionRegime.DEEP_ENVELOPE,
            false,
          );

        expect(
          state.hasModeledSolidSurface,
        ).toBe(false);

        expect(
          state.surfaceRadiationExposureIndex01,
        ).toBeNull();
      },
    );

    it(
      'should reject inconsistent regimes, magnetic handoff and deep-envelope surface values',
      () => {
        expect(
          () =>
            new PlanetSurfaceRadiationState(
              1,
              locator,
              seed,
              PlanetType.ROCKY,
              1,
              1,
              101_325,
              1,
              0.56,
              PlanetMagneticFieldRegime.STRONG,
              PlanetMagnetosphereRegime.GLOBAL,
              0.50,
              0.707,
              0.614,
              1,
              0.80,
              0.40,
              0.90,
              0.44,
              0.70,
              0.07,
              0.28,
              0.16,
              PlanetSurfaceRadiationRegime.LOW,
              PlanetRadiationProtectionRegime.STRONG,
              true,
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new PlanetSurfaceRadiationState(
              1,
              locator,
              seed,
              PlanetType.GAS_GIANT,
              2.5,
              0.037,
              null,
              0.037,
              0.91,
              PlanetMagneticFieldRegime.VERY_STRONG,
              PlanetMagnetosphereRegime.EXTENDED,
              0.036,
              0.189,
              0.120,
              0,
              0,
              0.91,
              0.91,
              0,
              0.5,
              0.01,
              0.01,
              0.01,
              PlanetSurfaceRadiationRegime.LOW,
              PlanetRadiationProtectionRegime.MODERATE,
              true,
            ),
        ).toThrow(RangeError);
      },
    );
  },
);
