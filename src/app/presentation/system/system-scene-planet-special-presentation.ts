export interface SystemScenePlanetSpecialPresentationInputV1 {
  readonly planetId: string;
  readonly planetType: string;
  readonly radiusEarth: number;
  readonly densityGramsPerCubicCentimeter: number;
  readonly envelopeMassFraction01: number;
  readonly iceBearingFractionOfSolids01: number;
  readonly rotationPeriodHours: number;
  readonly axialTiltDegrees: number;
  readonly referenceBondAlbedo01: number;
  readonly rarityTraits: readonly string[];
  readonly giantMoonProfile: {
    readonly sourceMoonCount: number;
    readonly sourceSatelliteCapacityIndex01: number;
    readonly richnessIndex01: number;
    readonly architectureRegime: string;
  } | null;
}

export interface SystemScenePlanetRingPresentationV1 {
  readonly source: 'GIANT_RING_PRESENTATION_PROXY_25_9';
  readonly presenceAuthoritative: false;
  readonly sourceMoonCount: number;
  readonly sourceSatelliteCapacityIndex01: number;
  readonly sourceMoonRichnessIndex01: number;
  readonly sourceMoonArchitectureRegime: string;
  readonly sourceIceBearingFractionOfSolids01: number;
  readonly sourceReferenceBondAlbedo01: number;
  readonly innerRadiusPlanetRadii: number;
  readonly outerRadiusPlanetRadii: number;
  readonly opticalDepth01: number;
  readonly iceFraction01: number;
  readonly dustFraction01: number;
  readonly bandCount: number;
  readonly gapCount: number;
  readonly presentationSeedUint32: number;
  readonly presentationBaseColorHex: string;
  readonly presentationAccentColorHex: string;
}

export interface SystemScenePlanetOblatenessPresentationV1 {
  readonly source: 'ROTATION_SHAPE_PROXY_25_9';
  readonly sourceRotationPeriodHours: number;
  readonly sourceDensityGramsPerCubicCentimeter: number;
  readonly presentationFlattening01: number;
  readonly presentationEquatorialScale: number;
  readonly presentationPolarScale: number;
  readonly presentationAdjusted: boolean;
}

export interface SystemScenePlanetSpecialPresentationV1 {
  readonly version: 1;
  readonly sourcePlanetType: string;
  readonly sourceAxialTiltDegrees: number;
  readonly sourceRarityTraits: readonly string[];
  readonly rings: SystemScenePlanetRingPresentationV1 | null;
  readonly oblateness: SystemScenePlanetOblatenessPresentationV1;
  readonly extremeObliquity: boolean;
  readonly stronglyRetrogradeRotation: boolean;
  readonly rapidRotator: boolean;
  readonly puffyLowDensity: boolean;
}

const GIANT_TYPES = new Set([
  'MINI_NEPTUNE',
  'GAS_GIANT',
  'ICE_GIANT',
]);

const ALLOWED_PLANET_TYPES = new Set([
  'ROCKY',
  'SUPER_EARTH',
  'DESERT',
  'OCEAN',
  'ICE',
  'VOLCANIC',
  ...GIANT_TYPES,
]);

/**
 * Point-25.9 read-only visual projection for rings and special planet shape.
 *
 * No ring system exists in the current phase-18..23 Ground Truth. V1 therefore
 * never claims ring presence as authoritative. For deep-envelope planets it
 * creates a clearly-labelled presentation proxy from already-frozen giant-moon
 * architecture, bulk composition and albedo so 25.9 can render plausible rings
 * without feeding anything back into domain/simulation. Rocky-world rings remain
 * absent until a future domain phase actually materializes them.
 *
 * Rotational flattening is likewise a bounded presentation proxy: point 19.3
 * provides the physical rotation period but not an equilibrium figure model.
 */
export function buildSystemScenePlanetSpecialPresentationV1(
  input: SystemScenePlanetSpecialPresentationInputV1,
): SystemScenePlanetSpecialPresentationV1 {
  validateInput(input);

  const rarityTraits = Object.freeze([
    ...input.rarityTraits,
  ]);

  const seed = hashStringToUint32(
    `${input.planetId}|${input.planetType}|25.9`,
  );
  const variant01 = uint32Unit(seed);
  const secondaryVariant01 = uint32Unit(mixUint32(seed ^ 0x9e3779b9));
  const occurrenceVariant01 = uint32Unit(mixUint32(seed ^ 0xd1b54a35));

  const oblateness = buildOblateness(input);
  const rings = buildRingPresentation(
    input,
    seed,
    variant01,
    secondaryVariant01,
    occurrenceVariant01,
  );

  return Object.freeze({
    version: 1 as const,
    sourcePlanetType: input.planetType,
    sourceAxialTiltDegrees: input.axialTiltDegrees,
    sourceRarityTraits: rarityTraits,
    rings,
    oblateness,
    extremeObliquity: rarityTraits.includes('EXTREME_OBLIQUITY'),
    stronglyRetrogradeRotation: rarityTraits.includes('STRONGLY_RETROGRADE_ROTATION'),
    rapidRotator: rarityTraits.includes('RAPID_ROTATOR'),
    puffyLowDensity: rarityTraits.includes('PUFFY_LOW_DENSITY'),
  });
}

