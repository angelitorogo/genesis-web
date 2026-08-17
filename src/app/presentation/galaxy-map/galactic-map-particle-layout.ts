import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  GalaxyWindingDirection,
  type GalaxyVisualArm,
} from '../../domain/universe/galaxy-visual-structure';

import {
  ExternalGalaxyMorphologyHint,
} from '../../domain/observation/galaxy/external-galaxy-preliminary-information';

import {
  type GalacticMapModel,
} from './galactic-map-model';

import {
  createGalacticMapParticleRenderInput,
  type GalacticMapParticleRenderInput,
} from './galactic-map-particle-render-input';

const TWO_PI =
  Math.PI *
  2;

/**
 * Point 10.1 visual density.
 *
 * These are render samples only. They are deliberately not physical stars,
 * systems, discoveries, locators or persisted entities.
 */
const CORE_PARTICLE_COUNT =
  20_000;

const BODY_PARTICLE_COUNT =
  92_000;

const HALO_PARTICLE_COUNT =
  12_000;

const BAR_PARTICLE_COUNT =
  8_000;

/**
 * Extra visual samples used only by BARRED_SPIRAL.
 *
 * They reinforce the stellar overdensity of the arms without increasing
 * point size, adding glow or materializing physical stars.
 */
const BARRED_SPIRAL_ARM_REINFORCEMENT_PARTICLE_COUNT =
  150_000;

/**
 * Extra visual samples used only by SPIRAL.
 *
 * The normal spiral receives the same total visual density as BARRED_SPIRAL,
 * but without a bar. Its arm reinforcement is slightly broader and softer so
 * both disk morphologies remain immediately distinguishable.
 */
const SPIRAL_ARM_REINFORCEMENT_PARTICLE_COUNT =
  154_000;

/**
 * Smooth radial taper applied only to spiral-arm render samples.
 *
 * The value is the exponential decay strength used by
 * decayingArmProgress(). Higher values concentrate more samples near the
 * arm origin while progressively thinning the outer arm without changing
 * the total particle budget.
 *
 * BARRED_SPIRAL intentionally receives the stronger taper because the arms
 * must visually emerge from the dense bar/bulge neighbourhood and dissolve
 * more decisively toward their outer ends.
 */
const BARRED_SPIRAL_ARM_RADIAL_DECAY_STRENGTH =
  1.70;

const SPIRAL_ARM_RADIAL_DECAY_STRENGTH =
  1.25;

/**
 * Render-only arm-root geometry.
 *
 * Spiral arms are extended inward as the SAME logarithmic structure instead
 * of adding a secondary bridge population. Normal spirals overlap the outer
 * bulge, while barred spirals start slightly inside the physical end of the
 * stellar bar and are anchored to the nearest bar endpoint.
 */
const SPIRAL_ARM_BULGE_OVERLAP_FACTOR =
  0.78;

const BARRED_SPIRAL_ARM_BAR_OVERLAP_WIDTH_FACTOR =
  0.42;

/**
 * The final section of a barred-spiral bar bends into the tangent of the
 * corresponding arm root. The central 62% remains a recognizably straight
 * stellar bar; only the outer section becomes the organic transition.
 */
const BARRED_SPIRAL_BAR_CURVE_START_FACTOR =
  0.62;

const BARRED_SPIRAL_BAR_END_TANGENT_SCALE =
  0.72;

const BARRED_SPIRAL_BAR_TRANSITION_WIDTH_BOOST =
  0.18;

/**
 * Extra render-only stellar samples used only by DWARF.
 *
 * Dwarf galaxies need a visibly continuous low-surface-brightness stellar
 * body. A larger renderer-only budget is used here so the continuous body
 * remains legible after its wider asymmetric distribution. Point size stays
 * unchanged: density comes from more samples, not larger points, glow or fog.
 */
const DWARF_STELLAR_BODY_REINFORCEMENT_PARTICLE_COUNT =
  320_000;

/**
 * Extra render-only stellar samples used only by IRREGULAR.
 *
 * Irregular galaxies need one continuous, asymmetric stellar body with
 * embedded star-forming regions. The reinforcement increases surface-density
 * without changing point size, adding glow or materializing physical stars.
 */
const IRREGULAR_STELLAR_BODY_REINFORCEMENT_PARTICLE_COUNT =
  350_000;

const UINT32_SCALE =
  4_294_967_296;

const EPSILON =
  1e-9;

type DiskPopulation =
  'arm' |
  'interarm' |
  'diffuse';

export interface GalacticMapParticleLayout {
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

interface PlanarPoint {
  readonly x:
    number;

  readonly y:
    number;

  readonly radius:
    number;

  readonly armEnhanced:
    boolean;

  readonly population:
    DiskPopulation;
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

interface ClusterAnchor {
  readonly x:
    number;

  readonly y:
    number;

  readonly spread:
    number;

  readonly knot:
    boolean;
}

/**
 * Renderer-only deterministic projection of GalaxyVisualStructure.
 *
 * The sampler intentionally hashes every particle/channel independently.
 * The previous additive low-discrepancy sequence correlated radius, azimuth
 * and height and could collapse a volumetric spheroid into visible curves.
 * This generator keeps deterministic output while decorrelating dimensions.
 */
export class GalacticMapParticleLayoutGenerator {

  private constructor() {}

  static generate(
    model:
      GalacticMapModel,
  ): GalacticMapParticleLayout {

    return this.generateFromRenderInput(
      createGalacticMapParticleRenderInput(
        model,
      ),
    );
  }

