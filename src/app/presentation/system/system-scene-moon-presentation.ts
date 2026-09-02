export type SystemSceneMoonSurfaceStyleV1 =
  | 'ROCKY'
  | 'ICY'
  | 'OCEANIC'
  | 'VOLCANIC'
  | 'MIXED';

export type SystemSceneMoonShapeClassV1 =
  | 'MINOR_IRREGULAR'
  | 'REGULAR_SMALL'
  | 'MAJOR_PLANETARY';

export interface SystemSceneMoonPresentationInputV1 {
  readonly moonIdentity: string;
  readonly hostPlanetType: string;
  readonly radiusEarth: number;
  readonly massEarth: number;
  readonly meanDensityGramsPerCubicCentimeter: number;
  readonly surfaceGravityEarth: number;
  readonly atmosphereRetentionIndex01: number;
  readonly atmosphereRegime: string;
  readonly waterInventoryIndex01: number;
  readonly inferredIceRichnessIndex01: number;
  readonly subsurfaceOceanPotentialIndex01: number;
  readonly surfaceLiquidWaterPotentialIndex01: number;
  readonly waterRegime: string;
  readonly estimatedSurfaceTemperatureKelvin: number;
  readonly geologicalActivityIndex01: number;
  readonly tidalHeatingIndex01: number;
  readonly geologyRegime: string;
  readonly overallHabitabilityIndex01: number;
  readonly isPotentiallyHabitable: boolean;
  readonly giantHostSpecialization: boolean;
  readonly giantCompositionRegime: string;
  readonly isLargeGiantMoon: boolean;
  readonly isTidallyActiveGiantMoon: boolean;
  readonly isOceanBearingGiantMoonCandidate: boolean;
}

export interface SystemSceneMoonPresentationV1 {
  readonly version: 1;
  readonly sourceMoonIdentity: string;
  readonly sourceHostPlanetType: string;
  readonly sourceRadiusEarth: number;
  readonly sourceMassEarth: number;
  readonly sourceMeanDensityGramsPerCubicCentimeter: number;
  readonly sourceSurfaceGravityEarth: number;
  readonly sourceAtmosphereRetentionIndex01: number;
  readonly sourceAtmosphereRegime: string;
  readonly sourceWaterInventoryIndex01: number;
  readonly sourceInferredIceRichnessIndex01: number;
  readonly sourceSubsurfaceOceanPotentialIndex01: number;
  readonly sourceSurfaceLiquidWaterPotentialIndex01: number;
  readonly sourceWaterRegime: string;
  readonly sourceEstimatedSurfaceTemperatureKelvin: number;
  readonly sourceGeologicalActivityIndex01: number;
  readonly sourceTidalHeatingIndex01: number;
  readonly sourceGeologyRegime: string;
  readonly sourceOverallHabitabilityIndex01: number;
  readonly sourceIsPotentiallyHabitable: boolean;
  readonly sourceGiantHostSpecialization: boolean;
  readonly sourceGiantCompositionRegime: string;
  readonly sourceIsLargeGiantMoon: boolean;
  readonly sourceIsTidallyActiveGiantMoon: boolean;
  readonly sourceIsOceanBearingGiantMoonCandidate: boolean;
  readonly shapeClass: SystemSceneMoonShapeClassV1;
  readonly surfaceStyle: SystemSceneMoonSurfaceStyleV1;
  readonly presentationRadiusScene: number;
  readonly presentationIrregularity01: number;
  readonly presentationLiquidCoverage01: number;
  readonly presentationIceCoverage01: number;
  readonly presentationVolcanicCoverage01: number;
  readonly presentationCloudCoverage01: number;
  readonly presentationAtmospherePresent: boolean;
  readonly presentationAtmosphereStrength01: number;
  readonly presentationAtmosphereShellScale: number;
  readonly presentationBaseColorHex: string;
  readonly presentationAccentColorHex: string;
  readonly presentationAtmosphereColorHex: string;
  readonly presentationSeedUint32: number;
}

const ATMOSPHERE_REGIMES = new Set([
  'NONE',
  'EXOSPHERE',
  'TRACE',
  'THIN',
  'SUBSTANTIAL',
]);

const WATER_REGIMES = new Set([
  'NONE',
  'SURFACE_ICE',
  'SUBSURFACE_OCEAN',
  'ICE_AND_SUBSURFACE_OCEAN',
  'SURFACE_LIQUID',
  'MIXED',
]);

const GEOLOGY_REGIMES = new Set([
  'INERT',
  'LOW_ACTIVITY',
  'ACTIVE',
  'TIDALLY_ACTIVE',
  'EXTREME',
]);

