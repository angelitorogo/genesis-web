import {
  type StellarEvolutionState,
} from '../stellar/stellar-evolution-state';
import {
  type StellarSystemComponentLabel,
} from '../stellar/stellar-system-component-label';
import {
  SupernovaCompactRemnantKind,
  type SupernovaCompactRemnantKind as SupernovaCompactRemnantKindValue,
} from './supernova-event-profile';
import {
  type SupernovaType,
} from './supernova-type';

export const SupernovaStellarConsequenceStatus = Object.freeze({
  PREDICTED_FUTURE: 'PREDICTED_FUTURE',
  REALIZED_HISTORICAL: 'REALIZED_HISTORICAL',
  UNRESOLVED_BINARY_DELAY: 'UNRESOLVED_BINARY_DELAY',
} as const);

export type SupernovaStellarConsequenceStatus =
  typeof SupernovaStellarConsequenceStatus[
    keyof typeof SupernovaStellarConsequenceStatus
  ];

export const SupernovaStellarDisposition = Object.freeze({
  DESTROYED: 'DESTROYED',
  COMPACT_REMNANT: 'COMPACT_REMNANT',
} as const);

export type SupernovaStellarDisposition =
  typeof SupernovaStellarDisposition[
    keyof typeof SupernovaStellarDisposition
  ];

/**
 * 29.1D — immutable post-event stellar consequence projected from one
 * canonical 29.1C supernova event.
 *
 * This is deliberately a consequence/read model, not a mutation of
 * StellarSystem. A, B and C have different domain representations in the
 * frozen multihost architecture; replacing those objects here would create a
 * second stellar-evolution path. The canonical event remains the persisted
 * Ground Truth and this object states what that event physically does to its
 * progenitor.
 */
export class SupernovaStellarConsequence {
  constructor(
    readonly componentLabel: StellarSystemComponentLabel,
    readonly stellarDesignation: string,
    readonly sourceEventKey: string,
    readonly status: SupernovaStellarConsequenceStatus,
    readonly supernovaType: SupernovaType,
    readonly disposition: SupernovaStellarDisposition,
    readonly postEventEvolutionState: StellarEvolutionState | null,
    readonly compactRemnantKind: SupernovaCompactRemnantKindValue,
    readonly postEventStellarMassSolar: number,
    readonly ejectaMassSolar: number,
    readonly consequenceStellarAgeBillionYears: number | null,
  ) {
    if (stellarDesignation.trim().length === 0) {
      throw new RangeError('stellarDesignation cannot be blank.');
    }

    if (sourceEventKey.trim().length === 0) {
      throw new RangeError('sourceEventKey cannot be blank.');
    }

    assertFiniteNonNegative(
      postEventStellarMassSolar,
      'postEventStellarMassSolar',
    );
    assertFiniteNonNegative(ejectaMassSolar, 'ejectaMassSolar');

    if (consequenceStellarAgeBillionYears !== null) {
      assertFiniteNonNegative(
        consequenceStellarAgeBillionYears,
        'consequenceStellarAgeBillionYears',
      );
    }

    if (disposition === SupernovaStellarDisposition.DESTROYED) {
      if (
        postEventEvolutionState !== null ||
        postEventStellarMassSolar !== 0 ||
        compactRemnantKind !== SupernovaCompactRemnantKind.NONE
      ) {
        throw new RangeError(
          'A destroyed supernova progenitor cannot leave a stellar evolution state or compact remnant.',
        );
      }

      return;
    }

    if (
      postEventEvolutionState === null ||
      postEventStellarMassSolar <= 0 ||
      compactRemnantKind === SupernovaCompactRemnantKind.NONE
    ) {
      throw new RangeError(
        'A compact-remnant consequence requires a post-event stellar state, remnant kind and positive mass.',
      );
    }
  }

  get isRealized(): boolean {
    return this.status === SupernovaStellarConsequenceStatus.REALIZED_HISTORICAL;
  }

  get leavesCompactRemnant(): boolean {
    return this.disposition === SupernovaStellarDisposition.COMPACT_REMNANT;
  }
}

function assertFiniteNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be finite and non-negative.`);
  }
}
