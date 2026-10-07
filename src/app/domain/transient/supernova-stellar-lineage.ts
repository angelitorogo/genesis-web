import {
  type StellarEvolutionState,
} from '../stellar/stellar-evolution-state';
import {
  type StellarSystemComponentLabel,
} from '../stellar/stellar-system-component-label';
import {
  type SupernovaEventProfile,
} from './supernova-event-profile';
import {
  type SupernovaProgenitorProfile,
} from './supernova-progenitor';

export const SupernovaStellarLineageStage = Object.freeze({
  INELIGIBLE: 'INELIGIBLE',
  FUTURE_CORE_COLLAPSE: 'FUTURE_CORE_COLLAPSE',
  PRE_SUPERNOVA_CORE_COLLAPSE: 'PRE_SUPERNOVA_CORE_COLLAPSE',
  THERMONUCLEAR_BINARY_CHANNEL: 'THERMONUCLEAR_BINARY_CHANNEL',
  POST_CORE_COLLAPSE_REMNANT: 'POST_CORE_COLLAPSE_REMNANT',
  DIRECT_COLLAPSE_NO_SUPERNOVA: 'DIRECT_COLLAPSE_NO_SUPERNOVA',
} as const);

export type SupernovaStellarLineageStage =
  typeof SupernovaStellarLineageStage[
    keyof typeof SupernovaStellarLineageStage
  ];

/**
 * 29.1B — physical lineage between one generated stellar component and a
 * possible/past supernova transient.
 *
 * This is deliberately not a persisted event. It carries no event id, epoch or
 * mutation of the stellar system. Point 29.1C owns canonical event persistence.
 */
export class SupernovaStellarLineage {
  constructor(
    readonly componentLabel: StellarSystemComponentLabel,
    readonly stellarDesignation: string,
    readonly initialMassSolar: number,
    readonly currentMassSolar: number,
    readonly metallicitySolarRatio: number,
    readonly ageBillionYears: number,
    readonly currentEvolutionState: StellarEvolutionState,
    readonly terminalEvolutionState: StellarEvolutionState | null,
    readonly stage: SupernovaStellarLineageStage,
    readonly progenitor: SupernovaProgenitorProfile | null,
    readonly eventProfile: SupernovaEventProfile | null,
    readonly requiresBinaryInteraction: boolean,
    readonly terminalAgeBillionYears: number | null = null,
  ) {
    assertFiniteNonNegative(metallicitySolarRatio, 'metallicitySolarRatio');
    assertFiniteNonNegative(ageBillionYears, 'ageBillionYears');
    assertFinitePositive(initialMassSolar, 'initialMassSolar');
    assertFinitePositive(currentMassSolar, 'currentMassSolar');

    if (terminalAgeBillionYears !== null) {
      assertFiniteNonNegative(terminalAgeBillionYears, 'terminalAgeBillionYears');
    }

    if (currentMassSolar > initialMassSolar + 1e-9) {
      throw new RangeError(
        'currentMassSolar cannot exceed initialMassSolar in a stellar supernova lineage.',
      );
    }

    if ((progenitor === null) !== (eventProfile === null)) {
      throw new RangeError(
        'A supernova lineage must carry progenitor and eventProfile together.',
      );
    }

    const isThermonuclear =
      stage === SupernovaStellarLineageStage.THERMONUCLEAR_BINARY_CHANNEL;

    if (isThermonuclear !== requiresBinaryInteraction) {
      throw new RangeError(
        'Only the thermonuclear Ia lineage requires binary interaction in 29.1B.',
      );
    }

    const stageRequiresEvent =
      stage === SupernovaStellarLineageStage.FUTURE_CORE_COLLAPSE ||
      stage === SupernovaStellarLineageStage.PRE_SUPERNOVA_CORE_COLLAPSE ||
      stage === SupernovaStellarLineageStage.THERMONUCLEAR_BINARY_CHANNEL ||
      stage === SupernovaStellarLineageStage.POST_CORE_COLLAPSE_REMNANT;

    if (stageRequiresEvent !== (eventProfile !== null)) {
      throw new RangeError(
        `Lineage stage ${stage} has an inconsistent supernova event profile.`,
      );
    }
  }
}

function assertFinitePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be finite and greater than 0.`);
  }
}

function assertFiniteNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be finite and non-negative.`);
  }
}
