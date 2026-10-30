/** VISCIV.1 — visual-only deterministic lights for a confirmed inhabited planet.
 * No population, road or settlement coordinates are added to scientific state.
 */
import type { Vida7CivilizationTier } from '../../domain/life/vida7-intelligence-civilizations';

export interface SystemSceneNightLightsInputV1 {
  readonly landMask: Uint8Array;
  readonly maskWidth: number;
  readonly maskHeight: number;
  readonly width: number;
  readonly height: number;
  readonly seedUint32: number;
  readonly tier: Vida7CivilizationTier;
}

export interface SystemSceneNightLightsAtlasV1 {
  readonly width: number;
  readonly height: number;
  readonly rgba: Uint8Array;
  readonly cityCount: number;
  readonly connectionCount: number;
}

interface NightCity {
  readonly x: number;
  readonly y: number;
  readonly size: number;
}

export function buildSystemScenePlanetNightLightsV1(
  input: SystemSceneNightLightsInputV1,
): SystemSceneNightLightsAtlasV1 {
  const { width, height, landMask, maskWidth, maskHeight, seedUint32, tier } = input;
  if (width < 8 || height < 8 || maskWidth < 2 || maskHeight < 2 ||
      landMask.length !== maskWidth * maskHeight || !Number.isInteger(seedUint32)) {
    throw new RangeError('VISCIV.1 requires a valid atlas, land mask and deterministic seed.');
  }

  const maskUniqueWidth = maskWidth - 1;
  const landAt = (x: number, y: number): number => {
    const u = ((Math.round(x) % (width - 1)) + (width - 1)) % (width - 1);
    const v = Math.max(0, Math.min(height - 1, Math.round(y)));
    const mx = Math.max(0, Math.min(maskUniqueWidth - 1, Math.floor(u * maskUniqueWidth / (width - 1))));
    const my = Math.max(0, Math.min(maskHeight - 1, Math.floor(v * maskHeight / height)));
    return landMask[my * maskWidth + mx] ?? 0;
  };

  const output = new Uint8Array(width * height * 4);
  // All pixels are opaque *black*: interpolation does not invent bright fringes.
  for (let p = 3; p < output.length; p += 4) output[p] = 255;
  const tierTag = tier === 'PRIMITIVE' ? 11 : tier === 'ADVANCED' ? 29 : 47;
  const cityGoal = tier === 'PRIMITIVE' ? 32 : tier === 'ADVANCED' ? 115 : 205;
  const minSeparation = tier === 'PRIMITIVE' ? 15 : tier === 'ADVANCED' ? 9 : 7;
  const seed = (seedUint32 ^ Math.imul(tierTag, 0x9e3779b1)) >>> 0;
  const cities: NightCity[] = [];
  const uniqueWidth = width - 1;

  // Sparse candidates are ranked by procedural suitability; reject sea, ice
  // and (mostly) deserts. No purported real-world settlement positions.
  for (let attempt = 0; attempt < cityGoal * 55 && cities.length < cityGoal; attempt++) {
    const x = 1 + Math.floor(noise(seed, attempt, 2) * (uniqueWidth - 2));
    const y = 1 + Math.floor(noise(seed, attempt, 3) * (height - 2));
    const ground = landAt(x, y);
    if (ground !== 1) continue;
    const nearPole = Math.abs(y / height - 0.5) > 0.39;
    if (nearPole && noise(seed, attempt, 7) < 0.90) continue;
    const tooClose = cities.some(city => {
      const dx = Math.min(Math.abs(city.x - x), uniqueWidth - Math.abs(city.x - x));
      const dy = city.y - y;
      return dx * dx + dy * dy < minSeparation * minSeparation;
    });
    if (tooClose) continue;
    const size = tier === 'PRIMITIVE' ? 1 :
      tier === 'ADVANCED' ? 1 + Math.floor(noise(seed, attempt, 11) * 3) :
      2 + Math.floor(noise(seed, attempt, 11) * 3);
    cities.push({ x, y, size });
  }

  // Important: light distribution is drawn only over actual available land.
  const paint = (x: number, y: number, rgb: readonly [number, number, number], intensity: number): void => {
    const px = ((Math.round(x) % uniqueWidth) + uniqueWidth) % uniqueWidth;
    const py = Math.round(y);
    if (py < 0 || py >= height || landAt(px, py) !== 1) return;
    const o = (py * width + px) * 4;
    const gain = Math.max(0, Math.min(1, intensity));
    output[o] = Math.min(255, Math.round(output[o]! + rgb[0] * gain));
    output[o + 1] = Math.min(255, Math.round(output[o + 1]! + rgb[1] * gain));
    output[o + 2] = Math.min(255, Math.round(output[o + 2]! + rgb[2] * gain));
  };
  const primitive: readonly [number, number, number] = [255, 135, 36];
  const urban: readonly [number, number, number] = [198, 226, 255];
  const megacity: readonly [number, number, number] = [158, 213, 255];

  let connectionCount = 0;
  if (tier === 'VERY_ADVANCED') {
    // Connect a small number of nearby cities when *every sampled section*
    // is on land; no straight corridors over oceans or polar caps.
    cities.forEach((city, i) => {
      const choices = cities
        .map((other, j) => ({ other, j, d: Math.hypot(other.x - city.x, other.y - city.y) }))
        .filter(item => item.j !== i && item.d > 7 && item.d < 95)
        .sort((a, b) => a.d - b.d || a.j - b.j)
        .slice(0, 2);
      for (const candidate of choices) {
        if (candidate.j <= i) continue;
        const steps = Math.ceil(candidate.d * 1.5);
        let onLand = true;
        for (let step = 0; step <= steps; step++) {
          const t = step / steps;
          const x = city.x + (candidate.other.x - city.x) * t;
          const y = city.y + (candidate.other.y - city.y) * t;
          if (landAt(x, y) !== 1) { onLand = false; break; }
        }
        if (!onLand) continue;
        connectionCount++;
        for (let step = 0; step <= steps; step++) {
          const t = step / steps;
          const x = city.x + (candidate.other.x - city.x) * t;
          const y = city.y + (candidate.other.y - city.y) * t;
          paint(x, y, [105, 167, 236], 0.24 + 0.11 * noise(seed, step, i));
        }
      }
    });
  }

  cities.forEach((city, i) => {
    const color = tier === 'PRIMITIVE' ? primitive :
      tier === 'ADVANCED' ? (noise(seed, i, 17) < 0.42 ? [255, 236, 189] as const : urban) : megacity;
    const radius = city.size;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const d = Math.hypot(dx, dy);
        if (d > radius + 0.3) continue;
        const brightness = tier === 'PRIMITIVE' ? (d < 0.65 ? 0.90 : 0.07) :
          Math.max(0.07, Math.pow(Math.max(0, 1 - d / (radius + 0.8)), 1.2));
        paint(city.x + dx, city.y + dy, color, brightness);
      }
    }
    if (tier !== 'PRIMITIVE') {
      const satellites = tier === 'ADVANCED' ? 4 : 9;
      for (let j = 0; j < satellites; j++) {
        const angle = noise(seed, i, j + 41) * Math.PI * 2;
        const distance = radius + 2 + noise(seed, i, j + 71) * (tier === 'ADVANCED' ? 7 : 11);
        paint(
          city.x + Math.cos(angle) * distance,
          city.y + Math.sin(angle) * distance,
          tier === 'ADVANCED' ? urban : megacity,
          0.40 + 0.44 * noise(seed, i, j + 103),
        );
      }
    }
  });

  // Equirectangular seam matches the surface atlas exactly.
  for (let y = 0; y < height; y++) {
    const first = (y * width) * 4;
    const last = (y * width + width - 1) * 4;
    output.set(output.subarray(first, first + 4), last);
  }

  return Object.freeze({ width, height, rgba: output, cityCount: cities.length, connectionCount });
}

