import { CompactMergerCounterpartKind, CompactMergerMassBudgetResolution, CompactMergerRemnantKind } from '../../domain/transient/compact-merger-event-profile';
import { CompactMergerType } from '../../domain/transient/compact-merger-type';
import { type StellarCompactMergerScientificSnapshot } from './stellar-compact-merger-scientific-integration';

export interface StellarCompactMergerScientificEntryModel {
  readonly pairLabel: string;
  readonly typeLabel: string;
  readonly designationLabel: string;
  readonly mergerDelayLabel: string;
  readonly componentMassesLabel: string;
  readonly totalMassLabel: string;
  readonly chirpMassLabel: string;
  readonly massRatioLabel: string;
  readonly remnantLabel: string;
  readonly counterpartLabel: string;
  readonly massBudgetLabel: string;
}
export interface StellarCompactMergerScientificPresentationModel {
  readonly summary: string;
  readonly catalogLabel: string;
  readonly canonicalEventCount: number;
  readonly entries: readonly StellarCompactMergerScientificEntryModel[];
}

export class StellarCompactMergerScientificPresentationAssembler {
  private constructor() {}
  static build(snapshot: StellarCompactMergerScientificSnapshot): StellarCompactMergerScientificPresentationModel {
    const entries = snapshot.events.map(event => {
      const p = event.profile; const g = p.progenitor;
      return Object.freeze({
        pairLabel: `${event.primaryComponentLabel.name}–${event.secondaryComponentLabel.name}`,
        typeLabel: typeLabel(p.type),
        designationLabel: `${event.primaryDesignation} + ${event.secondaryDesignation}`,
        mergerDelayLabel: formatDurationYears(event.mergerDelayYears),
        componentMassesLabel: `${formatNumber(g.primaryMassSolar, 3)} + ${formatNumber(g.secondaryMassSolar, 3)} M☉`,
        totalMassLabel: `${formatNumber(p.totalMassSolar, 3)} M☉`,
        chirpMassLabel: `${formatNumber(p.chirpMassSolar, 3)} M☉`,
        massRatioLabel: `q ${formatNumber(p.massRatio, 3)} · η ${formatNumber(p.symmetricMassRatio, 4)}`,
        remnantLabel: remnantLabel(p.remnantKind, p.remnantMassSolar),
        counterpartLabel: counterpartLabel(p.counterpartKind),
        massBudgetLabel: p.massBudgetResolution === CompactMergerMassBudgetResolution.NS_NS_KILONOVA_CONSTRAINED
          ? `Resuelto · ejecta ${scientific(p.resolvedMatterEjectaMassSolar!)} M☉ · masa radiada ${scientific(p.resolvedRadiatedMassSolar!)} M☉`
          : 'Masa final no resuelta: falta spin/orientación Kerr. 29.4 no inventa esos parámetros.',
      });
    });
    const event = snapshot.events[0];
    return Object.freeze({
      summary: event === undefined
        ? 'No existe una fusión NS–NS, NS–BH o BH–BH dentro del horizonte temporal modelado.'
        : `1 fusión compacta futura canónica (${shortType(event.profile.type)}). La forma de onda queda reservada para 29.5.`,
      catalogLabel: event === undefined ? 'Sin fusión compacta' : `Fusión ${shortType(event.profile.type)} · ${formatDurationYears(event.mergerDelayYears)}`,
      canonicalEventCount: snapshot.events.length,
      entries: Object.freeze(entries),
    });
  }
}
function shortType(type: typeof CompactMergerType[keyof typeof CompactMergerType]): string {
  return type === CompactMergerType.NEUTRON_STAR_NEUTRON_STAR ? 'NS–NS'
    : type === CompactMergerType.NEUTRON_STAR_BLACK_HOLE ? 'NS–BH' : 'BH–BH';
}
function typeLabel(type: typeof CompactMergerType[keyof typeof CompactMergerType]): string {
  return type === CompactMergerType.NEUTRON_STAR_NEUTRON_STAR ? 'Fusión de dos estrellas de neutrones'
    : type === CompactMergerType.NEUTRON_STAR_BLACK_HOLE ? 'Fusión estrella de neutrones–agujero negro' : 'Fusión de dos agujeros negros';
}
function remnantLabel(kind: typeof CompactMergerRemnantKind[keyof typeof CompactMergerRemnantKind], mass: number | null): string {
  const family = kind === CompactMergerRemnantKind.STELLAR_BLACK_HOLE ? 'Agujero negro estelar'
    : kind === CompactMergerRemnantKind.HYPERMASSIVE_NEUTRON_STAR ? 'Estrella de neutrones hipermasiva (transitoria)'
      : 'Estrella de neutrones masiva';
  return mass === null ? `${family} · masa final no resuelta` : `${family} · ${formatNumber(mass, 3)} M☉`;
}
function counterpartLabel(kind: typeof CompactMergerCounterpartKind[keyof typeof CompactMergerCounterpartKind]): string {
  if (kind === CompactMergerCounterpartKind.KILONOVA_EXPECTED) return 'Kilonova asociada (29.3)';
  if (kind === CompactMergerCounterpartKind.KILONOVA_TIDAL_DISRUPTION_UNRESOLVED) return 'Kilonova condicionada a disrupción tidal; spin/orientación no resueltos';
  return 'Sin contraparte electromagnética prompt esperada en el modelo';
}
function formatDurationYears(years: number): string {
  if (years < 1) return `${formatNumber(years * 365.25, 1)} días`;
  if (years < 1_000) return `${formatNumber(years, 1)} años`;
  if (years < 1_000_000) return `${formatNumber(years / 1_000, 2)} ka`;
  if (years < 1_000_000_000) return `${formatNumber(years / 1_000_000, 2)} Ma`;
  return `${formatNumber(years / 1_000_000_000, 3)} Ga`;
}
function formatNumber(value: number, digits = 3): string { return new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value); }
function scientific(value: number): string { return value.toExponential(2).replace('e+', ' × 10^').replace('e-', ' × 10^-'); }
