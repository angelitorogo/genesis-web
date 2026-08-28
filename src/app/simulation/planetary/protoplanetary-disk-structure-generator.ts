import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type PlanetFormationProfile,
} from '../../domain/planetary/planet-formation-profile';

import {
  ProtoplanetaryCondensationRegion,
} from '../../domain/planetary/protoplanetary-condensation-region';

import {
  ProtoplanetaryCondensationRegionKind,
} from '../../domain/planetary/protoplanetary-condensation-region-kind';

import {
  ProtoplanetaryDiskGap,
} from '../../domain/planetary/protoplanetary-disk-gap';

import {
  ProtoplanetaryDiskGapKind,
} from '../../domain/planetary/protoplanetary-disk-gap-kind';

import {
  type ProtoplanetaryDiskProfile,
} from '../../domain/planetary/protoplanetary-disk-profile';

import {
  ProtoplanetaryDiskStage,
} from '../../domain/planetary/protoplanetary-disk-stage';

import {
  ProtoplanetaryDiskStructure,
} from '../../domain/planetary/protoplanetary-disk-structure';

import {
  type SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

const V1_STRUCTURE_BRANCH =
  utf8ToBytes(
    'GENESIS-PROTOPLANETARY-DISK-STRUCTURE-V1',
  );

const V1_DUST_SUBLIMATION_TEMPERATURE_KELVIN =
  1_500;

const V1_REFRACTORY_TO_ROCKY_TEMPERATURE_KELVIN =
  700;

const V1_WATER_SNOWLINE_TEMPERATURE_KELVIN =
  170;

const V1_CO2_SNOWLINE_TEMPERATURE_KELVIN =
  70;

const V1_VOLATILE_ICE_TEMPERATURE_KELVIN =
  25;

interface V1GapCandidate {
  readonly kind:
    ProtoplanetaryDiskGapKind;

  readonly centerRadiusAu:
    number;

  readonly halfWidthAu:
    number;

  readonly gasDepletionFraction01:
    number;

  readonly dustDepletionFraction01:
    number;
}

/**
 * Point-17.3 deterministic internal-structure generator for the frozen 17.2
 * bulk disk.
 *
 * Composition is governed by the already-existing sector metallicity proxy and
 * by point-17.2 disk evolution. Condensation fronts follow a simple radial
 * temperature power law. Gap morphology is the first phase-17 feature to use a
 * dedicated SystemSeed SHA-256 branch; every draw label is independent so
 * adding a future property cannot shift the frozen V1 values of another one.
 *
 * No gap is attributed to a protoplanet and no body is materialized here.
 */
export class ProtoplanetaryDiskStructureGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    systemSeed:
      SystemSeed,

    diskProfile:
      ProtoplanetaryDiskProfile,

    planetFormationProfile:
      PlanetFormationProfile,
  ): ProtoplanetaryDiskStructure {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        systemSeed,
        diskProfile,
        planetFormationProfile,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    systemSeed:
      SystemSeed,

    diskProfile:
      ProtoplanetaryDiskProfile,

    planetFormationProfile:
      PlanetFormationProfile,
  ): ProtoplanetaryDiskStructure {

    const progress =
      diskProfile
        .evolutionProgress01;

    const solidMaterialIndex =
      planetFormationProfile
        .solidMaterialIndex;

    const initialDustToGasMassRatio =
      clamp(
        0.004 +
          0.018 *
            solidMaterialIndex,
        0.003,
        0.030,
      );

    const preferentialGasLossBoost =
      1 +
      2.5 *
        progress **
          1.7;

    const dustToGasMassRatio =
      clamp(
        initialDustToGasMassRatio *
          preferentialGasLossBoost,
        0.003,
        0.080,
      );

    const gasMassFraction01 =
      1 /
      (
        1 +
        dustToGasMassRatio
      );

    const dustMassFraction01 =
      1 -
      gasMassFraction01;

    const gasMassSolar =
      diskProfile
        .diskMassSolar *
      gasMassFraction01;

    const dustMassSolar =
      diskProfile
        .diskMassSolar -
      gasMassSolar;

    const gasDepletionIndex01 =
      clamp01(
        progress **
          1.35 *
          (
            0.72 +
            0.18 *
              deterministicUnitV1(
                systemSeed,
                'gas-depletion-index',
              )
          ),
      );

    const dustSettlingIndex01 =
      clamp01(
        0.08 +
          0.72 *
            Math.sqrt(
              progress,
            ) +
          0.12 *
            solidMaterialIndex +
          0.06 *
            (
              deterministicUnitV1(
                systemSeed,
                'dust-settling-index',
              ) -
              0.5
            ),
      );

    const temperaturePowerLawExponent =
      clamp(
        0.47 +
          0.10 *
            progress +
          0.04 *
            (
              deterministicUnitV1(
                systemSeed,
                'temperature-power-law',
              ) -
              0.5
            ),
        0.43,
        0.64,
      );

    const condensationRegions =
      condensationRegionsV1(
        diskProfile,
        temperaturePowerLawExponent,
      );

    const waterSnowLineRadiusAuOrNull =
      condensationRegions
        .find(
          region =>
            region.kind ===
            ProtoplanetaryCondensationRegionKind.WATER_ICE_RICH_SOLIDS,
        )
        ?.innerRadiusAu ??
      null;

    const gaps =
      gapsV1(
        systemSeed,
        diskProfile,
        dustSettlingIndex01,
        waterSnowLineRadiusAuOrNull,
      );

    return new ProtoplanetaryDiskStructure(
      diskProfile
        .diskMassSolar,
      diskProfile
        .innerRadiusAu,
      diskProfile
        .outerRadiusAu,
      gasMassSolar,
      dustMassSolar,
      gasMassFraction01,
      dustMassFraction01,
      dustToGasMassRatio,
      gasDepletionIndex01,
      dustSettlingIndex01,
      temperaturePowerLawExponent,
      gaps,
      condensationRegions,
    );
  }
}

