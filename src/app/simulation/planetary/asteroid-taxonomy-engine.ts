import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  AsteroidBeltRegion,
} from '../../domain/planetary/asteroid-belt-region';

import {
  AsteroidCompositionRegime,
} from '../../domain/planetary/asteroid-composition-regime';

import {
  type AsteroidIdentity,
} from '../../domain/planetary/asteroid-identity';

import {
  AsteroidMultiplicityRegime,
} from '../../domain/planetary/asteroid-multiplicity-regime';

import {
  AsteroidStructureRegime,
} from '../../domain/planetary/asteroid-structure-regime';

import {
  AsteroidTaxonomy,
} from '../../domain/planetary/asteroid-taxonomy';

import {
  type AsteroidOrbitalElements,
} from '../../domain/planetary/asteroid-orbital-elements';

const V1_DOMAIN =
  utf8ToBytes(
    'GENESIS-ASTEROID-TAXONOMY-V1',
  );

interface CompositionPrototype {
  readonly carbonaceous:
    number;

  readonly silicate:
    number;

  readonly metal:
    number;

  readonly ice:
    number;

  readonly density:
    number;

  readonly albedo:
    number;
}

const COMPOSITION_PROTOTYPES:
  Readonly<
    Record<
      AsteroidCompositionRegime,
      CompositionPrototype
    >
  > =
  Object.freeze({
    [AsteroidCompositionRegime.CARBONACEOUS]:
      Object.freeze({
        carbonaceous: 0.56,
        silicate: 0.29,
        metal: 0.05,
        ice: 0.10,
        density: 1.65,
        albedo: 0.055,
      }),

    [AsteroidCompositionRegime.SILICACEOUS]:
      Object.freeze({
        carbonaceous: 0.04,
        silicate: 0.73,
        metal: 0.18,
        ice: 0.05,
        density: 3.15,
        albedo: 0.22,
      }),

    [AsteroidCompositionRegime.METALLIC]:
      Object.freeze({
        carbonaceous: 0.02,
        silicate: 0.18,
        metal: 0.77,
        ice: 0.03,
        density: 5.6,
        albedo: 0.31,
      }),

    [AsteroidCompositionRegime.ICE_RICH]:
      Object.freeze({
        carbonaceous: 0.07,
        silicate: 0.20,
        metal: 0.04,
        ice: 0.69,
        density: 1.22,
        albedo: 0.11,
      }),

    [AsteroidCompositionRegime.MIXED_ROCK_ICE]:
      Object.freeze({
        carbonaceous: 0.09,
        silicate: 0.44,
        metal: 0.10,
        ice: 0.37,
        density: 1.95,
        albedo: 0.14,
      }),
  });

/**
 * Point-22.4 deterministic asteroid taxonomy classifier.
 *
 * V1 classifies one already-frozen point-22.3 asteroid from its procedural id,
 * belt region/radial position and diameter. It consumes zero PRNG draws and
 * derives zero hierarchical seeds. The result is descriptive Ground Truth only;
 * point 22.10 still owns whether any of it is known by the player.
 */
export class AsteroidTaxonomyEngine {

  private constructor() {}

