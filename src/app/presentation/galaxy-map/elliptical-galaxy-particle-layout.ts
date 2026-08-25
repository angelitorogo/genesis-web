import {
  type GalaxyVisualStructure,
} from '../../domain/universe/galaxy-visual-structure';

const TWO_PI =
  Math.PI * 2;

const UINT32_SCALE =
  4_294_967_296;

const EPSILON =
  1e-9;

/**
 * Dedicated ELLIPTICAL renderer.
 *
 * The stellar populations intentionally keep the historical 124k production
 * budget and the same broad spheroidal sampling envelope already accepted in
 * the galaxy map. The dedicated visual change is concentrated in the final
 * 12k samples: instead of a sparse cold stellar halo, ELLIPTICAL now receives
 * a warm volumetric gaseous envelope surrounding the galaxy.
 *
 * This keeps the morphology unmistakably elliptical — no spiral arms, no disk,
 * no bar — while giving the family a richer renderer language comparable to
 * SPIRAL and BARRED_SPIRAL.
 */
export const ELLIPTICAL_CORE_PARTICLE_COUNT =
  20_000;

export const ELLIPTICAL_BODY_PARTICLE_COUNT =
  92_000;

export const ELLIPTICAL_GAS_HALO_PARTICLE_COUNT =
  12_000;

export const ELLIPTICAL_TOTAL_PARTICLE_COUNT =
  ELLIPTICAL_CORE_PARTICLE_COUNT +
  ELLIPTICAL_BODY_PARTICLE_COUNT +
  ELLIPTICAL_GAS_HALO_PARTICLE_COUNT;

const ELLIPTICAL_CORE_EXTENT_SCALE =
  1.26;

const ELLIPTICAL_CORE_OPACITY_SCALE =
  0.96;

const ELLIPTICAL_GAS_INNER_RADIUS =
  0.025;

const ELLIPTICAL_GAS_OUTER_RADIUS_SCALE =
  1.02;

const ELLIPTICAL_GAS_DEPTH_SCALE =
  0.78;

const ELLIPTICAL_GAS_MAX_SIZE =
  9.4;

interface EllipticalGalaxyRenderInput {
  readonly universeSeedNormalizedValue:
    string | number | bigint;

  readonly generatorVersionCode:
    number;

  readonly galaxyIndex:
    string | number | bigint;

  readonly visualStructure:
    GalaxyVisualStructure | null;
}

export interface EllipticalGalaxyParticleLayout {
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

interface EllipticalChromaticProfile {
  readonly coreWarm:
    RgbColor;

  readonly coreWhite:
    RgbColor;

  readonly bodyOuter:
    RgbColor;

  readonly gasInner:
    RgbColor;

  readonly gasOuter:
    RgbColor;

  readonly gasAccent:
    RgbColor;
}

export function generateEllipticalGalaxyParticleLayout(
  model:
    EllipticalGalaxyRenderInput,
): EllipticalGalaxyParticleLayout {

  const visual =
    requiredVisual(
      model,
    );

  const buffers:
    ParticleBuffers =
    {
      positions:
        new Float32Array(
          ELLIPTICAL_TOTAL_PARTICLE_COUNT *
          3,
        ),

      colors:
        new Float32Array(
          ELLIPTICAL_TOTAL_PARTICLE_COUNT *
          3,
        ),

      sizes:
        new Float32Array(
          ELLIPTICAL_TOTAL_PARTICLE_COUNT,
        ),

      opacities:
        new Float32Array(
          ELLIPTICAL_TOTAL_PARTICLE_COUNT,
        ),
    };

  const sampler =
    createSampler(
      model,
    );

  const chromaticProfile =
    createEllipticalChromaticProfile(
      sampler,
    );

  let cursor =
    0;

  cursor =
    writeWarmCore(
      visual,
      sampler,
      chromaticProfile,
      buffers,
      cursor,
    );

  cursor =
    writeSpheroidalBody(
      visual,
      sampler,
      chromaticProfile,
      buffers,
      cursor,
    );

  cursor =
    writeWarmGasHalo(
      visual,
      sampler,
      chromaticProfile,
      buffers,
      cursor,
    );

  if (
    cursor !==
    ELLIPTICAL_TOTAL_PARTICLE_COUNT
  ) {
    throw new Error(
      'ELLIPTICAL dedicated renderer cursor invariant broken.',
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
      ELLIPTICAL_TOTAL_PARTICLE_COUNT,
  });
}

function writeWarmCore(
  visual:
    GalaxyVisualStructure,

  sampler:
    DeterministicSampler,

  chromaticProfile:
    EllipticalChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const extent =
    visual.bulgeRadiusNormalized *
    ELLIPTICAL_CORE_EXTENT_SCALE;

  const verticalAxis =
    0.62 +
    0.22 *
    visual.bulgeAxisRatio;

  for (
    let index =
      0;
    index <
      ELLIPTICAL_CORE_PARTICLE_COUNT;
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
        2.12,
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

    const temperature =
      sampler.sample01(
        index,
        9,
      );

    const warmShift =
      temperature >
        0.76
        ? (
            temperature -
            0.76
          ) /
          0.24
        : 0;

    const coolShift =
      temperature <
        0.15
        ? (
            0.15 -
            temperature
          ) /
          0.15
        : 0;

    const rareBright =
      sampler.sample01(
        index,
        8,
      ) <
      0.014;

    const baseColor =
      mixColor(
        chromaticProfile.coreWarm,
        chromaticProfile.coreWhite,
        0.22 +
        0.34 *
        brightness -
        0.10 *
        warmShift +
        0.10 *
        coolShift,
      );

    const color =
      mixColor(
        baseColor,
        rgb(
          1.00,
          0.94,
          0.86,
        ),
        0.08 +
        0.10 *
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
        1.12 +
        1.54 *
        brightness
      ) *
      (
        0.76 +
        0.34 *
        sampler.sample01(
          index,
          10,
        )
      ) *
      (
        rareBright
          ? 1.32
          : 1
      ),
      (
        0.12 +
        0.20 *
        brightness +
        (
          rareBright
            ? 0.05
            : 0
        )
      ) *
      ELLIPTICAL_CORE_OPACITY_SCALE,
    );
  }

