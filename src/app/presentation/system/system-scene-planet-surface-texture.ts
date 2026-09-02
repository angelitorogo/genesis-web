import {
  type SystemScenePlanetTextureData,
} from './system-scene-planet-texture';

import {
  type SystemScenePlanetSurfacePresentationSnapshot,
} from './system-scene-planet-surface-presentation';

export interface SystemScenePlanetSurfaceTextureInput {
  readonly systemIdentity: string;
  readonly planetId: string;
  readonly baseTexture: SystemScenePlanetTextureData;
  readonly surface: SystemScenePlanetSurfacePresentationSnapshot;
}

export interface SystemScenePlanetSurfaceTextureData {
  readonly version: 1;
  readonly width: number;
  readonly height: number;
  readonly rgba: Uint8Array;
  readonly emissiveRgba: Uint8Array | null;
  readonly cloudRgba: Uint8Array | null;
  readonly measuredLiquidCoverageFraction01: number | null;
  readonly measuredIceCoverageFraction01: number | null;
  readonly measuredDesertCoverageFraction01: number | null;
  readonly measuredVolcanicCoverageFraction01: number | null;
  readonly measuredCloudCoverageFraction01: number | null;
}

interface PixelField {
  readonly uniqueIndex: number;
  readonly x: number;
  readonly y: number;
  readonly latitude01: number;
  readonly equator01: number;
  readonly elevation: number;
  readonly iceScore: number;
  readonly oceanScore: number;
  readonly desertScore: number;
  readonly volcanicScore: number;
  readonly cloudScore: number;
}

const LIQUID = 1;
const ICE = 2;
const LAND = 3;
const DESERT = 4;

/**
 * Point-25.3 semantic surface compositor.
 *
 * 25.2 supplies stable generic albedo. 25.3 overlays semantic surface classes
 * from the immutable phase-20 projection: the requested liquid/ice coverages
 * are honored as pixel-area targets, remaining solid surface becomes exposed
 * mineral land, and desert/volcanic/cloud masks are presentation proxies whose
 * target fractions are already frozen in the snapshot. No result is persisted
 * or written back to domain state.
 */
