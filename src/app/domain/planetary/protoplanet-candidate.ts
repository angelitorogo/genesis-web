import {
  type ProtoplanetaryCondensationRegionKind,
} from './protoplanetary-condensation-region-kind';

import {
  ProtoplanetCandidateComposition,
} from './protoplanet-candidate-composition';

/**
 * Point-17.4 initial protoplanet/planetary-embryo candidate.
 *
 * The object records where a condensed solid concentration has become a
 * distinct candidate and how much solid mass is already locked into it. The
 * orbital radius is only its initial circularized formation radius. Point 17.5
 * owns migration, eccentricity-changing encounters and collisions.
 */
export class ProtoplanetCandidate {

  constructor(
    readonly formationOrdinal:
      number,

    readonly orbitalRadiusAu:
      number,

    readonly solidMassEarth:
      number,

    readonly composition:
      ProtoplanetCandidateComposition,

    readonly sourceCondensationRegionKind:
      ProtoplanetaryCondensationRegionKind,

    readonly localDustRetentionFraction01:
      number,

    readonly growthPotential01:
      number,

    readonly gasAccretionPotential01:
      number,
  ) {
    if (
      !Number.isInteger(
        formationOrdinal,
      ) ||
      formationOrdinal <
        1
    ) {
      throw new RangeError(
        `formationOrdinal must be a positive integer: ${formationOrdinal}.`,
      );
    }

    assertPositiveFinite(
      orbitalRadiusAu,
      'orbitalRadiusAu',
    );

    assertPositiveFinite(
      solidMassEarth,
      'solidMassEarth',
    );

    if (
      !ProtoplanetCandidateComposition.values
        .includes(
          composition,
        )
    ) {
      throw new RangeError(
        'composition must be a known ProtoplanetCandidateComposition.',
      );
    }

    assertNormalized(
      localDustRetentionFraction01,
      'localDustRetentionFraction01',
    );

    assertNormalized(
      growthPotential01,
      'growthPotential01',
    );

    assertNormalized(
      gasAccretionPotential01,
      'gasAccretionPotential01',
    );
  }

  get isIceBearing():
    boolean {

    return (
      this.composition ===
        ProtoplanetCandidateComposition.ICE_RICH ||
      this.composition ===
        ProtoplanetCandidateComposition.VOLATILE_RICH
    );
  }
}

function assertPositiveFinite(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and greater than 0: ${value}.`,
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