/**
 * Point-25.10 immutable visual projection for one already-materialized relevant
 * moon. Every scientific input comes from frozen phase-21 state. Surface
 * coverage values, radius compression and irregularity are explicitly bounded
 * presentation proxies; small moons preserve a rounded spheroidal silhouette
 * even when their relief is made more rugged for readability. Nothing writes
 * back into Ground Truth.
 */
export function buildSystemSceneMoonPresentationV1(
  input: SystemSceneMoonPresentationInputV1,
): SystemSceneMoonPresentationV1 {
  validateInput(input);

  const seed = hashStringToUint32(`${input.moonIdentity}|25.10`);
  const variant01 = uint32Unit(seed);
  const secondary01 = uint32Unit(mixUint32(seed ^ 0x9e3779b9));

  const shapeClass = moonShapeClass(input);
  const surfaceStyle = moonSurfaceStyle(input);
  const radiusScene = moonRadiusScene(input, shapeClass);
  const irregularity01 =
    shapeClass === 'MINOR_IRREGULAR'
      ? clamp01(
          0.08 +
            0.08 * (1 - clamp01(input.radiusEarth / 0.08)) +
            0.06 * variant01,
        )
      : shapeClass === 'REGULAR_SMALL'
        ? 0.02 + 0.04 * variant01
        : 0.008 + 0.016 * variant01;

  const liquidCoverage01 =
    input.waterRegime === 'SURFACE_LIQUID' ||
    input.waterRegime === 'MIXED'
      ? clamp(
          0.16 +
            0.58 * input.surfaceLiquidWaterPotentialIndex01 +
            0.12 * input.waterInventoryIndex01,
          0.12,
          0.82,
        )
      : 0;

  const iceCoverage01 =
    input.waterRegime === 'NONE'
      ? clamp(0.12 * input.inferredIceRichnessIndex01, 0, 0.12)
      : clamp(
          0.16 +
            0.50 * input.inferredIceRichnessIndex01 +
            0.24 * input.waterInventoryIndex01 -
            0.32 * liquidCoverage01,
          0.08,
          0.90,
        );

  const volcanicCoverage01 =
    input.geologyRegime === 'EXTREME'
      ? clamp(0.30 + 0.50 * input.geologicalActivityIndex01, 0.30, 0.82)
      : input.geologyRegime === 'TIDALLY_ACTIVE'
        ? clamp(
            0.12 +
              0.38 * input.tidalHeatingIndex01 +
              0.18 * input.geologicalActivityIndex01,
            0.12,
            0.60,
          )
        : input.geologyRegime === 'ACTIVE'
          ? clamp(0.06 + 0.24 * input.geologicalActivityIndex01, 0.06, 0.30)
          : 0;

  const atmospherePresent =
    input.atmosphereRegime === 'THIN' ||
    input.atmosphereRegime === 'SUBSTANTIAL';
  const atmosphereStrength01 = atmospherePresent
    ? clamp(
        0.08 +
          0.86 * input.atmosphereRetentionIndex01,
        0.08,
        0.92,
      )
    : 0;

  const cloudCoverage01 =
    input.atmosphereRegime === 'SUBSTANTIAL'
      ? clamp(
          0.16 +
            0.38 * input.waterInventoryIndex01 +
            0.30 * liquidCoverage01 +
            0.12 * secondary01,
          0.12,
          0.78,
        )
      : input.atmosphereRegime === 'THIN'
        ? clamp(
            0.04 +
              0.20 * input.waterInventoryIndex01 +
              0.10 * secondary01,
            0.02,
            0.32,
          )
        : 0;

  const palette = moonPalette(
    surfaceStyle,
    input.inferredIceRichnessIndex01,
    variant01,
    secondary01,
  );

  const atmosphereColor =
    input.estimatedSurfaceTemperatureKelvin < 220
      ? mixRgb(palette.accent, { r: 176, g: 208, b: 232 }, 0.64)
      : input.estimatedSurfaceTemperatureKelvin > 330
        ? mixRgb(palette.accent, { r: 221, g: 181, b: 133 }, 0.38)
        : mixRgb(palette.accent, { r: 164, g: 207, b: 231 }, 0.52);

  return Object.freeze({
    version: 1 as const,
    sourceMoonIdentity: input.moonIdentity,
    sourceHostPlanetType: input.hostPlanetType,
    sourceRadiusEarth: input.radiusEarth,
    sourceMassEarth: input.massEarth,
    sourceMeanDensityGramsPerCubicCentimeter:
      input.meanDensityGramsPerCubicCentimeter,
    sourceSurfaceGravityEarth: input.surfaceGravityEarth,
    sourceAtmosphereRetentionIndex01: input.atmosphereRetentionIndex01,
    sourceAtmosphereRegime: input.atmosphereRegime,
    sourceWaterInventoryIndex01: input.waterInventoryIndex01,
    sourceInferredIceRichnessIndex01: input.inferredIceRichnessIndex01,
    sourceSubsurfaceOceanPotentialIndex01:
      input.subsurfaceOceanPotentialIndex01,
    sourceSurfaceLiquidWaterPotentialIndex01:
      input.surfaceLiquidWaterPotentialIndex01,
    sourceWaterRegime: input.waterRegime,
    sourceEstimatedSurfaceTemperatureKelvin:
      input.estimatedSurfaceTemperatureKelvin,
    sourceGeologicalActivityIndex01: input.geologicalActivityIndex01,
    sourceTidalHeatingIndex01: input.tidalHeatingIndex01,
    sourceGeologyRegime: input.geologyRegime,
    sourceOverallHabitabilityIndex01: input.overallHabitabilityIndex01,
    sourceIsPotentiallyHabitable: input.isPotentiallyHabitable,
    sourceGiantHostSpecialization: input.giantHostSpecialization,
    sourceGiantCompositionRegime: input.giantCompositionRegime,
    sourceIsLargeGiantMoon: input.isLargeGiantMoon,
    sourceIsTidallyActiveGiantMoon: input.isTidallyActiveGiantMoon,
    sourceIsOceanBearingGiantMoonCandidate:
      input.isOceanBearingGiantMoonCandidate,
    shapeClass,
    surfaceStyle,
    presentationRadiusScene: radiusScene,
    presentationIrregularity01: irregularity01,
    presentationLiquidCoverage01: liquidCoverage01,
    presentationIceCoverage01: iceCoverage01,
    presentationVolcanicCoverage01: volcanicCoverage01,
    presentationCloudCoverage01: cloudCoverage01,
    presentationAtmospherePresent: atmospherePresent,
    presentationAtmosphereStrength01: atmosphereStrength01,
    presentationAtmosphereShellScale:
      atmospherePresent
        ? 1.018 + 0.035 * atmosphereStrength01
        : 1,
    presentationBaseColorHex: rgbToHex(palette.base),
    presentationAccentColorHex: rgbToHex(palette.accent),
    presentationAtmosphereColorHex: rgbToHex(atmosphereColor),
    presentationSeedUint32: seed,
  });
}

