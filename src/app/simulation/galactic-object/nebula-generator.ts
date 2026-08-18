import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  NebulaPhysicalProperties,
} from '../../domain/galactic-object/nebula-physical-properties';

import {
  NebulaType,
  type NebulaType as NebulaTypeValue,
} from '../../domain/galactic-object/nebula-type';

import {
  Nebula,
} from '../../domain/galactic-object/nebula';

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
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  ExplorationSectorResultEngine,
} from '../exploration/exploration-sector-result-engine';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  GalacticObjectGenerator,
} from './galactic-object-generator';

const V1_NEBULA_DOMAIN =
  utf8ToBytes(
    'GENESIS-NEBULA-PROFILE-V1',
  );

const V1_TYPE_LABEL =
  utf8ToBytes(
    'nebula-type',
  );

const V1_RADIUS_LABEL =
  utf8ToBytes(
    'radius-parsecs',
  );

const V1_MASS_LABEL =
  utf8ToBytes(
    'mass-solar-masses',
  );

const V1_TEMPERATURE_LABEL =
  utf8ToBytes(
    'gas-temperature-kelvin',
  );

const V1_DENSITY_LABEL =
  utf8ToBytes(
    'hydrogen-number-density-cm3',
  );

const V1_IONIZATION_LABEL =
  utf8ToBytes(
    'ionization-fraction',
  );

const V1_DUST_LABEL =
  utf8ToBytes(
    'dust-to-gas-mass-ratio',
  );

const UINT32_SCALE =
  4294967296;

interface NumericRange {
  readonly min:
    number;

  readonly max:
    number;
}

interface V1NebulaProfile {
  readonly radiusParsecs:
    NumericRange;

  readonly massSolarMasses:
    NumericRange;

  readonly gasTemperatureKelvin:
    NumericRange;

  readonly hydrogenNumberDensityPerCm3:
    NumericRange;

  readonly ionizationFraction:
    NumericRange;

  readonly dustToGasMassRatio:
    NumericRange;
}

/**
 * Deterministic point-12.2 Ground Truth generator for physical nebulae.
 *
 * Important contracts:
 *
 * - only GalacticObjectLocator values already belonging to the frozen point-9.4
 *   coarse NEBULA family may be materialized as Nebula;
 * - the four physical subtypes remain hidden Ground Truth until observation
 *   rules expose them;
 * - all draws use independent SHA-256 labels, so adding one property later does
 *   not reorder or perturb the existing V1 values;
 * - no repository, discovery state, Discovery Points, scientific action or
 *   renderer is touched;
 * - H II / star-formation specialization remains intentionally deferred to
 *   point 12.3. Emission nebulae provide a compatible physical base for it.
 */
export class NebulaGenerator {

  private constructor() {}

  static isNebulaLocator(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): boolean {

    return (
      ExplorationSectorResultEngine
        .resolveGalacticObjectKind(
          generationKey,
          locator,
        ) ===
      ExplorationResultKind.NEBULA
    );
  }

