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
      0.08,
    bulgeRadiusMax:
      0.20,
    bulgeAxisRatioMin:
      0.80,
    bulgeAxisRatioMax:
      0.99,
    haloRadiusMin:
      1.20,
    haloRadiusMax:
      1.45,
    haloFalloffMin:
      2.00,
    haloFalloffMax:
      3.30,
    arms:
      Object.freeze({
        pitchMinDegrees:
          12.0,
        pitchMaxDegrees:
          30.0,
        widthMin:
          0.020,
        widthMax:
          0.055,
        coherenceMin:
          0.80,
        coherenceMax:
          0.97,
        startFloor:
          0.14,
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
 * This generator deliberately uses no SFC64/Genesis random stream. Every
 * visual sub-branch is independently derived from Galaxy.seed through a
 * versioned SHA-256 domain separator and textual label, so visual generation
 * cannot perturb the frozen physical GalaxyGenerator stream.
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
    galaxy
      .physicalProperties
      .structure
      .spiralArmCount;

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

  const minimumRadialStart =
    Math.max(
      armProfile.startFloor,
      bulgeRadiusNormalized +
        0.02,
      bar
        ?.halfLengthNormalized ??
        0.0,
    );

  const radialStartNormalized =
    Math.min(
      minimumRadialStart,
      0.80,
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

    const pitchAngleDegrees =
      lerp(
        armProfile.pitchMinDegrees,
        armProfile.pitchMaxDegrees,
        clamp01(
          0.70 *
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
        0.99,
        Math.max(
          radialStartNormalized +
            0.05,
          0.84 +
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

function clamp01(
  value:
    number,
): number {

  return Math.min(
    1.0,
    Math.max(
      0.0,
      value,
    ),
  );
}
