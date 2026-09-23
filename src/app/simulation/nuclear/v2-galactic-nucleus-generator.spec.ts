import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  V2GalacticNucleusGenerator,
  V2_LARGE_IRREGULAR_MIN_DIAMETER_LIGHT_YEARS,
} from './v2-galactic-nucleus-generator';

describe(
  'V2GalacticNucleusGenerator',
  () => {
    const seed =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    const v1 =
      new UniverseGenerationKey(
        seed,
        GeneratorVersion.V1,
      );

    const v2 =
      new UniverseGenerationKey(
        seed.copy(),
        GeneratorVersion.V2,
      );

    it(
      'should expose the exact requested distributions for every morphology and irregular size family',
      () => {
        for (
          const type of [
            GalaxyType.SPIRAL,
            GalaxyType.BARRED_SPIRAL,
            GalaxyType.ELLIPTICAL,
          ]
        ) {
          expect(
            V2GalacticNucleusGenerator.distributionFor(
              type,
              100_000,
            ),
          ).toEqual({
            blackHoleProbability:
              0.70,
            quasarProbability:
              0.25,
            quiescentProbability:
              0.05,
          });
        }

        expect(
          V2GalacticNucleusGenerator.distributionFor(
            GalaxyType.IRREGULAR,
            V2_LARGE_IRREGULAR_MIN_DIAMETER_LIGHT_YEARS -
              1,
          ),
        ).toEqual({
          blackHoleProbability:
            0,
          quasarProbability:
            0,
          quiescentProbability:
            1,
        });

        expect(
          V2GalacticNucleusGenerator.distributionFor(
            GalaxyType.IRREGULAR,
            V2_LARGE_IRREGULAR_MIN_DIAMETER_LIGHT_YEARS,
          ),
        ).toEqual({
          blackHoleProbability:
            0.80,
          quasarProbability:
            0.20,
          quiescentProbability:
            0,
        });

        expect(
          V2GalacticNucleusGenerator.distributionFor(
            GalaxyType.DWARF,
            10_000,
          ),
        ).toEqual({
          blackHoleProbability:
            0.04,
          quasarProbability:
            0.01,
          quiescentProbability:
            0.95,
        });
      },
    );

    it(
      'should use inclusive deterministic boundaries without probability gaps or overlaps',
      () => {
        const state =
          (
            type:
              GalaxyType,
            diameter:
              number,
            roll:
              number,
          ) =>
            V2GalacticNucleusGenerator.stateForRoll(
              type,
              diameter,
              roll,
            );

        expect(
          state(
            GalaxyType.SPIRAL,
            100_000,
            0.70 -
              Number.EPSILON,
          ),
        ).toBe(
          GalacticNucleusState.AGN,
        );
        expect(
          state(
            GalaxyType.SPIRAL,
            100_000,
            0.70,
          ),
        ).toBe(
          GalacticNucleusState.QUASAR,
        );
        expect(
          state(
            GalaxyType.SPIRAL,
            100_000,
            0.95,
          ),
        ).toBe(
          GalacticNucleusState.QUIESCENT,
        );

        expect(
          state(
            GalaxyType.IRREGULAR,
            29_999,
            0,
          ),
        ).toBe(
          GalacticNucleusState.QUIESCENT,
        );
        expect(
          state(
            GalaxyType.IRREGULAR,
            30_000,
            0.80,
          ),
        ).toBe(
          GalacticNucleusState.QUASAR,
        );

        expect(
          state(
            GalaxyType.DWARF,
            10_000,
            0.04 -
              Number.EPSILON,
          ),
        ).toBe(
          GalacticNucleusState.AGN,
        );
        expect(
          state(
            GalaxyType.DWARF,
            10_000,
            0.04,
          ),
        ).toBe(
          GalacticNucleusState.QUASAR,
        );
        expect(
          state(
            GalaxyType.DWARF,
            10_000,
            0.05,
          ),
        ).toBe(
          GalacticNucleusState.QUIESCENT,
        );
      },
    );

    it(
      'should reproduce the exact percentages across an evenly spaced canonical roll grid',
      () => {
        expect(
          countStates(
            GalaxyType.BARRED_SPIRAL,
            100_000,
          ),
        ).toEqual({
          AGN:
            70,
          QUASAR:
            25,
          QUIESCENT:
            5,
        });

        expect(
          countStates(
            GalaxyType.IRREGULAR,
            30_000,
          ),
        ).toEqual({
          AGN:
            80,
          QUASAR:
            20,
          QUIESCENT:
            0,
        });

        expect(
          countStates(
            GalaxyType.IRREGULAR,
            29_999,
          ),
        ).toEqual({
          AGN:
            0,
          QUASAR:
            0,
          QUIESCENT:
            100,
        });

        expect(
          countStates(
            GalaxyType.DWARF,
            10_000,
          ),
        ).toEqual({
          AGN:
            4,
          QUASAR:
            1,
          QUIESCENT:
            95,
        });
      },
    );

    it(
      'should integrate the V2 branch without changing frozen V1 morphology or baseline magnitudes',
      () => {
        let dwarfQuasarFound =
          false;
        let largeIrregularQuasarFound =
          false;

        for (
          let index =
            0n;
          index <
            4_096n;
          index +=
            1n
        ) {
          const legacy =
            GalaxyGenerator.generate(
              v1,
              index,
            );
          const current =
            GalaxyGenerator.generate(
              v2,
              index,
            );

          expect(
            current.type,
          ).toBe(
            legacy.type,
          );
          expect(
            current.physicalProperties,
          ).toEqual(
            legacy.physicalProperties,
          );
          expect(
            current.nucleus,
          ).toEqual(
            V2GalacticNucleusGenerator.generate(
              legacy,
            ),
          );
          expect(
            GalaxyGenerator.generate(
              v1,
              index,
            ),
          ).toEqual(
            legacy,
          );

          const state =
            current.nucleus
              ?.state;
          const blackHole =
            current.nucleus
              ?.supermassiveBlackHole ??
            null;

          expect(
            current.nucleus,
          ).not.toBeNull();

          if (
            state ===
            GalacticNucleusState.QUIESCENT
          ) {
            expect(
              blackHole,
            ).toBeNull();
          } else {
            expect(
              blackHole,
            ).not.toBeNull();
            expect(
              blackHole
                ?.massSolarMasses,
            ).toBeLessThanOrEqual(
              current.physicalProperties.totalMassSolarMasses *
                0.01,
            );
          }

          if (
            current.type ===
              GalaxyType.IRREGULAR
          ) {
            const isLarge =
              current.physicalProperties.diameterLightYears >=
              V2_LARGE_IRREGULAR_MIN_DIAMETER_LIGHT_YEARS;

            if (
              isLarge
            ) {
              expect(
                state,
              ).not.toBe(
                GalacticNucleusState.QUIESCENT,
              );
              largeIrregularQuasarFound ||=
                state ===
                GalacticNucleusState.QUASAR;
            } else {
              expect(
                state,
              ).toBe(
                GalacticNucleusState.QUIESCENT,
              );
            }
          }

          dwarfQuasarFound ||=
            current.type ===
              GalaxyType.DWARF &&
            state ===
              GalacticNucleusState.QUASAR;
        }

        expect(
          dwarfQuasarFound,
        ).toBe(
          true,
        );
        expect(
          largeIrregularQuasarFound,
        ).toBe(
          true,
        );
      },
      30_000,
    );

    it(
      'should reject invalid policy inputs instead of silently coercing them',
      () => {
        for (
          const invalidRoll of [
            -Number.EPSILON,
            1,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              V2GalacticNucleusGenerator.stateForRoll(
                GalaxyType.SPIRAL,
                100_000,
                invalidRoll,
              ),
          ).toThrow(
            RangeError,
          );
        }

        expect(
          () =>
            V2GalacticNucleusGenerator.distributionFor(
              GalaxyType.SPIRAL,
              0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function countStates(
  galaxyType:
    GalaxyType,

  diameterLightYears:
    number,
): Readonly<Record<'AGN' | 'QUASAR' | 'QUIESCENT', number>> {

  const counts = {
    AGN:
      0,
    QUASAR:
      0,
    QUIESCENT:
      0,
  };

  for (
    let index =
      0;
    index <
      100;
    index +=
      1
  ) {
    const state =
      V2GalacticNucleusGenerator.stateForRoll(
        galaxyType,
        diameterLightYears,
        (
          index +
          0.5
        ) /
          100,
      );

    counts[
      state.name
    ] +=
      1;
  }

  return Object.freeze(
    counts,
  );
}
