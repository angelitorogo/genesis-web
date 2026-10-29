import type { SystemSceneMoonPresentationV1 } from './system-scene-moon-presentation';
import {
  buildMoonSurfaceMorphologyD,
  moonTextureDirectionD,
  sampleMoonTerrainD,
} from './system-scene-moon-geomorphology';

/** Explicit atlas dimensions for an individual scientific fiche; SystemScene retains its native LOD. */
export interface SystemSceneMoonTextureDimensionsV1 {
  readonly width: number;
  readonly height: number;
}

export interface SystemSceneMoonTextureDataV1 {
  readonly version: 1;
  readonly width: number;
  readonly height: number;
  readonly albedoRgba: Uint8Array;
  readonly reliefRgba: Uint8Array;
  readonly emissiveRgba: Uint8Array | null;
  readonly cloudRgba: Uint8Array | null;
}

/**
 * D — Deterministic moon geomorphology. All shapes are sampled in Cartesian
 * sphere coordinates (no equirectangular sine stripes, no longitude seam).
 * The generated textures only visualize the immutable scientific projection.
 */
export function buildSystemSceneMoonTextureV1(
  moon: SystemSceneMoonPresentationV1,
  dimensions: SystemSceneMoonTextureDimensionsV1 | null = null,
): SystemSceneMoonTextureDataV1 {
  if (moon.version !== 1) throw new RangeError(`Unsupported moon presentation version: ${moon.version}.`);
  if (dimensions !== null && (!Number.isInteger(dimensions.width) || !Number.isInteger(dimensions.height) ||
      dimensions.width < 2 || dimensions.height < 2 || dimensions.width > 2048 || dimensions.height > 1024)) {
    throw new RangeError('Moon atlas dimensions must be integer dimensions between 2×2 and 2048×1024.');
  }
  const width = dimensions?.width ?? (moon.shapeClass === 'MAJOR_PLANETARY' ? 192 : 128);
  const height = dimensions?.height ?? width / 2;
  const base = parseHex(moon.presentationBaseColorHex);
  const accent = parseHex(moon.presentationAccentColorHex);
  const geometry = buildMoonSurfaceMorphologyD(moon);
  const albedo = new Uint8Array(width * height * 4);
  const relief = new Uint8Array(width * height * 4);
  const moltenSurface = moon.surfaceStyle === 'VOLCANIC' && geometry.silicateActivity01 > 0.55 &&
    moon.sourceGeologyRegime === 'EXTREME';
  const emissive = moltenSurface ? new Uint8Array(width * height * 4) : null;
  const clouds = moon.presentationCloudCoverage01 > 0.001 ? new Uint8Array(width * height * 4) : null;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      // Both seam texels sample exactly the same Cartesian position.
      const sx = x === width - 1 ? 0 : x;
      const index = (y * width + x) * 4;
      const direction = moonTextureDirectionD(sx, y, width, height);
      const t = sampleMoonTerrainD(direction, moon, geometry);
      const craterBowl = Math.max(0, t.crater01);
      const craterRim = Math.max(0, -t.crater01);
      const ridges = t.fracture01;

      const province = t.province01;
      const renewal = t.renewed01;
      const ancientTerrain = clamp01((1 - renewal) * (0.34 + 0.66 * (1 - province)));
      const renewedTerrain = clamp01(renewal * (0.56 + 0.44 * province));
      const transitionBelt = clamp01(t.scarp01 * (0.46 + 0.82 * renewal));
      // Broad provinces are material regions, not a simple palette overlay.
      let color = mixRgb(base, accent, clamp01(0.06 + 0.42 * t.terrain01 + 0.40 * province));
      let brightness = 0.69 + 0.43 * t.terrain01 + 0.13 * province -
        0.48 * craterBowl + 0.31 * craterRim + 0.08 * t.ejecta01;
      const mineral = mixRgb({ r: 76, g: 74, b: 72 }, { r: 164, g: 147, b: 121 }, t.terrain01);
      color = mixRgb(color, mineral, 0.28 * geometry.visualProfile.mineralRegions01 * (1 - province));
      // Warped plains preserve their own material texture, while impact contrast
      // and topographic roughness reduce within (but not across) the province.
      const plainMaterial = mixRgb(mineral, base, 0.40 + 0.22 * province);
      const renewedWarm = mixRgb(
        mixRgb({ r: 110, g: 92, b: 78 }, { r: 178, g: 139, b: 101 }, province),
        mixRgb({ r: 124, g: 120, b: 113 }, { r: 194, g: 180, b: 164 }, province),
        clamp01(geometry.iceRichness01),
      );
      const ancientTone = mixRgb(
        { r: 68, g: 67, b: 70 },
        { r: 120, g: 97, b: 77 },
        clamp01(0.18 + 0.62 * t.terrain01),
      );
      const plainsContrast = 1 - 0.72 * renewedTerrain;
      brightness = 0.92 + (brightness - 0.92) * plainsContrast;
      color = mixRgb(color, plainMaterial, renewedTerrain * 0.68);
      color = mixRgb(color, renewedWarm, renewedTerrain * (0.36 + 0.52 * geometry.crustRenewal01));
      color = mixRgb(color, ancientTone, ancientTerrain * (0.18 + 0.20 * (1 - province)));
      color = mixRgb(color, { r: 212, g: 182, b: 142 }, transitionBelt * (0.18 + 0.18 * geometry.crustRenewal01));
      brightness += renewedTerrain * (0.12 + 0.16 * province) -
        ancientTerrain * 0.08 +
        t.scarp01 * (0.14 + 0.18 * geometry.crustRenewal01) +
        transitionBelt * 0.10;

      if (moon.surfaceStyle === 'ICY' || moon.surfaceStyle === 'MIXED') {
        const iceColor = mixRgb(
          { r: 153, g: 179, b: 196 },
          { r: 222, g: 232, b: 231 },
          clamp01(0.42 + 0.33 * t.terrain01 + 0.20 * geometry.iceRichness01),
        );
        const iceMask = clamp01(t.iceMask01 * (moon.surfaceStyle === 'ICY' ? 0.92 : 0.74) *
          (0.74 + 0.28 * province));
        color = mixRgb(color, iceColor, iceMask * 0.94);
        // Plate-like terrains and darker exposures depend on actual tectonic activity.
        const plateTones = mixRgb({ r: 92, g: 126, b: 151 }, { r: 212, g: 228, b: 236 }, province);
        color = mixRgb(color, plateTones, geometry.iceTectonics01 *
          (0.26 + 0.26 * (1 - province)) * iceMask);
        // Cold active ice yields incised fractures and pale uplifted ridges.
        const iceFracture = clamp01(powCurve(ridges, 0.82) * (0.76 + 0.34 * geometry.iceTectonics01) * iceMask);
        const iceShoulder = clamp01(t.scarp01 * iceMask * (0.50 + 0.76 * geometry.iceTectonics01));
        const ancientIce = clamp01((1 - renewedTerrain) * iceMask * (0.26 + 0.30 * (1 - province)));
        const fractureCoreColor = mixRgb({ r: 44, g: 93, b: 132 }, { r: 82, g: 128, b: 161 }, t.terrain01);
        const fractureShoulderColor = mixRgb({ r: 156, g: 193, b: 217 }, { r: 232, g: 240, b: 244 }, province);
        const oldIceColor = mixRgb({ r: 126, g: 144, b: 160 }, { r: 188, g: 202, b: 211 }, t.terrain01);
        color = mixRgb(color, oldIceColor, 0.18 * ancientIce);
        color = mixRgb(color, fractureShoulderColor, 0.36 * iceShoulder + 0.12 * iceFracture);
        color = mixRgb(color, fractureCoreColor, 0.82 * iceFracture);
        brightness += iceMask * 0.06 - iceFracture * 0.17 + 0.14 * iceShoulder + 0.12 * t.scarp01 - 0.04 * ancientIce;
        if (moon.presentationLiquidCoverage01 > 0.025) {
          const icyLakeMask = clamp01(t.liquidMask01 * (0.58 + 0.44 * (1 - t.iceMask01) + 0.18 * renewedTerrain));
          ({ color, brightness } = applySurfaceWater(color, brightness, icyLakeMask,
            moon.presentationLiquidCoverage01, t.terrain01, 0.06));
        }
      } else if (moon.surfaceStyle === 'OCEANIC') {
        // Visible liquid is a presentation scenario gated by the projection.
        const seaMask = t.liquidMask01;
        const coastalBand = seaMask * (1 - smoothstep(0.54, 0.96, seaMask));
        const shelfMask = seaMask * smoothstep(0.26, 0.68, t.terrain01) * (1 - smoothstep(0.70, 0.96, seaMask));
        const deepMask = seaMask * smoothstep(0.56, 0.95, seaMask) * (1 - smoothstep(0.62, 0.96, t.terrain01));
        const deepOcean = mixRgb({ r: 3, g: 44, b: 132 }, { r: 14, g: 82, b: 170 }, clamp01(0.18 + 0.52 * t.terrain01));
        const shallowOcean = mixRgb({ r: 46, g: 144, b: 216 }, { r: 116, g: 206, b: 238 }, clamp01(0.32 + 0.48 * t.terrain01));
        const coastalWater = mixRgb({ r: 74, g: 174, b: 224 }, { r: 132, g: 220, b: 236 }, clamp01(0.32 + 0.42 * t.terrain01));
        color = mixRgb(color, shallowOcean, seaMask * 0.56 + shelfMask * 0.24);
        color = mixRgb(color, deepOcean, deepMask * 0.88);
        color = mixRgb(color, coastalWater, coastalBand * 0.72);
        color = mixRgb(color, { r: 202, g: 216, b: 188 }, coastalBand * 0.26);
        color = mixRgb(color, { r: 205, g: 223, b: 222 }, t.iceMask01 * 0.56);
        brightness += t.iceMask01 * 0.04 - 0.03 * deepMask + 0.08 * coastalBand + 0.02 * shelfMask;
      } else if (moon.surfaceStyle === 'VOLCANIC') {
        const plains = clamp01(renewal * (0.72 + 0.42 * (1 - province)));
        color = mixRgb(color, { r: 34, g: 35, b: 38 }, plains * 0.94);
        const altered = clamp01(0.18 * t.terrain01 + 0.46 * t.scarp01 + 0.42 * province);
        color = mixRgb(color, { r: 156, g: 109, b: 72 }, (0.08 + 0.52 * altered) * (1 - plains));
        color = mixRgb(color, { r: 192, g: 146, b: 98 }, transitionBelt * 0.22);
        if (moon.presentationLiquidCoverage01 > 0.03) {
          ({ color, brightness } = applySurfaceWater(color, brightness, t.liquidMask01,
            moon.presentationLiquidCoverage01, t.terrain01, 0.04));
        }
        brightness += transitionBelt * 0.10 - plains * 0.08 + renewal * 0.08;
      } else {
        // Rock-rich, old surfaces preserve impact history; low-ice silicates
        // do not acquire globally white glacial veneers.
        color = mixRgb(color, { r: 100, g: 99, b: 95 }, 0.14 * (1 - t.terrain01));
        color = mixRgb(color, { r: 214, g: 222, b: 220 }, t.iceMask01 * 0.22);
        // Exposed bedrock, large smooth ejecta plains and old crater basins.
        const renewedRock = mixRgb({ r: 81, g: 79, b: 82 }, { r: 136, g: 110, b: 84 }, t.terrain01);
        color = mixRgb(color, renewedRock, renewal * 0.48);
        color = mixRgb(color, { r: 182, g: 154, b: 124 }, transitionBelt * 0.14);
        if (moon.presentationLiquidCoverage01 > 0.03) {
          ({ color, brightness } = applySurfaceWater(color, brightness,
            clamp01(t.liquidMask01 * (1 - t.iceMask01 * 0.7) * (0.88 + 0.18 * renewedTerrain)),
            moon.presentationLiquidCoverage01,
            t.terrain01, 0.07));
        }
      }

      // D.3f — high *potential* with unresolved surface pressure can expose
      // topographic lowlands and pale mineral/volatile deposits, NOT deep-blue
      // permanent seas. Calos-like moons remain geologically interesting while
      // their visually rendered water remains conditional on a B gas column.
      if (moon.presentationLiquidCoverage01 === 0 &&
          moon.sourceSurfaceLiquidWaterPotentialIndex01 >= 0.72 &&
          moon.sourceWaterInventoryIndex01 >= 0.42 &&
          moon.sourceEstimatedSurfaceTemperatureKelvin >= 273.15 &&
          moon.sourceEstimatedSurfaceTemperatureKelvin <= 325) {
        const exposedBasin = smoothstep(0.40, 0.83, t.liquidMask01) *
          (0.40 + 0.60 * (1 - t.terrain01));
        color = mixRgb(color, { r: 143, g: 134, b: 119 }, exposedBasin * 0.42);
        brightness -= 0.055 * exposedBasin;
      }

      if (moon.surfaceStyle !== 'VOLCANIC') {
        // Reactivated regional faults stand out without a global sin-wave pattern.
        const fractureShadow = ridges * (geometry.iceTectonics01 > 0.35 ? 0.08 : 0.045);
        color = mixRgb(color, { r: 78, g: 89, b: 104 }, fractureShadow);
        brightness += ridges * (geometry.iceTectonics01 > 0.35 ? 0.082 : -0.020) + transitionBelt * 0.030;
      }
      writeRgba(albedo, index, scaleRgb(color, clamp(brightness, 0.39, 1.26)), 255);

      const relief01 = clamp01(t.relief01 - 0.14 * craterBowl + 0.15 * craterRim -
        0.04 * t.liquidMask01 * clamp01(moon.presentationLiquidCoverage01 * 2));
      writeRgba(relief, index, { r: 255 * relief01, g: 255 * relief01, b: 255 * relief01 }, 255);

      if (emissive !== null) {
        const glow = clamp01(t.molten01 * moon.presentationVolcanicCoverage01 * 1.8);
        const colorGlow = mixRgb({ r: 191, g: 45, b: 8 }, { r: 255, g: 156, b: 45 }, t.terrain01);
        writeRgba(emissive, index, scaleRgb(colorGlow, glow), 255);
      }
      if (clouds !== null) {
        const cloudCoverage = moon.presentationCloudCoverage01;
        const cloudWave = Math.sin(direction.x * 14.7 + direction.y * 6.9 + moon.presentationSeedUint32 * 0.00000037) *
          Math.cos(direction.z * 12.1 - direction.y * 5.3);
        const patch = 0.45 * t.terrain01 + 0.22 * t.province01 + 0.33 * (0.5 + 0.5 * cloudWave);
        const cloudMask = smoothstep(0.67 - 0.30 * cloudCoverage,
          0.81 - 0.22 * cloudCoverage, patch);
        writeRgba(clouds, index, mixRgb({ r: 203, g: 209, b: 213 }, { r: 244, g: 245, b: 243 }, patch),
          Math.round(218 * clamp01(cloudMask)));
      }
    }
  }

  return Object.freeze({ version: 1 as const, width, height, albedoRgba: albedo,
    reliefRgba: relief, emissiveRgba: emissive, cloudRgba: clouds });
}

