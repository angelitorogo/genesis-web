import {
  GalaxyWindingDirection,
  type GalaxyVisualArm,
  type GalaxyVisualStructure,
} from '../../domain/universe/galaxy-visual-structure';

const TWO_PI =
  Math.PI * 2;

const UINT32_SCALE =
  4_294_967_296;

const EPSILON =
  1e-9;

/**
 * BARRED_SPIRAL visual reset V3.
 *
 * This renderer intentionally ports the accepted SPIRAL V20 photometry and
 * population model almost verbatim: warm old bulge, continuous inter-arm
 * stellar disk, broad fragmented arm overdensities, restrained volumetric gas
 * and sparse halo. The morphology-specific difference is confined to the
 * inner galaxy: arms are rebased to the two bar ends and a broad warm stellar
 * bar is added as the final 8k render samples.
 *
 * Ground Truth is untouched; this is renderer-only and keeps the frozen 282k
 * BARRED_SPIRAL budget used by Worker/LOD materialization.
 */
export const BARRED_SPIRAL_RESET_CORE_PARTICLE_COUNT =
  20_000;

export const BARRED_SPIRAL_RESET_BODY_PARTICLE_COUNT =
  154_000;

export const BARRED_SPIRAL_RESET_ARM_PARTICLE_COUNT =
  72_000;

export const BARRED_SPIRAL_RESET_GAS_PARTICLE_COUNT =
  16_000;

export const BARRED_SPIRAL_RESET_HALO_PARTICLE_COUNT =
  12_000;

export const BARRED_SPIRAL_RESET_BAR_PARTICLE_COUNT =
  8_000;

export const BARRED_SPIRAL_RESET_TOTAL_PARTICLE_COUNT =
  BARRED_SPIRAL_RESET_CORE_PARTICLE_COUNT +
  BARRED_SPIRAL_RESET_BODY_PARTICLE_COUNT +
  BARRED_SPIRAL_RESET_ARM_PARTICLE_COUNT +
  BARRED_SPIRAL_RESET_GAS_PARTICLE_COUNT +
  BARRED_SPIRAL_RESET_HALO_PARTICLE_COUNT +
  BARRED_SPIRAL_RESET_BAR_PARTICLE_COUNT;

const BARRED_SPIRAL_DISK_PARTICLE_COUNT =
  146_000;

const BARRED_SPIRAL_KNOT_PARTICLE_COUNT =
  BARRED_SPIRAL_RESET_BODY_PARTICLE_COUNT -
  BARRED_SPIRAL_DISK_PARTICLE_COUNT;

const BARRED_SPIRAL_KNOT_CLUSTER_COUNT =
  32;

const BARRED_SPIRAL_KNOT_PARTICLES_PER_CLUSTER =
  BARRED_SPIRAL_KNOT_PARTICLE_COUNT /
  BARRED_SPIRAL_KNOT_CLUSTER_COUNT;

const BARRED_SPIRAL_GAS_CLOUDLETS_PER_CLUSTER =
  4;

/**
 * BARRED_SPIRAL reset V18 tuning.
 *
 * The goal is to keep the same deterministic backdrop/composition achieved in
 * V17 while rebalancing the visual weight of the galaxy: a slightly softer and
 * warmer bulge, a diffuse amber halo around the nucleus, a richer inner/inter-
 * arm stellar field, and only a light reinforcement of the spiral arms.
 */
const BARRED_SPIRAL_V18_CORE_EXTENT_SCALE =
  0.92;

const BARRED_SPIRAL_V18_CORE_SIZE_SCALE =
  0.84;

const BARRED_SPIRAL_V18_CORE_OPACITY_SCALE =
  0.72;

const BARRED_SPIRAL_V18_CORE_AMBER_MIX =
  0.40;

const BARRED_SPIRAL_V18_DISK_INTERARM_OPACITY_BOOST =
  0.022;

const BARRED_SPIRAL_V18_DISK_INNER_SIZE_BOOST =
  0.14;

const BARRED_SPIRAL_V18_ARM_REINFORCEMENT =
  0.12;

const BARRED_SPIRAL_V18_INNER_GAS_OPACITY_BOOST =
  0.010;

/**
 * BARRED_SPIRAL reset V20 surgical refinement.
 *
 * V20 deliberately leaves every geometric sampler untouched. It only adjusts
 * photometry/chroma in the nucleus and inner gas, then introduces a small
 * deterministic micro-variation in arm stars so the arms keep the exact same
 * trajectories while looking less uniformly textured.
 */
const BARRED_SPIRAL_V20_CORE_OPACITY_SCALE =
  0.90;

const BARRED_SPIRAL_V20_CORE_WHITE_MIX_SCALE =
  0.42;

const BARRED_SPIRAL_V20_CORE_AMBER_BOOST =
  0.14;

const BARRED_SPIRAL_V20_HALO_OUTER_RADIUS =
  0.40;

const BARRED_SPIRAL_V20_HALO_SIZE_BOOST =
  1.85;

const BARRED_SPIRAL_V20_HALO_OPACITY_BOOST =
  0.008;

const BARRED_SPIRAL_V20_ARM_MICRO_VARIATION =
  0.18;

const BARRED_SPIRAL_V4_DISK_LANES_OPACITY_BOOST =
  0.024;

const BARRED_SPIRAL_V4_GAS_ARM_ZONE_PROBABILITY =
  0.74;

const BARRED_SPIRAL_V4_GAS_INNER_ZONE_PROBABILITY =
  0.96;

const BARRED_SPIRAL_V4_BAR_CURVATURE_SCALE =
  0.26;

const BARRED_SPIRAL_V4_1_BAR_VISIBILITY_BOOST =
  1.18;

const BARRED_SPIRAL_V4_1_ARM_GAS_WIDTH_BOOST =
  1.24;

const BARRED_SPIRAL_V4_1_OUTER_GAS_DIFFUSE_START =
  0.48;

const BARRED_SPIRAL_V4_2_BAR_GAS_BAND_FRACTION =
  0.62;

const BARRED_SPIRAL_V4_2_1_BAR_GAS_SPATIAL_SCALE =
  0.88;

const BARRED_SPIRAL_V4_2_1_BAR_GAS_OPACITY_SCALE =
  0.58;

const BARRED_SPIRAL_V4_2_1_BAR_GAS_HALO_SCALE =
  0.56;

interface BarredSpiralGalaxyRenderInput {
  readonly universeSeedNormalizedValue:
    string;

  readonly generatorVersionCode:
    number;

  readonly galaxyIndex:
    string;

  readonly visualStructure:
    GalaxyVisualStructure | null;
}

export interface BarredSpiralGalaxyParticleLayout {
  readonly positions:
    Float32Array;

  readonly colors:
    Float32Array;

  readonly sizes:
    Float32Array;

  readonly opacities:
    Float32Array;

  readonly count:
    number;
}

interface ParticleBuffers {
  readonly positions:
    Float32Array;

  readonly colors:
    Float32Array;

  readonly sizes:
    Float32Array;

  readonly opacities:
    Float32Array;
}

interface DeterministicSampler {
  sample01(
    index:
      number,

    channel:
      number,
  ): number;

  normal(
    index:
      number,

    channel:
      number,
  ): number;
}

interface RgbColor {
  readonly red:
    number;

  readonly green:
    number;

  readonly blue:
    number;
}

interface ArmPoint {
  readonly x:
    number;

  readonly y:
    number;

  readonly radius:
    number;

  readonly progress:
    number;

  readonly armIndex:
    number;

  readonly density:
    number;
}

interface ArmField {
  readonly influence:
    number;

  readonly density:
    number;

  readonly armIndex:
    number;
}

interface KnotAnchor {
  readonly x:
    number;

  readonly y:
    number;

  readonly z:
    number;

  readonly radius:
    number;

  readonly spread:
    number;

  readonly colorFamily:
    number;
}

interface BarredSpiralChromaticProfile {
  readonly armBase:
    RgbColor;

  readonly armHighlight:
    RgbColor;

  readonly armAccent:
    RgbColor;

  readonly gasOuter:
    RgbColor;

  readonly dominantArmGas:
    RgbColor;

  readonly supportingArmGas:
    RgbColor;

  readonly tertiaryArmGas:
    RgbColor;

  readonly gasInnerAccent:
    RgbColor;

  readonly bulgeOuter:
    RgbColor;

  readonly bulgeWarm:
    RgbColor;

  readonly bulgeWhite:
    RgbColor;

  readonly diskNeutral:
    RgbColor;

  readonly haloBias:
    RgbColor;

  readonly armTintStrength:
    number;

  readonly gasTintStrength:
    number;

  readonly bulgeVerticalScale:
    number;

  readonly gasVerticalScale:
    number;

  readonly armWidthScale:
    number;

  readonly diskFillScale:
    number;

  readonly gasPresenceScale:
    number;

  readonly barPresenceScale:
    number;

  readonly rootSpreadScale:
    number;

  readonly armMultiplicityBias:
    number;
}

type BarredSpiralBasePalette = Pick<
  BarredSpiralChromaticProfile,
  | 'armBase'
  | 'armHighlight'
  | 'armAccent'
  | 'gasOuter'
  | 'dominantArmGas'
  | 'supportingArmGas'
  | 'tertiaryArmGas'
  | 'gasInnerAccent'
  | 'bulgeOuter'
  | 'bulgeWarm'
  | 'bulgeWhite'
  | 'diskNeutral'
  | 'haloBias'
>;

/**
 * Dedicated renderer-only BARRED_SPIRAL generator.
 *
 * The generator is deterministic from universe seed + galaxy index and does
 * not materialize physical star entities. It deliberately treats the spiral
 * as a luminous stellar disk whose arms are density waves rather than as a
 * handful of isolated parametric curves.
 */
