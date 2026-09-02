import {
  type SystemSceneGiantAtmospherePresentationSnapshot,
} from './system-scene-giant-atmosphere-presentation';

export const SYSTEM_SCENE_GIANT_ATMOSPHERE_TEXTURE_WIDTH = 256;
export const SYSTEM_SCENE_GIANT_ATMOSPHERE_TEXTURE_HEIGHT = 128;

export interface SystemSceneGiantAtmosphereTextureInput {
  readonly systemIdentity: string;
  readonly planetId: string;
  readonly atmosphere: SystemSceneGiantAtmospherePresentationSnapshot;
}

export interface SystemSceneGiantAtmosphereTextureData {
  readonly version: 1;
  readonly seedUint32: number;
  readonly width: number;
  readonly height: number;
  readonly albedoRgba: Uint8Array;
  readonly upperHazeRgba: Uint8Array | null;
}

interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

interface GiantPalette {
  readonly belt: Rgb;
  readonly zone: Rgb;
  readonly storm: Rgb;
  readonly haze: Rgb;
  readonly pole: Rgb;
}

const TWO_PI = Math.PI * 2;

/**
 * Point-25.4 deterministic cloud-top texture for envelope-dominated planets.
 *
 * It consumes only the immutable 25.4 presentation snapshot and stable visual
 * identity. Banding, vortices and haze are visual circulation proxies; no pixel
 * is promoted to atmospheric Ground Truth.
 */
