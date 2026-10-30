import {
  type SystemScenePlanetTextureData,
} from './system-scene-planet-texture';

import {
  type SystemScenePlanetSurfacePresentationSnapshot,
} from './system-scene-planet-surface-presentation';

export interface SystemScenePlanetVegetationProfileV1 {
  readonly coverageFraction01: number;
  readonly lushness01: number;
  readonly floraSpeciesCount: number;
  readonly paletteHexes: readonly string[];
  readonly paletteEntries?: readonly SystemScenePlanetVegetationPaletteEntryV1[];
}

export interface SystemScenePlanetVegetationPaletteEntryV1 {
  readonly hex: string;
  readonly weight01: number;
}

export interface SystemScenePlanetSurfaceTextureInput {
  readonly systemIdentity: string;
  readonly planetId: string;
  readonly baseTexture: SystemScenePlanetTextureData;
  readonly surface: SystemScenePlanetSurfacePresentationSnapshot;
  /** VISBIO.1b preview-only greenery overlay for worlds with flora. */
  readonly vegetationProfile?: SystemScenePlanetVegetationProfileV1;
  readonly visualSeedUint32?: number;
}

export interface SystemScenePlanetSurfaceTextureData {
  readonly version: 1;
  readonly width: number;
  readonly height: number;
  readonly rgba: Uint8Array;
  readonly emissiveRgba: Uint8Array | null;
  readonly cloudRgba: Uint8Array | null;
  /** D.4c: visual roughness in the Three.js green channel, not new geology. */
  readonly roughnessRgba: Uint8Array | null;
  /** D.4c: bounded grayscale bump proxy, not a physical elevation field. */
  readonly reliefRgba: Uint8Array | null;
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

interface VegetationToneV1 {
  readonly rgb: [number, number, number];
  readonly cumulativeWeight01: number;
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
      roughnessRgba: null,
      reliefRgba: null,
      measuredLiquidCoverageFraction01: null,
      measuredIceCoverageFraction01: null,
      measuredDesertCoverageFraction01: null,
      measuredVolcanicCoverageFraction01: null,
      measuredCloudCoverageFraction01: null,
    });
  }

  const uniqueWidth = width - 1;
  const uniquePixelCount = uniqueWidth * height;
  const seed = input.visualSeedUint32 ?? systemScenePlanetSurfaceTextureSeedV1(input.systemIdentity, input.planetId);
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

  // VISBIO.1c: flora chooses suitable exposed land *before* the illustrative
  // desert mask. Previously deserts claimed tropical/temperate continents
  // first, so the remaining LAND was concentrated near the poles. This does
  // not touch the immutable liquid and ice area masks.
  const vegetationProfile = input.vegetationProfile ?? null;
  const vegetationCandidates = vegetationProfile === null ? [] : fields.filter(
    field =>
      semantic[field.uniqueIndex] === LAND &&
      vegetationLatitudeEligibleV1(field, surface),
  );
  const vegetatedSelected = selectRegionalVegetationV1(
    vegetationCandidates,
    vegetationProfile,
    uniqueWidth,
    height,
  );
  const vegetationPalette =
    buildVegetationPaletteColorsV1(vegetationProfile);

  // 25.3 desert is a PRESENTATION proxy, not a physical observation. In a
  // world with confirmed flora it cannot erase known green continents.
  const desertTarget = coverageCount(
    surface.presentationDesertCoverageFraction01 ?? 0,
    uniquePixelCount,
  );
  const dryLandFields = fields.filter(
    field => semantic[field.uniqueIndex] === LAND &&
      !vegetatedSelected.has(field.uniqueIndex),
  );
  const desertSelected = selectTop(
    dryLandFields,
    Math.min(desertTarget, dryLandFields.length),
    field => field.desertScore,
  );
  for (const index of desertSelected) {
    semantic[index] = DESERT;
  }

  const volcanicTarget = coverageCount(
    surface.presentationVolcanicCoverageFraction01 ?? 0,
    uniquePixelCount,
  );
  const solidFields = fields.filter(field =>
    semantic[field.uniqueIndex] !== LIQUID &&
    semantic[field.uniqueIndex] !== ICE &&
    !vegetatedSelected.has(field.uniqueIndex),
  );
  const volcanicSelected = new Set(
    selectTop(
      solidFields,
      Math.min(volcanicTarget, solidFields.length),
      field => field.volcanicScore,
    ),
  );

  const rgba = new Uint8Array(width * height * 4);
  const roughnessRgba = new Uint8Array(width * height * 4);
  const reliefRgba = new Uint8Array(width * height * 4);
  const emissiveRgba = volcanicSelected.size > 0
    ? new Uint8Array(width * height * 4)
    : null;
  // Below this *visual* threshold, volcanic provinces are weathered basalt,
  // oxides and regolith, never incandescent orange paint. The numerical
  // volcanism index and the selected province coverage are not modified.
  const incandescentActivity01 = clamp01(
    ((surface.volcanismIndex01 ?? 0) - 0.58) / 0.42,
  );

  for (const field of fields) {
    const baseOffset = (field.y * width + field.x) * 4;
    const semanticKind = semantic[field.uniqueIndex]!;
    const baseRgb: [number, number, number] = [
      baseTexture.rgba[baseOffset]!,
      baseTexture.rgba[baseOffset + 1]!,
      baseTexture.rgba[baseOffset + 2]!,
    ];

    // D.4d: the already-resolved water coverage now forms larger connected
    // basins. A two-pixel coastal neighborhood modulates shallows without
    // moving any pixel between semantic water, ice and land categories.
    const coast = liquidBoundaryFraction(semantic, field.x, field.y, uniqueWidth, height);
    let color = semanticColor(
      semanticKind,
      baseRgb,
      field,
      seed,
      coast,
    );
    // Transient/local phase-20 water remains visible at its exact measured
    // snapshot coverage, but must not look like deep permanent blue oceans.
    // No displacement of D.4d coastline, basins, categories or visual seed.
    if (semanticKind === LIQUID && surface.hasPersistentSurfaceLiquidWater === false) {
      color = mixRgb(color, [82, 103, 98], 0.58);
    }
    if (semanticKind !== LIQUID && coast > 0) {
      color = mixRgb(color, semanticKind === ICE ? [145, 205, 219] : [116, 149, 139], coast * 0.19);
    }
    if (
      semanticKind === LAND &&
      vegetatedSelected.has(field.uniqueIndex)
    ) {
      color = mixRgb(
        color,
        vegetationColor(
          field,
          seed,
          vegetationPalette,
          vegetationProfile,
        ),
        0.63 +
          0.08 * (1 - field.desertScore) +
          0.18 * (vegetationProfile?.lushness01 ?? 0),
      );
    }

    // D.4c: material separation follows the existing surface classes, with
    // coherent relief inherited from the same deterministic field. Water is
    // optically smoother than ice, rock or dry regolith; none of these pixels
    // changes the semantic liquid/ice masks or the planetary science.
    const fineRelief = smoothPixelNoise01(seed, field.x, field.y, 13);
    let relief = semanticKind === LIQUID
      ? 0.38 + 0.015 * field.elevation
      : semanticKind === ICE
        ? 0.56 + 0.09 * field.elevation + 0.045 * fineRelief
        : semanticKind === DESERT
          ? 0.40 + 0.35 * field.elevation + 0.13 * fineRelief
          : 0.35 + 0.43 * field.elevation + 0.16 * fineRelief;
    let roughness = semanticKind === LIQUID
      ? (surface.hasPersistentSurfaceLiquidWater === false ? 0.46 : 0.18) +
        0.11 * (1 - field.elevation) + 0.05 * coast
      : semanticKind === ICE
        ? 0.40 + 0.18 * fineRelief
        : semanticKind === DESERT
          ? 0.82 + 0.12 * fineRelief
          : volcanicSelected.has(field.uniqueIndex)
            ? 0.67 + 0.13 * fineRelief
            : 0.69 + 0.20 * fineRelief;
    if (
      semanticKind === LAND &&
      vegetatedSelected.has(field.uniqueIndex)
    ) {
      roughness = clamp01(
        roughness * (0.95 - 0.07 * (vegetationProfile?.lushness01 ?? 0)),
      );
      relief = clamp01(
        relief * 0.96 + 0.012 + 0.015 * (vegetationProfile?.lushness01 ?? 0),
      );
    }
    const reliefByte = toByte(clamp01(relief) * 255);
    const roughnessByte = toByte(clamp01(roughness) * 255);
    roughnessRgba[baseOffset] = roughnessByte;
    roughnessRgba[baseOffset + 1] = roughnessByte;
    roughnessRgba[baseOffset + 2] = roughnessByte;
    roughnessRgba[baseOffset + 3] = 255;
    reliefRgba[baseOffset] = reliefByte;
    reliefRgba[baseOffset + 1] = reliefByte;
    reliefRgba[baseOffset + 2] = reliefByte;
    reliefRgba[baseOffset + 3] = 255;

    rgba[baseOffset] = color[0];
    rgba[baseOffset + 1] = color[1];
    rgba[baseOffset + 2] = color[2];
    rgba[baseOffset + 3] = 255;

    if (emissiveRgba !== null) {
      const volcanic = volcanicSelected.has(field.uniqueIndex);
      const heat = volcanic
        ? incandescentActivity01 * clamp01(0.22 + field.volcanicScore * 0.63)
        : 0;
      emissiveRgba[baseOffset] = toByte(255 * heat);
      emissiveRgba[baseOffset + 1] = toByte(74 * heat);
      emissiveRgba[baseOffset + 2] = toByte(12 * heat);
      emissiveRgba[baseOffset + 3] = 255;

      if (volcanic) {
        const weatheredRock = mixRgb(
          [64, 58, 53], [111, 87, 70],
          clamp01(field.elevation * 0.65 + 0.15),
        );
        const darkened = mixRgb(color, weatheredRock, 0.34);
        rgba[baseOffset] = darkened[0];
        rgba[baseOffset + 1] = darkened[1];
        rgba[baseOffset + 2] = darkened[2];
      }
    }
  }

  copySeamColumn(rgba, width, height);
  copySeamColumn(roughnessRgba, width, height);
  copySeamColumn(reliefRgba, width, height);
  if (emissiveRgba !== null) {
    copySeamColumn(emissiveRgba, width, height);
  }

  const cloudTarget = coverageCount(
    surface.presentationCloudCoverageFraction01 ?? 0,
    uniquePixelCount,
  );
  const cloudRgba = cloudTarget > 0
    ? buildCloudTexture(fields, cloudTarget, width, height, seed)
    : null;

  return Object.freeze({
    version: 1 as const,
    width,
    height,
    rgba,
    emissiveRgba,
    cloudRgba,
    roughnessRgba,
    reliefRgba,
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

/** Relative coastline presence in the 8 adjacent cells, longitude-wrapped. */
function liquidBoundaryFraction(
  kinds: Uint8Array, x: number, y: number, width: number, height: number,
): number {
  const centerLiquid = kinds[y * width + x] === LIQUID;
  let opposite = 0;
  let samples = 0;
  for (let dy = -2; dy <= 2; dy += 1) {
    const sy = y + dy;
    if (sy < 0 || sy >= height) continue;
    for (let dx = -2; dx <= 2; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const sx = (x + dx + width) % width;
      if ((kinds[sy * width + sx] === LIQUID) !== centerLiquid) opposite += 1;
      samples += 1;
    }
  }
  return samples === 0 ? 0 : opposite / samples;
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
      // D.4d: planetary-scale basins and highlands dominate the geography.
      // Fine relief is limited to material response, not water distribution;
      // this eliminates the small disconnected tile-like coastal patches.
      const macro = surfaceFbm3(
        sphereX * 1.20,
        sphereY * 1.20,
        sphereZ * 1.20,
        seed ^ 0x54a3b19d,
        4,
      );
      const detail = surfaceFbm3(
        sphereX * 3.15 + 5.1,
        sphereY * 3.15 - 2.9,
        sphereZ * 3.15 + 7.7,
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
        0.77 * macro +
          0.20 * detail +
          0.03 * (luminance / 255),
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
          0.88 * (1 - elevation) +
            0.10 * (1 - detail) +
            0.02 * equator01,
        ),
        desertScore: clamp01(
          0.37 * equator01 +
            0.38 * macro +
            0.14 * detail +
            0.11 * elevation,
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
  coast: number,
): [number, number, number] {
  const micro = smoothPixelNoise01(seed, field.x, field.y, 7);

  if (kind === LIQUID) {
    const shallow = clamp01(
      0.12 + field.elevation * 0.37 + micro * 0.08 + coast * 0.65,
    );
    return mixRgb(
      [4, 27, 78],
      [43, 161, 197],
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

/**
 * VIS3D.2f: a continuous cloud-opacity field, not a binary continent-shaped
 * mask. Every texel is cloud-white even when fully transparent: GPU bilinear
 * filtering/mipmaps must never blend an opaque white cloud with black RGB at
 * an invisible texel (the source of the dark/brown cloud fringe).
 *
 * The coverage TARGET still comes from the frozen phase-20 presentation
 * snapshot; cloud feathering and optical density are rendering only.
 */
function buildCloudTexture(
  fields: PixelField[],
  cloudTarget: number,
  width: number,
  height: number,
  seed: number,
): Uint8Array {
  const selected = selectTop(
    fields,
    Math.min(cloudTarget, fields.length),
    field => field.cloudScore,
  );
  const lastSelected = selected[selected.length - 1];
  const cutoff = lastSelected === undefined
    ? 1
    : fields[lastSelected]!.cloudScore;
  const fieldMin = fields.reduce(
    (minimum, field) => Math.min(minimum, field.cloudScore),
    1,
  );
  const fieldMax = fields.reduce(
    (maximum, field) => Math.max(maximum, field.cloudScore),
    0,
  );
  const feather = Math.max(0.016, (fieldMax - fieldMin) * 0.13);
  const rgba = new Uint8Array(width * height * 4);

  for (const field of fields) {
    const offset = (field.y * width + field.x) * 4;
    // Smooth, blurred vapor boundaries extending a small distance beyond
    // cloud cores instead of a 0/1 alpha staircase at the coverage threshold.
    const envelope = smootherStep(clamp01(
      (field.cloudScore - cutoff + feather) / (2 * feather),
    ));
    const billow = smoothPixelNoise01(seed, field.x, field.y, 43);
    const fine = smoothPixelNoise01(seed, field.x, field.y, 79);
    const density = clamp01(
      Math.pow(envelope, 0.88) *
      (0.68 + 0.22 * billow + 0.10 * fine),
    );

    // Warm/brown edge contamination cannot occur: transparent cloud pixels
    // carry the same bright neutral RGB as nontransparent ones.
    const brightness = clamp01(0.91 + 0.07 * billow + 0.02 * fine);
    rgba[offset] = toByte(248 * brightness + 7);
    rgba[offset + 1] = toByte(251 * brightness + 4);
    rgba[offset + 2] = toByte(253 * brightness + 2);
    rgba[offset + 3] = toByte(density * 222);
  }

  copySeamColumn(rgba, width, height);
  return rgba;
}

/** Only land outside observed ice caps can host the visual flora mask.
 * With no polar ice, a warm ice-free world is allowed to have high-latitude
 * vegetation; otherwise the outer 23° at both poles remain unpainted.
 */
function vegetationLatitudeEligibleV1(
  field: PixelField,
  surface: SystemScenePlanetSurfacePresentationSnapshot,
): boolean {
  if ((surface.surfaceIceCoverageFraction01 ?? 0) > 0.0001) {
    return field.latitude01 <= Math.sin(67 * Math.PI / 180);
  }
  return field.latitude01 <= Math.sin(87 * Math.PI / 180);
}

/**
 * VISBIO.1c: select a share of the *available* land in each geographic zone,
 * not the top-scoring pixels over the entire globe. A global top-N produces
 * polar clumps when phase-20 ocean/desert masks remove temperate candidates.
 * Ranking is deterministic and uses existing coherent fields (no new RNG).
 */
function selectRegionalVegetationV1(
  candidates: readonly PixelField[],
  profile: SystemScenePlanetVegetationProfileV1 | null,
  uniqueWidth: number,
  height: number,
): Set<number> {
  const selected = new Set<number>();
  if (profile === null || candidates.length === 0) {
    return selected;
  }

  const longitudeBands = 12;
  const latitudeBands = 6;
  const regions: PixelField[][] = Array.from(
    { length: longitudeBands * latitudeBands }, () => [],
  );

  for (const field of candidates) {
    const col = Math.min(
      longitudeBands - 1,
      Math.floor(field.x * longitudeBands / uniqueWidth),
    );
    const row = Math.min(
      latitudeBands - 1,
      Math.floor(field.y * latitudeBands / height),
    );
    regions[row * longitudeBands + col]!.push(field);
  }

  const fraction = clamp01(profile.coverageFraction01);
  for (const region of regions) {
    const count = Math.round(region.length * fraction);
    const picked = selectTop(
      region,
      count,
      field => vegetationSelectionScore(field, profile),
    );
    for (const index of picked) {
      selected.add(index);
    }
  }
  return selected;
}

function vegetationSelectionScore(
  field: PixelField,
  vegetationProfile: SystemScenePlanetVegetationProfileV1 | null,
): number {
  const humidity = clamp01(
    0.58 * (1 - field.elevation) +
    0.42 * field.oceanScore,
  );
  const richnessBonus = clamp01(
    ((vegetationProfile?.floraSpeciesCount ?? 1) - 1) / 5,
  );
  const lushnessBonus = vegetationProfile?.lushness01 ?? 0;

  return clamp01(
    (0.35 + 0.05 * lushnessBonus) * humidity +
    0.31 * field.cloudScore +
    0.18 * (1 - field.volcanicScore) +
    0.13 * field.oceanScore +
    0.03 * richnessBonus,
  );
}

function vegetationColor(
  field: PixelField,
  seed: number,
  palette: readonly VegetationToneV1[],
  vegetationProfile: SystemScenePlanetVegetationProfileV1 | null,
): [number, number, number] {
  const micro = smoothPixelNoise01(seed, field.x, field.y, 17);
  const selected = selectVegetationToneV1(
    palette,
    (field.elevation * 2.91 + field.cloudScore * 4.37 +
      field.oceanScore * 1.13 + (seed >>> 0) / 0xffffffff) % 1,
  );
  const floraDiversity01 = clamp01(
    ((vegetationProfile?.floraSpeciesCount ?? 1) - 1) / 5,
  );
  const chlorophyll = clamp01(
    0.22 +
    field.equator01 * 0.34 +
    micro * 0.18 +
    0.16 * (vegetationProfile?.lushness01 ?? 0),
  );
  const wetLift = mixRgb(
    selected.rgb,
    [160, 194, 104],
    clamp01(0.04 + field.oceanScore * 0.14 + chlorophyll * 0.07),
  );
  const shaded = mixRgb(
    wetLift,
    [42, 86, 35],
    clamp01(0.04 + field.elevation * 0.10 + (1 - field.oceanScore) * 0.05),
  );

  return mixRgb(
    shaded,
    [118, 176, 84],
    clamp01(0.06 + floraDiversity01 * 0.08 + micro * 0.05),
  );
}

function buildVegetationPaletteColorsV1(
  vegetationProfile: SystemScenePlanetVegetationProfileV1 | null,
): readonly VegetationToneV1[] {
  if (vegetationProfile === null) {
    return Object.freeze([
      Object.freeze({
        rgb: [110, 159, 72] as [number, number, number],
        cumulativeWeight01: 1,
      }),
    ]);
  }

  const targetToneCount = Math.max(
    1,
    Math.min(
      6,
      vegetationProfile.floraSpeciesCount <= 1
        ? 1
        : vegetationProfile.floraSpeciesCount <= 3
          ? vegetationProfile.floraSpeciesCount
          : 6,
    ),
  );
  const weightedSource = resolveWeightedPaletteEntriesV1(
    vegetationProfile,
  ).slice(0, Math.max(targetToneCount, 1));
  const fallbackPalette = [
    [148, 194, 108],
    [118, 170, 86],
    [88, 140, 64],
    [74, 120, 60],
    [160, 186, 102],
  ] as const;
  const lushness = vegetationProfile.lushness01;
  const diversity01 = clamp01((vegetationProfile.floraSpeciesCount - 1) / 5);
  const tones = weightedSource.length > 0
    ? weightedSource
    : [{
        rgb: fallbackPalette[0] as [number, number, number],
        weight01: 1,
      }];
  const totalWeight = tones.reduce((sum, tone) => sum + tone.weight01, 0);
  let cumulativeWeight01 = 0;

  return Object.freeze(
    tones.map((tone, index) => {
      const fallback = fallbackPalette[index % fallbackPalette.length]!;
      const normalized = normalizeVegetationSpeciesColorV1(
        tone.rgb,
        fallback,
        lushness,
        diversity01,
        index,
      );
      cumulativeWeight01 += tone.weight01 / Math.max(totalWeight, 0.0001);
      return Object.freeze({
        rgb: normalized,
        cumulativeWeight01: Math.min(1, cumulativeWeight01),
      });
    }),
  );
}

function resolveWeightedPaletteEntriesV1(
  vegetationProfile: SystemScenePlanetVegetationProfileV1,
): readonly { rgb: [number, number, number]; weight01: number }[] {
  if ((vegetationProfile.paletteEntries?.length ?? 0) > 0) {
    return vegetationProfile.paletteEntries!
      .map(entry => ({
        rgb: parseHexColorV1(entry.hex),
        weight01: entry.weight01,
      }))
      .filter((entry): entry is { rgb: [number, number, number]; weight01: number } => entry.rgb !== null)
      .sort((left, right) => right.weight01 - left.weight01)
      .slice(0, 8);
  }

  return vegetationProfile.paletteHexes
    .map((hex, index) => ({
      rgb: parseHexColorV1(hex),
      weight01: Math.max(0.0001, 1 / (index + 1)),
    }))
    .filter((entry): entry is { rgb: [number, number, number]; weight01: number } => entry.rgb !== null)
    .slice(0, 8);
}

function normalizeVegetationSpeciesColorV1(
  raw: [number, number, number],
  fallback: readonly [number, number, number],
  lushness01: number,
  diversity01: number,
  toneIndex: number,
): [number, number, number] {
  const [hue, saturation, lightness] = rgbToHslV1(raw);
  const normalizedHue = normalizeVegetationHueV1(hue);
  const hueDistance = circularHueDistanceV1(hue, normalizedHue);
  const hueCorrection01 = clamp01(hueDistance / 180);
  const projected = hslToRgbV1([
    normalizedHue,
    clamp01(0.28 + saturation * 0.52 + lushness01 * 0.08),
    clamp01(0.26 + lightness * 0.34 + (1 - diversity01) * 0.10 - toneIndex * 0.018),
  ]);
  const anchorMixed = mixRgb(
    projected,
    fallback,
    0.12 + 0.16 * hueCorrection01,
  );
  const darkCanopy = mixRgb(
    anchorMixed,
    [43, 97, 39],
    clamp01(0.06 + toneIndex * 0.05 * diversity01),
  );
  return mixRgb(
    darkCanopy,
    [164, 208, 118],
    clamp01((1 - diversity01) * 0.18 + lushness01 * 0.06),
  );
}

function selectVegetationToneV1(
  palette: readonly VegetationToneV1[],
  sample01: number,
): VegetationToneV1 {
  for (const tone of palette) {
    if (sample01 <= tone.cumulativeWeight01) {
      return tone;
    }
  }

  return palette[palette.length - 1] ?? Object.freeze({
    rgb: [110, 159, 72] as [number, number, number],
    cumulativeWeight01: 1,
  });
}

function parseHexColorV1(
  value: string,
): [number, number, number] | null {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(value.trim());
  if (match === null) {
    return null;
  }
  const hex = match[1]!;
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

function rgbToHslV1(
  rgb: [number, number, number],
): [number, number, number] {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if (delta === 0) {
    return [0, 0, lightness];
  }

  const saturation = lightness > 0.5
    ? delta / (2 - max - min)
    : delta / (max + min);

  let hue = 0;
  switch (max) {
    case r:
      hue = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
      break;
    case g:
      hue = ((b - r) / delta + 2) * 60;
      break;
    default:
      hue = ((r - g) / delta + 4) * 60;
      break;
  }

  return [hue, saturation, lightness];
}

function hslToRgbV1(
  hsl: [number, number, number],
): [number, number, number] {
  const [h, s, l] = hsl;
  const hue01 = ((h % 360) + 360) % 360 / 360;

  if (s === 0) {
    const gray = toByte(l * 255);
    return [gray, gray, gray];
  }

  const q = l < 0.5
    ? l * (1 + s)
    : l + s - l * s;
  const p = 2 * l - q;

  const hueToChannel = (t: number): number => {
    let wrapped = t;
    if (wrapped < 0) {
      wrapped += 1;
    }
    if (wrapped > 1) {
      wrapped -= 1;
    }
    if (wrapped < 1 / 6) {
      return p + (q - p) * 6 * wrapped;
    }
    if (wrapped < 1 / 2) {
      return q;
    }
    if (wrapped < 2 / 3) {
      return p + (q - p) * (2 / 3 - wrapped) * 6;
    }
    return p;
  };

  return [
    toByte(hueToChannel(hue01 + 1 / 3) * 255),
    toByte(hueToChannel(hue01) * 255),
    toByte(hueToChannel(hue01 - 1 / 3) * 255),
  ];
}

function normalizeVegetationHueV1(
  hueDegrees: number,
): number {
  const hue = ((hueDegrees % 360) + 360) % 360;
  if (hue >= 55 && hue <= 165) {
    return hue;
  }
  if (hue >= 35 && hue < 55) {
    return 55 + (hue - 35) * 0.55;
  }
  if (hue > 165 && hue <= 205) {
    return 165 - (205 - hue) * 0.35;
  }
  if (hue > 205 && hue <= 255) {
    return 160 - (255 - hue) * 0.10;
  }
  if (hue > 255 && hue < 320) {
    return 105 + (hue - 255) * 0.22;
  }
  return 88 + hue * 0.10;
}

function circularHueDistanceV1(
  leftDegrees: number,
  rightDegrees: number,
): number {
  const delta = Math.abs((((leftDegrees - rightDegrees) % 360) + 540) % 360 - 180);
  return delta;
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

export function systemScenePlanetSurfaceTextureSeedV1(systemIdentity: string, planetId: string): number {
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
