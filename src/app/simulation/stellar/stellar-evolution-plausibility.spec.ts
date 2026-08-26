import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type StellarEvolutionAssessment,
} from '../../domain/stellar/stellar-evolution-assessment';

import {
  StellarEvolutionInput,
} from '../../domain/stellar/stellar-evolution-input';

import {
  StellarEvolutionState,
} from '../../domain/stellar/stellar-evolution-state';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  StellarEvolutionEngine,
} from './stellar-evolution-engine';

/**
 * Point-14.9 broad plausibility validation for the frozen V1 isolated-star
 * evolution model introduced in 14.8.
 *
 * This suite intentionally adds no second evolution model and no new runtime
 * state. It exercises independent physical-ordering invariants over broad
 * mass/metallicity/age grids so future changes cannot silently create negative
 * lifetimes, backwards evolution or mutually incompatible stellar states.
 */
describe(
  'point-14.9 stellar-evolution plausibility',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const metallicities = [
      0.01,
      0.10,
      1.0,
      3.0,
    ] as const;

    it(
      'should keep hydrogen-burning lifetimes finite, positive and shorter for progressively more massive stars at fixed metallicity',
      () => {
        const masses = [
          0.10,
          0.20,
          0.50,
          0.80,
          1.00,
          2.00,
          5.00,
          10.0,
          20.0,
          40.0,
          80.0,
          150.0,
        ] as const;

        for (
          const metallicity of
            metallicities
        ) {
          let previousLifetime =
            Number.POSITIVE_INFINITY;

          for (
            const mass of
              masses
          ) {
            const assessment =
              evaluate(
                generationKey,
                mass,
                metallicity,
                0,
              );

            const lifetime =
              requireLifetime(
                assessment,
              );

            expect(
              Number.isFinite(
                lifetime,
              ),
            ).toBe(
              true,
            );

            expect(
              lifetime,
            ).toBeGreaterThan(
              0,
            );

            expect(
              lifetime,
            ).toBeLessThan(
              previousLifetime,
            );

            previousLifetime =
              lifetime;
          }
        }
      },
    );

    it(
      'should keep representative V1 lifetimes in plausible orders of magnitude from long-lived red dwarfs to massive stars',
      () => {
        const redDwarfLifetime =
          requireLifetime(
            evaluate(
              generationKey,
              0.10,
              1.0,
              0,
            ),
          );

        const solarLifetime =
          requireLifetime(
            evaluate(
              generationKey,
              1.0,
              1.0,
              0,
            ),
          );

        const tenSolarLifetime =
          requireLifetime(
            evaluate(
              generationKey,
              10.0,
              1.0,
              0,
            ),
          );

        const sixtySolarLifetime =
          requireLifetime(
            evaluate(
              generationKey,
              60.0,
              1.0,
              0,
            ),
          );

        expect(
          redDwarfLifetime,
        ).toBeGreaterThan(
          1_000,
        );

        expect(
          solarLifetime,
        ).toBeGreaterThanOrEqual(
          8.0,
        );

        expect(
          solarLifetime,
        ).toBeLessThanOrEqual(
          11.0,
        );

        expect(
          tenSolarLifetime,
        ).toBeGreaterThan(
          0.020,
        );

        expect(
          tenSolarLifetime,
        ).toBeLessThan(
          0.050,
        );

        expect(
          sixtySolarLifetime,
        ).toBeGreaterThan(
          0.001,
        );

        expect(
          sixtySolarLifetime,
        ).toBeLessThan(
          0.005,
        );
      },
    );

    it(
      'should preserve the V1 metallicity ordering of main-sequence lifetime at fixed mass',
      () => {
        const masses = [
          0.10,
          1.0,
          10.0,
          60.0,
        ] as const;

        for (
          const mass of
            masses
        ) {
          let previousLifetime =
            0;

          for (
            const metallicity of
              metallicities
          ) {
            const lifetime =
              requireLifetime(
                evaluate(
                  generationKey,
                  mass,
                  metallicity,
                  0,
                ),
              );

            expect(
              lifetime,
            ).toBeGreaterThan(
              previousLifetime,
            );

            previousLifetime =
              lifetime;
          }
        }
      },
    );

    it(
      'should cross low/intermediate-mass lifecycle boundaries in chronological order and terminate as white dwarfs',
      () => {
        const masses = [
          0.80,
          1.00,
          3.00,
          6.50,
        ] as const;

        for (
          const metallicity of
            metallicities
        ) {
          for (
            const mass of
              masses
          ) {
            const zeroAge =
              evaluate(
                generationKey,
                mass,
                metallicity,
                0,
              );

            const mainLifetime =
              requireLifetime(
                zeroAge,
              );

            const postDuration =
              requirePostDuration(
                zeroAge,
              );

            const terminalAge =
              mainLifetime +
              postDuration;

            expect(
              evaluate(
                generationKey,
                mass,
                metallicity,
                mainLifetime *
                  0.999_999,
              ).evolutionState,
            ).toBe(
              StellarEvolutionState.MAIN_SEQUENCE,
            );

            const firstPostMain =
              evaluate(
                generationKey,
                mass,
                metallicity,
                mainLifetime,
              );

            expect(
              firstPostMain.evolutionState,
            ).toBe(
              StellarEvolutionState.GIANT,
            );

            expect(
              firstPostMain.postMainSequenceStage,
            ).not.toBeNull();

            expect(
              evaluate(
                generationKey,
                mass,
                metallicity,
                terminalAge -
                  postDuration *
                    0.000_001,
              ).evolutionState,
            ).toBe(
              StellarEvolutionState.GIANT,
            );

            const remnant =
              evaluate(
                generationKey,
                mass,
                metallicity,
                terminalAge,
              );

            expect(
              remnant.evolutionState,
            ).toBe(
              StellarEvolutionState.WHITE_DWARF,
            );

            expect(
              remnant.whiteDwarfComposition,
            ).not.toBeNull();
          }
        }
      },
    );

    it(
      'should cross massive-star lifecycle boundaries through SUPERGIANT and terminate only as neutron stars or stellar black holes',
      () => {
        const masses = [
          9.0,
          12.0,
          20.0,
          30.0,
          60.0,
          120.0,
        ] as const;

        for (
          const metallicity of
            metallicities
        ) {
          for (
            const mass of
              masses
          ) {
            const zeroAge =
              evaluate(
                generationKey,
                mass,
                metallicity,
                0,
              );

            const mainLifetime =
              requireLifetime(
                zeroAge,
              );

            const postDuration =
              requirePostDuration(
                zeroAge,
              );

            expect(
              evaluate(
                generationKey,
                mass,
                metallicity,
                mainLifetime,
              ).evolutionState,
            ).toBe(
              StellarEvolutionState.SUPERGIANT,
            );

            const remnant =
              evaluate(
                generationKey,
                mass,
                metallicity,
                mainLifetime +
                  postDuration,
              );

            expect([
              StellarEvolutionState.NEUTRON_STAR,
              StellarEvolutionState.STELLAR_BLACK_HOLE,
            ]).toContain(
              remnant.evolutionState,
            );

            if (
              remnant.evolutionState ===
              StellarEvolutionState.NEUTRON_STAR
            ) {
              expect(
                remnant.neutronStarFormationChannel,
              ).not.toBeNull();

              expect(
                remnant.blackHoleFormationChannel,
              ).toBeNull();
            } else {
              expect(
                remnant.blackHoleFormationChannel,
              ).not.toBeNull();

              expect(
                remnant.neutronStarFormationChannel,
              ).toBeNull();
            }
          }
        }
      },
    );

    it(
      'should never move backwards in evolutionary rank as age increases across representative stellar masses and metallicities',
      () => {
        const masses = [
          0.10,
          0.50,
          1.00,
          3.00,
          6.50,
          9.00,
          12.0,
          22.0,
          40.0,
          100.0,
        ] as const;

        for (
          const metallicity of
            metallicities
        ) {
          for (
            const mass of
              masses
          ) {
            const zeroAge =
              evaluate(
                generationKey,
                mass,
                metallicity,
                0,
              );

            const mainLifetime =
              requireLifetime(
                zeroAge,
              );

            const postDuration =
              requirePostDuration(
                zeroAge,
              );

            const terminalAge =
              mainLifetime +
              postDuration;

            const ages = [
              0,
              mainLifetime *
                0.25,
              mainLifetime *
                0.999_999,
              mainLifetime,
              mainLifetime +
                postDuration *
                  0.25,
              mainLifetime +
                postDuration *
                  0.999_999,
              terminalAge,
              terminalAge +
                Math.max(
                  0.001,
                  terminalAge,
                ),
            ];

            let previousRank =
              -1;

            for (
              const age of
                ages
            ) {
              const rank =
                evolutionaryRank(
                  evaluate(
                    generationKey,
                    mass,
                    metallicity,
                    age,
                  ),
                );

              expect(
                rank,
              ).toBeGreaterThanOrEqual(
                previousRank,
              );

              previousRank =
                rank;
            }
          }
        }
      },
    );

    it(
      'should keep guaranteed substellar masses as brown dwarfs and cool monotonically from L toward T and Y without entering stellar-burning states',
      () => {
        const masses = [
          0.012,
          0.030,
          0.050,
          0.068,
        ] as const;

        const ages = [
          0,
          0.05,
          0.50,
          2.0,
          10.0,
          100.0,
        ] as const;

        for (
          const metallicity of
            metallicities
        ) {
          for (
            const mass of
              masses
          ) {
            let previousCoolingRank =
              -1;

            for (
              const age of
                ages
            ) {
              const assessment =
                evaluate(
                  generationKey,
                  mass,
                  metallicity,
                  age,
                );

              expect(
                assessment.evolutionState,
              ).toBe(
                StellarEvolutionState.BROWN_DWARF,
              );

              expect(
                assessment.mainSequenceLifetimeBillionYears,
              ).toBeNull();

              expect(
                assessment.postMainSequenceDurationBillionYears,
              ).toBeNull();

              const rank =
                brownDwarfCoolingRank(
                  assessment,
                );

              expect(
                rank,
              ).toBeGreaterThanOrEqual(
                previousCoolingRank,
              );

              previousCoolingRank =
                rank;
            }
          }
        }
      },
    );

    it(
      'should keep terminal remnant families ordered by progenitor mass for every representative metallicity',
      () => {
        for (
          const metallicity of
            metallicities
        ) {
          let previousRank =
            -1;

          const seen =
            new Set<number>();

          for (
            let mass = 0.10;
            mass <= 150.0;
            mass += 0.25
          ) {
            const assessment =
              evaluate(
                generationKey,
                mass,
                metallicity,
                1_000_000,
              );

            const rank =
              terminalRemnantRank(
                assessment,
              );

            expect(
              rank,
            ).toBeGreaterThanOrEqual(
              previousRank,
            );

            seen.add(
              rank,
            );

            previousRank =
              rank;
          }

          expect(
            seen,
          ).toEqual(
            new Set([
              0,
              1,
              2,
            ]),
          );
        }
      },
    );

    it(
      'should produce only internally coherent state/detail combinations across a broad mass-metallicity-age matrix',
      () => {
        const masses = [
          0.012,
          0.030,
          0.050,
          0.068,
          0.080,
          0.10,
          0.20,
          0.50,
          0.80,
          1.00,
          1.40,
          2.10,
          5.00,
          7.00,
          8.00,
          8.50,
          9.00,
          12.0,
          20.0,
          22.0,
          25.0,
          30.0,
          40.0,
          60.0,
          100.0,
          150.0,
        ] as const;

        const validationMetallicities = [
          0,
          0.01,
          0.10,
          1.0,
          3.0,
          10.0,
        ] as const;

        const ages = [
          0,
          0.001,
          0.010,
          0.10,
          1.0,
          5.0,
          10.0,
          20.0,
          100.0,
          10_000.0,
        ] as const;

        let evaluatedCases =
          0;

        for (
          const metallicity of
            validationMetallicities
        ) {
          for (
            const mass of
              masses
          ) {
            for (
              const age of
                ages
            ) {
              const assessment =
                evaluate(
                  generationKey,
                  mass,
                  metallicity,
                  age,
                );

              assertCoherentAssessment(
                assessment,
              );

              evaluatedCases +=
                1;
            }
          }
        }

        expect(
          evaluatedCases,
        ).toBe(
          masses.length *
          validationMetallicities.length *
          ages.length,
        );

        expect(
          evaluatedCases,
        ).toBeGreaterThanOrEqual(
          1_500,
        );
      },
    );
  },
);

