import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../discovery/discovery-state';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * Explicit player choice offered after an external galaxy has already been
 * detected.
 *
 * Point 7.7 never auto-selects one of these values.
 */
export enum ExternalGalaxyFocusChoice {
  REMAIN_CURRENT =
    'REMAIN_CURRENT',

  FOCUS_DETECTED =
    'FOCUS_DETECTED',
}

/**
 * Immutable offer presented after detecting an external galaxy.
 *
 * This model does not change activeGalaxyIndex, persist navigation, unlock a
 * galaxy, mutate DiscoveryState or imply physical travel.
 */
export class ExternalGalaxyFocusOffer {

  constructor(
    readonly currentGalaxyIndex:
      bigint,

    readonly detectedGalaxyIndex:
      bigint,

    readonly detectedGalaxyKnowledgeState:
      DiscoveryStateValue,
  ) {
    assertNonNegativeSignedLong(
      currentGalaxyIndex,
      'currentGalaxyIndex',
    );

    assertNonNegativeSignedLong(
      detectedGalaxyIndex,
      'detectedGalaxyIndex',
    );

    if (
      currentGalaxyIndex ===
      detectedGalaxyIndex
    ) {
      throw new RangeError(
        'currentGalaxyIndex and detectedGalaxyIndex must be different.',
      );
    }

    const canonicalKnowledgeState =
      DiscoveryState
        .fromCode(
          detectedGalaxyKnowledgeState
            .code,
        );

    if (
      canonicalKnowledgeState.code <
      DiscoveryState.DETECTED.code
    ) {
      throw new RangeError(
        'detectedGalaxyKnowledgeState must be >= DETECTED.',
      );
    }
  }

  get availableChoices():
    readonly ExternalGalaxyFocusChoice[] {

    return Object.freeze([
      ExternalGalaxyFocusChoice
        .REMAIN_CURRENT,

      ExternalGalaxyFocusChoice
        .FOCUS_DETECTED,
    ]);
  }
}

/**
 * Immutable result of explicitly resolving an ExternalGalaxyFocusOffer.
 *
 * The resulting focus is still only a pure decision value. A future
 * orchestrator/UI is responsible for applying it to the persistent navigation
 * repository.
 */
export class ExternalGalaxyFocusDecision {

  constructor(
    readonly offer:
      ExternalGalaxyFocusOffer,

    readonly choice:
      ExternalGalaxyFocusChoice,

    readonly resultingFocusGalaxyIndex:
      bigint,
  ) {
    assertNonNegativeSignedLong(
      resultingFocusGalaxyIndex,
      'resultingFocusGalaxyIndex',
    );

    if (
      !Object.values(
        ExternalGalaxyFocusChoice,
      ).includes(
        choice,
      )
    ) {
      throw new RangeError(
        `Unknown ExternalGalaxyFocusChoice: ${String(choice)}.`,
      );
    }

    if (
      choice ===
        ExternalGalaxyFocusChoice
          .REMAIN_CURRENT &&
      resultingFocusGalaxyIndex !==
        offer.currentGalaxyIndex
    ) {
      throw new RangeError(
        'REMAIN_CURRENT requires resultingFocusGalaxyIndex to equal offer.currentGalaxyIndex.',
      );
    }

    if (
      choice ===
        ExternalGalaxyFocusChoice
          .FOCUS_DETECTED &&
      resultingFocusGalaxyIndex !==
        offer.detectedGalaxyIndex
    ) {
      throw new RangeError(
        'FOCUS_DETECTED requires resultingFocusGalaxyIndex to equal offer.detectedGalaxyIndex.',
      );
    }
  }

  get previousFocusGalaxyIndex():
    bigint {

    return this
      .offer
      .currentGalaxyIndex;
  }

  get detectedGalaxyIndex():
    bigint {

    return this
      .offer
      .detectedGalaxyIndex;
  }

  get didChangeFocus():
    boolean {

    return this
      .resultingFocusGalaxyIndex !==
      this.previousFocusGalaxyIndex;
  }

  get remainedOnCurrentGalaxy():
    boolean {

    return this.choice ===
      ExternalGalaxyFocusChoice
        .REMAIN_CURRENT;
  }

  get focusedDetectedGalaxy():
    boolean {

    return this.choice ===
      ExternalGalaxyFocusChoice
        .FOCUS_DETECTED;
  }
}

function assertNonNegativeSignedLong(
  value:
    bigint,

  propertyName:
    string,
): void {

  if (
    value <
      0n ||
    value >
      SIGNED_LONG_MAX
  ) {
    throw new RangeError(
      `${propertyName} must be a non-negative signed Long: ${value}.`,
    );
  }
}
