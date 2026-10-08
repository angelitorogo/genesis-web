import { type NovaCanonicalEvent } from '../../domain/transient/nova-canonical-event';
import { NovaStellarLineageStage } from '../../domain/transient/nova-stellar-lineage';
import { NovaType } from '../../domain/transient/nova-type';
import { type StellarNovaScientificSnapshot } from './stellar-nova-scientific-integration';

export interface StellarNovaScientificEntryModel {
  readonly componentLabel: string;
  readonly donorComponentLabel: string;
  readonly stellarDesignation: string;
  readonly typeLabel: string;
  readonly lineageLabel: string;
  readonly recurrenceLabel: string;
  readonly previousEruptionLabel: string;
  readonly nextEruptionLabel: string;
  readonly whiteDwarfMassLabel: string;
  readonly accretionRateLabel: string;
  readonly ejectaMassLabel: string;
  readonly velocityLabel: string;
  readonly consequenceLabel: string;
}

export interface StellarNovaScientificPresentationModel {
  readonly summary: string;
  readonly catalogLabel: string;
  readonly canonicalEventCount: number;
  readonly entries: readonly StellarNovaScientificEntryModel[];
}

export class StellarNovaScientificPresentationAssembler {
  private constructor() {}

  static build(snapshot: StellarNovaScientificSnapshot): StellarNovaScientificPresentationModel {
    const eligible = snapshot.lineages.filter(lineage => lineage.stage !== NovaStellarLineageStage.INELIGIBLE);
    const eventsByComponent = new Map(snapshot.events.map(event => [event.componentLabel.code, event] as const));
    const consequencesByComponent = new Map(snapshot.consequences.map(item => [item.componentLabel.code, item] as const));
    const entries = eligible.map(lineage => {
      const event = eventsByComponent.get(lineage.componentLabel.code);
      const consequence = consequencesByComponent.get(lineage.componentLabel.code);
      if (event === undefined || consequence === undefined) {
        throw new RangeError(`Nova lineage ${lineage.componentLabel.name} is missing canonical event/consequence.`);
      }
      return entry(event, consequence.whiteDwarfSurvives);
    });

    return Object.freeze({
      summary: entries.length === 0
        ? 'No existe un canal de nova termonuclear en las componentes actuales.'
        : `${entries.length} canal${entries.length === 1 ? '' : 'es'} de nova termonuclear activo${entries.length === 1 ? '' : 's'}`,
      catalogLabel: catalogLabel(snapshot.events),
      canonicalEventCount: snapshot.events.length,
      entries: Object.freeze(entries),
    });
  }
}

function entry(event: NovaCanonicalEvent, survives: boolean): StellarNovaScientificEntryModel {
  const p = event.profile;
  return Object.freeze({
    componentLabel: event.componentLabel.name,
    donorComponentLabel: event.donorComponentLabel.name,
    stellarDesignation: event.stellarDesignation,
    typeLabel: p.type === NovaType.RECURRENT ? 'Nova recurrente' : 'Nova clásica',
    lineageLabel: p.type === NovaType.RECURRENT
      ? 'Enana blanca acretante · recurrencia corta'
      : 'Enana blanca acretante · nova clásica',
    recurrenceLabel: formatDurationYears(event.recurrenceIntervalYears),
    previousEruptionLabel: relativeEventLabel(
      (event.currentStellarAgeBillionYears - event.previousEruptionStellarAgeBillionYears) * 1e9,
      'Hace',
    ),
    nextEruptionLabel: relativeEventLabel(
      (event.nextEruptionStellarAgeBillionYears - event.currentStellarAgeBillionYears) * 1e9,
      'En',
    ),
    whiteDwarfMassLabel: `${formatNumber(p.progenitor.whiteDwarfMassSolar)} M☉`,
    accretionRateLabel: `${scientific(p.progenitor.effectiveAccretionRateSolarPerYear)} M☉/año`,
    ejectaMassLabel: `${scientific(p.ejectaMassSolar)} M☉`,
    velocityLabel: `${formatNumber(p.characteristicEjectaVelocityKmS, 0)} km/s`,
    consequenceLabel: survives
      ? 'La enana blanca sobrevive; el evento expulsa solo la envoltura acumulada'
      : 'Consecuencia no resuelta',
  });
}

function catalogLabel(events: readonly NovaCanonicalEvent[]): string {
  if (events.length === 0) return 'Sin canal de nova';
  const types = [...new Set(events.map(event => event.profile.type === NovaType.RECURRENT ? 'Recurrente' : 'Clásica'))];
  return `Nova ${types.join('/')} · ${events.length} WD`;
}

function relativeEventLabel(years: number, prefix: 'Hace' | 'En'): string {
  const safe = Math.max(0, years);
  if (safe < 1) return `${prefix} ${formatNumber(safe * 365.25, 1)} días`;
  if (safe < 1_000) return `${prefix} ${formatNumber(safe, 1)} años`;
  if (safe < 1_000_000) return `${prefix} ${formatNumber(safe / 1_000, 2)} ka`;
  return `${prefix} ${formatNumber(safe / 1_000_000, 2)} Ma`;
}

function formatDurationYears(years: number): string {
  if (years < 1000) return `${formatNumber(years, 1)} años`;
  return `${formatNumber(years / 1000, 1)} ka`;
}
function formatNumber(value: number, digits = 3): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value);
}
function scientific(value: number): string {
  return value.toExponential(2).replace('e+', ' × 10^').replace('e-', ' × 10^-');
}
