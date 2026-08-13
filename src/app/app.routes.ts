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
        (module) => module.GalaxyMap,
      ),
    title: 'Mapa galáctico | GENESIS',
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
