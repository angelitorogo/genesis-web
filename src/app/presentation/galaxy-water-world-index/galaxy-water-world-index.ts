import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  type GalaxyKnownWaterWorld,
  type GalaxyKnownWaterWorldSystem,
} from '../../domain/exploration/galaxy-known-water-world-index';
import { PlanetType } from '../../domain/planetary/planet-type';
import { GenesisScreen } from '../../ui/layout/genesis-screen/genesis-screen';
import { GalaxyWaterWorldIndexFacade } from './galaxy-water-world-index.facade';

@Component({
  selector: 'app-galaxy-water-world-index-page',
  standalone: true,
  imports: [GenesisScreen, RouterLink],
  templateUrl: './galaxy-water-world-index.html',
  styleUrl: './galaxy-water-world-index.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalaxyWaterWorldIndexPage implements OnInit {
  readonly facade = inject(GalaxyWaterWorldIndexFacade);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    void this.facade.load(
      this.route.snapshot.paramMap.get('galaxyIndex'),
      this.route.snapshot.queryParamMap.get('u'),
    );
  }

  systemRoute(system: GalaxyKnownWaterWorldSystem): readonly string[] {
    return [
      '/system',
      system.locator.galaxyIndex.toString(),
      system.locator.sectorKey.toString(),
      system.locator.galacticObjectIndex.toString(),
    ];
  }

  planetRoute(world: GalaxyKnownWaterWorld): readonly string[] {
    return [
      '/system',
      world.locator.galaxyIndex.toString(),
      world.locator.sectorKey.toString(),
      world.locator.galacticObjectIndex.toString(),
      'planet',
      world.locator.bodyIndex.toString(),
    ];
  }

  queryParams(): Readonly<{ u: string }> | null {
    const model = this.facade.model();
    return model === null ? null : Object.freeze({ u: model.routeUniverseRef });
  }

  formatCount(value: bigint): string {
    return value.toLocaleString('es-ES');
  }

  formatWaterCoverage(value: number): string {
    return `${(value * 100).toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })} %`;
  }

  multiplicityLabel(system: GalaxyKnownWaterWorldSystem): string {
    switch (system.multiplicity) {
      case 'SINGLE': return 'SIMPLE';
      case 'BINARY': return 'BINARIO';
      case 'TRIPLE': return 'TRIPLE';
    }
  }

  planetTypeLabel(type: PlanetType): string {
    switch (type) {
      case PlanetType.ROCKY: return 'ROCOSO';
      case PlanetType.SUPER_EARTH: return 'SUPERTIERRA';
      case PlanetType.DESERT: return 'DESÉRTICO';
      case PlanetType.OCEAN: return 'OCEÁNICO';
      case PlanetType.ICE: return 'HELADO';
      case PlanetType.VOLCANIC: return 'VOLCÁNICO';
      case PlanetType.MINI_NEPTUNE: return 'MININEPTUNO';
      case PlanetType.GAS_GIANT: return 'GIGANTE GASEOSO';
      case PlanetType.ICE_GIANT: return 'GIGANTE HELADO';
    }
  }

  orbitClassLabel(world: GalaxyKnownWaterWorld): string {
    switch (world.orbitClass) {
      case 'SINGLE_HOST': return 'HOST ÚNICO';
      case 'S_TYPE': return `S-TYPE · ESTRELLA ${world.hostLabel}`;
      case 'P_TYPE': return 'P-TYPE · CIRCUMBINARIO AB';
    }
  }

  systemTrackKey(system: GalaxyKnownWaterWorldSystem): string {
    return `${system.locator.sectorKey}:${system.locator.galacticObjectIndex}`;
  }
}
