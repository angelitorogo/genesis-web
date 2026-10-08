import { TestBed } from '@angular/core/testing';

import { GENESIS_LOCAL_REPOSITORIES } from '../runtime/genesis-local-repositories';
import { GALAXY_MINOR_BODY_CATALOG_SNAPSHOT_RUNTIME } from '../runtime/galaxy-minor-body-catalog-snapshot.runtime';
import { GALAXY_PLANET_MOON_CATALOG_SNAPSHOT_RUNTIME } from '../runtime/galaxy-planet-moon-catalog-snapshot.runtime';
import { GalaxyKnowledgeGalacticObjectsCatalogDataSource } from './galaxy-knowledge-galactic-objects-catalog.data-source';
import { GalaxyKnowledgeMinorBodiesCatalogDataSource } from './galaxy-knowledge-minor-bodies-catalog.data-source';
import { GalaxyKnowledgePlanetsMoonsCatalogDataSource } from './galaxy-knowledge-planets-moons-catalog.data-source';
import { GalaxyKnowledgeSystemsCatalogDataSource } from './galaxy-knowledge-systems-catalog.data-source';
import { type GalaxyKnowledgeCatalogDescriptor } from './galaxy-knowledge-catalog.model';

function expectConfigurableFieldsMatchSorting(
  descriptor: GalaxyKnowledgeCatalogDescriptor,
): void {
  const configurable = descriptor.fields
    .filter(field => field.role === 'data')
    .map(field => field.key);
  const identityKey = descriptor.fields.find(field => field.role === 'identity')!.key;
  const sortable = descriptor.sortOptions
    .map(option => option.key)
    .filter(key => key !== identityKey);
  expect(sortable).toEqual(configurable);
}

describe('26.1c.8c catalogue configurable-field/sorting registry', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GalaxyKnowledgeSystemsCatalogDataSource,
        GalaxyKnowledgePlanetsMoonsCatalogDataSource,
        GalaxyKnowledgeGalacticObjectsCatalogDataSource,
        GalaxyKnowledgeMinorBodiesCatalogDataSource,
        { provide: GENESIS_LOCAL_REPOSITORIES, useValue: {} },
        { provide: GALAXY_PLANET_MOON_CATALOG_SNAPSHOT_RUNTIME, useValue: {} },
        { provide: GALAXY_MINOR_BODY_CATALOG_SNAPSHOT_RUNTIME, useValue: {} },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('uses exactly the configurable fields as sorting options in every catalogue category', () => {
    const systems = TestBed.inject(GalaxyKnowledgeSystemsCatalogDataSource);
    const planetsMoons = TestBed.inject(GalaxyKnowledgePlanetsMoonsCatalogDataSource);
    const galacticObjects = TestBed.inject(GalaxyKnowledgeGalacticObjectsCatalogDataSource);
    const minorBodies = TestBed.inject(GalaxyKnowledgeMinorBodiesCatalogDataSource);

    const descriptors = Object.freeze([
      systems.describe(null),
      planetsMoons.describe('planets', null),
      planetsMoons.describe('moons', null),
      galacticObjects.describe('clusters', null),
      galacticObjects.describe('nebulae', null),
      galacticObjects.describe('extremes', null),
      minorBodies.describe('asteroids', null),
      minorBodies.describe('comets', null),
      minorBodies.describe('tno', null),
      minorBodies.describe('captured', null),
    ]);

    for (const descriptor of descriptors) {
      expectConfigurableFieldsMatchSorting(descriptor);
      expect(new Set(descriptor.sortOptions.map(option => option.key)).size)
        .toBe(descriptor.sortOptions.length);
    }
  });
});