export function buildSystemSceneGiantAtmosphereTextureV1(
  input: SystemSceneGiantAtmosphereTextureInput,
): SystemSceneGiantAtmosphereTextureData {
  if (input.systemIdentity.trim().length === 0) {
    throw new RangeError('systemIdentity must not be blank.');
  }
  if (input.planetId.trim().length === 0) {
    throw new RangeError('planetId must not be blank.');
  }
  if (input.atmosphere.source !== 'PHASE_19_20_DEEP_ENVELOPE') {
    throw new RangeError('Point-25.4 requires the frozen deep-envelope presentation source.');
  }

  const seedUint32 = hash32(
    `${input.systemIdentity}|${input.planetId}|${input.atmosphere.regime}|GENESIS-25.4-GIANT-ATMOSPHERE-V1`,
  );
  const width = SYSTEM_SCENE_GIANT_ATMOSPHERE_TEXTURE_WIDTH;
  const height = SYSTEM_SCENE_GIANT_ATMOSPHERE_TEXTURE_HEIGHT;
  const albedoRgba = new Uint8Array(width * height * 4);
  const upperHazeRgba =
    input.atmosphere.presentationUpperHaze01 > 0.08
      ? new Uint8Array(width * height * 4)
      : null;
  const palette = giantPalette(input.atmosphere, seedUint32);

  const stormCount = Math.max(
    0,
    Math.min(
      4,
      Math.floor(
        input.atmosphere.presentationStormCoverage01 * 8 +
          seedUnit(seedUint32, 17) * 1.4,
      ),
    ),
  );
  const storms = Array.from({ length: stormCount }, (_, index) => ({
    longitude: seedUnit(seedUint32, 31 + index * 5) * TWO_PI,
    latitude: lerp(-0.72, 0.72, seedUnit(seedUint32, 32 + index * 5)),
    longitudeSigma: lerp(0.16, 0.46, seedUnit(seedUint32, 33 + index * 5)),
    latitudeSigma: lerp(0.07, 0.20, seedUnit(seedUint32, 34 + index * 5)),
    polarity: seedUnit(seedUint32, 35 + index * 5) > 0.42 ? 1 : -1,
  }));

  for (let y = 0; y < height; y += 1) {
    const v = (y + 0.5) / height;
    const latitude = (v - 0.5) * Math.PI;
    const cosLatitude = Math.cos(latitude);
    const polar01 = Math.abs(Math.sin(latitude));

    for (let x = 0; x < width; x += 1) {
      const u = x === width - 1 ? 0 : x / (width - 1);
      const longitude = u * TWO_PI;
      const sx = cosLatitude * Math.cos(longitude);
      const sy = Math.sin(latitude);
      const sz = cosLatitude * Math.sin(longitude);

      const broadNoise = fbm3(
        sx * 2.2 + 3.7,
        sy * 1.5 - 2.1,
        sz * 2.2 + 5.9,
        seedUint32 ^ 0x9e3779b9,
        3,
      );
      const fineNoise = fbm3(
        sx * 7.4 - 4.3,
        sy * 3.2 + 7.1,
        sz * 7.4 + 1.8,
        seedUint32 ^ 0x85ebca6b,
        3,
      );
      const longitudinalWave =
        Math.sin(
          longitude * (1.2 + seedUnit(seedUint32, 7) * 2.2) +
            (broadNoise - 0.5) *
              (2.0 + input.atmosphere.presentationTurbulence01 * 3.8),
        ) *
        (0.10 + input.atmosphere.presentationTurbulence01 * 0.22);
      const jetPhase =
        latitude * input.atmosphere.presentationBandCount +
        longitudinalWave +
        (fineNoise - 0.5) * input.atmosphere.presentationTurbulence01 * 1.6;
      const broadBands = 0.5 + 0.5 * Math.sin(jetPhase);
      const narrowJets = 0.5 + 0.5 * Math.sin(jetPhase * 2.03 + broadNoise * 1.9);
      const jetMix = clamp01(
        broadBands *
          (0.66 + 0.18 * input.atmosphere.presentationJetSharpness01) +
          narrowJets *
            (0.18 + 0.12 * input.atmosphere.presentationJetSharpness01) +
          (fineNoise - 0.5) *
            input.atmosphere.presentationTurbulence01 * 0.20,
      );

      let color = mixRgb(
        palette.belt,
        palette.zone,
        smoothContrast(
          jetMix,
          lerp(0.90, 1.65, input.atmosphere.presentationJetSharpness01),
        ),
      );

      const cellular = Math.abs(
        fbm3(
          sx * 4.8 + 11,
          sy * 2.8 - 8,
          sz * 4.8 + 2,
          seedUint32 ^ 0xc2b2ae35,
          4,
        ) * 2 - 1,
      );
      color = mixRgb(
        color,
        palette.haze,
        clamp01(
          input.atmosphere.presentationTurbulence01 *
            (0.04 + cellular * 0.12),
        ),
      );

      let stormSignal = 0;
      let stormPolarity = 1;
      for (const storm of storms) {
        const signal = gaussianStorm(
          longitude,
          latitude,
          storm.longitude,
          storm.latitude,
          storm.longitudeSigma,
          storm.latitudeSigma,
        );
        if (signal > stormSignal) {
          stormSignal = signal;
          stormPolarity = storm.polarity;
        }
      }
      const stormStrength = clamp01(
        stormSignal *
          (0.35 + input.atmosphere.presentationStormCoverage01 * 2.4),
      );
      if (stormStrength > 0) {
        const stormColor =
          stormPolarity > 0
            ? palette.storm
            : mixRgb(palette.belt, palette.pole, 0.28);
        color = mixRgb(color, stormColor, stormStrength);
      }

      const poleMix = clamp01(
        Math.pow(polar01, 3.4) *
          input.atmosphere.presentationPolarHaze01,
      );
      color = mixRgb(color, palette.pole, poleMix);

      const offset = (y * width + x) * 4;
      albedoRgba[offset] = toByte(color.r);
      albedoRgba[offset + 1] = toByte(color.g);
      albedoRgba[offset + 2] = toByte(color.b);
      albedoRgba[offset + 3] = 255;

      if (upperHazeRgba !== null) {
        const hazeNoise = fbm3(
          sx * 3.1 - 5,
          sy * 2.1 + 2,
          sz * 3.1 + 9,
          seedUint32 ^ 0x27d4eb2d,
          3,
        );
        const hazeBand = 0.5 + 0.5 * Math.sin(jetPhase * 0.52 + hazeNoise * 2.4);
        const hazeAlpha01 = clamp01(
          input.atmosphere.presentationUpperHaze01 *
            (
              0.10 +
              0.22 * hazeBand +
              0.20 * Math.pow(polar01, 2.6) *
                input.atmosphere.presentationPolarHaze01
            ),
        );
        upperHazeRgba[offset] = toByte(palette.haze.r);
        upperHazeRgba[offset + 1] = toByte(palette.haze.g);
        upperHazeRgba[offset + 2] = toByte(palette.haze.b);
        upperHazeRgba[offset + 3] = toByte(hazeAlpha01 * 255);
      }
    }
  }

  return Object.freeze({
    version: 1 as const,
    seedUint32,
    width,
    height,
    albedoRgba,
    upperHazeRgba,
  });
}

