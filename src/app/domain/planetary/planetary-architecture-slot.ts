import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  ProtoplanetCompositionMixture,
} from './protoplanet-composition-mixture';

/**
 * One mature-planet identity selected by point 18.2.
 *
 * A slot is deliberately not a physical Planet yet. It freezes which 17.7
 * formation anchors contribute to one final planet identity and preserves the
 * inherited core/composition potentials needed by later generators.
 *
 * Point 18.3 owns final orbital elements and phase 19 owns final mass/radius,
 * type and other individual physical properties.
 */
export class PlanetaryArchitectureSlot {

  readonly sourceAnchorOrdinals:
    readonly number[];

  readonly sourceFormationOrdinals:
    readonly number[];

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    sourceAnchorOrdinals:
      readonly number[],

    sourceFormationOrdinals:
      readonly number[],

    readonly referenceAssemblyRadiusAu:
      number,

    readonly inheritedSolidCoreMassEarth:
      number,

    readonly inheritedCompositionMixture:
      ProtoplanetCompositionMixture,

    readonly inheritedConsolidationIndex01:
      number,

    readonly inheritedEnvelopeAcquisitionPotential01:
      number,

    readonly inheritedVolatileRetentionPotential01:
      number,

    readonly inheritedDynamicalExcitationIndex01:
      number,

    readonly phase17CollisionCount:
      number,

    readonly phase18ConsolidationCount:
      number,
  ) {
    if (
      !Number.isInteger(
        planetOrdinal,
      ) ||
      planetOrdinal <=
        0
    ) {
      throw new RangeError(
        'planetOrdinal must be a positive integer.',
      );
    }

    if (
      bodyLocator.bodyIndex !==
      BigInt(
        planetOrdinal -
          1,
      )
    ) {
      throw new RangeError(
        'Point-18.2 planet slots use contiguous zero-based BodyLocator indices matching planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'PlanetaryArchitectureSlot requires a BodySeed.',
      );
    }

    validatePositiveOrdinals(
      sourceAnchorOrdinals,
      'sourceAnchorOrdinals',
    );

    validatePositiveOrdinals(
      sourceFormationOrdinals,
      'sourceFormationOrdinals',
    );

    assertPositiveFinite(
      referenceAssemblyRadiusAu,
      'referenceAssemblyRadiusAu',
    );

    assertPositiveFinite(
      inheritedSolidCoreMassEarth,
      'inheritedSolidCoreMassEarth',
    );

    assertNormalized(
      inheritedConsolidationIndex01,
      'inheritedConsolidationIndex01',
    );

    assertNormalized(
      inheritedEnvelopeAcquisitionPotential01,
      'inheritedEnvelopeAcquisitionPotential01',
    );

    assertNormalized(
      inheritedVolatileRetentionPotential01,
      'inheritedVolatileRetentionPotential01',
    );

    assertNormalized(
      inheritedDynamicalExcitationIndex01,
      'inheritedDynamicalExcitationIndex01',
    );

    assertNonNegativeInteger(
      phase17CollisionCount,
      'phase17CollisionCount',
    );

    assertNonNegativeInteger(
      phase18ConsolidationCount,
      'phase18ConsolidationCount',
    );

    if (
      phase18ConsolidationCount !==
      sourceAnchorOrdinals.length -
        1
    ) {
      throw new RangeError(
        'phase18ConsolidationCount must equal sourceAnchorOrdinals.length - 1.',
      );
    }

    this.sourceAnchorOrdinals =
      Object.freeze([
        ...sourceAnchorOrdinals,
      ]);

    this.sourceFormationOrdinals =
      Object.freeze([
        ...sourceFormationOrdinals,
      ]);
  }

  get inheritedAnchorCount():
    number {

    return this
      .sourceAnchorOrdinals
      .length;
  }

  get isPhase18Consolidated():
    boolean {

    return (
      this.phase18ConsolidationCount >
      0
    );
  }
}

function validatePositiveOrdinals(
  ordinals:
    readonly number[],

  propertyName:
    string,
): void {

  if (
    ordinals.length ===
    0
  ) {
    throw new RangeError(
      `${propertyName} must contain at least one ordinal.`,
    );
  }

  let previous =
    0;

  for (
    const ordinal
    of ordinals
  ) {
    if (
      !Number.isInteger(
        ordinal,
      ) ||
      ordinal <=
        previous
    ) {
      throw new RangeError(
        `${propertyName} must contain unique positive integers in ascending order.`,
      );
    }

    previous =
      ordinal;
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

function assertNonNegativeInteger(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isInteger(
      value,
    ) ||
    value <
      0
  ) {
    throw new RangeError(
      `${propertyName} must be a non-negative integer.`,
    );
  }
}