function condensationRegionsV1(
  diskProfile:
    ProtoplanetaryDiskProfile,

  temperaturePowerLawExponent:
    number,
): readonly ProtoplanetaryCondensationRegion[] {

  const boundaries = [
    diskProfile
      .innerRadiusAu,
  ];

  for (
    const thresholdKelvin
    of [
      V1_DUST_SUBLIMATION_TEMPERATURE_KELVIN,
      V1_REFRACTORY_TO_ROCKY_TEMPERATURE_KELVIN,
      V1_WATER_SNOWLINE_TEMPERATURE_KELVIN,
      V1_CO2_SNOWLINE_TEMPERATURE_KELVIN,
      V1_VOLATILE_ICE_TEMPERATURE_KELVIN,
    ]
  ) {
    const frontRadiusAu =
      radiusAtTemperatureV1(
        diskProfile
          .referenceTemperatureAt1AuKelvin,
        temperaturePowerLawExponent,
        thresholdKelvin,
      );

    if (
      frontRadiusAu >
        diskProfile
          .innerRadiusAu &&
      frontRadiusAu <
        diskProfile
          .outerRadiusAu
    ) {
      boundaries.push(
        frontRadiusAu,
      );
    }
  }

  boundaries.push(
    diskProfile
      .outerRadiusAu,
  );

  const orderedBoundaries =
    uniqueSortedPositive(
      boundaries,
    );

  const regions:
    ProtoplanetaryCondensationRegion[] =
      [];

  for (
    let index = 0;
    index <
      orderedBoundaries.length -
        1;
    index += 1
  ) {
    const innerRadiusAu =
      orderedBoundaries[
        index
      ];

    const outerRadiusAu =
      orderedBoundaries[
        index +
        1
      ];

    const midpointRadiusAu =
      Math.sqrt(
        innerRadiusAu *
        outerRadiusAu,
      );

    const midpointTemperatureKelvin =
      temperatureAtRadiusV1(
        diskProfile
          .referenceTemperatureAt1AuKelvin,
        temperaturePowerLawExponent,
        midpointRadiusAu,
      );

    regions.push(
      new ProtoplanetaryCondensationRegion(
        condensationKindV1(
          midpointTemperatureKelvin,
        ),
        innerRadiusAu,
        outerRadiusAu,
        temperatureAtRadiusV1(
          diskProfile
            .referenceTemperatureAt1AuKelvin,
          temperaturePowerLawExponent,
          innerRadiusAu,
        ),
        temperatureAtRadiusV1(
          diskProfile
            .referenceTemperatureAt1AuKelvin,
          temperaturePowerLawExponent,
          outerRadiusAu,
        ),
      ),
    );
  }

  return regions;
}

