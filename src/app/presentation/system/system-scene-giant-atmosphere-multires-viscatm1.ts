import type { SystemSceneGiantAtmospherePresentationSnapshot } from './system-scene-giant-atmosphere-presentation';
import { refinePlanetRgbaTextureV1 } from './system-scene-planet-texture-refinement';

/**
 * VISCATM.1 — Visual, not physical, multiscale cloud-top reconstruction.
 *
 * The canonical 25.4 atlas remains the source of the large-scale circulation
 * and palette. Additional detail is continuous in spherical UV coordinates,
 * periodic in longitude, deterministic and bounded. No solid relief or
 * biological/observational information is generated here.
 */
export type GiantAtmosphereDetailLayerVISCATM1 = 'CLOUD_TOPS' | 'UPPER_HAZE';

export const GIANT_ATMOSPHERE_DETAIL_VERSION_VISCATM1 = 3; // VISCATM.1c: nested zonal flow and bounded vortices

/**
 * LOD2.1 — Two atlas resolutions in SystemScene: 256x128 distant,
 * 512x256 focused (matching solid planets). The 1024x512 procedural
 * generator stays available to scientific fiches, which are unchanged.
 *
 * Scene selection is already gated by projected diameter (300px to enter,
 * 210px to leave) in system-scene.ts. Here we keep the focused resolution
 * constant, so the intermediate 512 -> 1024 transition and its expensive
 * synchronous regeneration are gone. `currentWidth` is retained for API
 * compatibility and is validated to catch accidental third-stage requests.
 */
export function giantAtmosphereFocusWidthVISCATM1(
  projectedDiameterPixels: number,
  currentWidth: number | null,
): 512 {
  if (!Number.isFinite(projectedDiameterPixels) || projectedDiameterPixels < 0) {
    throw new RangeError('Projected giant diameter must be non-negative and finite.');
  }
  if (currentWidth !== null && currentWidth !== 512 && currentWidth !== 1024) {
    throw new RangeError('Unexpected focused giant atlas width.');
  }
  return 512;
}

