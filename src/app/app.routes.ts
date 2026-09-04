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
    path: 'system/:galaxyIndex/:sectorKey/:galacticObjectIndex',
    loadComponent: () =>
      import(
        './presentation/system/system'
      ).then(
        (module) => module.SystemPage,
      ),
    title: 'Sistema estelar | GENESIS',
  },
  {
    path: 'galaxies/:galaxyIndex',
    loadComponent: () =>
      import(
        './presentation/galaxy-detail/galaxy-detail'
      ).then(
        (module) => module.GalaxyDetailPage,
      ),
    title: 'Ficha general de galaxia | GENESIS',
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
    path: 'observatory/system/:galaxyIndex/:sectorKey/:galacticObjectIndex',
    data: {
      observatoryTargetKind:
        'system',
    },
    loadComponent: () =>
      import(
        './presentation/observatory/observatory'
      ).then(
        (module) => module.Observatory,
      ),
    title: 'Observación de sistema | GENESIS',
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
    path: 'laboratory/galaxies',
    loadComponent: () =>
      import(
        './presentation/laboratory/galaxies/galaxy-laboratory'
      ).then(
        (module) => module.GalaxyLaboratoryPage,
      ),
    title: 'Galaxias | Laboratorios GENESIS',
  },
  {
    path: 'laboratory/galactic-objects',
    loadComponent: () =>
      import(
        './presentation/laboratory/galactic-objects/galactic-object-laboratory'
      ).then(
        (module) => module.GalacticObjectLaboratoryPage,
      ),
    title: 'Objetos galácticos | Laboratorios GENESIS',
  },
  {
    path: 'laboratory/spectroscopy',
    loadComponent: () =>
      import(
        './presentation/spectroscopy-validation/spectroscopy-validation'
      ).then(
        (module) => module.SpectroscopyValidationPage,
      ),
    title: 'Espectroscopía | Laboratorios GENESIS',
  },
  {
    path: 'laboratory/stellar-systems',
    loadComponent: () =>
      import(
        './presentation/laboratory/stellar-systems/stellar-system-laboratory'
      ).then(
        (module) => module.StellarSystemLaboratoryPage,
      ),
    title: 'Sistemas estelares | Laboratorios GENESIS',
  },
  {
    path: 'laboratory/planetary-formation',
    loadComponent: () =>
      import(
        './presentation/laboratory/planetary-formation/planetary-formation-laboratory'
      ).then(
        (module) => module.PlanetaryFormationLaboratoryPage,
      ),
    title: 'Formación planetaria | Laboratorios GENESIS',
  },
  {
    path: 'laboratory',
    loadComponent: () =>
      import(
        './presentation/laboratory/laboratory'
      ).then(
        (module) => module.LaboratoryPage,
      ),
    title: 'Laboratorios | GENESIS',
  },
  {
    path: 'spectroscopy-validation',
    pathMatch: 'full',
    redirectTo: 'laboratory/spectroscopy',
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