function buildOblateness(
  input: SystemScenePlanetSpecialPresentationInputV1,
): SystemScenePlanetOblatenessPresentationV1 {
  const deepEnvelope = GIANT_TYPES.has(input.planetType);
  const rapidSignal = clamp01(
    (18 - input.rotationPeriodHours) / 14,
  );
  const lowDensitySignal = clamp01(
    (2.0 - input.densityGramsPerCubicCentimeter) / 1.5,
  );

  const maximumFlattening = deepEnvelope ? 0.085 : 0.035;
  const flattening = clamp(
    rapidSignal *
      (deepEnvelope ? 0.055 : 0.024) *
      (0.72 + 0.28 * lowDensitySignal),
    0,
    maximumFlattening,
  );

  // Keep approximate rendered volume stable while exposing the oblate silhouette.
  const equatorialScale =
    flattening <= 1e-9
      ? 1
      : Math.pow(1 / (1 - flattening), 1 / 3);
  const polarScale =
    (1 - flattening) * equatorialScale;

  return Object.freeze({
    source: 'ROTATION_SHAPE_PROXY_25_9' as const,
    sourceRotationPeriodHours: input.rotationPeriodHours,
    sourceDensityGramsPerCubicCentimeter:
      input.densityGramsPerCubicCentimeter,
    presentationFlattening01: flattening,
    presentationEquatorialScale: equatorialScale,
    presentationPolarScale: polarScale,
    presentationAdjusted: flattening > 0.002,
  });
}

function buildRingPresentation(
  input: SystemScenePlanetSpecialPresentationInputV1,
  seed: number,
  variant01: number,
  secondaryVariant01: number,
  occurrenceVariant01: number,
): SystemScenePlanetRingPresentationV1 | null {
  if (!GIANT_TYPES.has(input.planetType)) {
    return null;
  }

  const moon =
    resolveRingMoonProxy(
      input,
      variant01,
      secondaryVariant01,
      occurrenceVariant01,
    );

  if (moon === null) {
    return null;
  }

  const richness = clamp01(moon.richnessIndex01);
  const capacity = clamp01(moon.sourceSatelliteCapacityIndex01);
  const iceFraction = clamp01(
    0.18 +
      0.72 * input.iceBearingFractionOfSolids01 +
      0.10 * richness,
  );
  const dustFraction = 1 - iceFraction;

  const styleSeed = mixUint32(seed ^ 0x52f9d3b1);
  const styleVariant01 = uint32Unit(styleSeed);
  const styleOrdinal = Math.floor(styleVariant01 * 5);

  const innerBase =
    styleOrdinal === 0
      ? 1.18
      : styleOrdinal === 1
        ? 1.26
        : styleOrdinal === 2
          ? 1.14
          : styleOrdinal === 3
            ? 1.22
            : 1.20;
  const innerSpread =
    styleOrdinal === 1
      ? 0.22
      : styleOrdinal === 2
        ? 0.12
        : styleOrdinal === 3
          ? 0.18
          : 0.16;
  const inner = clamp(
    innerBase + innerSpread * secondaryVariant01,
    1.12,
    1.48,
  );

  const widthBase =
    styleOrdinal === 0
      ? 0.42
      : styleOrdinal === 1
        ? 0.92
        : styleOrdinal === 2
          ? 0.22
          : styleOrdinal === 3
            ? 0.74
            : 0.54;
  const widthSignal =
    0.34 * richness +
    0.18 * capacity +
    0.12 * variant01 +
    (input.planetType === 'GAS_GIANT'
      ? 0.12
      : input.planetType === 'ICE_GIANT'
        ? 0.08
        : 0.04);
  const width = clamp(
    widthBase + widthSignal,
    0.20,
    1.52,
  );
  const outer = clamp(
    inner + width,
    inner + 0.18,
    2.96,
  );

  const typeOpacityBias =
    input.planetType === 'GAS_GIANT'
      ? 0.10
      : input.planetType === 'ICE_GIANT'
        ? 0.08
        : 0.04;
  const styleOpacityBias =
    styleOrdinal === 0
      ? 0.18
      : styleOrdinal === 1
        ? 0.24
        : styleOrdinal === 2
          ? -0.08
          : styleOrdinal === 3
            ? -0.02
            : 0.08;
  const opticalDepth = clamp(
    0.10 +
      typeOpacityBias +
      styleOpacityBias +
      0.22 * richness +
      0.12 * variant01 +
      0.10 * clamp01(input.referenceBondAlbedo01),
    0.10,
    0.90,
  );

  const bandCount = clampInteger(
    (styleOrdinal === 2 ? 3 : 4) +
      Math.floor(variant01 * 4) +
      (styleOrdinal === 4 ? 1 : 0),
    3,
    9,
  );
  const gapCount = clampInteger(
    (styleOrdinal === 0 ? 0 : 1) + Math.floor(secondaryVariant01 * 3),
    0,
    3,
  );

  const palette = resolveRingPalette(
    styleOrdinal,
    iceFraction,
    secondaryVariant01,
    input.referenceBondAlbedo01,
  );

  return Object.freeze({
    source: 'GIANT_RING_PRESENTATION_PROXY_25_9' as const,
    presenceAuthoritative: false as const,
    sourceMoonCount: moon.sourceMoonCount,
    sourceSatelliteCapacityIndex01: capacity,
    sourceMoonRichnessIndex01: richness,
    sourceMoonArchitectureRegime: moon.architectureRegime,
    sourceIceBearingFractionOfSolids01:
      input.iceBearingFractionOfSolids01,
    sourceReferenceBondAlbedo01: input.referenceBondAlbedo01,
    innerRadiusPlanetRadii: inner,
    outerRadiusPlanetRadii: outer,
    opticalDepth01: opticalDepth,
    iceFraction01: iceFraction,
    dustFraction01: dustFraction,
    bandCount,
    gapCount,
    presentationSeedUint32: seed,
    presentationBaseColorHex: rgbToHex(palette.base),
    presentationAccentColorHex: rgbToHex(palette.accent),
  });
}