export function refineGiantAtmosphereMultiresVISCATM1(
  source: Uint8Array,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  seedUint32: number,
  atmosphere: SystemSceneGiantAtmospherePresentationSnapshot,
  layer: GiantAtmosphereDetailLayerVISCATM1,
): Uint8Array {
  if (!Number.isInteger(targetWidth) || targetWidth < sourceWidth ||
      targetWidth > 2048 || (targetWidth & 1) !== 0 ||
      sourceWidth < 8 || sourceHeight < 4 ||
      sourceWidth !== sourceHeight * 2 ||
      source.length !== sourceWidth * sourceHeight * 4) {
    throw new RangeError('VISCATM.1 requires a bounded 2:1 RGBA atlas.');
  }
  const sampledAtlas = targetWidth === sourceWidth
    ? new Uint8Array(source)
    : refinePlanetRgbaTextureV1(
        source, sourceWidth, sourceHeight, targetWidth, seedUint32,
        layer === 'CLOUD_TOPS' ? 'GAS' : 'CLOUD',
      );
  const result = new Uint8Array(sampledAtlas);
  const height = targetWidth / 2;
  const span = targetWidth - 1;
  const turbulence = Math.max(0, Math.min(1, atmosphere.presentationTurbulence01));
  const jetSharpness = Math.max(0, Math.min(1, atmosphere.presentationJetSharpness01));
  const stormCoverage = Math.max(0, Math.min(1, atmosphere.presentationStormCoverage01));
  const regimeFactor = atmosphere.regime === 'GAS_GIANT' ? 1.0
    : atmosphere.regime === 'ICE_GIANT' ? 0.83 : 0.67;
  // Same meso pattern at every LOD; higher frequencies only become legible
  // as more texels cover the planet. Mipmaps handle subpixel filtering.
  // 1b: VISCATM.1 was too subtle once the optical shell was composited.
  // Shadow/condensation filaments must have resolved contrast at ~350 px disc
  // diameter, not only on the raw 1024px equirectangular map.
  const mesoAmplitude = (33 + 35 * turbulence + 8 * jetSharpness) * regimeFactor;
  const fineAmplitude = (17 + 23 * turbulence) * regimeFactor;
  const fineWeight = targetWidth <= 256 ? 0.20 : targetWidth <= 512 ? 0.65 : 1.0;
  const beltFrequency = atmosphere.presentationBandCount * Math.PI;
  const seedA = seedUint32 ^ 0x76b19a53;
  const seedB = seedUint32 ^ 0x91e10da5;
  const seedC = seedUint32 ^ 0x34b87d17;
  const seedD = seedUint32 ^ 0xc61de318;
  const phase = ((seedUint32 >>> 8) & 0xffff) / 0xffff * Math.PI * 2;
  const stormLongitude = hashUnit(seedUint32, 0x51da3a71);
  const stormLatitude = 0.16 + 0.68 * hashUnit(seedUint32, 0x34cd3ab9);
  const stormPhase = hashUnit(seedUint32, 0x9e771fd3) * Math.PI * 2;
  // 1c: several reproducible embedded eddies, not a second copy of the
  // canonical storms. The curl follows local cloud-flow lines and is strongly
  // windowed; no artificial crater-shaped circular albedo decals.
  const embeddedEddies = Array.from({ length: 3 + Math.round(stormCoverage * 4) }, (_, index) => ({
    u: hashUnit(seedUint32 ^ Math.imul(index + 1, 0x32a3e4b1), 0x9c51d6a7),
    v: 0.18 + 0.64 * hashUnit(seedUint32 ^ Math.imul(index + 1, 0x4367c121), 0x1b783bd1),
    radiusU: 0.024 + 0.027 * hashUnit(seedUint32 ^ index, 0x3cd782a1),
    radiusV: 0.020 + 0.026 * hashUnit(seedUint32 ^ index, 0x62f9841d),
    handedness: hashUnit(seedUint32 ^ index, 0xa34ff113) < 0.5 ? -1 : 1,
    phase: hashUnit(seedUint32 ^ index, 0x7b14c1ee) * Math.PI * 2,
  }));
  const zonalThreadFrequency = 6.0 + (atmosphere.regime === 'GAS_GIANT' ? 1.6
    : atmosphere.regime === 'ICE_GIANT' ? 0.35 : 0.85);
  const channels = layer === 'CLOUD_TOPS' ? 3 : 4;

  for (let y = 0; y < height; y += 1) {
    const v = (y + 0.5) / height;
    const latitudeFade = Math.pow(Math.max(0, Math.sin(v * Math.PI)), 0.50);
    // Match the canonical generator's latitude coordinate. The former 2π
    // doubled the visual jet count and blurred unrelated horizontal bands.
    const jetPosition = (v - 0.5) * beltFrequency;
    const latShear = Math.sin(jetPosition * 0.48 + phase) * (0.016 + 0.017 * turbulence);
    const row = y * targetWidth * 4;

    for (let x = 0; x < span; x += 1) {
      const u = x / span;
      // 2D periodic noise wraps exactly in longitude. Different latitude
      // frequencies emulate anisotropic cloud filaments, not solid topography.
      const wave = periodicCloudNoiseVISCATM1(u + latShear, v, 13, 17, seedA);
      const curl = periodicCloudNoiseVISCATM1(u + (wave - 0.5) * 0.025, v, 37, 29, seedB);
      const wisps = periodicCloudNoiseVISCATM1(u + (curl - 0.5) * 0.014, v, 83, 61, seedC);
      const grit = targetWidth >= 512
        ? periodicCloudNoiseVISCATM1(u + (wisps - 0.5) * 0.006, v, 149, 107, seedD)
        : 0.5;
      // Smooth density shapes bounded by coherent noise, with crisp but
      // non-pixelated cloud edges. These follow zonal jets, not topography.
      const filament = (wave - 0.5) * 0.36 + (curl - 0.5) * 0.64;
      const highFrequency = (wisps - 0.5) * 0.67 + (grit - 0.5) * 0.33;
      const condensate = 0.40 * wave + 0.44 * curl + 0.16 * wisps;
      const cloudFront = smoothstep(0.43, 0.58, condensate) - 0.5;
      const cloudEdge = smoothstep(0.43, 0.49, condensate) -
        smoothstep(0.55, 0.63, condensate);
      const jetThread = Math.sin(jetPosition * 2.6 +
        (wave - 0.5) * 5.4 + (curl - 0.5) * 3.7);
      const irregularJet = Math.sign(jetThread) *
        Math.pow(Math.abs(jetThread), 8) * (0.45 + 0.55 * curl);

      // A localized spiral perturbation, bounded to stormy regimes. The
      // visible center is a circulation proxy, never an asserted observation.
      let vortex = 0;
      if (stormCoverage > 0.02) {
        const du = shortestPeriodicDistance(u, stormLongitude);
        const dv = v - stormLatitude;
        if (Math.abs(du) < 0.10 && Math.abs(dv) < 0.085) {
          const rho = Math.sqrt((du / 0.065) ** 2 + (dv / 0.052) ** 2);
          const curlAngle = Math.atan2(dv / 0.052, du / 0.065);
          vortex = Math.exp(-rho * rho * 1.55) *
            Math.sin(3.0 * curlAngle + rho * 7.0 + stormPhase) *
            Math.min(1, stormCoverage * 4.5);
        }
      }
      const jetFilament = Math.sin(jetPosition + (wave - 0.5) * 3.6 + phase) *
        (curl - 0.5) * (0.20 + 0.40 * jetSharpness);

      // 1c: slender streamers trace the same jets as the source atlas. Their
      // phase is periodic in longitude; the small high-frequency envelope is
      // only resolved when the atlas can actually represent it.
      const currentZonal = jetPosition * zonalThreadFrequency +
        (wave - 0.5) * 6.3 + (curl - 0.5) * 3.5 +
        Math.sin(u * Math.PI * 2 * 9 + phase + v * 7) * 1.3;
      const longStreamer = Math.sin(currentZonal) *
        (0.48 + 0.52 * Math.max(0, 2 * condensate - 0.55));
      const narrowFilament = Math.cos(currentZonal * 1.63 +
        (wisps - 0.5) * 6 + (grit - 0.5) * 2.5);
      const shearBound = Math.min(1, Math.abs(Math.sin(jetPosition * 0.82 + phase)) * 1.8);
      const streamedCloud = (longStreamer * 12.4 +
        narrowFilament * (targetWidth > 512 ? 10.8 : 5.2) * shearBound) *
        (0.72 + turbulence * 0.55) * regimeFactor;

      // Localized vortices advect streamers inside elongated cloud decks. In
      // particular the soft core is not drawn as a solid circular patch.
      let eddyFlow = 0;
      if (targetWidth >= 512) {
        for (const eddy of embeddedEddies) {
          const dx = shortestPeriodicDistance(u, eddy.u);
          const dy = v - eddy.v;
          if (Math.abs(dx) > eddy.radiusU * 2.1 ||
              Math.abs(dy) > eddy.radiusV * 2.1) continue;
          const rx = dx / eddy.radiusU;
          const ry = dy / eddy.radiusV;
          const r2 = rx * rx + ry * ry;
          const spiral = Math.atan2(ry, rx) * eddy.handedness * 2 +
            Math.sqrt(r2) * 8.0 + eddy.phase;
          eddyFlow += Math.exp(-r2 * 1.3) *
            Math.sin(spiral) * (17 + 8 * turbulence) * regimeFactor;
        }
      }
      const signal = latitudeFade * (
        (filament + jetFilament) * mesoAmplitude +
        cloudFront * (23 + 12 * turbulence) * regimeFactor +
        cloudEdge * (16 + 9 * jetSharpness) * regimeFactor +
        irregularJet * (8 + 11 * jetSharpness) * regimeFactor +
        highFrequency * fineAmplitude * fineWeight + vortex * (26 + 12 * turbulence) +
        streamedCloud * fineWeight + eddyFlow
      );

      // Advect the existing large-scale bands by a small stationary cloud-flow
      // field, rather than superimposing random terrain-like speckle. The
      // displacement uses normalized UV so 512px and 1024px match spatially.
      const warpAmount = targetWidth > sourceWidth ? (0.011 + 0.013 * turbulence) : 0;
      const warpedU = u + (curl - 0.5) * warpAmount * latitudeFade * 0.45;
      const warpedV = Math.max(0, Math.min(1,
        v + ((wave - 0.5) * 0.85 + (wisps - 0.5) * 0.15) *
          warpAmount * latitudeFade,
      ));
      const offset = row + x * 4;
      if (layer === 'CLOUD_TOPS') {
        // Chromatic perturbations are correlated: the original palette and
        // canonical circulation remain the dominant components.
        for (let channel = 0; channel < 3; channel += 1) {
          const base = warpAmount > 0
            ? samplePeriodicBilinear(sampledAtlas, targetWidth, height, warpedU, warpedV, channel)
            : sampledAtlas[offset + channel]!;
          // Edge-preserving latitude sharpening recovers belt separation from
          // the interpolated 256px source. It is computed on the same field at
          // 512/1024, without changing the underlying colour family.
          let edge = 0;
          if (targetWidth >= 512) {
            const above = samplePeriodicBilinear(sampledAtlas, targetWidth, height,
              warpedU, Math.max(0, warpedV - 0.010), channel);
            const below = samplePeriodicBilinear(sampledAtlas, targetWidth, height,
              warpedU, Math.min(1, warpedV + 0.010), channel);
            edge = (base - (above + below) * 0.5) * 0.42;
          }
          result[offset + channel] = byte(base + edge +
            signal * (0.94 + channel * 0.028));
        }
      } else if (sampledAtlas[offset + 3]! > 0) {
        // Zero haze remains absent; changing detail never invents a cloud deck.
        result[offset + 3] = byte(sampledAtlas[offset + 3]! *
          Math.max(0.65, Math.min(1.24, 1 + signal / 70)));
      }
    }
    // Both diffuse textures and transparent haze share the exact UV seam.
    result.set(result.subarray(row, row + channels), row + span * 4);
    if (channels === 3) result[row + span * 4 + 3] = result[row + 3]!;
  }
  return result;
}

