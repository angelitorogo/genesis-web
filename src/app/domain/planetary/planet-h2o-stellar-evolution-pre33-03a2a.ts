/** PRE-33.03a.2a: stellar evolutionary stage-aware water forcing, INTERNAL only.
 * A phase boundary from 14.8/15.3 is a model boundary, NOT a dated observed transient.
 * Post-MS radiative histories are declared hypotheses and cannot certify CT-0 water.
 */
import type { PlanetH2OHostSourcePRE3303A2, PlanetH2OHistoricalResultPRE3303A2 } from './planet-h2o-historical-source-pre33-03a2';
import type { StellarEvolutionStateName } from '../stellar/stellar-evolution-state';
import type { H2ODatedHistoryPRE3303A1, H2OEvolutionResultPRE3303A1 } from './planet-h2o-evolution-contract-pre33-03a1';
export const PRE3303A2A_STELLAR_EVOLUTION = 'PRE-33.03a.2a/evolved-stellar-forcing/v1' as const;
export interface PlanetH2OStellarInputPRE3303A2A extends PlanetH2OHostSourcePRE3303A2 {
  readonly stellarState: StellarEvolutionStateName;
  /** Frozen 15.1 ZAMS/reference mass, NOT today's remnant mass. */
  readonly initialMassSolar: number;
  /** Frozen 14.8 / 15.3 post-MS reference interval; null for brown dwarfs. */
  readonly postMainSequenceDurationBillionYears: number | null;
  /** Frozen 15.1 luminosity belongs to its REFERENCE baseline, not to a post-MS stage. */
  readonly luminosityBasis: 'FROZEN_15_1_REFERENCE_NOT_HISTORICAL_TRACK';
}
export type PRE3303A2AStatus =
  | 'MODELED_DATED_CONDITIONAL_MAIN_SEQUENCE'
  | 'MODELED_DATED_CONDITIONAL_GIANT'
  | 'MODELED_DATED_CONDITIONAL_SUPERGIANT'
  | 'MODELED_DATED_CONDITIONAL_WHITE_DWARF'
  | 'UNRESOLVED_BROWN_DWARF_COOLING'
  | 'UNRESOLVED_COMPACT_HIGH_ENERGY_HISTORY'
  | 'UNRESOLVED_STELLAR_SOURCE_OR_TIMELINE'
  | 'UNRESOLVED_MULTIPLE_HOST_GEOMETRY'
  | 'UNRESOLVED_SURFACE_DOMAIN';
export interface PlanetH2OStellarEvolutionResultPRE3303A2A {
  readonly contractVersion: typeof PRE3303A2A_STELLAR_EVOLUTION;
  readonly perspective: 'INTERNAL_SIMULATED_REALITY';
  readonly bodyKey: string;
  readonly stellarLineage: string;
  readonly stellarState: StellarEvolutionStateName;
  readonly status: PRE3303A2AStatus;
  readonly phaseBoundaries: Readonly<{ct0Year: number | null; mainSequenceEndYear: number | null; terminalYear: number | null}>;
  readonly history: H2ODatedHistoryPRE3303A1 | null;
  readonly evolution: H2OEvolutionResultPRE3303A1 | null;
  readonly mainSequenceReference: PlanetH2OHistoricalResultPRE3303A2 | null;
  readonly radiativeModel: 'LEGACY_03A2_MS_XUV' | 'POST_MS_LUMINOSITY_HYPOTHESIS' |
    'WHITE_DWARF_COOLING_HYPOTHESIS' | 'NONE';
  readonly orbitalHistory: 'FROZEN_ORBIT_APPROXIMATION_NOT_MASS_LOSS_EVOLUTION' | 'UNRESOLVED';
  readonly timeline: 'FROZEN_14_8_PHASE_BOUNDARIES_NOT_OBSERVED_TRANSIENTS';
  readonly chronologyPreserved: true;
  readonly observedEvidenceGranted: false;
  readonly ct0Certified: false;
  readonly lifeEvaluated: false;
}