  static generateFromRenderInput(
    model:
      GalacticMapParticleRenderInput,
  ): GalacticMapParticleLayout {

    const visual =
      requiredVisual(
        model,
      );

    const barredSpiral =
      isBarredSpiral(
        model,
      );

    const spiral =
      isSpiral(
        model,
      );

    const dwarf =
      isDwarf(
        model,
      );

    const irregular =
      isIrregular(
        model,
      );

    const count =
      CORE_PARTICLE_COUNT +
      BODY_PARTICLE_COUNT +
      HALO_PARTICLE_COUNT +
      (
        visual.bar ===
          null
          ? 0
          : BAR_PARTICLE_COUNT
      ) +
      (
        barredSpiral
          ? BARRED_SPIRAL_ARM_REINFORCEMENT_PARTICLE_COUNT
          : 0
      ) +
      (
        spiral
          ? SPIRAL_ARM_REINFORCEMENT_PARTICLE_COUNT
          : 0
      ) +
      (
        dwarf
          ? DWARF_STELLAR_BODY_REINFORCEMENT_PARTICLE_COUNT
          : 0
      ) +
      (
        irregular
          ? IRREGULAR_STELLAR_BODY_REINFORCEMENT_PARTICLE_COUNT
          : 0
      );

    const buffers:
      ParticleBuffers =
      {
        positions:
          new Float32Array(
            count *
            3,
          ),

        colors:
          new Float32Array(
            count *
            3,
          ),

        sizes:
          new Float32Array(
            count,
          ),

        opacities:
          new Float32Array(
            count,
          ),
      };

    const sampler =
      createSampler(
        model,
      );

    let cursor =
      0;

    cursor =
      writeCore(
        model,
        sampler,
        buffers,
        cursor,
      );

    cursor =
      writeBody(
        model,
        sampler,
        buffers,
        cursor,
      );

    if (
      barredSpiral
    ) {
      cursor =
        writeBarredSpiralArmReinforcement(
          model,
          sampler,
          buffers,
          cursor,
        );
    }

    if (
      spiral
    ) {
      cursor =
        writeSpiralArmReinforcement(
          model,
          sampler,
          buffers,
          cursor,
        );
    }

    if (
      dwarf
    ) {
      cursor =
        writeDwarfStellarBodyReinforcement(
          model,
          sampler,
          buffers,
          cursor,
        );
    }

    if (
      irregular
    ) {
      cursor =
        writeIrregularStellarBodyReinforcement(
          model,
          sampler,
          buffers,
          cursor,
        );
    }

    cursor =
      writeHalo(
        model,
        sampler,
        buffers,
        cursor,
      );

    if (
      visual.bar !==
      null
    ) {
      cursor =
        writeBar(
          model,
          sampler,
          buffers,
          cursor,
        );
    }

    if (
      cursor !==
      count
    ) {
      throw new Error(
        'Galactic particle layout cursor invariant broken.',
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

      count,
    });
  }
}

function writeCore(
  model:
    GalacticMapParticleRenderInput,

  sampler:
    DeterministicSampler,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const visual =
    requiredVisual(
      model,
    );

  const morphology =
    model
      .morphologyHint;

  const spheroidal =
    morphology ===
    ExternalGalaxyMorphologyHint
      .SPHEROIDAL;

  const dwarfLike =
    morphology ===
    ExternalGalaxyMorphologyHint
      .DWARF_LIKE;

  if (
    morphology ===
    ExternalGalaxyMorphologyHint
      .IRREGULAR
  ) {
    return writeIrregularCore(
      model,
      sampler,
      buffers,
      start,
    );
  }

  if (
    dwarfLike
  ) {
    return writeDwarfCore(
      model,
      sampler,
      buffers,
      start,
    );
  }

  const extent =
    visual
      .bulgeRadiusNormalized *
    (
      spheroidal
        ? 1.24
        : dwarfLike
          ? 1.08
          : 1.0
    );

  const verticalAxis =
    spheroidal
      ? 0.62 +
        0.22 *
        visual
          .bulgeAxisRatio
      : 0.42 +
        0.18 *
        visual
          .bulgeAxisRatio;

  for (
    let index =
      0;
    index <
      CORE_PARTICLE_COUNT;
    index +=
      1
  ) {
    const radial =
      extent *
      Math.pow(
        sampler.sample01(
          index,
          1,
        ),
        spheroidal
          ? 2.15
          : 1.92,
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
          visual
            .bulgeAxisRatio,
        visual
          .orientationRadians,
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

    writeParticle(
      buffers,
      start +
        index,
      rotated.x,
      rotated.y,
      depth,
      0.88 +
        0.12 *
        brightness +
        0.06 *
        warmShift -
        0.06 *
        coolShift,
      (
        spheroidal
          ? 0.74
          : 0.77
      ) +
        0.13 *
        brightness +
        0.04 *
        coolShift,
      (
        spheroidal
          ? 0.60
          : 0.64
      ) +
        0.16 *
        brightness +
        0.16 *
        coolShift -
        0.08 *
        warmShift,
      (
        1.28 +
        1.62 *
        brightness
      ) *
        (
          rareBright
            ? 1.42
            : 1
        ),
      0.15 +
        0.28 *
        brightness +
        (
          rareBright
            ? 0.08
            : 0
        ),
    );
  }

  return start +
    CORE_PARTICLE_COUNT;
}

function writeIrregularCore(
  model:
    GalacticMapParticleRenderInput,

  sampler:
    DeterministicSampler,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const visual =
    requiredVisual(
      model,
    );

  const geometry =
    irregularPresentationGeometry(
      visual
        .bulgeAxisRatio,
      sampler,
    );

  const extent =
    0.44 +
    0.10 *
    sampler.sample01(
      0,
      410,
    );

  for (
    let index =
      0;
    index <
      CORE_PARTICLE_COUNT;
    index +=
      1
  ) {
    const angle =
      TWO_PI *
      sampler.sample01(
        index,
        411,
      );

    const radial =
      extent *
      Math.pow(
        sampler.sample01(
          index,
          412,
        ),
        0.88,
      );

    const distortion =
      irregularRadialDistortion(
        angle,
        geometry,
      );

    const localX =
      geometry.offsetX +
      Math.cos(
        angle,
      ) *
      radial *
      geometry.majorScale *
      distortion;

    const localY =
      geometry.offsetY +
      Math.sin(
        angle,
      ) *
      radial *
      geometry.minorScale *
      distortion +
      geometry.bendStrength *
      0.55 *
      Math.sin(
        angle -
        geometry.bendPhase,
      ) *
      radial;

    const rotated =
      rotate2d(
        localX,
        localY,
        visual
          .orientationRadians,
      );

    const centrality =
      1 -
      Math.min(
        1,
        radial /
          extent,
      );

    const rareBright =
      sampler.sample01(
        index,
        416,
      ) <
      0.0015;

    const temperature =
      sampler.sample01(
        index,
        417,
      );

    writeParticle(
      buffers,
      start +
        index,
      rotated.x,
      rotated.y,
      sampler.normal(
        index,
        414,
      ) *
        0.10 *
        (
          0.55 +
          0.45 *
          radial
        ),
      0.63 +
        0.10 *
        centrality +
        0.04 *
        temperature,
      0.68 +
        0.10 *
        centrality,
      0.76 +
        0.12 *
        centrality +
        0.05 *
        temperature,
      (
        0.62 +
        0.78 *
        sampler.sample01(
          index,
          418,
        )
      ) *
        (
          rareBright
            ? 1.62
            : 1
        ),
      0.080 +
        0.135 *
        centrality +
        (
          rareBright
            ? 0.08
            : 0
        ),
    );
  }

  return start +
    CORE_PARTICLE_COUNT;
}

function writeDwarfCore(
  model:
    GalacticMapParticleRenderInput,

  sampler:
    DeterministicSampler,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const visual =
    requiredVisual(
      model,
    );

  const geometry =
    dwarfPresentationGeometry(
      visual
        .bulgeAxisRatio,
      sampler,
    );

  const extent =
    0.46 +
    0.10 *
    sampler.sample01(
      0,
      348,
    );

  for (
    let index =
      0;
    index <
      CORE_PARTICLE_COUNT;
    index +=
      1
  ) {
    const direction =
      unitSphereDirection(
        sampler,
        index,
        12,
      );

    const radial =
      extent *
      Math.pow(
        sampler.sample01(
          index,
          15,
        ),
        0.92,
      );

    const lopsidedness =
      1 +
      0.10 *
      Math.cos(
        Math.atan2(
          direction.y,
          direction.x,
        ) -
        geometry.lopsidedPhase,
      );

    const localX =
      geometry.offsetX +
      direction.x *
      radial *
      geometry.elongation *
      lopsidedness;

    const localY =
      geometry.offsetY +
      direction.y *
      radial *
      geometry.axisRatio;

    const rotated =
      rotate2d(
        localX,
        localY,
        visual
          .orientationRadians,
      );

    const centrality =
      1 -
      Math.min(
        1,
        radial /
          extent,
      );

    const rareBright =
      sampler.sample01(
        index,
        18,
      ) <
      0.0025;

    const temperature =
      sampler.sample01(
        index,
        19,
      );

    const coolShift =
      temperature <
        0.18
        ? (
            0.18 -
            temperature
          ) /
          0.18
        : 0;

    const warmShift =
      temperature >
        0.86
        ? (
            temperature -
            0.86
          ) /
          0.14
        : 0;

    writeParticle(
      buffers,
      start +
        index,
      rotated.x,
      rotated.y,
      direction.z *
        radial *
        0.42,
      0.70 +
        0.12 *
        centrality +
        0.05 *
        warmShift -
        0.04 *
        coolShift,
      0.69 +
        0.11 *
        centrality +
        0.04 *
        coolShift,
      0.70 +
        0.10 *
        centrality +
        0.10 *
        coolShift -
        0.04 *
        warmShift,
      (
        0.58 +
        0.72 *
        sampler.sample01(
          index,
          17,
        )
      ) *
        (
          rareBright
            ? 1.55
            : 1
        ),
      0.075 +
        0.105 *
        centrality +
        (
          rareBright
            ? 0.08
            : 0
        ),
    );
  }

  return start +
    CORE_PARTICLE_COUNT;
}

function writeBody(
  model:
    GalacticMapParticleRenderInput,

  sampler:
    DeterministicSampler,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const morphology =
    model
      .morphologyHint;

  if (
    morphology ===
    ExternalGalaxyMorphologyHint
      .SPHEROIDAL
  ) {
    return writeSpheroidalBody(
      model,
      sampler,
      buffers,
      start,
    );
  }

  if (
    morphology ===
    ExternalGalaxyMorphologyHint
      .IRREGULAR
  ) {
    return writeIrregularBody(
      model,
      sampler,
      buffers,
      start,
    );
  }

  if (
    morphology ===
    ExternalGalaxyMorphologyHint
      .DWARF_LIKE
  ) {
    return writeDwarfBody(
      model,
      sampler,
      buffers,
      start,
    );
  }

  return writeDiskBody(
    model,
    sampler,
    buffers,
    start,
  );
}

function writeSpheroidalBody(
  model:
    GalacticMapParticleRenderInput,

  sampler:
    DeterministicSampler,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const visual =
    requiredVisual(
      model,
    );

  const verticalAxis =
    0.58 +
    0.23 *
    visual
      .bulgeAxisRatio;

  for (
    let index =
      0;
    index <
      BODY_PARTICLE_COUNT;
    index +=
      1
  ) {
    const component =
      sampler.sample01(
        index,
        20,
      );

    const radialSample =
      sampler.sample01(
        index,
        21,
      );

    const radius =
      component <
        0.44
        ? 0.90 *
          Math.pow(
            radialSample,
            1.68,
          )
        : component <
            0.92
          ? 0.24 +
            0.74 *
            Math.pow(
              radialSample,
              0.96,
            )
          : 0.78 +
            0.28 *
            Math.pow(
              radialSample,
              0.72,
            );

    const direction =
      unitSphereDirection(
        sampler,
        index,
        22,
      );

    const rotated =
      rotate2d(
        direction.x *
          radius,
        direction.y *
          radius *
          visual
            .bulgeAxisRatio,
        visual
          .orientationRadians,
      );

    const centrality =
      1 -
      Math.min(
        1,
        radius /
          1.08,
      );

    const rareBright =
      sampler.sample01(
        index,
        28,
      ) <
      0.010;

    const temperature =
      sampler.sample01(
        index,
        29,
      );

    const warmShift =
      temperature >
        0.82
        ? (
            temperature -
            0.82
          ) /
          0.18
        : 0;

    const coolShift =
      temperature <
        0.14
        ? (
            0.14 -
            temperature
          ) /
          0.14
        : 0;

    writeParticle(
      buffers,
      start +
        index,
      rotated.x,
      rotated.y,
      direction.z *
        radius *
        verticalAxis,
      0.75 +
        0.18 *
        centrality +
        0.06 *
        warmShift -
        0.05 *
        coolShift,
      0.66 +
        0.16 *
        centrality +
        0.04 *
        coolShift,
      0.58 +
        0.12 *
        centrality +
        0.18 *
        coolShift -
        0.08 *
        warmShift,
      (
        0.76 +
        1.00 *
        sampler.sample01(
          index,
          30,
        )
      ) *
        (
          rareBright
            ? 1.85
            : 1
        ),
      0.10 +
        0.22 *
        centrality +
        (
          rareBright
            ? 0.12
            : 0
        ),
    );
  }

  return start +
    BODY_PARTICLE_COUNT;
}

function writeDiskBody(
  model:
    GalacticMapParticleRenderInput,

  sampler:
    DeterministicSampler,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const visual =
    requiredVisual(
      model,
    );

  const averageCoherence =
    visual.arms.length ===
      0
      ? 0
      : visual.arms.reduce(
          (
            total,
            arm,
          ) =>
            total +
            arm.coherence,
          0,
        ) /
        visual.arms.length;

  const barred =
    isBarredSpiral(
      model,
    );

  const spiral =
    isSpiral(
      model,
    );

  const renderArms =
    spiralRenderArms(
      visual.arms,
      visual
        .windingDirection,
      visual
        .bulgeRadiusNormalized,
      visual.bar ===
        null
        ? null
        : visual.bar
            .angleRadians,
      visual.bar ===
        null
        ? null
        : visual.bar
            .halfLengthNormalized,
      visual.bar ===
        null
        ? null
        : visual.bar
            .widthNormalized,
      barred,
      spiral,
    );

  const armProbability =
    renderArms.length ===
      0
      ? 0
      : barred
        ? 0.48
        : spiral
          ? 0.42
          : 0.23 +
            0.14 *
            averageCoherence;

  const interArmProbability =
    renderArms.length ===
      0
      ? 0
      : barred
        ? 0.31
        : spiral
          ? 0.36
          : 0.42;

  for (
    let index =
      0;
    index <
      BODY_PARTICLE_COUNT;
    index +=
      1
  ) {
    const point =
      selectDiskPoint(
        renderArms,
        visual
          .windingDirection,
        visual
          .bulgeRadiusNormalized,
        sampler,
        index,
        armProbability,
        interArmProbability,
        barred,
        spiral,
      );

    const thickness =
      sampler.normal(
        index,
        46,
      ) *
      0.058 *
      (
        0.34 +
        0.66 *
        point.radius
      ) *
      (
        point.population ===
          'diffuse'
          ? 1.18
          : point.population ===
              'interarm'
            ? 0.92
            : 0.76
      );

    const rareBright =
      sampler.sample01(
        index,
        48,
      ) <
      (
        point.population ===
          'arm'
          ? 0.022
          : point.population ===
              'interarm'
            ? 0.014
            : 0.010
      );

    const armBoost =
      point.population ===
      'arm'
        ? 1
        : 0;

    const interArmBoost =
      point.population ===
      'interarm'
        ? 1
        : 0;

    const diffuseBoost =
      point.population ===
      'diffuse'
        ? 1
        : 0;

    const temperature =
      sampler.sample01(
        index,
        52,
      );

    const warmShift =
      temperature >
        0.82
        ? (
            temperature -
            0.82
          ) /
          0.18
        : 0;

    const coolShift =
      temperature <
        0.18
        ? (
            0.18 -
            temperature
          ) /
          0.18
        : 0;

    writeParticle(
      buffers,
      start +
        index,
      point.x,
      point.y,
      thickness,
      0.56 +
        0.16 *
        sampler.sample01(
          index,
          49,
        ) +
        0.05 *
        warmShift -
        0.04 *
        armBoost,
      0.69 +
        0.15 *
        sampler.sample01(
          index,
          50,
        ) +
        0.05 *
        interArmBoost,
      0.82 +
        0.08 *
        armBoost +
        0.05 *
        coolShift -
        0.04 *
        diffuseBoost,
      (
        0.74 +
        1.04 *
        sampler.sample01(
          index,
          51,
        )
      ) *
        (
          rareBright
            ? 2.15
            : 1
        ),
      0.08 +
        (
          barred
            ? 0.17
            : spiral
              ? 0.15
              : 0.12
        ) *
        armBoost +
        0.05 *
        interArmBoost +
        0.03 *
        diffuseBoost +
        (
          rareBright
            ? 0.18
            : 0
        ),
    );
  }

  return start +
    BODY_PARTICLE_COUNT;
}

function writeBarredSpiralArmReinforcement(
  model:
    GalacticMapParticleRenderInput,

  sampler:
    DeterministicSampler,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const visual =
    requiredVisual(
      model,
    );

  if (
    !isBarredSpiral(
      model,
    ) ||
    visual.arms.length ===
      0
  ) {
    return start;
  }

  const renderArms =
    spiralRenderArms(
      visual.arms,
      visual
        .windingDirection,
      visual
        .bulgeRadiusNormalized,
      visual.bar ===
        null
        ? null
        : visual.bar
            .angleRadians,
      visual.bar ===
        null
        ? null
        : visual.bar
            .halfLengthNormalized,
      visual.bar ===
        null
        ? null
        : visual.bar
            .widthNormalized,
      true,
      false,
    );

  for (
    let index =
      0;
    index <
      BARRED_SPIRAL_ARM_REINFORCEMENT_PARTICLE_COUNT;
    index +=
      1
  ) {
    const sampleIndex =
      BODY_PARTICLE_COUNT +
      index;

    const point =
      spiralDensityPoint(
        renderArms,
        visual
          .windingDirection,
        sampler,
        sampleIndex,
        0.78,
        BARRED_SPIRAL_ARM_RADIAL_DECAY_STRENGTH,
      );

    const thickness =
      sampler.normal(
        sampleIndex,
        180,
      ) *
      0.046 *
      (
        0.30 +
        0.70 *
        point.radius
      );

    const rareBright =
      sampler.sample01(
        sampleIndex,
        182,
      ) <
      0.018;

    const temperature =
      sampler.sample01(
        sampleIndex,
        183,
      );

    const coolShift =
      temperature <
        0.20
        ? (
            0.20 -
            temperature
          ) /
          0.20
        : 0;

    writeParticle(
      buffers,
      start +
        index,
      point.x,
      point.y,
      thickness,
      0.52 +
        0.15 *
        sampler.sample01(
          sampleIndex,
          184,
        ),
      0.70 +
        0.14 *
        sampler.sample01(
          sampleIndex,
          185,
        ),
      0.90 +
        0.08 *
        coolShift,
      (
        0.74 +
        1.04 *
        sampler.sample01(
          sampleIndex,
          186,
        )
      ) *
        (
          rareBright
            ? 2.05
            : 1
        ),
      0.18 +
        0.11 *
        sampler.sample01(
          sampleIndex,
          187,
        ) +
        (
          rareBright
            ? 0.16
            : 0
        ),
    );
  }

  return start +
    BARRED_SPIRAL_ARM_REINFORCEMENT_PARTICLE_COUNT;
}


function writeSpiralArmReinforcement(
  model:
    GalacticMapParticleRenderInput,

  sampler:
    DeterministicSampler,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const visual =
    requiredVisual(
      model,
    );

  if (
    !isSpiral(
      model,
    ) ||
    visual.arms.length ===
      0
  ) {
    return start;
  }

  const renderArms =
    spiralRenderArms(
      visual.arms,
      visual
        .windingDirection,
      visual
        .bulgeRadiusNormalized,
      null,
      null,
      null,
      false,
      true,
    );

  for (
    let index =
      0;
    index <
      SPIRAL_ARM_REINFORCEMENT_PARTICLE_COUNT;
    index +=
      1
  ) {
    const sampleIndex =
      BODY_PARTICLE_COUNT +
      BARRED_SPIRAL_ARM_REINFORCEMENT_PARTICLE_COUNT +
      index;

    const point =
      spiralDensityPoint(
        renderArms,
        visual
          .windingDirection,
        sampler,
        sampleIndex,
        0.86,
        SPIRAL_ARM_RADIAL_DECAY_STRENGTH,
      );

    const thickness =
      sampler.normal(
        sampleIndex,
        190,
      ) *
      0.050 *
      (
        0.32 +
        0.68 *
        point.radius
      );

    const rareBright =
      sampler.sample01(
        sampleIndex,
        192,
      ) <
      0.018;

    const temperature =
      sampler.sample01(
        sampleIndex,
        193,
      );

    const coolShift =
      temperature <
        0.20
        ? (
            0.20 -
            temperature
          ) /
          0.20
        : 0;

    writeParticle(
      buffers,
      start +
        index,
      point.x,
      point.y,
      thickness,
      0.53 +
        0.15 *
        sampler.sample01(
          sampleIndex,
          194,
        ),
      0.70 +
        0.14 *
        sampler.sample01(
          sampleIndex,
          195,
        ),
      0.90 +
        0.08 *
        coolShift,
      (
        0.74 +
        1.04 *
        sampler.sample01(
          sampleIndex,
          196,
        )
      ) *
        (
          rareBright
            ? 2.05
            : 1
        ),
      0.16 +
        0.10 *
        sampler.sample01(
          sampleIndex,
          197,
        ) +
        (
          rareBright
            ? 0.16
            : 0
        ),
    );
  }

  return start +
    SPIRAL_ARM_REINFORCEMENT_PARTICLE_COUNT;
}

function writeIrregularBody(
  model:
    GalacticMapParticleRenderInput,

  sampler:
    DeterministicSampler,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const visual =
    requiredVisual(
      model,
    );

  const geometry =
    irregularPresentationGeometry(
      visual
        .bulgeAxisRatio,
      sampler,
    );

  const regionCount =
    3;

  for (
    let index =
      0;
    index <
      BODY_PARTICLE_COUNT;
    index +=
      1
  ) {
    const mode =
      sampler.sample01(
        index,
        430,
      );

    let localX:
      number;

    let localY:
      number;

    let localZ:
      number;

    let radius:
      number;

    let starFormingRegion =
      false;

    let asymmetricExtension =
      false;

    if (
      mode <
      0.56
    ) {
      const angle =
        TWO_PI *
        sampler.sample01(
          index,
          431,
        );

      radius =
        0.05 +
        0.94 *
        Math.pow(
          sampler.sample01(
            index,
            432,
          ),
          0.94,
        );

      const distortion =
        irregularRadialDistortion(
          angle,
          geometry,
        );

      const granularScatter =
        0.026 +
        0.034 *
        sampler.sample01(
          index,
          433,
        );

      localX =
        geometry.offsetX +
        Math.cos(
          angle,
        ) *
        radius *
        geometry.majorScale *
        distortion +
        sampler.normal(
          index,
          434,
        ) *
        granularScatter;

      localY =
        geometry.offsetY +
        Math.sin(
          angle,
        ) *
        radius *
        geometry.minorScale *
        distortion +
        geometry.bendStrength *
        Math.sin(
          angle -
          geometry.bendPhase,
        ) *
        radius +
        sampler.normal(
          index,
          436,
        ) *
        granularScatter;

      localZ =
        sampler.normal(
          index,
          438,
        ) *
        0.16 *
        (
          0.40 +
          0.60 *
          radius
        );
    } else if (
      mode <
      0.80
    ) {
      const regionIndex =
        Math.min(
          regionCount -
            1,
          Math.floor(
            sampler.sample01(
              index,
              439,
            ) *
            regionCount,
          ),
        );

      const anchor =
        irregularRegionAnchor(
          geometry,
          sampler,
          regionIndex,
        );

      localX =
        anchor.x +
        sampler.normal(
          index,
          440,
        ) *
        anchor.spread *
        1.12;

      localY =
        anchor.y +
        sampler.normal(
          index,
          442,
        ) *
        anchor.spread;

      localZ =
        sampler.normal(
          index,
          444,
        ) *
        anchor.spread *
        0.80;

      radius =
        Math.hypot(
          localX -
          geometry.offsetX,
          localY -
          geometry.offsetY,
        );

      starFormingRegion =
        true;
    } else {
      const extension =
        irregularExtensionPoint(
          geometry,
          sampler,
          index,
          446,
        );

      localX =
        extension.x;

      localY =
        extension.y;

      localZ =
        extension.z;

      radius =
        extension.radius;

      asymmetricExtension =
        true;
    }

    const rotated =
      rotate2d(
        localX,
        localY,
        visual
          .orientationRadians,
      );

    const centrality =
      1 -
      Math.min(
        1,
        radius /
          1.25,
      );

    const rareBright =
      sampler.sample01(
        index,
        456,
      ) <
      (
        starFormingRegion
          ? 0.010
          : asymmetricExtension
            ? 0.003
            : 0.0035
      );

    const temperature =
      sampler.sample01(
        index,
        457,
      );

    const youngPopulation =
      starFormingRegion
        ? 1
        : 0;

    writeParticle(
      buffers,
      start +
        index,
      rotated.x,
      rotated.y,
      localZ,
      0.53 +
        0.11 *
        centrality +
        0.05 *
        temperature -
        0.035 *
        youngPopulation,
      0.63 +
        0.12 *
        centrality +
        0.055 *
        youngPopulation,
      0.76 +
        0.12 *
        youngPopulation +
        0.05 *
        temperature,
      (
        0.56 +
        0.78 *
        sampler.sample01(
          index,
          458,
        )
      ) *
        (
          rareBright
            ? 1.66
            : 1
        ),
      0.086 +
        0.072 *
        centrality +
        (
          starFormingRegion
            ? 0.082
            : asymmetricExtension
              ? -0.010
              : 0
        ) +
        (
          rareBright
            ? 0.08
            : 0
        ),
    );
  }

  return start +
    BODY_PARTICLE_COUNT;
}

function writeDwarfBody(
  model:
    GalacticMapParticleRenderInput,

  sampler:
    DeterministicSampler,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const visual =
    requiredVisual(
      model,
    );

  const geometry =
    dwarfPresentationGeometry(
      visual
        .bulgeAxisRatio,
      sampler,
    );

  const regionCount =
    4;

  for (
    let index =
      0;
    index <
      BODY_PARTICLE_COUNT;
    index +=
      1
  ) {
    const mode =
      sampler.sample01(
        index,
        80,
      );

    let x:
      number;

    let y:
      number;

    let z:
      number;

    let starFormingRegion =
      false;

    let peripheral =
      false;

    let radiusForBrightness =
      0;

    if (
      mode <
      0.82
    ) {
      const angle =
        TWO_PI *
        sampler.sample01(
          index,
          81,
        );

      const radialComponent =
        sampler.sample01(
          index,
          82,
        );

      const radialSample =
        sampler.sample01(
          index,
          83,
        );

      const radius =
        radialComponent <
          0.62
          ? 0.80 *
            Math.pow(
              radialSample,
              1.12,
            )
          : 0.30 +
            0.78 *
            Math.pow(
              radialSample,
              0.92,
            );

      const lopsidedness =
        1 +
        0.19 *
        Math.cos(
          angle -
          geometry.lopsidedPhase,
        ) +
        0.075 *
        Math.sin(
          2 *
          angle +
          geometry.lopsidedPhase,
        );

      const warpedRadius =
        radius *
        lopsidedness;

      const shear =
        0.10 *
        Math.sin(
          angle +
          geometry.lopsidedPhase,
        ) *
        radius;

      x =
        geometry.offsetX +
        Math.cos(
          angle,
        ) *
        warpedRadius *
        geometry.elongation;

      y =
        geometry.offsetY +
        Math.sin(
          angle,
        ) *
        warpedRadius *
        geometry.axisRatio +
        shear;

      z =
        sampler.normal(
          index,
          84,
        ) *
        0.15 *
        (
          0.42 +
          0.58 *
          radius
        );

      radiusForBrightness =
        radius;
    } else if (
      mode <
      0.96
    ) {
      const regionIndex =
        Math.min(
          regionCount -
            1,
          Math.floor(
            sampler.sample01(
              index,
              86,
            ) *
            regionCount,
          ),
        );

      const anchor =
        dwarfRegionAnchor(
          geometry,
          sampler,
          regionIndex,
        );

      x =
        anchor.x +
        sampler.normal(
          index,
          87,
        ) *
        anchor.spread;

      y =
        anchor.y +
        sampler.normal(
          index,
          89,
        ) *
        anchor.spread *
        0.92;

      z =
        sampler.normal(
          index,
          91,
        ) *
        anchor.spread *
        0.58;

      radiusForBrightness =
        Math.hypot(
          x -
            geometry.offsetX,
          y -
            geometry.offsetY,
        );

      starFormingRegion =
        true;
    } else {
      const angle =
        geometry.lopsidedPhase +
        sampler.normal(
          index,
          92,
        ) *
        0.92;

      const radius =
        0.72 +
        0.46 *
        Math.pow(
          sampler.sample01(
            index,
            94,
          ),
          0.82,
        );

      const tailStretch =
        1.12 +
        0.28 *
        sampler.sample01(
          index,
          95,
        );

      x =
        geometry.offsetX +
        Math.cos(
          angle,
        ) *
        radius *
        geometry.elongation *
        tailStretch +
        sampler.normal(
          index,
          96,
        ) *
        0.07;

      y =
        geometry.offsetY +
        Math.sin(
          angle,
        ) *
        radius *
        geometry.axisRatio +
        sampler.normal(
          index,
          98,
        ) *
        0.07;

      z =
        sampler.normal(
          index,
          100,
        ) *
        0.13;

      radiusForBrightness =
        radius;

      peripheral =
        true;
    }

    const rotated =
      rotate2d(
        x,
        y,
        visual
          .orientationRadians,
      );

    const centrality =
      1 -
      Math.min(
        1,
        radiusForBrightness /
          1.12,
      );

    const rareBright =
      sampler.sample01(
        index,
        102,
      ) <
      (
        starFormingRegion
          ? 0.018
          : peripheral
            ? 0.005
            : 0.008
      );

    const temperature =
      sampler.sample01(
        index,
        103,
      );

    const coolShift =
      starFormingRegion &&
      temperature <
        0.32
        ? (
            0.32 -
            temperature
          ) /
          0.32
        : 0;

    const warmShift =
      !starFormingRegion &&
      temperature >
        0.86
        ? (
            temperature -
            0.86
          ) /
          0.14
        : 0;

    writeParticle(
      buffers,
      start +
        index,
      rotated.x,
      rotated.y,
      z,
      0.63 +
        0.10 *
        sampler.sample01(
          index,
          104,
        ) +
        0.05 *
        warmShift -
        0.05 *
        coolShift,
      0.69 +
        0.11 *
        sampler.sample01(
          index,
          105,
        ) +
        0.04 *
        coolShift,
      0.75 +
        0.10 *
        sampler.sample01(
          index,
          106,
        ) +
        0.12 *
        coolShift -
        0.04 *
        warmShift,
      (
        0.62 +
        0.88 *
        sampler.sample01(
          index,
          107,
        )
      ) *
        (
          rareBright
            ? 1.85
            : 1
        ),
      0.105 +
        0.055 *
        centrality +
        (
          starFormingRegion
            ? 0.055
            : peripheral
              ? -0.020
              : 0
        ) +
        (
          rareBright
            ? 0.12
            : 0
        ),
    );
  }

  return start +
    BODY_PARTICLE_COUNT;
}

function writeIrregularStellarBodyReinforcement(
  model:
    GalacticMapParticleRenderInput,

  sampler:
    DeterministicSampler,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const visual =
    requiredVisual(
      model,
    );

  const geometry =
    irregularPresentationGeometry(
      visual
        .bulgeAxisRatio,
      sampler,
    );

  const regionCount =
    3;

  for (
    let index =
      0;
    index <
      IRREGULAR_STELLAR_BODY_REINFORCEMENT_PARTICLE_COUNT;
    index +=
      1
  ) {
    const mode =
      sampler.sample01(
        index,
        470,
      );

    let localX:
      number;

    let localY:
      number;

    let localZ:
      number;

    let radius:
      number;

    let starFormingRegion =
      false;

    let asymmetricExtension =
      false;

    if (
      mode <
      0.65
    ) {
      const angle =
        TWO_PI *
        sampler.sample01(
          index,
          471,
        );

      radius =
        0.04 +
        0.98 *
        Math.pow(
          sampler.sample01(
            index,
            472,
          ),
          0.98,
        );

      const distortion =
        irregularRadialDistortion(
          angle,
          geometry,
        );

      const granularScatter =
        0.020 +
        0.036 *
        sampler.sample01(
          index,
          473,
        );

      localX =
        geometry.offsetX +
        Math.cos(
          angle,
        ) *
        radius *
        geometry.majorScale *
        distortion +
        sampler.normal(
          index,
          474,
        ) *
        granularScatter;

      localY =
        geometry.offsetY +
        Math.sin(
          angle,
        ) *
        radius *
        geometry.minorScale *
        distortion +
        geometry.bendStrength *
        Math.sin(
          angle -
          geometry.bendPhase,
        ) *
        radius +
        sampler.normal(
          index,
          476,
        ) *
        granularScatter;

      localZ =
        sampler.normal(
          index,
          478,
        ) *
        0.14 *
        (
          0.42 +
          0.58 *
          radius
        );
    } else if (
      mode <
      0.90
    ) {
      const regionIndex =
        Math.min(
          regionCount -
            1,
          Math.floor(
            sampler.sample01(
              index,
              480,
            ) *
            regionCount,
          ),
        );

      const anchor =
        irregularRegionAnchor(
          geometry,
          sampler,
          regionIndex,
        );

      localX =
        anchor.x +
        sampler.normal(
          index,
          481,
        ) *
        anchor.spread *
        1.16;

      localY =
        anchor.y +
        sampler.normal(
          index,
          483,
        ) *
        anchor.spread *
        1.04;

      localZ =
        sampler.normal(
          index,
          485,
        ) *
        anchor.spread *
        0.74;

      radius =
        Math.hypot(
          localX -
          geometry.offsetX,
          localY -
          geometry.offsetY,
        );

      starFormingRegion =
        true;
    } else {
      const extension =
        irregularExtensionPoint(
          geometry,
          sampler,
          index,
          500,
        );

      localX =
        extension.x;

      localY =
        extension.y;

      localZ =
        extension.z;

      radius =
        extension.radius;

      asymmetricExtension =
        true;
    }

    const rotated =
      rotate2d(
        localX,
        localY,
        visual
          .orientationRadians,
      );

    const centrality =
      1 -
      Math.min(
        1,
        radius /
          1.22,
      );

    const patchiness =
      sampler.sample01(
        index,
        487,
      );

    const rareBright =
      sampler.sample01(
        index,
        488,
      ) <
      (
        starFormingRegion
          ? 0.0075
          : asymmetricExtension
            ? 0.0022
            : 0.0025
      );

    writeParticle(
      buffers,
      start +
        index,
      rotated.x,
      rotated.y,
      localZ,
      0.53 +
        0.10 *
        patchiness +
        0.045 *
        centrality,
      0.63 +
        0.10 *
        patchiness +
        (
          starFormingRegion
            ? 0.055
            : 0
        ),
      0.75 +
        0.11 *
        patchiness +
        (
          starFormingRegion
            ? 0.095
            : 0
        ),
      (
        0.52 +
        0.70 *
        sampler.sample01(
          index,
          489,
        )
      ) *
        (
          rareBright
            ? 1.54
            : 1
        ),
      0.100 +
        0.068 *
        centrality +
        0.024 *
        patchiness +
        (
          starFormingRegion
            ? 0.070
            : asymmetricExtension
              ? -0.008
              : 0
        ) +
        (
          rareBright
            ? 0.065
            : 0
        ),
    );
  }

  return start +
    IRREGULAR_STELLAR_BODY_REINFORCEMENT_PARTICLE_COUNT;
}

function writeDwarfStellarBodyReinforcement(
  model:
    GalacticMapParticleRenderInput,

  sampler:
    DeterministicSampler,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const visual =
    requiredVisual(
      model,
    );

  const geometry =
    dwarfPresentationGeometry(
      visual
        .bulgeAxisRatio,
      sampler,
    );

  for (
    let index =
      0;
    index <
      DWARF_STELLAR_BODY_REINFORCEMENT_PARTICLE_COUNT;
    index +=
      1
  ) {
    const angle =
      TWO_PI *
      sampler.sample01(
        index,
        360,
      );

    const component =
      sampler.sample01(
        index,
        361,
      );

    const radialSample =
      sampler.sample01(
        index,
        362,
      );

    const radius =
      component <
        0.68
        ? 0.78 *
          Math.pow(
            radialSample,
            1.04,
          )
        : 0.28 +
          0.76 *
          Math.pow(
            radialSample,
            0.90,
          );

    const lopsidedness =
      1 +
      0.17 *
      Math.cos(
        angle -
        geometry.lopsidedPhase,
      ) +
      0.06 *
      Math.sin(
        3 *
        angle -
        geometry.lopsidedPhase,
      );

    const localX =
      geometry.offsetX +
      Math.cos(
        angle,
      ) *
      radius *
      geometry.elongation *
      lopsidedness;

    const localY =
      geometry.offsetY +
      Math.sin(
        angle,
      ) *
      radius *
      geometry.axisRatio +
      0.07 *
      Math.sin(
        angle +
        geometry.lopsidedPhase,
      ) *
      radius;

    const rotated =
      rotate2d(
        localX,
        localY,
        visual
          .orientationRadians,
      );

    const centrality =
      1 -
      Math.min(
        1,
        radius /
          1.08,
      );

    const patchiness =
      sampler.sample01(
        index,
        367,
      );

    const rareBright =
      sampler.sample01(
        index,
        368,
      ) <
      0.004;

    writeParticle(
      buffers,
      start +
        index,
      rotated.x,
      rotated.y,
      sampler.normal(
        index,
        365,
      ) *
        0.12 *
        (
          0.48 +
          0.52 *
          radius
        ),
      0.60 +
        0.10 *
        patchiness,
      0.67 +
        0.11 *
        patchiness,
      0.75 +
        0.12 *
        patchiness,
      (
        0.54 +
        0.72 *
        sampler.sample01(
          index,
          369,
        )
      ) *
        (
          rareBright
            ? 1.65
            : 1
        ),
      0.095 +
        0.095 *
        centrality +
        0.030 *
        patchiness +
        (
          rareBright
            ? 0.08
            : 0
        ),
    );
  }

  return start +
    DWARF_STELLAR_BODY_REINFORCEMENT_PARTICLE_COUNT;
}

function writeDwarfEnvelope(
  model:
    GalacticMapParticleRenderInput,

  sampler:
    DeterministicSampler,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const visual =
    requiredVisual(
      model,
    );

  const geometry =
    dwarfPresentationGeometry(
      visual
        .bulgeAxisRatio,
      sampler,
    );

  for (
    let index =
      0;
    index <
      HALO_PARTICLE_COUNT;
    index +=
      1
  ) {
    const angle =
      TWO_PI *
      sampler.sample01(
        index,
        380,
      );

    const radius =
      0.62 +
      0.58 *
      Math.pow(
        sampler.sample01(
          index,
          381,
        ),
        1.08,
      );

    const lopsidedness =
      1 +
      0.20 *
      Math.cos(
        angle -
        geometry.lopsidedPhase,
      );

    const localX =
      geometry.offsetX +
      Math.cos(
        angle,
      ) *
      radius *
      geometry.elongation *
      lopsidedness;

    const localY =
      geometry.offsetY +
      Math.sin(
        angle,
      ) *
      radius *
      geometry.axisRatio;

    const rotated =
      rotate2d(
        localX,
        localY,
        visual
          .orientationRadians,
      );

    const rareBright =
      sampler.sample01(
        index,
        384,
      ) <
      0.003;

    writeParticle(
      buffers,
      start +
        index,
      rotated.x,
      rotated.y,
      sampler.normal(
        index,
        382,
      ) *
        0.16,
      0.45 +
        0.12 *
        sampler.sample01(
          index,
          385,
        ),
      0.54 +
        0.14 *
        sampler.sample01(
          index,
          386,
        ),
      0.75 +
        0.17 *
        sampler.sample01(
          index,
          387,
        ),
      (
        0.50 +
        0.58 *
        sampler.sample01(
          index,
          388,
        )
      ) *
        (
          rareBright
            ? 1.80
            : 1
        ),
      0.032 +
        0.060 *
        sampler.sample01(
          index,
          389,
        ) +
        (
          rareBright
            ? 0.10
            : 0
        ),
    );
  }

  return start +
    HALO_PARTICLE_COUNT;
}

interface IrregularPresentationGeometry {
  readonly offsetX:
    number;

  readonly offsetY:
    number;

  readonly majorScale:
    number;

  readonly minorScale:
    number;

  readonly lopsidedPhase:
    number;

  readonly bendPhase:
    number;

  readonly bendStrength:
    number;

  readonly primaryExtensionPhase:
    number;

  readonly secondaryExtensionPhase:
    number;

  readonly secondaryExtensionWeight:
    number;
}

interface IrregularExtensionPoint {
  readonly x:
    number;

  readonly y:
    number;

  readonly z:
    number;

  readonly radius:
    number;
}

function irregularPresentationGeometry(
  bulgeAxisRatio:
    number,

  sampler:
    DeterministicSampler,
): IrregularPresentationGeometry {

  const lopsidedPhase =
    TWO_PI *
    sampler.sample01(
      0,
      400,
    );

  const bendPhase =
    TWO_PI *
    sampler.sample01(
      0,
      401,
    );

  const primaryExtensionPhase =
    lopsidedPhase +
    (
      sampler.sample01(
        0,
        408,
      ) -
      0.5
    ) *
    0.72;

  const hasSecondaryExtension =
    sampler.sample01(
      0,
      409,
    ) >
    0.42;

  return Object.freeze({
    offsetX:
      sampler.normal(
        0,
        402,
      ) *
      0.12,

    offsetY:
      sampler.normal(
        0,
        404,
      ) *
      0.12,

    majorScale:
      1.18 +
      0.20 *
      sampler.sample01(
        0,
        406,
      ),

    minorScale:
      clamp(
        bulgeAxisRatio *
          0.78,
        0.42,
        0.64,
      ),

    lopsidedPhase,

    bendPhase,

    bendStrength:
      0.12 +
      0.12 *
      sampler.sample01(
        0,
        407,
      ),

    primaryExtensionPhase,

    secondaryExtensionPhase:
      primaryExtensionPhase +
      Math.PI *
      (
        0.62 +
        0.20 *
        sampler.sample01(
          0,
          410,
        )
      ),

    secondaryExtensionWeight:
      hasSecondaryExtension
        ? 0.34 +
          0.16 *
          sampler.sample01(
            0,
            411,
          )
        : 0,
  });
}

function irregularRadialDistortion(
  angle:
    number,

  geometry:
    IrregularPresentationGeometry,
): number {

  return Math.max(
    0.60,
    1 +
      0.28 *
      Math.cos(
        angle -
        geometry.lopsidedPhase,
      ) +
      0.13 *
      Math.sin(
        2 *
        angle -
        geometry.bendPhase,
      ) +
      0.08 *
      Math.cos(
        3 *
        angle +
        geometry.lopsidedPhase,
      ),
  );
}

function irregularRegionAnchor(
  geometry:
    IrregularPresentationGeometry,

  sampler:
    DeterministicSampler,

  regionIndex:
    number,
): ClusterAnchor {

  const regionPhaseOffsets = [
    0.22,
    2.18,
    4.36,
  ] as const;

  const normalizedRegionIndex =
    Math.min(
      regionPhaseOffsets.length -
        1,
      Math.max(
        0,
        regionIndex,
      ),
    );

  const radius =
    0.22 +
    0.36 *
    Math.pow(
      sampler.sample01(
        normalizedRegionIndex,
        420,
      ),
      0.92,
    );

  const angle =
    geometry.lopsidedPhase +
    regionPhaseOffsets[
      normalizedRegionIndex
    ] +
    sampler.normal(
      normalizedRegionIndex,
      422,
    ) *
    0.34;

  const distortion =
    irregularRadialDistortion(
      angle,
      geometry,
    );

  const spread =
    0.19 +
    0.10 *
    sampler.sample01(
      normalizedRegionIndex,
      424,
    );

  return Object.freeze({
    x:
      geometry.offsetX +
      Math.cos(
        angle,
      ) *
      radius *
      geometry.majorScale *
      distortion,

    y:
      geometry.offsetY +
      Math.sin(
        angle,
      ) *
      radius *
      geometry.minorScale *
      distortion +
      geometry.bendStrength *
      0.48 *
      Math.sin(
        angle -
        geometry.bendPhase,
      ) *
      radius,

    spread,

    knot:
      true,
  });
}

function irregularExtensionPoint(
  geometry:
    IrregularPresentationGeometry,

  sampler:
    DeterministicSampler,

  index:
    number,

  channel:
    number,
): IrregularExtensionPoint {

  const useSecondary =
    geometry.secondaryExtensionWeight >
      0 &&
    sampler.sample01(
      index,
      channel,
    ) <
      geometry.secondaryExtensionWeight;

  const phase =
    useSecondary
      ? geometry.secondaryExtensionPhase
      : geometry.primaryExtensionPhase;

  const progression =
    Math.pow(
      sampler.sample01(
        index,
        channel +
          1,
      ),
      0.72,
    );

  const radius =
    0.24 +
    0.98 *
    progression;

  const angularWidth =
    (
      useSecondary
        ? 0.22
        : 0.28
    ) *
    (
      0.70 +
      0.55 *
      progression
    );

  const angle =
    phase +
    sampler.normal(
      index,
      channel +
        3,
    ) *
    angularWidth;

  const lateralScatter =
    0.045 +
    0.095 *
    progression;

  const extensionScale =
    useSecondary
      ? 1.04
      : 1.14;

  const localX =
    geometry.offsetX +
    Math.cos(
      angle,
    ) *
    radius *
    geometry.majorScale *
    extensionScale +
    sampler.normal(
      index,
      channel +
        5,
    ) *
    lateralScatter;

  const localY =
    geometry.offsetY +
    Math.sin(
      angle,
    ) *
    radius *
    geometry.minorScale *
    extensionScale +
    geometry.bendStrength *
    Math.sin(
      angle -
      geometry.bendPhase,
    ) *
    radius +
    sampler.normal(
      index,
      channel +
        7,
    ) *
    lateralScatter;

  return Object.freeze({
    x:
      localX,

    y:
      localY,

    z:
      sampler.normal(
        index,
        channel +
          9,
      ) *
      0.15 *
      (
        0.62 +
        0.38 *
        progression
      ),

    radius:
      Math.hypot(
        localX -
        geometry.offsetX,
        localY -
        geometry.offsetY,
      ),
  });
}

function writeIrregularEnvelope(
  model:
    GalacticMapParticleRenderInput,

  sampler:
    DeterministicSampler,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const visual =
    requiredVisual(
      model,
    );

  const geometry =
    irregularPresentationGeometry(
      visual
        .bulgeAxisRatio,
      sampler,
    );

  for (
    let index =
      0;
    index <
      HALO_PARTICLE_COUNT;
    index +=
      1
  ) {
    const extensionEnvelope =
      sampler.sample01(
        index,
        490,
      ) <
      0.24;

    let localX:
      number;

    let localY:
      number;

    let localZ:
      number;

    if (
      extensionEnvelope
    ) {
      const extension =
        irregularExtensionPoint(
          geometry,
          sampler,
          index,
          510,
        );

      const outwardScale =
        1.04 +
        0.10 *
        sampler.sample01(
          index,
          512,
        );

      localX =
        geometry.offsetX +
        (
          extension.x -
          geometry.offsetX
        ) *
        outwardScale;

      localY =
        geometry.offsetY +
        (
          extension.y -
          geometry.offsetY
        ) *
        outwardScale;

      localZ =
        extension.z *
        1.08;
    } else {
      const angle =
        TWO_PI *
        sampler.sample01(
          index,
          491,
        );

      const radius =
        0.76 +
        0.38 *
        Math.pow(
          sampler.sample01(
            index,
            492,
          ),
          1.04,
        );

      const distortion =
        irregularRadialDistortion(
          angle,
          geometry,
        );

      localX =
        geometry.offsetX +
        Math.cos(
          angle,
        ) *
        radius *
        geometry.majorScale *
        distortion;

      localY =
        geometry.offsetY +
        Math.sin(
          angle,
        ) *
        radius *
        geometry.minorScale *
        distortion +
        geometry.bendStrength *
        Math.sin(
          angle -
          geometry.bendPhase,
        ) *
        radius;

      localZ =
        sampler.normal(
          index,
          494,
        ) *
        0.18 *
        radius;
    }

    const rotated =
      rotate2d(
        localX,
        localY,
        visual
          .orientationRadians,
      );

    const rareBright =
      sampler.sample01(
        index,
        496,
      ) <
      0.004;

    writeParticle(
      buffers,
      start +
        index,
      rotated.x,
      rotated.y,
      localZ,
      0.40 +
        0.14 *
        sampler.sample01(
          index,
          497,
        ),
      0.50 +
        0.16 *
        sampler.sample01(
          index,
          498,
        ),
      0.72 +
        0.16 *
        sampler.sample01(
          index,
          499,
        ),
      (
        0.54 +
        0.62 *
        sampler.sample01(
          index,
          501,
        )
      ) *
        (
          rareBright
            ? 1.82
            : 1
        ),
      0.028 +
        0.060 *
        sampler.sample01(
          index,
          502,
        ) +
        (
          extensionEnvelope
            ? 0.016
            : 0
        ) +
        (
          rareBright
            ? 0.10
            : 0
        ),
    );
  }

  return start +
    HALO_PARTICLE_COUNT;
}

interface DwarfPresentationGeometry {
  readonly offsetX:
    number;

  readonly offsetY:
    number;

  readonly elongation:
    number;

  readonly axisRatio:
    number;

  readonly lopsidedPhase:
    number;
}

function dwarfPresentationGeometry(
  bulgeAxisRatio:
    number,

  sampler:
    DeterministicSampler,
): DwarfPresentationGeometry {

  return Object.freeze({
    offsetX:
      sampler.normal(
        0,
        340,
      ) *
      0.06,

    offsetY:
      sampler.normal(
        0,
        342,
      ) *
      0.06,

    elongation:
      1.24 +
      0.22 *
      sampler.sample01(
        0,
        344,
      ),

    axisRatio:
      clamp(
        bulgeAxisRatio *
          0.90,
        0.58,
        0.78,
      ),

    lopsidedPhase:
      TWO_PI *
      sampler.sample01(
        0,
        346,
      ),
  });
}

function dwarfRegionAnchor(
  geometry:
    DwarfPresentationGeometry,

  sampler:
    DeterministicSampler,

  regionIndex:
    number,
): ClusterAnchor {

  const radius =
    0.08 +
    0.46 *
    Math.pow(
      sampler.sample01(
        regionIndex,
        330,
      ),
      1.12,
    );

  const angle =
    TWO_PI *
      sampler.sample01(
        regionIndex,
        331,
      ) +
    sampler.normal(
      regionIndex,
      332,
    ) *
      0.40;

  const spread =
    0.15 +
    0.10 *
    sampler.sample01(
      regionIndex,
      333,
    );

  const localOffset =
    0.84 +
    0.20 *
    sampler.sample01(
      regionIndex,
      334,
    );

  return Object.freeze({
    x:
      geometry.offsetX +
      Math.cos(
        angle,
      ) *
      radius *
      geometry.elongation *
      localOffset,

    y:
      geometry.offsetY +
      Math.sin(
        angle,
      ) *
      radius *
      geometry.axisRatio,

    spread,

    knot:
      true,
  });
}


function writeHalo(
  model:
    GalacticMapParticleRenderInput,

  sampler:
    DeterministicSampler,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  if (
    isIrregular(
      model,
    )
  ) {
    return writeIrregularEnvelope(
      model,
      sampler,
      buffers,
      start,
    );
  }

  if (
    isDwarf(
      model,
    )
  ) {
    return writeDwarfEnvelope(
      model,
      sampler,
      buffers,
      start,
    );
  }

  const visual =
    requiredVisual(
      model,
    );

  const morphology =
    model
      .morphologyHint;

  const innerRadius =
    morphology ===
    ExternalGalaxyMorphologyHint
      .SPHEROIDAL
      ? 0.78
      : morphology ===
          ExternalGalaxyMorphologyHint
            .DWARF_LIKE
        ? 0.64
        : 0.84;

  const outerRadius =
    visual
      .regions
      .haloOuterRadiusNormalized *
    (
      morphology ===
      ExternalGalaxyMorphologyHint
        .SPHEROIDAL
        ? 1.05
        : 1
    );

  for (
    let index =
      0;
    index <
      HALO_PARTICLE_COUNT;
    index +=
      1
  ) {
    const t =
      Math.pow(
        sampler.sample01(
          index,
          100,
        ),
        Math.max(
          1.18,
          visual
            .haloFalloffExponent *
            0.66,
        ),
      );

    const radius =
      innerRadius +
      (
        outerRadius -
        innerRadius
      ) *
      t;

    const direction =
      unitSphereDirection(
        sampler,
        index,
        101,
      );

    const rareBright =
      sampler.sample01(
        index,
        104,
      ) <
      0.006;

    writeParticle(
      buffers,
      start +
        index,
      direction.x *
        radius,
      direction.y *
        radius *
        0.94,
      direction.z *
        radius *
        0.88,
      0.42 +
        0.16 *
        sampler.sample01(
          index,
          105,
        ),
      0.53 +
        0.18 *
        sampler.sample01(
          index,
          106,
        ),
      0.78 +
        0.18 *
        sampler.sample01(
          index,
          107,
        ),
      (
        0.60 +
        0.64 *
        sampler.sample01(
          index,
          108,
        )
      ) *
        (
          rareBright
            ? 2.10
            : 1
        ),
      0.030 +
        0.070 *
        sampler.sample01(
          index,
          109,
        ) +
        (
          rareBright
            ? 0.14
            : 0
        ),
    );
  }

  return start +
    HALO_PARTICLE_COUNT;
}

function writeBar(
  model:
    GalacticMapParticleRenderInput,

  sampler:
    DeterministicSampler,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const visual =
    requiredVisual(
      model,
    );

  const bar =
    visual.bar;

  if (
    bar ===
    null
  ) {
    return start;
  }

  const barredSpiral =
    isBarredSpiral(
      model,
    );

  const renderArms =
    barredSpiral &&
    visual.arms.length >
      0
      ? spiralRenderArms(
          visual.arms,
          visual
            .windingDirection,
          visual
            .bulgeRadiusNormalized,
          bar
            .angleRadians,
          bar
            .halfLengthNormalized,
          bar
            .widthNormalized,
          true,
          false,
        )
      : visual.arms;

  /*
   * The bar and the barred-spiral arms are one continuous stellar structure.
   * The middle of the bar stays straight, but its outer sections now bend
   * progressively into the real tangent of the corresponding arm root.
   *
   * No connector population is added: these are still the same 8k bar
   * samples. Their centerline simply changes from straight bar -> curved
   * transition -> arm root, which removes the ruler-straight appearance while
   * preserving the physical bar and the existing arm geometry.
   */
  const armRootRadius =
    renderArms.length ===
      0
      ? bar
          .halfLengthNormalized
      : Math.max(
          ...renderArms.map(
            arm =>
              arm
                .radialStartNormalized,
          ),
        );

  const visibleHalfLength =
    Math.max(
      bar
        .halfLengthNormalized,
      armRootRadius,
    );

  for (
    let index =
      0;
    index <
      BAR_PARTICLE_COUNT;
    index +=
      1
  ) {
    const reinforceEnd =
      barredSpiral &&
      sampler.sample01(
        index,
        128,
      ) <
        0.44;

    let along:
      number;

    if (
      reinforceEnd
    ) {
      const sign =
        sampler.sample01(
          index,
          129,
        ) <
          0.5
          ? -1
          : 1;

      const endProgress =
        Math.pow(
          sampler.sample01(
            index,
            130,
          ),
          0.72,
        );

      along =
        sign *
        visibleHalfLength *
        (
          0.48 +
          0.52 *
          endProgress
        );
    } else {
      along =
        sampler.normal(
          index,
          120,
        ) *
        visibleHalfLength *
        0.62;
    }

    const clampedAlong =
      clamp(
        along,
        -visibleHalfLength,
        visibleHalfLength,
      );

    const alongFraction =
      Math.min(
        1,
        Math.abs(
          clampedAlong,
        ) /
          Math.max(
            EPSILON,
            visibleHalfLength,
          ),
      );

    const centerline =
      barredSpiral &&
      renderArms.length >
        0
        ? curvedBarCenterlineSample(
            Math.abs(
              clampedAlong,
            ),
            clampedAlong <
              0
              ? -1
              : 1,
            bar
              .angleRadians,
            visibleHalfLength,
            renderArms,
            visual
              .windingDirection,
          )
        : straightBarCenterlineSample(
            Math.abs(
              clampedAlong,
            ),
            clampedAlong <
              0
              ? -1
              : 1,
            bar
              .angleRadians,
          );

    /*
     * Keep a broad central bar, then let the transition breathe slightly as
     * it bends into the arm. This avoids a thin bright tube and creates a
     * natural overlap between the outer bar and the arm-root overdensity.
     */
    const acrossEnvelope =
      0.82 -
      0.22 *
      Math.pow(
        alongFraction,
        1.35,
      );

    const transitionWidthFactor =
      1 +
      BARRED_SPIRAL_BAR_TRANSITION_WIDTH_BOOST *
      Math.sin(
        Math.PI *
        centerline
          .transitionProgress,
      );

    const across =
      sampler.normal(
        index,
        122,
      ) *
      bar
        .widthNormalized *
      acrossEnvelope *
      transitionWidthFactor;

    const tangentialJitter =
      sampler.normal(
        index,
        131,
      ) *
      bar
        .widthNormalized *
      0.10 *
      centerline
        .transitionProgress;

    const x =
      centerline.x +
      centerline.normalX *
        across +
      centerline.tangentX *
        tangentialJitter;

    const y =
      centerline.y +
      centerline.normalY *
        across +
      centerline.tangentY *
        tangentialJitter;

    const rareBright =
      sampler.sample01(
        index,
        124,
      ) <
      0.018;

    const transitionBrightness =
      1 -
      0.10 *
      centerline
        .transitionProgress;

    writeParticle(
      buffers,
      start +
        index,
      x,
      y,
      sampler.normal(
        index,
        125,
      ) *
        bar
          .widthNormalized *
        0.58 *
        (
          0.72 +
          0.28 *
          (
            1 -
            alongFraction
          )
        ),
      0.90,
      0.76,
      0.54,
      (
        1.02 +
        1.30 *
        sampler.sample01(
          index,
          127,
        )
      ) *
        transitionBrightness *
        (
          rareBright
            ? 1.85
            : 1
        ),
      (
        0.16 +
        0.18 *
        bar.strength +
        (
          reinforceEnd
            ? 0.025
            : 0
        ) +
        (
          rareBright
            ? 0.14
            : 0
        )
      ) *
        transitionBrightness,
    );
  }

  return start +
    BAR_PARTICLE_COUNT;
}

interface BarCenterlineSample {
  readonly x:
    number;

  readonly y:
    number;

  readonly tangentX:
    number;

  readonly tangentY:
    number;

  readonly normalX:
    number;

  readonly normalY:
    number;

  readonly transitionProgress:
    number;
}

function straightBarCenterlineSample(
  radius:
    number,

  sign:
    -1 | 1,

  barAngleRadians:
    number,
): BarCenterlineSample {

  const angle =
    barAngleRadians +
    (
      sign <
        0
        ? Math.PI
        : 0
    );

  const tangentX =
    Math.cos(
      angle,
    );

  const tangentY =
    Math.sin(
      angle,
    );

  return {
    x:
      radius *
      tangentX,

    y:
      radius *
      tangentY,

    tangentX,
    tangentY,

    normalX:
      -tangentY,

    normalY:
      tangentX,

    transitionProgress:
      0,
  };
}

function curvedBarCenterlineSample(
  radius:
    number,

  sign:
    -1 | 1,

  barAngleRadians:
    number,

  visibleHalfLength:
    number,

  arms:
    readonly GalaxyVisualArm[],

  windingDirection:
    typeof GalaxyWindingDirection[
      keyof typeof GalaxyWindingDirection
    ],
): BarCenterlineSample {

  const endpointAngle =
    barAngleRadians +
    (
      sign <
        0
        ? Math.PI
        : 0
    );

  const arm =
    nearestArmAtAngle(
      arms,
      endpointAngle,
    );

  if (
    arm ===
    null
  ) {
    return straightBarCenterlineSample(
      radius,
      sign,
      barAngleRadians,
    );
  }

  const rootRadius =
    Math.max(
      0.02,
      Math.min(
        visibleHalfLength,
        arm
          .radialStartNormalized,
      ),
    );

  const transitionStartRadius =
    rootRadius *
    BARRED_SPIRAL_BAR_CURVE_START_FACTOR;

  if (
    radius <=
      transitionStartRadius +
      EPSILON
  ) {
    return straightBarCenterlineSample(
      radius,
      sign,
      barAngleRadians,
    );
  }

  const segmentLength =
    Math.max(
      EPSILON,
      rootRadius -
        transitionStartRadius,
    );

  const progress =
    clamp01(
      (
        Math.min(
          radius,
          rootRadius,
        ) -
        transitionStartRadius
      ) /
      segmentLength,
    );

  const radialX =
    Math.cos(
      endpointAngle,
    );

  const radialY =
    Math.sin(
      endpointAngle,
    );

  const startX =
    transitionStartRadius *
    radialX;

  const startY =
    transitionStartRadius *
    radialY;

  const endX =
    rootRadius *
    radialX;

  const endY =
    rootRadius *
    radialY;

  const armTangent =
    logarithmicArmTangentAtRadius(
      arm,
      windingDirection,
      rootRadius,
    );

  const startTangentScale =
    segmentLength *
    1.05;

  const endTangentScale =
    segmentLength *
    BARRED_SPIRAL_BAR_END_TANGENT_SCALE;

  const startTangentX =
    radialX *
    startTangentScale;

  const startTangentY =
    radialY *
    startTangentScale;

  const endTangentX =
    armTangent.x *
    endTangentScale;

  const endTangentY =
    armTangent.y *
    endTangentScale;

  const u =
    progress;

  const u2 =
    u *
    u;

  const u3 =
    u2 *
    u;

  const h00 =
    2 *
    u3 -
    3 *
    u2 +
    1;

  const h10 =
    u3 -
    2 *
    u2 +
    u;

  const h01 =
    -2 *
    u3 +
    3 *
    u2;

  const h11 =
    u3 -
    u2;

  const x =
    h00 *
      startX +
    h10 *
      startTangentX +
    h01 *
      endX +
    h11 *
      endTangentX;

  const y =
    h00 *
      startY +
    h10 *
      startTangentY +
    h01 *
      endY +
    h11 *
      endTangentY;

  const dh00 =
    6 *
    u2 -
    6 *
    u;

  const dh10 =
    3 *
    u2 -
    4 *
    u +
    1;

  const dh01 =
    -6 *
    u2 +
    6 *
    u;

  const dh11 =
    3 *
    u2 -
    2 *
    u;

  const derivativeX =
    dh00 *
      startX +
    dh10 *
      startTangentX +
    dh01 *
      endX +
    dh11 *
      endTangentX;

  const derivativeY =
    dh00 *
      startY +
    dh10 *
      startTangentY +
    dh01 *
      endY +
    dh11 *
      endTangentY;

  const derivativeLength =
    Math.max(
      EPSILON,
      Math.hypot(
        derivativeX,
        derivativeY,
      ),
    );

  const tangentX =
    derivativeX /
    derivativeLength;

  const tangentY =
    derivativeY /
    derivativeLength;

  return {
    x,
    y,
    tangentX,
    tangentY,

    normalX:
      -tangentY,

    normalY:
      tangentX,

    transitionProgress:
      progress,
  };
}

function nearestArmAtAngle(
  arms:
    readonly GalaxyVisualArm[],

  angleRadians:
    number,
): GalaxyVisualArm | null {

  let nearest:
    GalaxyVisualArm | null =
      null;

  let nearestDistance =
    Number.POSITIVE_INFINITY;

  for (
    const arm of
    arms
  ) {
    const distance =
      Math.abs(
        shortestSignedAngleDelta(
          angleRadians,
          arm
            .phaseRadians,
        ),
      );

    if (
      distance <
      nearestDistance
    ) {
      nearest =
        arm;

      nearestDistance =
        distance;
    }
  }

  return nearest;
}

function logarithmicArmTangentAtRadius(
  arm:
    GalaxyVisualArm,

  windingDirection:
    typeof GalaxyWindingDirection[
      keyof typeof GalaxyWindingDirection
    ],

  radius:
    number,
): {
  readonly x:
    number;

  readonly y:
    number;
} {

  const angle =
    logarithmicArmAngleAtRadius(
      arm,
      windingDirection,
      radius,
    );

  const pitchRadians =
    Math.max(
      0.05,
      arm
        .pitchAngleDegrees *
      Math.PI /
      180,
    );

  const windingSign =
    windingDirection ===
    GalaxyWindingDirection
      .CLOCKWISE
      ? -1
      : 1;

  const inverseTanPitch =
    windingSign /
    Math.tan(
      pitchRadians,
    );

  const tangentX =
    Math.cos(
      angle,
    ) -
    Math.sin(
      angle,
    ) *
    inverseTanPitch;

  const tangentY =
    Math.sin(
      angle,
    ) +
    Math.cos(
      angle,
    ) *
    inverseTanPitch;

  const length =
    Math.max(
      EPSILON,
      Math.hypot(
        tangentX,
        tangentY,
      ),
    );

  return {
    x:
      tangentX /
      length,

    y:
      tangentY /
      length,
  };
}

function selectDiskPoint(
  arms:
    readonly GalaxyVisualArm[],

  windingDirection:
    typeof GalaxyWindingDirection[
      keyof typeof GalaxyWindingDirection
    ],

  bulgeRadius:
    number,

  sampler:
    DeterministicSampler,

  index:
    number,

  armProbability:
    number,

  interArmProbability:
    number,

  barred:
    boolean,

  spiral:
    boolean,
): PlanarPoint {

  if (
    arms.length ===
    0
  ) {
    return diffuseDiskPoint(
      bulgeRadius,
      sampler,
      index,
    );
  }

  const mode =
    sampler.sample01(
      index,
      40,
    );

  if (
    mode <
    armProbability
  ) {
    return spiralDensityPoint(
      arms,
      windingDirection,
      sampler,
      index,
      barred
        ? 0.82
        : spiral
          ? 0.90
          : 1,
      barred
        ? BARRED_SPIRAL_ARM_RADIAL_DECAY_STRENGTH
        : spiral
          ? SPIRAL_ARM_RADIAL_DECAY_STRENGTH
          : null,
    );
  }

  if (
    mode <
    armProbability +
      interArmProbability
  ) {
    return interarmDiskPoint(
      arms,
      windingDirection,
      bulgeRadius,
      sampler,
      index,
    );
  }

  return diffuseDiskPoint(
    bulgeRadius,
    sampler,
    index,
  );
}

function diffuseDiskPoint(
  bulgeRadius:
    number,

  sampler:
    DeterministicSampler,

  index:
    number,
): PlanarPoint {

  const inner =
    Math.min(
      0.30,
      Math.max(
        0.04,
        bulgeRadius *
          0.38,
      ),
    );

  const radius =
    inner +
    (
      1.06 -
      inner
    ) *
    Math.pow(
      sampler.sample01(
        index,
        140,
      ),
      0.72,
    );

  const angle =
    sampler.sample01(
      index,
      141,
    ) *
    TWO_PI;

  return Object.freeze({
    x:
      Math.cos(
        angle,
      ) *
      radius,

    y:
      Math.sin(
        angle,
      ) *
      radius,

    radius,

    armEnhanced:
      false,

    population:
      'diffuse',
  });
}

function interarmDiskPoint(
  arms:
    readonly GalaxyVisualArm[],

  windingDirection:
    typeof GalaxyWindingDirection[
      keyof typeof GalaxyWindingDirection
    ],

  bulgeRadius:
    number,

  sampler:
    DeterministicSampler,

  index:
    number,
): PlanarPoint {

  if (
    arms.length ===
    0
  ) {
    return diffuseDiskPoint(
      bulgeRadius,
      sampler,
      index,
    );
  }

  const armIndex =
    Math.min(
      arms.length -
        1,
      Math.floor(
        sampler.sample01(
          index,
          160,
        ) *
        arms.length,
      ),
    );

  const arm =
    arms[
      armIndex
    ];

  const radialT =
    Math.pow(
      sampler.sample01(
        index,
        161,
      ),
      0.74,
    );

  const radius =
    Math.max(
      bulgeRadius *
        0.95,
      arm
        .radialStartNormalized,
    ) +
    (
      arm
        .radialEndNormalized -
      Math.max(
        bulgeRadius *
          0.95,
        arm
          .radialStartNormalized,
      )
    ) *
      radialT;

  const pitchRadians =
    arm
      .pitchAngleDegrees *
    Math.PI /
    180;

  const windingSign =
    windingDirection ===
    GalaxyWindingDirection
      .CLOCKWISE
      ? -1
      : 1;

  const safeStart =
    Math.max(
      0.001,
      arm
        .radialStartNormalized,
    );

  const armCenterAngle =
    arm
      .phaseRadians +
    windingSign *
      Math.log(
        Math.max(
          radius,
          0.001,
        ) /
          safeStart,
      ) /
      Math.tan(
        Math.max(
          0.05,
          pitchRadians,
        ),
      );

  const width =
    arm
      .widthNormalized *
    (
      2.05 -
      0.40 *
      arm
        .coherence
    );

  const offsetSign =
    sampler.sample01(
      index,
      162,
    ) <
      0.5
      ? -1
      : 1;

  const sideOffset =
    offsetSign *
    (
      0.85 +
      1.20 *
      sampler.sample01(
        index,
        163,
      )
    ) *
    width /
    Math.max(
      0.16,
      radius,
    ) *
    2.25;

  const angularScatter =
    sampler.normal(
      index,
      164,
    ) *
    width /
    Math.max(
      0.16,
      radius,
    ) *
    2.40;

  const radialScatter =
    sampler.normal(
      index,
      166,
    ) *
    width *
    1.55;

  const jitteredRadius =
    clamp(
      radius +
        radialScatter,
      0.03,
      1.06,
    );

  const angle =
    armCenterAngle +
    sideOffset +
    angularScatter;

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

    armEnhanced:
      false,

    population:
      'interarm',
  });
}

/**
 * Returns the render-only arm geometry for spiral families.
 *
 * This deliberately changes where the SAME arm begins. No connector or
 * bridge particle population is created. The normal spiral is an inward
 * continuation of its canonical logarithmic curve. The barred spiral starts
 * at the nearest physical bar endpoint and continues outward as one arm.
 */
function spiralRenderArms(
  arms:
    readonly GalaxyVisualArm[],

  windingDirection:
    typeof GalaxyWindingDirection[
      keyof typeof GalaxyWindingDirection
    ],

  bulgeRadiusNormalized:
    number,

  barAngleRadians:
    number | null,

  barHalfLengthNormalized:
    number | null,

  barWidthNormalized:
    number | null,

  barred:
    boolean,

  spiral:
    boolean,
): readonly GalaxyVisualArm[] {

  if (
    arms.length ===
      0 ||
    (
      !barred &&
      !spiral
    )
  ) {
    return arms;
  }

  if (
    barred &&
    barAngleRadians !==
      null &&
    barHalfLengthNormalized !==
      null &&
    barWidthNormalized !==
      null
  ) {
    return Object.freeze(
      arms.map(
        arm =>
          barredSpiralRenderArm(
            arm,
            windingDirection,
            bulgeRadiusNormalized,
            barAngleRadians,
            barHalfLengthNormalized,
            barWidthNormalized,
          ),
      ),
    );
  }

  if (
    spiral
  ) {
    return Object.freeze(
      arms.map(
        arm =>
          normalSpiralRenderArm(
            arm,
            windingDirection,
            bulgeRadiusNormalized,
          ),
      ),
    );
  }

  return arms;
}

function normalSpiralRenderArm(
  arm:
    GalaxyVisualArm,

  windingDirection:
    typeof GalaxyWindingDirection[
      keyof typeof GalaxyWindingDirection
    ],

  bulgeRadiusNormalized:
    number,
): GalaxyVisualArm {

  const canonicalStart =
    arm
      .radialStartNormalized;

  const renderStart =
    Math.max(
      0.02,
      Math.min(
        canonicalStart,
        bulgeRadiusNormalized *
          SPIRAL_ARM_BULGE_OVERLAP_FACTOR,
      ),
    );

  if (
    renderStart >=
    canonicalStart -
      EPSILON
  ) {
    return arm;
  }

  /*
   * Rebase the logarithmic spiral so every point at or beyond the canonical
   * start keeps exactly the same centerline. Only the previously empty inner
   * continuation becomes visible.
   */
  const phaseRadians =
    logarithmicArmAngleAtRadius(
      arm,
      windingDirection,
      renderStart,
    );

  return Object.freeze({
    ...arm,
    radialStartNormalized:
      renderStart,
    phaseRadians,
  });
}

function barredSpiralRenderArm(
  arm:
    GalaxyVisualArm,

  windingDirection:
    typeof GalaxyWindingDirection[
      keyof typeof GalaxyWindingDirection
    ],

  bulgeRadiusNormalized:
    number,

  barAngleRadians:
    number,

  barHalfLengthNormalized:
    number,

  barWidthNormalized:
    number,
): GalaxyVisualArm {

  const canonicalStart =
    arm
      .radialStartNormalized;

  /*
   * Begin slightly inside the visible bar end so the bar and arm overlap as
   * one continuous stellar structure instead of meeting at a hard seam.
   */
  const barRootRadius =
    Math.max(
      0.02,
      barHalfLengthNormalized -
        barWidthNormalized *
          BARRED_SPIRAL_ARM_BAR_OVERLAP_WIDTH_FACTOR,
    );

  const renderStart =
    Math.max(
      0.02,
      Math.min(
        canonicalStart,
        Math.max(
          bulgeRadiusNormalized *
            0.72,
          barRootRadius,
        ),
      ),
    );

  if (
    renderStart >=
    canonicalStart -
      EPSILON
  ) {
    return arm;
  }

  const canonicalRootAngle =
    logarithmicArmAngleAtRadius(
      arm,
      windingDirection,
      renderStart,
    );

  const firstBarEndAngle =
    barAngleRadians;

  const secondBarEndAngle =
    barAngleRadians +
    Math.PI;

  const firstDistance =
    Math.abs(
      shortestSignedAngleDelta(
        canonicalRootAngle,
        firstBarEndAngle,
      ),
    );

  const secondDistance =
    Math.abs(
      shortestSignedAngleDelta(
        canonicalRootAngle,
        secondBarEndAngle,
      ),
    );

  const phaseRadians =
    firstDistance <=
      secondDistance
      ? firstBarEndAngle
      : secondBarEndAngle;

  return Object.freeze({
    ...arm,
    radialStartNormalized:
      renderStart,
    phaseRadians,
  });
}

function logarithmicArmAngleAtRadius(
  arm:
    GalaxyVisualArm,

  windingDirection:
    typeof GalaxyWindingDirection[
      keyof typeof GalaxyWindingDirection
    ],

  radius:
    number,
): number {

  const pitchRadians =
    arm
      .pitchAngleDegrees *
    Math.PI /
    180;

  const windingSign =
    windingDirection ===
    GalaxyWindingDirection
      .CLOCKWISE
      ? -1
      : 1;

  return arm
    .phaseRadians +
    windingSign *
      Math.log(
        Math.max(
          radius,
          0.001,
        ) /
          Math.max(
            arm
              .radialStartNormalized,
            0.001,
          ),
      ) /
      Math.tan(
        Math.max(
          0.05,
          pitchRadians,
        ),
      );
}

function shortestSignedAngleDelta(
  from:
    number,

  to:
    number,
): number {

  return Math.atan2(
    Math.sin(
      to -
        from,
    ),
    Math.cos(
      to -
        from,
    ),
  );
}

/**
 * Maps a uniform deterministic sample to a smooth truncated exponential
 * distribution over [0, 1]. The resulting density decreases continuously
 * along the arm: no hard radial bands or particle-count changes are needed.
 */
function decayingArmProgress(
  sample:
    number,

  decayStrength:
    number,
): number {

  if (
    decayStrength <=
    EPSILON
  ) {
    return clamp01(
      sample,
    );
  }

  const normalizedSample =
    clamp01(
      sample,
    );

  const normalization =
    1 -
    Math.exp(
      -decayStrength,
    );

  return clamp01(
    -Math.log(
      Math.max(
        EPSILON,
        1 -
          normalizedSample *
          normalization,
      ),
    ) /
      decayStrength,
  );
}

function spiralDensityPoint(
  arms:
    readonly GalaxyVisualArm[],

  windingDirection:
    typeof GalaxyWindingDirection[
      keyof typeof GalaxyWindingDirection
    ],

  sampler:
    DeterministicSampler,

  index:
    number,

  scatterScale:
    number,

  radialDecayStrength:
    number | null,
): PlanarPoint {

  if (
    arms.length ===
    0
  ) {
    throw new RangeError(
      'Spiral density sampling requires at least one visual arm.',
    );
  }

  const armIndex =
    Math.min(
      arms.length -
        1,
      Math.floor(
        sampler.sample01(
          index,
          150,
        ) *
        arms.length,
      ),
    );

  const arm =
    arms[
      armIndex
    ];

  const radialSample =
    sampler.sample01(
      index,
      151,
    );

  const radialT =
    radialDecayStrength ===
      null
      ? Math.pow(
          radialSample,
          0.78,
        )
      : decayingArmProgress(
          radialSample,
          radialDecayStrength,
        );

  const radius =
    arm
      .radialStartNormalized +
    (
      arm
        .radialEndNormalized -
      arm
        .radialStartNormalized
    ) *
      radialT;

  const pitchRadians =
    arm
      .pitchAngleDegrees *
    Math.PI /
    180;

  const windingSign =
    windingDirection ===
    GalaxyWindingDirection
      .CLOCKWISE
      ? -1
      : 1;

  const safeStart =
    Math.max(
      0.001,
      arm
        .radialStartNormalized,
    );

  const armCenterAngle =
    arm
      .phaseRadians +
    windingSign *
      Math.log(
        Math.max(
          radius,
          0.001,
        ) /
          safeStart,
      ) /
      Math.tan(
        Math.max(
          0.05,
          pitchRadians,
        ),
      );

  const width =
    arm
      .widthNormalized *
    (
      1.92 -
      0.40 *
      arm
        .coherence
    );

  const angularScatter =
    sampler.normal(
      index,
      152,
    ) *
    width /
    Math.max(
      0.12,
      radius,
    ) *
    2.55 *
    scatterScale;

  const radialScatter =
    sampler.normal(
      index,
      154,
    ) *
    width *
    1.55 *
    scatterScale;

  const feather =
    sampler.normal(
      index,
      156,
    ) *
    width /
    Math.max(
      0.18,
      radius,
    ) *
    0.95 *
    scatterScale;

  const jitteredRadius =
    clamp(
      radius +
        radialScatter,
      0.02,
      1.05,
    );

  const angle =
    armCenterAngle +
    angularScatter +
    feather;

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

    armEnhanced:
      true,

    population:
      'arm',
  });
}