function samplePeriodicBilinear(
  rgba: Uint8Array, width: number, height: number,
  u: number, v: number, channel: number,
): number {
  const span = width - 1;
  const sx = mod(u * span, span);
  const sy = Math.max(0, Math.min(height - 1, v * height - 0.5));
  const x0 = Math.floor(sx);
  const x1 = (x0 + 1) % span;
  const y0 = Math.floor(sy);
  const y1 = Math.min(height - 1, y0 + 1);
  const ax = sx - x0;
  const ay = sy - y0;
  const a = (y0 * width + x0) * 4 + channel;
  const b = (y0 * width + x1) * 4 + channel;
  const c = (y1 * width + x0) * 4 + channel;
  const d = (y1 * width + x1) * 4 + channel;
  return lerp(lerp(rgba[a]!, rgba[b]!, ax), lerp(rgba[c]!, rgba[d]!, ax), ay);
}

function periodicCloudNoiseVISCATM1(
  u: number, v: number, xRepeat: number, yFrequency: number, seed: number,
): number {
  const fx = u * xRepeat;
  const fy = v * yFrequency;
  const ix = Math.floor(fx);
  const iy = Math.floor(fy);
  const ax = fade(fx - ix);
  const ay = fade(fy - iy);
  const x0 = mod(ix, xRepeat);
  const x1 = mod(ix + 1, xRepeat);
  const a = lerp(lattice(x0, iy, seed), lattice(x1, iy, seed), ax);
  const b = lerp(lattice(x0, iy + 1, seed), lattice(x1, iy + 1, seed), ax);
  return lerp(a, b, ay);
}

function lattice(x: number, y: number, seed: number): number {
  let h = seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}

function hashUnit(seed: number, salt: number): number {
  return lattice(seed & 0xffff, seed >>> 16, salt);
}

function shortestPeriodicDistance(a: number, b: number): number {
  let d = a - b;
  if (d > 0.5) d -= 1;
  if (d < -0.5) d += 1;
  return d;
}
function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function mod(x: number, m: number): number { return ((x % m) + m) % m; }
function fade(x: number): number { return x * x * (3 - 2 * x); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function byte(v: number): number { return Math.max(0, Math.min(255, Math.round(v))); }
