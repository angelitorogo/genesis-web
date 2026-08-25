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
 * Dedicated DWARF renderer.
 *
 * The previous generic renderer already treated dwarfs as a continuous
 * low-surface-brightness body, but the laboratory still looked too sparse and
 * monochromatic because the whole morphology was expressed almost entirely as
 * small stellar points.
 *
 * This dedicated renderer keeps the identity of a dwarf galaxy — compact,
 * asymmetric and without a grand-design disk — while enriching it with:
 * - a warmer central concentration,
 * - a denser continuous stellar body,
 * - family-dependent clumpy star-forming regions,
 * - true volumetric gas with one dominant hue plus secondary accents,
 * - a faint diffuse stellar/gaseous halo.
 *
 * The total render budget is slightly increased relative to the generic dwarf
 * treatment so the morphology reads better at the same point/material system.
 */
export const DWARF_CORE_PARTICLE_COUNT =
  22_000;

export const DWARF_BODY_PARTICLE_COUNT =
  108_000;

export const DWARF_CLUSTER_PARTICLE_COUNT =
  300_000;

export const DWARF_GAS_PARTICLE_COUNT =
  24_000;

export const DWARF_HALO_PARTICLE_COUNT =
  14_000;

export const DWARF_TOTAL_PARTICLE_COUNT =
  DWARF_CORE_PARTICLE_COUNT +
  DWARF_BODY_PARTICLE_COUNT +
  DWARF_CLUSTER_PARTICLE_COUNT +
  DWARF_GAS_PARTICLE_COUNT +
  DWARF_HALO_PARTICLE_COUNT;

interface DwarfGalaxyRenderInput {
  readonly universeSeedNormalizedValue:
    string | number | bigint;

  readonly generatorVersionCode:
    number;

  readonly galaxyIndex:
    string | number | bigint;

  readonly visualStructure:
    GalaxyVisualStructure | null;
}

export interface DwarfGalaxyParticleLayout {
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

interface DwarfGeometry {
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

  readonly warpPhase:
    number;

  readonly radialTwist:
    number;

  readonly clusterCount:
    number;
}

interface DwarfAnchor {
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
}

interface DwarfChromaticProfile {
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