export function generateBarredSpiralGalaxyParticleLayout(
  model:
    BarredSpiralGalaxyRenderInput,
): BarredSpiralGalaxyParticleLayout {

  const visual =
    requiredVisual(
      model,
    );

  if (
    visual.bar ===
      null
  ) {
    throw new RangeError(
      'BARRED_SPIRAL reset requires a canonical visual bar.',
    );
  }

  if (
    visual.arms.length <
      2 ||
    visual.arms.length >
      8
  ) {
    throw new RangeError(
      `BARRED_SPIRAL reset requires 2..8 visual arms, received ${visual.arms.length}.`,
    );
  }

  const buffers:
    ParticleBuffers =
    {
      positions:
        new Float32Array(
          BARRED_SPIRAL_RESET_TOTAL_PARTICLE_COUNT *
          3,
        ),

      colors:
        new Float32Array(
          BARRED_SPIRAL_RESET_TOTAL_PARTICLE_COUNT *
          3,
        ),

      sizes:
        new Float32Array(
          BARRED_SPIRAL_RESET_TOTAL_PARTICLE_COUNT,
        ),

      opacities:
        new Float32Array(
          BARRED_SPIRAL_RESET_TOTAL_PARTICLE_COUNT,
        ),
    };

  const sampler =
    createSampler(
      model,
    );

  const chromaticProfile =
    createBarredSpiralChromaticProfile(
      sampler,
    );

  let cursor =
    0;

  cursor =
    writeEllipticalStyleCore(
      visual,
      sampler,
      chromaticProfile,
      buffers,
      cursor,
    );

  cursor =
    writeContinuousStellarDisk(
      visual,
      sampler,
      chromaticProfile,
      buffers,
      cursor,
    );

  cursor =
    writeBroadBarredOverdensities(
      visual,
      sampler,
      chromaticProfile,
      buffers,
      cursor,
    );

  cursor =
    writeRestrainedVolumetricGas(
      visual,
      sampler,
      chromaticProfile,
      buffers,
      cursor,
    );

  cursor =
    writeSparseHalo(
      visual,
      sampler,
      chromaticProfile,
      buffers,
      cursor,
    );

  cursor =
    writeStellarBar(
      visual,
      sampler,
      chromaticProfile,
      buffers,
      cursor,
    );

  if (
    cursor !==
      BARRED_SPIRAL_RESET_TOTAL_PARTICLE_COUNT
  ) {
    throw new Error(
      `BARRED_SPIRAL reset cursor invariant broken: ${cursor}.`,
    );
  }

  return Object.freeze({
    positions:
      buffers.positions,

    colors:
      buffers.colors,

    sizes:
      buffers.sizes,

    opacities:
      buffers.opacities,

    count:
      BARRED_SPIRAL_RESET_TOTAL_PARTICLE_COUNT,
  });
}

function writeEllipticalStyleCore(
  visual:
    GalaxyVisualStructure,

  sampler:
    DeterministicSampler,

  chromaticProfile:
    BarredSpiralChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  /*
   * V17: the BARRED_SPIRAL central stellar component deliberately reuses the same
   * procedural profile as the production ELLIPTICAL/SPHEROIDAL core.
   *
   * The sampling law, 3D sphere direction, axial flattening, temperature
   * spread, stellar sizes and opacity law below are a direct port of
   * GalacticMapParticleLayoutGenerator.writeCore() for SPHEROIDAL galaxies.
   * Only the global extent is bounded to the physical BARRED_SPIRAL bulge so this
   * spheroid remains the galactic centre instead of becoming the whole galaxy.
   */
  const ellipticalExtent =
    visual.bulgeRadiusNormalized *
    1.24 *
    BARRED_SPIRAL_V18_CORE_EXTENT_SCALE;

  const extent =
    clamp(
      ellipticalExtent,
      0.18,
      0.31,
    );

  const verticalAxis =
    0.62 +
    0.22 *
    visual.bulgeAxisRatio;

  for (
    let index =
      0;
    index <
      BARRED_SPIRAL_RESET_CORE_PARTICLE_COUNT;
    index +=
      1
  ) {
    const radialSample =
      sampler.sample01(
        index,
        1,
      );

    const radial =
      extent *
      Math.pow(
        radialSample,
        2.15,
      );

    const direction =
      unitSphereDirection(
        sampler,
        index,
        2,
      );

    const rotated =
      rotate2d(
        direction.x *
          radial,
        direction.y *
          radial *
          visual.bulgeAxisRatio,
        visual.orientationRadians,
      );

    const depth =
      direction.z *
      radial *
      verticalAxis;

    const brightness =
      1 -
      Math.min(
        1,
        radial /
          Math.max(
            EPSILON,
            extent,
          ),
      );

    const rareBright =
      sampler.sample01(
        index,
        8,
      ) <
      0.014;

    const temperature =
      sampler.sample01(
        index,
        9,
      );

    const warmShift =
      temperature >
        0.80
        ? (
            temperature -
            0.80
          ) /
          0.20
        : 0;

    const coolShift =
      temperature <
        0.16
        ? (
            0.16 -
            temperature
          ) /
          0.16
        : 0;

    const baseEllipticalColor =
      rgb(
        0.88 +
          0.12 *
          brightness +
          0.06 *
          warmShift -
          0.06 *
          coolShift,
        0.74 +
          0.13 *
          brightness +
          0.04 *
          coolShift,
        0.60 +
          0.16 *
          brightness +
          0.16 *
          coolShift -
          0.08 *
          warmShift,
      );

    const warmBulgeColor =
      mixColor(
        chromaticProfile.bulgeOuter,
        chromaticProfile.bulgeWarm,
        0.44 +
        BARRED_SPIRAL_V20_CORE_AMBER_BOOST +
        0.30 *
        brightness +
        0.10 *
        warmShift,
      );

    const softenedWhite =
      mixColor(
        warmBulgeColor,
        chromaticProfile.bulgeWhite,
        (
          0.05 +
          0.08 *
          brightness
        ) *
        BARRED_SPIRAL_V20_CORE_WHITE_MIX_SCALE,
      );

    const color =
      mixColor(
        baseEllipticalColor,
        softenedWhite,
        BARRED_SPIRAL_V18_CORE_AMBER_MIX +
        0.12 +
        0.18 *
        brightness,
      );

    writeParticle(
      buffers,
      start +
        index,
      rotated.x,
      rotated.y,
      depth,
      color.red,
      color.green,
      color.blue,
      (
        1.10 +
        1.22 *
        brightness
      ) *
      (
        0.86 +
        0.18 *
        sampler.sample01(
          index,
          10,
        )
      ) *
      BARRED_SPIRAL_V18_CORE_SIZE_SCALE *
      (
        rareBright
          ? 1.26
          : 1
      ),
      (
        0.10 +
        0.20 *
        brightness +
        (
          rareBright
            ? 0.05
            : 0
        )
      ) *
      BARRED_SPIRAL_V18_CORE_OPACITY_SCALE *
      BARRED_SPIRAL_V20_CORE_OPACITY_SCALE,
    );
  }

  return start +
    BARRED_SPIRAL_RESET_CORE_PARTICLE_COUNT;
}

function writeContinuousStellarDisk(
  visual:
    GalaxyVisualStructure,

  sampler:
    DeterministicSampler,

  chromaticProfile:
    BarredSpiralChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  for (
    let index =
      0;
    index <
      BARRED_SPIRAL_DISK_PARTICLE_COUNT;
    index +=
      1
  ) {
    const radialMode =
      sampler.sample01(
        index,
        100,
      );

    const u =
      sampler.sample01(
        index,
        101,
      );

    const radius =
      radialMode <
        0.52
        ? 0.024 +
          0.78 *
          Math.pow(
            u,
            1.44,
          )
        : radialMode <
            0.86
          ? 0.06 +
            0.86 *
            Math.pow(
              u,
              1.00,
            )
          : 0.16 +
            0.84 *
            Math.pow(
              u,
              0.78,
            );

    const angle =
      TWO_PI *
      sampler.sample01(
        index,
        102,
      );

    const lopsidedness =
      1 +
      0.034 *
      chromaticProfile.diskFillScale *
      Math.sin(
        angle *
        2 +
        visual.orientationRadians,
      );

    const x =
      Math.cos(
        angle,
      ) *
      radius *
      lopsidedness;

    const y =
      Math.sin(
        angle,
      ) *
      radius /
      lopsidedness;

    const armField =
      barredArmFieldAt(
        visual,
        chromaticProfile,
        radius,
        angle,
      );

    const z =
      sampler.normal(
        index,
        104,
      ) *
      (
        0.0055 +
        0.018 *
        radius
      );

    const temperature =
      diskTemperature(
        radius,
        armField.influence,
        sampler.sample01(
          index,
          106,
        ),
      );

    const baseColor =
      stellarColor(
        temperature,
        radius,
        armField.influence >
          0.54,
        sampler.sample01(
          index,
          107,
        ),
      );

    const color =
      tintDiskColor(
        chromaticProfile,
        baseColor,
        armField,
        radius,
        angle,
        sampler.sample01(
          index,
          105,
        ),
      );

    const prominence =
      sampler.sample01(
        index,
        108,
      );

    const rareBright =
      prominence >
      (
        armField.influence >
          0.50
          ? 0.965
          : 0.982
      );

    const baseSize =
      prominence <
        0.88
        ? 0.12 +
          0.38 *
          Math.pow(
            prominence /
            0.88,
            1.48,
          )
        : 0.50 +
          0.90 *
          (
            prominence -
            0.88
          ) /
          0.12;

    const size =
      baseSize *
      (
        0.98 +
        0.36 *
        armField.influence
      ) *
      (
        1 +
        (
          BARRED_SPIRAL_V18_DISK_INNER_SIZE_BOOST +
          0.06 *
          chromaticProfile.diskFillScale
        ) *
        (
          1 -
          0.54 *
          armField.influence
        )
      ) *
      (
        0.98 +
        0.12 *
        chromaticProfile.diskFillScale
      ) *
      (
        rareBright
          ? 1.95 +
            0.90 *
            sampler.sample01(
              index,
              109,
            )
          : 1
      );

    const innerLight =
      1 -
      smoothstep01(
        0.10,
        0.78,
        radius,
      );

    const diskEnvelope =
      1 -
      smoothstep01(
        0.54,
        1.08,
        radius,
      );

    const interArmFloor =
      (
        1 -
        0.16 *
        armField.influence
      ) *
      (
        0.86 +
        0.24 *
        diskEnvelope
      );

    const armLight =
      armField.influence *
      (
        0.52 +
        0.56 *
        armField.density
      );

    const interArmBridge =
      (
        1 -
        0.22 *
        armField.influence
      ) *
      (
        0.54 +
        0.62 *
        innerLight
      );

    const opacity =
      (
        0.038 +
        0.090 *
        innerLight +
        0.084 *
        interArmFloor +
        0.040 *
        armLight +
        (
          BARRED_SPIRAL_V18_DISK_INTERARM_OPACITY_BOOST +
          BARRED_SPIRAL_V4_DISK_LANES_OPACITY_BOOST
        ) *
        interArmBridge +
        0.026 *
        Math.pow(
          prominence,
          2.10,
        ) +
        (
          rareBright
            ? 0.050
            : 0
        )
      ) *
      (
        0.94 +
        0.14 *
        chromaticProfile.diskFillScale
      );

    writeParticle(
      buffers,
      start +
        index,
      x,
      y,
      z,
      color.red,
      color.green,
      color.blue,
      Math.min(
        6.2,
        size,
      ),
      opacity,
    );
  }

  for (
    let index =
      0;
    index <
      BARRED_SPIRAL_KNOT_PARTICLE_COUNT;
    index +=
      1
  ) {
    const clusterIndex =
      Math.floor(
        index /
        BARRED_SPIRAL_KNOT_PARTICLES_PER_CLUSTER,
      );

    const anchor =
      starFormationKnotAnchor(
        visual,
        sampler,
        chromaticProfile,
        clusterIndex,
      );

    const localIndex =
      index %
      BARRED_SPIRAL_KNOT_PARTICLES_PER_CLUSTER;

    const localRadius =
      anchor.spread *
      Math.pow(
        sampler.sample01(
          index,
          210,
        ),
        0.72,
      );

    const localAngle =
      TWO_PI *
      sampler.sample01(
        index,
        211,
      ) +
      localIndex *
      0.61803398875;

    const x =
      anchor.x +
      Math.cos(
        localAngle,
      ) *
      localRadius;

    const y =
      anchor.y +
      Math.sin(
        localAngle,
      ) *
      localRadius *
      0.72;

    const z =
      anchor.z +
      sampler.normal(
        index,
        213,
      ) *
      anchor.spread *
      0.24;

    const color =
      knotStarColor(
        chromaticProfile,
        anchor.colorFamily,
        sampler.sample01(
          index,
          214,
        ),
      );

    const prominence =
      sampler.sample01(
        index,
        215,
      );

    const size =
      prominence <
        0.90
        ? 0.16 +
          0.72 *
          Math.pow(
            prominence,
            1.38,
          )
        : 0.92 +
          2.10 *
          (
            prominence -
            0.90
          ) /
          0.10;

    writeParticle(
      buffers,
      start +
        BARRED_SPIRAL_DISK_PARTICLE_COUNT +
        index,
      x,
      y,
      z,
      color.red,
      color.green,
      color.blue,
      Math.min(
        4.6,
        size,
      ),
      0.050 +
      0.110 *
      Math.pow(
        prominence,
        1.55,
      ),
    );
  }

  return start +
    BARRED_SPIRAL_RESET_BODY_PARTICLE_COUNT;
}

