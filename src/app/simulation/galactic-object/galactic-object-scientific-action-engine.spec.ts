import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  GalacticObjectScientificActionType,
} from '../../domain/galactic-object/galactic-object-scientific-action';

import {
  GalacticObjectLocator,
  type ProceduralLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  InstrumentObservationSession,
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  LeveledInstrumentObservationSession,
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  ObservationSession,
  Observatory,
} from '../../domain/observation/observatory';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ObservationInstrumentCapabilityCatalogV1,
} from '../observation/observation-instrument-capability-catalog';

import {
  ObservationInstrumentCatalogV1,
} from '../observation/observation-instrument-catalog';

import {
  SupernovaRemnantGenerator,
} from './supernova-remnant-generator';

import {
  GalacticObjectScientificActionEngine,
} from './galactic-object-scientific-action-engine';

describe(
  'GalacticObjectScientificActionEngine',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const hiiLocator =
      new GalacticObjectLocator(
        0n,
        123456789n,
        3n,
      );

    const nebulaLocator =
      new GalacticObjectLocator(
        0n,
        123456789n,
        8n,
      );

    const openClusterLocator =
      new GalacticObjectLocator(
        0n,
        0n,
        2n,
      );

    const globularClusterLocator =
      new GalacticObjectLocator(
        0n,
        0n,
        7n,
      );

    const remnantLocator =
      findPersistentSupernovaRemnantLocator(
        generationKey,
      );

    const reservedExtremeLocator =
      new GalacticObjectLocator(
        0n,
        0n,
        18n,
      );

    function session(
      locator:
        ProceduralLocator,

      state:
        DiscoveryStateValue,

      instrumentType:
        ObservationInstrumentType,

      level:
        ObservationInstrumentLevel,

      key:
        UniverseGenerationKey =
          generationKey,
    ): LeveledInstrumentObservationSession {

      const observatory =
        new Observatory(
          key,
        );

      const baseSession =
        new ObservationSession(
          observatory,
          locator,
          state,
        );

      const instrument =
        ObservationInstrumentCatalogV1
          .instrument(
            instrumentType,
          );

      const instrumentSession =
        new InstrumentObservationSession(
          baseSession,
          instrument,
        );

      return new LeveledInstrumentObservationSession(
        instrumentSession,
        ObservationInstrumentCapabilityCatalogV1
          .profile(
            instrumentType,
            level,
          ),
      );
    }

    it(
      'should route DETECTED surveys only from the already-known coarse point-9.4 family',
      () => {
        const nebulaSurvey =
          GalacticObjectScientificActionEngine
            .availability(
              generationKey,
              session(
                hiiLocator,
                DiscoveryState.DETECTED,
                ObservationInstrumentType.OPTICAL,
                ObservationInstrumentLevel.LEVEL_1,
              ),
              GalacticObjectScientificActionType.NEBULA_SURVEY,
            );

        const wrongSurvey =
          GalacticObjectScientificActionEngine
            .availability(
              generationKey,
              session(
                hiiLocator,
                DiscoveryState.DETECTED,
                ObservationInstrumentType.OPTICAL,
                ObservationInstrumentLevel.LEVEL_1,
              ),
              GalacticObjectScientificActionType.STAR_CLUSTER_SURVEY,
            );

        expect(
          nebulaSurvey.isAvailable,
        ).toBe(true);

        expect(
          wrongSurvey.matchesScientificTarget,
        ).toBe(false);
      },
    );

    it(
      'should keep physical-family specific actions unavailable while the target is only DETECTED',
      () => {
        const availability =
          GalacticObjectScientificActionEngine
            .availability(
              generationKey,
              session(
                hiiLocator,
                DiscoveryState.DETECTED,
                ObservationInstrumentType.SPECTROSCOPY,
                ObservationInstrumentLevel.LEVEL_2,
              ),
              GalacticObjectScientificActionType.HII_IONIZATION_CHARACTERIZATION,
            );

        expect(
          availability.matchesScientificTarget,
        ).toBe(false);

        expect(
          availability.isAvailable,
        ).toBe(false);
      },
    );

    it(
      'should route a discovered H II region to its most-specific profile instead of the generic nebula profile',
      () => {
        const genericNebula =
          GalacticObjectScientificActionEngine
            .availability(
              generationKey,
              session(
                hiiLocator,
                DiscoveryState.DISCOVERED,
                ObservationInstrumentType.SPECTROSCOPY,
                ObservationInstrumentLevel.LEVEL_2,
              ),
              GalacticObjectScientificActionType.NEBULA_SPECTROSCOPIC_CHARACTERIZATION,
            );

        const hii =
          GalacticObjectScientificActionEngine
            .availability(
              generationKey,
              session(
                hiiLocator,
                DiscoveryState.DISCOVERED,
                ObservationInstrumentType.SPECTROSCOPY,
                ObservationInstrumentLevel.LEVEL_2,
              ),
              GalacticObjectScientificActionType.HII_IONIZATION_CHARACTERIZATION,
            );

        expect(
          genericNebula.matchesScientificTarget,
        ).toBe(false);

        expect(
          hii.isAvailable,
        ).toBe(true);
      },
    );

    it(
      'should award exactly the frozen 24 PD for DETECTED to DISCOVERED survey progression',
      () => {
        const result =
          GalacticObjectScientificActionEngine
            .evaluate(
              generationKey,
              session(
                nebulaLocator,
                DiscoveryState.DETECTED,
                ObservationInstrumentType.OPTICAL,
                ObservationInstrumentLevel.LEVEL_1,
              ),
              GalacticObjectScientificActionType.NEBULA_SURVEY,
            );

        expect(
          result.newDiscoveryState,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          result.awardedDiscoveryPoints,
        ).toBe(24);

        expect(
          result.reward.awardedRewardReasons,
        ).toEqual([]);
      },
    );

    it(
      'should award exactly 96 PD for DISCOVERED to CATALOGUED characterization including the crossed VISITED milestone',
      () => {
        const result =
          GalacticObjectScientificActionEngine
            .evaluate(
              generationKey,
              session(
                hiiLocator,
                DiscoveryState.DISCOVERED,
                ObservationInstrumentType.SPECTROSCOPY,
                ObservationInstrumentLevel.LEVEL_2,
              ),
              GalacticObjectScientificActionType.HII_IONIZATION_CHARACTERIZATION,
            );

        expect(
          result.reward.progressResult.crossedMilestones,
        ).toEqual([
          DiscoveryState.VISITED,
          DiscoveryState.CATALOGUED,
        ]);

        expect(
          result.awardedDiscoveryPoints,
        ).toBe(96);
      },
    );

    it(
      'should award exactly 96 PD for CATALOGUED to CONFIRMED confirmation',
      () => {
        const result =
          GalacticObjectScientificActionEngine
            .evaluate(
              generationKey,
              session(
                remnantLocator,
                DiscoveryState.CATALOGUED,
                ObservationInstrumentType.RADIO,
                ObservationInstrumentLevel.LEVEL_4,
              ),
              GalacticObjectScientificActionType.SUPERNOVA_REMNANT_EVOLUTION_CONFIRMATION,
            );

        expect(
          result.newDiscoveryState,
        ).toBe(
          DiscoveryState.CONFIRMED,
        );

        expect(
          result.awardedDiscoveryPoints,
        ).toBe(96);

        expect(
          result.reward.awardedRewardReasons,
        ).toEqual([]);

        expect(
          result.reward.bonusDiscoveryPoints,
        ).toBe(0);
      },
    );

    it(
      'should enforce both dedicated instrument subsets and minimum instrument levels',
      () => {
        const wrongInstrument =
          GalacticObjectScientificActionEngine
            .availability(
              generationKey,
              session(
                openClusterLocator,
                DiscoveryState.CATALOGUED,
                ObservationInstrumentType.OPTICAL,
                ObservationInstrumentLevel.LEVEL_5,
              ),
              GalacticObjectScientificActionType.OPEN_CLUSTER_AGE_METALLICITY_CONFIRMATION,
            );

        const lowLevel =
          GalacticObjectScientificActionEngine
            .availability(
              generationKey,
              session(
                globularClusterLocator,
                DiscoveryState.CATALOGUED,
                ObservationInstrumentType.SPECTROSCOPY,
                ObservationInstrumentLevel.LEVEL_3,
              ),
              GalacticObjectScientificActionType.GLOBULAR_CLUSTER_POPULATION_CONFIRMATION,
            );

        expect(
          wrongInstrument.isInstrumentAllowed,
        ).toBe(false);

        expect(
          lowLevel.meetsMinimumInstrumentLevel,
        ).toBe(false);

        expect(
          wrongInstrument.isAvailable,
        ).toBe(false);

        expect(
          lowLevel.isAvailable,
        ).toBe(false);
      },
    );

    it(
      'should prevent a completed milestone action from being repeated for more PD',
      () => {
        const availability =
          GalacticObjectScientificActionEngine
            .availability(
              generationKey,
              session(
                nebulaLocator,
                DiscoveryState.DISCOVERED,
                ObservationInstrumentType.OPTICAL,
                ObservationInstrumentLevel.LEVEL_1,
              ),
              GalacticObjectScientificActionType.NEBULA_SURVEY,
            );

        expect(
          availability.isStateEligible,
        ).toBe(false);

        expect(
          () =>
            GalacticObjectScientificActionEngine
              .evaluate(
                generationKey,
                session(
                  nebulaLocator,
                  DiscoveryState.DISCOVERED,
                  ObservationInstrumentType.OPTICAL,
                  ObservationInstrumentLevel.LEVEL_1,
                ),
                GalacticObjectScientificActionType.NEBULA_SURVEY,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should allow the reserved EXTREME_OBJECT complement to be surveyed without inventing a point-12.7 physical profile',
      () => {
        const survey =
          GalacticObjectScientificActionEngine
            .availability(
              generationKey,
              session(
                reservedExtremeLocator,
                DiscoveryState.DETECTED,
                ObservationInstrumentType.X_RAY,
                ObservationInstrumentLevel.LEVEL_2,
              ),
              GalacticObjectScientificActionType.EXTREME_OBJECT_SURVEY,
            );

        const remnantAction =
          GalacticObjectScientificActionEngine
            .availability(
              generationKey,
              session(
                reservedExtremeLocator,
                DiscoveryState.DISCOVERED,
                ObservationInstrumentType.SPECTROSCOPY,
                ObservationInstrumentLevel.LEVEL_3,
              ),
              GalacticObjectScientificActionType.SUPERNOVA_REMNANT_SHOCK_CHARACTERIZATION,
            );

        expect(
          survey.isAvailable,
        ).toBe(true);

        expect(
          remnantAction.matchesScientificTarget,
        ).toBe(false);

        expect(
          remnantAction.isAvailable,
        ).toBe(false);
      },
    );

    it(
      'should preserve the same 216-PD DETECTED to CONFIRMED total for every supported physical family',
      () => {
        const cases = [
          {
            locator:
              nebulaLocator,
            survey:
              GalacticObjectScientificActionType.NEBULA_SURVEY,
            surveyInstrument:
              ObservationInstrumentType.OPTICAL,
            surveyLevel:
              ObservationInstrumentLevel.LEVEL_1,
            characterize:
              GalacticObjectScientificActionType.NEBULA_SPECTROSCOPIC_CHARACTERIZATION,
            characterizeInstrument:
              ObservationInstrumentType.SPECTROSCOPY,
            characterizeLevel:
              ObservationInstrumentLevel.LEVEL_2,
            confirm:
              GalacticObjectScientificActionType.NEBULA_PHYSICAL_CONFIRMATION,
            confirmInstrument:
              ObservationInstrumentType.INFRARED,
            confirmLevel:
              ObservationInstrumentLevel.LEVEL_3,
          },
          {
            locator:
              hiiLocator,
            survey:
              GalacticObjectScientificActionType.NEBULA_SURVEY,
            surveyInstrument:
              ObservationInstrumentType.OPTICAL,
            surveyLevel:
              ObservationInstrumentLevel.LEVEL_1,
            characterize:
              GalacticObjectScientificActionType.HII_IONIZATION_CHARACTERIZATION,
            characterizeInstrument:
              ObservationInstrumentType.SPECTROSCOPY,
            characterizeLevel:
              ObservationInstrumentLevel.LEVEL_2,
            confirm:
              GalacticObjectScientificActionType.HII_STAR_FORMATION_CONFIRMATION,
            confirmInstrument:
              ObservationInstrumentType.INFRARED,
            confirmLevel:
              ObservationInstrumentLevel.LEVEL_3,
          },
          {
            locator:
              openClusterLocator,
            survey:
              GalacticObjectScientificActionType.STAR_CLUSTER_SURVEY,
            surveyInstrument:
              ObservationInstrumentType.OPTICAL,
            surveyLevel:
              ObservationInstrumentLevel.LEVEL_1,
            characterize:
              GalacticObjectScientificActionType.OPEN_CLUSTER_POPULATION_CHARACTERIZATION,
            characterizeInstrument:
              ObservationInstrumentType.OPTICAL,
            characterizeLevel:
              ObservationInstrumentLevel.LEVEL_2,
            confirm:
              GalacticObjectScientificActionType.OPEN_CLUSTER_AGE_METALLICITY_CONFIRMATION,
            confirmInstrument:
              ObservationInstrumentType.SPECTROSCOPY,
            confirmLevel:
              ObservationInstrumentLevel.LEVEL_3,
          },
          {
            locator:
              globularClusterLocator,
            survey:
              GalacticObjectScientificActionType.STAR_CLUSTER_SURVEY,
            surveyInstrument:
              ObservationInstrumentType.OPTICAL,
            surveyLevel:
              ObservationInstrumentLevel.LEVEL_1,
            characterize:
              GalacticObjectScientificActionType.GLOBULAR_CLUSTER_STRUCTURE_CHARACTERIZATION,
            characterizeInstrument:
              ObservationInstrumentType.OPTICAL,
            characterizeLevel:
              ObservationInstrumentLevel.LEVEL_3,
            confirm:
              GalacticObjectScientificActionType.GLOBULAR_CLUSTER_POPULATION_CONFIRMATION,
            confirmInstrument:
              ObservationInstrumentType.SPECTROSCOPY,
            confirmLevel:
              ObservationInstrumentLevel.LEVEL_4,
          },
          {
            locator:
              remnantLocator,
            survey:
              GalacticObjectScientificActionType.EXTREME_OBJECT_SURVEY,
            surveyInstrument:
              ObservationInstrumentType.X_RAY,
            surveyLevel:
              ObservationInstrumentLevel.LEVEL_2,
            characterize:
              GalacticObjectScientificActionType.SUPERNOVA_REMNANT_SHOCK_CHARACTERIZATION,
            characterizeInstrument:
              ObservationInstrumentType.SPECTROSCOPY,
            characterizeLevel:
              ObservationInstrumentLevel.LEVEL_3,
            confirm:
              GalacticObjectScientificActionType.SUPERNOVA_REMNANT_EVOLUTION_CONFIRMATION,
            confirmInstrument:
              ObservationInstrumentType.RADIO,
            confirmLevel:
              ObservationInstrumentLevel.LEVEL_4,
          },
        ] as const;

        for (
          const item
          of cases
        ) {
          const survey =
            GalacticObjectScientificActionEngine
              .evaluate(
                generationKey,
                session(
                  item.locator,
                  DiscoveryState.DETECTED,
                  item.surveyInstrument,
                  item.surveyLevel,
                ),
                item.survey,
              );

          const characterize =
            GalacticObjectScientificActionEngine
              .evaluate(
                generationKey,
                session(
                  item.locator,
                  DiscoveryState.DISCOVERED,
                  item.characterizeInstrument,
                  item.characterizeLevel,
                ),
                item.characterize,
              );

          const confirm =
            GalacticObjectScientificActionEngine
              .evaluate(
                generationKey,
                session(
                  item.locator,
                  DiscoveryState.CATALOGUED,
                  item.confirmInstrument,
                  item.confirmLevel,
                ),
                item.confirm,
              );

          expect(
            survey.awardedDiscoveryPoints +
              characterize.awardedDiscoveryPoints +
              confirm.awardedDiscoveryPoints,
          ).toBe(216);
        }
      },
    );

    it(
      'should expose all thirteen availability rows without filtering the catalog',
      () => {
        expect(
          GalacticObjectScientificActionEngine
            .availabilities(
              generationKey,
              session(
                remnantLocator,
                DiscoveryState.DETECTED,
                ObservationInstrumentType.X_RAY,
                ObservationInstrumentLevel.LEVEL_2,
              ),
            ),
        ).toHaveLength(13);
      },
    );

    it(
      'should reject non-GalacticObject execution and unsupported generator versions',
      () => {
        expect(
          () =>
            GalacticObjectScientificActionEngine
              .evaluate(
                generationKey,
                session(
                  new SystemLocator(
                    0n,
                    0n,
                    0n,
                  ),
                  DiscoveryState.DETECTED,
                  ObservationInstrumentType.OPTICAL,
                  ObservationInstrumentLevel.LEVEL_1,
                ),
                GalacticObjectScientificActionType.NEBULA_SURVEY,
              ),
        ).toThrow(
          RangeError,
        );

        const unsupported =
          new UniverseGenerationKey(
            generationKey.universeSeed,
            {
              name:
                'V1',
              code:
                999,
            } as unknown as GeneratorVersion,
          );

        expect(
          () =>
            GalacticObjectScientificActionEngine
              .availability(
                unsupported,
                session(
                  remnantLocator,
                  DiscoveryState.DETECTED,
                  ObservationInstrumentType.X_RAY,
                  ObservationInstrumentLevel.LEVEL_2,
                  unsupported,
                ),
                GalacticObjectScientificActionType.EXTREME_OBJECT_SURVEY,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function findPersistentSupernovaRemnantLocator(
  generationKey:
    UniverseGenerationKey,
): GalacticObjectLocator {

  for (
    let index =
      1n;
    index <
      2_048n;
    index +=
      1n
  ) {
    const candidate =
      new GalacticObjectLocator(
        0n,
        0n,
        index,
      );

    if (
      SupernovaRemnantGenerator
        .isSupernovaRemnantLocator(
          generationKey,
          candidate,
        )
    ) {
      return candidate;
    }
  }

  throw new RangeError(
    'Missing deterministic persistent supernova-remnant test locator outside the reserved galactic nucleus object.',
  );
}
