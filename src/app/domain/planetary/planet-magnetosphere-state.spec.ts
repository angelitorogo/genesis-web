import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetGeologyRegime,
} from './planet-geology-regime';

import {
  PlanetMagneticFieldRegime,
} from './planet-magnetic-field-regime';

import {
  PlanetMagnetosphereRegime,
} from './planet-magnetosphere-regime';

import {
  PlanetMagnetosphereState,
} from './planet-magnetosphere-state';

import {
  PlanetType,
} from './planet-type';

describe(
  'PlanetMagnetosphereState point 20.9',
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
      'should materialize a coherent sustained intrinsic global magnetosphere',
      () => {
        const state =
          new PlanetMagnetosphereState(
            1,
            locator,
            seed,
            PlanetType.ROCKY,
            1,
            1,
            24,
            false,
            0.32,
            0.001,
            0.02,
            1,
            101_325,
            PlanetGeologyRegime.ACTIVE,
            0.68,
            0.55,
            0,
            0.82,
            0.55,
            0.78,
            0.54,
            0.52,
            1,
            0.95,
            0.55,
            PlanetMagneticFieldRegime.STRONG,
            PlanetMagnetosphereRegime.GLOBAL,
            true,
          );

        expect(
          state.hasSustainedDynamo,
        ).toBe(true);
        expect(
          state.hasIntrinsicMagnetosphere,
        ).toBe(true);
        expect(
          state.hasInducedMagnetosphere,
        ).toBe(false);
        expect(
          state.hasAnyMagnetosphere,
        ).toBe(true);
      },
    );

    it(
      'should represent an induced magnetosphere when no sustained intrinsic dynamo exists',
      () => {
        const state =
          new PlanetMagnetosphereState(
            1,
            locator,
            seed,
            PlanetType.DESERT,
            0.82,
            0.95,
            5_832,
            false,
            0.32,
            0.001,
            0.01,
            1.9,
            9_000_000,
            PlanetGeologyRegime.ACTIVE,
            0.65,
            0.50,
            0,
            0.82,
            0.53,
            0.024,
            0.11,
            0.10,
            1.9,
            0.95,
            0.18,
            PlanetMagneticFieldRegime.WEAK,
            PlanetMagnetosphereRegime.INDUCED,
            false,
          );

        expect(
          state.hasSustainedDynamo,
        ).toBe(false);
        expect(
          state.hasInducedMagnetosphere,
        ).toBe(true);
      },
    );

    it(
      'should preserve deep-envelope geology nulls while still allowing a giant-planet dynamo',
      () => {
        const state =
          new PlanetMagnetosphereState(
            1,
            locator,
            seed,
            PlanetType.GAS_GIANT,
            318,
            11.2,
            9.9,
            false,
            0.02,
            0.90,
            0.05,
            0.037,
            null,
            PlanetGeologyRegime.DEEP_ENVELOPE,
            null,
            null,
            null,
            1,
            0.95,
            0.89,
            0.88,
            0.88,
            0.037,
            1,
            0.91,
            PlanetMagneticFieldRegime.VERY_STRONG,
            PlanetMagnetosphereRegime.EXTENDED,
            true,
          );

        expect(
          state.hasIntrinsicMagnetosphere,
        ).toBe(true);
        expect(
          state.sourceInternalHeatRetentionIndex01,
        ).toBeNull();
      },
    );

    it(
      'should reject inconsistent regime, dynamo and deep-envelope states',
      () => {
        expect(
          () =>
            new PlanetMagnetosphereState(
              1,
              locator,
              seed,
              PlanetType.ROCKY,
              1,
              1,
              24,
              false,
              0.32,
              0,
              0,
              1,
              101_325,
              PlanetGeologyRegime.DEEP_ENVELOPE,
              null,
              null,
              null,
              0.8,
              0.5,
              0.8,
              0.5,
              0.5,
              1,
              0.8,
              0.5,
              PlanetMagneticFieldRegime.STRONG,
              PlanetMagnetosphereRegime.GLOBAL,
              true,
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new PlanetMagnetosphereState(
              1,
              locator,
              seed,
              PlanetType.ROCKY,
              1,
              1,
              24,
              false,
              0.32,
              0,
              0,
              1,
              101_325,
              PlanetGeologyRegime.ACTIVE,
              0.6,
              0.5,
              0,
              0.8,
              0.5,
              0.8,
              0.5,
              0.5,
              1,
              0.8,
              0.5,
              PlanetMagneticFieldRegime.WEAK,
              PlanetMagnetosphereRegime.GLOBAL,
              true,
            ),
        ).toThrow(RangeError);
      },
    );
  },
);
