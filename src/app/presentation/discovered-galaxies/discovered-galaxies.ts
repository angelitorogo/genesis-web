import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  OnInit,
} from '@angular/core';

import {
  RouterLink,
} from '@angular/router';

import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  ExternalGalaxyMorphologyHint,
  type ExternalGalaxyMorphologyHint as ExternalGalaxyMorphologyHintValue,
} from '../../domain/observation/galaxy/external-galaxy-preliminary-information';

import {
  GenesisScreen,
} from '../../ui/layout/genesis-screen/genesis-screen';

import {
  DiscoveredGalaxiesFacade,
} from './discovered-galaxies.facade';

@Component({
  selector:
    'app-discovered-galaxies-page',

  standalone:
    true,

  imports: [
    GenesisScreen,
    RouterLink,
  ],

  templateUrl:
    './discovered-galaxies.html',

  styleUrl:
    './discovered-galaxies.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class DiscoveredGalaxiesPage
  implements OnInit {

  readonly facade =
    inject(
      DiscoveredGalaxiesFacade,
    );

  ngOnInit():
    void {

    void this
      .facade
      .refresh();
  }

  @HostListener(
    'window:focus',
  )
  onWindowFocus():
    void {

    void this
      .facade
      .refresh();
  }

  isOriginGalaxy(
    galaxyIndex:
      bigint,
  ): boolean {

    return galaxyIndex ===
      0n;
  }

  discoveryStateLabel(
    state:
      DiscoveryStateValue,
  ): string {

    const canonical =
      DiscoveryState
        .fromCode(
          state.code,
        );

    if (
      canonical ===
      DiscoveryState.DETECTED
    ) {
      return 'Detectada';
    }

    if (
      canonical ===
      DiscoveryState.DISCOVERED
    ) {
      return 'Descubierta';
    }

    if (
      canonical ===
      DiscoveryState.VISITED
    ) {
      return 'Visitada';
    }

    if (
      canonical ===
      DiscoveryState.CATALOGUED
    ) {
      return 'Catalogada';
    }

    if (
      canonical ===
      DiscoveryState.CONFIRMED
    ) {
      return 'Confirmada';
    }

    return 'Desconocida';
  }

  morphologyLabel(
    morphology:
      ExternalGalaxyMorphologyHintValue,
  ): string {

    if (
      morphology ===
      ExternalGalaxyMorphologyHint
        .DISK_LIKE
    ) {
      return 'Disco galáctico';
    }

    if (
      morphology ===
      ExternalGalaxyMorphologyHint
        .SPHEROIDAL
    ) {
      return 'Esferoidal';
    }

    if (
      morphology ===
      ExternalGalaxyMorphologyHint
        .DWARF_LIKE
    ) {
      return 'Escala enana';
    }

    if (
      morphology ===
      ExternalGalaxyMorphologyHint
        .IRREGULAR
    ) {
      return 'Irregular';
    }

    return 'No determinada';
  }
}
