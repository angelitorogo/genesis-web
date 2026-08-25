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
 * Dedicated IRREGULAR renderer.
 *
 * Irregular galaxies deliberately avoid a symmetric disk, bar or grand-design
 * spiral. Their visual identity comes from one continuous lopsided stellar
 * body, embedded star-forming knots, asymmetric extensions and a patchy
 * volumetric interstellar medium.
 *
 * The renderer remains procedural and deterministic. Gas, bright knots and
 * stellar temperatures are render samples only: they do not materialize
 * physical nebulae, stars, discoveries or persisted Ground Truth entities.
 */
export const IRREGULAR_CORE_PARTICLE_COUNT =
  20_000;

export const IRREGULAR_BODY_PARTICLE_COUNT =
  96_000;

export const IRREGULAR_CLUSTER_PARTICLE_COUNT =
  330_000;

export const IRREGULAR_GAS_PARTICLE_COUNT =
  34_000;

export const IRREGULAR_HALO_PARTICLE_COUNT =
  16_000;

export const IRREGULAR_TOTAL_PARTICLE_COUNT =
  IRREGULAR_CORE_PARTICLE_COUNT +
  IRREGULAR_BODY_PARTICLE_COUNT +
  IRREGULAR_CLUSTER_PARTICLE_COUNT +
  IRREGULAR_GAS_PARTICLE_COUNT +
  IRREGULAR_HALO_PARTICLE_COUNT;

interface IrregularGalaxyRenderInput {
  readonly universeSeedNormalizedValue:
    string | number | bigint;

  readonly generatorVersionCode:
    number;

  readonly galaxyIndex:
    string | number | bigint;

  readonly visualStructure:
    GalaxyVisualStructure | null;
}

export interface IrregularGalaxyParticleLayout {
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

interface IrregularGeometry {
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

  readonly knotCount:
    number;

  readonly gasCloudCount:
    number;
}

interface IrregularAnchor {
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

  readonly starForming:
    boolean;

  readonly gasBias:
    number;

  readonly temperatureBias:
    number;
}

interface IrregularChromaticProfile {
  readonly coreWarm:
    RgbColor;

  readonly coreWhite:
    RgbColor;

  readonly starBlue:
    RgbColor;

  readonly starWhite:
    RgbColor;

  readonly starAmber:
    RgbColor;

  readonly gasDominant:
    RgbColor;

  readonly gasSecondary:
    RgbColor;

  readonly gasAccent:
    RgbColor;

  readonly gasWarm:
    RgbColor;

