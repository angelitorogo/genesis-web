import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
  PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
  PlanetPhysicalProperties,
} from './planet-physical-properties';

describe(
  'PlanetPhysicalProperties point 19.2',
  () => {
    const locator =
      new BodyLocator(
        2n,
        -4n,
        7n,
        0n,
      );

    const seed =
      new BodySeed(
        '11111111111111111111111111111111',
      );

    it(
      'should preserve an Earth-normalized coherent mass/radius/density/gravity state',
      () => {
        const properties =
          new PlanetPhysicalProperties(
            1,
            locator,
            seed,
            1,
            0,
            1,
            1,
            PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
            1,
            PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
          );

        expect(
          properties.massEarth,
        ).toBe(1);

        expect(
          properties.radiusEarth,
        ).toBe(1);

        expect(
          properties.envelopeMassFraction01,
        ).toBe(0);

        expect(
          properties.solidMassFraction01,
        ).toBe(1);
      },
    );

    it(
      'should derive envelope/solid fractions without assigning a point-19.4 type or point-19.5 composition',
      () => {
        const radiusEarth =
          2;

        const massEarth =
          2;

        const density =
          PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER *
          massEarth /
          radiusEarth **
            3;

        const gravityEarth =
          massEarth /
          radiusEarth **
            2;

        const properties =
          new PlanetPhysicalProperties(
            1,
            locator,
            seed,
            1,
            1,
            massEarth,
            radiusEarth,
            density,
            gravityEarth,
            gravityEarth *
              PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
          );

        expect(
          properties.envelopeMassFraction01,
        ).toBe(0.5);

        expect(
          properties.solidMassFraction01,
        ).toBe(0.5);

        expect(
          'planetType' in
            properties,
        ).toBe(false);

        expect(
          'internalComposition' in
            properties,
        ).toBe(false);
      },
    );

    it(
      'should reject incoherent mass conservation, density or gravity',
      () => {
        expect(
          () =>
            new PlanetPhysicalProperties(
              1,
              locator,
              seed,
              1,
              1,
              3,
              1,
              3 *
                PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
              3,
              3 *
                PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetPhysicalProperties(
              1,
              locator,
              seed,
              1,
              0,
              1,
              1,
              4,
              1,
              PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetPhysicalProperties(
              1,
              locator,
              seed,
              1,
              0,
              1,
              1,
              PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
              2,
              2 *
                PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a BodyLocator that does not match the planet ordinal',
      () => {
        expect(
          () =>
            new PlanetPhysicalProperties(
              2,
              locator,
              seed,
              1,
              0,
              1,
              1,
              PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
              1,
              PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