function evaluate(
  generationKey:
    UniverseGenerationKey,

  initialMassSolar:
    number,

  metallicitySolarRatio:
    number,

  ageBillionYears:
    number,
): StellarEvolutionAssessment {

  return StellarEvolutionEngine
    .evaluate(
      generationKey,
      new StellarEvolutionInput(
        initialMassSolar,
        metallicitySolarRatio,
        ageBillionYears,
      ),
    );
}

function requireLifetime(
  assessment:
    StellarEvolutionAssessment,
): number {

  const lifetime =
    assessment
      .mainSequenceLifetimeBillionYears;

  if (
    lifetime ===
    null
  ) {
    throw new Error(
      `Expected stellar-burning lifetime for ${assessment.evolutionState.name}.`,
    );
  }

  return lifetime;
}

function requirePostDuration(
  assessment:
    StellarEvolutionAssessment,
): number {

  const duration =
    assessment
      .postMainSequenceDurationBillionYears;

  if (
    duration ===
    null
  ) {
    throw new Error(
      `Expected post-main-sequence duration for ${assessment.evolutionState.name}.`,
    );
  }

  return duration;
}

function evolutionaryRank(
  assessment:
    StellarEvolutionAssessment,
): number {

  if (
    assessment.evolutionState ===
    StellarEvolutionState.MAIN_SEQUENCE
  ) {
    return 0;
  }

  if (
    assessment.evolutionState ===
      StellarEvolutionState.GIANT ||
    assessment.evolutionState ===
      StellarEvolutionState.SUPERGIANT
  ) {
    return 1;
  }

  if (
    assessment.evolutionState ===
      StellarEvolutionState.WHITE_DWARF ||
    assessment.evolutionState ===
      StellarEvolutionState.NEUTRON_STAR ||
    assessment.evolutionState ===
      StellarEvolutionState.STELLAR_BLACK_HOLE
  ) {
    return 2;
  }

  throw new Error(
    `Unexpected stellar-burning state in rank validation: ${assessment.evolutionState.name}.`,
  );
}

