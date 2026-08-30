import {
  GiantMoonCompositionRegime,
} from '../../domain/planetary/giant-moon-composition-regime';

import {
  GiantMoonOrbitalFamily,
} from '../../domain/planetary/giant-moon-orbital-family';

import {
  type MoonEnvironmentState,
} from '../../domain/planetary/moon-environment-state';

import {
  type MoonHabitabilityState,
} from '../../domain/planetary/moon-habitability-state';

import {
  type MoonOrbitalElements,
} from '../../domain/planetary/moon-orbital-elements';

import {
  type MoonPhysicalProperties,
} from '../../domain/planetary/moon-physical-properties';

import {
  type MoonPopulationProfile,
} from '../../domain/planetary/moon-population-profile';

import {
  type MoonTidalState,
} from '../../domain/planetary/moon-tidal-state';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  type RelevantMoon,
} from '../../domain/planetary/relevant-moon';

import {
  GiantMoonArchitectureEngine,
} from './giant-moon-architecture-engine';

describe(
  'GiantMoonArchitectureEngine point 21.7',
  () => {
    it(
      'should classify a frozen giant-host moon without regenerating any prior source',
      () => {
        const state =
          GiantMoonArchitectureEngine
            .generateMoonState(
              hostFixture(
                PlanetType.GAS_GIANT,
              ),
              physicalFixture(
                1,
              ),
              orbitFixture(
                1,
                10,
              ),
              tidalFixture(
                1,
                0.60,
              ),
              environmentFixture(
                1,
                0.72,
                0.70,
                0.05,
              ),
              habitabilityFixture(
                1,
                0.40,
                true,
              ),
            );

        expect(
          state.orbitalFamily,
        ).toBe(
          GiantMoonOrbitalFamily.INNER_REGULAR,
        );
        expect(
          state.compositionRegime,
        ).toBe(
          GiantMoonCompositionRegime.ICE_RICH,
        );
        expect(
          state.isLargeMoon,
        ).toBe(true);
        expect(
          state.isTidallyActive,
        ).toBe(true);
        expect(
          state.isOceanBearingCandidate,
        ).toBe(true);
        expect(
          state.isHabitabilityCandidate,
        ).toBe(true);
      },
    );

    it(
      'should summarize the unmaterialized minor population of a giant without creating individual irregular moons',
      () => {
        const host =
          hostFixture(
            PlanetType.GAS_GIANT,
          );

        const relevantMoons =
          Array.from(
            {
              length:
                8,
            },
            (
              _,
              index,
            ) => {
              const ordinal =
                index +
                1;

              const state =
                GiantMoonArchitectureEngine
                  .generateMoonState(
                    host,
                    physicalFixture(
                      ordinal,
                    ),
                    orbitFixture(
                      ordinal,
                      8 +
                        5 *
                          index,
                    ),
                    tidalFixture(
                      ordinal,
                      index <
                        2
                        ? 0.60
                        : 0.10,
                    ),
                    environmentFixture(
                      ordinal,
                      index %
                        2 ===
                        0
                        ? 0.75
                        : 0.35,
                      index <
                        4
                        ? 0.60
                        : 0.10,
                      0.05,
                    ),
                    habitabilityFixture(
                      ordinal,
                      index ===
                        3
                        ? 0.40
                        : 0.05,
                      index ===
                        3,
                    ),
                  );

              return {
                hostPlanetOrdinal:
                  2,
                giantMoonState:
                  state,
              } as unknown as RelevantMoon;
            },
          );

        const profile =
          GiantMoonArchitectureEngine
            .generateSystemProfile(
              host,
              {
                hostPlanetOrdinal:
                  2,
                sourcePlanetType:
                  PlanetType.GAS_GIANT,
                moonCount:
                  100,
                satelliteCapacityIndex01:
                  0.8942461242620243,
              } as unknown as MoonPopulationProfile,
              relevantMoons,
            );

        expect(
          profile.regularRelevantMoonCount,
        ).toBe(8);
        expect(
          profile.estimatedIrregularMinorMoonCount,
        ).toBe(72);
        expect(
          profile.estimatedRegularMinorMoonCount,
        ).toBe(20);
        expect(
          profile.tidallyActiveRelevantMoonCount,
        ).toBe(2);
        expect(
          profile.potentiallyHabitableRelevantMoonCount,
        ).toBe(1);
      },
    );

    it(
      'should make the specialization non-applicable for a rocky host',
      () => {
        const state =
          GiantMoonArchitectureEngine
            .generateMoonState(
              hostFixture(
                PlanetType.ROCKY,
              ),
              physicalFixture(
                1,
              ),
              orbitFixture(
                1,
                20,
              ),
              tidalFixture(
                1,
                0.30,
              ),
              environmentFixture(
                1,
                0.05,
                0.05,
                0.01,
              ),
              habitabilityFixture(
                1,
                0.02,
                false,
              ),
            );

        expect(
          state.isApplicable,
        ).toBe(false);
        expect(
          state.orbitalFamily,
        ).toBe(
          GiantMoonOrbitalFamily.NOT_APPLICABLE,
        );
      },
    );
  },
);

function hostFixture(
  planetType:
    PlanetType,
): Planet {

  return {
    planetOrdinal:
      2,
    planetType,
  } as unknown as Planet;
}

function physicalFixture(
  moonOrdinal:
    number,
): MoonPhysicalProperties {

  return {
    hostPlanetOrdinal:
      2,
    moonOrdinal,
    massEarth:
      0.015,
    radiusEarth:
      0.25,
  } as unknown as MoonPhysicalProperties;
}

function orbitFixture(
  moonOrdinal:
    number,

  semiMajorAxisPlanetRadii:
    number,
): MoonOrbitalElements {

  return {
    hostPlanetOrdinal:
      2,
    moonOrdinal,
    semiMajorAxisPlanetRadii,
    eccentricity:
      0.01,
    inclinationDegrees:
      1,
  } as unknown as MoonOrbitalElements;
}

function tidalFixture(
  moonOrdinal:
    number,

  tidalHeatingIndex01:
    number,
): MoonTidalState {

  return {
    hostPlanetOrdinal:
      2,
    moonOrdinal,
    tidalHeatingIndex01,
  } as unknown as MoonTidalState;
}

function environmentFixture(
  moonOrdinal:
    number,

  inferredIceRichnessIndex01:
    number,

  subsurfaceOceanPotentialIndex01:
    number,

  surfaceLiquidWaterPotentialIndex01:
    number,
): MoonEnvironmentState {

  return {
    hostPlanetOrdinal:
      2,
    moonOrdinal,
    inferredIceRichnessIndex01,
    subsurfaceOceanPotentialIndex01,
    surfaceLiquidWaterPotentialIndex01,
  } as unknown as MoonEnvironmentState;
}

function habitabilityFixture(
  moonOrdinal:
    number,

  overallHabitabilityIndex01:
    number,

  isPotentiallyHabitable:
    boolean,
): MoonHabitabilityState {

  return {
    hostPlanetOrdinal:
      2,
    moonOrdinal,
    overallHabitabilityIndex01,
    isPotentiallyHabitable,
  } as unknown as MoonHabitabilityState;
}
