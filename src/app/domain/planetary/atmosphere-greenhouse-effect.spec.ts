import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  AtmosphereGas,
} from './atmosphere-gas';

import {
  AtmosphereGreenhouseEffect,
  greenhouseLongwaveTrappingFraction01,
  greenhouseTemperatureAmplificationFactor,
} from './atmosphere-greenhouse-effect';

import {
  AtmosphereGreenhouseGasContribution,
} from './atmosphere-greenhouse-gas-contribution';

import {
  AtmosphereGreenhouseRegime,
} from './atmosphere-greenhouse-regime';

import {
  AtmospherePressureRegime,
} from './atmosphere-pressure-regime';

import {
  AtmosphereRetentionRegime,
} from './atmosphere-retention-regime';

describe(
  'AtmosphereGreenhouseEffect point 20.4',
  () => {
    const locator =
      new BodyLocator(
        2n,
        -3n,
        9n,
        0n,
      );

    const seed =
      new BodySeed(
        '11111111111111111111111111111111',
      );

    it(
      'should preserve a coherent solid-surface greenhouse handoff without an absolute climate temperature',
      () => {
        const contribution =
          new AtmosphereGreenhouseGasContribution(
            AtmosphereGas.WATER_VAPOR,
            0.01,
            1.35,
            0.0135,
          );

        const tau =
          0.81;

        const effect =
          new AtmosphereGreenhouseEffect(
            1,
            locator,
            seed,
            AtmosphereRetentionRegime.WELL_RETAINED,
            AtmospherePressureRegime.MODERATE,
            101_325,
            0.95,
            1,
            0.3,
            0.01,
            0.0135,
            1,
            101_325 *
              0.0135,
            tau,
            greenhouseLongwaveTrappingFraction01(
              tau,
            ),
            greenhouseTemperatureAmplificationFactor(
              tau,
            ),
            AtmosphereGreenhouseRegime.MODERATE,
            [
              contribution,
            ],
          );

        expect(
          effect.longwaveTrappingFraction01,
        ).toBeGreaterThan(0);

        expect(
          effect.temperatureAmplificationFactor,
        ).toBeGreaterThan(1);

        expect(
          'surfaceTemperatureKelvin' in
            effect,
        ).toBe(false);
      },
    );

    it(
      'should encode vacuum and deep-envelope greenhouse semantics explicitly',
      () => {
        const vacuum =
          new AtmosphereGreenhouseEffect(
            1,
            locator,
            seed,
            AtmosphereRetentionRegime.VACUUM,
            AtmospherePressureRegime.VACUUM,
            0,
            0,
            1,
            0.3,
            0,
            0,
            0,
            0,
            0,
            0,
            1,
            AtmosphereGreenhouseRegime.NONE,
            [],
          );

        expect(
          vacuum.regime,
        ).toBe(
          AtmosphereGreenhouseRegime.NONE,
        );

        const hydrogen =
          new AtmosphereGreenhouseGasContribution(
            AtmosphereGas.HYDROGEN,
            0.9,
            0.04,
            0.036,
          );

        const deep =
          new AtmosphereGreenhouseEffect(
            1,
            locator,
            seed,
            AtmosphereRetentionRegime.DEEP_ENVELOPE,
            AtmospherePressureRegime.DEEP_ENVELOPE,
            null,
            0.99,
            0.2,
            0.45,
            0.9,
            0.036,
            1,
            null,
            6,
            greenhouseLongwaveTrappingFraction01(
              6,
            ),
            null,
            AtmosphereGreenhouseRegime.DEEP_ENVELOPE,
            [
              hydrogen,
            ],
          );

        expect(
          deep.temperatureAmplificationFactor,
        ).toBeNull();

        expect(
          deep.isDeepEnvelopeBlanketing,
        ).toBe(true);
      },
    );
  },
);