function giantPalette(
  atmosphere: SystemSceneGiantAtmospherePresentationSnapshot,
  seed: number,
): GiantPalette {
  const variant = seedUnit(seed, 3);
  const family = Math.min(3, Math.floor(variant * 4));
  const methane = atmosphere.presentationMethaneBlueing01;
  const warm = atmosphere.presentationWarmChromophore01;

  if (atmosphere.regime === 'ICE_GIANT') {
    const families = [
      {
        belt: rgb(20, 82, 139),
        zone: rgb(116, 196, 230),
        storm: rgb(214, 242, 248),
        haze: rgb(176, 224, 236),
        pole: rgb(150, 214, 232),
      },
      {
        belt: rgb(31, 104, 123),
        zone: rgb(126, 211, 210),
        storm: rgb(220, 246, 236),
        haze: rgb(185, 231, 220),
        pole: rgb(162, 221, 216),
      },
      {
        belt: rgb(40, 75, 137),
        zone: rgb(137, 181, 225),
        storm: rgb(224, 235, 250),
        haze: rgb(190, 211, 239),
        pole: rgb(168, 198, 232),
      },
      {
        belt: rgb(41, 118, 151),
        zone: rgb(167, 218, 232),
        storm: rgb(238, 247, 247),
        haze: rgb(205, 232, 236),
        pole: rgb(190, 226, 231),
      },
    ] as const;
    const selected = families[family]!;
    const blueTarget = rgb(29, 116, 195);
    return {
      belt: mixRgb(selected.belt, blueTarget, methane * 0.34),
      zone: mixRgb(selected.zone, rgb(137, 204, 238), methane * 0.20),
      storm: selected.storm,
      haze: selected.haze,
      pole: mixRgb(
        selected.pole,
        rgb(225, 241, 242),
        atmosphere.presentationPolarHaze01 * 0.42,
      ),
    };
  }

  if (atmosphere.regime === 'MINI_NEPTUNE') {
    const families = [
      {
        belt: rgb(32, 102, 125),
        zone: rgb(111, 193, 197),
        storm: rgb(220, 238, 225),
        haze: rgb(177, 219, 212),
        pole: rgb(151, 207, 205),
      },
      {
        belt: rgb(48, 86, 139),
        zone: rgb(133, 175, 212),
        storm: rgb(229, 235, 243),
        haze: rgb(190, 211, 226),
        pole: rgb(169, 200, 222),
      },
      {
        belt: rgb(45, 112, 96),
        zone: rgb(135, 198, 173),
        storm: rgb(227, 239, 216),
        haze: rgb(190, 221, 199),
        pole: rgb(166, 210, 191),
      },
      {
        belt: rgb(72, 91, 125),
        zone: rgb(157, 181, 207),
        storm: rgb(235, 239, 239),
        haze: rgb(207, 216, 224),
        pole: rgb(188, 205, 218),
      },
    ] as const;
    const selected = families[family]!;
    return {
      belt: mixRgb(selected.belt, rgb(33, 104, 160), methane * 0.28),
      zone: mixRgb(selected.zone, rgb(155, 205, 222), methane * 0.18),
      storm: selected.storm,
      haze: selected.haze,
      pole: selected.pole,
    };
  }

  const families = [
    {
      belt: rgb(116, 71, 44),
      zone: rgb(231, 197, 149),
      storm: rgb(203, 91, 51),
      haze: rgb(235, 216, 183),
      pole: rgb(207, 190, 165),
    },
    {
      belt: rgb(128, 92, 39),
      zone: rgb(239, 213, 148),
      storm: rgb(188, 117, 55),
      haze: rgb(239, 224, 181),
      pole: rgb(217, 203, 167),
    },
    {
      belt: rgb(136, 65, 48),
      zone: rgb(229, 170, 137),
      storm: rgb(181, 72, 57),
      haze: rgb(231, 199, 180),
      pole: rgb(206, 173, 164),
    },
    {
      belt: rgb(92, 94, 91),
      zone: rgb(211, 205, 184),
      storm: rgb(164, 116, 89),
      haze: rgb(220, 219, 205),
      pole: rgb(195, 199, 194),
    },
  ] as const;
  const selected = families[family]!;
  const warmTarget = rgb(157, 78, 45);
  const coolTarget = rgb(75, 111, 126);
  return {
    belt: mixRgb(
      mixRgb(selected.belt, warmTarget, warm * 0.26),
      coolTarget,
      methane * 0.30,
    ),
    zone: mixRgb(
      selected.zone,
      rgb(184, 210, 211),
      methane * 0.20,
    ),
    storm: mixRgb(selected.storm, rgb(237, 186, 122), 1 - warm * 0.62),
    haze: mixRgb(selected.haze, rgb(201, 220, 220), methane * 0.25),
    pole: mixRgb(
      selected.pole,
      rgb(218, 224, 216),
      atmosphere.presentationPolarHaze01 * 0.30,
    ),
  };
}
function gaussianStorm(
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

function angularDistance(a: number, b: number): number {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
}

function smoothContrast(value01: number, contrast: number): number {
  return clamp01(0.5 + (value01 - 0.5) * contrast);
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
    total += valueNoise3(
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

function valueNoise3(x: number, y: number, z: number, seed: number): number {
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
  return lerp(lerp(x00, x10, ty), lerp(x01, x11, ty), tz);
}

function latticeNoise(x: number, y: number, z: number, seed: number): number {
  let hash = seed | 0;
  hash = Math.imul(hash ^ Math.imul(x, 0x27d4eb2d), 0x85ebca6b);
  hash = Math.imul(hash ^ Math.imul(y, 0x165667b1), 0xc2b2ae35);
  hash = Math.imul(hash ^ Math.imul(z, 0x1b873593), 0x27d4eb2d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  return (hash >>> 0) / 0xffffffff;
}

function seedUnit(seed: number, salt: number): number {
  let hash = seed ^ Math.imul(salt, 0x9e3779b9);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 0xffffffff;
}

function hash32(key: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
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
