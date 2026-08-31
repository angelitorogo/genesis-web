import {
  SystemLocator,
} from '../generation/procedural-locator';

import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  SystemSeed,
} from '../seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  AsteroidBeltPopulationProfile,
} from './asteroid-belt-population-profile';

import {
  AsteroidBeltRegion,
} from './asteroid-belt-region';

import {
  AsteroidBeltSystem,
} from './asteroid-belt-system';

import {
  type PlanetarySystem,
} from './planetary-system';

describe(
  'AsteroidBeltSystem point 22.2',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const locator =
      new SystemLocator(
        4n,
        -27n,
        12n,
      );

    const seed =
      new SystemSeed(
        '0123456789ABCDEFFEDCBA9876543210',
      );

    it(
      'should retain the exact mature system while exposing one frozen INNER and OUTER statistical profile',
      () => {
        const planetarySystem =
          systemFixture(
            generationKey,
            locator,
            seed,
            5,
            4,
          );

        const inner =
          profile(
            AsteroidBeltRegion.INNER,
            4,
            true,
            1.5,
            2.8,
            0.05,
            0.6,
          );

        const outer =
          profile(
            AsteroidBeltRegion.OUTER,
            4,
            false,
            null,
            null,
            0,
            0,
          );

        const beltSystem =
          new AsteroidBeltSystem(
            planetarySystem,
            inner,
            outer,
          );

        expect(
          beltSystem.hostPlanetarySystem,
        ).toBe(
          planetarySystem,
        );

        expect(
          beltSystem.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          beltSystem.systemLocator,
        ).toBe(
          locator,
        );

        expect(
          beltSystem.systemSeed,
        ).toBe(
          seed,
        );

        expect(
          beltSystem.maturePlanetCount,
        ).toBe(5);

        expect(
          beltSystem.populationProfiles,
        ).toEqual([
          inner,
          outer,
        ]);

        expect(
          beltSystem.belts,
        ).toEqual([
          inner,
        ]);

        expect(
          beltSystem.beltCount,
        ).toBe(1);

        expect(
          beltSystem.hasBelts,
        ).toBe(true);

        expect(
          beltSystem.totalRetainedBeltMassEarth,
        ).toBe(0.05);

        for (
          const reservedProperty
          of [
            'asteroids',
            'asteroidSeeds',
            'comets',
            'transNeptunianObjects',
            'interstellarObjects',
            'capturedExtrasolarObjects',
            'discoveryState',
          ]
        ) {
          expect(
            reservedProperty in
              beltSystem,
          ).toBe(false);
        }
      },
    );

    it(
      'should allow two absent profiles when no residual population survives',
      () => {
        const planetarySystem =
          systemFixture(
            generationKey,
            locator,
            seed,
            0,
            0,
          );

        const beltSystem =
          new AsteroidBeltSystem(
            planetarySystem,
            profile(
              AsteroidBeltRegion.INNER,
              0,
              false,
              null,
              null,
              0,
              0,
            ),
            profile(
              AsteroidBeltRegion.OUTER,
              0,
              false,
              null,
              null,
              0,
              0,
            ),
          );

        expect(
          beltSystem.beltCount,
        ).toBe(0);

        expect(
          beltSystem.hasBelts,
        ).toBe(false);
      },
    );

    it(
      'should reject swapped regions, forged residual reservoirs or over-allocation of residual mass',
      () => {
        const planetarySystem =
          systemFixture(
            generationKey,
            locator,
            seed,
            2,
            1,
          );

        expect(
          () =>
            new AsteroidBeltSystem(
              planetarySystem,
              profile(
                AsteroidBeltRegion.OUTER,
                1,
                false,
                null,
                null,
                0,
                0,
              ),
              profile(
                AsteroidBeltRegion.OUTER,
                1,
                false,
                null,
                null,
                0,
                0,
              ),
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new AsteroidBeltSystem(
              planetarySystem,
              profile(
                AsteroidBeltRegion.INNER,
                2,
                false,
                null,
                null,
                0,
                0,
              ),
              profile(
                AsteroidBeltRegion.OUTER,
                1,
                false,
                null,
                null,
                0,
                0,
              ),
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new AsteroidBeltSystem(
              planetarySystem,
              profile(
                AsteroidBeltRegion.INNER,
                1,
                true,
                1,
                2,
                0.6,
                0.5,
              ),
              profile(
                AsteroidBeltRegion.OUTER,
                1,
                true,
                4,
                6,
                0.6,
                0.5,
              ),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function profile(
  region:
    AsteroidBeltRegion,

  sourceResidualDustMassEarth:
    number,

  exists:
    boolean,

  innerEdgeAu:
    number | null,

  outerEdgeAu:
    number | null,

  retainedMassEarth:
    number,

  populationIndex01:
    number,
): AsteroidBeltPopulationProfile {

  return new AsteroidBeltPopulationProfile(
    region,
    sourceResidualDustMassEarth,
    exists,
    innerEdgeAu,
    outerEdgeAu,
    exists &&
      innerEdgeAu !==
        null &&
      outerEdgeAu !==
        null
      ? Math.sqrt(
          innerEdgeAu *
            outerEdgeAu,
        )
      : null,
    exists &&
      innerEdgeAu !==
        null &&
      outerEdgeAu !==
        null
      ? outerEdgeAu -
          innerEdgeAu
      : null,
    retainedMassEarth,
    populationIndex01,
  );
}

function systemFixture(
  generationKey:
    UniverseGenerationKey,

  locator:
    SystemLocator,

  seed:
    SystemSeed,

  planetCount:
    number,

  residualDustMassEarth:
    number,
): PlanetarySystem {

  return {
    generationKey,
    locator,
    seed,
    planetCount,
    formationBlueprint: {
      residualDustMassEarth,
    },
  } as unknown as PlanetarySystem;
}