export function buildSystemScenePlanetSurfaceTextureV1(
  input: SystemScenePlanetSurfaceTextureInput,
): SystemScenePlanetSurfaceTextureData {
  assertInput(input);

  const { baseTexture, surface } = input;
  const width = baseTexture.width;
  const height = baseTexture.height;

  if (!surface.solidSurfaceAvailable) {
    return Object.freeze({
      version: 1 as const,
      width,
      height,
      rgba: new Uint8Array(baseTexture.rgba),
      emissiveRgba: null,
      cloudRgba: null,
      measuredLiquidCoverageFraction01: null,
      measuredIceCoverageFraction01: null,
      measuredDesertCoverageFraction01: null,
      measuredVolcanicCoverageFraction01: null,
      measuredCloudCoverageFraction01: null,
    });
  }

  const uniqueWidth = width - 1;
  const uniquePixelCount = uniqueWidth * height;
  const seed = surfaceSeed(input.systemIdentity, input.planetId);
  const fields = buildFields(baseTexture, seed, uniqueWidth, height);
  const semantic = new Uint8Array(uniquePixelCount);
  semantic.fill(LAND);

  const iceTarget = coverageCount(
    surface.surfaceIceCoverageFraction01!,
    uniquePixelCount,
  );
  const liquidTarget = coverageCount(
    surface.surfaceLiquidWaterCoverageFraction01!,
    uniquePixelCount,
  );

  const iceSelected = selectTop(fields, iceTarget, field => field.iceScore);
  for (const index of iceSelected) {
    semantic[index] = ICE;
  }

  const liquidCandidates = fields.filter(field => semantic[field.uniqueIndex] === LAND);
  const liquidSelected = selectTop(
    liquidCandidates,
    Math.min(liquidTarget, liquidCandidates.length),
    field => field.oceanScore,
  );
  for (const index of liquidSelected) {
    semantic[index] = LIQUID;
  }

  const landFields = fields.filter(field => semantic[field.uniqueIndex] === LAND);
  const desertTarget = coverageCount(
    surface.presentationDesertCoverageFraction01 ?? 0,
    uniquePixelCount,
  );
  const desertSelected = selectTop(
    landFields,
    Math.min(desertTarget, landFields.length),
    field => field.desertScore,
  );
  for (const index of desertSelected) {
    semantic[index] = DESERT;
  }

  const volcanicTarget = coverageCount(
    surface.presentationVolcanicCoverageFraction01 ?? 0,
    uniquePixelCount,
  );
  const solidFields = fields.filter(field => semantic[field.uniqueIndex] !== LIQUID && semantic[field.uniqueIndex] !== ICE);
  const volcanicSelected = new Set(
    selectTop(
      solidFields,
      Math.min(volcanicTarget, solidFields.length),
      field => field.volcanicScore,
    ),
  );

  const rgba = new Uint8Array(width * height * 4);
  const emissiveRgba = volcanicSelected.size > 0
    ? new Uint8Array(width * height * 4)
    : null;

  for (const field of fields) {
    const baseOffset = (field.y * width + field.x) * 4;
    const semanticKind = semantic[field.uniqueIndex]!;
    const baseRgb: [number, number, number] = [
      baseTexture.rgba[baseOffset]!,
      baseTexture.rgba[baseOffset + 1]!,
      baseTexture.rgba[baseOffset + 2]!,
    ];

    const color = semanticColor(
      semanticKind,
      baseRgb,
      field,
      seed,
    );

    rgba[baseOffset] = color[0];
    rgba[baseOffset + 1] = color[1];
    rgba[baseOffset + 2] = color[2];
    rgba[baseOffset + 3] = 255;

    if (emissiveRgba !== null) {
      const volcanic = volcanicSelected.has(field.uniqueIndex);
      const heat = volcanic
        ? clamp01(0.30 + field.volcanicScore * 0.70)
        : 0;
      emissiveRgba[baseOffset] = toByte(255 * heat);
      emissiveRgba[baseOffset + 1] = toByte(74 * heat);
      emissiveRgba[baseOffset + 2] = toByte(12 * heat);
      emissiveRgba[baseOffset + 3] = 255;

      if (volcanic) {
        const darkened = mixRgb(color, [31, 25, 22], 0.42);
        rgba[baseOffset] = darkened[0];
        rgba[baseOffset + 1] = darkened[1];
        rgba[baseOffset + 2] = darkened[2];
      }
    }
  }

  copySeamColumn(rgba, width, height);
  if (emissiveRgba !== null) {
    copySeamColumn(emissiveRgba, width, height);
  }

  const cloudTarget = coverageCount(
    surface.presentationCloudCoverageFraction01 ?? 0,
    uniquePixelCount,
  );
  const cloudRgba = cloudTarget > 0
    ? buildCloudTexture(fields, cloudTarget, width, height)
    : null;

  return Object.freeze({
    version: 1 as const,
    width,
    height,
    rgba,
    emissiveRgba,
    cloudRgba,
    measuredLiquidCoverageFraction01:
      countSemantic(semantic, LIQUID) / uniquePixelCount,
    measuredIceCoverageFraction01:
      countSemantic(semantic, ICE) / uniquePixelCount,
    measuredDesertCoverageFraction01:
      countSemantic(semantic, DESERT) / uniquePixelCount,
    measuredVolcanicCoverageFraction01:
      volcanicSelected.size / uniquePixelCount,
    measuredCloudCoverageFraction01:
      cloudRgba === null ? 0 : cloudTarget / uniquePixelCount,
  });
}

function buildFields(
  baseTexture: SystemScenePlanetTextureData,
  seed: number,
  uniqueWidth: number,
  height: number,
): PixelField[] {
  const fields: PixelField[] = [];

  for (let y = 0; y < height; y += 1) {
    const v = (y + 0.5) / height;
    const latitude = (v - 0.5) * Math.PI;
    const latitude01 = Math.abs(Math.sin(latitude));
    const equator01 = 1 - latitude01;

    for (let x = 0; x < uniqueWidth; x += 1) {
      const uniqueIndex = y * uniqueWidth + x;
      const offset = (y * baseTexture.width + x) * 4;
      const luminance =
        baseTexture.rgba[offset]! * 0.2126 +
        baseTexture.rgba[offset + 1]! * 0.7152 +
        baseTexture.rgba[offset + 2]! * 0.0722;
      const longitude = x / uniqueWidth * Math.PI * 2;
      const cosLatitude = Math.cos(latitude);
      const sphereX = cosLatitude * Math.cos(longitude);
      const sphereY = Math.sin(latitude);
      const sphereZ = cosLatitude * Math.sin(longitude);

      // Coherent spherical fields keep oceans/land/clouds as readable regions
      // rather than per-pixel speckle. They are still presentation-only masks:
      // exact physical coverages remain the frozen phase-20 inputs above.
      const macro = surfaceFbm3(
        sphereX * 2.15,
        sphereY * 2.15,
        sphereZ * 2.15,
        seed ^ 0x54a3b19d,
        4,
      );
      const detail = surfaceFbm3(
        sphereX * 6.4 + 5.1,
        sphereY * 6.4 - 2.9,
        sphereZ * 6.4 + 7.7,
        seed ^ 0x8d12e4f3,
        3,
      );
      const storm = surfaceFbm3(
        sphereX * 3.65 - 9.4,
        sphereY * 2.35 + 3.2,
        sphereZ * 3.65 - 1.7,
        seed ^ 0xc4ceb9fe,
        4,
      );
      const elevation = clamp01(
        0.54 * (luminance / 255) +
          0.32 * macro +
          0.14 * detail,
      );

      fields.push({
        uniqueIndex,
        x,
        y,
        latitude01,
        equator01,
        elevation,
        iceScore: clamp01(
          0.72 * latitude01 +
            0.22 * (1 - elevation) +
            0.06 * macro,
        ),
        oceanScore: clamp01(
          0.76 * (1 - elevation) +
            0.18 * macro +
            0.06 * equator01,
        ),
        desertScore: clamp01(
          0.46 * equator01 +
            0.24 * elevation +
            0.22 * detail +
            0.08 * (1 - macro),
        ),
        volcanicScore: clamp01(
          0.49 * storm +
            0.30 * detail +
            0.21 * elevation,
        ),
        cloudScore: clamp01(
          0.56 * storm +
            0.27 * macro +
            0.17 * (0.55 + equator01 * 0.45),
        ),
      });
    }
  }

  return fields;
}