function noise(seed: number, x: number, salt: number): number {
  let v = seed ^ Math.imul(x + 1, 0x85ebca6b) ^ Math.imul(salt + 17, 0xc2b2ae35);
  v = Math.imul(v ^ (v >>> 16), 0x7feb352d);
  v = Math.imul(v ^ (v >>> 15), 0x846ca68b);
  return ((v ^ (v >>> 16)) >>> 0) / 4294967296;
}

/** VISCIV.1b: reuses the canonical fiche atlas in the lower-resolution system
 * view. Maximum-luminance pooling preserves tiny fires without inventing new
 * settlements or changing their planet-relative locations. */
export function downsampleSystemScenePlanetNightLightsV1(
  source: SystemSceneNightLightsAtlasV1,
  targetWidth: number,
  targetHeight: number,
): SystemSceneNightLightsAtlasV1 {
  if (!Number.isInteger(targetWidth) || !Number.isInteger(targetHeight) ||
      targetWidth < 8 || targetHeight < 8 ||
      targetWidth > source.width || targetHeight > source.height ||
      targetWidth !== targetHeight * 2 ||
      source.rgba.length !== source.width * source.height * 4) {
    throw new RangeError('VISCIV.1b requires a bounded equirectangular night-light atlas.');
  }
  if (targetWidth === source.width && targetHeight === source.height) {
    return source;
  }

  const result = new Uint8Array(targetWidth * targetHeight * 4);
  const sourceSpan = source.width - 1;
  const destinationSpan = targetWidth - 1;
  for (let y = 0; y < targetHeight; y++) {
    const startY = Math.floor(y * source.height / targetHeight);
    const endY = Math.min(source.height, Math.ceil((y + 1) * source.height / targetHeight));
    for (let x = 0; x < destinationSpan; x++) {
      const startX = Math.floor(x * sourceSpan / destinationSpan);
      const endX = Math.min(sourceSpan, Math.ceil((x + 1) * sourceSpan / destinationSpan));
      let bestOffset = -1;
      let bestBrightness = 0;
      for (let sy = startY; sy < endY; sy++) {
        for (let sx = startX; sx < endX; sx++) {
          const i = (sy * source.width + sx) * 4;
          const brightness = source.rgba[i]! + source.rgba[i + 1]! + source.rgba[i + 2]!;
          if (brightness > bestBrightness) {
            bestBrightness = brightness;
            bestOffset = i;
          }
        }
      }
      const dst = (y * targetWidth + x) * 4;
      if (bestOffset >= 0) {
        result[dst] = source.rgba[bestOffset]!;
        result[dst + 1] = source.rgba[bestOffset + 1]!;
        result[dst + 2] = source.rgba[bestOffset + 2]!;
      }
      result[dst + 3] = 255;
    }
    const first = y * targetWidth * 4;
    const seam = (y * targetWidth + destinationSpan) * 4;
    result.set(result.subarray(first, first + 4), seam);
  }
  return Object.freeze({
    width: targetWidth,
    height: targetHeight,
    rgba: result,
    cityCount: source.cityCount,
    connectionCount: source.connectionCount,
  });
}