function irregularClusterAnchor(
  axisRatio:
    number,

  sampler:
    DeterministicSampler,

  clusterIndex:
    number,
): ClusterAnchor {

  const radius =
    0.12 +
    0.60 *
    Math.pow(
      sampler.sample01(
        clusterIndex,
        310,
      ),
      1.08,
    );

  const angle =
    TWO_PI *
      sampler.sample01(
        clusterIndex,
        311,
      ) +
    sampler.normal(
      clusterIndex,
      312,
    ) *
      0.28;

  const stretch =
    0.82 +
    0.32 *
    sampler.sample01(
      clusterIndex,
      313,
    );

  const spread =
    0.05 +
    0.10 *
    sampler.sample01(
      clusterIndex,
      314,
    );

  return Object.freeze({
    x:
      Math.cos(
        angle,
      ) *
      radius *
      stretch,

    y:
      Math.sin(
        angle,
      ) *
      radius *
      axisRatio *
      (1.08 - 0.18 * stretch),

    spread,

    knot:
      sampler.sample01(
        clusterIndex,
        315,
      ) >
      0.56,
  });
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

function isIrregular(
  model:
    GalacticMapParticleRenderInput,
): boolean {

  return model.galaxyType ===
    GalaxyType.IRREGULAR;
}

function isDwarf(
  model:
    GalacticMapParticleRenderInput,
): boolean {

  return model.galaxyType ===
    GalaxyType.DWARF;
}

function isSpiral(
  model:
    GalacticMapParticleRenderInput,
): boolean {

  return model.galaxyType ===
    GalaxyType.SPIRAL;
}

function isBarredSpiral(
  model:
    GalacticMapParticleRenderInput,
): boolean {

  if (
    model.galaxyType !==
    null
  ) {
    return model.galaxyType ===
      GalaxyType.BARRED_SPIRAL;
  }

  return requiredVisual(
    model,
  ).bar !==
    null;
}

function requiredVisual(
  model:
    GalacticMapParticleRenderInput,
) {
  const visual =
    model.visualStructure;

  if (
    visual ===
    null
  ) {
    throw new RangeError(
      'GalacticMapParticleRenderInput has no detailed visual structure.',
    );
  }

  return visual;
}

function createSampler(
  model:
    GalacticMapParticleRenderInput,
): DeterministicSampler {

  const seed =
    seedFromModel(
      model,
    );

  return Object.freeze({
    sample01(
      index:
        number,

      channel:
        number,
    ): number {
      return hashedUnit(
        seed,
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
            seed,
            index,
            channel,
          ),
        );

      const u2 =
        hashedUnit(
          seed,
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

function seedFromModel(
  model:
    GalacticMapParticleRenderInput,
): number {

  const source = [
    model.universeSeedNormalizedValue,
    model.generatorVersionCode,
    model.galaxyIndex,
    'GENESIS-GALACTIC-MAP-VISUAL-SAMPLING-V1',
  ].join(
    '|',
  );

  let hash =
    0x811c9dc5;

  for (
    let index =
      0;
    index <
      source.length;
    index +=
      1
  ) {
    hash ^=
      source.charCodeAt(
        index,
      );

    hash =
      Math.imul(
        hash,
        0x01000193,
      );
  }

  return hash >>>
    0;
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
      0.25,
      size,
    );

  buffers.opacities[
    index
  ] =
    clamp01(
      opacity,
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
