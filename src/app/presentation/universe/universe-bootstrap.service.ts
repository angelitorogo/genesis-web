import {
  inject,
  Injectable,
} from '@angular/core';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';
import { GeneratorVersion } from '../../domain/generation/generator-version';

import {
  InitialExplorationStateGenerator,
} from '../../simulation/exploration/initial-exploration-state-generator';

import {
  GENESIS_LOCAL_REPOSITORIES,
} from '../runtime/genesis-local-repositories';

export interface UniverseBootstrapResult {
  readonly generationKey:
    UniverseGenerationKey;

  readonly created:
    boolean;
}

@Injectable({
  providedIn:
    'root',
})
export class UniverseBootstrapService {

  private readonly repositories =
    inject(
      GENESIS_LOCAL_REPOSITORIES,
    );

  async ensureInitialized(
    generationKey:
      UniverseGenerationKey,
  ): Promise<UniverseBootstrapResult> {

    // Both canonical versions can be created; unknown/forged versions are
    // rejected BEFORE any repository writes. The storage key includes version.
    if (!GeneratorVersion.isReleasedForNewUniverses(generationKey.generatorVersion)) {
      throw new RangeError(
        `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
      );
    }

    const initialState =
      InitialExplorationStateGenerator
        .generate(
          generationKey,
        );

    const created =
      await this
        .repositories
        .universeRepository
        .createIfAbsent(
          generationKey,
        );

    if (
      !created
    ) {
      return Object.freeze({
        generationKey,
        created:
          false,
      });
    }

    try {
      await this
        .repositories
        .navigationRepository
        .setNavigation(
          generationKey,
          {
            activeGalaxyIndex:
              initialState
                .activeGalaxyIndex,

            recentGalaxyIndices:
              [],
          },
        );

      await this
        .repositories
        .pointsRepository
        .setGlobalDiscoveryPoints(
          generationKey,
          initialState
            .discoveryPoints,
        );

      for (
        const [
          locator,
          state,
        ]
        of initialState
          .knownDiscoveries
          .entries()
      ) {
        await this
          .repositories
          .discoveryRepository
          .setState(
            generationKey,
            locator,
            state,
          );
      }

      return Object.freeze({
        generationKey,
        created:
          true,
      });
    } catch (
      error
    ) {
      try {
        await this
          .repositories
          .universeRepository
          .delete(
            generationKey,
          );
      } catch {
        // Preserve the original bootstrap failure.
      }

      throw error;
    }
  }
}