function semanticColor(
  kind: number,
  base: [number, number, number],
  field: PixelField,
  seed: number,
): [number, number, number] {
  const micro = smoothPixelNoise01(seed, field.x, field.y, 7);

  if (kind === LIQUID) {
    const shallow = clamp01(0.28 + field.elevation * 0.48 + micro * 0.18);
    return mixRgb(
      [5, 31, 78],
      [29, 126, 174],
      shallow,
    );
  }

  if (kind === ICE) {
    const tint = clamp01(0.48 + field.latitude01 * 0.34 + micro * 0.18);
    return mixRgb(
      [145, 190, 219],
      [242, 249, 252],
      tint,
    );
  }

  if (kind === DESERT) {
    const mineral = mixRgb(
      [128, 80, 48],
      [216, 173, 102],
      clamp01(0.22 + field.elevation * 0.46 + micro * 0.32),
    );
    return mixRgb(base, mineral, 0.76);
  }

  const continentalMineral = mixRgb(
    [75, 68, 61],
    [174, 151, 119],
    clamp01(0.22 + field.elevation * 0.54 + micro * 0.22),
  );
  return mixRgb(base, continentalMineral, 0.58);
}

function buildCloudTexture(
  fields: PixelField[],
  cloudTarget: number,
  width: number,
  height: number,
): Uint8Array {
  const selected = new Set(
    selectTop(fields, Math.min(cloudTarget, fields.length), field => field.cloudScore),
  );
  const rgba = new Uint8Array(width * height * 4);

  for (const field of fields) {
    const offset = (field.y * width + field.x) * 4;
    if (!selected.has(field.uniqueIndex)) {
      rgba[offset + 3] = 0;
      continue;
    }

    const brightness = clamp01(0.72 + field.cloudScore * 0.28);
    rgba[offset] = toByte(236 * brightness);
    rgba[offset + 1] = toByte(242 * brightness);
    rgba[offset + 2] = toByte(247 * brightness);
    rgba[offset + 3] = toByte(115 + field.cloudScore * 105);
  }

  copySeamColumn(rgba, width, height);
  return rgba;
}

