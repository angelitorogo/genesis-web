import {
  BackupFormatVersion,
  type GenesisBackupSnapshot,
} from '../../../domain/backup/genesis-backup';

import {
  DiscoveryTargetType,
} from '../../../domain/discovery/discovery-target-type';

import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  type ProceduralLocator,
  SectorLocator,
  SystemLocator,
} from '../../../domain/generation/procedural-locator';

import {
  GenesisBackupValidationError,
  GenesisBackupValidator,
  type BackupTargetSeedResolver,
} from './genesis-backup-validator';

describe(
  'GenesisBackupValidator',
  () => {
    const universeSeed =
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

    const resolver:
      BackupTargetSeedResolver =
      (
        _generationKey,
        locator,
      ) =>
        syntheticTargetSeed(
          locator,
        );

    let validator:
      GenesisBackupValidator;

    beforeEach(
      () => {
        validator =
          new GenesisBackupValidator(
            resolver,
          );
      },
    );

    it(
      'should reject a root value that is not an object',
      () => {
        expect(
          () =>
            validator
              .validate(
                null,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject universes when it is not an array',
      () => {
        const base =
          validSnapshot();

        const snapshot =
          {
            ...base,

            universes:
              'not-an-array',
          };

        expect(
          () =>
            validator
              .validate(
                snapshot,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject negative exportedAtEpochMs',
      () => {
        const snapshot =
          {
            ...validSnapshot(),

            exportedAtEpochMs:
              -1,
          };

        expect(
          () =>
            validator
              .validate(
                snapshot,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject a parseable but non-canonical UniverseSeed',
      () => {
        const base =
          validSnapshot();

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                universeSeed:
                  universeSeed
                    .toLowerCase(),
              },
            ],
          };

        expect(
          () =>
            validator
              .validate(
                snapshot,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject an unsupported GeneratorVersion',
      () => {
        const base =
          validSnapshot();

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                generatorVersionCode:
                  99,
              },
            ],
          };

        expect(
          () =>
            validator
              .validate(
                snapshot,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject universe updatedAtEpochMs before createdAtEpochMs',
      () => {
        const base =
          validSnapshot();

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                createdAtEpochMs:
                  200,

                updatedAtEpochMs:
                  199,
              },
            ],
          };

        expect(
          () =>
            validator
              .validate(
                snapshot,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject duplicate recentGalaxyIndices',
      () => {
        const base =
          validSnapshot();

        const universe =
          base
            .universes[0];

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...universe,

                navigation: {
                  ...universe
                    .navigation!,

                  recentGalaxyIndices:
                    [
                      '7',
                      '7',
                    ],
                },
              },
            ],
          };

        expect(
          () =>
            validator
              .validate(
                snapshot,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject duplicate galaxy indices',
      () => {
        const base =
          validSnapshot();

        const galaxy =
          base
            .universes[0]
            .galaxies[0];

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                galaxies: [
                  galaxy,
                  galaxy,
                ],
              },
            ],
          };

        expect(
          () =>
            validator
              .validate(
                snapshot,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject materialized UNKNOWN on a galaxy',
      () => {
        const base =
          validSnapshot();

        const galaxy =
          base
            .universes[0]
            .galaxies[0];

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                galaxies: [
                  {
                    ...galaxy,

                    discoveryStateCode:
                      0,
                  },
                ],
              },
            ],
          };

        expect(
          () =>
            validator
              .validate(
                snapshot,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject an unknown DiscoveryTargetType',
      () => {
        const base =
          validSnapshot();

        const discovery =
          base
            .universes[0]
            .discoveries[0];

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                discoveries: [
                  {
                    ...discovery,

                    targetTypeCode:
                      99,
                  },
                ],
              },
            ],
          };

        expect(
          () =>
            validator
              .validate(
                snapshot,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject a non-canonical targetSeed',
      () => {
        const base =
          validSnapshot();

        const discovery =
          base
            .universes[0]
            .discoveries[0];

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                discoveries: [
                  {
                    ...discovery,

                    targetSeed:
                      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                  },
                ],
              },
            ],
          };

        expect(
          () =>
            validator
              .validate(
                snapshot,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject discovery updatedAtEpochMs before firstKnownAtEpochMs',
      () => {
        const base =
          validSnapshot();

        const discovery =
          base
            .universes[0]
            .discoveries[0];

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                discoveries: [
                  {
                    ...discovery,

                    firstKnownAtEpochMs:
                      200,

                    updatedAtEpochMs:
                      199,
                  },
                ],
              },
            ],
          };

        expect(
          () =>
            validator
              .validate(
                snapshot,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject duplicate observation ids',
      () => {
        const base =
          validSnapshot();

        const observation =
          base
            .universes[0]
            .observations[0];

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                observations: [
                  observation,
                  observation,
                ],
              },
            ],
          };

        expect(
          () =>
            validator
              .validate(
                snapshot,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject a blank observationKind',
      () => {
        const base =
          validSnapshot();

        const observation =
          base
            .universes[0]
            .observations[0];

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                observations: [
                  {
                    ...observation,

                    observationKind:
                      '   ',
                  },
                ],
              },
            ],
          };

        expect(
          () =>
            validator
              .validate(
                snapshot,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject payloadVersion zero',
      () => {
        const base =
          validSnapshot();

        const observation =
          base
            .universes[0]
            .observations[0];

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                observations: [
                  {
                    ...observation,

                    payloadVersion:
                      0,
                  },
                ],
              },
            ],
          };

        expect(
          () =>
            validator
              .validate(
                snapshot,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject an unknown ProgressScopeCode',
      () => {
        const base =
          validSnapshot();

        const progress =
          base
            .universes[0]
            .progress[0];

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                progress: [
                  {
                    ...progress,

                    scopeCode:
                      99,
                  },
                ],
              },
            ],
          };

        expect(
          () =>
            validator
              .validate(
                snapshot,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject duplicate progress scopes',
      () => {
        const base =
          validSnapshot();

        const progress =
          base
            .universes[0]
            .progress[0];

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                progress: [
                  progress,
                  progress,
                ],
              },
            ],
          };

        expect(
          () =>
            validator
              .validate(
                snapshot,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject GLOBAL progress with a galaxyIndex',
      () => {
        const base =
          validSnapshot();

        const progress =
          base
            .universes[0]
            .progress[0];

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                progress: [
                  {
                    ...progress,

                    galaxyIndex:
                      '0',
                  },
                ],
              },
            ],
          };

        expect(
          () =>
            validator
              .validate(
                snapshot,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject discoveryPoints above signed Long.MAX_VALUE',
      () => {
        const base =
          validSnapshot();

        const progress =
          base
            .universes[0]
            .progress[0];

        const snapshot =
          {
            ...base,

            universes: [
              {
                ...base
                  .universes[0],

                progress: [
                  {
                    ...progress,

                    discoveryPoints:
                      '9223372036854775808',
                  },
                ],
              },
            ],
          };

        expect(
          () =>
            validator
              .validate(
                snapshot,
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    it(
      'should reject an invalid targetSeed produced by the resolver',
      () => {
        const invalidResolver =
          new GenesisBackupValidator(
            () =>
              'INVALID-TARGET-SEED',
          );

        expect(
          () =>
            invalidResolver
              .validate(
                validSnapshot(),
              ),
        ).toThrow(
          GenesisBackupValidationError,
        );
      },
    );

    function validSnapshot():
      GenesisBackupSnapshot {

      const locator =
        new GalaxyLocator(
          0n,
        );

      const targetSeed =
        syntheticTargetSeed(
          locator,
        );

      return {
        formatVersion:
          BackupFormatVersion.V1.code,

        exportedAtEpochMs:
          4000,

        universes: [
          {
            universeSeed,

            generatorVersionCode:
              1,

            createdAtEpochMs:
              100,

            updatedAtEpochMs:
              200,

            navigation: {
              activeGalaxyIndex:
                '7',

              recentGalaxyIndices:
                [
                  '3',
                  '7',
                ],

              updatedAtEpochMs:
                200,
            },

            galaxies: [
              {
                galaxyIndex:
                  '0',

                discoveryStateCode:
                  2,

                firstKnownAtEpochMs:
                  110,

                updatedAtEpochMs:
                  120,
              },
            ],

            discoveries: [
              {
                targetTypeCode:
                  1,

                targetSeed,

                galaxyIndex:
                  '0',

                sectorKey:
                  null,

                galacticObjectIndex:
                  null,

                bodyIndex:
                  null,

                civilizationIndex:
                  null,

                discoveryStateCode:
                  2,

                firstKnownAtEpochMs:
                  110,

                updatedAtEpochMs:
                  120,
              },
            ],

            observations: [
              {
                id:
                  'observation-1',

                targetTypeCode:
                  1,

                targetSeed,

                observationKind:
                  'test',

                payloadVersion:
                  1,

                payloadJson:
                  '{"signal":true}',

                observedAtEpochMs:
                  130,
              },
            ],

            progress: [
              {
                scopeCode:
                  0,

                scopeKey:
                  'GLOBAL',

                galaxyIndex:
                  null,

                discoveryPoints:
                  '500',

                updatedAtEpochMs:
                  150,
              },

              {
                scopeCode:
                  1,

                scopeKey:
                  '7',

                galaxyIndex:
                  '7',

                discoveryPoints:
                  '125',

                updatedAtEpochMs:
                  160,
              },
            ],
          },
        ],
      };
    }

    function syntheticTargetSeed(
      locator:
        ProceduralLocator,
    ): string {

      const targetType =
        DiscoveryTargetType
          .fromLocator(
            locator,
          );

      let accumulator =
        BigInt(
          targetType.code,
        );

      const mix =
        (
          value:
            bigint,
        ): void => {

          accumulator =
            BigInt.asUintN(
              128,
              (
                accumulator *
                0x100000001B3n
              ) ^
                BigInt.asUintN(
                  64,
                  value,
                ),
            );
        };

      mix(
        locator.galaxyIndex,
      );

      if (
        locator instanceof
        SectorLocator ||
        locator instanceof
        GalacticObjectLocator ||
        locator instanceof
        SystemLocator ||
        locator instanceof
        BodyLocator ||
        locator instanceof
        CivilizationLocator
      ) {
        mix(
          locator.sectorKey,
        );
      }

      if (
        locator instanceof
        GalacticObjectLocator ||
        locator instanceof
        SystemLocator ||
        locator instanceof
        BodyLocator ||
        locator instanceof
        CivilizationLocator
      ) {
        mix(
          locator
            .galacticObjectIndex,
        );
      }

      if (
        locator instanceof
        BodyLocator ||
        locator instanceof
        CivilizationLocator
      ) {
        mix(
          locator.bodyIndex,
        );
      }

      if (
        locator instanceof
        CivilizationLocator
      ) {
        mix(
          locator
            .civilizationIndex,
        );
      }

      return accumulator
        .toString(
          16,
        )
        .padStart(
          32,
          '0',
        )
        .slice(
          -32,
        )
        .toUpperCase();
    }
  },
);