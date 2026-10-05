import { inject, Injectable, InjectionToken } from '@angular/core';

import {
  type GalaxyKnowledgeCatalogCategory,
  type GalaxyKnowledgeCatalogDataRequest,
  type GalaxyKnowledgeCatalogDataResult,
  type GalaxyKnowledgeCatalogDescriptor,
} from './galaxy-knowledge-catalog.model';
import { GalaxyKnowledgeSystemsCatalogDataSource } from './galaxy-knowledge-systems-catalog.data-source';
import { GalaxyKnowledgePlanetsMoonsCatalogDataSource } from './galaxy-knowledge-planets-moons-catalog.data-source';
import { GalaxyKnowledgeGalacticObjectsCatalogDataSource } from './galaxy-knowledge-galactic-objects-catalog.data-source';
import { GalaxyKnowledgeMinorBodiesCatalogDataSource } from './galaxy-knowledge-minor-bodies-catalog.data-source';

export interface GalaxyKnowledgeCatalogDataSource {
  describe(
    category: GalaxyKnowledgeCatalogCategory,
    subtype: string | null,
  ): GalaxyKnowledgeCatalogDescriptor;

  query(
    request: GalaxyKnowledgeCatalogDataRequest,
  ): Promise<GalaxyKnowledgeCatalogDataResult>;
}

@Injectable({ providedIn: 'root' })
export class PendingGalaxyKnowledgeCatalogDataSource implements GalaxyKnowledgeCatalogDataSource {
  private readonly systems = inject(GalaxyKnowledgeSystemsCatalogDataSource);
  private readonly planetsMoons = inject(GalaxyKnowledgePlanetsMoonsCatalogDataSource);
  private readonly galacticObjects = inject(GalaxyKnowledgeGalacticObjectsCatalogDataSource);
  private readonly minorBodies = inject(GalaxyKnowledgeMinorBodiesCatalogDataSource);

  describe(
    category: GalaxyKnowledgeCatalogCategory,
    subtype: string | null,
  ): GalaxyKnowledgeCatalogDescriptor {
    if (category === 'systems') {
      return this.systems.describe(subtype);
    }

    if (category === 'planets' || category === 'moons') {
      return this.planetsMoons.describe(category, subtype);
    }

    if (category === 'clusters' || category === 'nebulae' || category === 'extremes') {
      return this.galacticObjects.describe(category, subtype);
    }

    if (category === 'asteroids' || category === 'comets' || category === 'tno' || category === 'captured') {
      return this.minorBodies.describe(category, subtype);
    }

    const title = subtype === null
      ? categoryTitle(category)
      : `${categoryTitle(category)} · ${subtype.replaceAll('_', ' ')}`;

    return Object.freeze({
      category,
      title,
      description:
        'Catálogo knowledge-safe preparado para consultar únicamente conocimiento persistido de esta galaxia.',
      identityLabel: 'OBJETO',
      sortOptions: Object.freeze([
        Object.freeze({ key: 'designation', label: 'Nombre / designación' }),
        Object.freeze({ key: 'state', label: 'Estado científico' }),
        Object.freeze({ key: 'locator', label: 'Localización' }),
      ]),
      defaultSortKey: 'designation',
      columns: Object.freeze([]),
    });
  }

  async query(
    request: GalaxyKnowledgeCatalogDataRequest,
  ): Promise<GalaxyKnowledgeCatalogDataResult> {
    if (request.query.category === 'systems') {
      return this.systems.query(request);
    }

    if (request.query.category === 'planets' || request.query.category === 'moons') {
      return this.planetsMoons.query(request);
    }

    if (request.query.category === 'clusters' || request.query.category === 'nebulae' || request.query.category === 'extremes') {
      return this.galacticObjects.query(request);
    }

    if (request.query.category === 'asteroids' || request.query.category === 'comets' || request.query.category === 'tno' || request.query.category === 'captured') {
      return this.minorBodies.query(request);
    }

    return Object.freeze({ kind: 'not-connected' });
  }
}

export const GALAXY_KNOWLEDGE_CATALOG_DATA_SOURCE =
  new InjectionToken<GalaxyKnowledgeCatalogDataSource>(
    'GALAXY_KNOWLEDGE_CATALOG_DATA_SOURCE',
    {
      providedIn: 'root',
      factory: () => inject(PendingGalaxyKnowledgeCatalogDataSource),
    },
  );

function categoryTitle(category: GalaxyKnowledgeCatalogCategory): string {
  switch (category) {
    case 'systems': return 'Sistemas conocidos';
    case 'planets': return 'Planetas conocidos';
    case 'moons': return 'Lunas conocidas';
    case 'clusters': return 'Cúmulos conocidos';
    case 'nebulae': return 'Nebulosas conocidas';
    case 'extremes': return 'Objetos extremos conocidos';
    case 'asteroids': return 'Asteroides conocidos';
    case 'comets': return 'Cometas conocidos';
    case 'tno': return 'Objetos transneptunianos conocidos';
    case 'captured': return 'Objetos capturados conocidos';
  }
}