function resolveRingMoonProxy(
  input: SystemScenePlanetSpecialPresentationInputV1,
  variant01: number,
  secondaryVariant01: number,
  occurrenceVariant01: number,
): {
  readonly sourceMoonCount: number;
  readonly sourceSatelliteCapacityIndex01: number;
  readonly richnessIndex01: number;
  readonly architectureRegime: string;
} | null {
  if (input.giantMoonProfile !== null) {
    const support = clamp01(
      0.08 +
        0.32 * input.giantMoonProfile.sourceSatelliteCapacityIndex01 +
        0.26 * input.giantMoonProfile.richnessIndex01 +
        0.14 * input.iceBearingFractionOfSolids01 +
        0.08 * input.referenceBondAlbedo01 +
        0.06 * variant01 +
        (input.planetType === 'GAS_GIANT'
          ? 0.08
          : input.planetType === 'ICE_GIANT'
            ? 0.10
            : 0.04),
    );

    const baseChance =
      input.planetType === 'GAS_GIANT'
        ? 0.30
        : input.planetType === 'ICE_GIANT'
          ? 0.28
          : 0.16;
    const ringChance01 = clamp(
      baseChance +
        0.22 * (support - 0.50),
      0.12,
      0.44,
    );

    if (occurrenceVariant01 > ringChance01) {
      return null;
    }

    return input.giantMoonProfile;
  }

  const fallbackCapacity = clamp01(
    0.10 +
      0.24 * input.envelopeMassFraction01 +
      0.16 * input.iceBearingFractionOfSolids01 +
      0.08 * clamp01(input.referenceBondAlbedo01) +
      0.10 * variant01,
  );
  const fallbackRichness = clamp01(
    0.08 +
      0.18 * input.iceBearingFractionOfSolids01 +
      0.14 * input.envelopeMassFraction01 +
      0.08 * secondaryVariant01,
  );
  const ringSupport = clamp01(
    0.12 +
      0.28 * fallbackCapacity +
      0.22 * fallbackRichness +
      0.10 * input.iceBearingFractionOfSolids01 +
      (input.planetType === 'GAS_GIANT'
        ? 0.06
        : input.planetType === 'ICE_GIANT'
          ? 0.08
          : 0.03),
  );

  const fallbackBaseChance =
    input.planetType === 'GAS_GIANT'
      ? 0.10
      : input.planetType === 'ICE_GIANT'
        ? 0.10
        : 0.05;
  const fallbackChance01 = clamp(
    fallbackBaseChance +
      0.14 * (ringSupport - 0.35),
    0.04,
    0.18,
  );

  if (occurrenceVariant01 > fallbackChance01) {
    return null;
  }

  return {
    sourceMoonCount: 0,
    sourceSatelliteCapacityIndex01: fallbackCapacity,
    richnessIndex01: fallbackRichness,
    architectureRegime: 'PRESENTATION_PROXY_GIANT_RING_CANDIDATE',
  };
}

