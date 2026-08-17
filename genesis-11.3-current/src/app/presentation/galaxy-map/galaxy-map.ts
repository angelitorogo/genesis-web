import {
  ChangeDetectionStrategy,
  Component,
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
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  GenesisScreen,
} from '../../ui/layout/genesis-screen/genesis-screen';

import {
  GalacticMapFacade,
} from './galactic-map.facade';

import {
  GalacticMapScene,
} from './galactic-map-scene';

@Component({
  selector:
    'app-galactic-map-page',

  standalone:
    true,

  imports: [
    GenesisScreen,
    GalacticMapScene,
    RouterLink,
  ],

  templateUrl:
    './galaxy-map.html',

  styleUrl:
    './galaxy-map.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class GalacticMapPage
  implements OnInit {

  readonly facade =
    inject(
      GalacticMapFacade,
    );

  ngOnInit():
    void {

    void this
      .facade
      .refresh();
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

  galaxyTypeLabel(
    galaxyType:
      GalaxyType,
  ): string {

    if (
      galaxyType ===
      GalaxyType.BARRED_SPIRAL
    ) {
      return 'Espiral barrada';
    }

    if (
      galaxyType ===
      GalaxyType.SPIRAL
    ) {
      return 'Espiral';
    }

    if (
      galaxyType ===
      GalaxyType.ELLIPTICAL
    ) {
      return 'Elíptica';
    }

    if (
      galaxyType ===
      GalaxyType.DWARF
    ) {
      return 'Enana';
    }

    if (
      galaxyType ===
      GalaxyType.IRREGULAR
    ) {
      return 'Irregular';
    }

    return 'No determinado';
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
