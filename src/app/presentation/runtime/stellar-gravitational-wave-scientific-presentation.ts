import {
  GravitationalWavePostMergerResolution,
} from '../../domain/transient/gravitational-wave-event-profile';
import { CompactMergerType } from '../../domain/transient/compact-merger-type';
import { type StellarGravitationalWaveScientificSnapshot } from './stellar-gravitational-wave-scientific-integration';

export interface StellarGravitationalWaveScientificEntryModel {
  readonly pairLabel: string;
  readonly typeLabel: string;
  readonly designationLabel: string;
  readonly mergerDelayLabel: string;
  readonly chirpMassLabel: string;
  readonly referenceFrequencyLabel: string;
  readonly referenceWavelengthLabel: string;
  readonly iscoFrequencyLabel: string;
  readonly luminosityLabel: string;
  readonly chirpRateLabel: string;
  readonly eccentricityLabel: string;
  readonly observerStrainLabel: string;
  readonly postMergerLabel: string;
}

export interface StellarGravitationalWaveScientificPresentationModel {
  readonly summary: string;
  readonly catalogLabel: string;
  readonly signalCount: number;
  readonly entries: readonly StellarGravitationalWaveScientificEntryModel[];
}

export class StellarGravitationalWaveScientificPresentationAssembler {
  private constructor() {}

  static build(
    snapshot: StellarGravitationalWaveScientificSnapshot,
  ): StellarGravitationalWaveScientificPresentationModel {
    const entries = snapshot.events.map(event => {
      const profile = event.profile;
      return Object.freeze({
        pairLabel: `${event.primaryComponentLabel}–${event.secondaryComponentLabel}`,
        typeLabel: mergerTypeLabel(profile.mergerType),
        designationLabel: `${event.primaryDesignation} + ${event.secondaryDesignation}`,
        mergerDelayLabel: formatDurationYears(event.mergerDelayYears),
        chirpMassLabel: `${formatNumber(profile.chirpMassSolar, 3)} M☉`,
        referenceFrequencyLabel: formatFrequency(profile.referenceQuadrupoleFrequencyHz),
        referenceWavelengthLabel: formatDistance(profile.referenceWavelengthMeters),
        iscoFrequencyLabel: formatFrequency(profile.nonSpinningIscoFrequencyHz),
        luminosityLabel: `${scientific(profile.referenceLuminosityWatts)} W`,
        chirpRateLabel: `${scientific(profile.circularEquivalentChirpRateHzPerSecond)} Hz/s`,
        eccentricityLabel: `e ${formatNumber(profile.referenceEccentricity, 4)} · potencia ×${formatNumber(profile.eccentricPowerEnhancementFactor, 4)}`,
        observerStrainLabel: 'No resuelto: faltan distancia, inclinación, polarización y redshift',
        postMergerLabel: profile.postMergerResolution === GravitationalWavePostMergerResolution.NEUTRON_STAR_EOS_UNRESOLVED
          ? 'Post-fusión NS no resuelta: falta ecuación de estado/remanente dinámico'
          : 'Merger/ringdown no resuelto: faltan masa final y spin Kerr',
      });
    });

    const first = snapshot.events[0];
    return Object.freeze({
      summary: first === undefined
        ? 'No existe una fusión compacta canónica de la que derivar una señal gravitacional.'
        : `1 señal gravitacional intrínseca ${shortType(first.profile.mergerType)} derivada de 29.4; el strain observado permanece sin resolver.`,
      catalogLabel: first === undefined
        ? 'Sin señal GW compacta'
        : `GW ${shortType(first.profile.mergerType)} · ${formatFrequency(first.profile.referenceQuadrupoleFrequencyHz)} → ISCO ${formatFrequency(first.profile.nonSpinningIscoFrequencyHz)}`,
      signalCount: snapshot.events.length,
      entries: Object.freeze(entries),
    });
  }
}

function shortType(type: typeof CompactMergerType[keyof typeof CompactMergerType]): string {
  return type === CompactMergerType.NEUTRON_STAR_NEUTRON_STAR ? 'NS–NS'
    : type === CompactMergerType.NEUTRON_STAR_BLACK_HOLE ? 'NS–BH' : 'BH–BH';
}
function mergerTypeLabel(type: typeof CompactMergerType[keyof typeof CompactMergerType]): string {
  return type === CompactMergerType.NEUTRON_STAR_NEUTRON_STAR ? 'Ondas gravitacionales · fusión NS–NS'
    : type === CompactMergerType.NEUTRON_STAR_BLACK_HOLE ? 'Ondas gravitacionales · fusión NS–BH'
      : 'Ondas gravitacionales · fusión BH–BH';
}
function formatDurationYears(years: number): string {
  if (years < 1) return `${formatNumber(years * 365.25, 1)} días`;
  if (years < 1_000) return `${formatNumber(years, 1)} años`;
  if (years < 1_000_000) return `${formatNumber(years / 1_000, 2)} ka`;
  if (years < 1_000_000_000) return `${formatNumber(years / 1_000_000, 2)} Ma`;
  return `${formatNumber(years / 1_000_000_000, 3)} Ga`;
}
function formatFrequency(value: number): string {
  if (value >= 1_000) return `${formatNumber(value / 1_000, 3)} kHz`;
  if (value >= 1) return `${formatNumber(value, 3)} Hz`;
  if (value >= 1e-3) return `${formatNumber(value * 1e3, 3)} mHz`;
  return `${formatNumber(value * 1e6, 3)} µHz`;
}
function formatDistance(meters: number): string {
  const au = meters / 149_597_870_700;
  if (au >= 0.01) return `${formatNumber(au, 3)} UA`;
  if (meters >= 1e9) return `${formatNumber(meters / 1e9, 3)} Gm`;
  if (meters >= 1e6) return `${formatNumber(meters / 1e6, 3)} Mm`;
  return `${formatNumber(meters / 1e3, 3)} km`;
}
function formatNumber(value: number, digits = 3): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value);
}
function scientific(value: number): string {
  return value.toExponential(2).replace('e+', ' × 10^').replace('e-', ' × 10^-');
}
