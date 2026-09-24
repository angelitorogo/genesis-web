import { computed, inject, Injectable, signal } from '@angular/core';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { type GalaxyKnownWaterWorldIndex } from '../../domain/exploration/galaxy-known-water-world-index';
import { GalaxyLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalaxyKnownWaterWorldIndexEngine } from '../../simulation/exploration/galaxy-known-water-world-index-engine';
import { GalaxyGeneralProfileEngine } from '../../simulation/exploration/galaxy-general-profile-engine';
import { GENESIS_LOCAL_REPOSITORIES } from '../runtime/genesis-local-repositories';
import {
  isScientificRouteUniverseRef,
  scientificRouteUniverseRef,
} from '../scientific/scientific-route-identity';
import { UniverseSeedFacade } from '../universe/universe-seed.facade';

const SIGNED_LONG_MAX = (1n << 63n) - 1n;

export interface GalaxyWaterWorldIndexModel {
  readonly galaxyIndex: bigint;
  readonly galaxyName: string | null;
  readonly galaxyDesignationCode: string;
  readonly routeUniverseRef: string;
  readonly index: GalaxyKnownWaterWorldIndex;
}

export type GalaxyWaterWorldIndexUiState =
  | Readonly<{ kind: 'loading' }>
  | Readonly<{ kind: 'empty' }>
  | Readonly<{ kind: 'not-found' }>
  | Readonly<{ kind: 'error'; message: string }>
  | Readonly<{ kind: 'content'; model: GalaxyWaterWorldIndexModel }>;

@Injectable({ providedIn: 'root' })
export class GalaxyWaterWorldIndexFacade {
  private readonly repositories = inject(GENESIS_LOCAL_REPOSITORIES);
  private readonly universeSeedFacade = inject(UniverseSeedFacade);
  private readonly stateSignal = signal<GalaxyWaterWorldIndexUiState>({ kind: 'loading' });
  private loadSequence = 0;

  readonly state = this.stateSignal.asReadonly();
  readonly model = computed(() => {
    const state = this.state();
    return state.kind === 'content' ? state.model : null;
  });
  readonly errorMessage = computed(() => {
    const state = this.state();
    return state.kind === 'error' ? state.message : '';
  });

  async load(galaxyIndexValue: string | null, universeRef: string | null): Promise<void> {
    const loadId = ++this.loadSequence;
    this.stateSignal.set({ kind: 'loading' });

    try {
      const galaxyIndex = parseGalaxyIndex(galaxyIndexValue);
      const universes = await this.repositories.universeRepository.getAll();
      if (loadId !== this.loadSequence) return;

      if (universes.length === 0) {
        this.stateSignal.set({ kind: 'empty' });
        return;
      }

      const generationKey = resolveGenerationKey(
        universes,
        universeRef,
        this.universeSeedFacade,
      );

      if (generationKey === null) {
        this.stateSignal.set({
          kind: 'error',
          message: universeRef === null
            ? 'No hay un universo activo seleccionado.'
            : 'La referencia pública de universo no corresponde a una partida persistida.',
        });
        return;
      }

      const galaxyLocator = new GalaxyLocator(galaxyIndex);
      const [galaxyState, knownDiscoveries] = await Promise.all([
        this.repositories.discoveryRepository.getState(generationKey, galaxyLocator),
        this.repositories.discoveryRepository.getKnownDiscoveries(generationKey),
      ]);
      if (loadId !== this.loadSequence) return;

      if (!DiscoveryState.isKnown(galaxyState)) {
        this.stateSignal.set({ kind: 'not-found' });
        return;
      }

      const profile = GalaxyGeneralProfileEngine.build(generationKey, galaxyIndex, galaxyState);
      const index = GalaxyKnownWaterWorldIndexEngine.build(
        generationKey,
        galaxyIndex,
        galaxyState,
        knownDiscoveries,
      );

      if (!this.universeSeedFacade.activeGenerationKey().equals(generationKey)) {
        this.universeSeedFacade.activatePersistedUniverse(generationKey);
      }

      this.stateSignal.set({
        kind: 'content',
        model: Object.freeze({
          galaxyIndex,
          galaxyName: profile.knownName,
          galaxyDesignationCode: profile.designationCode,
          routeUniverseRef: scientificRouteUniverseRef(
            generationKey.universeSeed.serialize(),
            generationKey.generatorVersionCode,
          ),
          index,
        }),
      });
    } catch (error) {
      if (loadId !== this.loadSequence) return;
      this.stateSignal.set({
        kind: 'error',
        message: error instanceof Error && error.message.trim().length > 0
          ? error.message
          : 'No se pudo construir el índice galáctico de mundos acuáticos.',
      });
    }
  }
}

function resolveGenerationKey(
  universes: readonly UniverseGenerationKey[],
  universeRef: string | null,
  universeSeedFacade: UniverseSeedFacade,
): UniverseGenerationKey | null {
  if (universeRef !== null) {
    if (!isScientificRouteUniverseRef(universeRef)) return null;
    return universes.find(candidate =>
      scientificRouteUniverseRef(
        candidate.universeSeed.serialize(),
        candidate.generatorVersionCode,
      ) === universeRef) ?? null;
  }
  return universeSeedFacade.resolvePersistedUniverse(universes);
}

function parseGalaxyIndex(value: string | null): bigint {
  if (value === null || !/^(0|[1-9]\d*)$/.test(value)) {
    throw new RangeError('El índice de galaxia indicado en la ruta no es válido.');
  }
  const result = BigInt(value);
  if (result > SIGNED_LONG_MAX) {
    throw new RangeError('El índice de galaxia excede el rango admitido.');
  }
  return result;
}
