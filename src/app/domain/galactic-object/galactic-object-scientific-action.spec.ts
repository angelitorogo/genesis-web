import {
  DiscoveryState,
} from '../discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../discovery/discovery-target-type';

import {
  DiscoveryRewardResult,
} from '../exploration/discovery-reward-result';

import {
  ExplorationProgressResult,
} from '../exploration/exploration-progress-result';

import {
  ObservationActionType,
} from '../observation/observation-action';

import {
  ObservationInstrumentType,
} from '../observation/observation-instrument';

import {
  ObservationInstrumentLevel,
} from '../observation/observation-instrument-capability';

import {
  GalacticObjectScientificActionAvailability,
  GalacticObjectScientificActionResult,
  GalacticObjectScientificActionRule,
  GalacticObjectScientificActionType,
} from './galactic-object-scientific-action';

import {
  GalacticObjectScientificSubject,
  GalacticObjectScientificSurveyFamily,
} from './galactic-object-scientific-subject';

describe(
  'point-12.7 GalacticObject scientific action domain',
  () => {
    function surveyRule():
      GalacticObjectScientificActionRule {

      return new GalacticObjectScientificActionRule(
        GalacticObjectScientificActionType.NEBULA_SURVEY,
        ObservationActionType.OBSERVE,
        [
          ObservationInstrumentType.OPTICAL,
        ],
        ObservationInstrumentLevel.LEVEL_1,
        DiscoveryState.DETECTED,
        DiscoveryState.DISCOVERED,
        GalacticObjectScientificSurveyFamily.NEBULA,
        null,
      );
    }

    function subjectRule():
      GalacticObjectScientificActionRule {

      return new GalacticObjectScientificActionRule(
        GalacticObjectScientificActionType.HII_IONIZATION_CHARACTERIZATION,
        ObservationActionType.ACQUIRE_SPECTRUM,
        [
          ObservationInstrumentType.SPECTROSCOPY,
        ],
        ObservationInstrumentLevel.LEVEL_2,
        DiscoveryState.DISCOVERED,
        DiscoveryState.CATALOGUED,
        null,
        GalacticObjectScientificSubject.HII_REGION,
      );
    }

    it(
      'should expose exactly thirteen canonical action types',
      () => {
        expect(
          Object.values(
            GalacticObjectScientificActionType,
          ),
        ).toHaveLength(13);
      },
    );

    it(
      'should construct an immutable coarse survey rule',
      () => {
        const rule =
          surveyRule();

        expect(
          rule.isSurveyAction,
        ).toBe(true);

        expect(
          rule.scientificSubject,
        ).toBeNull();

        expect(
          Object.isFrozen(
            rule.compatibleInstrumentTypes,
          ),
        ).toBe(true);
      },
    );

    it(
      'should construct a physical-subject rule without a coarse survey family',
      () => {
        const rule =
          subjectRule();

        expect(
          rule.isSurveyAction,
        ).toBe(false);

        expect(
          rule.surveyFamily,
        ).toBeNull();
      },
    );

    it(
      'should reject empty or duplicate compatible instrument lists',
      () => {
        expect(
          () =>
            new GalacticObjectScientificActionRule(
              GalacticObjectScientificActionType.NEBULA_SURVEY,
              ObservationActionType.OBSERVE,
              [],
              ObservationInstrumentLevel.LEVEL_1,
              DiscoveryState.DETECTED,
              DiscoveryState.DISCOVERED,
              GalacticObjectScientificSurveyFamily.NEBULA,
              null,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalacticObjectScientificActionRule(
              GalacticObjectScientificActionType.NEBULA_SURVEY,
              ObservationActionType.OBSERVE,
              [
                ObservationInstrumentType.OPTICAL,
                ObservationInstrumentType.OPTICAL,
              ],
              ObservationInstrumentLevel.LEVEL_1,
              DiscoveryState.DETECTED,
              DiscoveryState.DISCOVERED,
              GalacticObjectScientificSurveyFamily.NEBULA,
              null,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject UNKNOWN as a scientific action minimum state',
      () => {
        expect(
          () =>
            new GalacticObjectScientificActionRule(
              GalacticObjectScientificActionType.NEBULA_SURVEY,
              ObservationActionType.OBSERVE,
              [
                ObservationInstrumentType.OPTICAL,
              ],
              ObservationInstrumentLevel.LEVEL_1,
              DiscoveryState.UNKNOWN,
              DiscoveryState.DISCOVERED,
              GalacticObjectScientificSurveyFamily.NEBULA,
              null,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a target state that does not advance beyond the minimum state',
      () => {
        expect(
          () =>
            new GalacticObjectScientificActionRule(
              GalacticObjectScientificActionType.NEBULA_SURVEY,
              ObservationActionType.OBSERVE,
              [
                ObservationInstrumentType.OPTICAL,
              ],
              ObservationInstrumentLevel.LEVEL_1,
              DiscoveryState.DETECTED,
              DiscoveryState.DETECTED,
              GalacticObjectScientificSurveyFamily.NEBULA,
              null,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should require exactly one applicability dimension',
      () => {
        expect(
          () =>
            new GalacticObjectScientificActionRule(
              GalacticObjectScientificActionType.NEBULA_SURVEY,
              ObservationActionType.OBSERVE,
              [
                ObservationInstrumentType.OPTICAL,
              ],
              ObservationInstrumentLevel.LEVEL_1,
              DiscoveryState.DETECTED,
              DiscoveryState.DISCOVERED,
              null,
              null,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalacticObjectScientificActionRule(
              GalacticObjectScientificActionType.NEBULA_SURVEY,
              ObservationActionType.OBSERVE,
              [
                ObservationInstrumentType.OPTICAL,
              ],
              ObservationInstrumentLevel.LEVEL_1,
              DiscoveryState.DETECTED,
              DiscoveryState.DISCOVERED,
              GalacticObjectScientificSurveyFamily.NEBULA,
              GalacticObjectScientificSubject.NEBULA,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should expose availability only when every gate is satisfied',
      () => {
        const available =
          new GalacticObjectScientificActionAvailability(
            surveyRule(),
            DiscoveryState.DETECTED,
            true,
            true,
            true,
            true,
            true,
          );

        const blocked =
          new GalacticObjectScientificActionAvailability(
            surveyRule(),
            DiscoveryState.DETECTED,
            true,
            true,
            true,
            false,
            true,
          );

        expect(
          available.isAvailable,
        ).toBe(true);

        expect(
          blocked.isAvailable,
        ).toBe(false);
      },
    );

    it(
      'should build a scientific result from the canonical GALACTIC_OBJECT progression reward',
      () => {
        const progress =
          new ExplorationProgressResult(
            DiscoveryTargetType.GALACTIC_OBJECT,
            DiscoveryState.DETECTED,
            DiscoveryState.DISCOVERED,
            [
              DiscoveryState.DISCOVERED,
            ],
            24,
          );

        const reward =
          new DiscoveryRewardResult(
            progress,
            [],
            0,
            24,
          );

        const result =
          new GalacticObjectScientificActionResult(
            GalacticObjectScientificActionType.NEBULA_SURVEY,
            DiscoveryState.DETECTED,
            DiscoveryState.DISCOVERED,
            reward,
          );

        expect(
          result.awardedDiscoveryPoints,
        ).toBe(24);
      },
    );

    it(
      'should reject a scientific result backed by a non-GALACTIC_OBJECT reward',
      () => {
        const progress =
          new ExplorationProgressResult(
            DiscoveryTargetType.SYSTEM,
            DiscoveryState.DETECTED,
            DiscoveryState.DISCOVERED,
            [
              DiscoveryState.DISCOVERED,
            ],
            12,
          );

        const reward =
          new DiscoveryRewardResult(
            progress,
            [],
            0,
            12,
          );

        expect(
          () =>
            new GalacticObjectScientificActionResult(
              GalacticObjectScientificActionType.NEBULA_SURVEY,
              DiscoveryState.DETECTED,
              DiscoveryState.DISCOVERED,
              reward,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