  static classify(
    identity:
      AsteroidIdentity,

    diameterKilometers:
      number,

    orbit:
      AsteroidOrbitalElements,
  ): AsteroidTaxonomy {

    if (
      identity.beltRegion !==
        orbit.beltRegion ||
      identity.asteroidOrdinal !==
        orbit.asteroidOrdinal
    ) {
      throw new RangeError(
        'AsteroidTaxonomyEngine requires one exact point-22.3 identity/orbit pair.',
      );
    }

    if (
      !Number.isFinite(
        diameterKilometers,
      ) ||
      diameterKilometers <=
        0
    ) {
      throw new RangeError(
        'AsteroidTaxonomyEngine requires a positive finite diameter.',
      );
    }

    const compositionRegime =
      compositionRegimeV1(
        identity,
        orbit,
      );

    const prototype =
      COMPOSITION_PROTOTYPES[
        compositionRegime
      ];

    const fractions =
      compositionFractionsV1(
        identity,
        prototype,
      );

    const structureRegime =
      structureRegimeV1(
        identity,
        diameterKilometers,
      );

    const porosityIndex01 =
      porosityIndex01V1(
        identity,
        structureRegime,
      );

    const multiplicityRegime =
      multiplicityRegimeV1(
        identity,
        diameterKilometers,
        structureRegime,
      );

    const densityVariation =
      0.92 +
      0.16 *
        sample01V1(
          identity.proceduralId,
          'DENSITY',
        );

    const bulkDensityGramsPerCubicCentimeter =
      prototype.density *
      densityVariation *
      (
        1 -
        0.52 *
          porosityIndex01
      );

    const geometricAlbedo01 =
      clamp01(
        prototype.albedo *
        (
          0.78 +
          0.44 *
            sample01V1(
              identity.proceduralId,
              'ALBEDO',
            )
        ),
      );

    const binaryMassRatio01 =
      multiplicityRegime ===
        AsteroidMultiplicityRegime.BINARY
        ? 0.08 +
          0.72 *
            sample01V1(
              identity.proceduralId,
              'BINARY_MASS_RATIO',
            )
        : null;

    const binarySeparationPrimaryRadii =
      multiplicityRegime ===
        AsteroidMultiplicityRegime.BINARY
        ? 2.1 +
          8.9 *
            sample01V1(
              identity.proceduralId,
              'BINARY_SEPARATION',
            )
        : null;

    return new AsteroidTaxonomy(
      compositionRegime,
      structureRegime,
      multiplicityRegime,
      fractions.carbonaceous,
      fractions.silicate,
      fractions.metal,
      fractions.ice,
      porosityIndex01,
      bulkDensityGramsPerCubicCentimeter,
      geometricAlbedo01,
      binaryMassRatio01,
      binarySeparationPrimaryRadii,
    );
  }
}

function compositionRegimeV1(
  identity:
    AsteroidIdentity,

  orbit:
    AsteroidOrbitalElements,
): AsteroidCompositionRegime {

  const radialIndex01 =
    radialIndex01V1(
      orbit,
    );

  const sample =
    sample01V1(
      identity.proceduralId,
      'COMPOSITION',
    );

  if (
    identity.beltRegion ===
    AsteroidBeltRegion.INNER
  ) {
    const metallicCeiling =
      0.14 -
      0.05 *
        radialIndex01;

    const silicateCeiling =
      metallicCeiling +
      0.43 -
      0.08 *
        radialIndex01;

    const carbonaceousCeiling =
      silicateCeiling +
      0.30 +
      0.06 *
        radialIndex01;

    const mixedCeiling =
      carbonaceousCeiling +
      0.10 +
      0.04 *
        radialIndex01;

    if (
      sample <
      metallicCeiling
    ) {
      return AsteroidCompositionRegime.METALLIC;
    }

    if (
      sample <
      silicateCeiling
    ) {
      return AsteroidCompositionRegime.SILICACEOUS;
    }

    if (
      sample <
      carbonaceousCeiling
    ) {
      return AsteroidCompositionRegime.CARBONACEOUS;
    }

    if (
      sample <
      mixedCeiling
    ) {
      return AsteroidCompositionRegime.MIXED_ROCK_ICE;
    }

    return AsteroidCompositionRegime.ICE_RICH;
  }

  const iceCeiling =
    0.26 +
    0.22 *
      radialIndex01;

  const mixedCeiling =
    iceCeiling +
    0.24;

  const carbonaceousCeiling =
    mixedCeiling +
    0.29 -
    0.04 *
      radialIndex01;

  const silicateCeiling =
    carbonaceousCeiling +
    0.16 -
    0.08 *
      radialIndex01;

  if (
    sample <
    iceCeiling
  ) {
    return AsteroidCompositionRegime.ICE_RICH;
  }

  if (
    sample <
    mixedCeiling
  ) {
    return AsteroidCompositionRegime.MIXED_ROCK_ICE;
  }

  if (
    sample <
    carbonaceousCeiling
  ) {
    return AsteroidCompositionRegime.CARBONACEOUS;
  }

  if (
    sample <
    silicateCeiling
  ) {
    return AsteroidCompositionRegime.SILICACEOUS;
  }

  return AsteroidCompositionRegime.METALLIC;
}

function compositionFractionsV1(
  identity:
    AsteroidIdentity,

  prototype:
    CompositionPrototype,
): {
  readonly carbonaceous:
    number;

  readonly silicate:
    number;

  readonly metal:
    number;

  readonly ice:
    number;
} {

  const raw = [
    prototype.carbonaceous *
      variationV1(
        identity,
        'CARBON_FRACTION',
      ),
    prototype.silicate *
      variationV1(
        identity,
        'SILICATE_FRACTION',
      ),
    prototype.metal *
      variationV1(
        identity,
        'METAL_FRACTION',
      ),
    prototype.ice *
      variationV1(
        identity,
        'ICE_FRACTION',
      ),
  ];

  const total =
    raw.reduce(
      (
        sum,
        value,
      ) =>
        sum +
        value,
      0,
    );

  return Object.freeze({
    carbonaceous:
      raw[0] /
      total,
    silicate:
      raw[1] /
      total,
    metal:
      raw[2] /
      total,
    ice:
      raw[3] /
      total,
  });
}

