import { type UniverseGenerationKey } from '../../../domain/generation/universe-generation-key';

import {
  type GalaxyKnowledgeSnapshotEntity,
} from '../entity/galaxy-knowledge-snapshot.entity';

import {
  type GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';

import {
  generationKeyStorageParts,
} from './local-repository-support';

export interface GalaxyKnowledgeSnapshotRepository {
  get(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    scientificModelVersion: number,
  ): Promise<GalaxyKnowledgeSnapshotEntity | undefined>;

  put(
    entity: GalaxyKnowledgeSnapshotEntity,
  ): Promise<void>;
}

export class DexieGalaxyKnowledgeSnapshotRepository
  implements GalaxyKnowledgeSnapshotRepository {

  constructor(
    private readonly database: GenesisIndexedDb,
  ) {}

  async get(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    scientificModelVersion: number,
  ): Promise<GalaxyKnowledgeSnapshotEntity | undefined> {

    await this.database.openDatabase();

    const {
      universeSeed,
      generatorVersionCode,
    } = generationKeyStorageParts(generationKey);

    return this.database.galaxyKnowledgeSnapshots.get([
      universeSeed,
      generatorVersionCode,
      galaxyIndex.toString(10),
      scientificModelVersion,
    ]);
  }

  async put(
    entity: GalaxyKnowledgeSnapshotEntity,
  ): Promise<void> {

    await this.database.openDatabase();
    await this.database.galaxyKnowledgeSnapshots.put(entity);
  }
}
