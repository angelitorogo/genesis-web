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
  PlanetGeologyState,
} from './planet-geology-state';

import {
  PlanetTectonicRegime,
} from './planet-tectonic-regime';

import {
  PlanetType,
} from './planet-type';

import {
  PlanetVolcanismRegime,
} from './planet-volcanism-regime';

describe(
  'PlanetGeologyState point 20.8',
  () => {
    const locator =
      new BodyLocator(
        1n,
        -2n,
        3n,
        0n,
      );

    const seed =
      new BodySeed(
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      );

    it(
      'should preserve auditable normalized solid-surface geology and derived flags',
      () => {
        const state =
          solidState();

        expect(state.geologyRegime)
          .toBe(PlanetGeologyRegime.ACTIVE);
        expect(state.volcanismRegime)
          .toBe(PlanetVolcanismRegime.MODERATE);
        expect(state.tectonicRegime)
          .toBe(PlanetTectonicRegime.PLATE_TECTONICS);
        expect(state.hasDefinedSolidSurfaceGeology)
          .toBe(true);
        expect(state.isGeologicallyActive)
          .toBe(true);
        expect(state.hasActiveVolcanism)
          .toBe(true);
        expect(state.supportsMobileLithosphere)
          .toBe(true);
      },
    );

    it(
      'should preserve deep-envelope geology as deliberately undefined',
      () => {
        const state =
          new PlanetGeologyState(
            1,
            locator,
            seed,
            PlanetType.GAS_GIANT,
            100,
            10,
            1,
            0.05,
            0.05,
            0.30,
            0.15,
            0.20,
            0,
            0.7,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            PlanetGeologyRegime.DEEP_ENVELOPE,
            PlanetVolcanismRegime.DEEP_ENVELOPE,
            PlanetTectonicRegime.DEEP_ENVELOPE,
          );

        expect(state.geologicalActivityIndex01)
          .toBeNull();
        expect(state.hasDefinedSolidSurfaceGeology)
          .toBe(false);
        expect(state.supportsMobileLithosphere)
          .toBe(false);
      },
    );

    it(
      'should reject regime/index mismatches and incomplete solid-surface states',
      () => {
        expect(
          () => solidState({
            geologyRegime:
              PlanetGeologyRegime.HIGH_ACTIVITY,
          }),
        ).toThrow(RangeError);

        expect(
          () => solidState({
            volcanismIndex01:
              null,
          }),
        ).toThrow(RangeError);
      },
    );

    function solidState(
      overrides: {
        readonly geologicalActivityIndex01?: number | null;
        readonly volcanismIndex01?: number | null;
        readonly geologyRegime?: PlanetGeologyRegime;
      } = {},
    ): PlanetGeologyState {
      const geologicalActivityIndex01 =
        overrides.geologicalActivityIndex01 ??
        0.45;

      const volcanismIndex01 =
        'volcanismIndex01' in overrides
          ? overrides.volcanismIndex01!
          : 0.35;

      return new PlanetGeologyState(
        1,
        locator,
        seed,
        PlanetType.ROCKY,
        1,
        1,
        1,
        0.32,
        0.67,
        0.01,
        0.01,
        0.01,
        0,
        0.7,
        0.71,
        0.60,
        0,
        0.55,
        geologicalActivityIndex01,
        volcanismIndex01,
        0.70,
        0.20,
        0.65,
        overrides.geologyRegime ??
          PlanetGeologyRegime.ACTIVE,
        PlanetVolcanismRegime.MODERATE,
        PlanetTectonicRegime.PLATE_TECTONICS,
      );
    }
  },
);
