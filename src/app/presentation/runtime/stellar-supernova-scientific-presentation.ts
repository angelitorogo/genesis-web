import {
  type SupernovaCanonicalEvent,
  SupernovaCanonicalEventTemporalStatus,
} from '../../domain/transient/supernova-canonical-event';
import {
  SupernovaCompactRemnantKind,
} from '../../domain/transient/supernova-event-profile';
import {
  SupernovaStellarLineageStage,
  type SupernovaStellarLineage,
} from '../../domain/transient/supernova-stellar-lineage';
import {
  SupernovaStellarConsequenceStatus,
  SupernovaStellarDisposition,
  type SupernovaStellarConsequence,
} from '../../domain/transient/supernova-stellar-consequence';
import { SupernovaType } from '../../domain/transient/supernova-type';
import { type StellarSupernovaScientificSnapshot } from './stellar-supernova-scientific-integration';
import { type ArchiveStellarSystemCardModel } from '../genesis-archive/archive-stellar-system-card';

export interface StellarSupernovaScientificEntryModel {
  readonly componentLabel: string;
  readonly stellarDesignation: string;
  readonly lineageLabel: string;
  readonly eventTypeLabel: string;
  readonly temporalLabel: string;
  readonly consequenceLabel: string;
  readonly eventAgeFieldLabel: string;
  readonly eventAgeLabel: string;
  readonly ejectaMassLabel: string;
  readonly remnantMassLabel: string;
  readonly explosionEnergyLabel: string;
  readonly hasCanonicalEvent: boolean;
}

export interface StellarSupernovaScientificPresentationModel {
  readonly summary: string;
  readonly catalogLabel: string;
  readonly canonicalEventCount: number;
  readonly directCollapseCount: number;
  readonly entries: readonly StellarSupernovaScientificEntryModel[];
}

export class StellarSupernovaScientificPresentationAssembler {
  private constructor() {}

  static build(
    snapshot: StellarSupernovaScientificSnapshot,
    stellarSystemCard: ArchiveStellarSystemCardModel | null = null,
  ): StellarSupernovaScientificPresentationModel {
    const eventByComponent = new Map<number, SupernovaCanonicalEvent>(
      snapshot.events.map((event) => [event.componentLabel.code, event]),
    );
    const consequenceByComponent = new Map<number, SupernovaStellarConsequence>(
      snapshot.consequences.map((consequence) => [
        consequence.componentLabel.code,
        consequence,
      ]),
    );

    const relevantLineages = snapshot.lineages.filter((lineage) =>
      lineage.stage !== SupernovaStellarLineageStage.INELIGIBLE,
    );

    const entries = relevantLineages.map((lineage) =>
      entryModel(
        lineage,
        eventByComponent.get(lineage.componentLabel.code) ?? null,
        consequenceByComponent.get(lineage.componentLabel.code) ?? null,
        stellarSystemCard?.components.find(
          component => component.componentLabel === lineage.componentLabel.name,
        ) ?? null,
      ),
    );

    const directCollapseLineages = snapshot.lineages.filter((lineage) =>
      lineage.stage === SupernovaStellarLineageStage.DIRECT_COLLAPSE_NO_SUPERNOVA,
    );
    const directCollapseCount = directCollapseLineages.length;

    return Object.freeze({
      summary: summaryLabel(snapshot.events.length, directCollapseLineages),
      catalogLabel: catalogLabel(snapshot.events, directCollapseCount),
      canonicalEventCount: snapshot.events.length,
      directCollapseCount,
      entries: Object.freeze(entries),
    });
  }
}