  return start +
    ELLIPTICAL_CORE_PARTICLE_COUNT;
}

function writeSpheroidalBody(
  visual:
    GalaxyVisualStructure,

  sampler:
    DeterministicSampler,

  chromaticProfile:
    EllipticalChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const verticalAxis =
    0.58 +
    0.23 *
    visual.bulgeAxisRatio;

  for (
    let index =
      0;
    index <
      ELLIPTICAL_BODY_PARTICLE_COUNT;
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
          visual.bulgeAxisRatio,
        visual.orientationRadians,
      );

    const centrality =
      1 -
      Math.min(
        1,
        radius /
          1.08,
      );

    const temperature =
      sampler.sample01(
        index,
        29,
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
        0.12
        ? (
            0.12 -
            temperature
          ) /
          0.12
        : 0;

    const rareBright =
      sampler.sample01(
        index,
        28,
      ) <
      0.010;

    const diffuseColor =
      mixColor(
        chromaticProfile.bodyOuter,
        chromaticProfile.coreWarm,
        0.24 +
        0.26 *
        centrality +
        0.18 *
        warmShift,
      );

    const color =
      mixColor(
        diffuseColor,
        chromaticProfile.coreWhite,
        0.04 +
        0.07 *
        coolShift,
      );

    writeParticle(
      buffers,
      start +
        index,
      rotated.x,
      rotated.y,
      direction.z *
        radius *
        verticalAxis,
      color.red,
      color.green,
      color.blue,
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
            ? 0.17
            : 0
        ),
    );
  }

  return start +
    ELLIPTICAL_BODY_PARTICLE_COUNT;
}