function variationV1(
  identity:
    AsteroidIdentity,

  label:
    string,
): number {

  return (
    0.84 +
    0.32 *
      sample01V1(
        identity.proceduralId,
        label,
      )
  );
}

function structureRegimeV1(
  identity:
    AsteroidIdentity,

  diameterKilometers:
    number,
): AsteroidStructureRegime {

  const sample =
    sample01V1(
      identity.proceduralId,
      'STRUCTURE',
    );

  const rubbleSupport =
    clamp01(
      (
        380 -
        diameterKilometers
      ) /
      320,
    );

  const rubbleProbability =
    diameterKilometers >=
      450
      ? 0
      : 0.25 +
        0.45 *
          rubbleSupport;

  const fracturedProbability =
    diameterKilometers >=
      450
      ? 0.58
      : 0.25 +
        0.15 *
          (
            1 -
            rubbleSupport
          );

  if (
    sample <
    rubbleProbability
  ) {
    return AsteroidStructureRegime.RUBBLE_PILE;
  }

  if (
    sample <
    rubbleProbability +
      fracturedProbability
  ) {
    return AsteroidStructureRegime.FRACTURED;
  }

  return AsteroidStructureRegime.COHERENT;
}

function porosityIndex01V1(
  identity:
    AsteroidIdentity,

  structureRegime:
    AsteroidStructureRegime,
): number {

  const sample =
    sample01V1(
      identity.proceduralId,
      'POROSITY',
    );

  switch (
    structureRegime
  ) {
    case AsteroidStructureRegime.COHERENT:
      return (
        0.02 +
        0.10 *
          sample
      );

    case AsteroidStructureRegime.FRACTURED:
      return (
        0.12 +
        0.22 *
          sample
      );

    case AsteroidStructureRegime.RUBBLE_PILE:
      return (
        0.30 +
        0.30 *
          sample
      );
  }
}

function multiplicityRegimeV1(
  identity:
    AsteroidIdentity,

  diameterKilometers:
    number,

  structureRegime:
    AsteroidStructureRegime,
): AsteroidMultiplicityRegime {

  const sample =
    sample01V1(
      identity.proceduralId,
      'MULTIPLICITY',
    );

  const smallerBodySupport =
    clamp01(
      (
        520 -
        diameterKilometers
      ) /
      470,
    );

  const rubbleBonus =
    structureRegime ===
      AsteroidStructureRegime.RUBBLE_PILE
      ? 0.08
      : 0;

  const detachedProbability =
    0.035 +
    0.11 *
      smallerBodySupport +
    rubbleBonus;

  const contactProbability =
    0.045 +
    0.09 *
      smallerBodySupport +
    0.5 *
      rubbleBonus;

  if (
    sample <
    detachedProbability
  ) {
    return AsteroidMultiplicityRegime.BINARY;
  }

  if (
    sample <
    detachedProbability +
      contactProbability
  ) {
    return AsteroidMultiplicityRegime.CONTACT_BINARY;
  }

  return AsteroidMultiplicityRegime.SINGLE;
}

function radialIndex01V1(
  orbit:
    AsteroidOrbitalElements,
): number {

  const denominator =
    Math.log(
      orbit.sourceOuterEdgeAu /
      orbit.sourceInnerEdgeAu,
    );

  if (
    denominator <=
    0
  ) {
    return 0.5;
  }

  return clamp01(
    Math.log(
      orbit.semiMajorAxisAu /
      orbit.sourceInnerEdgeAu,
    ) /
    denominator,
  );
}

function sample01V1(
  proceduralId:
    string,

  label:
    string,
): number {

  const digest =
    sha256
      .create()
      .update(
        V1_DOMAIN,
      )
      .update(
        hexToBytes(
          proceduralId,
        ),
      )
      .update(
        utf8ToBytes(
          label,
        ),
      )
      .digest();

  const value =
    (
      digest[0] *
        0x1000000 +
      digest[1] *
        0x10000 +
      digest[2] *
        0x100 +
      digest[3]
    ) >>>
    0;

  return (
    value /
    0x100000000
  );
}

function clamp01(
  value:
    number,
): number {

  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
  );
}
