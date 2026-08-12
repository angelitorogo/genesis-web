import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalacticHabitabilityBand,
  GalacticHabitabilityModelStatus,
} from '../../domain/habitability/galactic-habitability-profile';

import {
  PlanetFormationProfile,
  PlanetFormationRegime,
} from '../../domain/planetary/planet-formation-profile';

import {
  type GalaxySectorStellarDensity,
} from '../../domain/sector/galaxy-sector-stellar-density';

import {
  StellarPopulationProfile,
  StellarPopulationRegime,
} from '../../domain/stellar/stellar-population-profile';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalacticHabitabilityProfileGenerator,
} from './galactic-habitability-profile-generator';

describe(
  'GalacticHabitabilityProfileGenerator',
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

    function density(
      relativeDensity:
        number,

      normalizedRadius =
        0.0,

      region =
        'CENTRAL',
    ): GalaxySectorStellarDensity {

      return {
        region,
        normalizedRadius,
        relativeDensity,
      } as unknown as
        GalaxySectorStellarDensity;
    }

    function planetProfile(
      overallPlanetFormationProbability:
        number,

      rockyPlanetFormationPropensity:
        number,
    ): PlanetFormationProfile {

      return new PlanetFormationProfile(
        1.0,
        0.75,
        overallPlanetFormationProbability,
        rockyPlanetFormationPropensity,
        0.60,
        0.50,
        PlanetFormationRegime.MIXED,
      );
    }

    function stellarProfile(
      lowMassStarPropensity:
        number,

      solarLikeStarPropensity:
        number,

      highMassStarPropensity:
        number,
    ): StellarPopulationProfile {

      return new StellarPopulationProfile(
        8.0,
        0.30,
        0.20,
        0.50,
        0.30,
        lowMassStarPropensity,
        solarLikeStarPropensity,
        highMassStarPropensity,
        0.40,
        StellarPopulationRegime.MIXED,
      );
    }

    const centralPlanetProfile =
      new PlanetFormationProfile(
        1.5250202653290195,
        0.9653228951781195,
        0.9581534239622153,
        0.9430033883168174,
        0.8627777320642518,
        0.8805233978599342,
        PlanetFormationRegime
          .GIANT_ENHANCED,
      );

    const middlePlanetProfile =
      planetProfile(
        0.9442549388763809,
        0.9384866654577039,
      );

    const outerPlanetProfile =
      planetProfile(
        0.9181804655977401,
        0.9298681360508244,
      );

    const centralStellarProfile =
      stellarProfile(
        0.8967627043074711,
        0.7372520522688744,
        0.027763025098852527,
      );

    const middleStellarProfile =
      stellarProfile(
        0.8901711167186981,
        0.7535113016545147,
        0.028245568408964444,
      );

    const outerStellarProfile =
      stellarProfile(
        0.8835795291299249,
        0.7697705510401551,
        0.02873144345555155,
      );

    it(
      'should reproduce the frozen V1 central Caeloria speculative habitability vector',
      () => {
        const profile =
          GalacticHabitabilityProfileGenerator
            .generate(
              canonicalGenerationKey,
              density(
                0.9541515810763022,
              ),
              centralPlanetProfile,
              centralStellarProfile,
            );

        expect(
          profile.modelStatus,
        ).toBe(
          GalacticHabitabilityModelStatus
            .SPECULATIVE_SIMPLIFIED,
        );

        expect(
          profile
            .planetFormationSupport,
        ).toBe(
          0.952850911486326,
        );

        expect(
          profile
            .stableHostStarSupport,
        ).toBe(
          0.8438514785385217,
        );

        expect(
          profile
            .stellarOpportunityIndex,
        ).toBe(
          0.97680682894639,
        );

        expect(
          profile
            .crowdingHazard,
        ).toBe(
          0.9386062791939198,
        );

        expect(
          profile
            .massiveStarHazard,
        ).toBe(
          0.01133270234558178,
        );

        expect(
          profile
            .environmentalSafety,
        ).toBe(
          0.2468484361757478,
        );

        expect(
          profile
            .habitabilityPotential,
        ).toBe(
          0.34176296454478616,
        );

        expect(
          profile.band,
        ).toBe(
          GalacticHabitabilityBand
            .MARGINAL,
        );
      },
    );

    it(
      'should preserve Caeloria middle and outer vectors and favor the middle balance',
      () => {
        const central =
          GalacticHabitabilityProfileGenerator
            .generate(
              canonicalGenerationKey,
              density(
                0.9541515810763022,
              ),
              centralPlanetProfile,
              centralStellarProfile,
            );

        const middle =
          GalacticHabitabilityProfileGenerator
            .generate(
              canonicalGenerationKey,
              density(
                0.38792908365914686,
                0.5,
                'MIDDLE',
              ),
              middlePlanetProfile,
              middleStellarProfile,
            );

        const outer =
          GalacticHabitabilityProfileGenerator
            .generate(
              canonicalGenerationKey,
              density(
                0.15772019554678174,
                1.0,
                'OUTER',
              ),
              outerPlanetProfile,
              outerStellarProfile,
            );

        expect(
          middle
            .planetFormationSupport,
        ).toBe(
          0.942236043179844,
        );

        expect(
          middle
            .stableHostStarSupport,
        ).toBe(
          0.8490700286578999,
        );

        expect(
          middle
            .stellarOpportunityIndex,
        ).toBe(
          0.6228395328326124,
        );

        expect(
          middle
            .crowdingHazard,
        ).toBe(
          0.2784938825161086,
        );

        expect(
          middle
            .massiveStarHazard,
        ).toBe(
          0.01157944911335693,
        );

        expect(
          middle
            .environmentalSafety,
        ).toBe(
          0.7748890041644417,
        );

        expect(
          middle
            .habitabilityPotential,
        ).toBe(
          0.41415943306771347,
        );

        expect(
          middle.band,
        ).toBe(
          GalacticHabitabilityBand
            .FAVORED,
        );

        expect(
          outer
            .planetFormationSupport,
        ).toBe(
          0.9222711502563196,
        );

        expect(
          outer
            .stableHostStarSupport,
        ).toBe(
          0.8542877458431594,
        );

        expect(
          outer
            .stellarOpportunityIndex,
        ).toBe(
          0.3971400200770274,
        );

        expect(
          outer
            .crowdingHazard,
        ).toBe(
          0.08263192386215874,
        );

        expect(
          outer
            .massiveStarHazard,
        ).toBe(
          0.011828966630178489,
        );

        expect(
          outer
            .environmentalSafety,
        ).toBe(
          0.9315286675842374,
        );

        expect(
          outer
            .habitabilityPotential,
        ).toBe(
          0.29683209880012434,
        );

        expect(
          outer.band,
        ).toBe(
          GalacticHabitabilityBand
            .MARGINAL,
        );

        expect(
          middle
            .habitabilityPotential,
        ).toBeGreaterThan(
          central
            .habitabilityPotential,
        );

        expect(
          middle
            .habitabilityPotential,
        ).toBeGreaterThan(
          outer
            .habitabilityPotential,
        );
      },
    );

    it(
      'should produce zero opportunity and zero potential when stellar density is zero',
      () => {
        const profile =
          GalacticHabitabilityProfileGenerator
            .generate(
              canonicalGenerationKey,
              density(
                0.0,
              ),
              planetProfile(
                1.0,
                1.0,
              ),
              stellarProfile(
                1.0,
                1.0,
                0.0,
              ),
            );

        expect(
          profile
            .stellarOpportunityIndex,
        ).toBe(
          0.0,
        );

        expect(
          profile
            .crowdingHazard,
        ).toBe(
          0.0,
        );

        expect(
          profile
            .habitabilityPotential,
        ).toBe(
          0.0,
        );

        expect(
          profile.band,
        ).toBe(
          GalacticHabitabilityBand
            .LOW_POTENTIAL,
        );
      },
    );

    it(
      'should penalize extreme stellar crowding relative to moderate density',
      () => {
        const planets =
          planetProfile(
            1.0,
            1.0,
          );

        const stars =
          stellarProfile(
            1.0,
            1.0,
            0.0,
          );

        const moderate =
          GalacticHabitabilityProfileGenerator
            .generate(
              canonicalGenerationKey,
              density(
                0.50,
              ),
              planets,
              stars,
            );

        const extreme =
          GalacticHabitabilityProfileGenerator
            .generate(
              canonicalGenerationKey,
              density(
                1.0,
              ),
              planets,
              stars,
            );

        expect(
          extreme.crowdingHazard,
        ).toBeGreaterThan(
          moderate.crowdingHazard,
        );

        expect(
          extreme
            .environmentalSafety,
        ).toBeLessThan(
          moderate
            .environmentalSafety,
        );

        expect(
          moderate
            .habitabilityPotential,
        ).toBeGreaterThan(
          extreme
            .habitabilityPotential,
        );
      },
    );

    it(
      'should increase final potential when planet formation support improves',
      () => {
        const stars =
          stellarProfile(
            0.9,
            0.9,
            0.05,
          );

        const low =
          GalacticHabitabilityProfileGenerator
            .generate(
              canonicalGenerationKey,
              density(
                0.40,
              ),
              planetProfile(
                0.30,
                0.30,
              ),
              stars,
            );

        const high =
          GalacticHabitabilityProfileGenerator
            .generate(
              canonicalGenerationKey,
              density(
                0.40,
              ),
              planetProfile(
                1.0,
                1.0,
              ),
              stars,
            );

        expect(
          high
            .planetFormationSupport,
        ).toBeGreaterThan(
          low
            .planetFormationSupport,
        );

        expect(
          high
            .habitabilityPotential,
        ).toBeGreaterThan(
          low
            .habitabilityPotential,
        );
      },
    );

    it(
      'should penalize a high massive-star population',
      () => {
        const planets =
          planetProfile(
            0.9,
            0.9,
          );

        const lowHazard =
          GalacticHabitabilityProfileGenerator
            .generate(
              canonicalGenerationKey,
              density(
                0.35,
              ),
              planets,
              stellarProfile(
                0.9,
                0.9,
                0.05,
              ),
            );

        const highHazard =
          GalacticHabitabilityProfileGenerator
            .generate(
              canonicalGenerationKey,
              density(
                0.35,
              ),
              planets,
              stellarProfile(
                0.9,
                0.9,
                0.90,
              ),
            );

        expect(
          highHazard
            .massiveStarHazard,
        ).toBeGreaterThan(
          lowHazard
            .massiveStarHazard,
        );

        expect(
          highHazard
            .environmentalSafety,
        ).toBeLessThan(
          lowHazard
            .environmentalSafety,
        );

        expect(
          highHazard
            .habitabilityPotential,
        ).toBeLessThan(
          lowHazard
            .habitabilityPotential,
        );
      },
    );

    it(
      'should reach all four speculative habitability bands with deterministic inputs',
      () => {
        const planets =
          planetProfile(
            1.0,
            1.0,
          );

        const stars =
          stellarProfile(
            1.0,
            1.0,
            0.0,
          );

        const cases = [
          {
            relativeDensity:
              0.01,
            expected:
              GalacticHabitabilityBand
                .LOW_POTENTIAL,
          },
          {
            relativeDensity:
              0.05,
            expected:
              GalacticHabitabilityBand
                .MARGINAL,
          },
          {
            relativeDensity:
              0.15,
            expected:
              GalacticHabitabilityBand
                .FAVORED,
          },
          {
            relativeDensity:
              0.40,
            expected:
              GalacticHabitabilityBand
                .HIGH_POTENTIAL,
          },
        ];

        for (
          const item of
          cases
        ) {
          const profile =
            GalacticHabitabilityProfileGenerator
              .generate(
                canonicalGenerationKey,
                density(
                  item.relativeDensity,
                ),
                planets,
                stars,
              );

          expect(
            profile.band,
          ).toBe(
            item.expected,
          );
        }
      },
    );

    it(
      'should not use GalaxyRegion or normalizedRadius directly',
      () => {
        const planets =
          planetProfile(
            0.8,
            0.9,
          );

        const stars =
          stellarProfile(
            0.8,
            0.8,
            0.1,
          );

        const first =
          GalacticHabitabilityProfileGenerator
            .generate(
              canonicalGenerationKey,
              density(
                0.35,
                0.10,
                'CENTRAL',
              ),
              planets,
              stars,
            );

        const second =
          GalacticHabitabilityProfileGenerator
            .generate(
              canonicalGenerationKey,
              density(
                0.35,
                0.95,
                'OUTER',
              ),
              planets,
              stars,
            );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should preserve all normalized contracts and speculative status across 576 deterministic combinations',
      () => {
        for (
          let densityIndex =
            0;
          densityIndex <
            24;
          densityIndex +=
            1
        ) {
          for (
            let profileIndex =
              0;
            profileIndex <
              24;
            profileIndex +=
              1
          ) {
            const densityT =
              densityIndex /
              23;

            const profileT =
              profileIndex /
              23;

            const profile =
              GalacticHabitabilityProfileGenerator
                .generate(
                  canonicalGenerationKey,
                  density(
                    densityT,
                    profileT,
                    profileIndex %
                      2 ===
                        0
                      ? 'INNER'
                      : 'OUTER',
                  ),
                  planetProfile(
                    0.20 +
                      0.80 *
                        profileT,
                    0.25 +
                      0.75 *
                        profileT,
                  ),
                  stellarProfile(
                    0.95 -
                      0.25 *
                        profileT,
                    0.85 -
                      0.30 *
                        profileT,
                    0.05 +
                      0.85 *
                        profileT,
                  ),
                );

            expect(
              profile.modelStatus,
            ).toBe(
              GalacticHabitabilityModelStatus
                .SPECULATIVE_SIMPLIFIED,
            );

            for (
              const value of
              [
                profile
                  .planetFormationSupport,
                profile
                  .stableHostStarSupport,
                profile
                  .stellarOpportunityIndex,
                profile
                  .crowdingHazard,
                profile
                  .massiveStarHazard,
                profile
                  .environmentalSafety,
                profile
                  .habitabilityPotential,
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
          }
        }
      },
    );

    it(
      'should be independent of UniverseSeed when physical inputs are equal',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const sectorDensity =
          density(
            0.35,
          );

        const planets =
          planetProfile(
            0.8,
            0.9,
          );

        const stars =
          stellarProfile(
            0.8,
            0.8,
            0.1,
          );

        expect(
          GalacticHabitabilityProfileGenerator
            .generate(
              otherGenerationKey,
              sectorDensity,
              planets,
              stars,
            ),
        ).toEqual(
          GalacticHabitabilityProfileGenerator
            .generate(
              canonicalGenerationKey,
              sectorDensity,
              planets,
              stars,
            ),
        );
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
            GalacticHabitabilityProfileGenerator
              .generate(
                unsupportedGenerationKey,
                density(
                  0.35,
                ),
                planetProfile(
                  0.8,
                  0.9,
                ),
                stellarProfile(
                  0.8,
                  0.8,
                  0.1,
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);