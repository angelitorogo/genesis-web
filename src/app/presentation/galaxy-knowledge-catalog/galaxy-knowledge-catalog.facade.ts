import { computed, inject, Injectable, signal } from '@angular/core';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GalaxyLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalaxyGeneralProfileEngine } from '../../simulation/exploration/galaxy-general-profile-engine';
import { GENESIS_LOCAL_REPOSITORIES } from '../runtime/genesis-local-repositories';
import {
  isScientificRouteUniverseRef,
  scientificRouteUniverseRef,
} from '../scientific/scientific-route-identity';
import { UniverseSeedFacade } from '../universe/universe-seed.facade';
import { GALAXY_KNOWLEDGE_CATALOG_DATA_SOURCE } from './galaxy-knowledge-catalog.data-source';
import {
  galaxyKnowledgeCatalogCategoryDefinition,
  normalizeGalaxyKnowledgeCatalogQuery,
  type GalaxyKnowledgeCatalogDataResult,
  type GalaxyKnowledgeCatalogDescriptor,
  type GalaxyKnowledgeCatalogPage,
  type GalaxyKnowledgeCatalogQuery,
  type GalaxyKnowledgeCatalogRawQuery,
} from './galaxy-knowledge-catalog.model';

const SIGNED_LONG_MAX = (1n << 63n) - 1n;

export interface GalaxyKnowledgeCatalogModel {
  readonly galaxyIndex: bigint;
  readonly galaxyName: string | null;
  readonly galaxyDesignationCode: string;
  readonly routeUniverseRef: string;
  readonly descriptor: GalaxyKnowledgeCatalogDescriptor;
  readonly query: GalaxyKnowledgeCatalogQuery;
  readonly data: GalaxyKnowledgeCatalogDataResult;
}

export type GalaxyKnowledgeCatalogUiState =
  | Readonly<{ kind: 'loading' }>
  | Readonly<{ kind: 'empty' }>
  | Readonly<{ kind: 'not-found' }>
  | Readonly<{ kind: 'error'; message: string }>
  | Readonly<{ kind: 'content'; model: GalaxyKnowledgeCatalogModel }>;

@Injectable({ providedIn: 'root' })
export class GalaxyKnowledgeCatalogFacade {
  private readonly repositories = inject(GENESIS_LOCAL_REPOSITORIES);
  private readonly universeSeedFacade = inject(UniverseSeedFacade);
  private readonly dataSource = inject(GALAXY_KNOWLEDGE_CATALOG_DATA_SOURCE);
  private readonly stateSignal = signal<GalaxyKnowledgeCatalogUiState>({ kind: 'loading' });
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

  async load(
    galaxyIndexValue: string | null,
    categoryValue: string | null,
    universeRef: string | null,
    rawQuery: GalaxyKnowledgeCatalogRawQuery,
  ): Promise<void> {
    const loadId = ++this.loadSequence;
    this.stateSignal.set({ kind: 'loading' });

    try {
      const galaxyIndex = parseGalaxyIndex(galaxyIndexValue);
      const categoryDefinition = galaxyKnowledgeCatalogCategoryDefinition(categoryValue);
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
      const galaxyState = await this.repositories.discoveryRepository.getState(
        generationKey,
        galaxyLocator,
      );
      if (loadId !== this.loadSequence) return;

      if (!DiscoveryState.isKnown(galaxyState)) {
        this.stateSignal.set({ kind: 'not-found' });
        return;
      }

      const subtype = normalizeSubtypeForDescriptor(rawQuery.subtype);
      const descriptor = this.dataSource.describe(categoryDefinition.category, subtype);
      const query = normalizeGalaxyKnowledgeCatalogQuery(
        categoryDefinition.category,
        descriptor,
        rawQuery,
      );
      const data = normalizeDataResult(
        await this.dataSource.query({
          generationKey,
          galaxyIndex,
          galaxyState,
          query,
        }),
        query,
      );
      if (loadId !== this.loadSequence) return;

      const profile = GalaxyGeneralProfileEngine.build(generationKey, galaxyIndex, galaxyState);
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
          descriptor,
          query,
          data,
        }),
      });
    } catch (error) {
      if (loadId !== this.loadSequence) return;
      this.stateSignal.set({
        kind: 'error',
        message: error instanceof Error && error.message.trim().length > 0
          ? error.message
          : 'No se pudo construir el catálogo de conocimiento galáctico.',
      });
    }
  }
}

function normalizeDataResult(
  result: GalaxyKnowledgeCatalogDataResult,
  query: GalaxyKnowledgeCatalogQuery,
): GalaxyKnowledgeCatalogDataResult {
  if (result.kind !== 'page') return result;
  return Object.freeze({
    kind: 'page',
    page: normalizePage(result.page, query),
  });
}

function normalizePage(
  page: GalaxyKnowledgeCatalogPage,
  query: GalaxyKnowledgeCatalogQuery,
): GalaxyKnowledgeCatalogPage {
  const totalItems = Math.max(0, Math.trunc(page.totalItems));
  const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
  const normalizedPage = Math.min(Math.max(1, Math.trunc(page.page)), totalPages);
  return Object.freeze({
    totalItems,
    page: normalizedPage,
    pageSize: query.pageSize,
    totalPages,
    items: Object.freeze([...page.items]),
  });
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

function normalizeSubtypeForDescriptor(value: string | null): string | null {
  if (value === null) return null;
  const normalized = value.trim().toUpperCase();
  if (normalized.length === 0) return null;
  if (normalized.length > 80 || !/^[A-Z0-9_-]+$/.test(normalized)) {
    throw new RangeError('El subtipo de catálogo indicado no es válido.');
  }
  return normalized;
}
