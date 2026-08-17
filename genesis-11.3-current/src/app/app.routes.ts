import { Routes } from '@angular/router';

export const genesisRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import(
        './presentation/home/home'
      ).then(
        (module) => module.Home,
      ),
    title: 'GENESIS',
  },
  {
    path: 'exploration',
    loadComponent: () =>
      import(
        './presentation/exploration/exploration'
      ).then(
        (module) => module.Exploration,
      ),
    title: 'Exploración | GENESIS',
  },
  {
    path: 'galaxy-map',
    loadComponent: () =>
      import(
        './presentation/galaxy-map/galaxy-map'
      ).then(
        (module) => module.GalacticMapPage,
      ),
    title: 'Mapa galáctico | GENESIS',
  },
  {
    path: 'galaxies',
    loadComponent: () =>
      import(
        './presentation/discovered-galaxies/discovered-galaxies'
      ).then(
        (module) => module.DiscoveredGalaxiesPage,
      ),
    title: 'Galaxias descubiertas | GENESIS',
  },
  {
    path: 'archive/system/:galaxyIndex/:sectorKey/:galacticObjectIndex',
    data: {
      archiveDiscoveryLocatorKind:
        'system',
    },
    loadComponent: () =>
      import(
        './presentation/genesis-archive/archive-discovery-detail'
      ).then(
        (module) => module.ArchiveDiscoveryDetail,
      ),
    title: 'Ficha de sistema | Archivo GENESIS',
  },
  {
    path: 'archive/galactic-object/:galaxyIndex/:sectorKey/:galacticObjectIndex',
    data: {
      archiveDiscoveryLocatorKind:
        'galactic-object',
    },
    loadComponent: () =>
      import(
        './presentation/genesis-archive/archive-discovery-detail'
      ).then(
        (module) => module.ArchiveDiscoveryDetail,
      ),
    title: 'Ficha de objeto galáctico | Archivo GENESIS',
  },
  {
    path: 'archive',
    loadComponent: () =>
      import(
        './presentation/genesis-archive/genesis-archive'
      ).then(
        (module) => module.GenesisArchive,
      ),
    title: 'Archivo GENESIS',
  },
  {
    path: 'observatory',
    loadComponent: () =>
      import(
        './presentation/observatory/observatory'
      ).then(
        (module) => module.Observatory,
      ),
    title: 'Observatorio | GENESIS',
  },
  {
    path: 'statistics',
    loadComponent: () =>
      import(
        './presentation/statistics/statistics'
      ).then(
        (module) => module.Statistics,
      ),
    title: 'Estadísticas | GENESIS',
  },
  {
    path: 'settings',
    loadComponent: () =>
      import(
        './presentation/settings/settings'
      ).then(
        (module) => module.Settings,
      ),
    title: 'Ajustes | GENESIS',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