  readonly haloOuter:
    RgbColor;
}

export function generateDwarfGalaxyParticleLayout(
  model:
    DwarfGalaxyRenderInput,
): DwarfGalaxyParticleLayout {

  const visual =
    requiredVisual(
      model,
    );

  const buffers:
    ParticleBuffers =
    {
      positions:
        new Float32Array(
          DWARF_TOTAL_PARTICLE_COUNT * 3,
        ),

      colors:
        new Float32Array(
          DWARF_TOTAL_PARTICLE_COUNT * 3,
        ),

      sizes:
        new Float32Array(
          DWARF_TOTAL_PARTICLE_COUNT,
        ),

      opacities:
        new Float32Array(
          DWARF_TOTAL_PARTICLE_COUNT,
        ),
    };

  const sampler =
    createSampler(
      model,
    );

  const chromaticProfile =
    createDwarfChromaticProfile(
      visual,
      sampler,
    );

  const geometry =
    createDwarfGeometry(
      visual,
      sampler,
    );

  const anchors =
    createDwarfAnchors(
      geometry,
      sampler,
    );

  let cursor =
    0;

  cursor =
    writeWarmCore(
      visual,
      geometry,
      sampler,
      chromaticProfile,
      buffers,
      cursor,
    );

  cursor =
    writeDiffuseBody(
      visual,
      geometry,
      anchors,
      sampler,
      chromaticProfile,
      buffers,
      cursor,
    );

  cursor =
    writeClumpyBody(
      visual,
      geometry,
      anchors,
      sampler,
      chromaticProfile,
      buffers,
      cursor,
    );

  cursor =
    writeChromaticGas(
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
    DWARF_TOTAL_PARTICLE_COUNT
  ) {
    throw new Error(
      'DWARF dedicated renderer cursor invariant broken.',
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
      DWARF_TOTAL_PARTICLE_COUNT,
  });
}

function writeWarmCore(
  visual:
    GalaxyVisualStructure,

  geometry:
    DwarfGeometry,

  sampler:
    DeterministicSampler,

  chromaticProfile:
    DwarfChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  const bulgeRadius =
    visual.bulgeRadiusNormalized;

  for (
    let index = 0;
    index < DWARF_CORE_PARTICLE_COUNT;
    index += 1
  ) {
    const radial =
      Math.pow(
        sampler.sample01(
          index,
          100,
        ),
        0.56,
      ) *
      bulgeRadius *
      2.25;

    const angle =
      TWO_PI *
      sampler.sample01(
        index,
        101,
      );

    const compactness =
      1 -
      smoothstep01(
        0,
        bulgeRadius * 2.25,
        radial,
      );

    const localX =
      geometry.offsetX * 0.32 +
      Math.cos(
        angle,
      ) *
        radial *
        (0.98 + 0.28 * compactness) *
        geometry.elongation;

    const localY =
      geometry.offsetY * 0.32 +
      Math.sin(
        angle,
      ) *
        radial *
        (0.92 + 0.18 * compactness) *
        geometry.axisRatio;

    const rotated =
      rotate2d(
        localX,
        localY,
        visual.orientationRadians,
      );

    const z =
      sampler.normal(
        index,
        102,
      ) *
      0.11 *
      (0.34 + 0.66 * radial);

    const whiteMix =
      0.30 +
      0.44 *
      sampler.sample01(
        index,
        103,
      );

    const color =
      mixColor(
        chromaticProfile.coreWarm,
        chromaticProfile.coreWhite,
        whiteMix,
      );

    const rareBright =
      sampler.sample01(
        index,
        104,
      ) < 0.038;

    writeParticle(
      buffers,
      start + index,
      rotated.x,
      rotated.y,
      z,
      color.red,
      color.green,
      color.blue,
      0.92 +
        1.00 * compactness +
        0.34 * sampler.sample01(index, 105) +
        (rareBright ? 0.62 : 0),
      0.19 +
        0.26 * compactness +
        0.03 * sampler.sample01(index, 106),
    );
  }

  return start +
    DWARF_CORE_PARTICLE_COUNT;
}

function writeDiffuseBody(
  visual:
    GalaxyVisualStructure,

  geometry:
    DwarfGeometry,

  anchors:
    readonly DwarfAnchor[],

  sampler:
    DeterministicSampler,

  chromaticProfile:
    DwarfChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  for (
    let index = 0;
    index < DWARF_BODY_PARTICLE_COUNT;
    index += 1
  ) {
    const angle =
      TWO_PI * sampler.sample01(index, 200);

    const regime =
      sampler.sample01(index, 201);

    const radialSample =
      sampler.sample01(index, 202);

    const radius =
      regime < 0.60
        ? 0.92 * Math.pow(radialSample, 1.10)
        : 0.24 + 0.86 * Math.pow(radialSample, 0.88);

    const bodyWave =
      1 +
      0.18 * Math.cos(angle - geometry.lopsidedPhase) +
      0.06 * Math.sin(2 * angle + geometry.warpPhase) +
      0.05 * Math.cos(3 * angle - geometry.warpPhase);

    const twist =
      geometry.radialTwist * radius;

    let localX =
      geometry.offsetX +
      Math.cos(angle + twist) *
        radius *
        geometry.elongation *
        bodyWave;

    let localY =
      geometry.offsetY +
      Math.sin(angle - 0.65 * twist) *
        radius *
        geometry.axisRatio +
      0.08 * radius * Math.sin(angle + geometry.warpPhase);

    const anchor =
      anchors[
        index % anchors.length
      ];

    const anchorInfluence =
      smoothstep01(
        0.94,
        0.20,
        Math.hypot(
          localX - anchor.x,
          localY - anchor.y,
        ),
      );

    localX +=
      (anchor.x - localX) * 0.030 * anchorInfluence;

    localY +=
      (anchor.y - localY) * 0.030 * anchorInfluence;

    const rotated =
      rotate2d(
        localX,
        localY,
        visual.orientationRadians,
      );

    const centrality =
      1 - Math.min(1, radius / 1.04);

    const starTemperature =
      sampler.sample01(index, 203);

    const color =
      dwarfStarColor(
        chromaticProfile,
        starTemperature,
        centrality,
        anchor.starForming,
      );

    const bright =
      sampler.sample01(index, 204) <
      (anchor.starForming ? 0.010 : 0.004);

    writeParticle(
      buffers,
      start + index,
      rotated.x,
      rotated.y,
      sampler.normal(index, 205) * 0.14 * (0.38 + 0.62 * radius),
      color.red,
      color.green,
      color.blue,
      0.44 +
        0.40 * centrality +
        0.24 * sampler.sample01(index, 206) +
        (bright ? 0.72 : 0),
      0.082 +
        0.072 * centrality +
        0.018 * anchorInfluence +
        0.016 * sampler.sample01(index, 207) +
        (bright ? 0.028 : 0),
    );
  }

  return start +
    DWARF_BODY_PARTICLE_COUNT;
}

function writeClumpyBody(
  visual:
    GalaxyVisualStructure,

  geometry:
    DwarfGeometry,

  anchors:
    readonly DwarfAnchor[],

  sampler:
    DeterministicSampler,

  chromaticProfile:
    DwarfChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  for (
    let index = 0;
    index < DWARF_CLUSTER_PARTICLE_COUNT;
    index += 1
  ) {
    const anchor =
      anchors[
        index % anchors.length
      ];

    const compactness =
      Math.pow(
        sampler.sample01(index, 300),
        anchor.starForming ? 1.42 : 1.18,
      );

    const orbitAngle =
      TWO_PI * sampler.sample01(index, 301);

    const radial =
      anchor.radius +
      anchor.spread * compactness;

    const localX =
      anchor.x +
      Math.cos(orbitAngle) * radial * geometry.elongation +
      sampler.normal(index, 302) * anchor.spread * 0.44;

    const localY =
      anchor.y +
      Math.sin(orbitAngle) * radial * geometry.axisRatio +
      sampler.normal(index, 303) * anchor.spread * 0.40;

    const rotated =
      rotate2d(
        localX,
        localY,
        visual.orientationRadians,
      );

    const projectedRadius =
      Math.hypot(localX, localY);

    const centrality =
      1 - Math.min(1, projectedRadius / 1.10);

    const temperature =
      sampler.sample01(index, 304);

    const color =
      dwarfStarColor(
        chromaticProfile,
        temperature,
        centrality,
        anchor.starForming,
      );

    const bright =
      sampler.sample01(index, 305) <
      (anchor.starForming ? 0.015 : 0.005);

    const starFormingBoost =
      anchor.starForming
        ? 0.10 + 0.08 * anchor.gasBias
        : 0;

    writeParticle(
      buffers,
      start + index,
      rotated.x,
      rotated.y,
      anchor.z + sampler.normal(index, 306) * 0.13 * (0.4 + radial),
      color.red,
      color.green,
      color.blue,
      0.48 +
        0.34 * centrality +
        0.26 * sampler.sample01(index, 307) +
        starFormingBoost +
        (bright ? 0.82 : 0),
      0.088 +
        0.064 * centrality +
        0.016 * sampler.sample01(index, 308) +
        starFormingBoost * 0.18 +
        (bright ? 0.030 : 0),
    );
  }

  return start +
    DWARF_CLUSTER_PARTICLE_COUNT;
}

function writeChromaticGas(
  visual:
    GalaxyVisualStructure,

  geometry:
    DwarfGeometry,

  anchors:
    readonly DwarfAnchor[],

  sampler:
    DeterministicSampler,

  chromaticProfile:
    DwarfChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  for (
    let index = 0;
    index < DWARF_GAS_PARTICLE_COUNT;
    index += 1
  ) {
    const anchor =
      anchors[
        index % anchors.length
      ];

    const localMode =
      sampler.sample01(index, 400);

    const cloudAngle =
      TWO_PI * sampler.sample01(index, 401);

    const radial =
      localMode < 0.72
        ? anchor.radius * (0.72 + 0.68 * sampler.sample01(index, 402))
        : 0.24 + 0.96 * Math.pow(sampler.sample01(index, 402), 0.92);

    const shapeStretch =
      1.04 + 0.28 * anchor.gasBias;

    const localX =
      geometry.offsetX * 0.6 +
      anchor.x * (localMode < 0.72 ? 1 : 0.46) +
      Math.cos(cloudAngle) * radial * shapeStretch * geometry.elongation +
      sampler.normal(index, 403) * (0.10 + 0.12 * anchor.gasBias);

    const localY =
      geometry.offsetY * 0.6 +
      anchor.y * (localMode < 0.72 ? 1 : 0.46) +
      Math.sin(cloudAngle) * radial * geometry.axisRatio +
      0.10 * radial * Math.sin(cloudAngle + geometry.warpPhase);

    const rotated =
      rotate2d(
        localX,
        localY,
        visual.orientationRadians,
      );

    const normalizedRadius =
      Math.min(1.28, Math.hypot(localX, localY));

    const density =
      1 - smoothstep01(0.14, 1.08, normalizedRadius);

    const dominantMix =
      clamp01(
        0.62 + 0.26 * density + 0.10 * anchor.gasBias,
      );

    const secondaryMix =
      (anchor.starForming ? 0.14 : 0.06) +
      0.22 * sampler.sample01(index, 404);

    const accentMix =
      0.06 +
      0.10 * density +
      0.12 * sampler.sample01(index, 405) +
      (anchor.starForming ? 0.08 : 0);

    const paletteVariation =
      sampler.sample01(index, 409);

    const baseColor =
      mixColor(
        chromaticProfile.gasSecondary,
        chromaticProfile.gasDominant,
        dominantMix,
      );

    const variedColor =
      paletteVariation < 0.28
        ? mixColor(
            baseColor,
            chromaticProfile.gasAccent,
            0.16 + 0.24 * secondaryMix,
          )
        : paletteVariation < 0.62
          ? mixColor(
              baseColor,
              chromaticProfile.gasSecondary,
              0.10 + 0.14 * secondaryMix,
            )
          : mixColor(
              baseColor,
              chromaticProfile.gasAccent,
              0.18 + 0.30 * secondaryMix,
            );

    const color =
      mixColor(
        variedColor,
        chromaticProfile.coreWarm,
        0.05 + 0.18 * Math.pow(density, 1.35) + 0.14 * accentMix,
      );

    writeParticle(
      buffers,
      start + index,
      rotated.x,
      rotated.y,
      anchor.z * 0.5 + sampler.normal(index, 406) * 0.20 * (0.34 + normalizedRadius),
      color.red,
      color.green,
      color.blue,
      4.6 +
        3.4 * density +
        2.4 * anchor.gasBias +
        1.6 * sampler.sample01(index, 407),
      0.032 +
        0.052 * density +
        0.020 * anchor.gasBias +
        0.018 * sampler.sample01(index, 408),
    );
  }

  return start +
    DWARF_GAS_PARTICLE_COUNT;
}

function writeDiffuseHalo(
  visual:
    GalaxyVisualStructure,

  geometry:
    DwarfGeometry,

  sampler:
    DeterministicSampler,

  chromaticProfile:
    DwarfChromaticProfile,

  buffers:
    ParticleBuffers,

  start:
    number,
): number {

  for (
    let index = 0;
    index < DWARF_HALO_PARTICLE_COUNT;
    index += 1
  ) {
    const angle =
      TWO_PI * sampler.sample01(index, 500);

    const radius =
      0.74 + 0.58 * Math.pow(sampler.sample01(index, 501), 0.94);

    const lopsidedness =
      1 + 0.15 * Math.cos(angle - geometry.lopsidedPhase);

    const localX =
      geometry.offsetX * 0.45 +
      Math.cos(angle) * radius * geometry.elongation * 1.06 * lopsidedness;

    const localY =
      geometry.offsetY * 0.45 +
      Math.sin(angle) * radius * geometry.axisRatio * 1.04 +
      0.06 * radius * Math.sin(angle + geometry.warpPhase);

    const rotated =
      rotate2d(
        localX,
        localY,
        visual.orientationRadians,
      );

    const fade =
      1 - smoothstep01(0.78, 1.30, radius);

    const starGasMix =
      sampler.sample01(index, 502);

    const color =
      starGasMix < 0.58
        ? mixColor(
            chromaticProfile.haloOuter,
            chromaticProfile.starWhite,
            0.34 + 0.22 * sampler.sample01(index, 503),
          )
        : mixColor(
            chromaticProfile.haloOuter,
            chromaticProfile.gasSecondary,
            0.28 + 0.20 * sampler.sample01(index, 503),
          );

    writeParticle(
      buffers,
      start + index,
      rotated.x,
      rotated.y,
      sampler.normal(index, 504) * 0.18 * (0.34 + radius),
      color.red,
      color.green,
      color.blue,
      0.52 + 0.28 * fade + 0.12 * sampler.sample01(index, 505),
      0.020 + 0.028 * fade + 0.010 * sampler.sample01(index, 506),
    );
  }

  return start +
    DWARF_HALO_PARTICLE_COUNT;
}

function createDwarfGeometry(
  visual:
    GalaxyVisualStructure,

  sampler:
    DeterministicSampler,
): DwarfGeometry {

  const armContribution =
    Math.max(
      0,
      visual.arms.length,
    );

  return Object.freeze({
    offsetX:
      sampler.normal(0, 600) * 0.08,

    offsetY:
      sampler.normal(0, 601) * 0.08,

    elongation:
      1.18 + 0.38 * sampler.sample01(0, 602),

    axisRatio:
      clamp(
        visual.bulgeAxisRatio * 0.88,
        0.52,
        0.84,
      ),

    lopsidedPhase:
      TWO_PI * sampler.sample01(0, 603),

    warpPhase:
      TWO_PI * sampler.sample01(0, 604),

    radialTwist:
      0.05 + 0.18 * sampler.sample01(0, 605),

    clusterCount:
      Math.max(
        7,
        Math.min(
          12,
          5 + armContribution + Math.round(2 * sampler.sample01(0, 606)),
        ),
      ),
  });
}

function createDwarfAnchors(
  geometry:
    DwarfGeometry,

  sampler:
    DeterministicSampler,
): readonly DwarfAnchor[] {

  const anchors: DwarfAnchor[] = [];

  for (
    let index = 0;
    index < geometry.clusterCount;
    index += 1
  ) {
    const angle =
      TWO_PI * (index / geometry.clusterCount) +
      0.42 * sampler.normal(index, 700) +
      geometry.lopsidedPhase * 0.18;

    const radius =
      0.10 +
      0.62 * Math.pow(sampler.sample01(index, 701), 1.04);

    const spread =
      0.08 +
      0.20 * sampler.sample01(index, 702);

    const localStretch =
      0.90 +
      0.24 * sampler.sample01(index, 703);

    anchors.push(
      Object.freeze({
        x:
          geometry.offsetX +
          Math.cos(angle) *
            radius *
            geometry.elongation *
            localStretch,

        y:
          geometry.offsetY +
          Math.sin(angle) *
            radius *
            geometry.axisRatio *
            (0.90 + 0.16 * sampler.sample01(index, 704)),

        z:
          sampler.normal(index, 705) * 0.08,

        radius:
          radius,

        spread,

        starForming:
          sampler.sample01(index, 706) < 0.52,

        gasBias:
          0.24 + 0.76 * sampler.sample01(index, 707),
      }),
    );
  }

  return Object.freeze(anchors);
}

function createDwarfChromaticProfile(
  visual:
    GalaxyVisualStructure,

  sampler:
    DeterministicSampler,
): DwarfChromaticProfile {

  const temperatureMix =
    sampler.sample01(0, 801);

  const amber = rgb(0.94, 0.79, 0.58);
  const gold = rgb(0.99, 0.91, 0.77);
  const white = rgb(0.96, 0.97, 1.00);
  const coolWhite = rgb(0.88, 0.92, 0.99);
  const blue = rgb(0.60, 0.75, 0.98);
  const vividBlue = rgb(0.52, 0.70, 0.98);
  const cyan = rgb(0.45, 0.83, 0.92);
  const teal = rgb(0.42, 0.76, 0.78);
  const emerald = rgb(0.43, 0.82, 0.64);
  const violet = rgb(0.66, 0.52, 0.88);
  const magenta = rgb(0.82, 0.52, 0.86);
  const rose = rgb(0.90, 0.64, 0.74);

  const palettes = [
    {
      dominant: rgb(0.18, 0.68, 0.96),
      secondary: mixColor(violet, coolWhite, 0.18),
      accent: mixColor(amber, gold, 0.36),
    },
    {
      dominant: rgb(0.96, 0.56, 0.28),
      secondary: mixColor(cyan, vividBlue, 0.34),
      accent: mixColor(rose, gold, 0.34),
    },
    {
      dominant: rgb(0.72, 0.38, 0.92),
      secondary: mixColor(cyan, coolWhite, 0.18),
      accent: mixColor(amber, rose, 0.22),
    },
    {
      dominant: rgb(0.26, 0.78, 0.74),
      secondary: mixColor(amber, gold, 0.24),
      accent: mixColor(violet, magenta, 0.26),
    },
    {
      dominant: rgb(0.34, 0.56, 0.98),
      secondary: mixColor(teal, cyan, 0.42),
      accent: mixColor(amber, gold, 0.30),
    },
    {
      dominant: rgb(0.86, 0.44, 0.66),
      secondary: mixColor(emerald, cyan, 0.44),
      accent: mixColor(gold, white, 0.32),
    },
  ] as const;

  const palettePhase =
    (
      sampler.sample01(0, 800) * 0.52 +
      sampler.sample01(0, 802) * 0.31 +
      sampler.sample01(0, 803) * 0.17 +
      (visual.orientationRadians / TWO_PI) * 0.07
    ) % 1;

  const primaryIndex =
    Math.floor(
      palettePhase * palettes.length,
    ) % palettes.length;

  const secondaryOffset =
    1 + Math.floor(
      sampler.sample01(0, 804) * (palettes.length - 1),
    );

  const secondaryIndex =
    (primaryIndex + secondaryOffset) % palettes.length;

  const primary =
    palettes[
      primaryIndex
    ];

  const secondary =
    palettes[
      secondaryIndex
    ];

  const crossBlend =
    0.08 + 0.20 * sampler.sample01(0, 805);

  return Object.freeze({
    coreWarm:
      mixColor(
        amber,
        gold,
        0.30 + 0.22 * temperatureMix,
      ),

    coreWhite:
      mixColor(
        gold,
        white,
        0.38 + 0.18 * temperatureMix,
      ),

    starBlue:
      mixColor(
        blue,
        vividBlue,
        0.46,
      ),

    starWhite:
      mixColor(
        coolWhite,
        white,
        0.44,
      ),

    starAmber:
      mixColor(
        amber,
        gold,
        0.24,
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
        0.16 + 0.26 * sampler.sample01(0, 806),
      ),

    gasAccent:
      mixColor(
        primary.accent,
        secondary.accent,
        0.12 + 0.22 * sampler.sample01(0, 807),
      ),

    haloOuter:
      mixColor(
        mixColor(
          primary.dominant,
          primary.secondary,
          0.28,
        ),
        coolWhite,
        0.30,
      ),
  });
}

function dwarfStarColor(
  chromaticProfile:
    DwarfChromaticProfile,

  temperature:
    number,

  centrality:
    number,

  starForming:
    boolean,
): RgbColor {

  const base =
    temperature < 0.20
      ? mixColor(
          chromaticProfile.starAmber,
          chromaticProfile.coreWarm,
          0.28 + 0.34 * centrality,
        )
      : temperature < 0.68
        ? mixColor(
            chromaticProfile.starWhite,
            chromaticProfile.coreWhite,
            0.18 + 0.20 * centrality,
          )
        : mixColor(
            chromaticProfile.starBlue,
            chromaticProfile.starWhite,
            0.12 + 0.12 * (1 - centrality),
          );

  return starForming
    ? mixColor(
        base,
        chromaticProfile.gasSecondary,
        0.04 + 0.08 * (1 - centrality),
      )
    : base;
}

function requiredVisual(
  model:
    DwarfGalaxyRenderInput,
): GalaxyVisualStructure {

  const visual =
    model.visualStructure;

  if (
    visual === null
  ) {
    throw new RangeError(
      'DWARF particle generation requires detailed GalaxyVisualStructure.',
    );
  }

  return visual;
}

function createSampler(
  model:
    DwarfGalaxyRenderInput,
): DeterministicSampler {

  const source = [
    model.universeSeedNormalizedValue,
    model.generatorVersionCode,
    model.galaxyIndex,
    'GENESIS-DWARF-DEDICATED-RENDERER-V1',
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

      return clamp(raw, -3, 3) / 3;
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
    clamp01(amount);

  return Object.freeze({
    red:
      first.red * (1 - t) + second.red * t,

    green:
      first.green * (1 - t) + second.green * t,

    blue:
      first.blue * (1 - t) + second.blue * t,
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

  buffers.sizes[index] = Math.max(0.01, size);
  buffers.opacities[index] = clamp01(opacity);
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
    Math.min(edge0, edge1);

  const maximum =
    Math.max(edge0, edge1);

  const clamped =
    clamp01(
      (value - minimum) /
      Math.max(EPSILON, maximum - minimum),
    );

  const smoothed =
    clamped * clamped * (3 - 2 * clamped);

  return edge0 <= edge1
    ? smoothed
    : 1 - smoothed;
}

function clamp01(
  value:
    number,
): number {
  return clamp(value, 0, 1);
}

function clamp(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {
  return Math.min(maximum, Math.max(minimum, value));
}