function brownDwarfCoolingRank(
  assessment:
    StellarEvolutionAssessment,
): number {

  const brownDwarfClass =
    assessment.brownDwarfClass;

  if (
    brownDwarfClass ===
    null
  ) {
    throw new Error(
      'BROWN_DWARF assessment requires a brown-dwarf class.',
    );
  }

  switch (
    brownDwarfClass.name
  ) {
    case 'L':
      return 0;

    case 'T':
      return 1;

    case 'Y':
      return 2;
  }

  throw new Error(
    `Unsupported brown-dwarf class: ${brownDwarfClass.name}.`,
  );
}

function terminalRemnantRank(
  assessment:
    StellarEvolutionAssessment,
): number {

  if (
    assessment.evolutionState ===
    StellarEvolutionState.WHITE_DWARF
  ) {
    return 0;
  }

  if (
    assessment.evolutionState ===
    StellarEvolutionState.NEUTRON_STAR
  ) {
    return 1;
  }

  if (
    assessment.evolutionState ===
    StellarEvolutionState.STELLAR_BLACK_HOLE
  ) {
    return 2;
  }

  throw new Error(
    `Expected terminal remnant, received ${assessment.evolutionState.name}.`,
  );
}

function assertCoherentAssessment(
  assessment:
    StellarEvolutionAssessment,
): void {

  const isBrownDwarf =
    assessment.evolutionState ===
    StellarEvolutionState.BROWN_DWARF;

  if (
    isBrownDwarf
  ) {
    expect(
      assessment.brownDwarfClass,
    ).not.toBeNull();

    expect(
      assessment.mainSequenceLifetimeBillionYears,
    ).toBeNull();

    expect(
      assessment.postMainSequenceDurationBillionYears,
    ).toBeNull();
  } else {
    expect(
      requireLifetime(
        assessment,
      ),
    ).toBeGreaterThan(
      0,
    );

    expect(
      requirePostDuration(
        assessment,
      ),
    ).toBeGreaterThan(
      0,
    );
  }

  expect(
    assessment.mainSequenceClass !==
      null,
  ).toBe(
    assessment.evolutionState ===
      StellarEvolutionState.MAIN_SEQUENCE,
  );

  expect(
    assessment.brownDwarfClass !==
      null,
  ).toBe(
    isBrownDwarf,
  );

  expect(
    assessment.postMainSequenceStage !==
      null,
  ).toBe(
    assessment.evolutionState ===
      StellarEvolutionState.GIANT ||
    assessment.evolutionState ===
      StellarEvolutionState.SUPERGIANT,
  );

  expect(
    assessment.whiteDwarfComposition !==
      null,
  ).toBe(
    assessment.evolutionState ===
      StellarEvolutionState.WHITE_DWARF,
  );

  expect(
    assessment.neutronStarFormationChannel !==
      null,
  ).toBe(
    assessment.evolutionState ===
      StellarEvolutionState.NEUTRON_STAR,
  );

  expect(
    assessment.blackHoleFormationChannel !==
      null,
  ).toBe(
    assessment.evolutionState ===
      StellarEvolutionState.STELLAR_BLACK_HOLE,
  );
}
