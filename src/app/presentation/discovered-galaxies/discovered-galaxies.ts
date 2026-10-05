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
  GalaxyKnowledgeState,
  type GalaxyKnowledgeStateValue,
} from '../../domain/exploration/galaxy-knowledge-state';

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

  readonly galaxyKnowledgeStates =
    GalaxyKnowledgeState
      .values;

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

  focusGalaxy(
    galaxyIndex:
      bigint,
  ): void {

    void this
      .facade
      .focusGalaxy(
        galaxyIndex,
      );
  }

  returnToGalaxy(
    galaxyIndex:
      bigint,
  ): void {

    void this
      .facade
      .returnToRecentGalaxy(
        galaxyIndex,
      );
  }

  isOriginGalaxy(
    galaxyIndex:
      bigint,
  ): boolean {

    return galaxyIndex ===
      0n;
  }

  galaxyStateLabel(
    state:
      GalaxyKnowledgeStateValue,
  ): string {

    if (
      state ===
      GalaxyKnowledgeState.UNKNOWN
    ) {
      return 'Desconocida';
    }

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

    return 'Visitada';
  }

  galaxyStateDescription(
    state:
      GalaxyKnowledgeStateValue,
  ): string {

    if (
      state ===
      GalaxyKnowledgeState.UNKNOWN
    ) {
      return 'Sin detección persistida; todavía no forma parte del catálogo.';
    }

    if (
      state ===
      GalaxyKnowledgeState.DETECTED
    ) {
      return 'Su existencia ha sido detectada; admite información preliminar, pero su nombre propio sigue oculto.';
    }

    if (
      state ===
      GalaxyKnowledgeState.DISCOVERED
    ) {
      return 'La galaxia ya está reconocida como descubrimiento y su identidad procedural pasa a ser conocida.';
    }

    return 'El foco de exploración ha alcanzado esta galaxia al menos una vez.';
  }

  formatExplorationPercentage(
    basisPoints:
      bigint | null,
  ): string {

    if (
      basisPoints ===
      null
    ) {
      return 'Pendiente';
    }

    const integerPart =
      basisPoints /
      100n;

    const decimalPart =
      (
        basisPoints %
        100n
      )
        .toString()
        .padStart(
          2,
          '0',
        );

    return `${integerPart.toString()},${decimalPart} %`;
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
