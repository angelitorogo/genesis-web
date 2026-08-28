import {
  ProtoplanetCandidateComposition,
} from './protoplanet-candidate-composition';

const CONSISTENCY_TOLERANCE =
  1e-9;

export interface ProtoplanetCompositionContribution {
  readonly mixture:
    ProtoplanetCompositionMixture;

  readonly solidMassEarth:
    number;
}

/**
 * Point-17.5 mass-normalized solid-composition mixture carried through early
 * collisions.
 *
 * Point 17.4 candidates begin as one broad condensation family. A collision
 * may combine bodies born in different thermal regions, so V1 preserves the
 * four source-family mass fractions instead of inventing a fifth "mixed"
 * material class. No gas-envelope composition is included here.
 */
export class ProtoplanetCompositionMixture {

  constructor(
    readonly refractoryRichFraction01:
      number,

    readonly rockyFraction01:
      number,

    readonly iceRichFraction01:
      number,

    readonly volatileRichFraction01:
      number,
  ) {
    const fractions = [
      refractoryRichFraction01,
      rockyFraction01,
      iceRichFraction01,
      volatileRichFraction01,
    ];

    for (
      const fraction
      of fractions
    ) {
      assertNormalized(
        fraction,
        'composition fraction',
      );
    }

    const total =
      fractions.reduce(
        (
          accumulator,
          value,
        ) =>
          accumulator +
          value,
        0,
      );

    if (
      Math.abs(
        total -
        1,
      ) >
      CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        `Protoplanet composition fractions must sum to 1: ${total}.`,
      );
    }
  }

  static fromCandidateComposition(
    composition:
      ProtoplanetCandidateComposition,
  ): ProtoplanetCompositionMixture {

    if (
      composition ===
      ProtoplanetCandidateComposition.REFRACTORY_RICH
    ) {
      return new ProtoplanetCompositionMixture(
        1,
        0,
        0,
        0,
      );
    }

    if (
      composition ===
      ProtoplanetCandidateComposition.ROCKY
    ) {
      return new ProtoplanetCompositionMixture(
        0,
        1,
        0,
        0,
      );
    }

    if (
      composition ===
      ProtoplanetCandidateComposition.ICE_RICH
    ) {
      return new ProtoplanetCompositionMixture(
        0,
        0,
        1,
        0,
      );
    }

    if (
      composition ===
      ProtoplanetCandidateComposition.VOLATILE_RICH
    ) {
      return new ProtoplanetCompositionMixture(
        0,
        0,
        0,
        1,
      );
    }

    throw new RangeError(
      'composition must be a known ProtoplanetCandidateComposition.',
    );
  }

  static mergeWeighted(
    contributions:
      readonly ProtoplanetCompositionContribution[],
  ): ProtoplanetCompositionMixture {

    if (
      contributions.length ===
      0
    ) {
      throw new RangeError(
        'At least one composition contribution is required.',
      );
    }

    let totalMassEarth =
      0;

    let refractoryMass =
      0;

    let rockyMass =
      0;

    let iceMass =
      0;

    let volatileMass =
      0;

    for (
      const contribution
      of contributions
    ) {
      if (
        !Number.isFinite(
          contribution.solidMassEarth,
        ) ||
        contribution.solidMassEarth <=
          0
      ) {
        throw new RangeError(
          'Every composition contribution mass must be finite and greater than 0.',
        );
      }

      totalMassEarth +=
        contribution.solidMassEarth;

      refractoryMass +=
        contribution.solidMassEarth *
        contribution.mixture
          .refractoryRichFraction01;

      rockyMass +=
        contribution.solidMassEarth *
        contribution.mixture
          .rockyFraction01;

      iceMass +=
        contribution.solidMassEarth *
        contribution.mixture
          .iceRichFraction01;

      volatileMass +=
        contribution.solidMassEarth *
        contribution.mixture
          .volatileRichFraction01;
    }

    return new ProtoplanetCompositionMixture(
      refractoryMass /
        totalMassEarth,
      rockyMass /
        totalMassEarth,
      iceMass /
        totalMassEarth,
      volatileMass /
        totalMassEarth,
    );
  }

  get dominantComposition():
    ProtoplanetCandidateComposition {

    const entries = [
      {
        composition:
          ProtoplanetCandidateComposition.REFRACTORY_RICH,
        fraction:
          this.refractoryRichFraction01,
      },
      {
        composition:
          ProtoplanetCandidateComposition.ROCKY,
        fraction:
          this.rockyFraction01,
      },
      {
        composition:
          ProtoplanetCandidateComposition.ICE_RICH,
        fraction:
          this.iceRichFraction01,
      },
      {
        composition:
          ProtoplanetCandidateComposition.VOLATILE_RICH,
        fraction:
          this.volatileRichFraction01,
      },
    ];

    return entries
      .reduce(
        (
          best,
          candidate,
        ) =>
          candidate.fraction >
            best.fraction
            ? candidate
            : best,
      )
      .composition;
  }

  get iceBearingFraction01():
    number {

    return (
      this.iceRichFraction01 +
      this.volatileRichFraction01
    );
  }
}

function assertNormalized(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${propertyName} must be finite and in range [0, 1]: ${value}.`,
    );
  }
}
