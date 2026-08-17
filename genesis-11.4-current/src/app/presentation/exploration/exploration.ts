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
