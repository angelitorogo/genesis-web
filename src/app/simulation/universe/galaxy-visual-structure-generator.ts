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
  type Galaxy,
} from '../../domain/universe/galaxy';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  Sfc64Random,
} from '../random/sfc64-random';

import {
  GalaxyVisualArm,
  GalaxyVisualBar,
  GalaxyVisualRegionLayout,
  GalaxyVisualStructure,
  GalaxyWindingDirection,
} from '../../domain/universe/galaxy-visual-structure';

const TWO_PI =
  2 * Math.PI;

const UINT32_SCALE =
  4294967296;

const V1_DOMAIN =
  utf8ToBytes(
    'GENESIS-GALAXY-VISUAL-STRUCTURE-V1',
  );

const V1_SPIRAL_ARM_DRAW_INDEX =
  11;

const V1_SPIRAL_VISUAL_ARM_MIN =
  3;

const V1_SPIRAL_VISUAL_ARM_MAX =
  8;

interface V1ArmVisualProfile {
  readonly pitchMinDegrees:
    number;

  readonly pitchMaxDegrees:
    number;

  readonly widthMin:
    number;

  readonly widthMax:
    number;

  readonly coherenceMin:
    number;

  readonly coherenceMax:
    number;

  readonly startFloor:
    number;
}

interface V1VisualProfile {
  readonly bulgeRadiusMin:
    number;

  readonly bulgeRadiusMax:
    number;

  readonly bulgeAxisRatioMin:
    number;

  readonly bulgeAxisRatioMax:
    number;

  readonly haloRadiusMin:
    number;

  readonly haloRadiusMax:
    number;

  readonly haloFalloffMin:
    number;

  readonly haloFalloffMax:
    number;

  readonly arms:
    V1ArmVisualProfile | null;
}

const BARRED_SPIRAL_PROFILE:
  V1VisualProfile =
  Object.freeze({
    bulgeRadiusMin:
      0.10,
    bulgeRadiusMax:
      0.22,
    bulgeAxisRatioMin:
      0.78,
    bulgeAxisRatioMax:
      0.98,
    haloRadiusMin:
      1.20,
    haloRadiusMax:
      1.45,
    haloFalloffMin:
      2.10,
    haloFalloffMax:
      3.40,
    arms:
      Object.freeze({
        pitchMinDegrees:
          12.0,
        pitchMaxDegrees:
          28.0,
        widthMin:
          0.020,
        widthMax:
          0.050,
        coherenceMin:
          0.84,
        coherenceMax:
          0.98,
        startFloor:
          0.20,
      }),
  });

const SPIRAL_PROFILE:
  V1VisualProfile =
  Object.freeze({
    bulgeRadiusMin:
      0.07,
    bulgeRadiusMax:
      0.18,
    bulgeAxisRatioMin:
      0.82,
    bulgeAxisRatioMax:
      0.99,
    haloRadiusMin:
      1.18,
    haloRadiusMax:
      1.50,
    haloFalloffMin:
      1.80,
    haloFalloffMax:
      3.20,
    arms:
      Object.freeze({
        pitchMinDegrees:
          5.5,
        pitchMaxDegrees:
          16.5,
        widthMin:
          0.028,
        widthMax:
          0.070,
        coherenceMin:
          0.66,
        coherenceMax:
          0.96,
        startFloor:
          0.05,
      }),
  });

const ELLIPTICAL_PROFILE:
  V1VisualProfile =
  Object.freeze({
    bulgeRadiusMin:
      0.24,
    bulgeRadiusMax:
      0.44,
    bulgeAxisRatioMin:
      0.58,
    bulgeAxisRatioMax:
      0.94,
    haloRadiusMin:
      1.15,
    haloRadiusMax:
      1.35,
    haloFalloffMin:
      2.50,
    haloFalloffMax:
      4.00,
    arms:
      null,
  });

const DWARF_PROFILE:
  V1VisualProfile =
  Object.freeze({
    bulgeRadiusMin:
      0.06,
    bulgeRadiusMax:
      0.16,
    bulgeAxisRatioMin:
      0.70,
    bulgeAxisRatioMax:
      0.98,
    haloRadiusMin:
      1.25,
    haloRadiusMax:
      1.55,
    haloFalloffMin:
      1.50,
    haloFalloffMax:
      2.80,
    arms:
      Object.freeze({
        pitchMinDegrees:
          18.0,
        pitchMaxDegrees:
          40.0,
        widthMin:
          0.035,
        widthMax:
          0.085,
        coherenceMin:
          0.35,
        coherenceMax:
          0.65,
        startFloor:
          0.10,
      }),
  });

