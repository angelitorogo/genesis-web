import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  StellarBlackHoleFormationChannel,
} from '../../domain/stellar/stellar-black-hole-formation-channel';

import {
  StellarBrownDwarfClass,
} from '../../domain/stellar/stellar-brown-dwarf-class';

import {
  StellarEvolutionAssessment,
} from '../../domain/stellar/stellar-evolution-assessment';

import {
  STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR,
  type StellarEvolutionInput,
} from '../../domain/stellar/stellar-evolution-input';

import {
  StellarEvolutionState,
} from '../../domain/stellar/stellar-evolution-state';

import {
  StellarMainSequenceClass,
} from '../../domain/stellar/stellar-main-sequence-class';

import {
  StellarNeutronStarFormationChannel,
} from '../../domain/stellar/stellar-neutron-star-formation-channel';

import {
  StellarPostMainSequenceStage,
} from '../../domain/stellar/stellar-post-main-sequence-stage';

import {
  StellarWhiteDwarfComposition,
} from '../../domain/stellar/stellar-white-dwarf-composition';

const V1_MIN_EFFECTIVE_METALLICITY_SOLAR_RATIO =
  0.01;

const V1_MAX_EFFECTIVE_METALLICITY_SOLAR_RATIO =
  3.0;

const V1_SOLAR_MAIN_SEQUENCE_LIFETIME_BILLION_YEARS =
  10.0;

const V1_HIGH_MASS_LIFETIME_PIVOT_SOLAR =
  20.0;

const V1_HIGH_MASS_LIFETIME_EXPONENT =
  -0.70;

/**
 * Point-14.8 deterministic isolated-star evolution model.
 *
 * The engine consumes no PRNG draws. UniverseGenerationKey is used only to
 * select the frozen GeneratorVersion branch; evolution itself is a pure
 * function of initial mass, metallicity and age.
 *
 * V1 is deliberately coarse. It provides physically ordered evolutionary
 * families and metallicity-sensitive thresholds/timescales without claiming
 * to replace a detailed stellar-evolution code. Point 14.9 is responsible for
 * broad plausibility validation across the supported envelope.
 */
export class StellarEvolutionEngine {

  private constructor() {}

