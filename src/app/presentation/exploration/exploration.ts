import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  RouterLink,
} from '@angular/router';

import {
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  ExternalGalaxyDetectionProbabilityTier,
} from '../../domain/exploration/external-galaxy-detection-probability-profile';

import {
  ExternalGalaxySearchPityStage,
} from '../../domain/exploration/external-galaxy-search-pity-profile';

import {
  ExternalGalaxyMorphologyHint,
  ExternalGalaxyNuclearActivityHint,
  ExternalGalaxyScaleHint,
  ExternalGalaxyStellarPopulationHint,
} from '../../domain/observation/galaxy/external-galaxy-preliminary-information';

import {
  GenesisScreen,
} from '../../ui/layout/genesis-screen/genesis-screen';

import {
  ExplorationFacade,
} from './exploration.facade';

// Immutable presentation-only particles. Never consume the universe seed.
const EXTERNAL_WARP_STREAKS = Object.freeze(
  Array.from({ length: 52 }, (_, id) => Object.freeze({
    id,
    angle: `${(id * 137.50776) % 360}deg`,
    delay: `${-((id * 0.127) % 1.45)}s`,
    duration: `${(0.76 + ((id * 7) % 9) * 0.065).toFixed(3)}s`,
    length: `${16 + (id * 13) % 28}px`,
  })),
);

const EXTERNAL_WARP_MINIMUM_VISIBLE_MS = 1350;