function writeBroadBarredOverdensities(
  visual:
    GalaxyVisualStructure,

  sampler:
    DeterministicSampler,

  chromaticProfile:
    BarredSpiralChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  for (
    let index =
      0;
    index <
      BARRED_SPIRAL_RESET_ARM_PARTICLE_COUNT;
    index +=
      1
  ) {
    const point =
      sampleBarredOrganicArmPoint(
        visual,
        sampler,
        chromaticProfile,
        400_000 +
          index,
        300,
        true,
      );

    const z =
      sampler.normal(
        index,
        318,
      ) *
      (
        0.0042 +
        0.012 *
        point.radius
      );

    const temperature =
      armTemperature(
        point.radius,
        sampler.sample01(
          index,
          320,
        ),
      );

    const baseColor =
      stellarColor(
        temperature,
        point.radius,
        true,
        sampler.sample01(
          index,
          321,
        ),
      );

    const color =
      tintArmColor(
        chromaticProfile,
        baseColor,
        point,
        sampler.sample01(
          index,
          319,
        ),
      );

    const microVariation =
      sampler.sample01(
        index,
        326,
      );

    const microColor =
      adjustColor(
        color,
        microVariation,
        0.028,
        0.024,
        0.038,
      );

    const microSizeScale =
      1 +
      BARRED_SPIRAL_V20_ARM_MICRO_VARIATION *
      (
        microVariation -
        0.5
      ) *
      2;

    const microOpacityScale =
      0.96 +
      0.34 *
      sampler.sample01(
        index,
        327,
      );

    const prominence =
      sampler.sample01(
        index,
        322,
      );

    const rareBright =
      prominence >
      0.968;

    const structureField =
      armFragmentField(
        point.armIndex,
        point.radius,
        point.progress,
        sampler.sample01(
          index,
          325,
        ),
      );

    const size =
      (
        prominence <
          0.93
          ? 0.14 +
            0.66 *
            Math.pow(
              prominence /
              0.93,
              1.18,
            )
          : 0.88 +
            1.26 *
            (
              prominence -
              0.93
            ) /
            0.07
      ) *
      (
        0.94 +
        0.42 *
        structureField
      ) *
      (
        1 +
        (
          BARRED_SPIRAL_V18_ARM_REINFORCEMENT +
          0.08
        ) *
        (
          0.55 +
          0.45 *
          point.density
        )
      ) *
      (
        rareBright
          ? 1.42 +
            0.68 *
            sampler.sample01(
              index,
              323,
            )
          : 1
      );

    const armEmergence =
      smoothstep01(
        0.24,
        0.46,
        point.radius,
      );

    const outerFade =
      1 -
      0.28 *
      smoothstep01(
        0.88,
        1.08,
        point.radius,
      );

    const fragmentWave =
      armSegmentWave(
        point.armIndex,
        point.radius,
        point.progress,
        sampler.sample01(
          index,
          324,
        ),
      );

    const localClumpiness =
      clamp01(
        0.22 *
          point.density +
        0.48 *
          structureField +
        0.30 *
          fragmentWave,
      );

    const fragmentVisibility =
      0.24 +
      0.76 *
      Math.pow(
        localClumpiness,
        1.22,
      );

    const innerSuppression =
      0.34 +
      0.66 *
      smoothstep01(
        0.22,
        0.40,
        point.radius,
      );

    const opacity =
      (
        0.022 +
        0.072 *
        Math.pow(
          prominence,
          1.22,
        ) +
        (
          rareBright
            ? 0.040
            : 0
        )
      ) *
      (
        0.36 +
        0.74 *
        point.density
      ) *
      armEmergence *
      outerFade *
      fragmentVisibility *
      innerSuppression;

    writeParticle(
      buffers,
      start +
        index,
      point.x,
      point.y,
      z,
      microColor.red,
      microColor.green,
      microColor.blue,
      Math.min(
        4.8,
        size *
        microSizeScale *
        (
          0.88 +
          0.26 *
          innerSuppression
        ),
      ),
      opacity *
      microOpacityScale,
    );
  }

  return start +
    BARRED_SPIRAL_RESET_ARM_PARTICLE_COUNT;
}

