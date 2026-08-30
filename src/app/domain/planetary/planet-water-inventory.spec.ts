import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetType,
} from './planet-type';

import {
  PlanetSurfaceWaterRegime,
} from './planet-surface-water-regime';

import {
  PlanetWaterInventory,
} from './planet-water-inventory';

import {
  PlanetWaterPhaseRegime,
} from './planet-water-phase-regime';

describe(
  'PlanetWaterInventory point 20.7',
  () => {
    const locator =
      new BodyLocator(
        4n,
        -9n,
        12n,
        0n,
      );

    const seed =
      new BodySeed(
        '22222222222222222222222222222222',
      );

    it(
      'should preserve a mixed water inventory with ocean-scale liquid coverage',
      () => {
        const inventory =
          new PlanetWaterInventory(
            1,
            locator,
            seed,
            PlanetType.OCEAN,
            0.55,
            101_325,
            0.015,
            288,
            260,
            310,
            0.84,
            0.82,
            0.20,
            0.72,
            0.08,
            0.16,
            0.70,
            PlanetWaterPhaseRegime.MIXED,
            PlanetSurfaceWaterRegime.OCEANS,
            true,
          );

        expect(
          inventory.hasAnyModeledWater,
        ).toBe(true);

        expect(
          inventory.hasSurfaceLiquidWater,
        ).toBe(true);

        expect(
          inventory.hasSurfaceIce,
        ).toBe(true);
      },
    );

    it(
      'should preserve deep-envelope semantics without inventing surface phases or coverage',
      () => {
        const inventory =
          new PlanetWaterInventory(
            1,
            locator,
            seed,
            PlanetType.GAS_GIANT,
            0.1,
            null,
            0.02,
            null,
            null,
            null,
            null,
            0.30,
            null,
            null,
            null,
            null,
            null,
            PlanetWaterPhaseRegime.DEEP_ENVELOPE,
            PlanetSurfaceWaterRegime.DEEP_ENVELOPE,
            false,
          );

        expect(
          inventory.surfaceLiquidWaterCoverageFraction01,
        ).toBeNull();

        expect(
          inventory.phaseRegime,
        ).toBe(
          PlanetWaterPhaseRegime.DEEP_ENVELOPE,
        );
      },
    );

    it(
      'should reject inconsistent phase normalization and surface morphology',
      () => {
        expect(
          () =>
            new PlanetWaterInventory(
              1,
              locator,
              seed,
              PlanetType.ROCKY,
              0.2,
              101_325,
              0,
              280,
              270,
              290,
              0.7,
              0.4,
              0.2,
              0.2,
              0.2,
              0.1,
              0.2,
              PlanetWaterPhaseRegime.MIXED,
              PlanetSurfaceWaterRegime.SEAS,
              true,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
