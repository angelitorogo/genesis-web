import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type Galaxy,
} from '../../domain/universe/galaxy';

import {
  GalacticNucleus,
} from '../../domain/universe/galactic-nucleus';

import {
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  SupermassiveBlackHole,
} from '../../domain/universe/supermassive-black-hole';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalacticNuclearActivityEventKind,
  GalacticNuclearActivityRarity,
} from '../../domain/nuclear/galactic-nuclear-activity-profile';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  GalacticNuclearActivityProfileGenerator,
} from './galactic-nuclear-activity-profile-generator';

describe(
  'GalacticNuclearActivityProfileGenerator',
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

    function withNucleus(
      galaxy:
        Galaxy,

      nucleus:
        GalacticNucleus | null,
    ): Galaxy {

      return {
        ...galaxy,
        nucleus,
      } as Galaxy;
    }

    it(
      'should reproduce the frozen V1 Caeloria nuclear activity vector',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            0n,
          );

        const profile =
          GalacticNuclearActivityProfileGenerator
            .generate(
              galaxy,
            );

        expect(
          profile.nucleusState,
        ).toBe(
          GalacticNucleusState.QUIESCENT,
        );

        expect(
          profile.eventKind,
        ).toBe(
          GalacticNuclearActivityEventKind.NONE,
        );

        expect(
          profile.rarity,
        ).toBe(
          GalacticNuclearActivityRarity.BASELINE,
        );

        expect(
          profile
            .supermassiveBlackHoleMassSolarMasses,
        ).toBe(
          1.3908163761111212e8,
        );

        expect(
          profile.hasNucleus,
        ).toBe(
          true,
        );

        expect(
          profile.hasSupermassiveBlackHole,
        ).toBe(
          true,
        );

        expect(
          profile.isActiveEpisode,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should map a galaxy without a nucleus to a baseline non-event',
      () => {
        const base =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            0n,
          );

        const profile =
          GalacticNuclearActivityProfileGenerator
            .generate(
              withNucleus(
                base,
                null,
              ),
            );

        expect(
          profile.nucleusState,
        ).toBeNull();

        expect(
          profile.eventKind,
        ).toBe(
          GalacticNuclearActivityEventKind.NONE,
        );

        expect(
          profile.rarity,
        ).toBe(
          GalacticNuclearActivityRarity.BASELINE,
        );

        expect(
          profile
            .supermassiveBlackHoleMassSolarMasses,
        ).toBeNull();

        expect(
          profile.hasNucleus,
        ).toBe(
          false,
        );

        expect(
          profile.hasSupermassiveBlackHole,
        ).toBe(
          false,
        );

        expect(
          profile.isActiveEpisode,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should keep a quiescent nucleus without SMBH as a baseline non-event',
      () => {
        const base =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            0n,
          );

        const profile =
          GalacticNuclearActivityProfileGenerator
            .generate(
              withNucleus(
                base,
                new GalacticNucleus(
                  GalacticNucleusState.QUIESCENT,
                  null,
                ),
              ),
            );

        expect(
          profile.nucleusState,
        ).toBe(
          GalacticNucleusState.QUIESCENT,
        );

        expect(
          profile.eventKind,
        ).toBe(
          GalacticNuclearActivityEventKind.NONE,
        );

        expect(
          profile.rarity,
        ).toBe(
          GalacticNuclearActivityRarity.BASELINE,
        );

        expect(
          profile
            .supermassiveBlackHoleMassSolarMasses,
        ).toBeNull();

        expect(
          profile.isActiveEpisode,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should map AGN to a rare active episode',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            20n,
          );

        expect(
          galaxy.nucleus
            ?.state,
        ).toBe(
          GalacticNucleusState.AGN,
        );

        const profile =
          GalacticNuclearActivityProfileGenerator
            .generate(
              galaxy,
            );

        expect(
          profile.eventKind,
        ).toBe(
          GalacticNuclearActivityEventKind.AGN_EPISODE,
        );

        expect(
          profile.rarity,
        ).toBe(
          GalacticNuclearActivityRarity.RARE,
        );

        expect(
          profile.hasSupermassiveBlackHole,
        ).toBe(
          true,
        );

        expect(
          profile.isActiveEpisode,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should map QUASAR to an extremely rare active episode',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            331n,
          );

        expect(
          galaxy.nucleus
            ?.state,
        ).toBe(
          GalacticNucleusState.QUASAR,
        );

        const profile =
          GalacticNuclearActivityProfileGenerator
            .generate(
              galaxy,
            );

        expect(
          profile.eventKind,
        ).toBe(
          GalacticNuclearActivityEventKind.QUASAR_EPISODE,
        );

        expect(
          profile.rarity,
        ).toBe(
          GalacticNuclearActivityRarity.EXTREMELY_RARE,
        );

        expect(
          profile.hasSupermassiveBlackHole,
        ).toBe(
          true,
        );

        expect(
          profile.isActiveEpisode,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should always return the same profile for the same galaxy',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            20n,
          );

        expect(
          GalacticNuclearActivityProfileGenerator
            .generate(
              galaxy,
            ),
        ).toEqual(
          GalacticNuclearActivityProfileGenerator
            .generate(
              galaxy,
            ),
        );
      },
    );

    it(
      'should remain independent of nuclear activity query order',
      () => {
        const target =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            331n,
          );

        const expected =
          GalacticNuclearActivityProfileGenerator
            .generate(
              target,
            );

        for (
          const index of
          [
            0n,
            1n,
            20n,
            42n,
            100n,
            1000n,
          ]
        ) {
          GalacticNuclearActivityProfileGenerator
            .generate(
              GalaxyGenerator.generate(
                canonicalGenerationKey,
                index,
              ),
            );
        }

        expect(
          GalacticNuclearActivityProfileGenerator
            .generate(
              target,
            ),
        ).toEqual(
          expected,
        );
      },
    );

    it(
      'should preserve the frozen rarity distribution across galaxy sample 0..4095',
      () => {
        let noNucleusCount =
          0;

        let quiescentCount =
          0;

        let agnCount =
          0;

        let quasarCount =
          0;

        for (
          let index =
            0n;
          index <
            4096n;
          index +=
            1n
        ) {
          const galaxy =
            GalaxyGenerator.generate(
              canonicalGenerationKey,
              index,
            );

          const profile =
            GalacticNuclearActivityProfileGenerator
              .generate(
                galaxy,
              );

          if (
            profile.nucleusState ===
            null
          ) {
            noNucleusCount +=
              1;
          } else if (
            profile.nucleusState ===
            GalacticNucleusState.QUIESCENT
          ) {
            quiescentCount +=
              1;
          } else if (
            profile.nucleusState ===
            GalacticNucleusState.AGN
          ) {
            agnCount +=
              1;
          } else if (
            profile.nucleusState ===
            GalacticNucleusState.QUASAR
          ) {
            quasarCount +=
              1;
          }

          expect(
            galaxy.nucleus,
          ).not.toBeNull();

          if (
            galaxy.type ===
              GalaxyType.DWARF ||
            galaxy.type ===
              GalaxyType.IRREGULAR
          ) {
            expect(
              galaxy.nucleus
                ?.state,
            ).not.toBe(
              GalacticNucleusState.QUASAR,
            );
          }

          if (
            profile.isActiveEpisode
          ) {
            expect(
              profile.hasSupermassiveBlackHole,
            ).toBe(
              true,
            );
          }
        }

        const activeCount =
          agnCount +
          quasarCount;

        const activeFraction =
          activeCount /
          4096;

        const quasarFraction =
          quasarCount /
          4096;

        expect(
          noNucleusCount,
        ).toBe(
          0,
        );

        expect(
          quiescentCount,
        ).toBe(
          3822,
        );

        /*
         * DWARF/IRREGULAR QUASAR slices are folded into AGN, so only the
         * active total remains the frozen incidence contract.
         */
        expect(
          agnCount +
          quasarCount,
        ).toBe(
          274,
        );

        expect(
          quasarCount,
        ).toBeLessThanOrEqual(
          13,
        );

        expect(
          activeCount,
        ).toBe(
          274,
        );

        expect(
          activeFraction,
        ).toBe(
          0.06689453125,
        );

        expect(
          quasarFraction,
        ).toBe(
          0.003173828125,
        );

        expect(
          activeFraction,
        ).toBeLessThan(
          0.15,
        );

        expect(
          quasarFraction,
        ).toBeLessThan(
          0.02,
        );

        expect(
          quasarCount,
        ).toBeLessThan(
          agnCount,
        );

        expect(
          noNucleusCount +
          quiescentCount,
        ).toBeGreaterThan(
          activeCount,
        );
      },
      30_000,
    );

    it(
      'should map event and rarity directly from nuclear Ground Truth across a deterministic sample',
      () => {
        for (
          let index =
            0n;
          index <
            1024n;
          index +=
            1n
        ) {
          const galaxy =
            GalaxyGenerator.generate(
              canonicalGenerationKey,
              index,
            );

          const profile =
            GalacticNuclearActivityProfileGenerator
              .generate(
                galaxy,
              );

          const state =
            galaxy.nucleus
              ?.state ??
            null;

          if (
            state ===
            null ||
            state ===
              GalacticNucleusState.QUIESCENT
          ) {
            expect(
              profile.eventKind,
            ).toBe(
              GalacticNuclearActivityEventKind.NONE,
            );

            expect(
              profile.rarity,
            ).toBe(
              GalacticNuclearActivityRarity.BASELINE,
            );
          } else if (
            state ===
            GalacticNucleusState.AGN
          ) {
            expect(
              profile.eventKind,
            ).toBe(
              GalacticNuclearActivityEventKind.AGN_EPISODE,
            );

            expect(
              profile.rarity,
            ).toBe(
              GalacticNuclearActivityRarity.RARE,
            );
          } else {
            expect(
              state,
            ).toBe(
              GalacticNucleusState.QUASAR,
            );

            expect(
              profile.eventKind,
            ).toBe(
              GalacticNuclearActivityEventKind.QUASAR_EPISODE,
            );

            expect(
              profile.rarity,
            ).toBe(
              GalacticNuclearActivityRarity.EXTREMELY_RARE,
            );
          }
        }
      },
    );

    it(
      'should not perturb physical galaxy generation',
      () => {
        const before =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            331n,
          );

        GalacticNuclearActivityProfileGenerator
          .generate(
            before,
          );

        const after =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            331n,
          );

        expect(
          after,
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should reject unsupported generator versions',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            0n,
          );

        const unsupportedGalaxy =
          {
            ...galaxy,
            generationKey: {
              universeSeed:
                canonicalSeed,
              generatorVersion: {
                code:
                  999,
              },
            },
          } as unknown as
            Galaxy;

        expect(
          () =>
            GalacticNuclearActivityProfileGenerator
              .generate(
                unsupportedGalaxy,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
