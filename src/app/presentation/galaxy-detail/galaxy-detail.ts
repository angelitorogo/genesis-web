import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';

import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';

import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  GalaxyKnowledgeState,
  type GalaxyKnowledgeStateValue,
} from '../../domain/exploration/galaxy-knowledge-state';

import {
  ExternalGalaxyMorphologyHint,
  type ExternalGalaxyMorphologyHint as ExternalGalaxyMorphologyHintValue,
  ExternalGalaxyNuclearActivityHint,
  type ExternalGalaxyNuclearActivityHint as ExternalGalaxyNuclearActivityHintValue,
  ExternalGalaxyScaleHint,
  type ExternalGalaxyScaleHint as ExternalGalaxyScaleHintValue,
  ExternalGalaxyStellarPopulationHint,
  type ExternalGalaxyStellarPopulationHint as ExternalGalaxyStellarPopulationHintValue,
} from '../../domain/observation/galaxy/external-galaxy-preliminary-information';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  GenesisScreen,
} from '../../ui/layout/genesis-screen/genesis-screen';

import {
  GalaxyDetailFacade,
} from './galaxy-detail.facade';

@Component({
  selector:
    'app-galaxy-detail-page',

  standalone:
    true,

  imports: [
    GenesisScreen,
    RouterLink,
  ],

  templateUrl:
    './galaxy-detail.html',

  styleUrl:
    './galaxy-detail.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class GalaxyDetailPage
  implements OnInit {

  readonly facade =
    inject(
      GalaxyDetailFacade,
    );

  private readonly route =
    inject(
      ActivatedRoute,
    );

  ngOnInit():
    void {

    void this
      .facade
      .load(
        this
          .route
          .snapshot
          .paramMap
          .get(
            'galaxyIndex',
          ),
      );
  }

  galaxyStateLabel(
    state:
      GalaxyKnowledgeStateValue,
  ): string {

    if (
      state ===
      GalaxyKnowledgeState.DETECTED
    ) {
      return 'Detectada';
    }

    if (
      state ===
      GalaxyKnowledgeState.DISCOVERED
    ) {
      return 'Descubierta';
    }

    if (
      state ===
      GalaxyKnowledgeState.VISITED
    ) {
      return 'Visitada';
    }

    return 'Desconocida';
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

    return 'Irregular';
  }

  scaleLabel(
    scale:
      ExternalGalaxyScaleHintValue,
  ): string {

    if (
      scale ===
      ExternalGalaxyScaleHint
        .COMPACT
    ) {
      return 'Compacta';
    }

    if (
      scale ===
      ExternalGalaxyScaleHint
        .MEDIUM
    ) {
      return 'Media';
    }

    if (
      scale ===
      ExternalGalaxyScaleHint
        .LARGE
    ) {
      return 'Grande';
    }

    return 'Extendida';
  }

  stellarPopulationLabel(
    population:
      ExternalGalaxyStellarPopulationHintValue,
  ): string {

    if (
      population ===
      ExternalGalaxyStellarPopulationHint
        .LOW
    ) {
      return 'Baja';
    }

    if (
      population ===
      ExternalGalaxyStellarPopulationHint
        .MODERATE
    ) {
      return 'Moderada';
    }

    if (
      population ===
      ExternalGalaxyStellarPopulationHint
        .HIGH
    ) {
      return 'Alta';
    }

    return 'Muy alta';
  }

  nuclearActivityLabel(
    activity:
      ExternalGalaxyNuclearActivityHintValue,
  ): string {

    if (
      activity ===
      ExternalGalaxyNuclearActivityHint
        .NO_CLEAR_ACTIVITY
    ) {
      return 'Sin actividad nuclear clara';
    }

    if (
      activity ===
      ExternalGalaxyNuclearActivityHint
        .ACTIVE_NUCLEUS_CANDIDATE
    ) {
      return 'Candidata a núcleo activo';
    }

    return 'Candidata a actividad nuclear extrema';
  }
}
