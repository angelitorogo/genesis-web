import {
  ObservationInstrumentType,
} from './observation-instrument';

import {
  ObservationInstrumentLevel,
} from './observation-instrument-capability';

import {
  ObservationInstrumentFamilyUnlockRule,
  ObservationInstrumentLevelUnlockRule,
  ObservationInstrumentLevelUnlockStatus,
  ObservationInstrumentProgressionOverview,
  ObservationProgressMilestone,
  ObservationUnlockRequirement,
} from './observation-instrument-progression';

describe(
  'ObservationInstrumentProgression',
  () => {

    it(
      'should preserve the five canonical progress milestones and validate unlock requirements',
      () => {
        expect(
          Object.values(
            ObservationProgressMilestone,
          ),
        ).toEqual([
          ObservationProgressMilestone
            .FIRST_SYSTEM_DISCOVERED,
          ObservationProgressMilestone
            .FIRST_BODY_DISCOVERED,
          ObservationProgressMilestone
            .FIRST_GALACTIC_OBJECT_CATALOGUED,
          ObservationProgressMilestone
            .FIRST_TARGET_CONFIRMED,
          ObservationProgressMilestone
            .FIRST_EXTERNAL_GALAXY_DETECTED,
        ]);

        const requirement =
          new ObservationUnlockRequirement(
            2_500n,
            [
              ObservationProgressMilestone
                .FIRST_SYSTEM_DISCOVERED,
              ObservationProgressMilestone
                .FIRST_BODY_DISCOVERED,
            ],
          );

        expect(
          requirement
            .minimumGlobalDiscoveryPoints,
        ).toBe(
          2_500n,
        );

        expect(
          Object.isFrozen(
            requirement
              .requiredMilestones,
          ),
        ).toBe(
          true,
        );

        expect(
          () =>
            new ObservationUnlockRequirement(
              -1n,
              [],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ObservationUnlockRequirement(
              0n,
              [
                ObservationProgressMilestone
                  .FIRST_SYSTEM_DISCOVERED,
                ObservationProgressMilestone
                  .FIRST_SYSTEM_DISCOVERED,
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should model family and level rules and derive locked versus unlocked status',
      () => {
        const requirement =
          new ObservationUnlockRequirement(
            1_000n,
            [
              ObservationProgressMilestone
                .FIRST_SYSTEM_DISCOVERED,
            ],
          );

        const familyRule =
          new ObservationInstrumentFamilyUnlockRule(
            ObservationInstrumentType
              .RADIO,
            requirement,
          );

        const levelRule =
          new ObservationInstrumentLevelUnlockRule(
            ObservationInstrumentLevel
              .LEVEL_2,
            requirement,
          );

        expect(
          familyRule.instrumentType,
        ).toBe(
          ObservationInstrumentType
            .RADIO,
        );

        expect(
          levelRule.level,
        ).toBe(
          ObservationInstrumentLevel
            .LEVEL_2,
        );

        const locked =
          new ObservationInstrumentLevelUnlockStatus(
            ObservationInstrumentType
              .RADIO,
            ObservationInstrumentLevel
              .LEVEL_2,
            requirement,
            250n,
            [
              ObservationProgressMilestone
                .FIRST_SYSTEM_DISCOVERED,
            ],
          );

        expect(
          locked.isUnlocked,
        ).toBe(
          false,
        );

        const unlocked =
          new ObservationInstrumentLevelUnlockStatus(
            ObservationInstrumentType
              .RADIO,
            ObservationInstrumentLevel
              .LEVEL_2,
            requirement,
            0n,
            [],
          );

        expect(
          unlocked.isUnlocked,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should expose canonical overview queries for levels and instrument families',
      () => {
        const opticalL1 =
          new ObservationInstrumentLevelUnlockStatus(
            ObservationInstrumentType
              .OPTICAL,
            ObservationInstrumentLevel
              .LEVEL_1,
            new ObservationUnlockRequirement(
              0n,
              [],
            ),
            0n,
            [],
          );

        const opticalL2 =
          new ObservationInstrumentLevelUnlockStatus(
            ObservationInstrumentType
              .OPTICAL,
            ObservationInstrumentLevel
              .LEVEL_2,
            new ObservationUnlockRequirement(
              1_000n,
              [
                ObservationProgressMilestone
                  .FIRST_SYSTEM_DISCOVERED,
              ],
            ),
            0n,
            [],
          );

        const infraredL1 =
          new ObservationInstrumentLevelUnlockStatus(
            ObservationInstrumentType
              .INFRARED,
            ObservationInstrumentLevel
              .LEVEL_1,
            new ObservationUnlockRequirement(
              500n,
              [
                ObservationProgressMilestone
                  .FIRST_SYSTEM_DISCOVERED,
              ],
            ),
            0n,
            [],
          );

        const overview =
          new ObservationInstrumentProgressionOverview(
            1_000n,
            [
              ObservationProgressMilestone
                .FIRST_SYSTEM_DISCOVERED,
            ],
            [
              opticalL1,
              opticalL2,
              infraredL1,
            ],
          );

        expect(
          overview.status(
            ObservationInstrumentType
              .OPTICAL,
            ObservationInstrumentLevel
              .LEVEL_2,
          ),
        ).toBe(
          opticalL2,
        );

        expect(
          overview.isUnlocked(
            ObservationInstrumentType
              .OPTICAL,
            ObservationInstrumentLevel
              .LEVEL_2,
          ),
        ).toBe(
          true,
        );

        expect(
          overview.unlockedLevels(
            ObservationInstrumentType
              .OPTICAL,
          ),
        ).toEqual([
          ObservationInstrumentLevel
            .LEVEL_1,
          ObservationInstrumentLevel
            .LEVEL_2,
        ]);

        expect(
          overview.highestUnlockedLevel(
            ObservationInstrumentType
              .OPTICAL,
          ),
        ).toBe(
          ObservationInstrumentLevel
            .LEVEL_2,
        );

        expect(
          overview.unlockedInstrumentTypes,
        ).toEqual([
          ObservationInstrumentType
            .OPTICAL,
          ObservationInstrumentType
            .INFRARED,
        ]);
      },
    );

    it(
      'should reject inconsistent domain progression data',
      () => {
        const requirement =
          new ObservationUnlockRequirement(
            1_000n,
            [
              ObservationProgressMilestone
                .FIRST_SYSTEM_DISCOVERED,
            ],
          );

        expect(
          () =>
            new ObservationInstrumentLevelUnlockStatus(
              ObservationInstrumentType
                .OPTICAL,
              ObservationInstrumentLevel
                .LEVEL_2,
              requirement,
              1_001n,
              [],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ObservationInstrumentLevelUnlockStatus(
              ObservationInstrumentType
                .OPTICAL,
              ObservationInstrumentLevel
                .LEVEL_2,
              requirement,
              0n,
              [
                ObservationProgressMilestone
                  .FIRST_BODY_DISCOVERED,
              ],
            ),
        ).toThrow(
          RangeError,
        );

        const status =
          new ObservationInstrumentLevelUnlockStatus(
            ObservationInstrumentType
              .OPTICAL,
            ObservationInstrumentLevel
              .LEVEL_1,
            new ObservationUnlockRequirement(
              0n,
              [],
            ),
            0n,
            [],
          );

        expect(
          () =>
            new ObservationInstrumentProgressionOverview(
              0n,
              [],
              [
                status,
                status,
              ],
            ),
        ).toThrow(
          RangeError,
        );

        const overview =
          new ObservationInstrumentProgressionOverview(
            0n,
            [],
            [
              status,
            ],
          );

        expect(
          () =>
            overview.status(
              ObservationInstrumentType
                .RADIO,
              ObservationInstrumentLevel
                .LEVEL_5,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
