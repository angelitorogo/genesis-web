const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * Future-ready interaction stage for a galaxy.
 *
 * Point 6.8 defines the domain contract only. GeneratorVersion.V1 does not
 * infer real companions, close pairs, tidal interactions or mergers yet.
 */
export enum GalaxyInteractionStage {
  NONE =
    'NONE',

  CLOSE_PAIR =
    'CLOSE_PAIR',

  TIDAL_INTERACTION =
    'TIDAL_INTERACTION',

  MERGER =
    'MERGER',
}

/**
 * Future-ready state for enhanced galactic star formation.
 *
 * Starburst state is intentionally independent from interaction stage:
 * internal processes may eventually produce a starburst without an external
 * interaction, while an interaction may occur without a starburst.
 */
export enum GalaxyStarburstState {
  NONE =
    'NONE',

  ELEVATED =
    'ELEVATED',

  STARBURST =
    'STARBURST',
}

/**
 * Procedural Ground Truth contract prepared for future galaxy interactions
 * and starburst episodes.
 *
 * IMPORTANT:
 *
 * GeneratorVersion.V1 currently emits the baseline state only because GENESIS
 * does not yet have intergalactic positions/distances, companion resolution,
 * orbital dynamics or a temporal event engine. Keeping this profile separate
 * from Galaxy preserves the frozen baseline physical properties while giving
 * future versions a stable place to express interaction/starburst state.
 */
export class GalaxyInteractionStarburstProfile {

  constructor(
    readonly galaxyIndex:
      bigint,

    readonly interactionStage:
      GalaxyInteractionStage,

    readonly companionGalaxyIndex:
      bigint | null,

    readonly interactionStrength:
      number,

    readonly starburstState:
      GalaxyStarburstState,

    readonly starFormationRateMultiplier:
      number,
  ) {
    assertNonNegativeSignedLong(
      galaxyIndex,
      'galaxyIndex',
    );

    if (
      companionGalaxyIndex !==
      null
    ) {
      assertNonNegativeSignedLong(
        companionGalaxyIndex,
        'companionGalaxyIndex',
      );

      if (
        companionGalaxyIndex ===
        galaxyIndex
      ) {
        throw new RangeError(
          'companionGalaxyIndex cannot equal galaxyIndex.',
        );
      }
    }

    if (
      !Number.isFinite(
        interactionStrength,
      ) ||
      interactionStrength <
        0.0 ||
      interactionStrength >
        1.0
    ) {
      throw new RangeError(
        `interactionStrength must be finite and in range [0, 1]: ${interactionStrength}.`,
      );
    }

    if (
      !Number.isFinite(
        starFormationRateMultiplier,
      ) ||
      starFormationRateMultiplier <=
        0.0
    ) {
      throw new RangeError(
        `starFormationRateMultiplier must be finite and greater than 0: ${starFormationRateMultiplier}.`,
      );
    }

    if (
      !Object.values(
        GalaxyInteractionStage,
      ).includes(
        interactionStage,
      )
    ) {
      throw new RangeError(
        `Unknown GalaxyInteractionStage: ${String(interactionStage)}.`,
      );
    }

    if (
      !Object.values(
        GalaxyStarburstState,
      ).includes(
        starburstState,
      )
    ) {
      throw new RangeError(
        `Unknown GalaxyStarburstState: ${String(starburstState)}.`,
      );
    }

    if (
      interactionStage ===
      GalaxyInteractionStage.NONE
    ) {
      if (
        companionGalaxyIndex !==
          null ||
        interactionStrength !==
          0.0
      ) {
        throw new RangeError(
          'NONE interactionStage requires companionGalaxyIndex to be null and interactionStrength to be 0.',
        );
      }
    } else {
      if (
        companionGalaxyIndex ===
        null
      ) {
        throw new RangeError(
          `${interactionStage} interactionStage requires a non-null companionGalaxyIndex.`,
        );
      }

      if (
        interactionStrength <=
        0.0
      ) {
        throw new RangeError(
          `${interactionStage} interactionStage requires interactionStrength to be greater than 0.`,
        );
      }
    }

    if (
      (
        starburstState ===
          GalaxyStarburstState.ELEVATED ||
        starburstState ===
          GalaxyStarburstState.STARBURST
      ) &&
      starFormationRateMultiplier <=
        1.0
    ) {
      throw new RangeError(
        `${starburstState} starburstState requires starFormationRateMultiplier to be greater than 1.`,
      );
    }
  }

  get hasInteraction():
    boolean {

    return this.interactionStage !==
      GalaxyInteractionStage.NONE;
  }

  get hasCompanion():
    boolean {

    return this.companionGalaxyIndex !==
      null;
  }

  get isStarFormationEnhanced():
    boolean {

    return this.starFormationRateMultiplier >
      1.0;
  }

  get isStarburst():
    boolean {

    return this.starburstState ===
      GalaxyStarburstState.STARBURST;
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
