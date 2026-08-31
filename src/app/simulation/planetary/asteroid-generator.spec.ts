import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  AsteroidBeltPopulationProfile,
} from '../../domain/planetary/asteroid-belt-population-profile';

import {
  AsteroidBeltRegion,
} from '../../domain/planetary/asteroid-belt-region';

import {
  AsteroidCompositionRegime,
} from '../../domain/planetary/asteroid-composition-regime';

import {
  AsteroidMultiplicityRegime,
} from '../../domain/planetary/asteroid-multiplicity-regime';

import {
  AsteroidStructureRegime,
} from '../../domain/planetary/asteroid-structure-regime';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  AsteroidGenerator,
} from './asteroid-generator';

describe(
  'AsteroidGenerator points 22.3-22.4 V1',
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
        6n,
        113n,
        9n,
      );

    const seed =
      new SystemSeed(
        '22222222222222222222222222222222',
      );

    const planetarySystem = {
      generationKey,
      locator,
      seed,
      formationBlueprint: {
        residualDustMassEarth:
          5,
      },
    } as unknown as PlanetarySystem;

    const inner =
      new AsteroidBeltPopulationProfile(
        AsteroidBeltRegion.INNER,
        5,
        true,
        0.177,
        0.984,
        0.3585318762245575,
        0.807,
        0.06510776359974753,
        0.886689985155506,
      );

    const outer =
      new AsteroidBeltPopulationProfile(
        AsteroidBeltRegion.OUTER,
        5,
        true,
        6.71,
        46,
        20.55572634155551,
        39.29,
        0.07672389479058565,
        0.9032644814288714,
      );

    it(
      'should preserve frozen point-22.3 identity/size/orbits while adding deterministic point-22.4 taxonomy',
      () => {
        const asteroids =
          AsteroidGenerator
            .generate(
              generationKey,
              planetarySystem,
              [
                inner,
                outer,
              ],
            );

        expect(
          asteroids,
        ).toHaveLength(14);

        expect(
          asteroids.filter(
            asteroid =>
              asteroid.beltRegion ===
              AsteroidBeltRegion.INNER,
          ),
        ).toHaveLength(7);

        expect(
          asteroids.filter(
            asteroid =>
              asteroid.beltRegion ===
              AsteroidBeltRegion.OUTER,
          ),
        ).toHaveLength(7);

        const firstInner =
          asteroids[0];

        expect(
          firstInner.proceduralId,
        ).toBe(
          '01D8D9F53AECCDC4F46A562B58365B91',
        );

        expect(
          firstInner.diameterKilometers,
        ).toBeCloseTo(
          615.9146924894908,
          10,
        );

        expect(
          firstInner.orbit.semiMajorAxisAu,
        ).toBeCloseTo(
          0.6398471330138847,
          12,
        );

        expect(
          firstInner.orbit.eccentricity,
        ).toBeCloseTo(
          0.2055505421385169,
          12,
        );

        expect(
          firstInner.compositionRegime,
        ).toBe(
          AsteroidCompositionRegime.METALLIC,
        );

        expect(
          firstInner.structureRegime,
        ).toBe(
          AsteroidStructureRegime.FRACTURED,
        );

        expect(
          firstInner.multiplicityRegime,
        ).toBe(
          AsteroidMultiplicityRegime.SINGLE,
        );

        expect(
          firstInner.taxonomy.bulkDensityGramsPerCubicCentimeter,
        ).toBeCloseTo(
          4.745126654028347,
          10,
        );

        const firstOuter =
          asteroids[7];

        expect(
          firstOuter.proceduralId,
        ).toBe(
          'D60EB9501E11A1DC0C3DE5F565D89F32',
        );

        expect(
          firstOuter.diameterKilometers,
        ).toBeCloseTo(
          649.8832372274101,
          10,
        );

        expect(
          firstOuter.orbit.semiMajorAxisAu,
        ).toBeCloseTo(
          24.883149101453533,
          10,
        );

        expect(
          firstOuter.compositionRegime,
        ).toBe(
          AsteroidCompositionRegime.CARBONACEOUS,
        );

        expect(
          firstOuter.taxonomy.iceFraction01,
        ).toBeCloseTo(
          0.10123388483127829,
          12,
        );

        expect(
          asteroids.filter(
            asteroid =>
              asteroid.compositionRegime ===
              AsteroidCompositionRegime.ICE_RICH,
          ),
        ).toHaveLength(3);

        expect(
          asteroids.filter(
            asteroid =>
              asteroid.structureRegime ===
              AsteroidStructureRegime.RUBBLE_PILE,
          ),
        ).toHaveLength(1);

        expect(
          asteroids.filter(
            asteroid =>
              asteroid.multiplicityRegime ===
              AsteroidMultiplicityRegime.BINARY,
          ),
        ).toHaveLength(2);

        for (
          const asteroid
          of asteroids
        ) {
          expect(
            asteroid.isDiscoverable,
          ).toBe(true);

          expect(
            asteroid.orbit.periapsisAu,
          ).toBeGreaterThanOrEqual(
            asteroid.sourceBeltProfile.innerEdgeAu!,
          );

          expect(
            asteroid.orbit.apoapsisAu,
          ).toBeLessThanOrEqual(
            asteroid.sourceBeltProfile.outerEdgeAu!,
          );

          expect(
            asteroid.taxonomy,
          ).toBeDefined();

          expect(
            'discoveryState' in asteroid,
          ).toBe(false);
        }
      },
    );

    it(
      'should remain exactly deterministic and return no objects for absent belts',
      () => {
        const first =
          AsteroidGenerator
            .generate(
              generationKey,
              planetarySystem,
              [
                inner,
                outer,
              ],
            );

        const second =
          AsteroidGenerator
            .generate(
              generationKey,
              planetarySystem,
              [
                inner,
                outer,
              ],
            );

        expect(
          second,
        ).toEqual(
          first,
        );

        const absentInner =
          new AsteroidBeltPopulationProfile(
            AsteroidBeltRegion.INNER,
            5,
            false,
            null,
            null,
            null,
            null,
            0,
            0,
          );

        const absentOuter =
          new AsteroidBeltPopulationProfile(
            AsteroidBeltRegion.OUTER,
            5,
            false,
            null,
            null,
            null,
            null,
            0,
            0,
          );

        expect(
          AsteroidGenerator
            .generate(
              generationKey,
              planetarySystem,
              [
                absentInner,
                absentOuter,
              ],
            ),
        ).toEqual([]);
      },
    );

    it(
      'should reject reordered profiles or a foreign generation key',
      () => {
        expect(
          () =>
            AsteroidGenerator
              .generate(
                generationKey,
                planetarySystem,
                [
                  outer,
                  inner,
                ],
              ),
        ).toThrow(
          RangeError,
        );

        const otherKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '0123-4567-89AB-CDEF-FEDC-BA98-7654-3210',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            AsteroidGenerator
              .generate(
                otherKey,
                planetarySystem,
                [
                  inner,
                  outer,
                ],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