const IRREGULAR_PROFILE:
  V1VisualProfile =
  Object.freeze({
    bulgeRadiusMin:
      0.04,
    bulgeRadiusMax:
      0.12,
    bulgeAxisRatioMin:
      0.55,
    bulgeAxisRatioMax:
      0.92,
    haloRadiusMin:
      1.20,
    haloRadiusMax:
      1.50,
    haloFalloffMin:
      1.20,
    haloFalloffMax:
      2.50,
    arms:
      Object.freeze({
        pitchMinDegrees:
          22.0,
        pitchMaxDegrees:
          48.0,
        widthMin:
          0.050,
        widthMax:
          0.120,
        coherenceMin:
          0.15,
        coherenceMax:
          0.45,
        startFloor:
          0.08,
      }),
  });

/**
 * Generates renderer-independent procedural visual geometry for a Galaxy.
 *
 * Visual sub-branches are independently derived from Galaxy.seed through a
 * versioned SHA-256 domain separator and textual label. Normal SPIRAL arm count
 * is the sole exception: it locally replays the frozen V1 spiral-arm draw so
 * the renderer keeps its established 3..8 visual-arm contract while physical
 * GalaxyStructure remains on the original V1 2..6 Ground Truth contract.
 *
 * The replay owns a fresh SFC64 instance and therefore cannot perturb the
 * physical GalaxyGenerator stream.
 *
 * Three.js must consume the returned GalaxyVisualStructure later; Three.js
 * types do not belong here.
 */
export class GalaxyVisualStructureGenerator {

  private constructor() {}