function condensationKindV1(
  temperatureKelvin:
    number,
): ProtoplanetaryCondensationRegionKind {

  if (
    temperatureKelvin >=
    V1_DUST_SUBLIMATION_TEMPERATURE_KELVIN
  ) {
    return ProtoplanetaryCondensationRegionKind
      .DUST_SUBLIMATION_ZONE;
  }

  if (
    temperatureKelvin >=
    V1_REFRACTORY_TO_ROCKY_TEMPERATURE_KELVIN
  ) {
    return ProtoplanetaryCondensationRegionKind
      .REFRACTORY_SOLIDS;
  }

  if (
    temperatureKelvin >=
    V1_WATER_SNOWLINE_TEMPERATURE_KELVIN
  ) {
    return ProtoplanetaryCondensationRegionKind
      .ROCKY_SILICATE_SOLIDS;
  }

  if (
    temperatureKelvin >=
    V1_CO2_SNOWLINE_TEMPERATURE_KELVIN
  ) {
    return ProtoplanetaryCondensationRegionKind
      .WATER_ICE_RICH_SOLIDS;
  }

  if (
    temperatureKelvin >=
    V1_VOLATILE_ICE_TEMPERATURE_KELVIN
  ) {
    return ProtoplanetaryCondensationRegionKind
      .CO2_ICE_RICH_SOLIDS;
  }

  return ProtoplanetaryCondensationRegionKind
    .VOLATILE_ICE_RICH_SOLIDS;
}

function gapsV1(
  systemSeed:
    SystemSeed,

  diskProfile:
    ProtoplanetaryDiskProfile,

  dustSettlingIndex01:
    number,

  waterSnowLineRadiusAuOrNull:
    number | null,
): readonly ProtoplanetaryDiskGap[] {

  const gaps:
    ProtoplanetaryDiskGap[] =
      [];

  const progress =
    diskProfile
      .evolutionProgress01;

  if (
    diskProfile
      .stage ===
      ProtoplanetaryDiskStage.DISPERSING_DISK ||
    progress >=
      0.78
  ) {
    const centerRadiusAu =
      clamp(
        4.5 *
          diskProfile
            .centralMassSolar **
            0.8 *
          (
            0.80 +
            0.40 *
              deterministicUnitV1(
                systemSeed,
                'photo-gap-center',
              )
          ),
        diskProfile
          .innerRadiusAu *
          2.5,
        diskProfile
          .characteristicRadiusAu *
          0.55,
      );

    tryAddGapV1(
      gaps,
      diskProfile,
      {
        kind:
          ProtoplanetaryDiskGapKind.PHOTOEVAPORATIVE_GAP,
        centerRadiusAu,
        halfWidthAu:
          centerRadiusAu *
          (
            0.12 +
            0.12 *
              deterministicUnitV1(
                systemSeed,
                'photo-gap-width',
              )
          ),
        gasDepletionFraction01:
          clamp01(
            0.62 +
              0.30 *
                progress +
              0.05 *
                deterministicUnitV1(
                  systemSeed,
                  'photo-gap-gas-depth',
                ),
          ),
        dustDepletionFraction01:
          clamp01(
            0.45 +
              0.35 *
                dustSettlingIndex01 +
              0.08 *
                deterministicUnitV1(
                  systemSeed,
                  'photo-gap-dust-depth',
                ),
          ),
      },
    );
  }

  const viscosityGapProbability =
    diskProfile
      .stage ===
      ProtoplanetaryDiskStage.EMBEDDED_ACCRETION_DISK
      ? 0.18
      : 0.58 +
        0.25 *
          progress;

  if (
    deterministicUnitV1(
      systemSeed,
      'viscosity-gap-presence',
    ) <
    viscosityGapProbability
  ) {
    const centerRadiusAu =
      clamp(
        diskProfile
          .characteristicRadiusAu *
          (
            0.22 +
            0.40 *
              deterministicUnitV1(
                systemSeed,
                'viscosity-gap-center',
              )
          ),
        diskProfile
          .innerRadiusAu *
          2.5,
        diskProfile
          .outerRadiusAu *
          0.72,
      );

    tryAddGapV1(
      gaps,
      diskProfile,
      {
        kind:
          ProtoplanetaryDiskGapKind.VISCOSITY_TRANSITION_GAP,
        centerRadiusAu,
        halfWidthAu:
          centerRadiusAu *
          (
            0.035 +
            0.055 *
              deterministicUnitV1(
                systemSeed,
                'viscosity-gap-width',
              )
          ),
        gasDepletionFraction01:
          clamp01(
            0.08 +
              0.24 *
                progress +
              0.10 *
                deterministicUnitV1(
                  systemSeed,
                  'viscosity-gap-gas-depth',
                ),
          ),
        dustDepletionFraction01:
          clamp01(
            0.24 +
              0.38 *
                dustSettlingIndex01 +
              0.12 *
                deterministicUnitV1(
                  systemSeed,
                  'viscosity-gap-dust-depth',
                ),
          ),
      },
    );
  }

  if (
    waterSnowLineRadiusAuOrNull !==
      null &&
    deterministicUnitV1(
      systemSeed,
      'condensation-gap-presence',
    ) <
      0.62
  ) {
    const centerRadiusAu =
      waterSnowLineRadiusAuOrNull *
      (
        0.96 +
        0.08 *
          deterministicUnitV1(
            systemSeed,
            'condensation-gap-center',
          )
      );

    tryAddGapV1(
      gaps,
      diskProfile,
      {
        kind:
          ProtoplanetaryDiskGapKind.CONDENSATION_FRONT_DEPLETION_GAP,
        centerRadiusAu,
        halfWidthAu:
          centerRadiusAu *
          (
            0.025 +
            0.035 *
              deterministicUnitV1(
                systemSeed,
                'condensation-gap-width',
              )
          ),
        gasDepletionFraction01:
          0.04 +
          0.09 *
            deterministicUnitV1(
              systemSeed,
              'condensation-gap-gas-depth',
            ),
        dustDepletionFraction01:
          clamp01(
            0.18 +
              0.32 *
                dustSettlingIndex01 +
              0.10 *
                deterministicUnitV1(
                  systemSeed,
                  'condensation-gap-dust-depth',
                ),
          ),
      },
    );
  }

  return [
    ...gaps,
  ].sort(
    (
      first,
      second,
    ) =>
      first.innerRadiusAu -
      second.innerRadiusAu,
  );
}

