import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  HiiRegionPhysicalProperties,
} from '../../domain/galactic-object/hii-region-physical-properties';

import {
  HiiRegion,
} from '../../domain/galactic-object/hii-region';

import {
  NebulaType,
} from '../../domain/galactic-object/nebula-type';

import {
  StarFormationActivity,
  type StarFormationActivity as StarFormationActivityValue,
} from '../../domain/galactic-object/star-formation-activity';

import {
  StarFormationProfile,
} from '../../domain/galactic-object/star-formation-profile';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  NebulaGenerator,
} from './nebula-generator';

const V1_HII_DOMAIN =
  utf8ToBytes(
    'GENESIS-HII-STAR-FORMATION-V1',
  );

const V1_PRESENCE_LABEL =
  utf8ToBytes(
    'hii-region-presence',
  );

const V1_RADIUS_FRACTION_LABEL =
  utf8ToBytes(
    'hii-radius-fraction',
  );

const V1_ELECTRON_TEMPERATURE_LABEL =
  utf8ToBytes(
    'electron-temperature-kelvin',
  );

const V1_ELECTRON_DENSITY_LABEL =
  utf8ToBytes(
    'electron-density-cm3',
  );

const V1_ACTIVITY_LABEL =
  utf8ToBytes(
    'star-formation-activity',
  );

const V1_STAR_FORMATION_RATE_LABEL =
  utf8ToBytes(
    'star-formation-rate-msun-per-myr',
  );

const V1_YOUNG_STELLAR_AGE_LABEL =
  utf8ToBytes(
    'young-stellar-age-myr',
  );

const V1_IONIZING_STAR_COUNT_LABEL =
  utf8ToBytes(
    'ionizing-star-count',
  );

const V1_IONIZING_PHOTON_RATE_LABEL =
  utf8ToBytes(
    'ionizing-photon-rate-s-1',
  );

const UINT32_SCALE =
  4294967296;

const V1_HII_PRESENCE_PROBABILITY =
  0.75;

interface NumericRange {
  readonly min:
    number;

  readonly max:
    number;
}

interface IntegerRange {
  readonly min:
    number;

  readonly max:
    number;
}

interface V1StarFormationProfile {
  readonly starFormationRateSolarMassesPerMillionYears:
    NumericRange;

  readonly ionizingStarCount:
    IntegerRange;

  readonly ionizingPhotonRatePerSecond:
    NumericRange;
}

/**
 * Deterministic point-12.3 Ground Truth generator for H II regions and their
 * associated massive-star formation.
 *
 * Frozen V1 contracts:
 *
 * - an H II region never receives a second GalacticObjectLocator: it reuses the
 *   parent emission-nebula identity from points 12.1/12.2;
 * - only the canonical point-9.4 NEBULA family can qualify;
 * - only point-12.2 EMISSION nebulae can qualify;
 * - not every emission nebula is forced to be H II: V1 uses an independent
 *   75% presence branch, leaving room for other emission-nebula physics;
 * - H II radius is always a deterministic fraction of the parent nebula radius;
 * - star-formation quantities are aggregate Ground Truth and do not materialize
 *   point-12.4 open clusters;
 * - every property has an isolated SHA-256 label so future additions cannot
 *   perturb the frozen V1 values;
 * - no persistence, observation state, Discovery Points, scientific actions or
 *   render data are touched.
 */
export class HiiRegionGenerator {

  private constructor() {}

  static isHiiRegionLocator(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): boolean {

    return (
      this.resolveActivity(
        generationKey,
        locator,
      ) !==
      null
    );
  }

  /**
   * Resolves only the deterministic H II activity discriminator.
   *
   * This method intentionally does not materialize NebulaPhysicalProperties,
   * HiiRegionPhysicalProperties or StarFormationProfile. Presentation may use
   * the result exclusively as an opaque renderer-profile selector while the
   * activity label and numeric Ground Truth remain hidden by observation state.
   */
  static resolveActivity(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): StarFormationActivityValue | null {

    requireV1(
      generationKey,
    );

    if (
      !NebulaGenerator
        .isNebulaLocator(
          generationKey,
          locator,
        )
    ) {
      return null;
    }

    if (
      NebulaGenerator
        .resolveType(
          generationKey,
          locator,
        ) !==
      NebulaType.EMISSION
    ) {
      return null;
    }

    const targetSeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        );

    if (
      unitV1(
        targetSeed.normalizedValue,
        V1_PRESENCE_LABEL,
      ) >=
      V1_HII_PRESENCE_PROBABILITY
    ) {
      return null;
    }

