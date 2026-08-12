import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorStellarPopulationProperties,
} from '../../domain/sector/galaxy-sector-stellar-population-properties';

import {
  StellarPopulationRegime,
} from '../../domain/stellar/stellar-population-profile';

import {
  GalaxyPhysicalProperties,
} from '../../domain/universe/galaxy-physical-properties';

import {
  GalaxyStructure,
} from '../../domain/universe/galaxy-structure';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  StellarPopulationProfileGenerator,
} from './stellar-population-profile-generator';

describe(
  'StellarPopulationProfileGenerator',
  () => {
    const canonicalSeed =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    const canonicalGenerationKey =
      new UniverseGenerationKey(
        canonicalSeed,
        GeneratorVersion.V1,
      );

    const canonicalGalaxy =
      GalaxyGenerator.generate(
        canonicalGenerationKey,
        0n,
      );

    function sectorPopulation(
      ageBillionYears:
        number,

      metallicitySolarRatio =
        1.0,
    ): GalaxySectorStellarPopulationProperties {

      return new GalaxySectorStellarPopulationProperties(
        metallicitySolarRatio,
        ageBillionYears,
      );
    }

    function physicalProperties(
      stellarPopulation:
        bigint,

      starFormationRateSolarMassesPerYear:
        number,

      metallicitySolarRatio =
        1.0,
    ): GalaxyPhysicalProperties {

      return new GalaxyPhysicalProperties(
        8.0,
        100_000.0,
        1.0e11,
        stellarPopulation,
        metallicitySolarRatio,
        starFormationRateSolarMassesPerYear,
        new GalaxyStructure(
          0.5,
          0.5,
          0.1,
          0.1,
          2,
        ),
      );
    }

    it(
      'should reproduce the frozen V1 central Caeloria stellar population vector',
      () => {
        const profile =
          StellarPopulationProfileGenerator
            .generate(
              canonicalGenerationKey,
              canonicalGalaxy
                .physicalProperties,
              sectorPopulation(
                9.298532891895936,
                1.5250202653290195,
              ),
            );

        expect(
          profile
            .characteristicStellarAgeBillionYears,
        ).toBe(
          9.298532891895936,
        );

        expect(
          profile
            .formationActivityIndex,
        ).toBe(
          0.0753751220992348,
        );

        expect(
          profile
            .youngStarFraction,
        ).toBe(
          0.13778445593645078,
        );

        expect(
          profile
            .matureStarFraction,
        ).toBe(
          0.25982444215363404,
        );

        expect(
          profile
            .oldStarFraction,
        ).toBe(
          0.6023911019099152,
        );

        expect(
          profile
            .lowMassStarPropensity,
        ).toBe(
          0.8967627043074711,
        );

        expect(
          profile
            .solarLikeStarPropensity,
        ).toBe(
          0.7372520522688744,
        );

        expect(
          profile
            .highMassStarPropensity,
        ).toBe(
          0.027763025098852527,
        );

        expect(
          profile
            .stellarRemnantPropensity,
        ).toBe(
          0.6243482520428016,
        );

        expect(
          profile.regime,
        ).toBe(
          StellarPopulationRegime
            .OLD_QUIESCENT,
        );
      },
    );

    it(
      'should preserve the frozen Caeloria age gradient from central to middle to outer sectors',
      () => {
        const central =
          StellarPopulationProfileGenerator
            .generate(
              canonicalGenerationKey,
              canonicalGalaxy
                .physicalProperties,
              sectorPopulation(
                9.298532891895936,
              ),
            );

        const middle =
          StellarPopulationProfileGenerator
            .generate(
              canonicalGenerationKey,
              canonicalGalaxy
                .physicalProperties,
              sectorPopulation(
                8.793177843423331,
              ),
            );

        const outer =
          StellarPopulationProfileGenerator
            .generate(
              canonicalGenerationKey,
              canonicalGalaxy
                .physicalProperties,
              sectorPopulation(
                8.287822794950726,
              ),
            );

        expect(
          middle
            .formationActivityIndex,
        ).toBe(
          0.0753751220992348,
        );

        expect(
          middle
            .youngStarFraction,
        ).toBe(
          0.14565334290669152,
        );

        expect(
          middle
            .matureStarFraction,
        ).toBe(
          0.28207032309438057,
        );

        expect(
          middle
            .oldStarFraction,
        ).toBe(
          0.572276333998928,
        );

        expect(
          middle
            .stellarRemnantPropensity,
        ).toBe(
          0.5944385106858481,
        );

        expect(
          middle.regime,
        ).toBe(
          StellarPopulationRegime
            .QUIESCENT,
        );

        expect(
          outer
            .youngStarFraction,
        ).toBe(
          0.1535501052571561,
        );

        expect(
          outer
            .matureStarFraction,
        ).toBe(
          0.30439500963901767,
        );

        expect(
          outer
            .oldStarFraction,
        ).toBe(
          0.5420548851038263,
        );

        expect(
          outer
            .stellarRemnantPropensity,
        ).toBe(
          0.5648425336750389,
        );

        expect(
          central.oldStarFraction,
        ).toBeGreaterThan(
          middle.oldStarFraction,
        );

        expect(
          middle.oldStarFraction,
        ).toBeGreaterThan(
          outer.oldStarFraction,
        );

        expect(
          central
            .stellarRemnantPropensity,
        ).toBeGreaterThan(
          middle
            .stellarRemnantPropensity,
        );

        expect(
          middle
            .stellarRemnantPropensity,
        ).toBeGreaterThan(
          outer
            .stellarRemnantPropensity,
        );

        expect(
          central.youngStarFraction,
        ).toBeLessThan(
          middle.youngStarFraction,
        );

        expect(
          middle.youngStarFraction,
        ).toBeLessThan(
          outer.youngStarFraction,
        );
      },
    );

    it(
      'should preserve the non-zero young cohort floor when star formation rate is zero',
      () => {
        const profile =
          StellarPopulationProfileGenerator
            .generate(
              canonicalGenerationKey,
              physicalProperties(
                100_000_000_000n,
                0.0,
              ),
              sectorPopulation(
                10.0,
              ),
            );

        expect(
          profile
            .formationActivityIndex,
        ).toBe(
          0.0,
        );

        expect(
          profile
            .youngStarFraction,
        ).toBeGreaterThan(
          0.0,
        );

        expect(
          profile
            .highMassStarPropensity,
        ).toBe(
          0.01,
        );

        expect(
          profile.oldStarFraction,
        ).toBeGreaterThan(
          profile.youngStarFraction,
        );
      },
    );

    it(
      'should increase young and high-mass populations when star formation rate increases',
      () => {
        const low =
          StellarPopulationProfileGenerator
            .generate(
              canonicalGenerationKey,
              physicalProperties(
                100_000_000_000n,
                0.10,
              ),
              sectorPopulation(
                6.0,
              ),
            );

        const high =
          StellarPopulationProfileGenerator
            .generate(
              canonicalGenerationKey,
              physicalProperties(
                100_000_000_000n,
                4.0,
              ),
              sectorPopulation(
                6.0,
              ),
            );

        expect(
          high.formationActivityIndex,
        ).toBeGreaterThan(
          low.formationActivityIndex,
        );

        expect(
          high.youngStarFraction,
        ).toBeGreaterThan(
          low.youngStarFraction,
        );

        expect(
          high.highMassStarPropensity,
        ).toBeGreaterThan(
          low.highMassStarPropensity,
        );

        expect(
          high.oldStarFraction,
        ).toBeLessThan(
          low.oldStarFraction,
        );
      },
    );

    it(
      'should increase old low-mass and remnant populations as characteristic stellar age increases',
      () => {
        const props =
          physicalProperties(
            100_000_000_000n,
            0.10,
          );

        const young =
          StellarPopulationProfileGenerator
            .generate(
              canonicalGenerationKey,
              props,
              sectorPopulation(
                3.0,
              ),
            );

        const old =
          StellarPopulationProfileGenerator
            .generate(
              canonicalGenerationKey,
              props,
              sectorPopulation(
                11.0,
              ),
            );

        expect(
          old.oldStarFraction,
        ).toBeGreaterThan(
          young.oldStarFraction,
        );

        expect(
          old
            .stellarRemnantPropensity,
        ).toBeGreaterThan(
          young
            .stellarRemnantPropensity,
        );

        expect(
          old.lowMassStarPropensity,
        ).toBeGreaterThan(
          young.lowMassStarPropensity,
        );

        expect(
          old.youngStarFraction,
        ).toBeLessThan(
          young.youngStarFraction,
        );
      },
    );

    it(
      'should be independent of UniverseSeed when physical inputs are equal',
      () => {
        const otherKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const props =
          physicalProperties(
            100_000_000_000n,
            1.0,
          );

        const sector =
          sectorPopulation(
            6.0,
          );

        expect(
          StellarPopulationProfileGenerator
            .generate(
              otherKey,
              props,
              sector,
            ),
        ).toEqual(
          StellarPopulationProfileGenerator
            .generate(
              canonicalGenerationKey,
              props,
              sector,
            ),
        );
      },
    );

    it(
      'should ignore metallicity in the V1 stellar population calculation',
      () => {
        const propsA =
          physicalProperties(
            100_000_000_000n,
            1.0,
            0.1,
          );

        const propsB =
          physicalProperties(
            100_000_000_000n,
            1.0,
            2.0,
          );

        const first =
          StellarPopulationProfileGenerator
            .generate(
              canonicalGenerationKey,
              propsA,
              sectorPopulation(
                6.0,
                0.1,
              ),
            );

        const second =
          StellarPopulationProfileGenerator
            .generate(
              canonicalGenerationKey,
              propsB,
              sectorPopulation(
                6.0,
                2.0,
              ),
            );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should keep stellar age cohort fractions normalized across a deterministic matrix',
      () => {
        const props =
          physicalProperties(
            100_000_000_000n,
            1.0,
          );

        for (
          const age of
          [
            0.1,
            2.0,
            5.0,
            8.0,
            11.0,
            13.8,
            20.0,
          ]
        ) {
          const profile =
            StellarPopulationProfileGenerator
              .generate(
                canonicalGenerationKey,
                props,
                sectorPopulation(
                  age,
                ),
              );

          expect(
            profile
              .youngStarFraction +
            profile
              .matureStarFraction +
            profile
              .oldStarFraction,
          ).toBeCloseTo(
            1.0,
            12,
          );
        }
      },
    );

    it(
      'should reach all five stellar population regimes with synthetic inputs',
      () => {
        const cases = [
          {
            age:
              4.0,
            sfr:
              4.0,
            expected:
              StellarPopulationRegime
                .YOUNG_ACTIVE,
          },
          {
            age:
              10.0,
            sfr:
              1.5,
            expected:
              StellarPopulationRegime
                .ACTIVE,
          },
          {
            age:
              6.0,
            sfr:
              0.42857142857142855,
            expected:
              StellarPopulationRegime
                .MIXED,
          },
          {
            age:
              6.0,
            sfr:
              0.10,
            expected:
              StellarPopulationRegime
                .QUIESCENT,
          },
          {
            age:
              10.0,
            sfr:
              0.10,
            expected:
              StellarPopulationRegime
                .OLD_QUIESCENT,
          },
        ];

        for (
          const item of
          cases
        ) {
          const profile =
            StellarPopulationProfileGenerator
              .generate(
                canonicalGenerationKey,
                physicalProperties(
                  100_000_000_000n,
                  item.sfr,
                ),
                sectorPopulation(
                  item.age,
                ),
              );

          expect(
            profile.regime,
          ).toBe(
            item.expected,
          );
        }
      },
    );

    it(
      'should preserve all stellar population invariants across 512 deterministic combinations',
      () => {
        for (
          let index =
            0;
          index <
            512;
          index +=
            1
        ) {
          const age =
            0.1 +
            (
              index %
              32
            ) *
              0.45;

          const sfr =
            (
              Math.trunc(
                index /
                32,
              ) %
              16
            ) *
            0.25;

          const population =
            1_000_000_000n +
            BigInt(
              index %
              17,
            ) *
              10_000_000_000n;

          const profile =
            StellarPopulationProfileGenerator
              .generate(
                canonicalGenerationKey,
                physicalProperties(
                  population,
                  sfr,
                ),
                sectorPopulation(
                  age,
                  0.1 +
                    (
                      index %
                      23
                    ) *
                      0.1,
                ),
              );

          for (
            const value of
            [
              profile
                .formationActivityIndex,
              profile
                .youngStarFraction,
              profile
                .matureStarFraction,
              profile
                .oldStarFraction,
              profile
                .lowMassStarPropensity,
              profile
                .solarLikeStarPropensity,
              profile
                .highMassStarPropensity,
              profile
                .stellarRemnantPropensity,
            ]
          ) {
            expect(
              Number.isFinite(
                value,
              ),
            ).toBe(
              true,
            );

            expect(
              value,
            ).toBeGreaterThanOrEqual(
              0.0,
            );

            expect(
              value,
            ).toBeLessThanOrEqual(
              1.0,
            );
          }

          expect(
            profile
              .youngStarFraction +
            profile
              .matureStarFraction +
            profile
              .oldStarFraction,
          ).toBeCloseTo(
            1.0,
            12,
          );
        }
      },
    );

    it(
      'should reject unsupported generator versions',
      () => {
        const unsupportedGenerationKey =
          {
            universeSeed:
              canonicalSeed,

            generatorVersion: {
              code:
                999,
            },
          } as unknown as
            UniverseGenerationKey;

        expect(
          () =>
            StellarPopulationProfileGenerator
              .generate(
                unsupportedGenerationKey,
                physicalProperties(
                  100_000_000_000n,
                  1.0,
                ),
                sectorPopulation(
                  6.0,
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