function writeRestrainedVolumetricGas(
  visual:
    GalaxyVisualStructure,

  sampler:
    DeterministicSampler,

  chromaticProfile:
    BarredSpiralChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  for (
    let index =
      0;
    index <
      BARRED_SPIRAL_RESET_GAS_PARTICLE_COUNT;
    index +=
      1
  ) {
    const cloudIndex =
      Math.floor(
        index /
        BARRED_SPIRAL_GAS_CLOUDLETS_PER_CLUSTER,
      );

    const cloudlet =
      index %
      BARRED_SPIRAL_GAS_CLOUDLETS_PER_CLUSTER;

    const zone =
      sampler.sample01(
        cloudIndex,
        500,
      );

    let centerX:
      number;

    let centerY:
      number;

    let centerRadius:
      number;

    let armIndexHint =
      -1;

    let barGasBand =
      false;

    if (
      zone <
      BARRED_SPIRAL_V4_GAS_ARM_ZONE_PROBABILITY
    ) {
      const armPoint =
        sampleBarredOrganicArmPoint(
          visual,
          sampler,
          chromaticProfile,
          800_000 +
            cloudIndex,
          510,
          false,
        );

      centerX =
        armPoint.x;
      centerY =
        armPoint.y;
      centerRadius =
        armPoint.radius;
      armIndexHint =
        armPoint.armIndex;
    } else if (
      zone <
      BARRED_SPIRAL_V4_GAS_INNER_ZONE_PROBABILITY
    ) {
      const bar =
        visual.bar;

      const barAlignedLane =
        sampler.sample01(
          cloudIndex,
          519,
        ) <
        BARRED_SPIRAL_V4_2_BAR_GAS_BAND_FRACTION;

      if (
        bar !==
          null &&
        barAlignedLane
      ) {
        barGasBand =
          true;

        const alongSign =
          sampler.sample01(
            cloudIndex,
            520,
          ) <
          0.5
            ? -1
            : 1;

        const along =
          alongSign *
          bar.halfLengthNormalized *
          (
            0.08 +
            0.84 *
            Math.pow(
              sampler.sample01(
                cloudIndex,
                521,
              ),
              0.92,
            )
          ) +
          sampler.normal(
            cloudIndex,
            522,
          ) *
          bar.halfLengthNormalized *
          0.16;

        const across =
          sampler.normal(
            cloudIndex,
            523,
          ) *
          bar.widthNormalized *
          0.82;

        const cosine =
          Math.cos(
            bar.angleRadians,
          );

        const sine =
          Math.sin(
            bar.angleRadians,
          );

        centerX =
          along *
            cosine -
          across *
            sine;

        centerY =
          along *
            sine +
          across *
            cosine;

        centerRadius =
          Math.hypot(
            centerX,
            centerY,
          );
      } else {
        centerRadius =
          0.055 +
          0.36 *
          Math.pow(
            sampler.sample01(
              cloudIndex,
              520,
            ),
            1.42,
          );

        const angle =
          TWO_PI *
          sampler.sample01(
            cloudIndex,
            521,
          );

        centerX =
          Math.cos(
            angle,
          ) *
          centerRadius;

        centerY =
          Math.sin(
            angle,
          ) *
          centerRadius;
      }
    } else {
      centerRadius =
        0.34 +
        0.58 *
        Math.pow(
          sampler.sample01(
            cloudIndex,
            522,
          ),
          0.92,
        );

      const angle =
        TWO_PI *
        sampler.sample01(
          cloudIndex,
          523,
        );

      centerX =
        Math.cos(
          angle,
        ) *
        centerRadius;

      centerY =
        Math.sin(
          angle,
        ) *
        centerRadius;
    }

    const armGas =
      armIndexHint >=
      0;

    const outerGasDiffuse =
      armGas
        ? smoothstep01(
            BARRED_SPIRAL_V4_1_OUTER_GAS_DIFFUSE_START,
            1.02,
            centerRadius,
          )
        : 0;

    const cloudRadius =
      (
        0.016 +
        0.044 *
        Math.pow(
          sampler.sample01(
            cloudIndex,
            524,
          ),
          0.82,
        )
      ) *
      chromaticProfile.gasPresenceScale *
      (
        armGas
          ? BARRED_SPIRAL_V4_1_ARM_GAS_WIDTH_BOOST +
            0.22 *
            outerGasDiffuse
          : 1.02 +
            0.14 *
            (
              1 -
              smoothstep01(
                0.08,
                0.34,
                centerRadius,
              )
            )
      ) *
      (
        barGasBand
          ? BARRED_SPIRAL_V4_2_1_BAR_GAS_SPATIAL_SCALE
          : 1
      );

    const localAngle =
      TWO_PI *
      sampler.sample01(
        index,
        525,
      ) +
      cloudlet *
      1.61803398875;

    const localRadius =
      cloudRadius *
      Math.pow(
        sampler.sample01(
          index,
          526,
        ),
        armGas
          ? 0.56
          : 0.62,
      ) *
      (
        armGas
          ? 1.04 +
            0.18 *
            outerGasDiffuse
          : 1
      );

    const x =
      centerX +
      Math.cos(
        localAngle,
      ) *
      localRadius;

    const y =
      centerY +
      Math.sin(
        localAngle,
      ) *
      localRadius *
      (
        armGas
          ? 0.84 +
            0.14 *
            outerGasDiffuse
          : 0.80
      );

    const radius =
      Math.min(
        1.1,
        Math.hypot(
          x,
          y,
        ),
      );

    const verticalScale =
      chromaticProfile.gasVerticalScale *
      (
        0.016 +
        0.034 *
        (
          1 -
          0.34 *
          Math.min(
            1,
            radius,
          )
        )
      );

    const z =
      sampler.normal(
        cloudIndex,
        528,
      ) *
      verticalScale +
      sampler.normal(
        index,
        530,
      ) *
      verticalScale *
      0.56;

    const paletteRoll =
      sampler.sample01(
        cloudIndex,
        532,
      );

    const variation =
      sampler.sample01(
        index,
        533,
      );

    const rawColor =
      gasColor(
        chromaticProfile,
        radius,
        armIndexHint,
        paletteRoll,
        variation,
      );

    const color =
      barGasBand
        ? mixColor(
            rawColor,
            chromaticProfile.bulgeOuter,
            0.32,
          )
        : rawColor;

    const innerGas =
      1 -
      smoothstep01(
        0.10,
        0.54,
        radius,
      );

    const segmentStrength =
      armGas
        ? armSegmentWave(
            armIndexHint,
            radius,
            localAngle /
              TWO_PI,
            variation,
          )
        : 0;

    const centralWarmHalo =
      armGas
        ? 0
        : 1 -
          smoothstep01(
            0.06,
            BARRED_SPIRAL_V20_HALO_OUTER_RADIUS,
            radius,
          );

    const effectiveWarmHalo =
      centralWarmHalo *
      (
        barGasBand
          ? BARRED_SPIRAL_V4_2_1_BAR_GAS_HALO_SCALE
          : 1
      );

    const size =
      (
        7.6 +
        2.4 *
        sampler.sample01(
          index,
          534,
        ) +
        1.1 *
        innerGas +
        (
          BARRED_SPIRAL_V20_HALO_SIZE_BOOST +
          1.2
        ) *
        effectiveWarmHalo +
        (
          armGas
            ? 1.8 +
              2.4 *
              Math.pow(
                segmentStrength,
                1.08,
              )
            : 0.38
        )
      ) *
      (
        0.98 +
        0.10 *
        chromaticProfile.gasPresenceScale +
        (
          armGas
            ? 0.10 *
              outerGasDiffuse
            : 0.06 *
              effectiveWarmHalo
        )
      );

    const opacity =
      (
        armGas
          ? 0.038 +
            0.028 *
            sampler.sample01(
              index,
              535,
            ) +
            0.032 *
            Math.pow(
              segmentStrength,
              1.12,
            )
          : 0.014 +
            0.014 *
            sampler.sample01(
              index,
              535,
            )
        ) +
      0.008 *
      innerGas +
      (
        BARRED_SPIRAL_V18_INNER_GAS_OPACITY_BOOST +
        BARRED_SPIRAL_V20_HALO_OPACITY_BOOST +
        BARRED_SPIRAL_V4_GAS_ARM_ZONE_PROBABILITY * 0.004 +
        0.022
      ) *
      effectiveWarmHalo +
      BARRED_SPIRAL_V20_HALO_OPACITY_BOOST *
      0.5 *
      chromaticProfile.gasPresenceScale -
      (
        armGas
          ? 0.018 *
            outerGasDiffuse
          : 0
      );

    writeParticle(
      buffers,
      start +
        index,
      x,
      y,
      z,
      color.red,
      color.green,
      color.blue,
      clamp(
        size,
        9.0,
        15.2,
      ),
      opacity *
      (
        barGasBand
          ? BARRED_SPIRAL_V4_2_1_BAR_GAS_OPACITY_SCALE
          : 1
      ),
    );
  }

  return start +
    BARRED_SPIRAL_RESET_GAS_PARTICLE_COUNT;
}

function writeSparseHalo(
  visual:
    GalaxyVisualStructure,

  sampler:
    DeterministicSampler,

  chromaticProfile:
    BarredSpiralChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  for (
    let index =
      0;
    index <
      BARRED_SPIRAL_RESET_HALO_PARTICLE_COUNT;
    index +=
      1
  ) {
    const radius =
      0.62 +
      (
        visual.regions
          .haloOuterRadiusNormalized -
        0.62
      ) *
      Math.pow(
        sampler.sample01(
          index,
          600,
        ),
        0.78,
      );

    const angle =
      TWO_PI *
      sampler.sample01(
        index,
        601,
      );

    const x =
      Math.cos(
        angle,
      ) *
      radius;

    const y =
      Math.sin(
        angle,
      ) *
      radius;

    const z =
      sampler.normal(
        index,
        603,
      ) *
      0.12 *
      radius;

    const temperature =
      sampler.sample01(
        index,
        605,
      );

    const color =
      temperature <
        0.10
        ? mixColor(
            Object.freeze({
              red:
                0.52,
              green:
                0.72,
              blue:
                0.98,
            }),
            chromaticProfile.haloBias,
            0.24,
          )
        : temperature >
            0.94
          ? mixColor(
              Object.freeze({
                red:
                  0.98,
                green:
                  0.56,
                blue:
                  0.34,
              }),
              chromaticProfile.bulgeWarm,
              0.18,
            )
          : mixColor(
              Object.freeze({
                red:
                  0.86,
                green:
                  0.86,
                blue:
                  0.88,
              }),
              chromaticProfile.haloBias,
              0.10,
            );

    const prominence =
      sampler.sample01(
        index,
        606,
      );

    writeParticle(
      buffers,
      start +
        index,
      x,
      y,
      z,
      color.red,
      color.green,
      color.blue,
      prominence <
        0.97
        ? 0.16 +
          0.92 *
          prominence
        : 1.2 +
          2.4 *
          (
            prominence -
            0.97
          ) /
          0.03,
      0.012 +
      0.040 *
      Math.pow(
        prominence,
        2.1,
      ),
    );
  }

  return start +
    BARRED_SPIRAL_RESET_HALO_PARTICLE_COUNT;
}