function entryModel(
  lineage: SupernovaStellarLineage,
  event: SupernovaCanonicalEvent | null,
  consequence: SupernovaStellarConsequence | null,
  componentCard: ArchiveStellarSystemCardModel['components'][number] | null,
): StellarSupernovaScientificEntryModel {
  if (lineage.stage === SupernovaStellarLineageStage.DIRECT_COLLAPSE_NO_SUPERNOVA) {
    const historical =
      lineage.currentEvolutionState.name ===
      'STELLAR_BLACK_HOLE';

    return Object.freeze({
      componentLabel: lineage.componentLabel.name,
      stellarDesignation: lineage.stellarDesignation,
      lineageLabel: 'Colapso directo',
      eventTypeLabel: 'Sin supernova canónica',
      temporalLabel: historical
        ? 'Colapso directo histórico'
        : 'Colapso directo futuro previsto',
      consequenceLabel: historical
        ? 'Remanente actual: agujero negro estelar'
        : 'Remanente previsto: agujero negro estelar',
      eventAgeFieldLabel: 'Edad del colapso',
      eventAgeLabel: lineage.terminalAgeBillionYears === null
        ? 'Edad terminal no resuelta'
        : `${formatNumber(lineage.terminalAgeBillionYears)} Ga de edad estelar`,
      ejectaMassLabel: 'Sin eyección de supernova modelada',
      remnantMassLabel: directCollapseRemnantMassLabel(componentCard),
      explosionEnergyLabel: 'No aplica',
      hasCanonicalEvent: false,
    });
  }

  if (event === null || consequence === null) {
    throw new RangeError(
      `Scientific supernova lineage ${lineage.componentLabel.name} is missing its canonical event/consequence.`,
    );
  }

  return Object.freeze({
    componentLabel: lineage.componentLabel.name,
    stellarDesignation: event.stellarDesignation,
    lineageLabel: lineageStageLabel(lineage.stage),
    eventTypeLabel: supernovaTypeLabel(event.profile.type),
    temporalLabel: temporalStatusLabel(event),
    consequenceLabel: consequenceLabel(consequence),
    eventAgeFieldLabel: 'Edad del evento',
    eventAgeLabel: event.eventStellarAgeBillionYears === null
      ? 'No resuelta por el modelo binario actual'
      : `${formatNumber(event.eventStellarAgeBillionYears)} Ga de edad estelar`,
    ejectaMassLabel: `${formatNumber(event.profile.ejectaMassSolar)} M☉`,
    remnantMassLabel: remnantMassLabel(consequence),
    explosionEnergyLabel: `${formatNumber(event.profile.explosionEnergyJoules / 1e44)} × 10⁴⁴ J`,
    hasCanonicalEvent: true,
  });
}

function directCollapseRemnantMassLabel(
  componentCard: ArchiveStellarSystemCardModel['components'][number] | null,
): string {
  if (componentCard === null) {
    return 'Determinado por el Ground Truth estelar';
  }

  const mass = componentCard.facts.find(fact =>
    fact.label === 'Masa actual del remanente (estimada)' ||
    fact.label === 'Masa actual del remanente',
  )?.value ?? null;

  return mass !== null && mass.includes('M☉')
    ? `Agujero negro estelar · ${mass}`
    : 'Determinado por el Ground Truth estelar';
}

function lineageStageLabel(stage: SupernovaStellarLineageStage): string {
  switch (stage) {
    case SupernovaStellarLineageStage.FUTURE_CORE_COLLAPSE:
      return 'Progenitor de colapso de núcleo';
    case SupernovaStellarLineageStage.PRE_SUPERNOVA_CORE_COLLAPSE:
      return 'Fase presupernova de colapso de núcleo';
    case SupernovaStellarLineageStage.THERMONUCLEAR_BINARY_CHANNEL:
      return 'Canal termonuclear binario';
    case SupernovaStellarLineageStage.POST_CORE_COLLAPSE_REMNANT:
      return 'Linaje postcolapso';
    case SupernovaStellarLineageStage.DIRECT_COLLAPSE_NO_SUPERNOVA:
      return 'Colapso directo';
    case SupernovaStellarLineageStage.INELIGIBLE:
      return 'Sin canal de supernova';
  }
}

function supernovaTypeLabel(type: SupernovaType): string {
  switch (type) {
    case SupernovaType.TYPE_IA:
      return 'Tipo Ia';
    case SupernovaType.TYPE_II:
      return 'Tipo II';
    case SupernovaType.TYPE_IB:
      return 'Tipo Ib';
    case SupernovaType.TYPE_IC:
      return 'Tipo Ic';
  }
}

