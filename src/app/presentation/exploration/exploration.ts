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
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  ExternalGalaxyDetectionProbabilityTier,
} from '../../domain/exploration/external-galaxy-detection-probability-profile';

import {
  ExternalGalaxySearchPityStage,
} from '../../domain/exploration/external-galaxy-search-pity-profile';

import {
  ExplorationResultKind,
  type ExplorationSectorResult,
} from '../../domain/exploration/exploration-sector-result';

import {
  ExplorationDetectionKind,
  type ExplorationSectorScanResult,
} from '../../domain/exploration/exploration-sector-scan';

import {
  GalacticObjectLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

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

  styleUrl:
    './exploration.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class Exploration
  implements OnInit {

  readonly facade =
    inject(
      ExplorationFacade,
    );

  ngOnInit():
    void {

    void this
      .facade
      .refresh();
  }

  searchExternalGalaxy():
    void {

    void this
      .facade
      .searchExternalGalaxy();
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

  scanSector(
    sectorX:
      string,

    sectorY:
      string,
  ): void {

    this
      .facade
      .scanSector(
        sectorX,
        sectorY,
      );
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

  detectionLabel(
    kind:
      ExplorationDetectionKind,
  ): string {

    if (
      kind ===
      ExplorationDetectionKind
        .SIGNAL
    ) {
      return 'SEÑAL DETECTADA';
    }

    if (
      kind ===
      ExplorationDetectionKind
        .ANOMALY
    ) {
      return 'ANOMALÍA DETECTADA';
    }

    return 'DETECCIÓN NO VÁLIDA';
  }

  detectionDescription(
    kind:
      ExplorationDetectionKind,
  ): string {

    if (
      kind ===
      ExplorationDetectionKind
        .SIGNAL
    ) {
      return 'El escaneo ha aislado una firma coherente y el análisis operativo ha resuelto un resultado reproducible.';
    }

    return 'El escaneo ha aislado una firma irregular y el análisis operativo ha resuelto un resultado reproducible.';
  }

  preliminaryClassificationLabel(
    result:
      ExplorationSectorScanResult,
  ): string {

    return result
      .isPreliminarilyUnclassified
      ? 'Sin clasificar'
      : 'Estado no válido';
  }

  resultKindLabel(
    kind:
      ExplorationResultKind,
  ): string {

    if (
      kind ===
      ExplorationResultKind
        .SYSTEM
    ) {
      return 'SISTEMA ESTELAR';
    }

    if (
      kind ===
      ExplorationResultKind
        .NEBULA
    ) {
      return 'NEBULOSA';
    }

    if (
      kind ===
      ExplorationResultKind
        .STAR_CLUSTER
    ) {
      return 'CÚMULO ESTELAR';
    }

    if (
      kind ===
      ExplorationResultKind
        .EXTREME_OBJECT
    ) {
      return 'OBJETO EXTREMO';
    }

    return 'EVENTO TRANSITORIO';
  }

  resultHeadline(
    kind:
      ExplorationResultKind,
  ): string {

    if (
      kind ===
      ExplorationResultKind
        .SYSTEM
    ) {
      return 'Sistema localizado en el sector';
    }

    if (
      kind ===
      ExplorationResultKind
        .NEBULA
    ) {
      return 'Firma compatible con una nebulosa';
    }

    if (
      kind ===
      ExplorationResultKind
        .STAR_CLUSTER
    ) {
      return 'Concentración compatible con un cúmulo estelar';
    }

    if (
      kind ===
      ExplorationResultKind
        .EXTREME_OBJECT
    ) {
      return 'Candidato a objeto astrofísico extremo';
    }

    return 'Evento transitorio aislado';
  }

  resultDescription(
    kind:
      ExplorationResultKind,
  ): string {

    if (
      kind ===
      ExplorationResultKind
        .SYSTEM
    ) {
      return 'El contenido procedural del sector contiene una identidad de sistema estelar que ha sido seleccionada como resultado principal de esta exploración.';
    }

    if (
      kind ===
      ExplorationResultKind
        .NEBULA
    ) {
      return 'Una identidad galáctica del sector presenta la familia operativa V1 de nebulosa. La taxonomía científica formal continúa pendiente de observación.';
    }

    if (
      kind ===
      ExplorationResultKind
        .STAR_CLUSTER
    ) {
      return 'Una identidad galáctica del sector presenta la familia operativa V1 de cúmulo estelar. La taxonomía científica formal continúa pendiente de observación.';
    }

    if (
      kind ===
      ExplorationResultKind
        .EXTREME_OBJECT
    ) {
      return 'La firma se asocia a una identidad galáctica marcada como candidata a objeto extremo. Su naturaleza concreta no se afirma todavía.';
    }

    return 'La firma no necesita un objeto estático localizado: se representa mediante el sujeto transitorio ya definido por el modelo observacional de GENESIS.';
  }

  resultSubjectLabel(
    result:
      ExplorationSectorResult,
  ): string {

    return result
      .isTransient
      ? 'Sujeto transitorio'
      : 'Objeto localizado';
  }

  resultIdentity(
    result:
      ExplorationSectorResult,
  ): string {

    const locator =
      result
        .targetLocator;

    if (
      locator instanceof
      SystemLocator
    ) {
      return `SYS-${locator.galacticObjectIndex.toString()}`;
    }

    if (
      locator instanceof
      GalacticObjectLocator
    ) {
      return `OBJ-${locator.galacticObjectIndex.toString()}`;
    }

    const candidateId =
      result
        .transientCandidateId;

    if (
      candidateId !==
      null
    ) {
      return `EVT-${candidateId.index.toString(16).toUpperCase().padStart(16, '0')}`;
    }

    return 'IDENTIDAD NO VÁLIDA';
  }
}