interface Rgb { readonly r: number; readonly g: number; readonly b: number }

function applySurfaceWater(
  color: Rgb,
  brightness: number,
  mask01: number,
  liquidCoverage01: number,
  terrain01: number,
  darken: number,
): { readonly color: Rgb; readonly brightness: number } {
  const coverage = clamp01(mask01 * liquidCoverage01 * 1.10);
  if (coverage <= 0) {
    return { color, brightness };
  }
  const depthBias = 1 - smoothstep(0.52, 0.92, terrain01);
  const deepMask = clamp01(coverage * smoothstep(0.56, 0.96, mask01) * (0.56 + 0.44 * depthBias));
  const shoreline = clamp01(coverage * smoothstep(0.12, 0.44, mask01) * (1 - smoothstep(0.56, 0.94, mask01)));
  const shelf = clamp01(coverage * (1 - smoothstep(0.52, 0.90, mask01)) * smoothstep(0.26, 0.84, terrain01));
  const lagoon = clamp01(coverage * (0.20 + 0.50 * smoothstep(0.30, 0.72, terrain01)) * (1 - deepMask));
  const deepOcean = mixRgb({ r: 4, g: 44, b: 132 }, { r: 12, g: 86, b: 178 }, clamp01(0.18 + 0.48 * terrain01));
  const shallowOcean = mixRgb({ r: 44, g: 142, b: 216 }, { r: 108, g: 200, b: 238 }, clamp01(0.28 + 0.54 * terrain01));
  const coastalWater = mixRgb({ r: 86, g: 184, b: 228 }, { r: 138, g: 222, b: 238 }, clamp01(0.36 + 0.42 * terrain01));
  let outColor = mixRgb(color, shallowOcean, shelf * 0.78 + lagoon * 0.18);
  outColor = mixRgb(outColor, deepOcean, deepMask * 0.90);
  outColor = mixRgb(outColor, coastalWater, shoreline * 0.82 + shelf * 0.16);
  outColor = mixRgb(outColor, { r: 212, g: 231, b: 226 }, shoreline * 0.16);
  return {
    color: outColor,
    brightness: brightness - darken * (0.24 + 0.76 * deepMask) + 0.06 * shoreline + 0.02 * shelf,
  };
}

