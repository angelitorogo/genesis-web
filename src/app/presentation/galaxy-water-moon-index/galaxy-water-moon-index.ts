import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  type GalaxyKnownWaterMoon,
  type GalaxyKnownWaterMoonSystem,
} from '../../domain/exploration/galaxy-known-water-moon-index';
import { MoonWaterRegime } from '../../domain/planetary/moon-water-regime';
import { GenesisScreen } from '../../ui/layout/genesis-screen/genesis-screen';
import { GalaxyWaterMoonIndexFacade } from './galaxy-water-moon-index.facade';

@Component({
  selector: 'app-galaxy-water-moon-index-page',
  standalone: true,
  imports: [GenesisScreen, RouterLink],
  templateUrl: './galaxy-water-moon-index.html',
  styleUrl: './galaxy-water-moon-index.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalaxyWaterMoonIndexPage implements OnInit {
  readonly facade = inject(GalaxyWaterMoonIndexFacade);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    void this.facade.load(
      this.route.snapshot.paramMap.get('galaxyIndex'),
      this.route.snapshot.queryParamMap.get('u'),
    );
  }

  systemRoute(system: GalaxyKnownWaterMoonSystem): readonly string[] {
    return [
      '/system',
      system.locator.galaxyIndex.toString(),
      system.locator.sectorKey.toString(),
      system.locator.galacticObjectIndex.toString(),
    ];
  }

  moonRoute(moon: GalaxyKnownWaterMoon): readonly string[] {
    return [
      '/system',
      moon.locator.galaxyIndex.toString(),
      moon.locator.sectorKey.toString(),
      moon.locator.galacticObjectIndex.toString(),
      'planet',
      moon.locator.bodyIndex.toString(),
      'moon',
      moon.locator.moonIndex.toString(),
    ];
  }

  queryParams(): Readonly<{ u: string }> | null {
    const model = this.facade.model();
    return model === null ? null : Object.freeze({ u: model.routeUniverseRef });
  }

  surfaceMoons(system: GalaxyKnownWaterMoonSystem): readonly GalaxyKnownWaterMoon[] {
    return system.moons.filter(moon => moon.surfaceLiquidPotentialAtLeast40Percent);
  }

  subsurfaceMoons(system: GalaxyKnownWaterMoonSystem): readonly GalaxyKnownWaterMoon[] {
    return system.moons.filter(moon => moon.subsurfaceOceanEvidence);
  }

  hasSurfaceMoons(system: GalaxyKnownWaterMoonSystem): boolean {
    return system.moons.some(moon => moon.surfaceLiquidPotentialAtLeast40Percent);
  }

  hasSubsurfaceMoons(system: GalaxyKnownWaterMoonSystem): boolean {
    return system.moons.some(moon => moon.subsurfaceOceanEvidence);
  }

  formatCount(value: bigint): string {
    return value.toLocaleString('es-ES');
  }

  hasResults(value: bigint): boolean {
    return value > 0n;
  }

  formatIndex(value: number): string {
    return `${(value * 100).toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })} %`;
  }

  multiplicityLabel(system: GalaxyKnownWaterMoonSystem): string {
    switch (system.multiplicity) {
      case 'SINGLE': return 'SIMPLE';
      case 'BINARY': return 'BINARIO';
      case 'TRIPLE': return 'TRIPLE';
    }
  }

  orbitClassLabel(moon: GalaxyKnownWaterMoon): string {
    switch (moon.orbitClass) {
      case 'SINGLE_HOST': return 'HOST ÚNICO';
      case 'S_TYPE': return `S-TYPE · ESTRELLA ${moon.hostLabel}`;
      case 'P_TYPE': return 'P-TYPE · CIRCUMBINARIO AB';
    }
  }

  waterRegimeLabel(regime: MoonWaterRegime): string {
    switch (regime) {
      case MoonWaterRegime.NONE: return 'SIN AGUA EXPRESADA';
      case MoonWaterRegime.SURFACE_ICE: return 'HIELO SUPERFICIAL';
      case MoonWaterRegime.SUBSURFACE_OCEAN: return 'OCÉANO SUBSUPERFICIAL';
      case MoonWaterRegime.ICE_AND_SUBSURFACE_OCEAN: return 'HIELO + OCÉANO SUBSUPERFICIAL';
      case MoonWaterRegime.SURFACE_LIQUID: return 'AGUA LÍQUIDA SUPERFICIAL';
      case MoonWaterRegime.MIXED: return 'RÉGIMEN MIXTO';
    }
  }

  systemTrackKey(system: GalaxyKnownWaterMoonSystem): string {
    return `${system.locator.sectorKey}:${system.locator.galacticObjectIndex}`;
  }

  moonTrackKey(moon: GalaxyKnownWaterMoon): string {
    return `${moon.locator.bodyIndex}:${moon.locator.moonIndex}`;
  }
}