  static generate(
    galaxy:
      Galaxy,
  ): GalaxyVisualStructure {

    if (
      galaxy
        .generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        galaxy,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${galaxy.generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    galaxy:
      Galaxy,
  ): GalaxyVisualStructure {

    const profile =
      getV1Profile(
        galaxy.type,
      );

    const structure =
      galaxy
        .physicalProperties
        .structure;

    const orientationRadians =
      normalizeRadians(
        unit(
          galaxy,
          'orientation',
        ) *
        TWO_PI,
      );

    const windingDirection =
      unit(
        galaxy,
        'handedness',
      ) <
      0.5
        ? GalaxyWindingDirection.CLOCKWISE
        : GalaxyWindingDirection.COUNTERCLOCKWISE;

    const bulgeT =
      clamp01(
        0.75 *
          structure.centralConcentration +
        0.25 *
          unit(
            galaxy,
            'bulge-radius',
          ),
      );

    const bulgeRadiusNormalized =
      lerp(
        profile.bulgeRadiusMin,
        profile.bulgeRadiusMax,
        bulgeT,
      );

    const bulgeAxisT =
      clamp01(
        0.65 *
          (
            1.0 -
            structure.flattening
          ) +
        0.35 *
          unit(
            galaxy,
            'bulge-axis',
          ),
      );

    const bulgeAxisRatio =
      lerp(
        profile.bulgeAxisRatioMin,
        profile.bulgeAxisRatioMax,
        bulgeAxisT,
      );

    const haloT =
      clamp01(
        0.65 *
          unit(
            galaxy,
            'halo-radius',
          ) +
        0.35 *
          structure.asymmetry,
      );

    const haloOuterRadiusNormalized =
      lerp(
        profile.haloRadiusMin,
        profile.haloRadiusMax,
        haloT,
      );

    const haloFalloffT =
      clamp01(
        0.65 *
          structure.centralConcentration +
        0.35 *
          unit(
            galaxy,
            'halo-falloff',
          ),
      );

    const haloFalloffExponent =
      lerp(
        profile.haloFalloffMin,
        profile.haloFalloffMax,
        haloFalloffT,
      );

    const regions =
      new GalaxyVisualRegionLayout(
        0.15,
        0.40,
        0.70,
        1.00,
        haloOuterRadiusNormalized,
      );

    const bar =
      galaxy.type ===
      GalaxyType.BARRED_SPIRAL
        ? createBar(
            galaxy,
            orientationRadians,
            bulgeRadiusNormalized,
            structure.barStrength,
          )
        : null;

    const arms =
      createArms(
        galaxy,
        profile,
        bulgeRadiusNormalized,
        bar,
      );

    return new GalaxyVisualStructure(
      orientationRadians,
      windingDirection,
      bulgeRadiusNormalized,
      bulgeAxisRatio,
      haloFalloffExponent,
      regions,
      bar,
      arms,
    );
  }
}

function createBar(
  galaxy:
    Galaxy,

  orientationRadians:
    number,

  bulgeRadiusNormalized:
    number,

  barStrength:
    number,
): GalaxyVisualBar {

  const barLengthNoise =
    unit(
      galaxy,
      'bar-length',
    );

  const barWidthNoise =
    unit(
      galaxy,
      'bar-width',
    );

  const rawHalfLength =
    lerp(
      0.18,
      0.34,
      clamp01(
        0.75 *
          barStrength +
        0.25 *
          barLengthNoise,
      ),
    );

  const barHalfLength =
    Math.min(
      0.38,
      Math.max(
        rawHalfLength,
        bulgeRadiusNormalized *
          1.05,
      ),
    );

  const rawWidth =
    lerp(
      0.025,
      0.075,
      clamp01(
        0.70 *
          barStrength +
        0.30 *
          barWidthNoise,
      ),
    );

  const barWidth =
    Math.min(
      rawWidth,
      barHalfLength *
        0.80,
    );

  return new GalaxyVisualBar(
    orientationRadians,
    barHalfLength,
    barWidth,
    barStrength,
  );
}

function createArms(
  galaxy:
    Galaxy,

  profile:
    V1VisualProfile,

  bulgeRadiusNormalized:
    number,

  bar:
    GalaxyVisualBar | null,
): readonly GalaxyVisualArm[] {

  const armCount =
    resolveVisualArmCount(
      galaxy,
    );

  if (
    armCount ===
    0
  ) {
    return Object.freeze([]);
  }

  const armProfile =
    profile.arms;

  if (
    armProfile ===
    null
  ) {
    throw new RangeError(
      'Galaxy with spiral arms requires a V1 visual arm profile.',
    );
  }

  const asymmetry =
    galaxy
      .physicalProperties
      .structure
      .asymmetry;

  const spacing =
    TWO_PI /
    armCount;

  const basePhase =
    unit(
      galaxy,
      'arm-phase-base',
    ) *
    TWO_PI;

  const normalSpiral =
    galaxy.type ===
    GalaxyType.SPIRAL;

  const minimumRadialStart =
    Math.max(
      armProfile.startFloor,
      normalSpiral
        ? bulgeRadiusNormalized *
          0.48
        : bulgeRadiusNormalized +
          0.02,
      bar
        ?.halfLengthNormalized ??
        0.0,
    );

  const baseRadialStartNormalized =
    Math.min(
      minimumRadialStart,
      normalSpiral
        ? 0.26
        : 0.80,
    );

  const arms:
    GalaxyVisualArm[] = [];

  for (
    let index =
      0;
    index <
      armCount;
    index +=
      1
  ) {
    const coherence =
      lerp(
        armProfile.coherenceMin,
        armProfile.coherenceMax,
        unit(
          galaxy,
          `arm-${index}-coherence`,
        ),
      );

    const radialStartNormalized =
      normalSpiral
        ? clamp(
            baseRadialStartNormalized *
              lerp(
                0.86,
                1.18,
                unit(
                  galaxy,
                  `arm-${index}-start`,
                ),
              ),
            armProfile.startFloor,
            0.28,
          )
        : baseRadialStartNormalized;

    const phaseNoise =
      unit(
        galaxy,
        `arm-${index}-phase`,
      );

    const phaseJitter =
      (
        phaseNoise -
        0.5
      ) *
      spacing *
      (
        1.0 -
        coherence
      ) *
      0.70;

    const phaseRadians =
      normalizeRadians(
        basePhase +
        index *
          spacing +
        phaseJitter,
      );

    const pitchNoise =
      unit(
        galaxy,
        `arm-${index}-pitch`,
      );

    const armCountT =
      clamp01(
        (
          armCount -
          3
        ) /
        5,
      );

    const pitchAngleDegrees =
      lerp(
        armProfile.pitchMinDegrees,
        armProfile.pitchMaxDegrees,
        clamp01(
          normalSpiral
            ? 0.68 *
              pitchNoise +
              0.12 *
              asymmetry +
              0.20 *
              armCountT
            : 0.70 *
              pitchNoise +
              0.30 *
              asymmetry,
        ),
      );

    const endNoise =
      unit(
        galaxy,
        `arm-${index}-end`,
      );

    const radialEndNormalized =
      Math.min(
        0.995,
        Math.max(
          radialStartNormalized +
            0.08,
          normalSpiral
            ? 0.86 +
              0.13 *
              endNoise
            : 0.84 +
              0.14 *
              endNoise,
        ),
      );

    const widthNoise =
      unit(
        galaxy,
        `arm-${index}-width`,
      );

    const widthNormalized =
      lerp(
        armProfile.widthMin,
        armProfile.widthMax,
        clamp01(
          0.65 *
            widthNoise +
          0.35 *
            asymmetry,
        ),
      );

    arms.push(
      new GalaxyVisualArm(
        index,
        phaseRadians,
        pitchAngleDegrees,
        radialStartNormalized,
        radialEndNormalized,
        widthNormalized,
        coherence,
      ),
    );
  }

  return Object.freeze(
    arms,
  );
}

function resolveVisualArmCount(
  galaxy:
    Galaxy,
): number {

  const physicalArmCount =
    galaxy
      .physicalProperties
      .structure
      .spiralArmCount;

  if (
    galaxy.type !==
    GalaxyType.SPIRAL
  ) {
    return physicalArmCount;
  }

  /*
   * The SPIRAL visual reset intentionally established a renderer-only 3..8
   * arm vocabulary. Ground Truth V1, however, remains 2..6. Replaying the
   * original twelfth V1 draw from a private RNG preserves the current visual
   * result exactly without changing or consuming the physical generator.
   */
  const random =
    new Sfc64Random(
      universeSeedFromNormalized128(
        galaxy.seed
          .normalizedValue,
      ),
    );

  let spiralArmDraw =
    0.0;

  for (
    let drawIndex =
      0;
    drawIndex <=
      V1_SPIRAL_ARM_DRAW_INDEX;
    drawIndex +=
      1
  ) {
    spiralArmDraw =
      random.nextDouble();
  }

  return lerpIntInclusive(
    V1_SPIRAL_VISUAL_ARM_MIN,
    V1_SPIRAL_VISUAL_ARM_MAX,
    spiralArmDraw,
  );
}

function universeSeedFromNormalized128(
  normalized:
    string,
): UniverseSeed {

  if (
    !/^[0-9A-F]{32}$/.test(
      normalized,
    )
  ) {
    throw new RangeError(
      `Expected normalized 128-bit hexadecimal seed: ${normalized}.`,
    );
  }

  const canonical =
    normalized
      .match(
        /.{4}/g,
      )
      ?.join(
        '-',
      );

  if (
    canonical ===
    undefined
  ) {
    throw new RangeError(
      `Cannot format normalized 128-bit seed: ${normalized}.`,
    );
  }

  return UniverseSeed.parse(
    canonical,
  );
}

function lerpIntInclusive(
  min:
    number,

  max:
    number,

  t:
    number,
): number {

  if (
    min ===
    max
  ) {
    return min;
  }

  const count =
    max -
    min +
    1;

  const scaled =
    Math.trunc(
      t *
      count,
    );

  const clampedScaled =
    Math.min(
      max -
        min,
      Math.max(
        0,
        scaled,
      ),
    );

  const result =
    min +
    clampedScaled;

  return Math.min(
    max,
    Math.max(
      min,
      result,
    ),
  );
}

function unit(
  galaxy:
    Galaxy,

  label:
    string,
): number {

  const seedBytes =
    hexToBytes(
      galaxy.seed
        .normalizedValue,
    );

  const labelBytes =
    utf8ToBytes(
      label,
    );

  const input =
    new Uint8Array(
      V1_DOMAIN.length +
      seedBytes.length +
      labelBytes.length,
    );

  input.set(
    V1_DOMAIN,
    0,
  );

  input.set(
    seedBytes,
    V1_DOMAIN.length,
  );

  input.set(
    labelBytes,
    V1_DOMAIN.length +
      seedBytes.length,
  );

  const digest =
    sha256(
      input,
    );

  const raw =
    readUint32BigEndian(
      digest,
      0,
    );

  return raw /
    UINT32_SCALE;
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
    bytes[offset + 1] *
      0x10000 +
    bytes[offset + 2] *
      0x100 +
    bytes[offset + 3]
  );
}

function getV1Profile(
  type:
    GalaxyType,
): V1VisualProfile {

  if (
    type ===
    GalaxyType.BARRED_SPIRAL
  ) {
    return BARRED_SPIRAL_PROFILE;
  }

  if (
    type ===
    GalaxyType.SPIRAL
  ) {
    return SPIRAL_PROFILE;
  }

  if (
    type ===
    GalaxyType.ELLIPTICAL
  ) {
    return ELLIPTICAL_PROFILE;
  }

  if (
    type ===
    GalaxyType.DWARF
  ) {
    return DWARF_PROFILE;
  }

  if (
    type ===
    GalaxyType.IRREGULAR
  ) {
    return IRREGULAR_PROFILE;
  }

  throw new RangeError(
    'Unsupported GalaxyType.',
  );
}

function normalizeRadians(
  value:
    number,
): number {

  const normalized =
    value %
    TWO_PI;

  return normalized <
    0.0
    ? normalized +
        TWO_PI
    : normalized;
}

function lerp(
  min:
    number,

  max:
    number,

  t:
    number,
): number {

  return min +
    (
      max -
      min
    ) *
    t;
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

function clamp01(
  value:
    number,
): number {

  return clamp(
    value,
    0.0,
    1.0,
  );
}