function parseHex(value: string): Rgb {
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new RangeError(`Invalid RGB hex: ${value}.`);
  const number = Number.parseInt(value.slice(1), 16);
  return { r: (number >> 16) & 255, g: (number >> 8) & 255, b: number & 255 };
}
function writeRgba(target: Uint8Array, index: number, rgb: Rgb, alpha: number): void {
  target[index] = Math.round(clamp(rgb.r, 0, 255));
  target[index + 1] = Math.round(clamp(rgb.g, 0, 255));
  target[index + 2] = Math.round(clamp(rgb.b, 0, 255));
  target[index + 3] = Math.round(clamp(alpha, 0, 255));
}
function mixRgb(a: Rgb, b: Rgb, t0: number): Rgb {
  const t = clamp01(t0);
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}
function scaleRgb(a: Rgb, f: number): Rgb { return { r: a.r * f, g: a.g * f, b: a.b * f }; }
function powCurve(value: number, exponent: number): number { return Math.pow(clamp01(value), exponent); }
function smoothstep(low: number, high: number, x: number): number {
  if (high <= low) return x >= high ? 1 : 0;
  const t = clamp01((x - low) / (high - low));
  return t * t * (3 - 2 * t);
}
function clamp01(n: number): number { return clamp(n, 0, 1); }
function clamp(n: number, a: number, b: number): number { return Math.max(a, Math.min(b, n)); }