@Component({
  selector:
    'app-exploration',

  standalone:
    true,

  imports: [
    GenesisScreen,
    RouterLink,
  ],

  templateUrl:
    './exploration.html',

  styleUrls: [
    './exploration.scss',
    './exploration-opportunity-toast.scss',
    './exploration-warp.scss',
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class Exploration
  implements OnInit {

  readonly facade =
    inject(
      ExplorationFacade,
    );

  readonly warpStreaks = EXTERNAL_WARP_STREAKS;
  readonly warpActive = signal(false);

  ngOnInit():
    void {

    this.reload();
  }

  reload():
    void {

    void this
      .facade
      .refresh();
  }

  dismissExternalSearchOpportunityNotification():
    void {

    this
      .facade
      .dismissExternalSearchOpportunityNotification();
  }

  searchOpportunityCountLabel(
    count:
      bigint,
  ): string {

    return count ===
      1n
      ? '1 intento disponible'
      : `${count.toString(10)} intentos disponibles`;
  }

  newlyUnlockedSearchOpportunityLabel(
    count:
      bigint,
  ): string {

    return count ===
      1n
      ? 'Has obtenido 1 nuevo intento de búsqueda.'
      : `Has obtenido ${count.toString(10)} nuevos intentos de búsqueda.`;
  }

  searchExternalGalaxy():
    void {
    // One command per click, including the short presentation phase.
    if (this.warpActive() || this.facade.externalSearchPending()) {
      return;
    }
    this.warpActive.set(true);
    void this.runExternalWarpSearch();
  }

  private async runExternalWarpSearch(): Promise<void> {
    const started = performance.now();
    try {
      // The real search is never delayed or replaced with a random animation.
      // A short visual hold makes even indexed sub-second searches legible.
      await this.facade.searchExternalGalaxy();
      const remaining = EXTERNAL_WARP_MINIMUM_VISIBLE_MS -
        (performance.now() - started);
      if (remaining > 0) {
        await new Promise<void>(resolve => setTimeout(resolve, remaining));
      }
    } finally {
      this.warpActive.set(false);
    }
  }

  remainOnCurrentGalaxy():
    void {

    this
      .facade
      .remainOnCurrentGalaxy();
  }

  focusDetectedGalaxy():
    void {

    void this
      .facade
      .focusDetectedGalaxy();
  }

  probabilityPercent(
    probability:
      number,
  ): string {

    const percent =
      probability *
      100;

    return Number.isInteger(
      percent,
    )
      ? `${percent}%`
      : `${percent.toFixed(1)}%`;
  }

  detectionTierLabel(
    tier:
      ExternalGalaxyDetectionProbabilityTier,
  ): string {

    if (
      tier ===
      ExternalGalaxyDetectionProbabilityTier
        .BASELINE
    ) {
      return 'Base';
    }

    if (
      tier ===
      ExternalGalaxyDetectionProbabilityTier
        .ENHANCED
    ) {
      return 'Mejorada';
    }

    if (
      tier ===
      ExternalGalaxyDetectionProbabilityTier
        .ADVANCED
    ) {
      return 'Avanzada';
    }

    if (
      tier ===
      ExternalGalaxyDetectionProbabilityTier
        .DEEP
    ) {
      return 'Profunda';
    }

    return 'Frontera';
  }

  pityStageLabel(
    stage:
      ExternalGalaxySearchPityStage,
  ): string {

    if (
      stage ===
      ExternalGalaxySearchPityStage
        .NONE
    ) {
      return 'Sin asistencia';
    }

    if (
      stage ===
      ExternalGalaxySearchPityStage
        .ASSIST_I
    ) {
      return 'Asistencia I';
    }

    if (
      stage ===
      ExternalGalaxySearchPityStage
        .ASSIST_II
    ) {
      return 'Asistencia II';
    }

    if (
      stage ===
      ExternalGalaxySearchPityStage
        .ASSIST_III
    ) {
      return 'Asistencia III';
    }

    if (
      stage ===
      ExternalGalaxySearchPityStage
        .ASSIST_IV
    ) {
      return 'Asistencia IV';
    }

    return 'Detección garantizada';
  }

  morphologyHintLabel(
    hint:
      ExternalGalaxyMorphologyHint,
  ): string {

    if (
      hint ===
      ExternalGalaxyMorphologyHint
        .DISK_LIKE
    ) {
      return 'Disco galáctico';
    }

    if (
      hint ===
      ExternalGalaxyMorphologyHint
        .SPHEROIDAL
    ) {
      return 'Esferoidal';
    }

    if (
      hint ===
      ExternalGalaxyMorphologyHint
        .IRREGULAR
    ) {
      return 'Irregular';
    }

    return 'Escala enana';
  }

  scaleHintLabel(
    hint:
      ExternalGalaxyScaleHint,
  ): string {

    if (
      hint ===
      ExternalGalaxyScaleHint
        .COMPACT
    ) {
      return 'Compacta';
    }

    if (
      hint ===
      ExternalGalaxyScaleHint
        .MEDIUM
    ) {
      return 'Media';
    }

    if (
      hint ===
      ExternalGalaxyScaleHint
        .LARGE
    ) {
      return 'Grande';
    }

    return 'Extendida';
  }

  stellarPopulationHintLabel(
    hint:
      ExternalGalaxyStellarPopulationHint,
  ): string {

    if (
      hint ===
      ExternalGalaxyStellarPopulationHint
        .LOW
    ) {
      return 'Baja';
    }

    if (
      hint ===
      ExternalGalaxyStellarPopulationHint
        .MODERATE
    ) {
      return 'Moderada';
    }

    if (
      hint ===
      ExternalGalaxyStellarPopulationHint
        .HIGH
    ) {
      return 'Alta';
    }

    return 'Muy alta';
  }

  nuclearActivityHintLabel(
    hint:
      ExternalGalaxyNuclearActivityHint,
  ): string {

    if (
      hint ===
      ExternalGalaxyNuclearActivityHint
        .NO_CLEAR_ACTIVITY
    ) {
      return 'Sin actividad nuclear clara';
    }

    if (
      hint ===
      ExternalGalaxyNuclearActivityHint
        .ACTIVE_NUCLEUS_CANDIDATE
    ) {
      return 'Candidata a núcleo activo';
    }

    return 'Candidata a actividad nuclear extrema';
  }

  discoveryStateLabel(
    state:
      DiscoveryStateValue,
  ): string {

    switch (
      state.code
    ) {
      case 1:
        return 'Detectada';

      case 2:
        return 'Descubierta';

      case 3:
        return 'Visitada';

      case 4:
        return 'Catalogada';

      case 5:
        return 'Confirmada';

      default:
        return 'Estado no válido';
    }
  }
}
