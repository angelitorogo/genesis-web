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

interface TexturePersonality {
  readonly paletteVariant01: number;
  readonly macroScale: number;
  readonly detailScale: number;
  readonly ridgeScale: number;
  readonly contrast: number;
  readonly latitudeBias: number;
  readonly latitudeInfluence: number;
  readonly accentThreshold: number;
  readonly accentStrength: number;
  readonly swirlStrength: number;
  readonly bandCount: number;
  readonly stormLongitude: number;
  readonly stormLatitude: number;
  readonly stormStrength: number;
  readonly familyVariantIndex: number;
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
 *
 * V2 of 25.2 increases variety within each surface family by deriving a stable
 * personality from the same deterministic seed: palette drift, noise scales,
 * accent thresholds and gaseous-band/storm parameters all vary per planet.
 *
 * V3 makes same-family identity intentionally obvious at normal system-view
 * distances. Gaseous and rocky bodies receive one of six deterministic visual
 * archetypes, each with separated palette families and macro-pattern behavior.
 * These remain presentation-only albedo archetypes, not physical subtypes.
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
  const personality = texturePersonality(seedUint32);
  const palette = texturePalette(input.surfaceStyle, base, personality);

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

      const warp = fbm3(
        sphereX * personality.ridgeScale + 13.7,
        sphereY * personality.ridgeScale - 5.1,
        sphereZ * personality.ridgeScale + 8.4,
        seedUint32 ^ 0xa53c9e17,
        3,
      );
      const swirl = (warp - 0.5) * personality.swirlStrength;
      const warpedX = sphereX + sphereZ * swirl;
      const warpedY = sphereY + sphereX * swirl * 0.35;
      const warpedZ = sphereZ - sphereX * swirl;

      const macro = fbm3(
        warpedX * personality.macroScale,
        warpedY * personality.macroScale,
        warpedZ * personality.macroScale,
        seedUint32,
        4,
      );
      const detail = fbm3(
        warpedX * personality.detailScale + 11.3,
        warpedY * personality.detailScale - 3.7,
        warpedZ * personality.detailScale + 5.1,
        seedUint32 ^ 0x9e3779b9,
        3,
      );
      const ridge = Math.abs(
        fbm3(
          warpedX * (personality.ridgeScale * 1.31) - 7.4,
          warpedY * (personality.ridgeScale * 1.31) + 4.2,
          warpedZ * (personality.ridgeScale * 1.31) - 2.6,
          seedUint32 ^ 0x85ebca6b,
          4,
        ) * 2 - 1,
      );

