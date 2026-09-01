export type SystemScenePlanetTextureSurfaceStyle =
  | 'rocky'
  | 'oceanic'
  | 'icy'
  | 'gaseous'
  | 'volcanic';

export interface SystemScenePlanetTextureInput {
  readonly systemIdentity: string;
  readonly planetId: string;
  readonly surfaceStyle: SystemScenePlanetTextureSurfaceStyle;
  readonly baseColorHex: string;
}

export interface SystemScenePlanetTextureData {
  readonly version: 1;
  readonly seedUint32: number;
  readonly width: number;
  readonly height: number;
  readonly rgba: Uint8Array;
}

export const SYSTEM_SCENE_PLANET_TEXTURE_WIDTH = 256;
export const SYSTEM_SCENE_PLANET_TEXTURE_HEIGHT = 128;

const TWO_PI = Math.PI * 2;

interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

interface TexturePalette {
  readonly dark: Rgb;
  readonly mid: Rgb;
  readonly light: Rgb;
  readonly accent: Rgb;
}

/**
 * Point-25.2 deterministic CPU albedo texture.
 *
 * The renderer receives an immutable domain snapshot and derives this texture
 * only from stable presentation identity (system + body + surface class). It
 * never consumes frame time, camera position or orbital coordinates, so the
 * same planet keeps the same visual identity across renders.
 *
 * 25.2 deliberately produces generic albedo structure, not semantic continents,
 * oceans, ice coverage, cloud fields or atmospheric physics. Those belong to
 * later Phase-25 points and can replace/refine this baseline without changing
 * the stable texture seed contract.
 */
export function buildSystemScenePlanetTextureV1(
  input: SystemScenePlanetTextureInput,
): SystemScenePlanetTextureData {
  assertInput(input);

  const seedUint32 = systemScenePlanetTextureSeed(input);
  const width = SYSTEM_SCENE_PLANET_TEXTURE_WIDTH;
  const height = SYSTEM_SCENE_PLANET_TEXTURE_HEIGHT;
  const rgba = new Uint8Array(width * height * 4);
  const base = parseHexColor(input.baseColorHex);
  const palette = texturePalette(input.surfaceStyle, base);

  for (let y = 0; y < height; y += 1) {
    const v = (y + 0.5) / height;
    const latitude = (v - 0.5) * Math.PI;
    const cosLatitude = Math.cos(latitude);
    const latitude01 = Math.abs(Math.sin(latitude));

    for (let x = 0; x < width; x += 1) {
      // Make the final column evaluate the exact same longitude as the first.
      // This freezes a seam-safe equirectangular baseline for RepeatWrapping.
      const u = x === width - 1 ? 0 : x / (width - 1);
      const longitude = u * TWO_PI;
      const sphereX = cosLatitude * Math.cos(longitude);
      const sphereY = Math.sin(latitude);
      const sphereZ = cosLatitude * Math.sin(longitude);

      const macro = fbm3(
        sphereX * 2.45,
        sphereY * 2.45,
        sphereZ * 2.45,
        seedUint32,
        4,
      );
      const detail = fbm3(
        sphereX * 7.8 + 11.3,
        sphereY * 7.8 - 3.7,
        sphereZ * 7.8 + 5.1,
        seedUint32 ^ 0x9e3779b9,
        3,
      );

      const color = proceduralAlbedo(
        input.surfaceStyle,
        palette,
        macro,
        detail,
        latitude,
        latitude01,
        longitude,
        seedUint32,
      );

      const offset = (y * width + x) * 4;
      rgba[offset] = toByte(color.r);
      rgba[offset + 1] = toByte(color.g);
      rgba[offset + 2] = toByte(color.b);
      rgba[offset + 3] = 255;
    }
  }

  return Object.freeze({
    version: 1 as const,
    seedUint32,
    width,
    height,
    rgba,
  });
}

