import { type CompactMergerProgenitorProfile } from './compact-merger-progenitor';
import { CompactMergerType, type CompactMergerType as CompactMergerTypeValue } from './compact-merger-type';

export const CompactMergerRemnantKind = Object.freeze({
  MASSIVE_NEUTRON_STAR: 'MASSIVE_NEUTRON_STAR',
  HYPERMASSIVE_NEUTRON_STAR: 'HYPERMASSIVE_NEUTRON_STAR',
  STELLAR_BLACK_HOLE: 'STELLAR_BLACK_HOLE',
} as const);
export type CompactMergerRemnantKind = typeof CompactMergerRemnantKind[keyof typeof CompactMergerRemnantKind];

export const CompactMergerCounterpartKind = Object.freeze({
  KILONOVA_EXPECTED: 'KILONOVA_EXPECTED',
  KILONOVA_TIDAL_DISRUPTION_UNRESOLVED: 'KILONOVA_TIDAL_DISRUPTION_UNRESOLVED',
  NO_PROMPT_ELECTROMAGNETIC_COUNTERPART_EXPECTED: 'NO_PROMPT_ELECTROMAGNETIC_COUNTERPART_EXPECTED',
} as const);
export type CompactMergerCounterpartKind = typeof CompactMergerCounterpartKind[keyof typeof CompactMergerCounterpartKind];

export const CompactMergerMassBudgetResolution = Object.freeze({
  NS_NS_KILONOVA_CONSTRAINED: 'NS_NS_KILONOVA_CONSTRAINED',
  BH_SPIN_UNRESOLVED: 'BH_SPIN_UNRESOLVED',
} as const);
export type CompactMergerMassBudgetResolution = typeof CompactMergerMassBudgetResolution[keyof typeof CompactMergerMassBudgetResolution];

/**
 * 29.4 merger facts. Waveform/strain/frequency deliberately remain outside this
 * contract for 29.5. BH-containing channels also keep the final mass unresolved
 * while the Ground Truth has no Kerr spin/orientation model.
 */
export class CompactMergerEventProfile {
  constructor(
    readonly type: CompactMergerTypeValue,
    readonly progenitor: CompactMergerProgenitorProfile,
    readonly totalMassSolar: number,
    readonly chirpMassSolar: number,
    readonly massRatio: number,
    readonly symmetricMassRatio: number,
    readonly counterpartKind: CompactMergerCounterpartKind,
    readonly massBudgetResolution: CompactMergerMassBudgetResolution,
    readonly remnantKind: CompactMergerRemnantKind,
    readonly remnantMassSolar: number | null,
    readonly resolvedMatterEjectaMassSolar: number | null,
    readonly resolvedRadiatedMassSolar: number | null,
  ) {
    for (const [name, value] of Object.entries({ totalMassSolar, chirpMassSolar, massRatio, symmetricMassRatio })) {
      if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be finite and > 0.`);
    }
    if (massRatio > 1 || symmetricMassRatio > 0.25) {
      throw new RangeError('Compact-merger mass ratios are outside their physical bounds.');
    }
    if (type !== progenitor.type ||
        Math.abs(totalMassSolar - progenitor.totalMassSolar) > 1e-10 ||
        Math.abs(chirpMassSolar - progenitor.chirpMassSolar) > 1e-10 ||
        Math.abs(massRatio - progenitor.massRatio) > 1e-10 ||
        Math.abs(symmetricMassRatio - progenitor.symmetricMassRatio) > 1e-10) {
      throw new RangeError('Compact-merger profile must preserve progenitor identity and mass invariants.');
    }

    const allResolved = remnantMassSolar !== null && resolvedMatterEjectaMassSolar !== null && resolvedRadiatedMassSolar !== null;
    if (type === CompactMergerType.NEUTRON_STAR_NEUTRON_STAR) {
      if (counterpartKind !== CompactMergerCounterpartKind.KILONOVA_EXPECTED ||
          massBudgetResolution !== CompactMergerMassBudgetResolution.NS_NS_KILONOVA_CONSTRAINED ||
          !allResolved) {
        throw new RangeError('NS-NS merger must reuse the resolved 29.3 kilonova mass budget.');
      }
      if (remnantMassSolar! <= 0 || resolvedMatterEjectaMassSolar! <= 0 || resolvedRadiatedMassSolar! <= 0) {
        throw new RangeError('Resolved NS-NS merger mass-budget terms must be positive.');
      }
      const accounted = remnantMassSolar! + resolvedMatterEjectaMassSolar! + resolvedRadiatedMassSolar!;
      if (Math.abs(accounted - totalMassSolar) > Math.max(1e-10, totalMassSolar * 1e-8)) {
        throw new RangeError('Resolved compact-merger mass budget must conserve progenitor mass-energy bookkeeping.');
      }
      return;
    }

    const expectedCounterpart = type === CompactMergerType.NEUTRON_STAR_BLACK_HOLE
      ? CompactMergerCounterpartKind.KILONOVA_TIDAL_DISRUPTION_UNRESOLVED
      : CompactMergerCounterpartKind.NO_PROMPT_ELECTROMAGNETIC_COUNTERPART_EXPECTED;
    if (counterpartKind !== expectedCounterpart ||
        massBudgetResolution !== CompactMergerMassBudgetResolution.BH_SPIN_UNRESOLVED ||
        remnantKind !== CompactMergerRemnantKind.STELLAR_BLACK_HOLE) {
      throw new RangeError('BH-containing merger classification is inconsistent with the unresolved Kerr-spin contract.');
    }
    if (remnantMassSolar !== null || resolvedMatterEjectaMassSolar !== null || resolvedRadiatedMassSolar !== null) {
      throw new RangeError('BH-spin-unresolved mergers cannot expose synthetic final-mass/ejecta/radiation values.');
    }
  }
}