function writeWarmGasHalo(
  visual:
    GalaxyVisualStructure,

  sampler:
    DeterministicSampler,

  chromaticProfile:
    EllipticalChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const outerRadius =
    visual.regions.haloOuterRadiusNormalized *
    ELLIPTICAL_GAS_OUTER_RADIUS_SCALE;

  for (
    let index =
      0;
    index <
      ELLIPTICAL_GAS_HALO_PARTICLE_COUNT;
    index +=
      1
  ) {
    const shellComponent =
      sampler.sample01(
        index,
        1000,
      );

    const innerEnvelope =
      shellComponent <
      0.88;

    const radiusT =
      innerEnvelope
        ? Math.pow(
            sampler.sample01(
              index,
              1001,
            ),
            2.24,
          )
        : Math.pow(
            sampler.sample01(
              index,
              1001,
            ),
            1.48,
          );

    const radius =
      innerEnvelope
        ? ELLIPTICAL_GAS_INNER_RADIUS +
          (
            0.66 -
            ELLIPTICAL_GAS_INNER_RADIUS
          ) *
          radiusT
        : 0.62 +
          (
            outerRadius -
            0.62
          ) *
          radiusT;

    const direction =
      unitSphereDirection(
        sampler,
        index,
        1002,
      );

    const swirlPhase =
      TWO_PI *
      sampler.sample01(
        index,
        1004,
      );

    const azimuth =
      Math.atan2(
        direction.y,
        direction.x,
      );

    const gaseousClump =
      0.90 +
      0.18 *
      Math.sin(
        2 *
          azimuth +
          swirlPhase,
      ) +
      0.10 *
      Math.cos(
        3 *
          azimuth -
          0.5 *
          swirlPhase,
      );

    const scaledRadius =
      radius *
      gaseousClump;

    const rotated =
      rotate2d(
        direction.x *
          scaledRadius,
        direction.y *
          scaledRadius *
          0.96,
        visual.orientationRadians,
      );

    const z =
      direction.z *
      scaledRadius *
      ELLIPTICAL_GAS_DEPTH_SCALE *
      (
        0.64 +
        0.30 *
        visual.bulgeAxisRatio
      );

    const normalizedRadius =
      clamp01(
        scaledRadius /
        Math.max(
          EPSILON,
          outerRadius,
        ),
      );

    const density =
      innerEnvelope
        ? 1 -
          smoothstep01(
            0.16,
            0.72,
            normalizedRadius,
          )
        : 1 -
          smoothstep01(
            0.52,
            0.92,
            normalizedRadius,
          );

    const outerDiffusion =
      smoothstep01(
        0.54,
        1.00,
        normalizedRadius,
      );

    const warmMix =
      0.44 +
      0.42 *
      density +
      0.10 *
      sampler.sample01(
        index,
        1005,
      );

    const accentMix =
      sampler.sample01(
        index,
        1006,
      ) <
      0.08
        ? 0.18 +
          0.18 *
          density
        : 0.02 +
          0.05 *
          density;

    const baseColor =
      mixColor(
        chromaticProfile.gasOuter,
        chromaticProfile.gasInner,
        warmMix,
      );

    const color =
      mixColor(
        baseColor,
        chromaticProfile.gasAccent,
        accentMix,
      );

    const size =
      innerEnvelope
        ? 4.4 +
          3.4 *
          density +
          1.2 *
          sampler.sample01(
            index,
            1007,
          )
        : 3.8 +
          2.2 *
          density +
          1.8 *
          outerDiffusion +
          1.0 *
          sampler.sample01(
            index,
            1007,
          );

    const opacity =
      innerEnvelope
        ? 0.052 +
          0.090 *
          density +
          0.010 *
          sampler.sample01(
            index,
            1008,
          )
        : (
            0.018 +
            0.034 *
            density +
            0.008 *
            sampler.sample01(
              index,
              1008,
            )
          ) *
          (
            1 -
            0.70 *
            outerDiffusion
          );

    writeParticle(
      buffers,
      start +
        index,
      rotated.x,
      rotated.y,
      z,
      color.red,
      color.green,
      color.blue,
      clamp(
        size,
        1.0,
        ELLIPTICAL_GAS_MAX_SIZE,
      ),
      opacity,
    );
  }

  return start +
    ELLIPTICAL_GAS_HALO_PARTICLE_COUNT;
}

function createEllipticalChromaticProfile(
  sampler:
    DeterministicSampler,
): EllipticalChromaticProfile {

  const profileMix =
    sampler.sample01(
      0,
      1200,
    );

  const amber =
    rgb(
      0.92,
      0.78,
      0.62,
    );

  const paleGold =
    rgb(
      0.98,
      0.90,
      0.80,
    );

  const champagne =
    rgb(
      0.90,
      0.84,
      0.76,
    );

  const diffuseAmber =
    rgb(
      0.88,
      0.72,
      0.56,
    );

  const outerDust =
    rgb(
      0.76,
      0.62,
      0.50,
    );

  const roseGold =
    rgb(
      0.98,
      0.82,
      0.70,
    );

  return Object.freeze({
    coreWarm:
      mixColor(
        amber,
        paleGold,
        0.22 +
        0.26 *
        profileMix,
      ),

    coreWhite:
      mixColor(
        paleGold,
        rgb(
          1.0,
          0.98,
          0.94,
        ),
        0.40,
      ),

    bodyOuter:
      mixColor(
        champagne,
        diffuseAmber,
        0.18 +
        0.18 *
        profileMix,
      ),

    gasInner:
      mixColor(
        amber,
        paleGold,
        0.28 +
        0.12 *
        profileMix,
      ),

    gasOuter:
      mixColor(
        diffuseAmber,
        outerDust,
        0.22 +
        0.10 *
        profileMix,
      ),

    gasAccent:
      mixColor(
        rgb(
          0.96,
          0.74,
          0.54,
        ),
        roseGold,
        0.34,
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

function requiredVisual(
  model:
    EllipticalGalaxyRenderInput,
): GalaxyVisualStructure {

  const visual =
    model.visualStructure;

  if (
    visual ===
    null
  ) {
    throw new RangeError(
      'ELLIPTICAL particle generation requires detailed GalaxyVisualStructure.',
    );
  }

  return visual;
}

function createSampler(
  model:
    EllipticalGalaxyRenderInput,
): DeterministicSampler {

  const source = [
    model.universeSeedNormalizedValue,
    model.generatorVersionCode,
    model.galaxyIndex,
    'GENESIS-ELLIPTICAL-DEDICATED-RENDERER-V1',
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
