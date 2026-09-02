import {
  type SystemSceneMoonPresentationV1,
} from './system-scene-moon-presentation';

export interface SystemSceneMoonTextureDataV1 {
  readonly version: 1;
  readonly width: number;
  readonly height: number;
  readonly albedoRgba: Uint8Array;
  readonly emissiveRgba: Uint8Array | null;
  readonly cloudRgba: Uint8Array | null;
}

const WIDTH = 128;
const HEIGHT = 64;

/**
 * Point-25.10 deterministic CPU texture for relevant moons. The texture only
 * visualizes the immutable presentation snapshot; no domain value is inferred
 * back from pixels.
 */
export function buildSystemSceneMoonTextureV1(
  moon: SystemSceneMoonPresentationV1,
): SystemSceneMoonTextureDataV1 {
  if (moon.version !== 1) {
    throw new RangeError(`Unsupported moon presentation version: ${moon.version}.`);
  }

  const base = parseHex(moon.presentationBaseColorHex);
  const accent = parseHex(moon.presentationAccentColorHex);
  const albedo = new Uint8Array(WIDTH * HEIGHT * 4);
  const emissive =
    moon.presentationVolcanicCoverage01 > 0.001
      ? new Uint8Array(WIDTH * HEIGHT * 4)
      : null;
  const clouds =
    moon.presentationCloudCoverage01 > 0.001
      ? new Uint8Array(WIDTH * HEIGHT * 4)
      : null;

  const craters = buildCraters(moon.presentationSeedUint32, moon.shapeClass === 'MINOR_IRREGULAR' ? 16 : 10);

  for (let y = 0; y < HEIGHT; y += 1) {
    const v = y / (HEIGHT - 1);
    const latitude = (v - 0.5) * Math.PI;
    const polar01 = Math.pow(Math.abs(Math.sin(latitude)), 2.4);

    for (let x = 0; x < WIDTH; x += 1) {
      const seamX = x === WIDTH - 1 ? 0 : x;
      const u = seamX / (WIDTH - 1);
      const index = (y * WIDTH + x) * 4;
      const n1 = valueNoisePeriodic(seamX, y, moon.presentationSeedUint32, 17);
      const n2 = valueNoisePeriodic(seamX, y, moon.presentationSeedUint32 ^ 0xa341316c, 7);
      const broad = 0.64 * n1 + 0.36 * n2;
      const crater = craterSignal(u, v, craters);

      let color = mixRgb(base, accent, clamp01(0.18 + 0.58 * broad + 0.22 * crater.rim));
      let brightness = 0.80 + 0.34 * broad - 0.28 * crater.bowl;

      if (moon.surfaceStyle === 'ICY') {
        const fracture = Math.abs(Math.sin((u * 19 + v * 7 + broad * 2.5) * Math.PI));
        const fractureSignal = fracture > 0.94 ? (fracture - 0.94) / 0.06 : 0;
        color = mixRgb(color, { r: 213, g: 231, b: 238 }, clamp01(0.28 + 0.50 * moon.presentationIceCoverage01 + 0.26 * polar01));
        brightness += 0.14 * moon.presentationIceCoverage01 + 0.12 * fractureSignal;
      } else if (moon.surfaceStyle === 'OCEANIC') {
        const liquidMask = smoothstep(
          1 - moon.presentationLiquidCoverage01,
          1,
          broad,
        );
        const ocean = mixRgb(
          { r: 18, g: 61, b: 102 },
          { r: 52, g: 128, b: 160 },
          n2,
        );
        color = mixRgb(color, ocean, liquidMask * 0.92);
        const iceMask = clamp01(
          moon.presentationIceCoverage01 *
          smoothstep(0.45, 0.92, polar01),
        );
        color = mixRgb(color, { r: 214, g: 229, b: 232 }, iceMask);
        brightness += 0.08 * iceMask;
      } else if (moon.surfaceStyle === 'VOLCANIC') {
        brightness -= 0.20;
        color = mixRgb(color, { r: 54, g: 48, b: 43 }, 0.54);
      } else if (moon.surfaceStyle === 'MIXED') {
        color = mixRgb(
          color,
          { r: 184, g: 200, b: 205 },
          moon.presentationIceCoverage01 * (0.18 + 0.52 * polar01),
        );
      }

      const final = scaleRgb(color, clamp(brightness, 0.38, 1.28));
      writeRgba(albedo, index, final, 255);

      if (emissive !== null) {
        const fissure = Math.abs(Math.sin((u * 23 + v * 13 + n1 * 3.2) * Math.PI));
        const fissureMask =
          smoothstep(
            0.88 - 0.16 * moon.presentationVolcanicCoverage01,
            0.995,
            fissure,
          ) *
          moon.presentationVolcanicCoverage01;
        const lava = mixRgb(
          { r: 190, g: 43, b: 8 },
          { r: 255, g: 171, b: 34 },
          n2,
        );
        writeRgba(
          emissive,
          index,
          scaleRgb(lava, clamp01(fissureMask)),
          255,
        );
      }

      if (clouds !== null) {
        const cloudNoise =
          0.56 * valueNoisePeriodic(seamX, y, moon.presentationSeedUint32 ^ 0x31415926, 11) +
          0.44 * valueNoisePeriodic(seamX, y, moon.presentationSeedUint32 ^ 0x27182818, 5);
        const cloudMask = smoothstep(
          1 - moon.presentationCloudCoverage01,
          1,
          cloudNoise,
        );
        const cloudColor = mixRgb(
          { r: 208, g: 217, b: 219 },
          { r: 246, g: 248, b: 246 },
          n1,
        );
        writeRgba(clouds, index, cloudColor, Math.round(220 * clamp01(cloudMask)));
      }
    }
  }

  return Object.freeze({
    version: 1 as const,
    width: WIDTH,
    height: HEIGHT,
    albedoRgba: albedo,
    emissiveRgba: emissive,
    cloudRgba: clouds,
  });
}

