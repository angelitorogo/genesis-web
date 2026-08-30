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
  MoonPopulationProfile,
} from './moon-population-profile';

describe(
  'MoonPopulationProfile point 21.2',
  () => {
    const locator =
      new BodyLocator(
        4n,
        -9n,
        12n,
        1n,
      );

    const seed =
      new BodySeed(
        '22222222222222222222222222222222',
      );

    it(
      'should preserve the exact host-planet sources and expose only the total modeled moon count',
      () => {
        const profile =
          new MoonPopulationProfile(
            2,
            locator,
            seed,
            PlanetType.GAS_GIANT,
            318,
            11.2,
            5.2,
            0.05,
            1,
            706.4,
            0.89,
            37,
          );

        expect(
          profile.hostPlanetOrdinal,
        ).toBe(2);

        expect(
          profile.hostPlanetLocator,
        ).toBe(locator);

        expect(
          profile.hostPlanetSeed,
        ).toBe(seed);

        expect(
          profile.moonCount,
        ).toBe(37);

        expect(
          profile.hasMoons,
        ).toBe(true);

        for (
          const laterProperty
          of [
            'moons',
            'moonLocators',
            'moonSeeds',
            'orbitalProperties',
            'physicalProperties',
            'tidalState',
            'habitability',
            'designations',
          ]
        ) {
          expect(
            laterProperty in
              profile,
          ).toBe(false);
        }
      },
    );

    it(
      'should allow a coherent moonless population',
      () => {
        const profile =
          new MoonPopulationProfile(
            2,
            locator,
            seed,
            PlanetType.ROCKY,
            1,
            1,
            1,
            0.01,
            1,
            5,
            0,
            0,
          );

        expect(
          profile.moonCount,
        ).toBe(0);

        expect(
          profile.hasMoons,
        ).toBe(false);
      },
    );

    it(
      'should reject malformed identity, physical sources, capacity or moon count',
      () => {
        const valid =
          () =>
            new MoonPopulationProfile(
              2,
              locator,
              seed,
              PlanetType.ROCKY,
              1,
              1,
              1,
              0.01,
              1,
              200,
              0.5,
              1,
            );

        expect(
          valid,
        ).not.toThrow();

        expect(
          () =>
            new MoonPopulationProfile(
              1,
              locator,
              seed,
              PlanetType.ROCKY,
              1,
              1,
              1,
              0.01,
              1,
              200,
              0.5,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new MoonPopulationProfile(
              2,
              locator,
              seed,
              PlanetType.ROCKY,
              0,
              1,
              1,
              0.01,
              1,
              200,
              0.5,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new MoonPopulationProfile(
              2,
              locator,
              seed,
              PlanetType.ROCKY,
              1,
              1,
              1,
              1,
              1,
              200,
              0.5,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new MoonPopulationProfile(
              2,
              locator,
              seed,
              PlanetType.ROCKY,
              1,
              1,
              1,
              0.01,
              1,
              200,
              1.01,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new MoonPopulationProfile(
              2,
              locator,
              seed,
              PlanetType.ROCKY,
              1,
              1,
              1,
              0.01,
              1,
              5,
              0,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new MoonPopulationProfile(
              2,
              locator,
              seed,
              PlanetType.ROCKY,
              1,
              1,
              1,
              0.01,
              1,
              200,
              0.5,
              1.5,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