      const color = proceduralAlbedo(
        input.surfaceStyle,
        palette,
        personality,
        macro,
        detail,
        ridge,
        latitude,
        latitude01,
        longitude,
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
  personality: TexturePersonality,
  macro: number,
  detail: number,
  ridge: number,
  latitude: number,
  latitude01: number,
  longitude: number,
): Rgb {
  const centeredMacro = macro * 2 - 1;
  const centeredDetail = detail * 2 - 1;
  const latitudeShape = clamp01(
    0.5 +
      personality.latitudeBias +
      latitude01 * personality.latitudeInfluence +
      centeredDetail * 0.06,
  );

  if (style === 'gaseous') {
    const variant = personality.familyVariantIndex;
    const broadFrequency = personality.bandCount * (0.72 + variant * 0.09);
    const waveLongitude = variant === 1 || variant === 4
      ? longitude * (0.55 + personality.swirlStrength * 1.6)
      : longitude * (0.10 + personality.swirlStrength * 0.45);
    const bands =
      0.5 +
      0.5 * Math.sin(
        latitude * broadFrequency +
          centeredMacro * (2.0 + variant * 0.42) +
          waveLongitude,
      );
    const fineBands =
      0.5 +
      0.5 * Math.sin(
        latitude * (broadFrequency * (1.65 + variant * 0.13)) -
          longitude * (0.12 + personality.swirlStrength * (0.8 + variant * 0.12)) +
          centeredDetail * (1.2 + variant * 0.32),
      );
    const broadCells = clamp01(
      0.5 + centeredMacro * (0.30 + variant * 0.035) + (0.5 - ridge) * 0.20,
    );
    const turbulence = clamp01(
      0.12 +
        macro * (0.28 + variant * 0.025) +
        fineBands * (0.16 + (5 - variant) * 0.018) +
        centeredDetail * (0.10 + variant * 0.018),
    );
    const bandMix = clamp01(
      variant === 2
        ? 0.20 + bands * 0.24 + broadCells * 0.38 + turbulence * 0.18
        : variant === 5
          ? 0.08 + bands * 0.56 + fineBands * 0.20 + turbulence * 0.10
          : 0.12 + bands * 0.38 + fineBands * 0.24 + broadCells * 0.14 + turbulence * 0.12,
    );
    const primaryStorm = gaussianSpot(
      longitude,
      latitude,
      personality.stormLongitude,
      personality.stormLatitude,
      variant === 3 ? 0.70 : 0.40 + variant * 0.035,
      variant === 3 ? 0.18 : 0.22 + (variant % 2) * 0.04,
    ) * personality.stormStrength * (variant === 0 ? 1.35 : 0.86 + variant * 0.08);
    const secondaryStorm = (variant === 1 || variant === 4)
      ? gaussianSpot(
          longitude,
          latitude,
          personality.stormLongitude + Math.PI * 0.92,
          -personality.stormLatitude * 0.72,
          0.28,
          0.15,
        ) * personality.stormStrength * 0.55
      : 0;
    const base = mixRgb(
      palette.dark,
      palette.light,
      remapContrast(bandMix, personality.contrast * (variant === 5 ? 1.18 : 1)),
    );
    const stormColor = mixRgb(
      palette.mid,
      palette.accent,
      variant === 0 ? 0.90 : 0.62,
    );
    const cellTint = variant === 2 || variant === 3
      ? clamp01((broadCells - 0.52) * 0.34)
      : clamp01(ridge * 0.12 + turbulence * 0.05);
    return mixRgb(
      mixRgb(base, palette.mid, cellTint),
      stormColor,
      clamp01(primaryStorm + secondaryStorm),
    );
  }

  if (style === 'icy') {
    const frost = clamp01(
      0.30 +
        macro * 0.32 +
        ridge * 0.10 +
        latitude01 * (0.18 + personality.latitudeInfluence * 0.18) +
        centeredDetail * 0.10,
    );
    const bright = remapContrast(frost, personality.contrast * 0.92);
    const base = mixRgb(palette.dark, palette.light, bright);
    return mixRgb(
      base,
      palette.accent,
      clamp01((detail - personality.accentThreshold) * (0.65 + personality.accentStrength)),
    );
  }

  if (style === 'volcanic') {
    const crust = clamp01(
      0.10 + macro * 0.56 + ridge * 0.10 + detail * 0.12,
    );
    const base = mixRgb(
      palette.dark,
      palette.mid,
      remapContrast(crust, personality.contrast),
    );
    const thermal = clamp01(
      centeredDetail * (0.34 + personality.accentStrength) +
        centeredMacro * 0.18 +
        (1 - ridge) * 0.18 -
        personality.accentThreshold * 0.12,
    );
    return mixRgb(base, palette.accent, thermal);
  }

  if (style === 'oceanic') {
    // Generic tonal variation only. 25.3 will decide what actually represents
    // ocean, continent, ice and other physical surface reservoirs.
    const variation = clamp01(
      0.14 + macro * 0.56 + ridge * 0.06 + centeredDetail * 0.12 + latitudeShape * 0.08,
    );
    const base = mixRgb(
      palette.dark,
      palette.mid,
      remapContrast(variation, personality.contrast * 0.94),
    );
    return mixRgb(
      base,
      palette.light,
      clamp01((macro - personality.accentThreshold) * (0.52 + personality.accentStrength)),
    );
  }

  const rockyVariant = personality.familyVariantIndex;
  const macroStructure = rockyVariant === 0
    ? clamp01(0.5 + centeredMacro * 0.52)
    : rockyVariant === 1
      ? clamp01(0.5 + (0.5 - ridge) * 0.56 + centeredDetail * 0.12)
      : rockyVariant === 2
        ? clamp01(0.5 + centeredMacro * 0.28 + centeredDetail * 0.36)
        : rockyVariant === 3
          ? clamp01(0.5 + Math.sin((macro + detail) * Math.PI * 3.2) * 0.28 + centeredMacro * 0.16)
          : rockyVariant === 4
            ? clamp01(0.5 + centeredMacro * 0.42 + latitudeShape * 0.18 - ridge * 0.12)
            : clamp01(0.5 + centeredDetail * 0.46 + ridge * 0.24 - centeredMacro * 0.10);
  const terrain = clamp01(
    0.06 +
      macroStructure * (0.56 + rockyVariant * 0.018) +
      macro * 0.12 +
      detail * 0.08 +
      latitudeShape * (rockyVariant === 4 ? 0.14 : 0.04),
  );
  const base = mixRgb(
    palette.dark,
    palette.mid,
    remapContrast(terrain, personality.contrast * (0.92 + rockyVariant * 0.055)),
  );
  const highlightMask = rockyVariant === 1
    ? clamp01((1 - ridge - personality.accentThreshold * 0.42) * (0.54 + personality.accentStrength))
    : rockyVariant === 3
      ? clamp01((macroStructure - 0.60) * (0.82 + personality.accentStrength))
      : clamp01((detail - personality.accentThreshold) * (0.62 + personality.accentStrength));
  return mixRgb(
    base,
    palette.light,
    highlightMask,
  );
}

function texturePersonality(
  seed: number,
): TexturePersonality {
  return Object.freeze({
    paletteVariant01: seedUnit(seed, 1),
    macroScale: lerp(1.8, 3.8, seedUnit(seed, 2)),
    detailScale: lerp(6.0, 11.6, seedUnit(seed, 3)),
    ridgeScale: lerp(2.2, 6.2, seedUnit(seed, 4)),
    contrast: lerp(0.82, 1.42, seedUnit(seed, 5)),
    latitudeBias: lerp(-0.12, 0.12, seedUnit(seed, 6)),
    latitudeInfluence: lerp(0.08, 0.38, seedUnit(seed, 7)),
    accentThreshold: lerp(0.52, 0.82, seedUnit(seed, 8)),
    accentStrength: lerp(0.22, 0.76, seedUnit(seed, 9)),
    swirlStrength: lerp(0.03, 0.28, seedUnit(seed, 10)),
    bandCount: lerp(10, 24, seedUnit(seed, 11)),
    stormLongitude: seedUnit(seed, 12) * TWO_PI,
    stormLatitude: lerp(-0.72, 0.72, seedUnit(seed, 13)),
    stormStrength: lerp(0.0, 0.42, seedUnit(seed, 14)),
    familyVariantIndex: Math.min(5, Math.floor(seedUnit(seed, 15) * 6)),
  });
}

function texturePalette(
  style: SystemScenePlanetTextureSurfaceStyle,
  base: Rgb,
  personality: TexturePersonality,
): TexturePalette {
  switch (style) {
    case 'oceanic':
      return {
        dark: mixRgb(
          mixRgb(base, paletteRamp(personality.paletteVariant01, rgb(8, 22, 48), rgb(12, 44, 72), rgb(10, 30, 66)), 0.58),
          rgb(8, 28, 52),
          0.08,
        ),
        mid: mixRgb(
          mixRgb(base, paletteRamp(personality.paletteVariant01, rgb(44, 115, 166), rgb(28, 90, 145), rgb(49, 133, 164)), 0.36),
          rgb(46, 108, 150),
          0.10,
        ),
        light: mixRgb(base, paletteRamp(personality.paletteVariant01, rgb(145, 204, 226), rgb(114, 179, 220), rgb(171, 226, 220)), 0.28),
        accent: mixRgb(base, paletteRamp(personality.paletteVariant01, rgb(224, 244, 249), rgb(194, 230, 245), rgb(207, 248, 241)), 0.24),
      };
    case 'icy':
      return {
        dark: mixRgb(base, paletteRamp(personality.paletteVariant01, rgb(92, 129, 167), rgb(106, 143, 194), rgb(111, 153, 172)), 0.46),
        mid: mixRgb(base, paletteRamp(personality.paletteVariant01, rgb(187, 220, 236), rgb(180, 206, 248), rgb(210, 229, 236)), 0.44),
        light: mixRgb(base, paletteRamp(personality.paletteVariant01, rgb(246, 251, 255), rgb(232, 244, 255), rgb(248, 252, 250)), 0.60),
        accent: paletteRamp(personality.paletteVariant01, rgb(255, 255, 255), rgb(231, 245, 255), rgb(246, 255, 253)),
      };
    case 'gaseous': {
      const palettes = [
        [rgb(72, 45, 37), rgb(184, 112, 65), rgb(247, 205, 145), rgb(255, 226, 178)],
        [rgb(34, 58, 92), rgb(72, 132, 190), rgb(171, 220, 244), rgb(225, 247, 255)],
        [rgb(38, 72, 63), rgb(91, 157, 128), rgb(188, 225, 178), rgb(231, 247, 202)],
        [rgb(78, 68, 86), rgb(153, 132, 169), rgb(224, 203, 226), rgb(249, 229, 239)],
        [rgb(69, 67, 60), rgb(136, 137, 126), rgb(219, 216, 195), rgb(250, 244, 220)],
        [rgb(92, 55, 31), rgb(210, 155, 59), rgb(248, 224, 137), rgb(255, 241, 190)],
      ] as const;
      const selected = palettes[personality.familyVariantIndex] ?? palettes[0];
      const drift = (personality.paletteVariant01 - 0.5) * 0.18;
      return {
        dark: mixRgb(base, selected[0], clamp01(0.82 + drift)),
        mid: mixRgb(base, selected[1], clamp01(0.78 + drift)),
        light: mixRgb(base, selected[2], clamp01(0.80 - drift * 0.5)),
        accent: mixRgb(base, selected[3], clamp01(0.86 - drift * 0.35)),
      };
    }
    case 'volcanic':
      return {
        dark: mixRgb(base, paletteRamp(personality.paletteVariant01, rgb(18, 13, 12), rgb(25, 17, 16), rgb(22, 18, 11)), 0.74),
        mid: mixRgb(base, paletteRamp(personality.paletteVariant01, rgb(91, 47, 31), rgb(118, 53, 37), rgb(110, 72, 28)), 0.48),
        light: mixRgb(base, paletteRamp(personality.paletteVariant01, rgb(151, 80, 44), rgb(177, 78, 49), rgb(174, 111, 39)), 0.34),
        accent: paletteRamp(personality.paletteVariant01, rgb(230, 111, 53), rgb(255, 88, 44), rgb(233, 166, 54)),
      };
    case 'rocky':
    default: {
      const palettes = [
        [rgb(53, 34, 27), rgb(139, 73, 49), rgb(214, 144, 92), rgb(235, 184, 129)],
        [rgb(43, 45, 49), rgb(98, 104, 111), rgb(177, 181, 181), rgb(221, 219, 208)],
        [rgb(69, 49, 26), rgb(157, 113, 51), rgb(224, 180, 93), rgb(242, 214, 145)],
        [rgb(36, 43, 54), rgb(79, 96, 119), rgb(147, 164, 181), rgb(202, 211, 216)],
        [rgb(66, 50, 38), rgb(126, 103, 78), rgb(195, 169, 126), rgb(228, 207, 164)],
        [rgb(31, 29, 28), rgb(73, 68, 63), rgb(137, 126, 113), rgb(189, 174, 154)],
      ] as const;
      const selected = palettes[personality.familyVariantIndex] ?? palettes[0];
      const drift = (personality.paletteVariant01 - 0.5) * 0.12;
      return {
        dark: mixRgb(base, selected[0], clamp01(0.78 + drift)),
        mid: mixRgb(base, selected[1], clamp01(0.72 + drift)),
        light: mixRgb(base, selected[2], clamp01(0.68 - drift * 0.4)),
        accent: mixRgb(base, selected[3], clamp01(0.64 - drift * 0.3)),
      };
    }
  }
}

function paletteRamp(
  variant01: number,
  a: Rgb,
  b: Rgb,
  c: Rgb,
): Rgb {
  if (variant01 <= 0.5) {
    return mixRgb(a, b, variant01 * 2);
  }
  return mixRgb(b, c, (variant01 - 0.5) * 2);
}

function gaussianSpot(
  longitude: number,
  latitude: number,
  centerLongitude: number,
  centerLatitude: number,
  sigmaLongitude: number,
  sigmaLatitude: number,
): number {
  const dx = angularDistance(longitude, centerLongitude) / sigmaLongitude;
  const dy = (latitude - centerLatitude) / sigmaLatitude;
  return Math.exp(-(dx * dx + dy * dy));
}

function angularDistance(
  a: number,
  b: number,
): number {
  const wrapped = Math.atan2(
    Math.sin(a - b),
    Math.cos(a - b),
  );
  return Math.abs(wrapped);
}

function remapContrast(
  value01: number,
  contrast: number,
): number {
  return clamp01(0.5 + (value01 - 0.5) * contrast);
}

function seedUnit(
  seed: number,
  salt: number,
): number {
  let hash = seed ^ Math.imul(salt, 0x9e3779b9);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 0xffffffff;
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