function moonShapeClass(
  input: SystemSceneMoonPresentationInputV1,
): SystemSceneMoonShapeClassV1 {
  if (
    input.isLargeGiantMoon ||
    input.radiusEarth >= 0.22 ||
    (
      input.giantHostSpecialization &&
      input.radiusEarth >= 0.12
    )
  ) {
    return 'MAJOR_PLANETARY';
  }

  if (
    input.radiusEarth < 0.055 &&
    !input.giantHostSpecialization
  ) {
    return 'MINOR_IRREGULAR';
  }

  if (input.radiusEarth < 0.035) {
    return 'MINOR_IRREGULAR';
  }

  return 'REGULAR_SMALL';
}

function moonSurfaceStyle(
  input: SystemSceneMoonPresentationInputV1,
): SystemSceneMoonSurfaceStyleV1 {
  if (
    input.geologyRegime === 'EXTREME' ||
    (
      input.geologyRegime === 'TIDALLY_ACTIVE' &&
      input.tidalHeatingIndex01 >= 0.66
    )
  ) {
    return 'VOLCANIC';
  }

  if (
    input.waterRegime === 'SURFACE_LIQUID' ||
    input.waterRegime === 'MIXED' ||
    (
      input.isOceanBearingGiantMoonCandidate &&
      input.surfaceLiquidWaterPotentialIndex01 >= 0.35
    )
  ) {
    return 'OCEANIC';
  }

  if (
    input.giantCompositionRegime === 'ICE_RICH' ||
    input.waterRegime === 'SURFACE_ICE' ||
    input.waterRegime === 'ICE_AND_SUBSURFACE_OCEAN' ||
    input.inferredIceRichnessIndex01 >= 0.62
  ) {
    return 'ICY';
  }

  if (
    input.giantCompositionRegime === 'MIXED_ROCK_ICE' ||
    input.inferredIceRichnessIndex01 >= 0.30
  ) {
    return 'MIXED';
  }

  return 'ROCKY';
}

function moonRadiusScene(
  input: SystemSceneMoonPresentationInputV1,
  shapeClass: SystemSceneMoonShapeClassV1,
): number {
  const physicalSignal =
    0.0075 +
    0.050 * Math.pow(input.radiusEarth, 0.62);
  const giantScale =
    input.isLargeGiantMoon
      ? 1.12
      : input.giantHostSpecialization
        ? 1.04
        : 0.96;
  const classScale =
    shapeClass === 'MINOR_IRREGULAR'
      ? 0.90
      : shapeClass === 'MAJOR_PLANETARY'
        ? 1.06
        : 1;

  return clamp(
    physicalSignal * giantScale * classScale,
    0.008,
    0.058,
  );
}

interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

function moonPalette(
  style: SystemSceneMoonSurfaceStyleV1,
  iceRichness01: number,
  variant01: number,
  secondary01: number,
): { readonly base: Rgb; readonly accent: Rgb } {
  switch (style) {
    case 'ICY':
      return {
        base: mixRgb(
          { r: 154, g: 177, b: 191 },
          { r: 215, g: 228, b: 233 },
          0.42 + 0.42 * iceRichness01,
        ),
        accent: mixRgb(
          { r: 107, g: 143, b: 169 },
          { r: 232, g: 239, b: 240 },
          secondary01,
        ),
      };

    case 'OCEANIC':
      return {
        base: mixRgb(
          { r: 25, g: 77, b: 119 },
          { r: 58, g: 131, b: 157 },
          variant01,
        ),
        accent: mixRgb(
          { r: 109, g: 132, b: 111 },
          { r: 192, g: 209, b: 190 },
          secondary01,
        ),
      };

    case 'VOLCANIC':
      return {
        base: mixRgb(
          { r: 55, g: 49, b: 44 },
          { r: 104, g: 73, b: 58 },
          variant01,
        ),
        accent: mixRgb(
          { r: 171, g: 70, b: 30 },
          { r: 239, g: 140, b: 43 },
          secondary01,
        ),
      };

    case 'MIXED':
      return {
        base: mixRgb(
          { r: 111, g: 105, b: 100 },
          { r: 155, g: 166, b: 171 },
          0.28 + 0.46 * iceRichness01,
        ),
        accent: mixRgb(
          { r: 139, g: 119, b: 101 },
          { r: 195, g: 211, b: 218 },
          secondary01,
        ),
      };

    default:
      return {
        base: mixRgb(
          { r: 92, g: 84, b: 78 },
          { r: 151, g: 134, b: 116 },
          variant01,
        ),
        accent: mixRgb(
          { r: 111, g: 98, b: 89 },
          { r: 187, g: 163, b: 132 },
          secondary01,
        ),
      };
  }
}

function validateInput(input: SystemSceneMoonPresentationInputV1): void {
  if (input.moonIdentity.trim().length === 0) {
    throw new RangeError('moonIdentity must be non-empty.');
  }
  if (input.hostPlanetType.trim().length === 0) {
    throw new RangeError('hostPlanetType must be non-empty.');
  }
  for (const [label, value] of [
    ['radiusEarth', input.radiusEarth],
    ['massEarth', input.massEarth],
    ['meanDensityGramsPerCubicCentimeter', input.meanDensityGramsPerCubicCentimeter],
    ['surfaceGravityEarth', input.surfaceGravityEarth],
    ['estimatedSurfaceTemperatureKelvin', input.estimatedSurfaceTemperatureKelvin],
  ] as const) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${label} must be positive and finite.`);
    }
  }
  for (const [label, value] of [
    ['atmosphereRetentionIndex01', input.atmosphereRetentionIndex01],
    ['waterInventoryIndex01', input.waterInventoryIndex01],
    ['inferredIceRichnessIndex01', input.inferredIceRichnessIndex01],
    ['subsurfaceOceanPotentialIndex01', input.subsurfaceOceanPotentialIndex01],
    ['surfaceLiquidWaterPotentialIndex01', input.surfaceLiquidWaterPotentialIndex01],
    ['geologicalActivityIndex01', input.geologicalActivityIndex01],
    ['tidalHeatingIndex01', input.tidalHeatingIndex01],
    ['overallHabitabilityIndex01', input.overallHabitabilityIndex01],
  ] as const) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new RangeError(`${label} must be finite in [0, 1].`);
    }
  }
  if (!ATMOSPHERE_REGIMES.has(input.atmosphereRegime)) {
    throw new RangeError(`Unsupported atmosphereRegime: ${input.atmosphereRegime}.`);
  }
  if (!WATER_REGIMES.has(input.waterRegime)) {
    throw new RangeError(`Unsupported waterRegime: ${input.waterRegime}.`);
  }
  if (!GEOLOGY_REGIMES.has(input.geologyRegime)) {
    throw new RangeError(`Unsupported geologyRegime: ${input.geologyRegime}.`);
  }
}

function hashStringToUint32(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
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

function mixRgb(left: Rgb, right: Rgb, amount01: number): Rgb {
  const t = clamp01(amount01);
  return {
    r: left.r + (right.r - left.r) * t,
    g: left.g + (right.g - left.g) * t,
    b: left.b + (right.b - left.b) * t,
  };
}

function rgbToHex(color: Rgb): string {
  return `#${[color.r, color.g, color.b]
    .map(component => Math.round(clamp(component, 0, 255)).toString(16).padStart(2, '0').toUpperCase())
    .join('')}`;
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
