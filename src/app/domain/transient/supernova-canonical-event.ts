import {
  StellarSystemComponentLabel,
  type StellarSystemComponentLabel as StellarSystemComponentLabelValue,
} from '../stellar/stellar-system-component-label';
import {
  type SupernovaEventProfile,
} from './supernova-event-profile';
import {
  SupernovaStellarLineageStage,
  type SupernovaStellarLineageStage as SupernovaStellarLineageStageValue,
} from './supernova-stellar-lineage';

export const SupernovaCanonicalEventTemporalStatus = Object.freeze({
  HISTORICAL: 'HISTORICAL',
  FUTURE_SCHEDULED: 'FUTURE_SCHEDULED',
  UNRESOLVED_BINARY_DELAY: 'UNRESOLVED_BINARY_DELAY',
} as const);

export type SupernovaCanonicalEventTemporalStatus =
  typeof SupernovaCanonicalEventTemporalStatus[
    keyof typeof SupernovaCanonicalEventTemporalStatus
  ];

export const SUPERNOVA_CANONICAL_EVENT_VERSION =
  'SUPERNOVA_CANONICAL_EVENT_V1' as const;

const AGE_TOLERANCE_GYR = 1e-9;

/**
 * 29.1C — one canonical supernova event belonging to one real generated
 * stellar-system component.
 *
 * The event is immutable Ground Truth derived from the already frozen stellar
 * model. It intentionally contains no wall-clock timestamp and no player
 * discovery state. Persistence metadata lives in the repository layer.
 *
 * Core-collapse events can be placed on the modeled stellar-age axis because
 * phase 15 already exposes a terminal age. The Ia channel is deliberately kept
 * temporally unresolved: 29.1B establishes a physically compatible binary mass
 * reservoir, but GENESIS does not yet model an accretion history accurately
 * enough to invent an explosion epoch.
 */
export class SupernovaCanonicalEvent {
  readonly version = SUPERNOVA_CANONICAL_EVENT_VERSION;

  constructor(
    readonly componentLabel: StellarSystemComponentLabelValue,
    readonly stellarDesignation: string,
    readonly sourceLineageStage: SupernovaStellarLineageStageValue,
    readonly temporalStatus: SupernovaCanonicalEventTemporalStatus,
    readonly currentStellarAgeBillionYears: number,
    readonly eventStellarAgeBillionYears: number | null,
    readonly requiresBinaryInteraction: boolean,
    readonly profile: SupernovaEventProfile,
  ) {
    if (!StellarSystemComponentLabel.values.includes(componentLabel)) {
      throw new RangeError('Unknown stellar-system component label.');
    }

    if (stellarDesignation.trim().length === 0) {
      throw new RangeError('stellarDesignation cannot be blank.');
    }

    assertFiniteNonNegative(
      currentStellarAgeBillionYears,
      'currentStellarAgeBillionYears',
    );

    if (eventStellarAgeBillionYears !== null) {
      assertFiniteNonNegative(
        eventStellarAgeBillionYears,
        'eventStellarAgeBillionYears',
      );
    }

    const historical =
      sourceLineageStage ===
      SupernovaStellarLineageStage.POST_CORE_COLLAPSE_REMNANT;
    const scheduled =
      sourceLineageStage ===
        SupernovaStellarLineageStage.FUTURE_CORE_COLLAPSE ||
      sourceLineageStage ===
        SupernovaStellarLineageStage.PRE_SUPERNOVA_CORE_COLLAPSE;
    const unresolvedIa =
      sourceLineageStage ===
      SupernovaStellarLineageStage.THERMONUCLEAR_BINARY_CHANNEL;

    if (!historical && !scheduled && !unresolvedIa) {
      throw new RangeError(
        `Lineage stage ${sourceLineageStage} cannot own a canonical supernova event.`,
      );
    }

    if (historical) {
      if (
        temporalStatus !==
          SupernovaCanonicalEventTemporalStatus.HISTORICAL ||
        eventStellarAgeBillionYears === null ||
        eventStellarAgeBillionYears >
          currentStellarAgeBillionYears + AGE_TOLERANCE_GYR ||
        requiresBinaryInteraction
      ) {
        throw new RangeError(
          'Historical core-collapse events require a past terminal stellar age and no Ia binary flag.',
        );
      }
    }

    if (scheduled) {
      if (
        temporalStatus !==
          SupernovaCanonicalEventTemporalStatus.FUTURE_SCHEDULED ||
        eventStellarAgeBillionYears === null ||
        eventStellarAgeBillionYears + AGE_TOLERANCE_GYR <
          currentStellarAgeBillionYears ||
        requiresBinaryInteraction
      ) {
        throw new RangeError(
          'Future core-collapse events require a scheduled terminal stellar age and no Ia binary flag.',
        );
      }
    }

    if (unresolvedIa) {
      if (
        temporalStatus !==
          SupernovaCanonicalEventTemporalStatus.UNRESOLVED_BINARY_DELAY ||
        eventStellarAgeBillionYears !== null ||
        !requiresBinaryInteraction
      ) {
        throw new RangeError(
          'Thermonuclear binary events must keep their explosion age unresolved in 29.1C.',
        );
      }
    }
  }

  /** Stable identity inside one stellar system. Global identity adds system seed. */
  get eventKey(): string {
    return `SUPERNOVA:${this.componentLabel.name}`;
  }
}

function assertFiniteNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be finite and non-negative.`);
  }
}
