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
  SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

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
  type PlanetaryOrbitalElements,
} from '../../domain/planetary/planetary-orbital-elements';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  AsteroidBeltGenerator,
} from './asteroid-belt-generator';

describe(
  'AsteroidBeltGenerator points 22.2-22.4 V1',
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

    it(
      'should preserve frozen point-22.2 populations and point-22.3 asteroids while attaching point-22.4 taxonomy',
      () => {
        const planetarySystem =
          systemFixture({
            generationKey,
            locator,
            seed,
            residualDustMassEarth:
              5,
            sourceCandidateCount:
              6,
            sourceMigratedBodyCount:
              1,
            sourceCollisionCount:
              2,
            envelopeInnerAu:
              0.1,
            envelopeOuterAu:
              50,
            semiMajorAxesAu: [
              0.15,
              1.2,
              5.5,
            ],
          });

        const generated =
          AsteroidBeltGenerator
            .generate(
              generationKey,
              planetarySystem,
            );

        expect(
          generated.beltCount,
        ).toBe(2);

        expect(
          generated.innerBelt.region,
        ).toBe(
          AsteroidBeltRegion.INNER,
        );

        expect(
          generated.outerBelt.region,
        ).toBe(
          AsteroidBeltRegion.OUTER,
        );

        expect(
          generated.innerBeltExists,
        ).toBe(true);

        expect(
          generated.outerBeltExists,
        ).toBe(true);

        expect(
          generated.innerBelt.innerEdgeAu,
        ).toBeCloseTo(
          0.177,
          12,
        );

        expect(
          generated.innerBelt.outerEdgeAu,
        ).toBeCloseTo(
          0.984,
          12,
        );

        expect(
          generated.innerBelt.peakAu,
        ).toBeCloseTo(
          0.3585318762245575,
          12,
        );

        expect(
          generated.innerBelt.retainedMassEarth,
        ).toBeCloseTo(
          0.06510776359974753,
          12,
        );

        expect(
          generated.innerBelt.populationIndex01,
        ).toBeCloseTo(
          0.886689985155506,
          12,
        );

        expect(
          generated.outerBelt.innerEdgeAu,
        ).toBeCloseTo(
          6.71,
          12,
        );

        expect(
          generated.outerBelt.outerEdgeAu,
        ).toBeCloseTo(
          46,
          12,
        );

        expect(
          generated.outerBelt.peakAu,
        ).toBeCloseTo(
          20.55572634155551,
          12,
        );

        expect(
          generated.outerBelt.retainedMassEarth,
        ).toBeCloseTo(
          0.07672389479058565,
          12,
        );

        expect(
          generated.outerBelt.populationIndex01,
        ).toBeCloseTo(
          0.9032644814288714,
          12,
        );

        expect(
          generated.totalRetainedBeltMassEarth,
        ).toBeCloseTo(
          0.14183165839033318,
          12,
        );

        expect(
          generated.relevantAsteroidCount,
        ).toBe(14);

        expect(
          generated.innerRelevantAsteroidCount,
        ).toBe(7);

        expect(
          generated.outerRelevantAsteroidCount,
        ).toBe(7);

        expect(
          generated.carbonaceousRelevantAsteroidCount,
        ).toBe(7);

        expect(
          generated.iceRichRelevantAsteroidCount,
        ).toBe(5);

        expect(
          generated.rubblePileRelevantAsteroidCount,
        ).toBe(1);

        expect(
          generated.binaryLikeRelevantAsteroidCount,
        ).toBe(2);

        expect(
          generated.relevantAsteroids[0].compositionRegime,
        ).toBe(
          AsteroidCompositionRegime.METALLIC,
        );

        expect(
          generated.relevantAsteroids[0].structureRegime,
        ).toBe(
          AsteroidStructureRegime.FRACTURED,
        );

        expect(
          generated.relevantAsteroids[2].multiplicityRegime,
        ).toBe(
          AsteroidMultiplicityRegime.BINARY,
        );

        expect(
          generated.relevantAsteroids[0].proceduralId,
        ).toBe(
          '01D8D9F53AECCDC4F46A562B58365B91',
        );

        expect(
          generated.relevantAsteroids[7].proceduralId,
        ).toBe(
          'D60EB9501E11A1DC0C3DE5F565D89F32',
        );

        expect(
          'asteroids' in generated,
        ).toBe(false);

        expect(
          'asteroidSeeds' in generated,
        ).toBe(false);
      },
    );

    it(
      'should remain exactly deterministic and query-order independent for the same SystemSeed and frozen mature architecture',
      () => {
        const planetarySystem =
          systemFixture({
            generationKey,
            locator,
            seed,
            residualDustMassEarth:
              3,
            sourceCandidateCount:
              4,
            sourceMigratedBodyCount:
              0,
            sourceCollisionCount:
              1,
            envelopeInnerAu:
              0.08,
            envelopeOuterAu:
              30,
            semiMajorAxesAu: [
              0.4,
              2,
            ],
          });

        const first =
          AsteroidBeltGenerator
            .generate(
              generationKey,
              planetarySystem,
            );

        AsteroidBeltGenerator
          .generate(
            generationKey,
            systemFixture({
              generationKey,
              locator,
              seed:
                new SystemSeed(
                  '33333333333333333333333333333333',
                ),
              residualDustMassEarth:
                2,
              sourceCandidateCount:
                2,
              sourceMigratedBodyCount:
                1,
              sourceCollisionCount:
                0,
              envelopeInnerAu:
                0.1,
              envelopeOuterAu:
                20,
              semiMajorAxesAu: [
                1,
              ],
            }),
          );

        const second =
          AsteroidBeltGenerator
            .generate(
              generationKey,
              planetarySystem,
            );

        expect(
          second.innerBelt,
        ).toEqual(
          first.innerBelt,
        );

        expect(
          second.outerBelt,
        ).toEqual(
          first.outerBelt,
        );
      },
    );

    it(
      'should project statistical belt opportunities into a zero-planet residual disk instead of suppressing minor bodies',
      () => {
        const planetarySystem =
          systemFixture({
            generationKey,
            locator,
            seed,
            residualDustMassEarth:
              5,
            sourceCandidateCount:
              0,
            sourceMigratedBodyCount:
              0,
            sourceCollisionCount:
              0,
            envelopeInnerAu:
              0.1,
            envelopeOuterAu:
              100,
            semiMajorAxesAu:
              [],
          });

        const generated =
          AsteroidBeltGenerator
            .generate(
              generationKey,
              planetarySystem,
            );

        expect(
          generated.maturePlanetCount,
        ).toBe(0);

        expect(
          generated.innerBelt.innerEdgeAu,
        ).not.toBeNull();

        expect(
          generated.outerBelt.outerEdgeAu,
        ).not.toBeNull();

        expect(
          generated.beltCount,
        ).toBeGreaterThan(0);
      },
    );

    it(
      'should emit two explicit absent population profiles when the frozen residual-dust reservoir is zero',
      () => {
        const planetarySystem =
          systemFixture({
            generationKey,
            locator,
            seed,
            residualDustMassEarth:
              0,
            sourceCandidateCount:
              3,
            sourceMigratedBodyCount:
              1,
            sourceCollisionCount:
              1,
            envelopeInnerAu:
              0.1,
            envelopeOuterAu:
              30,
            semiMajorAxesAu: [
              0.5,
              5,
            ],
          });

        const generated =
          AsteroidBeltGenerator
            .generate(
              generationKey,
              planetarySystem,
            );

        expect(
          generated.beltCount,
        ).toBe(0);

        expect(
          generated.hasBelts,
        ).toBe(false);

        expect(
          generated.populationProfiles,
        ).toHaveLength(2);

        expect(
          generated.populationProfiles
            .every(
              profile =>
                !profile.exists &&
                profile.retainedMassEarth ===
                  0,
            ),
        ).toBe(true);

        expect(
          generated.relevantAsteroidCount,
        ).toBe(0);
      },
    );

    it(
      'should reject a PlanetarySystem from a different UniverseGenerationKey or an unsupported generator version',
      () => {
        const otherKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '0123-4567-89AB-CDEF-FEDC-BA98-7654-3210',
            ),
            GeneratorVersion.V1,
          );

        const foreignSystem =
          systemFixture({
            generationKey:
              otherKey,
            locator,
            seed,
            residualDustMassEarth:
              1,
            sourceCandidateCount:
              1,
            sourceMigratedBodyCount:
              0,
            sourceCollisionCount:
              0,
            envelopeInnerAu:
              0.1,
            envelopeOuterAu:
              10,
            semiMajorAxesAu: [
              1,
            ],
          });

        expect(
          () =>
            AsteroidBeltGenerator
              .generate(
                generationKey,
                foreignSystem,
              ),
        ).toThrow(
          RangeError,
        );

        const unsupportedKey = {
          ...generationKey,
          generatorVersion: {
            code:
              999,
          },
        } as unknown as UniverseGenerationKey;

        expect(
          () =>
            AsteroidBeltGenerator
              .generate(
                unsupportedKey,
                systemFixture({
                  generationKey:
                    unsupportedKey,
                  locator,
                  seed,
                  residualDustMassEarth:
                    1,
                  sourceCandidateCount:
                    1,
                  sourceMigratedBodyCount:
                    0,
                  sourceCollisionCount:
                    0,
                  envelopeInnerAu:
                    0.1,
                  envelopeOuterAu:
                    10,
                  semiMajorAxesAu: [
                    1,
                  ],
                }),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function systemFixture(
  input: {
    readonly generationKey:
      UniverseGenerationKey;
    readonly locator:
      SystemLocator;
    readonly seed:
      SystemSeed;
    readonly residualDustMassEarth:
      number;
    readonly sourceCandidateCount:
      number;
    readonly sourceMigratedBodyCount:
      number;
    readonly sourceCollisionCount:
      number;
    readonly envelopeInnerAu:
      number;
    readonly envelopeOuterAu:
      number;
    readonly semiMajorAxesAu:
      readonly number[];
  },
): PlanetarySystem {

  const orbits =
    input
      .semiMajorAxesAu
      .map(
        semiMajorAxisAu => ({
          semiMajorAxisAu,
        } as PlanetaryOrbitalElements),
      );

  return {
    generationKey:
      input.generationKey,
    locator:
      input.locator,
    seed:
      input.seed,
    planetCount:
      orbits.length,
    orbits,
    orbitalLayout: {
      generationInnerLimitAu:
        input.envelopeInnerAu,
      generationOuterLimitAu:
        input.envelopeOuterAu,
    },
    formationBlueprint: {
      sourceInnerRadiusAu:
        input.envelopeInnerAu,
      sourceOuterRadiusAu:
        input.envelopeOuterAu,
      residualDustMassEarth:
        input.residualDustMassEarth,
      sourceCandidateCount:
        input.sourceCandidateCount,
      sourceMigratedBodyCount:
        input.sourceMigratedBodyCount,
      sourceCollisionCount:
        input.sourceCollisionCount,
    },
  } as unknown as PlanetarySystem;
}
