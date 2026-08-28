import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  StellarEvolutionState,
} from '../../domain/stellar/stellar-evolution-state';

import {
  type StellarLifetimeProfile,
} from '../../domain/stellar/stellar-lifetime-profile';

import {
  type StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';

import {
  StellarYouthProfile,
} from '../../domain/stellar/stellar-youth-profile';

import {
  StellarYouthStage,
} from '../../domain/stellar/stellar-youth-stage';

const V1_BILLION_YEARS_TO_MILLION_YEARS =
  1_000;

const V1_YOUNG_BROWN_DWARF_UPPER_AGE_MILLION_YEARS =
  100;

const V1_MIN_PROTOSTELLAR_UPPER_AGE_MILLION_YEARS =
  0.08;

const V1_MAX_PROTOSTELLAR_UPPER_AGE_MILLION_YEARS =
  0.80;

const V1_MIN_PRE_MAIN_SEQUENCE_UPPER_AGE_MILLION_YEARS =
  0.10;

const V1_MAX_PRE_MAIN_SEQUENCE_UPPER_AGE_MILLION_YEARS =
  1_500;

const V1_POST_PRE_MAIN_SEQUENCE_YOUTH_MILLION_YEARS =
  50;

const V1_MIN_STELLAR_YOUTH_UPPER_AGE_MILLION_YEARS =
  100;

const MASS_CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-17.1 pure early-age stellar-formation classifier.
 *
 * The generator consumes no PRNG draws and derives no new seed. It reads the
 * frozen point-15.1 initial mass and point-15.3 age/evolution assessment and
 * returns a temporary early-formation overlay only while the component is
 * young enough to need one.
 *
 * V1 boundaries:
 * - ordinary stars: PROTOSTAR -> PRE_MAIN_SEQUENCE -> YOUNG_STAR -> null;
 * - brown dwarfs: YOUNG_BROWN_DWARF -> null;
 * - giants and compact remnants never receive a youth overlay;
 * - point 17.1 does not create disks, dust, gas, protoplanets or migration.
 */
export class StellarYouthProfileGenerator {

  private constructor() {}

  static generateOrNull(
    generationKey:
      UniverseGenerationKey,

    physicalProperties:
      StellarPhysicalProperties,

    lifetimeProfile:
      StellarLifetimeProfile,
  ): StellarYouthProfile | null {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        physicalProperties,
        lifetimeProfile,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    physicalProperties:
      StellarPhysicalProperties,

    lifetimeProfile:
      StellarLifetimeProfile,
  ): StellarYouthProfile | null {

    assertMassConsistency(
      physicalProperties,
      lifetimeProfile,
    );

    const ageMillionYears =
      lifetimeProfile
        .ageBillionYears *
      V1_BILLION_YEARS_TO_MILLION_YEARS;

    const state =
      lifetimeProfile
        .evolutionAssessment
        .evolutionState;

    if (
      state ===
      StellarEvolutionState.BROWN_DWARF
    ) {
      return brownDwarfYouthProfileV1(
        ageMillionYears,
      );
    }

    if (
      state !==
      StellarEvolutionState.MAIN_SEQUENCE
    ) {
      return null;
    }

    const initialMassSolar =
      physicalProperties
        .initialMassSolar;

    const protostellarUpperAgeMillionYears =
      protostellarUpperAgeMillionYearsV1(
        initialMassSolar,
      );

    const preMainSequenceUpperAgeMillionYears =
      preMainSequenceUpperAgeMillionYearsV1(
        initialMassSolar,
        protostellarUpperAgeMillionYears,
      );

    const youthUpperAgeMillionYears =
      Math.max(
        V1_MIN_STELLAR_YOUTH_UPPER_AGE_MILLION_YEARS,
        preMainSequenceUpperAgeMillionYears +
          V1_POST_PRE_MAIN_SEQUENCE_YOUTH_MILLION_YEARS,
      );

    if (
      ageMillionYears <=
      protostellarUpperAgeMillionYears
    ) {
      const progress =
        normalizedProgress(
          ageMillionYears,
          0,
          protostellarUpperAgeMillionYears,
        );

      const initialInflation =
        protoRadiusInflationV1(
          initialMassSolar,
        );

      const initialLuminosityExcess =
        protoLuminosityExcessV1(
          initialMassSolar,
        );

      return new StellarYouthProfile(
        StellarYouthStage.PROTOSTAR,
        ageMillionYears,
        protostellarUpperAgeMillionYears,
        preMainSequenceUpperAgeMillionYears,
        youthUpperAgeMillionYears,
        progress,
        lerp(
          initialInflation,
          2.0,
          progress,
        ),
        lerp(
          initialLuminosityExcess,
          1.8,
          progress,
        ),
        lerp(
          1.0,
          0.62,
          progress,
        ),
      );
    }

    if (
      ageMillionYears <=
      preMainSequenceUpperAgeMillionYears
    ) {
      const progress =
        normalizedProgress(
          ageMillionYears,
          protostellarUpperAgeMillionYears,
          preMainSequenceUpperAgeMillionYears,
        );

      return new StellarYouthProfile(
        StellarYouthStage.PRE_MAIN_SEQUENCE,
        ageMillionYears,
        protostellarUpperAgeMillionYears,
        preMainSequenceUpperAgeMillionYears,
        youthUpperAgeMillionYears,
        progress,
        lerp(
          2.0,
          1.03,
          progress,
        ),
        lerp(
          1.8,
          1.02,
          progress,
        ),
        0.62 *
          (
            1.0 -
            progress
          ) **
            1.5,
      );
    }

    if (
      ageMillionYears <=
      youthUpperAgeMillionYears
    ) {
      const progress =
        normalizedProgress(
          ageMillionYears,
          preMainSequenceUpperAgeMillionYears,
          youthUpperAgeMillionYears,
        );

      return new StellarYouthProfile(
        StellarYouthStage.YOUNG_STAR,
        ageMillionYears,
        protostellarUpperAgeMillionYears,
        preMainSequenceUpperAgeMillionYears,
        youthUpperAgeMillionYears,
        progress,
        lerp(
          1.03,
          1.0,
          progress,
        ),
        lerp(
          1.02,
          1.0,
          progress,
        ),
        0,
      );
    }

    return null;
  }
}

function brownDwarfYouthProfileV1(
  ageMillionYears:
    number,
): StellarYouthProfile | null {

  if (
    ageMillionYears >
    V1_YOUNG_BROWN_DWARF_UPPER_AGE_MILLION_YEARS
  ) {
    return null;
  }

  const progress =
    normalizedProgress(
      ageMillionYears,
      0,
      V1_YOUNG_BROWN_DWARF_UPPER_AGE_MILLION_YEARS,
    );

  return new StellarYouthProfile(
    StellarYouthStage.YOUNG_BROWN_DWARF,
    ageMillionYears,
    null,
    null,
    V1_YOUNG_BROWN_DWARF_UPPER_AGE_MILLION_YEARS,
    progress,
    lerp(
      1.35,
      1.03,
      progress,
    ),
    lerp(
      1.45,
      1.02,
      progress,
    ),
    0.35 *
      (
        1.0 -
        progress
      ) **
        1.5,
  );
}

function protostellarUpperAgeMillionYearsV1(
  initialMassSolar:
    number,
): number {

  return clamp(
    0.45 *
      initialMassSolar **
        -0.25,
    V1_MIN_PROTOSTELLAR_UPPER_AGE_MILLION_YEARS,
    V1_MAX_PROTOSTELLAR_UPPER_AGE_MILLION_YEARS,
  );
}

function preMainSequenceUpperAgeMillionYearsV1(
  initialMassSolar:
    number,

  protostellarUpperAgeMillionYears:
    number,
): number {

  const contractionEstimate =
    clamp(
      30 *
        initialMassSolar **
          -2.2,
      V1_MIN_PRE_MAIN_SEQUENCE_UPPER_AGE_MILLION_YEARS,
      V1_MAX_PRE_MAIN_SEQUENCE_UPPER_AGE_MILLION_YEARS,
    );

  return Math.max(
    contractionEstimate,
    protostellarUpperAgeMillionYears *
      1.10,
  );
}

function protoRadiusInflationV1(
  initialMassSolar:
    number,
): number {

  return clamp(
    3.0 +
      0.20 *
        Math.log10(
          Math.max(
            initialMassSolar,
            0.05,
          ),
        ),
    2.5,
    3.8,
  );
}

function protoLuminosityExcessV1(
  initialMassSolar:
    number,
): number {

  return clamp(
    3.5 +
      0.45 *
        Math.log10(
          Math.max(
            initialMassSolar,
            0.05,
          ),
        ),
    2.6,
    5.0,
  );
}

function assertMassConsistency(
  physicalProperties:
    StellarPhysicalProperties,

  lifetimeProfile:
    StellarLifetimeProfile,
): void {

  const physicalMass =
    physicalProperties
      .initialMassSolar;

  const assessedMass =
    lifetimeProfile
      .evolutionAssessment
      .input
      .initialMassSolar;

  const scale =
    Math.max(
      1,
      Math.abs(
        physicalMass,
      ),
      Math.abs(
        assessedMass,
      ),
    );

  if (
    Math.abs(
      physicalMass -
      assessedMass,
    ) >
    MASS_CONSISTENCY_TOLERANCE *
      scale
  ) {
    throw new RangeError(
      'StellarYouthProfileGenerator requires point-15.1 mass and point-15.3 evolution input to describe the same component.',
    );
  }
}

function normalizedProgress(
  value:
    number,

  start:
    number,

  end:
    number,
): number {

  if (
    end <=
    start
  ) {
    return 1;
  }

  return clamp01(
    (
      value -
      start
    ) /
    (
      end -
      start
    ),
  );
}

function lerp(
  min:
    number,

  max:
    number,

  t:
    number,
): number {

  return (
    min +
    (
      max -
      min
    ) *
      clamp01(
        t,
      )
  );
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