function writeStellarBar(
  visual:
    GalaxyVisualStructure,

  sampler:
    DeterministicSampler,

  chromaticProfile:
    BarredSpiralChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const bar =
    visual.bar;

  if (
    bar ===
      null
  ) {
    return start;
  }

  const cosine =
    Math.cos(
      bar.angleRadians,
    );

  const sine =
    Math.sin(
      bar.angleRadians,
    );

  const windingSign =
    visual.windingDirection ===
    GalaxyWindingDirection.CLOCKWISE
      ? -1
      : 1;

  for (
    let index =
      0;
    index <
      BARRED_SPIRAL_RESET_BAR_PARTICLE_COUNT;
    index +=
      1
  ) {
    const endWeighted =
      sampler.sample01(
        index,
        760,
      ) <
      0.54;

    const sign =
      sampler.sample01(
        index,
        761,
      ) <
        0.5
        ? -1
        : 1;

    const along =
      endWeighted
        ? sign *
          bar.halfLengthNormalized *
          (
            0.60 +
            0.40 *
            Math.pow(
              sampler.sample01(
                index,
                762,
              ),
              0.72,
            )
          )
        : clamp(
            sampler.normal(
              index,
              763,
            ) *
            bar.halfLengthNormalized *
            0.62,
            -bar.halfLengthNormalized,
            bar.halfLengthNormalized,
          );

    const alongFraction =
      Math.min(
        1,
        Math.abs(
          along,
        ) /
        Math.max(
          EPSILON,
          bar.halfLengthNormalized,
        ),
      );

    const bendProgress =
      smoothstep01(
        0.58,
        1.0,
        alongFraction,
      );

    const bend =
      windingSign *
      sign *
      bar.widthNormalized *
      BARRED_SPIRAL_V4_BAR_CURVATURE_SCALE *
      Math.pow(
        bendProgress,
        1.28,
      );

    const widthEnvelope =
      1.24 -
      0.18 *
      Math.pow(
        alongFraction,
        1.18,
      );

    const across =
      bend +
      sampler.normal(
        index,
        764,
      ) *
      bar.widthNormalized *
      widthEnvelope *
      chromaticProfile.barPresenceScale *
      BARRED_SPIRAL_V4_1_BAR_VISIBILITY_BOOST;

    const x =
      along *
      cosine -
      across *
      sine;

    const y =
      along *
      sine +
      across *
      cosine;

    const z =
      sampler.normal(
        index,
        765,
      ) *
      bar.widthNormalized *
      (
        0.28 +
        0.22 *
        (
          1 -
          alongFraction
        )
      ) *
      chromaticProfile.barPresenceScale *
      BARRED_SPIRAL_V4_1_BAR_VISIBILITY_BOOST;

    const temperature =
      diskTemperature(
        Math.min(
          0.48,
          Math.abs(
            along,
          ),
        ),
        0.18,
        sampler.sample01(
          index,
          766,
        ),
      );

    const baseColor =
      stellarColor(
        temperature,
        Math.min(
          0.52,
          Math.abs(
            along,
          ),
        ),
        false,
        sampler.sample01(
          index,
          767,
        ),
      );

    const oldStarMix =
      0.54 +
      0.30 *
      (
        1 -
        alongFraction
      );

    const color =
      mixColor(
        baseColor,
        chromaticProfile.bulgeWarm,
        oldStarMix,
      );

    const prominence =
      sampler.sample01(
        index,
        768,
      );

    const rareBright =
      prominence >
      0.982;

    const size =
      (
        prominence <
          0.92
          ? 0.18 +
            0.68 *
            Math.pow(
              prominence /
              0.92,
              1.30,
            )
          : 0.88 +
            1.12 *
            (
              prominence -
              0.92
            ) /
            0.08
      ) *
      (
        1.10 +
        0.22 *
        (
          1 -
          alongFraction
        )
      ) *
      chromaticProfile.barPresenceScale *
      BARRED_SPIRAL_V4_1_BAR_VISIBILITY_BOOST *
      (
        rareBright
          ? 1.42 +
            0.42 *
            sampler.sample01(
              index,
              769,
            )
          : 1
      );

    const opacity =
      (
        0.048 +
        0.078 *
        (
          1 -
          0.36 *
          alongFraction
        ) +
        0.034 *
        Math.pow(
          prominence,
          1.8,
        ) +
        (
          rareBright
            ? 0.030
            : 0
        )
      ) *
      (
        0.98 -
        0.08 *
        bendProgress
      ) *
      (
        1.02 +
        0.16 *
        chromaticProfile.barPresenceScale
      ) *
      BARRED_SPIRAL_V4_1_BAR_VISIBILITY_BOOST;

    writeParticle(
      buffers,
      start +
        index,
      x,
      y,
      z,
      color.red,
      color.green,
      color.blue,
      Math.min(
        4.6,
        size,
      ),
      opacity,
    );
  }

  return start +
    BARRED_SPIRAL_RESET_BAR_PARTICLE_COUNT;
}

function barredArmFieldAt(
  visual:
    GalaxyVisualStructure,

  chromaticProfile:
    BarredSpiralChromaticProfile,

  radius:
    number,

  angle:
    number,
): ArmField {

  let bestInfluence =
    0;

  let bestDensity =
    0;

  let bestArmIndex =
    0;

  for (
    const arm of
    visual.arms
  ) {
    const armStart =
      barredArmStartRadius(
        visual,
        arm,
      );

    if (
      radius <
        armStart *
        0.76 ||
      radius >
        arm.radialEndNormalized *
        1.04
    ) {
      continue;
    }

    const progress =
      clamp01(
        (
          radius -
          armStart
        ) /
        Math.max(
          EPSILON,
          arm.radialEndNormalized -
          armStart,
        ),
      );

    const centerAngle =
      armCenterAngleAtRadius(
        visual,
        chromaticProfile,
        arm,
        radius,
      );

    const angularDistance =
      Math.abs(
        signedAngularDistance(
          angle,
          centerAngle,
        ),
      );

    const angularWidth =
      arm.widthNormalized *
      chromaticProfile.armWidthScale *
      (
        4.35 +
        1.55 *
        progress
      ) /
      Math.max(
        0.10,
        radius,
      );

    const normalizedDistance =
      angularDistance /
      Math.max(
        0.02,
        angularWidth,
      );

    const geometricInfluence =
      Math.exp(
        -0.5 *
        normalizedDistance *
        normalizedDistance,
      );

    const density =
      armDensityWave(
        arm,
        progress,
      );

    const innerArmSuppression =
      0.28 +
      0.72 *
      smoothstep01(
        0.18,
        0.38,
        radius,
      );

    const coherentFragment =
      armFragmentField(
        arm.index,
        radius,
        progress,
        0.5,
      );

    const fragmentSuppression =
      0.36 +
      0.64 *
      smoothstep01(
        0.18,
        0.66,
        coherentFragment,
      );

    const influence =
      geometricInfluence *
      (
        0.60 +
        0.58 *
        density
      ) *
      innerArmSuppression *
      fragmentSuppression;

    if (
      influence >
      bestInfluence
    ) {
      bestInfluence =
        influence;
      bestDensity =
        density;
      bestArmIndex =
        arm.index;
    }
  }

  return Object.freeze({
    influence:
      clamp01(
        bestInfluence,
      ),

    density:
      clamp01(
        bestDensity,
      ),

    armIndex:
      bestArmIndex,
  });
}

function sampleBarredOrganicArmPoint(
  visual:
    GalaxyVisualStructure,

  sampler:
    DeterministicSampler,

  chromaticProfile:
    BarredSpiralChromaticProfile,

  sampleIndex:
    number,

  channel:
    number,

  allowBranch:
    boolean,
): ArmPoint {

  const armIndex =
    Math.min(
      visual.arms.length -
        1,
      Math.floor(
        sampler.sample01(
          sampleIndex,
          channel,
        ) *
        visual.arms.length,
      ),
    );

  const arm =
    visual.arms[
      armIndex
    ];

  const progress =
    Math.pow(
      sampler.sample01(
        sampleIndex,
        channel +
          1,
      ),
      0.94,
    );

  const startRadius =
    barredArmStartRadius(
      visual,
      arm,
    );

  const radius =
    startRadius +
    (
      arm.radialEndNormalized -
      startRadius
    ) *
    progress;

  const centerAngle =
    armCenterAngleAtRadius(
      visual,
      chromaticProfile,
      arm,
      radius,
    );

  const density =
    armDensityWave(
      arm,
      progress,
    );

  const width =
    arm.widthNormalized *
    chromaticProfile.armWidthScale *
    (
      1.48 +
      1.36 *
      progress
    );

  const branchWave =
    0.5 +
    0.5 *
    Math.sin(
      arm.phaseRadians *
      2.1 +
      progress *
      18.0 +
      arm.index *
      0.74,
    );

  const laneWave =
    0.5 +
    0.5 *
    Math.sin(
      arm.phaseRadians *
      1.6 +
      progress *
      27.0 +
      arm.index *
      0.93,
    );

  const fragmentField =
    armFragmentField(
      arm.index,
      radius,
      progress,
      sampler.sample01(
        sampleIndex,
        channel +
          6,
      ),
    );

  const structureWave =
    clamp01(
      0.18 *
        density +
      0.22 *
        laneWave +
      0.60 *
        fragmentField,
    );

  const branchGate =
    allowBranch &&
    progress >
      0.32 &&
    branchWave >
      0.70
      ? (
          branchWave -
          0.70
        ) /
        0.30
      : 0;

  const branchSign =
    sampler.sample01(
      sampleIndex,
      channel +
        2,
    ) <
      0.5
      ? -1
      : 1;

  const widthModulation =
    0.56 +
    0.52 *
    Math.pow(
      structureWave,
      1.12,
    );

  const across =
    sampler.normal(
      sampleIndex,
      channel +
        3,
    ) *
    width *
    widthModulation *
    (
      0.74 +
      0.36 *
      (
        1 -
        density
      )
    );

  const radialJitter =
    sampler.normal(
      sampleIndex,
      channel +
        5,
    ) *
    width *
    0.46 *
    (
      0.82 +
      0.26 *
      (1 - structureWave)
    ) +
    branchSign *
    branchGate *
    width *
    0.34;

  const jitteredRadius =
    clamp(
      radius +
      radialJitter,
      0.025,
      1.04,
    );

  const angularOffset =
    across /
    Math.max(
      0.10,
      radius,
    ) +
    branchSign *
    branchGate *
    width /
    Math.max(
      0.12,
      radius,
    ) *
    (
      0.66 +
      0.32 *
      structureWave
    );

  const angle =
    centerAngle +
    angularOffset;

  return Object.freeze({
    x:
      Math.cos(
        angle,
      ) *
      jitteredRadius,

    y:
      Math.sin(
        angle,
      ) *
      jitteredRadius,

    radius:
      jitteredRadius,

    progress,

    armIndex,

    density,
  });
}

function barredArmStartRadius(
  visual:
    GalaxyVisualStructure,

  arm:
    GalaxyVisualArm,
): number {

  const bar =
    visual.bar;

  return clamp(
    Math.max(
      0.16,
      arm.radialStartNormalized *
        0.92,
      (
        bar
          ?.halfLengthNormalized ??
        0.18
      ) *
        0.86,
    ),
    0.16,
    0.38,
  );
}

