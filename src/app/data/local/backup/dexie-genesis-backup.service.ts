import {
  BackupFormatVersion,
  type GenesisBackupPort,
  type GenesisBackupSnapshot,
  type UniverseBackupSnapshot,
} from '../../../domain/backup/genesis-backup';

import {
  type DiscoveryEntity,
} from '../entity/discovery.entity';

import {
  type GalaxyEntity,
} from '../entity/galaxy.entity';

import {
  type ObservationEntity,
} from '../entity/observation.entity';

import {
  type ProgressEntity,
} from '../entity/progress.entity';

import {
  type UniverseNavigationEntity,
} from '../entity/universe-navigation.entity';

import {
  type UniverseEntity,
} from '../entity/universe.entity';

import {
  type GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';

import {
  GenesisBackupValidationError,
  GenesisBackupValidator,
  type BackupTargetSeedResolver,
} from './genesis-backup-validator';

import {
  DiscoveryTargetType,
} from '../../../domain/discovery/discovery-target-type';

export class DexieGenesisBackupService
  implements GenesisBackupPort {

  private readonly validator:
    GenesisBackupValidator;

  constructor(
    private readonly database:
      GenesisIndexedDb,

    resolveTargetSeed:
      BackupTargetSeedResolver,

    private readonly clock:
      () => number =
        Date.now,
  ) {
    this.validator =
      new GenesisBackupValidator(
        resolveTargetSeed,
      );
  }

  async createSnapshot():
    Promise<GenesisBackupSnapshot> {

    await this.database
      .openDatabase();

    const universeEntities =
      await this.database
        .universes
        .toArray();

    universeEntities.sort(
      (
        left,
        right,
      ) => {
        const seedComparison =
          left.universeSeed
            .localeCompare(
              right.universeSeed,
            );

        if (
          seedComparison !==
          0
        ) {
          return seedComparison;
        }

        return (
          left.generatorVersionCode -
          right.generatorVersionCode
        );
      },
    );

    const universes:
      UniverseBackupSnapshot[] =
      [];

    for (
      const universe
      of universeEntities
    ) {
      universes.push(
        await this.createUniverseSnapshot(
          universe,
        ),
      );
    }

    const snapshot:
      GenesisBackupSnapshot =
      {
        formatVersion:
          BackupFormatVersion.V1.code,

        exportedAtEpochMs:
          this.clock(),

        universes,
      };

    return this.validator
      .validate(
        snapshot,
      );
  }

  async exportJson():
    Promise<string> {

    return JSON.stringify(
      await this.createSnapshot(),
      null,
      2,
    );
  }

  async importJson(
    json:
      string,
  ): Promise<void> {

    let parsed:
      unknown;

    try {
      parsed =
        JSON.parse(
          json,
        );
    } catch {
      throw new GenesisBackupValidationError(
        'Backup JSON is malformed.',
      );
    }

    await this.importSnapshot(
      parsed,
    );
  }

  async importSnapshot(
    snapshot:
      unknown,
  ): Promise<void> {

    const validated =
      this.validator
        .validate(
          snapshot,
        );

    const universes:
      UniverseEntity[] =
      [];

    const navigation:
      UniverseNavigationEntity[] =
      [];

    const galaxies:
      GalaxyEntity[] =
      [];

    const discoveries:
      DiscoveryEntity[] =
      [];

    const observations:
      ObservationEntity[] =
      [];

    const progress:
      ProgressEntity[] =
      [];

    for (
      const universe
      of validated.universes
    ) {
      universes.push({
        universeSeed:
          universe.universeSeed,

        generatorVersionCode:
          universe.generatorVersionCode,

        createdAtEpochMs:
          universe.createdAtEpochMs,

        updatedAtEpochMs:
          universe.updatedAtEpochMs,
      });

      if (
        universe.navigation !==
        null
      ) {
        navigation.push({
          universeSeed:
            universe.universeSeed,

          generatorVersionCode:
            universe.generatorVersionCode,

          activeGalaxyIndex:
            universe.navigation
              .activeGalaxyIndex,

          recentGalaxyIndices:
            [
              ...universe
                .navigation
                .recentGalaxyIndices,
            ],

          updatedAtEpochMs:
            universe.navigation
              .updatedAtEpochMs,
        });
      }

      for (
        const galaxy
        of universe.galaxies
      ) {
        galaxies.push({
          universeSeed:
            universe.universeSeed,

          generatorVersionCode:
            universe.generatorVersionCode,

          galaxyIndex:
            galaxy.galaxyIndex,

          discoveryStateCode:
            galaxy.discoveryStateCode,

          firstKnownAtEpochMs:
            galaxy.firstKnownAtEpochMs,

          updatedAtEpochMs:
            galaxy.updatedAtEpochMs,
        });
      }

      for (
        const discovery
        of universe.discoveries
      ) {
        discoveries.push({
          universeSeed:
            universe.universeSeed,

          generatorVersionCode:
            universe.generatorVersionCode,

          ...discovery,
        });
      }

      for (
        const observation
        of universe.observations
      ) {
        observations.push({
          id:
            observation.id,

          universeSeed:
            universe.universeSeed,

          generatorVersionCode:
            universe.generatorVersionCode,

          targetTypeCode:
            observation.targetTypeCode,

          targetSeed:
            observation.targetSeed,

          observationKind:
            observation.observationKind,

          payloadVersion:
            observation.payloadVersion,

          payloadJson:
            observation.payloadJson,

          observedAtEpochMs:
            observation.observedAtEpochMs,
        });
      }

      for (
        const entry
        of universe.progress
      ) {
        progress.push({
          universeSeed:
            universe.universeSeed,

          generatorVersionCode:
            universe.generatorVersionCode,

          scopeCode:
            entry.scopeCode,

          scopeKey:
            entry.scopeKey,

          galaxyIndex:
            entry.galaxyIndex,

          discoveryPoints:
            entry.discoveryPoints,

          updatedAtEpochMs:
            entry.updatedAtEpochMs,
        });
      }
    }

    await this.database
      .openDatabase();

    await this.database
      .transaction(
        'rw',

        [
          this.database.universes,
          this.database.navigation,
          this.database.galaxies,
          this.database.discoveries,
          this.database.observations,
          this.database.progress,
        ],

        async () => {
          await Promise.all([
            this.database
              .navigation
              .clear(),

            this.database
              .galaxies
              .clear(),

            this.database
              .discoveries
              .clear(),

            this.database
              .observations
              .clear(),

            this.database
              .progress
              .clear(),

            this.database
              .universes
              .clear(),
          ]);

          if (
            universes.length >
            0
          ) {
            await this.database
              .universes
              .bulkPut(
                universes,
              );
          }

          if (
            navigation.length >
            0
          ) {
            await this.database
              .navigation
              .bulkPut(
                navigation,
              );
          }

          if (
            galaxies.length >
            0
          ) {
            await this.database
              .galaxies
              .bulkPut(
                galaxies,
              );
          }

          if (
            discoveries.length >
            0
          ) {
            await this.database
              .discoveries
              .bulkPut(
                discoveries,
              );
          }

          if (
            observations.length >
            0
          ) {
            await this.database
              .observations
              .bulkPut(
                observations,
              );
          }

          if (
            progress.length >
            0
          ) {
            await this.database
              .progress
              .bulkPut(
                progress,
              );
          }
        },
      );
  }

  private async createUniverseSnapshot(
    universe:
      UniverseEntity,
  ): Promise<UniverseBackupSnapshot> {

    const identity =
      [
        universe.universeSeed,
        universe.generatorVersionCode,
      ] as const;

    const navigation =
      await this.database
        .navigation
        .get(
          identity,
        );

    const galaxies =
      await this.database
        .galaxies
        .where(
          '[universeSeed+generatorVersionCode]',
        )
        .equals(
          identity,
        )
        .toArray();

    const discoveries =
      await this.database
        .discoveries
        .where(
          '[universeSeed+generatorVersionCode]',
        )
        .equals(
          identity,
        )
        .toArray();

    const observations =
      await this.database
        .observations
        .where(
          '[universeSeed+generatorVersionCode]',
        )
        .equals(
          identity,
        )
        .toArray();

    const progress =
      await this.database
        .progress
        .where(
          '[universeSeed+generatorVersionCode]',
        )
        .equals(
          identity,
        )
        .toArray();

    galaxies.sort(
      (
        left,
        right,
      ) =>
        compareDecimalLong(
          left.galaxyIndex,
          right.galaxyIndex,
        ),
    );

    discoveries.sort(
      (
        left,
        right,
      ) =>
        (
          left.targetTypeCode -
          right.targetTypeCode
        ) ||
        left.targetSeed
          .localeCompare(
            right.targetSeed,
          ),
    );

    observations.sort(
      (
        left,
        right,
      ) =>
        left.id
          .localeCompare(
            right.id,
          ),
    );

    progress.sort(
      (
        left,
        right,
      ) =>
        (
          left.scopeCode -
          right.scopeCode
        ) ||
        left.scopeKey
          .localeCompare(
            right.scopeKey,
          ),
    );

    return {
      universeSeed:
        universe.universeSeed,

      generatorVersionCode:
        universe.generatorVersionCode,

      createdAtEpochMs:
        universe.createdAtEpochMs,

      updatedAtEpochMs:
        universe.updatedAtEpochMs,

      navigation:
        navigation ===
        undefined
          ? null
          : {
              activeGalaxyIndex:
                navigation
                  .activeGalaxyIndex,

              recentGalaxyIndices:
                [
                  ...navigation
                    .recentGalaxyIndices,
                ],

              updatedAtEpochMs:
                navigation
                  .updatedAtEpochMs,
            },

      galaxies:
        galaxies.map(
          (
            galaxy,
          ) => ({
            galaxyIndex:
              galaxy.galaxyIndex,

            discoveryStateCode:
              galaxy.discoveryStateCode,

            firstKnownAtEpochMs:
              galaxy.firstKnownAtEpochMs,

            updatedAtEpochMs:
              galaxy.updatedAtEpochMs,
          }),
        ),

      discoveries:
  discoveries.map(
    (
      discovery,
    ) => ({
      targetTypeCode:
        DiscoveryTargetType
          .fromCode(
            discovery
              .targetTypeCode,
          )
          .code,

      targetSeed:
        discovery.targetSeed,

      galaxyIndex:
        discovery.galaxyIndex,

      sectorKey:
        discovery.sectorKey,

      galacticObjectIndex:
        discovery
          .galacticObjectIndex,

      bodyIndex:
        discovery.bodyIndex,

      civilizationIndex:
        discovery
          .civilizationIndex,

      discoveryStateCode:
        discovery
          .discoveryStateCode,

      firstKnownAtEpochMs:
        discovery
          .firstKnownAtEpochMs,

      updatedAtEpochMs:
        discovery
          .updatedAtEpochMs,
    }),
  ),

      observations:
  observations.map(
    (
      observation,
    ) => ({
      id:
        observation.id,

      targetTypeCode:
        DiscoveryTargetType
          .fromCode(
            observation
              .targetTypeCode,
          )
          .code,

      targetSeed:
        observation
          .targetSeed,

      observationKind:
        observation
          .observationKind,

      payloadVersion:
        observation
          .payloadVersion,

      payloadJson:
        observation
          .payloadJson,

      observedAtEpochMs:
        observation
          .observedAtEpochMs,
    }),
  ),

      progress:
        progress.map(
          (
            entry,
          ) => ({
            scopeCode:
              entry.scopeCode,

            scopeKey:
              entry.scopeKey,

            galaxyIndex:
              entry.galaxyIndex,

            discoveryPoints:
              entry.discoveryPoints,

            updatedAtEpochMs:
              entry.updatedAtEpochMs,
          }),
        ),
    };
  }
}

function compareDecimalLong(
  left:
    string,

  right:
    string,
): number {

  const leftValue =
    BigInt(
      left,
    );

  const rightValue =
    BigInt(
      right,
    );

  if (
    leftValue <
    rightValue
  ) {
    return -1;
  }

  if (
    leftValue >
    rightValue
  ) {
    return 1;
  }

  return 0;
}