import {
  InjectionToken,
} from '@angular/core';
import {
  GenesisIndexedDb,
} from '../../data/local/indexed-db/genesis-indexed-db';
import {
  DexieSupernovaCanonicalEventRepository,
} from '../../data/local/repository/dexie-supernova-canonical-event.repository';
import {
  type SupernovaCanonicalEventRepository,
} from '../../domain/repository/supernova-canonical-event-repository';
import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

/** Production persistence boundary for 29.1C. No component consumes it until
 * the subsequent integration points deliberately opt into supernova events. */
export const SUPERNOVA_CANONICAL_EVENT_REPOSITORY =
  new InjectionToken<SupernovaCanonicalEventRepository>(
    'SUPERNOVA_CANONICAL_EVENT_REPOSITORY',
    {
      providedIn: 'root',
      factory: () =>
        new DexieSupernovaCanonicalEventRepository(
          new GenesisIndexedDb(),
          {
            resolveTargetSeedNormalized: (generationKey, locator) =>
              ProceduralTargetResolver.resolveTargetSeed(
                generationKey,
                locator,
              ).normalizedValue,
          },
        ),
    },
  );