  readonly haloOuter:
    RgbColor;
}

export function generateIrregularGalaxyParticleLayout(
  model:
    IrregularGalaxyRenderInput,
): IrregularGalaxyParticleLayout {

  const visual =
    requiredVisual(
      model,
    );

  const buffers:
    ParticleBuffers =
    {
      positions:
        new Float32Array(
          IRREGULAR_TOTAL_PARTICLE_COUNT * 3,
        ),

      colors:
        new Float32Array(
          IRREGULAR_TOTAL_PARTICLE_COUNT * 3,
        ),

      sizes:
        new Float32Array(
          IRREGULAR_TOTAL_PARTICLE_COUNT,
        ),

      opacities:
        new Float32Array(
          IRREGULAR_TOTAL_PARTICLE_COUNT,
        ),
    };

  const sampler =
    createSampler(
      model,
    );

  const geometry =
    createIrregularGeometry(
      visual,
      sampler,
    );

  const anchors =
    createIrregularAnchors(
      geometry,
      sampler,
    );

  const chromaticProfile =
    createIrregularChromaticProfile(
      visual,
      sampler,
    );

  let cursor =
    0;

  cursor =
    writeWarmOffsetCore(
      visual,
      geometry,
      sampler,
      chromaticProfile,
      buffers,
      cursor,
    );

  cursor =
    writeContinuousBody(
      visual,
      geometry,
      anchors,
      sampler,
      chromaticProfile,
      buffers,
      cursor,
    );

  cursor =
    writeClumpyStellarBody(
      visual,
      geometry,
      anchors,
      sampler,
      chromaticProfile,
      buffers,
      cursor,
    );

  cursor =
    writeChromaticVolumetricGas(
      visual,
      geometry,
      anchors,
      sampler,
      chromaticProfile,
      buffers,
      cursor,
    );

  cursor =
    writeDiffuseHalo(
      visual,
      geometry,
      sampler,
      chromaticProfile,
      buffers,
      cursor,
    );

  if (
    cursor !==
    IRREGULAR_TOTAL_PARTICLE_COUNT
  ) {
    throw new Error(
      'IRREGULAR dedicated particle layout cursor invariant broken.',
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
      IRREGULAR_TOTAL_PARTICLE_COUNT,
  });
}

function writeWarmOffsetCore(
  visual:
    GalaxyVisualStructure,

  geometry:
    IrregularGeometry,

  sampler:
    DeterministicSampler,

  chromaticProfile:
    IrregularChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  for (
    let index = 0;
    index < IRREGULAR_CORE_PARTICLE_COUNT;
    index += 1
  ) {
    const angle =
      TWO_PI * sampler.sample01(index, 20);

    const radial =
      0.015 +
      0.30 * Math.pow(
        sampler.sample01(index, 21),
        1.42,
      );

    const asymmetricStretch =
      0.90 +
      0.18 * Math.cos(
        angle - geometry.lopsidedPhase,
      );

    const localX =
      geometry.offsetX +
      Math.cos(angle) * radial * 0.72 * asymmetricStretch +
      sampler.normal(index, 22) * 0.025;

    const localY =
      geometry.offsetY +
      Math.sin(angle) * radial * 0.52 +
      sampler.normal(index, 24) * 0.025;

    const rotated =
      rotate2d(
        localX,
        localY,
        visual.orientationRadians,
      );

    const centrality =
      1 - smoothstep01(
        0.02,
        0.34,
        radial,
      );

    const warmColor =
      mixColor(
        chromaticProfile.coreWarm,
        chromaticProfile.coreWhite,
        0.08 + 0.44 * Math.pow(centrality, 1.8),
      );

    const rareBright =
      sampler.sample01(index, 26) <
      0.012 + 0.018 * centrality;

    writeParticle(
      buffers,
      start + index,
      rotated.x,
      rotated.y,
      sampler.normal(index, 27) * 0.055 * (0.44 + 0.56 * radial),
      warmColor.red,
      warmColor.green,
      warmColor.blue,
      (
        0.72 +
        1.32 * sampler.sample01(index, 29) +
        0.64 * centrality
      ) * (
        rareBright
          ? 1.74
          : 1
      ),
      0.18 +
        0.24 * centrality +
        0.10 * sampler.sample01(index, 30) +
        (
          rareBright
            ? 0.15
            : 0
        ),
    );
  }

  return start +
    IRREGULAR_CORE_PARTICLE_COUNT;
}

function writeContinuousBody(
  visual:
    GalaxyVisualStructure,

  geometry:
    IrregularGeometry,

  anchors:
    readonly IrregularAnchor[],

  sampler:
    DeterministicSampler,

  chromaticProfile:
    IrregularChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  for (
    let index = 0;
    index < IRREGULAR_BODY_PARTICLE_COUNT;
    index += 1
  ) {
    const mode =
      sampler.sample01(index, 60);

    let localX:
      number;

    let localY:
      number;

    let localZ:
      number;

    let radius:
      number;

    let starForming =
      false;

    let extension =
      false;

    if (
      mode < 0.66
    ) {
      const angle =
        TWO_PI * sampler.sample01(index, 61);

      radius =
        0.035 +
        1.03 * Math.pow(
          sampler.sample01(index, 62),
          1.04,
        );

      const distortion =
        irregularRadialDistortion(
          angle,
          geometry,
        );

      const scatter =
        0.018 +
        0.050 * sampler.sample01(index, 63);

      localX =
        geometry.offsetX +
        Math.cos(angle) *
          radius *
          geometry.majorScale *
          distortion +
        sampler.normal(index, 64) * scatter;

      localY =
        geometry.offsetY +
        Math.sin(angle) *
          radius *
          geometry.minorScale *
          distortion +
        geometry.bendStrength *
          Math.sin(angle - geometry.bendPhase) *
          radius +
        sampler.normal(index, 66) * scatter;

      localZ =
        sampler.normal(index, 68) *
        0.15 *
        (0.44 + 0.56 * radius);
    } else if (
      mode < 0.90
    ) {
      const anchor =
        anchors[
          Math.min(
            anchors.length - 1,
            Math.floor(
              sampler.sample01(index, 70) * anchors.length,
            ),
          )
        ];

      localX =
        anchor.x +
        sampler.normal(index, 71) * anchor.spread * 1.16;

      localY =
        anchor.y +
        sampler.normal(index, 73) * anchor.spread * 1.04;

      localZ =
        anchor.z +
        sampler.normal(index, 75) * anchor.spread * 0.72;

      radius =
        Math.hypot(
          localX - geometry.offsetX,
          localY - geometry.offsetY,
        );

      starForming =
        anchor.starForming;
    } else {
      const point =
        irregularExtensionPoint(
          geometry,
          sampler,
          index,
          80,
        );

      localX =
        point.x;

      localY =
        point.y;

      localZ =
        point.z;

      radius =
        point.radius;

      extension =
        true;
    }

    const rotated =
      rotate2d(
        localX,
        localY,
        visual.orientationRadians,
      );

    const centrality =
      1 - clamp01(
        radius / 1.32,
      );

    const color =
      irregularStarColor(
        chromaticProfile,
        sampler.sample01(index, 90),
        centrality,
        starForming,
        false,
      );

    const rareBright =
      sampler.sample01(index, 91) <
      (
        starForming
          ? 0.034
          : extension
            ? 0.010
            : 0.017
      );

    writeParticle(
      buffers,
      start + index,
      rotated.x,
      rotated.y,
      localZ,
      color.red,
      color.green,
      color.blue,
      (
        0.54 +
        1.05 * sampler.sample01(index, 92) +
        0.28 * centrality
      ) * (
        rareBright
          ? 1.82
          : 1
      ),
      0.080 +
        0.085 * centrality +
        (
          starForming
            ? 0.050
            : extension
              ? -0.010
              : 0
        ) +
        (
          rareBright
            ? 0.11
            : 0
        ),
    );
  }

  return start +
    IRREGULAR_BODY_PARTICLE_COUNT;
}

function writeClumpyStellarBody(
  visual:
    GalaxyVisualStructure,

  geometry:
    IrregularGeometry,

  anchors:
    readonly IrregularAnchor[],

  sampler:
    DeterministicSampler,

  chromaticProfile:
    IrregularChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  for (
    let index = 0;
    index < IRREGULAR_CLUSTER_PARTICLE_COUNT;
    index += 1
  ) {
    const mode =
      sampler.sample01(index, 130);

    let localX:
      number;

    let localY:
      number;

    let localZ:
      number;

    let radius:
      number;

    let starForming =
      false;

    let extension =
      false;

    if (
      mode < 0.50
    ) {
      const angle =
        TWO_PI * sampler.sample01(index, 131);

      radius =
        0.05 +
        1.00 * Math.pow(
          sampler.sample01(index, 132),
          1.00,
        );

      const distortion =
        irregularRadialDistortion(
          angle,
          geometry,
        );

      localX =
        geometry.offsetX +
        Math.cos(angle) *
          radius *
          geometry.majorScale *
          distortion +
        sampler.normal(index, 133) * 0.036;

      localY =
        geometry.offsetY +
        Math.sin(angle) *
          radius *
          geometry.minorScale *
          distortion +
        geometry.bendStrength *
          Math.sin(angle - geometry.bendPhase) *
          radius +
        sampler.normal(index, 135) * 0.036;

      localZ =
        sampler.normal(index, 137) *
        0.14 *
        (0.46 + 0.54 * radius);
    } else if (
      mode < 0.89
    ) {
      const anchor =
        anchors[
          Math.min(
            anchors.length - 1,
            Math.floor(
              sampler.sample01(index, 140) * anchors.length,
            ),
          )
        ];

      const spreadScale =
        0.52 +
        0.64 * sampler.sample01(index, 141);

      localX =
        anchor.x +
        sampler.normal(index, 142) *
          anchor.spread *
          spreadScale;

      localY =
        anchor.y +
        sampler.normal(index, 144) *
          anchor.spread *
          spreadScale *
          (0.78 + 0.30 * anchor.gasBias);

      localZ =
        anchor.z +
        sampler.normal(index, 146) *
          anchor.spread *
          0.56;

      radius =
        Math.hypot(
          localX - geometry.offsetX,
          localY - geometry.offsetY,
        );

      starForming =
        anchor.starForming;
    } else {
      const point =
        irregularExtensionPoint(
          geometry,
          sampler,
          index,
          150,
        );

      localX =
        point.x;

      localY =
        point.y;

      localZ =
        point.z;

      radius =
        point.radius;

      extension =
        true;
    }

    const rotated =
      rotate2d(
        localX,
        localY,
        visual.orientationRadians,
      );

    const centrality =
      1 - clamp01(
        radius / 1.36,
      );

    const brightKnot =
      starForming &&
      sampler.sample01(index, 160) < 0.050;

    const rareBright =
      sampler.sample01(index, 161) <
      (
        starForming
          ? 0.018
          : extension
            ? 0.005
            : 0.008
      );

    const color =
      irregularStarColor(
        chromaticProfile,
        sampler.sample01(index, 162),
        centrality,
        starForming,
        brightKnot,
      );

    writeParticle(
      buffers,
      start + index,
      rotated.x,
      rotated.y,
      localZ,
      color.red,
      color.green,
      color.blue,
      (
        0.50 +
        1.00 * sampler.sample01(index, 163) +
        (
          brightKnot
            ? 0.95
            : 0
        )
      ) * (
        rareBright
          ? 1.70
          : 1
      ),
      0.092 +
        0.050 * centrality +
        (
          starForming
            ? 0.072
            : extension
              ? -0.012
              : 0
        ) +
        (
          brightKnot
            ? 0.16
            : 0
        ) +
        (
          rareBright
            ? 0.07
            : 0
        ),
    );
  }

  return start +
    IRREGULAR_CLUSTER_PARTICLE_COUNT;
}

function writeChromaticVolumetricGas(
  visual:
    GalaxyVisualStructure,

  geometry:
    IrregularGeometry,

  anchors:
    readonly IrregularAnchor[],

  sampler:
    DeterministicSampler,

  chromaticProfile:
    IrregularChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  for (
    let index = 0;
    index < IRREGULAR_GAS_PARTICLE_COUNT;
    index += 1
  ) {
    const mode =
      sampler.sample01(index, 220);

    let localX:
      number;

    let localY:
      number;

    let localZ:
      number;

    let radius:
      number;

    let gasBias:
      number;

    let starForming =
      false;

    if (
      mode < 0.70
    ) {
      const anchor =
        anchors[
          Math.min(
            anchors.length - 1,
            Math.floor(
              sampler.sample01(index, 221) * anchors.length,
            ),
          )
        ];

      const cloudAngle =
        TWO_PI * sampler.sample01(index, 222);

      const cloudRadius =
        anchor.spread *
        (
          0.38 +
          1.78 * Math.pow(
            sampler.sample01(index, 223),
            0.76,
          )
        );

      const plume =
        1.0 +
        0.34 * anchor.gasBias;

      localX =
        anchor.x +
        Math.cos(cloudAngle) * cloudRadius * plume +
        sampler.normal(index, 224) * 0.045;

      localY =
        anchor.y +
        Math.sin(cloudAngle) * cloudRadius *
          (0.76 + 0.32 * anchor.gasBias) +
        sampler.normal(index, 226) * 0.045;

      localZ =
        anchor.z * 0.46 +
        sampler.normal(index, 228) *
          (0.11 + 0.14 * anchor.gasBias);

      radius =
        Math.hypot(
          localX - geometry.offsetX,
          localY - geometry.offsetY,
        );

      gasBias =
        anchor.gasBias;

      starForming =
        anchor.starForming;
    } else if (
      mode < 0.88
    ) {
      const angle =
        TWO_PI * sampler.sample01(index, 230);

      radius =
        0.10 +
        1.10 * Math.pow(
          sampler.sample01(index, 231),
          0.90,
        );

      const distortion =
        irregularRadialDistortion(
          angle,
          geometry,
        );

      localX =
        geometry.offsetX +
        Math.cos(angle) *
          radius *
          geometry.majorScale *
          distortion +
        sampler.normal(index, 232) * 0.085;

      localY =
        geometry.offsetY +
        Math.sin(angle) *
          radius *
          geometry.minorScale *
          distortion +
        geometry.bendStrength *
          Math.sin(angle - geometry.bendPhase) *
          radius +
        sampler.normal(index, 234) * 0.085;

      localZ =
        sampler.normal(index, 236) *
        0.20 *
        (0.45 + 0.55 * radius);

      gasBias =
        0.26 +
        0.54 * sampler.sample01(index, 238);
    } else {
      const point =
        irregularExtensionPoint(
          geometry,
          sampler,
          index,
          240,
        );

      const spread =
        0.07 +
        0.10 * sampler.sample01(index, 250);

      localX =
        point.x +
        sampler.normal(index, 251) * spread;

      localY =
        point.y +
        sampler.normal(index, 253) * spread;

      localZ =
        point.z +
        sampler.normal(index, 255) * 0.10;

      radius =
        point.radius;

      gasBias =
        0.40 +
        0.50 * sampler.sample01(index, 257);
    }

    const rotated =
      rotate2d(
        localX,
        localY,
        visual.orientationRadians,
      );

    const centrality =
      1 - smoothstep01(
        0.16,
        1.30,
        radius,
      );

    const paletteVariation =
      sampler.sample01(index, 260);

    const dominantMix =
      clamp01(
        0.58 +
        0.24 * gasBias +
        0.10 * centrality,
      );

    const baseColor =
      mixColor(
        chromaticProfile.gasSecondary,
        chromaticProfile.gasDominant,
        dominantMix,
      );

    const accentColor =
      paletteVariation < 0.32
        ? mixColor(
            baseColor,
            chromaticProfile.gasAccent,
            0.18 + 0.34 * sampler.sample01(index, 261),
          )
        : paletteVariation < 0.68
          ? mixColor(
              baseColor,
              chromaticProfile.gasSecondary,
              0.08 + 0.18 * sampler.sample01(index, 262),
            )
          : mixColor(
              baseColor,
              chromaticProfile.gasAccent,
              0.12 + 0.26 * sampler.sample01(index, 263),
            );

    const color =
      mixColor(
        accentColor,
        chromaticProfile.gasWarm,
        0.04 +
        0.20 * Math.pow(centrality, 1.45) +
        (
          starForming
            ? 0.02
            : 0
        ),
      );

    const outerDiffuse =
      smoothstep01(
        0.62,
        1.42,
        radius,
      );

    writeParticle(
      buffers,
      start + index,
      rotated.x,
      rotated.y,
      localZ,
      color.red,
      color.green,
      color.blue,
      4.0 +
        3.4 * gasBias +
        1.6 * centrality +
        1.8 * outerDiffuse +
        1.3 * sampler.sample01(index, 264),
      0.026 +
        0.046 * gasBias +
        0.030 * centrality +
        0.018 * sampler.sample01(index, 265) -
        0.012 * outerDiffuse,
    );
  }

  return start +
    IRREGULAR_GAS_PARTICLE_COUNT;
}

function writeDiffuseHalo(
  visual:
    GalaxyVisualStructure,

  geometry:
    IrregularGeometry,

  sampler:
    DeterministicSampler,

  chromaticProfile:
    IrregularChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  for (
    let index = 0;
    index < IRREGULAR_HALO_PARTICLE_COUNT;
    index += 1
  ) {
    const extensionEnvelope =
      sampler.sample01(index, 300) < 0.30;

    let localX:
      number;

    let localY:
      number;

    let localZ:
      number;

    let radius:
      number;

    if (
      extensionEnvelope
    ) {
      const point =
        irregularExtensionPoint(
          geometry,
          sampler,
          index,
          310,
        );

      const outwardScale =
        1.04 +
        0.13 * sampler.sample01(index, 320);

      localX =
        geometry.offsetX +
        (point.x - geometry.offsetX) * outwardScale;

      localY =
        geometry.offsetY +
        (point.y - geometry.offsetY) * outwardScale;

      localZ =
        point.z * 1.12;

      radius =
        point.radius * outwardScale;
    } else {
      const angle =
        TWO_PI * sampler.sample01(index, 321);

      radius =
        0.76 +
        0.46 * Math.pow(
          sampler.sample01(index, 322),
          1.02,
        );

      const distortion =
        irregularRadialDistortion(
          angle,
          geometry,
        );

      localX =
        geometry.offsetX +
        Math.cos(angle) *
          radius *
          geometry.majorScale *
          distortion;

      localY =
        geometry.offsetY +
        Math.sin(angle) *
          radius *
          geometry.minorScale *
          distortion +
        geometry.bendStrength *
          Math.sin(angle - geometry.bendPhase) *
          radius;

      localZ =
        sampler.normal(index, 323) *
        0.20 * radius;
    }

    const rotated =
      rotate2d(
        localX,
        localY,
        visual.orientationRadians,
      );

    const haloColor =
      mixColor(
        chromaticProfile.haloOuter,
        chromaticProfile.gasSecondary,
        0.10 + 0.12 * sampler.sample01(index, 325),
      );

    writeParticle(
      buffers,
      start + index,
      rotated.x,
      rotated.y,
      localZ,
      haloColor.red,
      haloColor.green,
      haloColor.blue,
      0.48 +
        0.82 * sampler.sample01(index, 326),
      0.018 +
        0.044 * sampler.sample01(index, 327) +
        (
          extensionEnvelope
            ? 0.010
            : 0
        ),
    );
  }

  return start +
    IRREGULAR_HALO_PARTICLE_COUNT;
}

function createIrregularGeometry(
  visual:
    GalaxyVisualStructure,

  sampler:
    DeterministicSampler,
): IrregularGeometry {

  const lopsidedPhase =
    TWO_PI * sampler.sample01(0, 400);

  const bendPhase =
    TWO_PI * sampler.sample01(0, 401);

  const primaryExtensionPhase =
    lopsidedPhase +
    (sampler.sample01(0, 402) - 0.5) * 0.82;

  const hasSecondaryExtension =
    sampler.sample01(0, 403) > 0.40;

  return Object.freeze({
    offsetX:
      sampler.normal(0, 404) * 0.13,

    offsetY:
      sampler.normal(0, 406) * 0.13,

    majorScale:
      1.08 +
      0.24 * sampler.sample01(0, 408),

    minorScale:
      clamp(
        visual.bulgeAxisRatio *
          (0.72 + 0.12 * sampler.sample01(0, 409)),
        0.40,
        0.72,
      ),

    lopsidedPhase,

    bendPhase,

    bendStrength:
      0.10 +
      0.15 * sampler.sample01(0, 410),

    primaryExtensionPhase,

    secondaryExtensionPhase:
      primaryExtensionPhase +
      Math.PI *
        (
          0.58 +
          0.28 * sampler.sample01(0, 411)
        ),

    secondaryExtensionWeight:
      hasSecondaryExtension
        ? 0.24 +
          0.26 * sampler.sample01(0, 412)
        : 0,

    knotCount:
      4 +
      Math.floor(
        sampler.sample01(0, 413) * 4,
      ),

    gasCloudCount:
      6 +
      Math.floor(
        sampler.sample01(0, 414) * 5,
      ),
  });
}

function createIrregularAnchors(
  geometry:
    IrregularGeometry,

  sampler:
    DeterministicSampler,
): readonly IrregularAnchor[] {

  const anchors:
    IrregularAnchor[] = [];

  const anchorCount =
    Math.max(
      geometry.knotCount,
      geometry.gasCloudCount,
    );

  for (
    let index = 0;
    index < anchorCount;
    index += 1
  ) {
    const phase =
      geometry.lopsidedPhase +
      TWO_PI *
        (
          index / anchorCount
        ) +
      sampler.normal(index, 430) * 0.42;

    const radius =
      0.18 +
      0.60 * Math.pow(
        sampler.sample01(index, 432),
        0.88,
      );

    const distortion =
      irregularRadialDistortion(
        phase,
        geometry,
      );

    const gasBias =
      0.22 +
      0.78 * sampler.sample01(index, 434);

    anchors.push(
      Object.freeze({
        x:
          geometry.offsetX +
          Math.cos(phase) *
            radius *
            geometry.majorScale *
            distortion,

        y:
          geometry.offsetY +
          Math.sin(phase) *
            radius *
            geometry.minorScale *
            distortion +
          geometry.bendStrength *
            0.55 *
            Math.sin(phase - geometry.bendPhase) *
            radius,

        z:
          sampler.normal(index, 435) * 0.08,

        radius,

        spread:
          0.11 +
          0.14 * sampler.sample01(index, 437),

        starForming:
          index < geometry.knotCount &&
          sampler.sample01(index, 438) < 0.74,

        gasBias,

        temperatureBias:
          sampler.sample01(index, 439),
      }),
    );
  }

  return Object.freeze(anchors);
}

function irregularRadialDistortion(
  angle:
    number,

  geometry:
    IrregularGeometry,
): number {

  return Math.max(
    0.58,
    1 +
      0.28 * Math.cos(
        angle - geometry.lopsidedPhase,
      ) +
      0.14 * Math.sin(
        2 * angle - geometry.bendPhase,
      ) +
      0.085 * Math.cos(
        3 * angle + geometry.lopsidedPhase,
      ),
  );
}

function irregularExtensionPoint(
  geometry:
    IrregularGeometry,

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
  radius: number;
}> {

  const useSecondary =
    geometry.secondaryExtensionWeight > 0 &&
    sampler.sample01(index, channel) <
      geometry.secondaryExtensionWeight;

  const phase =
    useSecondary
      ? geometry.secondaryExtensionPhase
      : geometry.primaryExtensionPhase;

  const progression =
    Math.pow(
      sampler.sample01(index, channel + 1),
      0.72,
    );

  const radius =
    0.26 +
    0.92 * progression;

  const angularWidth =
    (
      useSecondary
        ? 0.24
        : 0.30
    ) *
    (
      0.68 +
      0.58 * progression
    );

  const angle =
    phase +
    sampler.normal(index, channel + 3) * angularWidth;

  const lateralScatter =
    0.04 +
    0.09 * progression;

  const extensionScale =
    useSecondary
      ? 1.02
      : 1.10;

  const localX =
    geometry.offsetX +
    Math.cos(angle) *
      radius *
      geometry.majorScale *
      extensionScale +
    sampler.normal(index, channel + 5) * lateralScatter;

  const localY =
    geometry.offsetY +
    Math.sin(angle) *
      radius *
      geometry.minorScale *
      extensionScale +
    geometry.bendStrength *
      Math.sin(angle - geometry.bendPhase) *
      radius +
    sampler.normal(index, channel + 7) * lateralScatter;

  return Object.freeze({
    x:
      localX,

    y:
      localY,

    z:
      sampler.normal(index, channel + 9) *
      0.16 *
      (0.60 + 0.40 * progression),

    radius:
      Math.hypot(
        localX - geometry.offsetX,
        localY - geometry.offsetY,
      ),
  });
}

function createIrregularChromaticProfile(
  visual:
    GalaxyVisualStructure,

  sampler:
    DeterministicSampler,
): IrregularChromaticProfile {

  const amber = rgb(0.96, 0.77, 0.49);
  const gold = rgb(1.00, 0.90, 0.70);
  const white = rgb(0.98, 0.98, 1.00);
  const coolWhite = rgb(0.88, 0.93, 1.00);
  const blue = rgb(0.48, 0.68, 0.98);
  const vividBlue = rgb(0.34, 0.66, 1.00);
  const cyan = rgb(0.32, 0.84, 0.96);
  const teal = rgb(0.28, 0.76, 0.73);
  const emerald = rgb(0.32, 0.82, 0.57);
  const violet = rgb(0.67, 0.43, 0.92);
  const magenta = rgb(0.88, 0.42, 0.79);
  const rose = rgb(0.95, 0.55, 0.67);
  const coral = rgb(0.98, 0.50, 0.38);

  const palettes = [
    {
      dominant: rgb(0.22, 0.66, 1.00),
      secondary: mixColor(cyan, violet, 0.22),
      accent: mixColor(rose, magenta, 0.30),
    },
    {
      dominant: rgb(0.80, 0.36, 0.94),
      secondary: mixColor(cyan, coolWhite, 0.18),
      accent: mixColor(rose, coral, 0.34),
    },
    {
      dominant: rgb(0.24, 0.82, 0.70),
      secondary: mixColor(emerald, cyan, 0.38),
      accent: mixColor(amber, coral, 0.28),
    },
    {
      dominant: rgb(0.96, 0.47, 0.29),
      secondary: mixColor(rose, violet, 0.26),
      accent: mixColor(cyan, vividBlue, 0.30),
    },
    {
      dominant: rgb(0.90, 0.40, 0.70),
      secondary: mixColor(violet, magenta, 0.28),
      accent: mixColor(teal, cyan, 0.34),
    },
    {
      dominant: rgb(0.30, 0.78, 0.92),
      secondary: mixColor(teal, emerald, 0.28),
      accent: mixColor(amber, gold, 0.32),
    },
    {
      dominant: rgb(0.46, 0.55, 1.00),
      secondary: mixColor(violet, cyan, 0.34),
      accent: mixColor(rose, amber, 0.22),
    },
    {
      dominant: rgb(0.44, 0.84, 0.48),
      secondary: mixColor(emerald, cyan, 0.32),
      accent: mixColor(magenta, rose, 0.28),
    },
  ] as const;

  const palettePhase =
    (
      sampler.sample01(0, 500) * 0.49 +
      sampler.sample01(0, 501) * 0.29 +
      sampler.sample01(0, 502) * 0.17 +
      (visual.orientationRadians / TWO_PI) * 0.05
    ) % 1;

  const primaryIndex =
    Math.floor(
      palettePhase * palettes.length,
    ) % palettes.length;

  const secondaryOffset =
    1 +
    Math.floor(
      sampler.sample01(0, 503) *
      (palettes.length - 1),
    );

  const secondaryIndex =
    (primaryIndex + secondaryOffset) % palettes.length;

  const primary =
    palettes[primaryIndex];

  const secondary =
    palettes[secondaryIndex];

  const crossBlend =
    0.06 +
    0.20 * sampler.sample01(0, 504);

  return Object.freeze({
    coreWarm:
      mixColor(
        amber,
        gold,
        0.26 + 0.20 * sampler.sample01(0, 505),
      ),

    coreWhite:
      mixColor(
        gold,
        white,
        0.30 + 0.18 * sampler.sample01(0, 506),
      ),

    starBlue:
      mixColor(
        blue,
        vividBlue,
        0.48,
      ),

    starWhite:
      mixColor(
        coolWhite,
        white,
        0.42,
      ),

    starAmber:
      mixColor(
        amber,
        gold,
        0.20,
      ),

    gasDominant:
      mixColor(
        primary.dominant,
        secondary.dominant,
        crossBlend * 0.22,
      ),

    gasSecondary:
      mixColor(
        primary.secondary,
        secondary.secondary,
        0.14 +
        0.30 * sampler.sample01(0, 507),
      ),

    gasAccent:
      mixColor(
        primary.accent,
        secondary.accent,
        0.10 +
        0.28 * sampler.sample01(0, 508),
      ),

    gasWarm:
      mixColor(
        amber,
        primary.accent,
        0.16,
      ),

    haloOuter:
      mixColor(
        mixColor(
          primary.dominant,
          primary.secondary,
          0.30,
        ),
        coolWhite,
        0.36,
      ),
  });
}

function irregularStarColor(
  chromaticProfile:
    IrregularChromaticProfile,

  temperature:
    number,

  centrality:
    number,

  starForming:
    boolean,

  brightKnot:
    boolean,
): RgbColor {

  let base:
    RgbColor;

  if (
    starForming &&
    temperature < 0.58
  ) {
    base =
      mixColor(
        chromaticProfile.starBlue,
        chromaticProfile.starWhite,
        0.12 + 0.34 * temperature,
      );
  } else if (
    temperature < 0.34
  ) {
    base =
      mixColor(
        chromaticProfile.starBlue,
        chromaticProfile.starWhite,
        temperature / 0.34,
      );
  } else if (
    temperature < 0.78
  ) {
    base =
      mixColor(
        chromaticProfile.starWhite,
        chromaticProfile.starAmber,
        (temperature - 0.34) / 0.44,
      );
  } else {
    base =
      mixColor(
        chromaticProfile.starAmber,
        chromaticProfile.coreWarm,
        (temperature - 0.78) / 0.22,
      );
  }

  if (
    brightKnot
  ) {
    return mixColor(
      base,
      chromaticProfile.starBlue,
      0.30,
    );
  }

  return mixColor(
    base,
    chromaticProfile.coreWarm,
    0.04 + 0.13 * centrality,
  );
}

function requiredVisual(
  model:
    IrregularGalaxyRenderInput,
): GalaxyVisualStructure {

  const visual =
    model.visualStructure;

  if (
    visual === null
  ) {
    throw new RangeError(
      'IRREGULAR particle generation requires detailed GalaxyVisualStructure.',
    );
  }

  return visual;
}

function createSampler(
  model:
    IrregularGalaxyRenderInput,
): DeterministicSampler {

  const source = [
    model.universeSeedNormalizedValue,
    model.generatorVersionCode,
    model.galaxyIndex,
    'GENESIS-IRREGULAR-DEDICATED-RENDERER-V1',
  ].join('|');

  let seed =
    0x811c9dc5;

  for (
    let index = 0;
    index < source.length;
    index += 1
  ) {
    seed ^=
      source.charCodeAt(index);

    seed =
      Math.imul(
        seed,
        0x01000193,
      );
  }

  const normalizedSeed =
    seed >>> 0;

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
          channel + 1,
        );