interface Crater {
  readonly u: number;
  readonly v: number;
  readonly radius: number;
}

function buildCraters(seed: number, count: number): readonly Crater[] {
  const craters: Crater[] = [];
  let state = seed >>> 0;
  for (let index = 0; index < count; index += 1) {
    state = mixUint32(state + 0x9e3779b9);
    const u = uint32Unit(state);
    state = mixUint32(state + 0x85ebca6b);
    const v = 0.12 + 0.76 * uint32Unit(state);
    state = mixUint32(state + 0xc2b2ae35);
    const radius = 0.018 + 0.055 * uint32Unit(state);
    craters.push(Object.freeze({ u, v, radius }));
  }
  return Object.freeze(craters);
}

function craterSignal(
  u: number,
  v: number,
  craters: readonly Crater[],
): { readonly bowl: number; readonly rim: number } {
  let bowl = 0;
  let rim = 0;
  const latitudeScale = Math.max(0.28, Math.cos((v - 0.5) * Math.PI));

  for (const crater of craters) {
    const duRaw = Math.abs(u - crater.u);
    const du = Math.min(duRaw, 1 - duRaw) * latitudeScale;
    const dv = v - crater.v;
    const distance = Math.sqrt(du * du + dv * dv);
    const normalized = distance / crater.radius;
    if (normalized < 1) {
      bowl = Math.max(bowl, 1 - normalized);
    } else if (normalized < 1.22) {
      rim = Math.max(rim, 1 - Math.abs(normalized - 1.08) / 0.14);
    }
  }

  return { bowl, rim };
}

function valueNoisePeriodic(
  x: number,
  y: number,
  seed: number,
  scale: number,
): number {
  const maxX = WIDTH - 1;
  const cellX = Math.floor((x / maxX) * scale);
  const cellY = Math.floor((y / (HEIGHT - 1)) * scale);
  const localX = (x / maxX) * scale - cellX;
  const localY = (y / (HEIGHT - 1)) * scale - cellY;
  const x0 = modulo(cellX, scale);
  const x1 = modulo(cellX + 1, scale);
  const y0 = cellY;
  const y1 = cellY + 1;
  const a = hashUnit(x0, y0, seed);
  const b = hashUnit(x1, y0, seed);
  const c = hashUnit(x0, y1, seed);
  const d = hashUnit(x1, y1, seed);
  const sx = localX * localX * (3 - 2 * localX);
  const sy = localY * localY * (3 - 2 * localY);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
}

function hashUnit(x: number, y: number, seed: number): number {
  let value = seed ^ Math.imul(x + 1, 0x1f123bb5) ^ Math.imul(y + 1, 0x5f356495);
  value = mixUint32(value);
  return uint32Unit(value);
}

interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

function parseHex(hex: string): Rgb {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    throw new RangeError(`Invalid RGB hex: ${hex}.`);
  }
  const value = Number.parseInt(hex.slice(1), 16);
  return {
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
  };
}

function writeRgba(target: Uint8Array, index: number, color: Rgb, alpha: number): void {
  target[index] = Math.round(clamp(color.r, 0, 255));
  target[index + 1] = Math.round(clamp(color.g, 0, 255));
  target[index + 2] = Math.round(clamp(color.b, 0, 255));
  target[index + 3] = Math.round(clamp(alpha, 0, 255));
}

function mixRgb(left: Rgb, right: Rgb, amount01: number): Rgb {
  const t = clamp01(amount01);
  return {
    r: lerp(left.r, right.r, t),
    g: lerp(left.g, right.g, t),
    b: lerp(left.b, right.b, t),
  };
}

function scaleRgb(color: Rgb, factor: number): Rgb {
  return {
    r: color.r * factor,
    g: color.g * factor,
    b: color.b * factor,
  };
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge1 <= edge0) {
    return value >= edge1 ? 1 : 0;
  }
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function lerp(left: number, right: number, amount: number): number {
  return left + (right - left) * amount;
}

function modulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

function mixUint32(value: number): number {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

function uint32Unit(value: number): number {
  return (value >>> 0) / 0xffffffff;
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