function armCenterAngleAtRadius(
  visual:
    GalaxyVisualStructure,

  chromaticProfile:
    BarredSpiralChromaticProfile,

  arm:
    GalaxyVisualArm,

  radius:
    number,
): number {

  const bar =
    visual.bar;

  const windingSign =
    visual.windingDirection ===
    GalaxyWindingDirection.CLOCKWISE
      ? -1
      : 1;

  const startRadius =
    barredArmStartRadius(
      visual,
      arm,
    );

  const pitch =
    Math.max(
      17.0,
      arm.pitchAngleDegrees,
    ) *
    Math.PI /
    180;

  const rootSide =
    arm.index %
      2 ===
      0
      ? 0
      : Math.PI;

  const familyIndex =
    Math.floor(
      arm.index /
      2,
    );

  const familyCount =
    Math.max(
      1,
      Math.ceil(
        visual.arms.length /
        2,
      ),
    );

  const centeredFamily =
    familyIndex -
    (
      familyCount -
      1
    ) /
    2;

  const rootSpread =
    centeredFamily *
    (
      0.14 +
      0.10 *
      chromaticProfile.armMultiplicityBias
    ) *
    chromaticProfile.rootSpreadScale;

  const rootPhase =
    (
      bar
        ?.angleRadians ??
      visual.orientationRadians
    ) +
    rootSide +
    windingSign *
    rootSpread;

  return rootPhase +
    windingSign *
    Math.log(
      Math.max(
        radius,
        0.002,
      ) /
      startRadius,
    ) /
    Math.tan(
      Math.max(
        0.055,
        pitch,
      ),
    );
}

function armDensityWave(
  arm:
    GalaxyVisualArm,

  progress:
    number,
): number {

  const phase =
    arm.phaseRadians *
    0.62 +
    arm.index *
    0.81;

  const broad =
    0.5 +
    0.5 *
    Math.sin(
      phase +
      progress *
      5.8,
    );

  const medium =
    0.5 +
    0.5 *
    Math.sin(
      phase *
      1.7 +
      progress *
      12.4 +
      0.9,
    );

  const fine =
    0.5 +
    0.5 *
    Math.sin(
      phase *
      2.4 +
      progress *
      23.0 +
      0.4,
    );

  const intermittent =
    0.5 +
    0.5 *
    Math.sin(
      phase * 2.8 +
      progress * 37.0 +
      0.6,
    );

  return clamp01(
    0.08 +
    0.28 *
    broad +
    0.26 *
    medium +
    0.16 *
    fine +
    0.22 *
    Math.pow(
      intermittent,
      1.15,
    ),
  );
}

function armFragmentField(
  armIndex:
    number,

  radius:
    number,

  progress:
    number,

  variation:
    number,
): number {

  const coarse =
    0.5 +
    0.5 *
    Math.sin(
      armIndex * 1.17 +
      progress * 9.4 +
      radius * 4.6,
    );

  const medium =
    0.5 +
    0.5 *
    Math.sin(
      0.7 +
      armIndex * 0.81 +
      progress * 23.0 +
      variation * 6.0,
    );

  const fine =
    0.5 +
    0.5 *
    Math.sin(
      1.9 +
      armIndex * 1.39 +
      progress * 47.0 +
      radius * 11.0 +
      variation * 11.0,
    );

  return clamp01(
    0.18 +
    0.34 *
    coarse +
    0.30 *
    medium +
    0.18 *
    fine,
  );
}

function starFormationKnotAnchor(
  visual:
    GalaxyVisualStructure,

  sampler:
    DeterministicSampler,

  chromaticProfile:
    BarredSpiralChromaticProfile,

  clusterIndex:
    number,
): KnotAnchor {

  const point =
    sampleBarredOrganicArmPoint(
      visual,
      sampler,
      chromaticProfile,
      1_400_000 +
        clusterIndex,
      700,
      true,
    );

  const family =
    sampler.sample01(
      clusterIndex,
      710,
    );

  return Object.freeze({
    x:
      point.x,

    y:
      point.y,

    z:
      sampler.normal(
        clusterIndex,
        712,
      ) *
      0.010,

    radius:
      point.radius,

    spread:
      0.010 +
      0.038 *
      Math.pow(
        sampler.sample01(
          clusterIndex,
          714,
        ),
        1.18,
      ) *
      (
        0.68 +
        0.58 *
        point.radius
      ),

    colorFamily:
      family,
  });
}

function diskTemperature(
  radius:
    number,

  armInfluence:
    number,

  roll:
    number,
): number {

  const outerYoung =
    smoothstep01(
      0.28,
      0.92,
      radius,
    );

  const blueProbability =
    0.045 +
    0.15 *
    outerYoung +
    0.20 *
    armInfluence;

  if (
    roll <
    blueProbability
  ) {
    return 0.03 +
      0.15 *
      roll /
      Math.max(
        EPSILON,
        blueProbability,
      );
  }

  const redProbability =
    0.035 +
    0.020 *
    (
      1 -
      armInfluence
    );

  if (
    roll >
    1 -
    redProbability
  ) {
    return 0.965 +
      0.035 *
      roll;
  }

  if (
    roll >
    0.80
  ) {
    return 0.80 +
      0.14 *
      roll;
  }

  return 0.34 +
    0.40 *
    roll;
}

function armTemperature(
  radius:
    number,

  roll:
    number,
): number {

  const outerYoung =
    smoothstep01(
      0.20,
      0.88,
      radius,
    );

  const blueProbability =
    0.24 +
    0.22 *
    outerYoung;

  if (
    roll <
    blueProbability
  ) {
    return 0.025 +
      0.15 *
      roll /
      blueProbability;
  }

  if (
    roll >
    0.975
  ) {
    return 0.975 +
      0.025 *
      roll;
  }

  if (
    roll >
    0.86
  ) {
    return 0.82 +
      0.13 *
      roll;
  }

  return 0.34 +
    0.34 *
    roll;
}

function stellarColor(
  temperature:
    number,

  radius:
    number,

  arm:
    boolean,

  variation:
    number,
): RgbColor {

  if (
    temperature <
    0.22
  ) {
    return Object.freeze({
      red:
        arm
          ? 0.30 +
            0.08 *
            variation
          : 0.54 +
            0.08 *
            variation,
      green:
        arm
          ? 0.66 +
            0.10 *
            variation
          : 0.76 +
            0.08 *
            variation,
      blue:
        1.0,
    });
  }

  if (
    temperature >
    0.96
  ) {
    return Object.freeze({
      red:
        1.0,
      green:
        0.32 +
        0.13 *
        variation,
      blue:
        0.16 +
        0.09 *
        variation,
    });
  }

  if (
    temperature >
    0.80
  ) {
    return Object.freeze({
      red:
        0.99,
      green:
        0.70 +
        0.10 *
        variation,
      blue:
        0.36 +
        0.08 *
        variation,
    });
  }

  const innerWarm =
    1 -
    smoothstep01(
      0.10,
      0.58,
      radius,
    );

  return Object.freeze({
    red:
      0.86 +
      0.10 *
      innerWarm +
      0.03 *
      variation,
    green:
      0.86 +
      0.05 *
      innerWarm +
      0.04 *
      variation,
    blue:
      arm
        ? 0.92 +
          0.04 *
          variation
        : 0.82 -
          0.14 *
          innerWarm +
          0.04 *
          variation,
  });
}

function knotStarColor(
  chromaticProfile:
    BarredSpiralChromaticProfile,

  family:
    number,

  variation:
    number,
): RgbColor {

  if (
    family <
    0.68
  ) {
    return mixColor(
      adjustColor(
        chromaticProfile.armHighlight,
        variation,
        0.03,
        0.04,
        0.05,
      ),
      Object.freeze({
        red:
          0.42,
        green:
          0.78,
        blue:
          1.0,
      }),
      0.42,
    );
  }

  if (
    family <
    0.88
  ) {
    return mixColor(
      adjustColor(
        chromaticProfile.armAccent,
        variation,
        0.05,
        0.04,
        0.05,
      ),
      Object.freeze({
        red:
          0.96,
        green:
          0.36 +
          0.08 *
          variation,
        blue:
          0.82 +
          0.10 *
          variation,
      }),
      0.58,
    );
  }

  return mixColor(
    adjustColor(
      chromaticProfile.bulgeWarm,
      variation,
      0.02,
      0.04,
      0.03,
    ),
    Object.freeze({
      red:
        1.0,
      green:
        0.76 +
        0.08 *
        variation,
      blue:
        0.34 +
        0.07 *
        variation,
    }),
    0.62,
  );
}

function gasColor(
  chromaticProfile:
    BarredSpiralChromaticProfile,

  radius:
    number,

  armIndexHint:
    number,

  palette:
    number,

  variation:
    number,
): RgbColor {

  const inner =
    1 -
    smoothstep01(
      0.07,
      0.50,
      radius,
    );

  const warmBridge =
    mixColor(
      chromaticProfile.gasInnerAccent,
      chromaticProfile.bulgeWarm,
      0.58 +
      0.18 *
      variation,
    );

  const whiteCoreMix =
    smoothstep01(
      0.84,
      1.0,
      inner,
    );

  // A dominant gas identity must not collapse the whole ISM to one hue.
  // Reserve a deterministic minority of cloud anchors for warmer secondary
  // complexes. The cloud-level palette roll is shared by four neighbouring
  // samples, so these become coherent knots rather than isolated coloured
  // pixels while the dominant arm hue still occupies the clear majority.
  if (
    palette <
    0.12
  ) {
    const warmSecondary =
      mixColor(
        chromaticProfile.gasInnerAccent,
        Object.freeze({
          red:
            1.0,
          green:
            0.52,
          blue:
            0.42,
        }),
        0.24 +
        0.16 *
        variation,
      );

    const dominantTrace =
      mixColor(
        warmSecondary,
        chromaticProfile.dominantArmGas,
        0.06 +
        0.05 *
        (
          1 -
          inner
        ),
      );

    return adjustColor(
      dominantTrace,
      variation,
      0.012,
      0.016,
      0.018,
    );
  }

  if (
    armIndexHint >=
    0
  ) {
    const segmentStrength =
      armSegmentWave(
        armIndexHint,
        radius,
        palette,
        variation,
      );

    const outerBlend =
      smoothstep01(
        0.22,
        0.72,
        radius,
      );

    const innerBlend =
      1 -
      outerBlend;

    const dominant =
      mixColor(
        chromaticProfile.dominantArmGas,
        chromaticProfile.supportingArmGas,
        0.16 +
        0.18 *
        Math.pow(
          segmentStrength,
          1.10,
        ),
      );

    const accentScatter =
      mixColor(
        chromaticProfile.supportingArmGas,
        chromaticProfile.tertiaryArmGas,
        0.18 +
        0.46 *
        palette,
      );

    const segmentColor =
      mixColor(
        dominant,
        accentScatter,
        0.12 +
        0.24 *
        Math.pow(
          segmentStrength,
          1.35,
        ),
      );

    const armGas =
      mixColor(
        segmentColor,
        warmBridge,
        0.26 *
        innerBlend +
        0.06 *
        (1 - segmentStrength),
      );

    const luminousMix =
      mixColor(
        armGas,
        chromaticProfile.bulgeWhite,
        whiteCoreMix *
        0.18,
      );

    return adjustColor(
      luminousMix,
      variation,
      0.022,
      0.022,
      0.032,
    );
  }

  const interArmOuter =
    mixColor(
      chromaticProfile.gasOuter,
      chromaticProfile.diskNeutral,
      0.42,
    );

  const interArmColor =
    mixColor(
      interArmOuter,
      warmBridge,
      0.42 *
      inner +
      0.12 *
      variation,
    );

  const coreAmber =
    mixColor(
      chromaticProfile.bulgeOuter,
      chromaticProfile.bulgeWarm,
      0.70 +
      0.18 *
      variation,
    );

  const softened =
    mixColor(
      interArmColor,
      coreAmber,
      0.38 +
      0.48 *
      inner +
      whiteCoreMix *
      0.08,
    );

  const warmCoreHalo =
    mixColor(
      softened,
      chromaticProfile.bulgeWarm,
      0.12 +
      0.28 *
      inner,
    );

  return adjustColor(
    warmCoreHalo,
    variation,
    0.016,
    0.016,
    0.022,
  );
}