      const raw =
        Math.sqrt(-2 * Math.log(u1)) *
        Math.cos(TWO_PI * u2);

      return clamp(
        raw,
        -3,
        3,
      ) / 3;
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
      Math.imul(index + 1, 0x9e3779b1) ^
      Math.imul(channel + 1, 0x85ebca6b)
    ) >>> 0;

  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  value ^= value >>> 16;

  return (value >>> 0) / UINT32_SCALE;
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
    Math.cos(angle);

  const sine =
    Math.sin(angle);

  return Object.freeze({
    x:
      x * cosine - y * sine,

    y:
      x * sine + y * cosine,
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
      first.red * (1 - t) +
      second.red * t,

    green:
      first.green * (1 - t) +
      second.green * t,

    blue:
      first.blue * (1 - t) +
      second.blue * t,
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
    index * 3;

  buffers.positions[offset] = x;
  buffers.positions[offset + 1] = y;
  buffers.positions[offset + 2] = z;

  buffers.colors[offset] = clamp01(red);
  buffers.colors[offset + 1] = clamp01(green);
  buffers.colors[offset + 2] = clamp01(blue);

  buffers.sizes[index] =
    clamp(
      size,
      0.01,
      15.2,
    );

  buffers.opacities[index] =
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

  const minimum =
    Math.min(
      edge0,
      edge1,
    );

  const maximum =
    Math.max(
      edge0,
      edge1,
    );

  const clamped =
    clamp01(
      (value - minimum) /
      Math.max(
        EPSILON,
        maximum - minimum,
      ),
    );

  const smoothed =
    clamped *
    clamped *
    (3 - 2 * clamped);

  return edge0 <= edge1
    ? smoothed
    : 1 - smoothed;
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

  minimum:
    number,

  maximum:
    number,
): number {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}