  static generate(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): Nebula {

    if (
      generationKey
        .generatorVersion !==
      GeneratorVersion.V1
    ) {
      throw new RangeError(
        `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
      );
    }

    if (
      !this.isNebulaLocator(
        generationKey,
        locator,
      )
    ) {
      throw new RangeError(
        'NebulaGenerator requires a GalacticObjectLocator from the canonical point-9.4 NEBULA family.',
      );
    }

    const commonObject =
      GalacticObjectGenerator
        .generate(
          generationKey,
          locator,
        );

    const targetSeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        );

    const nebulaType =
      resolveTypeV1(
        targetSeed
          .normalizedValue,
      );

    const profile =
      profileForV1(
        nebulaType,
      );

    return new Nebula(
      commonObject
        .generationKey,
      commonObject
        .locator,
      commonObject
        .location,
      nebulaType,
      new NebulaPhysicalProperties(
        logRangeV1(
          profile.radiusParsecs,
          unitV1(
            targetSeed.normalizedValue,
            V1_RADIUS_LABEL,
          ),
        ),
        logRangeV1(
          profile.massSolarMasses,
          unitV1(
            targetSeed.normalizedValue,
            V1_MASS_LABEL,
          ),
        ),
        linearRangeV1(
          profile.gasTemperatureKelvin,
          unitV1(
            targetSeed.normalizedValue,
            V1_TEMPERATURE_LABEL,
          ),
        ),
        logRangeV1(
          profile.hydrogenNumberDensityPerCm3,
          unitV1(
            targetSeed.normalizedValue,
            V1_DENSITY_LABEL,
          ),
        ),
        linearRangeV1(
          profile.ionizationFraction,
          unitV1(
            targetSeed.normalizedValue,
            V1_IONIZATION_LABEL,
          ),
        ),
        linearRangeV1(
          profile.dustToGasMassRatio,
          unitV1(
            targetSeed.normalizedValue,
            V1_DUST_LABEL,
          ),
        ),
      ),
    );
  }
}

function resolveTypeV1(
  targetSeedHex:
    string,
): NebulaTypeValue {

  const value =
    unitV1(
      targetSeedHex,
      V1_TYPE_LABEL,
    );

  if (
    value <
      0.40
  ) {
    return NebulaType
      .EMISSION;
  }

  if (
    value <
      0.60
  ) {
    return NebulaType
      .REFLECTION;
  }

  if (
    value <
      0.90
  ) {
    return NebulaType
      .DARK;
  }

  return NebulaType
    .PLANETARY;
}

function profileForV1(
  nebulaType:
    NebulaTypeValue,
): V1NebulaProfile {

  switch (
    nebulaType
  ) {
    case NebulaType.EMISSION:
      return {
        radiusParsecs: {
          min:
            2,
          max:
            80,
        },
        massSolarMasses: {
          min:
            50,
          max:
            100_000,
        },
        gasTemperatureKelvin: {
          min:
            7_000,
          max:
            12_000,
        },
        hydrogenNumberDensityPerCm3: {
          min:
            10,
          max:
            2_000,
        },
        ionizationFraction: {
          min:
            0.65,
          max:
            1,
        },
        dustToGasMassRatio: {
          min:
            0.005,
          max:
            0.020,
        },
      };

    case NebulaType.REFLECTION:
      return {
        radiusParsecs: {
          min:
            0.5,
          max:
            25,
        },
        massSolarMasses: {
          min:
            5,
          max:
            20_000,
        },
        gasTemperatureKelvin: {
          min:
            20,
          max:
            150,
        },
        hydrogenNumberDensityPerCm3: {
          min:
            100,
          max:
            10_000,
        },
        ionizationFraction: {
          min:
            0,
          max:
            0.08,
        },
        dustToGasMassRatio: {
          min:
            0.008,
          max:
            0.025,
        },
      };

    case NebulaType.DARK:
      return {
        radiusParsecs: {
          min:
            2,
          max:
            60,
        },
        massSolarMasses: {
          min:
            100,
          max:
            1_000_000,
        },
        gasTemperatureKelvin: {
          min:
            8,
          max:
            40,
        },
        hydrogenNumberDensityPerCm3: {
          min:
            100,
          max:
            100_000,
        },
        ionizationFraction: {
          min:
            0,
          max:
            0.01,
        },
        dustToGasMassRatio: {
          min:
            0.010,
          max:
            0.030,
        },
      };

    case NebulaType.PLANETARY:
      return {
        radiusParsecs: {
          min:
            0.05,
          max:
            2,
        },
        massSolarMasses: {
          min:
            0.05,
          max:
            1.5,
        },
        gasTemperatureKelvin: {
          min:
            8_000,
          max:
            20_000,
        },
        hydrogenNumberDensityPerCm3: {
          min:
            100,
          max:
            100_000,
        },
        ionizationFraction: {
          min:
            0.70,
          max:
            1,
        },
        dustToGasMassRatio: {
          min:
            0.001,
          max:
            0.020,
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
        V1_NEBULA_DOMAIN,
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
