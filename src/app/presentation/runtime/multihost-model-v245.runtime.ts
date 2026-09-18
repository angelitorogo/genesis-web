import { InjectionToken } from '@angular/core';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieMultihostModelRepositoryV245 } from '../../data/local/repository/dexie-multihost-model.repository-v245';
import { type MultihostModelRepositoryV245 } from '../../domain/repository/multihost-model-repository-v245';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';

export const MULTIHOST_MODEL_REPOSITORY_V245 = new InjectionToken<MultihostModelRepositoryV245>(
  'MULTIHOST_MODEL_REPOSITORY_V245', {
    providedIn: 'root',
    factory: () => new DexieMultihostModelRepositoryV245(new GenesisIndexedDb(), {
      resolveTargetSeedNormalized: (key, locator) =>
        ProceduralTargetResolver.resolveTargetSeed(key, locator).normalizedValue,
    }),
  },
);
