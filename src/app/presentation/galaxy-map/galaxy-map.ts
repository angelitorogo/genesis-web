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
  ExplorationResultKind,
  type ExplorationSectorResult,
} from '../../domain/exploration/exploration-sector-result';

import {
  ExplorationDetectionKind,
} from '../../domain/exploration/exploration-sector-scan';

import {
  GalacticObjectLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

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

import {
  type GalacticMapSectorSelection,
} from './galactic-map-sector-selection';

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

  exploreSector(
    selection:
      GalacticMapSectorSelection,
  ): void {

    void this
      .facade
      .exploreSector(
        selection,
      );
  }

  continueExploring():
    void {

    this
      .facade
      .clearInlineExploration();
  }

  detectionLabel(
    kind:
      ExplorationDetectionKind,
  ): string {

    return kind ===
      ExplorationDetectionKind.SIGNAL
      ? 'SEÑAL DETECTADA'
      : 'ANOMALÍA DETECTADA';
  }

  resultKindLabel(
    kind:
      ExplorationResultKind,
  ): string {

    if (kind === ExplorationResultKind.SYSTEM) {
      return 'SISTEMA ESTELAR';
    }

    if (kind === ExplorationResultKind.NEBULA) {
      return 'NEBULOSA';
    }

    if (kind === ExplorationResultKind.STAR_CLUSTER) {
      return 'CÚMULO ESTELAR';
    }

    if (kind === ExplorationResultKind.EXTREME_OBJECT) {
      return 'OBJETO EXTREMO';
    }

    return 'EVENTO TRANSITORIO';
  }

  resultHeadline(
    kind:
      ExplorationResultKind,
  ): string {

    if (kind === ExplorationResultKind.SYSTEM) {
      return 'Sistema localizado en el sector';
    }

    if (kind === ExplorationResultKind.NEBULA) {
      return 'Firma compatible con una nebulosa';
    }

    if (kind === ExplorationResultKind.STAR_CLUSTER) {
      return 'Concentración compatible con un cúmulo estelar';
    }

    if (kind === ExplorationResultKind.EXTREME_OBJECT) {
      return 'Candidato a objeto astrofísico extremo';
    }

    return 'Evento transitorio aislado';
  }

  resultDescription(
    kind:
      ExplorationResultKind,
  ): string {

    if (kind === ExplorationResultKind.SYSTEM) {
      return 'El contenido procedural del sector contiene una identidad de sistema estelar seleccionada como resultado principal de esta exploración.';
    }

    if (kind === ExplorationResultKind.NEBULA) {
      return 'Una identidad galáctica del sector presenta la familia operativa V1 de nebulosa. La taxonomía científica formal continúa pendiente de observación.';
    }

    if (kind === ExplorationResultKind.STAR_CLUSTER) {
      return 'Una identidad galáctica del sector presenta la familia operativa V1 de cúmulo estelar. La taxonomía científica formal continúa pendiente de observación.';
    }

    if (kind === ExplorationResultKind.EXTREME_OBJECT) {
      return 'La firma se asocia a una identidad galáctica marcada como candidata a objeto extremo. Su naturaleza concreta no se afirma todavía.';
    }

    return 'La firma no necesita un objeto estático localizado: se representa mediante el sujeto transitorio ya definido por el modelo observacional de GENESIS.';
  }

  resultSubjectLabel(
    result:
      ExplorationSectorResult,
  ): string {

    return result.isTransient
      ? 'Sujeto transitorio'
      : 'Objeto localizado';
  }

  resultIdentity(
    result:
      ExplorationSectorResult,
  ): string {

    const locator =
      result.targetLocator;

    if (locator instanceof SystemLocator) {
      return `SYS-${locator.galacticObjectIndex.toString()}`;
    }

    if (locator instanceof GalacticObjectLocator) {
      return `OBJ-${locator.galacticObjectIndex.toString()}`;
    }

    const candidateId =
      result.transientCandidateId;

    return candidateId ===
      null
      ? 'IDENTIDAD NO VÁLIDA'
      : `EVT-${candidateId.index.toString(16).toUpperCase().padStart(16, '0')}`;
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