function tryAddGapV1(
  gaps:
    ProtoplanetaryDiskGap[],

  diskProfile:
    ProtoplanetaryDiskProfile,

  candidate:
    V1GapCandidate,
): void {

  const safeInnerEdge =
    diskProfile
      .innerRadiusAu *
      1.05;

  const safeOuterEdge =
    diskProfile
      .outerRadiusAu *
      0.98;

  if (
    safeOuterEdge <=
    safeInnerEdge
  ) {
    return;
  }

  const innerRadiusAu =
    clamp(
      candidate.centerRadiusAu -
        candidate.halfWidthAu,
      safeInnerEdge,
      safeOuterEdge,
    );

  const outerRadiusAu =
    clamp(
      candidate.centerRadiusAu +
        candidate.halfWidthAu,
      safeInnerEdge,
      safeOuterEdge,
    );

  if (
    outerRadiusAu <=
    innerRadiusAu *
      1.005
  ) {
    return;
  }

  const overlapsExisting =
    gaps.some(
      existing =>
        innerRadiusAu <
          existing.outerRadiusAu &&
        outerRadiusAu >
          existing.innerRadiusAu,
    );

  if (
    overlapsExisting
  ) {
    return;
  }

  gaps.push(
    new ProtoplanetaryDiskGap(
      candidate.kind,
      innerRadiusAu,
      outerRadiusAu,
      candidate.gasDepletionFraction01,
      candidate.dustDepletionFraction01,
    ),
  );
}

function radiusAtTemperatureV1(
  referenceTemperatureAt1AuKelvin:
    number,

  temperaturePowerLawExponent:
    number,

  targetTemperatureKelvin:
    number,
): number {

  return (
    referenceTemperatureAt1AuKelvin /
    targetTemperatureKelvin
  ) **
    (
      1 /
      temperaturePowerLawExponent
    );
}

function temperatureAtRadiusV1(
  referenceTemperatureAt1AuKelvin:
    number,

  temperaturePowerLawExponent:
    number,

  radiusAu:
    number,
): number {

  return (
    referenceTemperatureAt1AuKelvin *
    radiusAu **
      -temperaturePowerLawExponent
  );
}

function uniqueSortedPositive(
  values:
    readonly number[],
): number[] {

  const sorted =
    [
      ...values,
    ]
      .filter(
        value =>
          Number.isFinite(
            value,
          ) &&
          value >
            0,
      )
      .sort(
        (
          first,
          second,
        ) =>
          first -
          second,
      );

  const unique:
    number[] =
      [];

  for (
    const value
    of sorted
  ) {
    const previous =
      unique[
        unique.length -
        1
      ];

    if (
      previous ===
        undefined ||
      Math.abs(
        value -
        previous,
      ) >
        1e-10 *
          Math.max(
            1,
            Math.abs(
              value,
            ),
            Math.abs(
              previous,
            ),
          )
    ) {
      unique.push(
        value,
      );
    }
  }

  return unique;
}

function deterministicUnitV1(
  systemSeed:
    SystemSeed,

  label:
    string,
): number {

  const digest =
    sha256
      .create()
      .update(
        V1_STRUCTURE_BRANCH,
      )
      .update(
        hexToBytes(
          systemSeed
            .normalizedValue,
        ),
      )
      .update(
        utf8ToBytes(
          label,
        ),
      )
      .digest();

  let value =
    0;

  for (
    let index = 0;
    index < 6;
    index += 1
  ) {
    value =
      value *
        256 +
      digest[
        index
      ];
  }

  return (
    value /
    2 **
      48
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

  if (
    max <
    min
  ) {
    return (
      min +
      max
    ) /
      2;
  }

  return Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );
}