function selectTop(
  fields: PixelField[],
  count: number,
  score: (field: PixelField) => number,
): number[] {
  if (count <= 0) {
    return [];
  }

  return fields
    .map(field => ({ index: field.uniqueIndex, score: score(field) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, count)
    .map(entry => entry.index);
}

function coverageCount(fraction01: number, count: number): number {
  return Math.max(0, Math.min(count, Math.round(fraction01 * count)));
}

function countSemantic(values: Uint8Array, kind: number): number {
  let count = 0;
  for (const value of values) {
    if (value === kind) {
      count += 1;
    }
  }
  return count;
}

function copySeamColumn(rgba: Uint8Array, width: number, height: number): void {
  for (let y = 0; y < height; y += 1) {
    const first = y * width * 4;
    const last = (y * width + width - 1) * 4;
    rgba[last] = rgba[first]!;
    rgba[last + 1] = rgba[first + 1]!;
    rgba[last + 2] = rgba[first + 2]!;
    rgba[last + 3] = rgba[first + 3]!;
  }
}

function surfaceSeed(systemIdentity: string, planetId: string): number {
  const key = `${systemIdentity}|${planetId}|GENESIS-25.3-SURFACE-V1`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function smoothPixelNoise01(
  seed: number,
  x: number,
  y: number,
  salt: number,
): number {
  const sample = (dx: number, dy: number): number =>
    pixelNoise01(seed, x + dx, y + dy, salt);

  return clamp01(
    sample(0, 0) * 0.40 +
      (sample(-1, 0) + sample(1, 0) + sample(0, -1) + sample(0, 1)) * 0.10 +
      (sample(-1, -1) + sample(1, -1) + sample(-1, 1) + sample(1, 1)) * 0.05,
  );
}

function pixelNoise01(seed: number, x: number, y: number, salt: number): number {
  let hash = seed ^ Math.imul(salt, 0x9e3779b9);
  hash = Math.imul(hash ^ Math.imul(x, 0x85ebca6b), 0xc2b2ae35);
  hash = Math.imul(hash ^ Math.imul(y, 0x27d4eb2d), 0x165667b1);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  return (hash >>> 0) / 0xffffffff;
}

function surfaceFbm3(
  x: number,
  y: number,
  z: number,
  seed: number,
  octaves: number,
): number {
  let amplitude = 0.5;
  let frequency = 1;
  let total = 0;
  let amplitudeTotal = 0;

  for (let octave = 0; octave < octaves; octave += 1) {
    total += surfaceValueNoise3(
      x * frequency,
      y * frequency,
      z * frequency,
      seed + Math.imul(octave + 1, 0x6d2b79f5),
    ) * amplitude;
    amplitudeTotal += amplitude;
    amplitude *= 0.5;
    frequency *= 2.03;
  }

  return total / amplitudeTotal;
}

function surfaceValueNoise3(
  x: number,
  y: number,
  z: number,
  seed: number,
): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const tx = smootherStep(x - x0);
  const ty = smootherStep(y - y0);
  const tz = smootherStep(z - z0);

  const c000 = surfaceLatticeNoise(x0, y0, z0, seed);
  const c100 = surfaceLatticeNoise(x0 + 1, y0, z0, seed);
  const c010 = surfaceLatticeNoise(x0, y0 + 1, z0, seed);
  const c110 = surfaceLatticeNoise(x0 + 1, y0 + 1, z0, seed);
  const c001 = surfaceLatticeNoise(x0, y0, z0 + 1, seed);
  const c101 = surfaceLatticeNoise(x0 + 1, y0, z0 + 1, seed);
  const c011 = surfaceLatticeNoise(x0, y0 + 1, z0 + 1, seed);
  const c111 = surfaceLatticeNoise(x0 + 1, y0 + 1, z0 + 1, seed);

  const x00 = lerpNumber(c000, c100, tx);
  const x10 = lerpNumber(c010, c110, tx);
  const x01 = lerpNumber(c001, c101, tx);
  const x11 = lerpNumber(c011, c111, tx);
  const y0Mix = lerpNumber(x00, x10, ty);
  const y1Mix = lerpNumber(x01, x11, ty);

  return lerpNumber(y0Mix, y1Mix, tz);
}

function surfaceLatticeNoise(
  x: number,
  y: number,
  z: number,
  seed: number,
): number {
  let hash = seed | 0;
  hash = Math.imul(hash ^ Math.imul(x, 0x27d4eb2d), 0x85ebca6b);
  hash = Math.imul(hash ^ Math.imul(y, 0x165667b1), 0xc2b2ae35);
  hash = Math.imul(hash ^ Math.imul(z, 0x1b873593), 0x27d4eb2d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  return (hash >>> 0) / 0xffffffff;
}

function smootherStep(value: number): number {
  return value * value * value * (value * (value * 6 - 15) + 10);
}

function lerpNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mixRgb(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  amount: number,
): [number, number, number] {
  const t = clamp01(amount);
  return [
    toByte(a[0] + (b[0] - a[0]) * t),
    toByte(a[1] + (b[1] - a[1]) * t),
    toByte(a[2] + (b[2] - a[2]) * t),
  ];
}

function assertInput(input: SystemScenePlanetSurfaceTextureInput): void {
  if (input.systemIdentity.trim().length === 0 || input.planetId.trim().length === 0) {
    throw new RangeError('Point-25.3 surface texture identity must not be blank.');
  }
  if (input.baseTexture.width < 2 || input.baseTexture.height < 1) {
    throw new RangeError('Point-25.3 requires a non-empty seam-capable base texture.');
  }
  if (input.baseTexture.rgba.length !== input.baseTexture.width * input.baseTexture.height * 4) {
    throw new RangeError('Point-25.3 base texture byte length is inconsistent with its dimensions.');
  }
}

function toByte(value: number): number {
  return Math.round(Math.max(0, Math.min(255, value)));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