function createBarredSpiralChromaticProfile(
  sampler:
    DeterministicSampler,
): BarredSpiralChromaticProfile {

  const paletteRoll =
    sampler.sample01(
      0,
      9_100,
    );

  const paletteFamily =
    Math.min(
      5,
      Math.floor(
        paletteRoll *
        6,
      ),
    );

  const saturation =
    0.72 +
    0.28 *
    sampler.sample01(
      0,
      9_101,
    );

  const palette =
    spiralPaletteForFamily(
      paletteFamily,
      saturation,
    );

  const structuralRoll =
    sampler.sample01(
      0,
      9_106,
    );

  const structuralVariant =
    Math.min(
      4,
      Math.floor(
        structuralRoll *
        5,
      ),
    );

  const structuralProfiles = [
    Object.freeze({
      armWidthScale: 1.32,
      diskFillScale: 1.10,
      gasPresenceScale: 1.10,
      barPresenceScale: 1.16,
      rootSpreadScale: 0.92,
      armMultiplicityBias: 0.16,
    }),
    Object.freeze({
      armWidthScale: 1.48,
      diskFillScale: 1.18,
      gasPresenceScale: 1.26,
      barPresenceScale: 1.10,
      rootSpreadScale: 1.02,
      armMultiplicityBias: 0.28,
    }),
    Object.freeze({
      armWidthScale: 1.38,
      diskFillScale: 1.16,
      gasPresenceScale: 1.16,
      barPresenceScale: 1.38,
      rootSpreadScale: 1.06,
      armMultiplicityBias: 0.40,
    }),
    Object.freeze({
      armWidthScale: 1.56,
      diskFillScale: 1.24,
      gasPresenceScale: 1.34,
      barPresenceScale: 1.04,
      rootSpreadScale: 1.16,
      armMultiplicityBias: 0.56,
    }),
    Object.freeze({
      armWidthScale: 1.26,
      diskFillScale: 1.08,
      gasPresenceScale: 1.06,
      barPresenceScale: 1.38,
      rootSpreadScale: 0.84,
      armMultiplicityBias: 0.34,
    }),
  ] as const;

  const structuralProfile =
    structuralProfiles[
      structuralVariant
    ];

  return Object.freeze({
    armBase:
      palette.armBase,
    armHighlight:
      palette.armHighlight,
    armAccent:
      palette.armAccent,
    gasOuter:
      palette.gasOuter,
    dominantArmGas:
      palette.gasOuter,
    supportingArmGas:
      palette.supportingArmGas,
    tertiaryArmGas:
      palette.tertiaryArmGas,
    gasInnerAccent:
      palette.gasInnerAccent,
    bulgeOuter:
      palette.bulgeOuter,
    bulgeWarm:
      palette.bulgeWarm,
    bulgeWhite:
      palette.bulgeWhite,
    diskNeutral:
      palette.diskNeutral,
    haloBias:
      palette.haloBias,
    armTintStrength:
      0.42 +
      0.26 *
      sampler.sample01(
        0,
        9_102,
      ),
    gasTintStrength:
      0.62 +
      0.26 *
      sampler.sample01(
        0,
        9_103,
      ),
    bulgeVerticalScale:
      1.20 +
      0.35 *
      sampler.sample01(
        0,
        9_104,
      ),
    gasVerticalScale:
      1.10 +
      0.25 *
      sampler.sample01(
        0,
        9_105,
      ),
    armWidthScale:
      structuralProfile.armWidthScale,
    diskFillScale:
      structuralProfile.diskFillScale,
    gasPresenceScale:
      structuralProfile.gasPresenceScale,
    barPresenceScale:
      structuralProfile.barPresenceScale,
    rootSpreadScale:
      structuralProfile.rootSpreadScale,
    armMultiplicityBias:
      structuralProfile.armMultiplicityBias,
  });
}

function spiralPaletteForFamily(
  family:
    number,

  saturation:
    number,
): BarredSpiralBasePalette {

  const palettes = [
    Object.freeze({
      armBase: rgb(0.78, 0.88, 1.00),
      armHighlight: rgb(0.42, 0.82, 1.00),
      armAccent: rgb(0.96, 0.44, 0.98),
      gasOuter: rgb(0.08, 0.58, 1.00),
      gasInnerAccent: rgb(0.98, 0.76, 0.50),
      bulgeOuter: rgb(0.92, 0.76, 0.54),
      bulgeWarm: rgb(0.99, 0.86, 0.66),
      bulgeWhite: rgb(1.00, 0.98, 0.92),
      diskNeutral: rgb(0.90, 0.89, 0.86),
      haloBias: rgb(0.64, 0.74, 0.96),
    }),
    Object.freeze({
      armBase: rgb(0.84, 0.92, 0.94),
      armHighlight: rgb(0.42, 0.92, 0.76),
      armAccent: rgb(1.00, 0.72, 0.30),
      gasOuter: rgb(0.08, 0.78, 0.42),
      gasInnerAccent: rgb(0.98, 0.78, 0.46),
      bulgeOuter: rgb(0.94, 0.78, 0.54),
      bulgeWarm: rgb(1.00, 0.86, 0.64),
      bulgeWhite: rgb(1.00, 0.98, 0.92),
      diskNeutral: rgb(0.91, 0.90, 0.86),
      haloBias: rgb(0.66, 0.84, 0.80),
    }),
    Object.freeze({
      armBase: rgb(0.92, 0.88, 0.82),
      armHighlight: rgb(0.98, 0.70, 0.34),
      armAccent: rgb(0.48, 0.86, 1.00),
      gasOuter: rgb(1.00, 0.42, 0.08),
      gasInnerAccent: rgb(1.00, 0.80, 0.54),
      bulgeOuter: rgb(0.94, 0.76, 0.52),
      bulgeWarm: rgb(1.00, 0.87, 0.66),
      bulgeWhite: rgb(1.00, 0.98, 0.92),
      diskNeutral: rgb(0.92, 0.89, 0.84),
      haloBias: rgb(0.96, 0.74, 0.56),
    }),
    Object.freeze({
      armBase: rgb(0.84, 0.86, 0.98),
      armHighlight: rgb(0.56, 0.64, 1.00),
      armAccent: rgb(0.98, 0.48, 0.96),
      gasOuter: rgb(0.52, 0.20, 1.00),
      gasInnerAccent: rgb(0.96, 0.70, 0.58),
      bulgeOuter: rgb(0.92, 0.74, 0.54),
      bulgeWarm: rgb(0.99, 0.84, 0.66),
      bulgeWhite: rgb(1.00, 0.98, 0.93),
      diskNeutral: rgb(0.90, 0.88, 0.88),
      haloBias: rgb(0.70, 0.70, 0.96),
    }),
    Object.freeze({
      armBase: rgb(0.88, 0.94, 0.88),
      armHighlight: rgb(0.46, 0.86, 0.64),
      armAccent: rgb(1.00, 0.62, 0.34),
      gasOuter: rgb(0.12, 0.68, 0.32),
      gasInnerAccent: rgb(0.99, 0.79, 0.52),
      bulgeOuter: rgb(0.94, 0.78, 0.56),
      bulgeWarm: rgb(1.00, 0.87, 0.66),
      bulgeWhite: rgb(1.00, 0.98, 0.92),
      diskNeutral: rgb(0.90, 0.90, 0.86),
      haloBias: rgb(0.74, 0.90, 0.76),
    }),
    Object.freeze({
      armBase: rgb(0.90, 0.88, 0.96),
      armHighlight: rgb(0.42, 0.74, 1.00),
      armAccent: rgb(1.00, 0.54, 0.86),
      gasOuter: rgb(0.88, 0.18, 0.72),
      gasInnerAccent: rgb(0.98, 0.78, 0.54),
      bulgeOuter: rgb(0.94, 0.78, 0.58),
      bulgeWarm: rgb(1.00, 0.88, 0.68),
      bulgeWhite: rgb(1.00, 0.98, 0.92),
      diskNeutral: rgb(0.90, 0.89, 0.90),
      haloBias: rgb(0.78, 0.76, 0.96),
    }),
  ] as const;

  const selected =
    palettes[family];

  return Object.freeze({
    armBase: mixColor(selected.diskNeutral, selected.armBase, saturation * 0.72),
    armHighlight: mixColor(selected.armBase, selected.armHighlight, saturation),
    armAccent: mixColor(selected.armBase, selected.armAccent, saturation),
    gasOuter: mixColor(selected.armBase, selected.gasOuter, saturation),
    dominantArmGas: selected.gasOuter,
    supportingArmGas: mixColor(selected.armHighlight, selected.armAccent, 0.34),
    tertiaryArmGas: mixColor(selected.diskNeutral, selected.armAccent, 0.24),
    gasInnerAccent: selected.gasInnerAccent,
    bulgeOuter: selected.bulgeOuter,
    bulgeWarm: selected.bulgeWarm,
    bulgeWhite: selected.bulgeWhite,
    diskNeutral: selected.diskNeutral,
    haloBias: selected.haloBias,
  });
}

