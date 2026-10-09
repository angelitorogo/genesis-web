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
    path: 'system/:galaxyIndex/:sectorKey/:galacticObjectIndex/minor-body/:minorBodyKind/:proceduralId',
    loadComponent: () =>
      import(
        './presentation/minor-body-detail/minor-body-detail'
      ).then(
        (module) => module.MinorBodyDetailPage,
      ),
    title: 'Ficha de asteroide / cometa | GENESIS',
  },
  {
    path: 'system/:galaxyIndex/:sectorKey/:galacticObjectIndex/planet/:bodyIndex/moon/:moonIndex',
    loadComponent: () =>
      import(
        './presentation/moon-detail/moon-detail'
      ).then(
        (module) => module.MoonDetailPage,
      ),
    title: 'Ficha de luna | GENESIS',
  },
  {
    path: 'system/:galaxyIndex/:sectorKey/:galacticObjectIndex/planet/:bodyIndex',
    loadComponent: () =>
      import(
        './presentation/planet-detail/planet-detail'
      ).then(
        (module) => module.PlanetDetailPage,
      ),
    title: 'Ficha de planeta | GENESIS',
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
    path: 'galaxies/:galaxyIndex/knowledge/:category',
    loadComponent: () =>
      import(
        './presentation/galaxy-knowledge-catalog/galaxy-knowledge-catalog'
      ).then(
        (module) => module.GalaxyKnowledgeCatalogPage,
      ),
    title: 'Explorador de conocimiento galáctico | GENESIS',
  },
  {
    path: 'galaxies/:galaxyIndex/water-worlds',
    loadComponent: () =>
      import(
        './presentation/galaxy-water-world-index/galaxy-water-world-index'
      ).then(
        (module) => module.GalaxyWaterWorldIndexPage,
      ),
    title: 'Mundos con agua líquida | GENESIS',
  },
  {
    path: 'galaxies/:galaxyIndex/water-moons',
    loadComponent: () =>
      import(
        './presentation/galaxy-water-moon-index/galaxy-water-moon-index'
      ).then(
        (module) => module.GalaxyWaterMoonIndexPage,
      ),
    title: 'Lunas con agua | GENESIS',
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
    path: 'laboratory/stellar-systems/fiche-qa',
    loadComponent: () =>
      import(
        './presentation/laboratory/stellar-systems/fiche-qa/stellar-system-fiche-qa'
      ).then(
        (module) => module.StellarSystemFicheQaPage,
      ),
    title: 'Ficha estrella/sistema 26.2 | QA GENESIS',
  },
  {
    path: 'laboratory/stellar-systems/post-supernova-audit',
    loadComponent: () =>
      import(
        './presentation/laboratory/stellar-systems/post-supernova-audit/post-supernova-audit'
      ).then(
        (module) => module.PostSupernovaAuditPage,
      ),
    title: 'Auditoría post-supernova | Laboratorios GENESIS',
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
    path: 'laboratory/transient-events/supernovae',
    loadComponent: () =>
      import(
        './presentation/laboratory/transient-events/supernovae/supernova-laboratory'
      ).then(
        (module) => module.SupernovaLaboratoryPage,
      ),
    title: 'Supernovas | Laboratorios GENESIS',
  },
  {
    path: 'laboratory/transient-events/novae',
    loadComponent: () =>
      import(
        './presentation/laboratory/transient-events/novae/nova-laboratory'
      ).then(
        (module) => module.NovaLaboratoryPage,
      ),
    title: 'Novas | Laboratorios GENESIS',
  },
  {
    path: 'laboratory/transient-events/kilonovae',
    loadComponent: () =>
      import(
        './presentation/laboratory/transient-events/kilonovae/kilonova-laboratory'
      ).then(
        (module) => module.KilonovaLaboratoryPage,
      ),
    title: 'Kilonovas | Laboratorios GENESIS',
  },
  {
    path: 'laboratory/transient-events/compact-mergers',
    loadComponent: () =>
      import(
        './presentation/laboratory/transient-events/compact-mergers/compact-merger-laboratory'
      ).then(
        (module) => module.CompactMergerLaboratoryPage,
      ),
    title: 'Fusiones compactas | Laboratorios GENESIS',
  },
  {
    path: 'laboratory/transient-events/gravitational-waves',
    loadComponent: () =>
      import(
        './presentation/laboratory/transient-events/gravitational-waves/gravitational-wave-laboratory'
      ).then(
        (module) => module.GravitationalWaveLaboratoryPage,
      ),
    title: 'Ondas gravitacionales | Laboratorios GENESIS',
  },
  {
    path: 'laboratory/transient-events/tidal-disruptions',
    loadComponent: () =>
      import(
        './presentation/laboratory/transient-events/tidal-disruptions/tidal-disruption-laboratory'
      ).then(
        (module) => module.TidalDisruptionLaboratoryPage,
      ),
    title: 'Disrupciones de marea | Laboratorios GENESIS',
  },
  {
    path: 'laboratory/transient-events/gamma-ray-bursts',
    loadComponent: () =>
      import(
        './presentation/laboratory/transient-events/gamma-ray-bursts/gamma-ray-burst-laboratory'
      ).then(
        (module) => module.GammaRayBurstLaboratoryPage,
      ),
    title: 'Estallidos de rayos gamma | Laboratorios GENESIS',
  },
  {
    path: 'laboratory/transient-events/fast-radio-bursts',
    loadComponent: () =>
      import(
        './presentation/laboratory/transient-events/fast-radio-bursts/fast-radio-burst-laboratory'
      ).then(
        (module) => module.FastRadioBurstLaboratoryPage,
      ),
    title: 'Fast Radio Bursts | Laboratorios GENESIS',
  },
  {
    path: 'laboratory/transient-events/great-stellar-flares',
    loadComponent: () =>
      import(
        './presentation/laboratory/transient-events/great-stellar-flares/great-stellar-flare-laboratory'
      ).then(
        (module) => module.GreatStellarFlareLaboratoryPage,
      ),
    title: 'Grandes llamaradas estelares | Laboratorios GENESIS',
  },
  {
    path: 'laboratory/transient-events/follow-up',
    loadComponent: () =>
      import(
        './presentation/laboratory/transient-events/follow-up/transient-follow-up-laboratory'
      ).then(
        (module) => module.TransientFollowUpLaboratoryPage,
      ),
    title: 'Seguimiento de transitorios | Laboratorios GENESIS',
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
    path: 'codes',
    loadComponent: () =>
      import('./presentation/codes/codes').then((module) => module.CodesPage),
    title: 'Códigos | GENESIS',
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
