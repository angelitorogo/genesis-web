import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetSurfaceBaseProperties,
} from './planet-surface-base-properties';

import {
  PlanetSurfaceBaseRegime,
} from './planet-surface-base-regime';

import {
  PlanetType,
} from './planet-type';

describe(
  'PlanetSurfaceBaseProperties point 19.6',
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
      'should preserve a normalized solid surface baseline and reference Bond albedo',
      () => {
        const surface =
          new PlanetSurfaceBaseProperties(
            1,
            locator,
            seed,
            PlanetType.OCEAN,
            0.01,
            0.48,
            1.05,
            PlanetSurfaceBaseRegime.VOLATILE_RICH_SOLID,
            0.24,
            0.35,
            0.65,
            0,
            0,
            0.25,
          );

        expect(
          surface.referenceBondAlbedo01,
        ).toBe(0.24);

        expect(
          surface.hasDefinedSolidSurfaceBase,
        ).toBe(true);

        expect(
          surface.isDeepEnvelopeSurface,
        ).toBe(false);
      },
    );

    it(
      'should represent envelope-dominated planets without inventing a solid surface roughness',
      () => {
        const surface =
          new PlanetSurfaceBaseProperties(
            1,
            locator,
            seed,
            PlanetType.GAS_GIANT,
            0.65,
            0.20,
            0.4,
            PlanetSurfaceBaseRegime.DEEP_ENVELOPE,
            0.42,
            0,
            0,
            0,
            1,
            null,
          );

        expect(
          surface.hasDefinedSolidSurfaceBase,
        ).toBe(false);

        expect(
          surface.isDeepEnvelopeSurface,
        ).toBe(true);
      },
    );

    it(
      'should reject incompatible type/regime pairs, invalid fractions and invalid deep-envelope semantics',
      () => {
        expect(
          () =>
            new PlanetSurfaceBaseProperties(
              1,
              locator,
              seed,
              PlanetType.ROCKY,
              0,
              0.05,
              1,
              PlanetSurfaceBaseRegime.FROZEN_VOLATILE,
              0.2,
              1,
              0,
              0,
              0,
              0.5,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetSurfaceBaseProperties(
              1,
              locator,
              seed,
              PlanetType.ROCKY,
              0,
              0.05,
              1,
              PlanetSurfaceBaseRegime.MINERAL_REGOLITH,
              0.2,
              0.7,
              0.1,
              0,
              0,
              0.5,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetSurfaceBaseProperties(
              1,
              locator,
              seed,
              PlanetType.ICE_GIANT,
              0.2,
              0.6,
              0.2,
              PlanetSurfaceBaseRegime.ICE_RICH_DEEP_ENVELOPE,
              0.4,
              0,
              0,
              0,
              1,
              0.2,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
