import {
  type UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  type UniverseRepository,
} from '../../../domain/repository/genesis-repositories';

import {
  type UniverseEntity,
} from '../entity/universe.entity';

import {
  type GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';

import {
  generationKeyStorageParts,
  universeEntityToGenerationKey,
} from './local-repository-support';

export class DexieUniverseRepository
  implements UniverseRepository {

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly clock:
      () => number =
        Date.now,
  ) {}

  async createIfAbsent(
  generationKey:
    UniverseGenerationKey,
): Promise<boolean> {

  await this.database
    .openDatabase();

  const {
    universeSeed,
    generatorVersionCode,
  } =
    generationKeyStorageParts(
      generationKey,
    );

  const key =
    [
      universeSeed,
      generatorVersionCode,
    ] as const;

  return this.database
    .transaction(
      'rw',

      this.database.universes,

      async () => {
        const existing =
          await this.database
            .universes
            .get(
              key,
            );

        if (
          existing !==
          undefined
        ) {
          return false;
        }

        const now =
          this.clock();

        const entity:
          UniverseEntity =
          {
            universeSeed,
            generatorVersionCode,

            createdAtEpochMs:
              now,

            updatedAtEpochMs:
              now,
          };

        await this.database
          .universes
          .add(
            entity,
          );

        return true;
      },
    );
}

  async exists(
    generationKey:
      UniverseGenerationKey,
  ): Promise<boolean> {

    await this.database
      .openDatabase();

    const {
      universeSeed,
      generatorVersionCode,
    } =
      generationKeyStorageParts(
        generationKey,
      );

    return (
      await this.database
        .universes
        .get([
          universeSeed,
          generatorVersionCode,
        ])
    ) !==
      undefined;
  }

  async getAll():
    Promise<
      readonly UniverseGenerationKey[]
    > {

    await this.database
      .openDatabase();

    const entities =
      await this.database
        .universes
        .toArray();

    entities.sort(
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

    return entities.map(
      universeEntityToGenerationKey,
    );
  }

  async delete(
    generationKey:
      UniverseGenerationKey,
  ): Promise<boolean> {

    await this.database
      .openDatabase();

    const {
      universeSeed,
      generatorVersionCode,
    } =
      generationKeyStorageParts(
        generationKey,
      );

    const universeKey =
      [
        universeSeed,
        generatorVersionCode,
      ] as const;

    return this.database
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
          const universe =
            await this.database
              .universes
              .get(
                universeKey,
              );

          if (
            universe ===
            undefined
          ) {
            return false;
          }

          await this.database
            .navigation
            .delete(
              universeKey,
            );

          await this.database
            .galaxies
            .where(
              '[universeSeed+generatorVersionCode]',
            )
            .equals([
              universeSeed,
              generatorVersionCode,
            ])
            .delete();

          await this.database
            .discoveries
            .where(
              '[universeSeed+generatorVersionCode]',
            )
            .equals([
              universeSeed,
              generatorVersionCode,
            ])
            .delete();

          await this.database
            .observations
            .where(
              '[universeSeed+generatorVersionCode]',
            )
            .equals([
              universeSeed,
              generatorVersionCode,
            ])
            .delete();

          await this.database
            .progress
            .where(
              '[universeSeed+generatorVersionCode]',
            )
            .equals([
              universeSeed,
              generatorVersionCode,
            ])
            .delete();

          await this.database
            .universes
            .delete(
              universeKey,
            );

          return true;
        },
      );
  }
}