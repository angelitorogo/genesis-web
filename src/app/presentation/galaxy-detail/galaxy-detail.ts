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
  type GalaxyScientificNucleusStateName,
} from '../../domain/exploration/galaxy-scientific-profile';

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
  GALAXY_CATALOGUE_DISCOVERY_POINT_COST,
  GALAXY_CONFIRM_DISCOVERY_POINT_COST,
} from '../../simulation/exploration/galaxy-scientific-state-transition-engine';


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

  readonly catalogueDiscoveryPointCost =
    GALAXY_CATALOGUE_DISCOVERY_POINT_COST;

  readonly confirmDiscoveryPointCost =
    GALAXY_CONFIRM_DISCOVERY_POINT_COST;

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

  changeFocus():
    void {

    void this
      .facade
      .changeFocusToDisplayedGalaxy();
  }

  validateDetection():
    void {

    void this
      .facade
      .validateDisplayedGalaxyDetection();
  }

  catalogueGalaxy():
    void {

    void this
      .facade
      .catalogueDisplayedGalaxy();
  }

  confirmGalaxy():
    void {

    void this
      .facade
      .confirmDisplayedGalaxy();
  }

  canValidateDetection(
    state:
      DiscoveryStateValue,
  ): boolean {

    return DiscoveryState
      .fromCode(
        state.code,
      ) ===
      DiscoveryState.DETECTED;
  }

  isDiscovered(
    state:
      DiscoveryStateValue,
  ): boolean {

    return DiscoveryState
      .fromCode(
        state.code,
      ) ===
      DiscoveryState.DISCOVERED;
  }

  canEstablishFocus(
    state:
      DiscoveryStateValue,
  ): boolean {

    return DiscoveryState
      .fromCode(
        state.code,
      ).code >=
      DiscoveryState.DISCOVERED.code;
  }

  canCatalogue(
    state:
      DiscoveryStateValue,
  ): boolean {

    return DiscoveryState
      .fromCode(
        state.code,
      ) ===
      DiscoveryState.VISITED;
  }

  canConfirm(
    state:
      DiscoveryStateValue,
  ): boolean {

    return DiscoveryState
      .fromCode(
        state.code,
      ) ===
      DiscoveryState.CATALOGUED;
  }

  canAffordScientificAction(
    globalDiscoveryPoints:
      bigint,

    cost:
      bigint,
  ): boolean {

    return globalDiscoveryPoints >=
      cost;
  }

  missingDiscoveryPoints(
    globalDiscoveryPoints:
      bigint,

    cost:
      bigint,
  ): bigint {

    return globalDiscoveryPoints >=
      cost
      ? 0n
      : cost -
          globalDiscoveryPoints;
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
  formatAgeBillionYears(
    value:
      number,
  ): string {
    return `${formatDecimal(value, 2)} Ga`;
  }

  formatDiameterLightYears(
    value:
      number,
  ): string {
    return `${formatInteger(value)} años luz`;
  }

  formatSolarMasses(
    value:
      number,
  ): string {
    return `${formatScientific(value)} M☉`;
  }

  formatStellarPopulation(
    value:
      bigint,
  ): string {
    return `${new Intl.NumberFormat('es-ES').format(value)} estrellas`;
  }

  formatMetallicitySolarRatio(
    value:
      number,
  ): string {
    return `${formatDecimal(value, 3)} Z☉`;
  }

  formatStarFormationRate(
    value:
      number,
  ): string {
    return `${formatDecimal(value, 3)} M☉/año`;
  }

  formatNormalizedIndex(
    value:
      number,
  ): string {
    return formatDecimal(
      value,
      3,
    );
  }

  formatBigInt(
    value:
      bigint | null,
  ): string {

    if (
      value ===
      null
    ) {
      return '—';
    }

    return new Intl.NumberFormat(
      'es-ES',
    ).format(
      value,
    );
  }

  formatExplorationPercentage(
    basisPoints:
      bigint | null,
  ): string {

    if (
      basisPoints ===
      null
    ) {
      return '—';
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

  nucleusStateLabel(
    stateName:
      GalaxyScientificNucleusStateName,
  ): string {
    if (
      stateName ===
        'QUIESCENT'
    ) {
      return 'Quiescente';
    }

    if (
      stateName ===
        'AGN'
    ) {
      return 'Núcleo galáctico activo (AGN)';
    }

    return 'Cuásar';
  }

}

function formatDecimal(
  value: number,
  maximumFractionDigits: number,
): string {
  return new Intl.NumberFormat(
    'es-ES',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits,
    },
  ).format(
    value,
  );
}

function formatInteger(
  value: number,
): string {
  return new Intl.NumberFormat(
    'es-ES',
    {
      maximumFractionDigits: 0,
    },
  ).format(
    value,
  );
}

function formatScientific(
  value: number,
): string {
  const [
    mantissaRaw,
    exponentRaw,
  ] = value
    .toExponential(
      3,
    )
    .split(
      'e',
    );

  const mantissa =
    Number(
      mantissaRaw,
    );

  const exponent =
    Number(
      exponentRaw,
    );

  return `${formatDecimal(mantissa, 3)} × 10^${exponent}`;
}