function resolveRingPalette(
  styleOrdinal: number,
  iceFraction: number,
  secondaryVariant01: number,
  referenceBondAlbedo01: number,
): {
  readonly base: Rgb;
  readonly accent: Rgb;
} {
  const icyPalette = {
    base: { r: 208, g: 216, b: 224 },
    accent: { r: 176, g: 205, b: 232 },
  };
  const champagnePalette = {
    base: { r: 201, g: 186, b: 163 },
    accent: { r: 228, g: 214, b: 186 },
  };
  const dustyPalette = {
    base: { r: 159, g: 130, b: 101 },
    accent: { r: 195, g: 149, b: 104 },
  };
  const smokyPalette = {
    base: { r: 140, g: 140, b: 145 },
    accent: { r: 186, g: 188, b: 198 },
  };
  const copperPalette = {
    base: { r: 151, g: 118, b: 105 },
    accent: { r: 208, g: 150, b: 127 },
  };

  const palette =
    styleOrdinal === 1
      ? icyPalette
      : styleOrdinal === 2
        ? dustyPalette
        : styleOrdinal === 3
          ? smokyPalette
          : styleOrdinal === 4
            ? copperPalette
            : champagnePalette;

  const climaticBase = mixRgb(
    palette.base,
    icyPalette.base,
    0.18 + 0.46 * iceFraction,
  );
  const climaticAccent = mixRgb(
    palette.accent,
    icyPalette.accent,
    0.10 + 0.42 * iceFraction,
  );
  const albedoLift = 0.84 + 0.36 * referenceBondAlbedo01;

  return {
    base: scaleRgb(climaticBase, albedoLift * (0.94 + 0.10 * secondaryVariant01)),
    accent: scaleRgb(climaticAccent, albedoLift * (1.00 + 0.14 * secondaryVariant01)),
  };
}

function validateInput(
  input: SystemScenePlanetSpecialPresentationInputV1,
): void {
  if (input.planetId.trim().length === 0) {
    throw new RangeError('planetId must be non-empty.');
  }
  if (!ALLOWED_PLANET_TYPES.has(input.planetType)) {
    throw new RangeError(`Unsupported planetType for point 25.9: ${input.planetType}.`);
  }
  assertPositiveFinite(input.radiusEarth, 'radiusEarth');
  assertPositiveFinite(
    input.densityGramsPerCubicCentimeter,
    'densityGramsPerCubicCentimeter',
  );
  assertUnit(input.envelopeMassFraction01, 'envelopeMassFraction01');
  assertUnit(
    input.iceBearingFractionOfSolids01,
    'iceBearingFractionOfSolids01',
  );
  assertPositiveFinite(input.rotationPeriodHours, 'rotationPeriodHours');
  assertFiniteRange(input.axialTiltDegrees, 0, 180, 'axialTiltDegrees');
  assertUnit(input.referenceBondAlbedo01, 'referenceBondAlbedo01');

  if (input.giantMoonProfile !== null) {
    const moon = input.giantMoonProfile;
    if (!Number.isInteger(moon.sourceMoonCount) || moon.sourceMoonCount < 0) {
      throw new RangeError('sourceMoonCount must be a non-negative integer.');
    }
    assertUnit(
      moon.sourceSatelliteCapacityIndex01,
      'sourceSatelliteCapacityIndex01',
    );
    assertUnit(moon.richnessIndex01, 'richnessIndex01');
    if (moon.architectureRegime.trim().length === 0) {
      throw new RangeError('architectureRegime must be non-empty.');
    }
  }
}

interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

function mixRgb(left: Rgb, right: Rgb, amount01: number): Rgb {
  const t = clamp01(amount01);
  return {
    r: left.r + (right.r - left.r) * t,
    g: left.g + (right.g - left.g) * t,
    b: left.b + (right.b - left.b) * t,
  };
}

function scaleRgb(color: Rgb, scale: number): Rgb {
  return {
    r: clamp(color.r * scale, 0, 255),
    g: clamp(color.g * scale, 0, 255),
    b: clamp(color.b * scale, 0, 255),
  };
}

function rgbToHex(color: Rgb): string {
  return `#${[color.r, color.g, color.b]
    .map(component =>
      Math.round(clamp(component, 0, 255))
        .toString(16)
        .padStart(2, '0')
        .toUpperCase(),
    )
    .join('')}`;
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

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be positive and finite.`);
  }
}

function assertUnit(value: number, label: string): void {
  assertFiniteRange(value, 0, 1, label);
}

function assertFiniteRange(
  value: number,
  minimum: number,
  maximum: number,
  label: string,
): void {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be finite in [${minimum}, ${maximum}].`);
  }
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Math.trunc(value)));
}