export function systemScenePlanetTextureSeed(
  input: Pick<
    SystemScenePlanetTextureInput,
    'systemIdentity' | 'planetId' | 'surfaceStyle'
  >,
): number {
  if (input.systemIdentity.trim().length === 0) {
    throw new RangeError('systemIdentity must not be blank.');
  }
  if (input.planetId.trim().length === 0) {
    throw new RangeError('planetId must not be blank.');
  }

  const key = `${input.systemIdentity}|${input.planetId}|${input.surfaceStyle}|GENESIS-25.2-TEXTURE-V1`;
  let hash = 0x811c9dc5;

  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function proceduralAlbedo(
  style: SystemScenePlanetTextureSurfaceStyle,
  palette: TexturePalette,
  macro: number,
  detail: number,
  latitude: number,
  latitude01: number,
  longitude: number,
  seed: number,
): Rgb {
  const centeredMacro = macro * 2 - 1;
  const centeredDetail = detail * 2 - 1;

  if (style === 'gaseous') {
    const phase = ((seed >>> 8) & 0xffff) / 0xffff * TWO_PI;
    const bands =
      0.5 +
      0.5 * Math.sin(latitude * 17 + centeredMacro * 2.6 + phase);
    const fineBands =
      0.5 +
      0.5 * Math.sin(latitude * 43 - longitude * 0.45 + phase * 0.7);
    const bandMix = clamp01(0.18 + bands * 0.58 + fineBands * 0.16 + centeredDetail * 0.10);
    const base = mixRgb(palette.dark, palette.light, bandMix);
    return mixRgb(base, palette.accent, clamp01(Math.max(0, centeredMacro) * 0.22));
  }

  if (style === 'icy') {
    const frost = clamp01(0.44 + macro * 0.34 + latitude01 * 0.16 + centeredDetail * 0.08);
    const base = mixRgb(palette.dark, palette.light, frost);
    return mixRgb(base, palette.accent, clamp01((detail - 0.62) * 0.34));
  }

  if (style === 'volcanic') {
    const crust = clamp01(0.16 + macro * 0.56 + detail * 0.18);
    const base = mixRgb(palette.dark, palette.mid, crust);
    const warm = clamp01(Math.max(0, centeredDetail * 0.6 + centeredMacro * 0.24));
    return mixRgb(base, palette.accent, warm * 0.24);
  }

  if (style === 'oceanic') {
    // Generic tonal variation only. 25.3 will decide what actually represents
    // ocean, continent, ice and other physical surface reservoirs.
    const variation = clamp01(0.24 + macro * 0.54 + centeredDetail * 0.10);
    const base = mixRgb(palette.dark, palette.mid, variation);
    return mixRgb(base, palette.light, clamp01((macro - 0.68) * 0.42));
  }

  const terrain = clamp01(0.12 + macro * 0.62 + detail * 0.18);
  const base = mixRgb(palette.dark, palette.mid, terrain);
  return mixRgb(base, palette.light, clamp01((detail - 0.72) * 0.34));
}

function texturePalette(
  style: SystemScenePlanetTextureSurfaceStyle,
  base: Rgb,
): TexturePalette {
  switch (style) {
    case 'oceanic':
      return {
        dark: mixRgb(base, rgb(8, 24, 52), 0.52),
        mid: mixRgb(base, rgb(39, 111, 156), 0.34),
        light: mixRgb(base, rgb(137, 204, 220), 0.24),
        accent: mixRgb(base, rgb(214, 239, 246), 0.18),
      };
    case 'icy':
      return {
        dark: mixRgb(base, rgb(101, 146, 180), 0.42),
        mid: mixRgb(base, rgb(188, 220, 237), 0.42),
        light: mixRgb(base, rgb(244, 251, 255), 0.62),
        accent: rgb(255, 255, 255),
      };
    case 'gaseous':
      return {
        dark: mixRgb(base, rgb(77, 69, 66), 0.32),
        mid: mixRgb(base, rgb(206, 164, 119), 0.24),
        light: mixRgb(base, rgb(246, 226, 194), 0.34),
        accent: mixRgb(base, rgb(255, 244, 218), 0.38),
      };
    case 'volcanic':
      return {
        dark: mixRgb(base, rgb(18, 13, 12), 0.72),
        mid: mixRgb(base, rgb(91, 47, 31), 0.46),
        light: mixRgb(base, rgb(151, 80, 44), 0.30),
        accent: rgb(230, 111, 53),
      };
    case 'rocky':
    default:
      return {
        dark: mixRgb(base, rgb(68, 62, 56), 0.44),
        mid: mixRgb(base, rgb(143, 130, 112), 0.26),
        light: mixRgb(base, rgb(207, 193, 168), 0.22),
        accent: mixRgb(base, rgb(224, 211, 188), 0.18),
      };
  }
}

function fbm3(
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
    total +=
      valueNoise3(
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

function valueNoise3(
  x: number,
  y: number,
  z: number,
  seed: number,
): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const tx = smoothstep(x - x0);
  const ty = smoothstep(y - y0);
  const tz = smoothstep(z - z0);

  const c000 = latticeNoise(x0, y0, z0, seed);
  const c100 = latticeNoise(x0 + 1, y0, z0, seed);
  const c010 = latticeNoise(x0, y0 + 1, z0, seed);
  const c110 = latticeNoise(x0 + 1, y0 + 1, z0, seed);
  const c001 = latticeNoise(x0, y0, z0 + 1, seed);
  const c101 = latticeNoise(x0 + 1, y0, z0 + 1, seed);
  const c011 = latticeNoise(x0, y0 + 1, z0 + 1, seed);
  const c111 = latticeNoise(x0 + 1, y0 + 1, z0 + 1, seed);

  const x00 = lerp(c000, c100, tx);
  const x10 = lerp(c010, c110, tx);
  const x01 = lerp(c001, c101, tx);
  const x11 = lerp(c011, c111, tx);
  const y0Mix = lerp(x00, x10, ty);
  const y1Mix = lerp(x01, x11, ty);

  return lerp(y0Mix, y1Mix, tz);
}

function latticeNoise(
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

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function parseHexColor(value: string): Rgb {
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new RangeError(`baseColorHex must be #RRGGBB: ${value}.`);
  }

  return rgb(
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  );
}

function rgb(r: number, g: number, b: number): Rgb {
  return { r, g, b };
}

function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  const amount = clamp01(t);
  return rgb(
    lerp(a.r, b.r, amount),
    lerp(a.g, b.g, amount),
    lerp(a.b, b.b, amount),
  );
}

function toByte(value: number): number {
  return Math.round(Math.max(0, Math.min(255, value)));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function assertInput(input: SystemScenePlanetTextureInput): void {
  if (input.systemIdentity.trim().length === 0) {
    throw new RangeError('systemIdentity must not be blank.');
  }
  if (input.planetId.trim().length === 0) {
    throw new RangeError('planetId must not be blank.');
  }
  parseHexColor(input.baseColorHex);
}
