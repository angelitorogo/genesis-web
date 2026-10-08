import { InjectionToken } from '@angular/core';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieNovaCanonicalEventRepository } from '../../data/local/repository/dexie-nova-canonical-event.repository';
import { type NovaCanonicalEventRepository } from '../../domain/repository/nova-canonical-event-repository';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';

export const NOVA_CANONICAL_EVENT_REPOSITORY =
  new InjectionToken<NovaCanonicalEventRepository>('NOVA_CANONICAL_EVENT_REPOSITORY', {
    providedIn: 'root',
    factory: () => new DexieNovaCanonicalEventRepository(
      new GenesisIndexedDb(),
      {
        resolveTargetSeedNormalized: (generationKey, locator) =>
          ProceduralTargetResolver.resolveTargetSeed(generationKey, locator).normalizedValue,
      },
    ),
  });