    return resolveActivityV1(
      targetSeed.normalizedValue,
    );
  }

  static generate(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): HiiRegion {

    requireV1(
      generationKey,
    );

    if (
      !NebulaGenerator
        .isNebulaLocator(
          generationKey,
          locator,
        )
    ) {
      throw new RangeError(
        'HiiRegionGenerator requires a GalacticObjectLocator from the canonical point-9.4 NEBULA family.',
      );
    }

    const nebula =
      NebulaGenerator
        .generate(
          generationKey,
          locator,
        );

    if (
      nebula.nebulaType !==
      NebulaType.EMISSION
    ) {
      throw new RangeError(
        'HiiRegionGenerator requires a point-12.2 EMISSION nebula.',
      );
    }

    const targetSeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        );

    if (
      unitV1(
        targetSeed.normalizedValue,
        V1_PRESENCE_LABEL,
      ) >=
      V1_HII_PRESENCE_PROBABILITY
    ) {
      throw new RangeError(
        'The canonical V1 emission nebula does not contain an H II region.',
      );
    }

    const activity =
      resolveActivityV1(
        targetSeed.normalizedValue,
      );

    const activityProfile =
      profileForActivityV1(
        activity,
      );

    const radiusFraction =
      linearRangeV1(
        {
          min:
            0.15,
          max:
            0.85,
        },
        unitV1(
          targetSeed.normalizedValue,
          V1_RADIUS_FRACTION_LABEL,
        ),
      );

    return new HiiRegion(
      nebula.generationKey,
      nebula.locator,
      nebula.location,
      nebula.physicalProperties,
      new HiiRegionPhysicalProperties(
        nebula
          .physicalProperties
          .radiusParsecs *
          radiusFraction,
        linearRangeV1(
          {
            min:
              7_000,
            max:
              12_000,
          },
          unitV1(
            targetSeed.normalizedValue,
            V1_ELECTRON_TEMPERATURE_LABEL,
          ),
        ),
        logRangeV1(
          {
            min:
              10,
            max:
              10_000,
          },
          unitV1(
            targetSeed.normalizedValue,
            V1_ELECTRON_DENSITY_LABEL,
          ),
        ),
      ),
      new StarFormationProfile(
        activity,
        logRangeV1(
          activityProfile
            .starFormationRateSolarMassesPerMillionYears,
          unitV1(
            targetSeed.normalizedValue,
            V1_STAR_FORMATION_RATE_LABEL,
          ),
        ),
        linearRangeV1(
          {
            min:
              0.2,
            max:
              8,
          },
          unitV1(
            targetSeed.normalizedValue,
            V1_YOUNG_STELLAR_AGE_LABEL,
          ),
        ),
        integerRangeV1(
          activityProfile
            .ionizingStarCount,
          unitV1(
            targetSeed.normalizedValue,
            V1_IONIZING_STAR_COUNT_LABEL,
          ),
        ),
        logRangeV1(
          activityProfile
            .ionizingPhotonRatePerSecond,
          unitV1(
            targetSeed.normalizedValue,
            V1_IONIZING_PHOTON_RATE_LABEL,
          ),
        ),
      ),
    );
  }
}

function requireV1(
  generationKey:
    UniverseGenerationKey,
): void {

  if (
    generationKey
      .generatorVersion !==
    GeneratorVersion.V1
  ) {
    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }
}

function resolveActivityV1(
  targetSeedHex:
    string,
): StarFormationActivityValue {

  const value =
    unitV1(
      targetSeedHex,
      V1_ACTIVITY_LABEL,
    );

  if (
    value <
      0.35
  ) {
    return StarFormationActivity
      .LOW;
  }

  if (
    value <
      0.70
  ) {
    return StarFormationActivity
      .MODERATE;
  }

  if (
    value <
      0.92
  ) {
    return StarFormationActivity
      .HIGH;
  }

  return StarFormationActivity
    .INTENSE;
}

function profileForActivityV1(
  activity:
    StarFormationActivityValue,
): V1StarFormationProfile {

  switch (
    activity
  ) {
    case StarFormationActivity.LOW:
      return {
        starFormationRateSolarMassesPerMillionYears: {
          min:
            100,
          max:
            1_000,
        },
        ionizingStarCount: {
          min:
            1,
          max:
            8,
        },
        ionizingPhotonRatePerSecond: {
          min:
            1e47,
          max:
            3e49,
        },
      };

    case StarFormationActivity.MODERATE:
      return {
        starFormationRateSolarMassesPerMillionYears: {
          min:
            1_000,
          max:
            5_000,
        },
        ionizingStarCount: {
          min:
            5,
          max:
            40,
        },
        ionizingPhotonRatePerSecond: {
          min:
            1e49,
          max:
            3e50,
        },
      };

    case StarFormationActivity.HIGH:
      return {
        starFormationRateSolarMassesPerMillionYears: {
          min:
            5_000,
          max:
            20_000,
        },
        ionizingStarCount: {
          min:
            20,
          max:
            250,
        },
        ionizingPhotonRatePerSecond: {
          min:
            1e50,
          max:
            3e51,
        },
      };

    case StarFormationActivity.INTENSE:
      return {
        starFormationRateSolarMassesPerMillionYears: {
          min:
            20_000,
          max:
            100_000,
        },
        ionizingStarCount: {
          min:
            100,
          max:
            2_000,
        },
        ionizingPhotonRatePerSecond: {
          min:
            1e51,
          max:
            1e52,
        },
      };
  }
}

function unitV1(
  targetSeedHex:
    string,

  label:
    Uint8Array,
): number {

  const digest =
    sha256
      .create()
      .update(
        V1_HII_DOMAIN,
      )
      .update(
        hexToBytes(
          targetSeedHex,
        ),
      )
      .update(
        label,
      )
      .digest();

  return (
    readUint32BigEndian(
      digest,
      0,
    ) /
    UINT32_SCALE
  );
}

function linearRangeV1(
  range:
    NumericRange,

  unit:
    number,
): number {

  return (
    range.min +
    (
      range.max -
      range.min
    ) *
      unit
  );
}

function logRangeV1(
  range:
    NumericRange,

  unit:
    number,
): number {

  const minLog =
    Math.log10(
      range.min,
    );

  const maxLog =
    Math.log10(
      range.max,
    );

  return Math.pow(
    10,
    minLog +
      (
        maxLog -
        minLog
      ) *
        unit,
  );
}

function integerRangeV1(
  range:
    IntegerRange,

  unit:
    number,
): number {

  return (
    range.min +
    Math.floor(
      unit *
      (
        range.max -
        range.min +
        1
      ),
    )
  );
}

function readUint32BigEndian(
  bytes:
    Uint8Array,

  offset:
    number,
): number {

  return (
    bytes[offset] *
      0x1000000 +
    bytes[
      offset +
      1
    ] *
      0x10000 +
    bytes[
      offset +
      2
    ] *
      0x100 +
    bytes[
      offset +
      3
    ]
  );
}
