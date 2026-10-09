import { KilonovaRemnantKind } from '../../domain/transient/kilonova-event-profile';
import { KilonovaStellarLineageStage } from '../../domain/transient/kilonova-stellar-lineage';
import { KilonovaType } from '../../domain/transient/kilonova-type';
import { type StellarKilonovaScientificSnapshot } from './stellar-kilonova-scientific-integration';

export interface StellarKilonovaScientificEntryModel {
  readonly pairLabel: string;
  readonly typeLabel: string;
  readonly designationLabel: string;
  readonly mergerDelayLabel: string;
  readonly ejectaMassLabel: string;
  readonly rProcessMassLabel: string;
  readonly blueComponentLabel: string;
  readonly redComponentLabel: string;
  readonly remnantLabel: string;
  readonly disruptionLabel: string | null;
}
export interface StellarKilonovaScientificPresentationModel {
  readonly summary: string;
  readonly catalogLabel: string;
  readonly canonicalEventCount: number;
  readonly entries: readonly StellarKilonovaScientificEntryModel[];
}

export class StellarKilonovaScientificPresentationAssembler {
  private constructor() {}
  static build(snapshot: StellarKilonovaScientificSnapshot): StellarKilonovaScientificPresentationModel {
    const entries = snapshot.events.map(event => {
      const p = event.profile;
      return Object.freeze({
        pairLabel: `${event.primaryComponentLabel.name}–${event.secondaryComponentLabel.name}`,
        typeLabel: p.type === KilonovaType.BINARY_NEUTRON_STAR ? 'Fusión NS–NS' : 'Fusión NS–BH con disrupción tidal',
        designationLabel: `${event.primaryDesignation} + ${event.secondaryDesignation}`,
        mergerDelayLabel: formatDurationYears(event.mergerDelayYears),
        ejectaMassLabel: `${scientific(p.totalEjectaMassSolar)} M☉`,
        rProcessMassLabel: `${scientific(p.rProcessMassSolar)} M☉`,
        blueComponentLabel: `${scientific(p.blueEjectaMassSolar)} M☉ · pico ${formatNumber(p.bluePeakTimeDays, 2)} d`,
        redComponentLabel: `${scientific(p.redEjectaMassSolar)} M☉ · pico ${formatNumber(p.redPeakTimeDays, 2)} d`,
        remnantLabel: remnantLabel(p.remnantKind, p.remnantMassSolar),
        disruptionLabel: p.progenitor.tidalDisruptionRatio === null ? null :
          `Rtidal/RISCO ${formatNumber(p.progenitor.tidalDisruptionRatio, 3)} · spin efectivo ${formatNumber(p.progenitor.blackHoleSpinDimensionless ?? 0, 3)}`,
      });
    });
    const event = snapshot.events[0];
    const unresolvedNsBh =
      snapshot.lineage?.stage === KilonovaStellarLineageStage.NS_BH_SPIN_UNRESOLVED;
    return Object.freeze({
      summary: event !== undefined
        ? '1 fusión compacta futura con kilonova físicamente viable'
        : unresolvedNsBh
          ? 'Fusión NS–BH futura dentro del horizonte modelado; la kilonova no puede resolverse sin spin y orientación del agujero negro.'
          : 'No existe un canal de kilonova por fusión compacta dentro del horizonte modelado.',
      catalogLabel: event !== undefined
        ? `Kilonova ${event.profile.type === KilonovaType.BINARY_NEUTRON_STAR ? 'NS–NS' : 'NS–BH'} · ${formatDurationYears(event.mergerDelayYears)}`
        : unresolvedNsBh
          ? 'Candidato NS–BH · spin no resuelto'
          : 'Sin canal de kilonova',
      canonicalEventCount: snapshot.events.length,
      entries: Object.freeze(entries),
    });
  }
}
function remnantLabel(kind: typeof KilonovaRemnantKind[keyof typeof KilonovaRemnantKind], mass: number): string {
  const family = kind === KilonovaRemnantKind.STELLAR_BLACK_HOLE ? 'Agujero negro estelar'
    : kind === KilonovaRemnantKind.HYPERMASSIVE_NEUTRON_STAR ? 'Estrella de neutrones hipermasiva (transitoria)'
      : 'Estrella de neutrones masiva';
  return `${family} · ${formatNumber(mass, 3)} M☉`;
}
function formatDurationYears(years: number): string {
  if (years < 1) return `${formatNumber(years * 365.25, 1)} días`;
  if (years < 1_000) return `${formatNumber(years, 1)} años`;
  if (years < 1_000_000) return `${formatNumber(years / 1_000, 2)} ka`;
  if (years < 1_000_000_000) return `${formatNumber(years / 1_000_000, 2)} Ma`;
  return `${formatNumber(years / 1_000_000_000, 3)} Ga`;
}
function formatNumber(value: number, digits = 3): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value);
}
function scientific(value: number): string { return value.toExponential(2).replace('e+', ' × 10^').replace('e-', ' × 10^-'); }