function temporalStatusLabel(event: SupernovaCanonicalEvent): string {
  switch (event.temporalStatus) {
    case SupernovaCanonicalEventTemporalStatus.HISTORICAL:
      return 'Evento histórico realizado';
    case SupernovaCanonicalEventTemporalStatus.FUTURE_SCHEDULED:
      return 'Evento futuro previsto por evolución estelar';
    case SupernovaCanonicalEventTemporalStatus.UNRESOLVED_BINARY_DELAY:
      return 'Canal válido · retardo binario no resuelto';
  }
}

function consequenceLabel(consequence: SupernovaStellarConsequence): string {
  if (consequence.disposition === SupernovaStellarDisposition.DESTROYED) {
    return 'Destrucción completa de la enana blanca';
  }

  const remnant = consequence.compactRemnantKind === SupernovaCompactRemnantKind.NEUTRON_STAR
    ? 'estrella de neutrones'
    : 'agujero negro estelar';

  return consequence.status === SupernovaStellarConsequenceStatus.REALIZED_HISTORICAL
    ? `Remanente actual: ${remnant}`
    : `Remanente previsto: ${remnant}`;
}

function remnantMassLabel(consequence: SupernovaStellarConsequence): string {
  if (consequence.disposition === SupernovaStellarDisposition.DESTROYED) {
    return 'Sin remanente compacto';
  }

  return `${formatNumber(consequence.postEventStellarMassSolar)} M☉`;
}

function summaryLabel(
  eventCount: number,
  directCollapseLineages: readonly SupernovaStellarLineage[],
): string {
  if (eventCount === 0 && directCollapseLineages.length === 0) {
    return 'No existe un canal de supernova canónico en las componentes actuales.';
  }

  const pieces: string[] = [];
  if (eventCount > 0) {
    pieces.push(`${eventCount} supernova${eventCount === 1 ? '' : 's'} canónica${eventCount === 1 ? '' : 's'}`);
  }

  const historicalDirectCollapseCount = directCollapseLineages.filter(
    lineage => lineage.currentEvolutionState.name === 'STELLAR_BLACK_HOLE',
  ).length;
  const futureDirectCollapseCount =
    directCollapseLineages.length - historicalDirectCollapseCount;

  if (historicalDirectCollapseCount > 0) {
    pieces.push(
      `${historicalDirectCollapseCount} colapso${historicalDirectCollapseCount === 1 ? '' : 's'} ` +
      `directo${historicalDirectCollapseCount === 1 ? '' : 's'} histórico${historicalDirectCollapseCount === 1 ? '' : 's'}`,
    );
  }
  if (futureDirectCollapseCount > 0) {
    pieces.push(
      `${futureDirectCollapseCount} colapso${futureDirectCollapseCount === 1 ? '' : 's'} ` +
      `directo${futureDirectCollapseCount === 1 ? '' : 's'} futuro${futureDirectCollapseCount === 1 ? '' : 's'} ` +
      `previsto${futureDirectCollapseCount === 1 ? '' : 's'}`,
    );
  }
  return pieces.join(' · ');
}

function catalogLabel(
  events: readonly SupernovaCanonicalEvent[],
  directCollapseCount: number,
): string {
  if (events.length === 0) {
    return directCollapseCount > 0
      ? 'Colapso directo · sin SN'
      : 'Sin canal SN';
  }

  const typeLabels = [...new Set(events.map((event) => shortTypeLabel(event.profile.type)))];
  const temporalStatuses = [...new Set(events.map((event) => event.temporalStatus))];
  const suffix = temporalStatuses.length > 1
    ? 'cronología mixta'
    : temporalStatuses[0] === SupernovaCanonicalEventTemporalStatus.HISTORICAL
      ? 'histórica'
      : temporalStatuses[0] === SupernovaCanonicalEventTemporalStatus.UNRESOLVED_BINARY_DELAY
        ? 'retardo binario'
        : 'futura';
  const directCollapseSuffix = directCollapseCount > 0
    ? ' + colapso directo'
    : '';

  return `${typeLabels.join('/')} · ${suffix}${directCollapseSuffix}`;
}

function shortTypeLabel(type: SupernovaType): string {
  switch (type) {
    case SupernovaType.TYPE_IA:
      return 'Ia';
    case SupernovaType.TYPE_II:
      return 'II';
    case SupernovaType.TYPE_IB:
      return 'Ib';
    case SupernovaType.TYPE_IC:
      return 'Ic';
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 3,
  }).format(value);
}