function tintDiskColor(
  chromaticProfile:
    BarredSpiralChromaticProfile,

  baseColor:
    RgbColor,

  armField:
    ArmField,

  radius:
    number,

  angle:
    number,

  variation:
    number,
): RgbColor {

  const diskWarm =
    1 -
    smoothstep01(
      0.08,
      0.52,
      radius,
    );

  const neutral =
    mixColor(
      chromaticProfile.diskNeutral,
      chromaticProfile.bulgeWarm,
      0.18 * diskWarm,
    );

  const neutralized =
    mixColor(
      baseColor,
      neutral,
      0.12 +
      0.12 *
      diskWarm,
    );

  if (
    armField.influence <=
    0.14
  ) {
    return neutralized;
  }

  const segmentWave =
    armSegmentWave(
      armField.armIndex,
      radius,
      angle,
      variation,
    );

  const tint =
    armLocalTint(
      chromaticProfile,
      armField.armIndex,
      radius,
      segmentWave,
    );

  return mixColor(
    neutralized,
    tint,
    chromaticProfile.armTintStrength *
    0.55 *
    armField.influence,
  );
}

function tintArmColor(
  chromaticProfile:
    BarredSpiralChromaticProfile,

  baseColor:
    RgbColor,

  point:
    ArmPoint,

  variation:
    number,
): RgbColor {

  const segmentWave =
    armSegmentWave(
      point.armIndex,
      point.radius,
      point.progress,
      variation,
    );

  const tint =
    armLocalTint(
      chromaticProfile,
      point.armIndex,
      point.radius,
      segmentWave,
    );

  return mixColor(
    baseColor,
    tint,
    chromaticProfile.armTintStrength *
    (
      0.72 +
      0.26 *
      point.density
    ),
  );
}

function armSegmentWave(
  armIndex:
    number,

  radius:
    number,

  phase:
    number,

  variation:
    number,
): number {

  const broad =
    0.5 +
    0.5 *
    Math.sin(
      armIndex * 1.27 +
      radius * 10.8 +
      phase * 7.2,
    );

  const fine =
    0.5 +
    0.5 *
    Math.sin(
      1.4 +
      armIndex * 0.73 +
      radius * 24.0 +
      phase * 19.0 +
      variation * 3.0,
    );

  return clamp01(
    0.64 *
      broad +
    0.36 *
      fine,
  );
}

function armLocalTint(
  chromaticProfile:
    BarredSpiralChromaticProfile,

  armIndex:
    number,

  radius:
    number,

  segmentWave:
    number,
): RgbColor {

  const blueMix =
    clamp01(
      0.36 +
      0.42 *
      Math.sin(
        armIndex * 1.21 +
        radius * 8.0,
      ),
    );

  const primary =
    mixColor(
      chromaticProfile.armBase,
      chromaticProfile.armHighlight,
      blueMix,
    );

  const accented =
    mixColor(
      primary,
      chromaticProfile.armAccent,
      Math.pow(
        segmentWave,
        1.7,
      ) * 0.48,
    );

  return mixColor(
    accented,
    chromaticProfile.armBase,
    0.10,
  );
}

function adjustColor(
  color:
    RgbColor,

  variation:
    number,

  redAmplitude:
    number,

  greenAmplitude:
    number,

  blueAmplitude:
    number,
): RgbColor {

  return Object.freeze({
    red:
      clamp01(
        color.red +
        redAmplitude *
        (
          variation -
          0.5
        ) *
        2,
      ),
    green:
      clamp01(
        color.green +
        greenAmplitude *
        (
          variation -
          0.5
        ) *
        2,
      ),
    blue:
      clamp01(
        color.blue +
        blueAmplitude *
        (
          variation -
          0.5
        ) *
        2,
      ),
  });
}

function rgb(
  red:
    number,

  green:
    number,

  blue:
    number,
): RgbColor {

  return Object.freeze({
    red,
    green,
    blue,
  });
}

function mixColor(
  first:
    RgbColor,

  second:
    RgbColor,

  amount:
    number,
): RgbColor {

  const t =
    clamp01(
      amount,
    );

  return Object.freeze({
    red:
      first.red *
      (
        1 -
        t
      ) +
      second.red *
      t,

    green:
      first.green *
      (
        1 -
        t
      ) +
      second.green *
      t,

    blue:
      first.blue *
      (
        1 -
        t
      ) +
      second.blue *
      t,
  });
}

function signedAngularDistance(
  first:
    number,

  second:
    number,
): number {

  let difference =
    (
      first -
      second
    ) %
    TWO_PI;

  if (
    difference >
    Math.PI
  ) {
    difference -=
      TWO_PI;
  }

  if (
    difference <
    -Math.PI
  ) {
    difference +=
      TWO_PI;
  }

  return difference;
}

function requiredVisual(
  model:
    BarredSpiralGalaxyRenderInput,
): GalaxyVisualStructure {

  const visual =
    model.visualStructure;

  if (
    visual ===
    null
  ) {
    throw new RangeError(
      'BARRED_SPIRAL particle generation requires detailed GalaxyVisualStructure.',
    );
  }

  return visual;
}

function createSampler(
  model:
    BarredSpiralGalaxyRenderInput,
): DeterministicSampler {

  const source = [
    model.universeSeedNormalizedValue,
    model.generatorVersionCode,
    model.galaxyIndex,
    'GENESIS-BARRED_SPIRAL-RESET-V2',
  ].join(
    '|',
  );

  let seed =
    0x811c9dc5;

  for (
    let index =
      0;
    index <
      source.length;
    index +=
      1
  ) {
    seed ^=
      source.charCodeAt(
        index,
      );

    seed =
      Math.imul(
        seed,
        0x01000193,
      );
  }

  const normalizedSeed =
    seed >>>
    0;

  return Object.freeze({
    sample01(
      index:
        number,

      channel:
        number,
    ): number {
      return hashedUnit(
        normalizedSeed,
        index,
        channel,
      );
    },

    normal(
      index:
        number,

      channel:
        number,
    ): number {
      const u1 =
        Math.max(
          EPSILON,
          hashedUnit(
            normalizedSeed,
            index,
            channel,
          ),
        );

      const u2 =
        hashedUnit(
          normalizedSeed,
          index,
          channel +
            1,
        );

      const raw =
        Math.sqrt(
          -2 *
          Math.log(
            u1,
          ),
        ) *
        Math.cos(
          TWO_PI *
          u2,
        );

      return clamp(
        raw,
        -3,
        3,
      ) /
      3;
    },
  });
}

function hashedUnit(
  seed:
    number,

  index:
    number,

  channel:
    number,
): number {

  let value =
    (
      seed ^
      Math.imul(
        index +
          1,
        0x9e3779b1,
      ) ^
      Math.imul(
        channel +
          1,
        0x85ebca6b,
      )
    ) >>>
    0;

  value ^=
    value >>>
    16;

  value =
    Math.imul(
      value,
      0x7feb352d,
    ) >>>
    0;

  value ^=
    value >>>
    15;

  value =
    Math.imul(
      value,
      0x846ca68b,
    ) >>>
    0;

  value ^=
    value >>>
    16;

  return (
    value >>>
    0
  ) /
  UINT32_SCALE;
}

function unitSphereDirection(
  sampler:
    DeterministicSampler,

  index:
    number,

  channel:
    number,
): Readonly<{
  x: number;
  y: number;
  z: number;
}> {

  const z =
    2 *
      sampler.sample01(
        index,
        channel,
      ) -
    1;

  const azimuth =
    TWO_PI *
    sampler.sample01(
      index,
      channel +
        1,
    );

  const planar =
    Math.sqrt(
      Math.max(
        0,
        1 -
          z *
          z,
      ),
    );

  return Object.freeze({
    x:
      planar *
      Math.cos(
        azimuth,
      ),

    y:
      planar *
      Math.sin(
        azimuth,
      ),

    z,
  });
}

function rotate2d(
  x:
    number,

  y:
    number,

  angle:
    number,
): Readonly<{
  x: number;
  y: number;
}> {

  const cosine =
    Math.cos(
      angle,
    );

  const sine =
    Math.sin(
      angle,
    );

  return Object.freeze({
    x:
      x *
        cosine -
      y *
        sine,

    y:
      x *
        sine +
      y *
        cosine,
  });
}

function writeParticle(
  buffers:
    ParticleBuffers,

  index:
    number,

  x:
    number,

  y:
    number,

  z:
    number,

  red:
    number,

  green:
    number,

  blue:
    number,

  size:
    number,

  opacity:
    number,
): void {

  const offset =
    index *
    3;

  buffers.positions[
    offset
  ] =
    x;

  buffers.positions[
    offset +
      1
  ] =
    y;

  buffers.positions[
    offset +
      2
  ] =
    z;

  buffers.colors[
    offset
  ] =
    clamp01(
      red,
    );

  buffers.colors[
    offset +
      1
  ] =
    clamp01(
      green,
    );

  buffers.colors[
    offset +
      2
  ] =
    clamp01(
      blue,
    );

  buffers.sizes[
    index
  ] =
    Math.max(
      0.01,
      size,
    );

  buffers.opacities[
    index
  ] =
    clamp01(
      opacity,
    );
}

function smoothstep01(
  edge0:
    number,

  edge1:
    number,

  value:
    number,
): number {

  const t =
    clamp01(
      (
        value -
        edge0
      ) /
      Math.max(
        EPSILON,
        edge1 -
        edge0,
      ),
    );

  return t *
    t *
    (
      3 -
      2 *
      t
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