  static evaluate(
    generationKey:
      UniverseGenerationKey,

    input:
      StellarEvolutionInput,
  ): StellarEvolutionAssessment {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.evaluateV1(
        input,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static evaluateV1(
    input:
      StellarEvolutionInput,
  ): StellarEvolutionAssessment {

    const effectiveMetallicity =
      clamp(
        input.metallicitySolarRatio,
        V1_MIN_EFFECTIVE_METALLICITY_SOLAR_RATIO,
        V1_MAX_EFFECTIVE_METALLICITY_SOLAR_RATIO,
      );

    const logMetallicity =
      Math.log10(
        effectiveMetallicity,
      );

    const hydrogenBurningLimitSolar =
      clamp(
        0.075 -
        0.006 *
          logMetallicity,
        0.070,
        0.090,
      );

    if (
      input.initialMassSolar <
      hydrogenBurningLimitSolar
    ) {
      return new StellarEvolutionAssessment(
        input,
        StellarEvolutionState.BROWN_DWARF,
        null,
        brownDwarfClassV1(
          input.initialMassSolar,
          hydrogenBurningLimitSolar,
          input.ageBillionYears,
        ),
        null,
        null,
        null,
        null,
        null,
        null,
      );
    }

    const mainSequenceLifetimeBillionYears =
      mainSequenceLifetimeV1(
        input.initialMassSolar,
        logMetallicity,
      );

    const whiteDwarfUpperInitialMassSolar =
      clamp(
        8.0 +
        0.60 *
          logMetallicity,
        7.0,
        8.5,
      );

    const isWhiteDwarfProgenitor =
      input.initialMassSolar <
      whiteDwarfUpperInitialMassSolar;

    const postMainSequenceDurationBillionYears =
      postMainSequenceDurationV1(
        input.initialMassSolar,
        mainSequenceLifetimeBillionYears,
        isWhiteDwarfProgenitor,
      );

    if (
      input.ageBillionYears <
      mainSequenceLifetimeBillionYears
    ) {
      return new StellarEvolutionAssessment(
        input,
        StellarEvolutionState.MAIN_SEQUENCE,
        mainSequenceClassV1(
          input.initialMassSolar,
        ),
        null,
        null,
        null,
        null,
        null,
        mainSequenceLifetimeBillionYears,
        postMainSequenceDurationBillionYears,
      );
    }

    const terminalAgeBillionYears =
      mainSequenceLifetimeBillionYears +
      postMainSequenceDurationBillionYears;

    if (
      input.ageBillionYears <
      terminalAgeBillionYears
    ) {
      if (
        isWhiteDwarfProgenitor
      ) {
        const elapsedPostMainSequence =
          input.ageBillionYears -
          mainSequenceLifetimeBillionYears;

        const redGiantFraction =
          input.initialMassSolar <=
            2.2
            ? 0.72
            : 0.48;

        const postMainSequenceStage =
          elapsedPostMainSequence <
            postMainSequenceDurationBillionYears *
              redGiantFraction
            ? StellarPostMainSequenceStage.RED_GIANT_BRANCH
            : StellarPostMainSequenceStage.ASYMPTOTIC_GIANT_BRANCH;

        return new StellarEvolutionAssessment(
          input,
          StellarEvolutionState.GIANT,
          null,
          null,
          postMainSequenceStage,
          null,
          null,
          null,
          mainSequenceLifetimeBillionYears,
          postMainSequenceDurationBillionYears,
        );
      }

      return new StellarEvolutionAssessment(
        input,
        StellarEvolutionState.SUPERGIANT,
        null,
        null,
        StellarPostMainSequenceStage.SUPERGIANT,
        null,
        null,
        null,
        mainSequenceLifetimeBillionYears,
        postMainSequenceDurationBillionYears,
      );
    }

    if (
      isWhiteDwarfProgenitor
    ) {
      return new StellarEvolutionAssessment(
        input,
        StellarEvolutionState.WHITE_DWARF,
        null,
        null,
        null,
        whiteDwarfCompositionV1(
          input.initialMassSolar,
          whiteDwarfUpperInitialMassSolar,
        ),
        null,
        null,
        mainSequenceLifetimeBillionYears,
        postMainSequenceDurationBillionYears,
      );
    }

    const blackHoleThresholdInitialMassSolar =
      clamp(
        25.0 +
        4.0 *
          logMetallicity,
        18.0,
        30.0,
      );

    if (
      input.initialMassSolar <
      blackHoleThresholdInitialMassSolar
    ) {
      return new StellarEvolutionAssessment(
        input,
        StellarEvolutionState.NEUTRON_STAR,
        null,
        null,
        null,
        null,
        neutronStarFormationChannelV1(
          input.initialMassSolar,
          whiteDwarfUpperInitialMassSolar,
        ),
        null,
        mainSequenceLifetimeBillionYears,
        postMainSequenceDurationBillionYears,
      );
    }

    const directCollapseThresholdInitialMassSolar =
      blackHoleThresholdInitialMassSolar +
      clamp(
        12.0 +
        2.0 *
          logMetallicity,
        8.0,
        14.0,
      );

    return new StellarEvolutionAssessment(
      input,
      StellarEvolutionState.STELLAR_BLACK_HOLE,
      null,
      null,
      null,
      null,
      null,
      input.initialMassSolar >=
        directCollapseThresholdInitialMassSolar
        ? StellarBlackHoleFormationChannel.DIRECT_COLLAPSE
        : StellarBlackHoleFormationChannel.FALLBACK_CORE_COLLAPSE,
      mainSequenceLifetimeBillionYears,
      postMainSequenceDurationBillionYears,
    );
  }
}

function mainSequenceLifetimeV1(
  initialMassSolar:
    number,

  logMetallicity:
    number,
): number {

  const metallicityLifetimeFactor =
    clamp(
      1.0 +
      0.10 *
        logMetallicity,
      0.80,
      1.08,
    );

  if (
    initialMassSolar <=
    V1_HIGH_MASS_LIFETIME_PIVOT_SOLAR
  ) {
    return (
      V1_SOLAR_MAIN_SEQUENCE_LIFETIME_BILLION_YEARS *
      initialMassSolar **
        -2.5 *
      metallicityLifetimeFactor
    );
  }

  const pivotLifetime =
    V1_SOLAR_MAIN_SEQUENCE_LIFETIME_BILLION_YEARS *
    V1_HIGH_MASS_LIFETIME_PIVOT_SOLAR **
      -2.5;

  return (
    pivotLifetime *
    (
      initialMassSolar /
      V1_HIGH_MASS_LIFETIME_PIVOT_SOLAR
    ) **
      V1_HIGH_MASS_LIFETIME_EXPONENT *
    metallicityLifetimeFactor
  );
}

function postMainSequenceDurationV1(
  initialMassSolar:
    number,

  mainSequenceLifetimeBillionYears:
    number,

  isWhiteDwarfProgenitor:
    boolean,
): number {

  if (
    !isWhiteDwarfProgenitor
  ) {
    return Math.max(
      0.0003,
      mainSequenceLifetimeBillionYears *
        0.12,
    );
  }

  const relativeDuration =
    clamp(
      0.12 -
      0.004 *
        initialMassSolar,
      0.06,
      0.12,
    );

  return Math.max(
    0.002,
    mainSequenceLifetimeBillionYears *
      relativeDuration,
  );
}

function mainSequenceClassV1(
  initialMassSolar:
    number,
): StellarMainSequenceClass {

  if (
    initialMassSolar >=
    16.0
  ) {
    return StellarMainSequenceClass.O;
  }

  if (
    initialMassSolar >=
    2.10
  ) {
    return StellarMainSequenceClass.B;
  }

  if (
    initialMassSolar >=
    1.40
  ) {
    return StellarMainSequenceClass.A;
  }

  if (
    initialMassSolar >=
    1.04
  ) {
    return StellarMainSequenceClass.F;
  }

  if (
    initialMassSolar >=
    0.80
  ) {
    return StellarMainSequenceClass.G;
  }

  if (
    initialMassSolar >=
    0.45
  ) {
    return StellarMainSequenceClass.K;
  }

  return StellarMainSequenceClass.M;
}

function brownDwarfClassV1(
  initialMassSolar:
    number,

  hydrogenBurningLimitSolar:
    number,

  ageBillionYears:
    number,
): StellarBrownDwarfClass {

  const normalizedMass =
    clamp01(
      (
        initialMassSolar -
        STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR
      ) /
      (
        hydrogenBurningLimitSolar -
        STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR
      ),
    );

  const coolingTimescale =
    0.35 +
    1.65 *
      normalizedMass;

  const coolingAge =
    ageBillionYears /
    coolingTimescale;

  if (
    coolingAge <
    0.8
  ) {
    return StellarBrownDwarfClass.L;
  }

  if (
    coolingAge <
    6.0
  ) {
    return StellarBrownDwarfClass.T;
  }

  return StellarBrownDwarfClass.Y;
}

function whiteDwarfCompositionV1(
  initialMassSolar:
    number,

  whiteDwarfUpperInitialMassSolar:
    number,
): StellarWhiteDwarfComposition {

  if (
    initialMassSolar >=
    whiteDwarfUpperInitialMassSolar -
      1.25
  ) {
    return StellarWhiteDwarfComposition.OXYGEN_NEON_CORE;
  }

  return StellarWhiteDwarfComposition.CARBON_OXYGEN_CORE;
}

function neutronStarFormationChannelV1(
  initialMassSolar:
    number,

  whiteDwarfUpperInitialMassSolar:
    number,
): StellarNeutronStarFormationChannel {

  if (
    initialMassSolar <
    whiteDwarfUpperInitialMassSolar +
      1.30
  ) {
    return StellarNeutronStarFormationChannel.ELECTRON_CAPTURE_COLLAPSE;
  }

  return StellarNeutronStarFormationChannel.IRON_CORE_COLLAPSE;
}

function clamp01(
  value:
    number,
): number {

  return clamp(
    value,
    0,
    1,
  );
}

function clamp(
  value:
    number,

  min:
    number,

  max:
    number,
): number {

  return Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );
}
