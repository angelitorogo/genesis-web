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
  /** B pressure is a conditional scenario; null means no resolved gas column. */
  readonly atmosphereScenarioPressurePascal?: number | null;
  /** B's resolved scenario species, not detections. Absent on older fixtures. */
  readonly atmosphereScenarioSpecies?: readonly { readonly gas: string; readonly moleFraction01: number }[];
  /** C's conditional thermal diagnosis; never a confirmed ocean. */
  readonly iceShellThermalRegime?: string | null;
  readonly cryovolcanismScenario?: string | null;
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
  readonly sourceAtmosphereScenarioSpecies?: readonly { readonly gas: string; readonly moleFraction01: number }[];
  readonly sourceIceShellThermalRegime?: string | null;
  readonly sourceCryovolcanismScenario?: string | null;
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
  readonly presentationAtmosphereHaze01?: number;
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

  // D.3f — only a pressure-supported visual scenario may show persistent blue
  // seas. An inherited water-potential index is NOT proof of liquid stability:
  // Calos-like warm worlds with unresolved B pressure retain their wet/volatile
  // surface identity, but not visible oceans. This is a presentation gate only.
  const liquidScenarioSupported = supportsLiquidSurfaceVisual(input);
  const candidateSurfaceWater = supportsCandidateSurfaceWaterVisual(input);
  const surfaceWaterIndicator = input.waterRegime === 'SURFACE_LIQUID' ||
    input.waterRegime === 'MIXED' ||
    input.surfaceLiquidWaterPotentialIndex01 >= 0.60;
  const liquidVisualEligible = liquidScenarioSupported && surfaceWaterIndicator &&
    input.waterInventoryIndex01 >= 0.18;
  const liquidCoverage01 =
    liquidVisualEligible
      ? clamp(
          0.22 +
            0.66 * input.surfaceLiquidWaterPotentialIndex01 +
            0.16 * input.waterInventoryIndex01 +
            0.10 * input.tidalHeatingIndex01 +
            0.06 * input.geologicalActivityIndex01,
          0.16,
          0.90,
        )
      : 0;

  const supportsGeneralizedSurfaceIce =
    supportsGeneralizedSurfaceIceV1(input);

  const iceCoverage01 =
    !supportsGeneralizedSurfaceIce
      ? clamp(0.05 * input.inferredIceRichnessIndex01, 0, 0.05)
      : input.waterRegime === 'NONE'
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

  // When B is available, never fabricate a visual atmosphere from the V1
  // retention index if its conditional gas column is unresolved.
  const pressure = input.atmosphereScenarioPressurePascal;
  // No inferred visual atmosphere from a legacy regime/retention label alone.
  // Unavailable B data (null OR absent) must not produce an optical shell.
  const atmospherePresent = pressure !== null && pressure !== undefined && pressure >= 1;
  const atmosphereStrength01 = atmospherePresent
    ? clamp(0.20 + 1.06 * pressure / (pressure + 5200), 0.22, 1.00)
    : 0;

  const atmosphereSpecies = input.atmosphereScenarioSpecies ?? [];
  const methaneFraction = atmosphereSpecies.reduce(
    (n, species) => n + (species.gas === 'CH4' || species.gas === 'METHANE' ? species.moleFraction01 : 0), 0);
  const aerosolScenario = clamp01(methaneFraction * 1.8) *
    (input.estimatedSurfaceTemperatureKelvin < 190 ? 1 : 0.4);
  const atmosphereHaze01 =
    !atmospherePresent
      ? 0
      : input.estimatedSurfaceTemperatureKelvin < 120
        ? clamp(0.22 + 0.34 * atmosphereStrength01 + 0.74 * aerosolScenario, 0.22, 0.96)
        : input.estimatedSurfaceTemperatureKelvin > 330
          ? clamp(0.10 + 0.26 * atmosphereStrength01, 0.10, 0.56)
          : clamp(0.16 + 0.30 * atmosphereStrength01 + 0.28 * aerosolScenario, 0.16, 0.68);

  const waterVaporFraction = atmosphereSpecies.reduce(
    (n, species) => n + (species.gas === 'H2O' || species.gas === 'WATER_VAPOR' ? species.moleFraction01 : 0), 0);
  const cloudChemistryEligible = input.atmosphereScenarioSpecies === undefined ||
    (waterVaporFraction >= 0.0003 && input.estimatedSurfaceTemperatureKelvin >= 240 &&
      input.estimatedSurfaceTemperatureKelvin <= 350);
  const cloudCoverage01 =
    (!cloudChemistryEligible || !atmospherePresent || input.estimatedSurfaceTemperatureKelvin < 170 ||
      input.estimatedSurfaceTemperatureKelvin > 360)
      ? 0
      : pressure !== null && pressure !== undefined && pressure >= 1800
        ? liquidCoverage01 > 0.02
          ? clamp(
              0.12 +
                0.34 * input.waterInventoryIndex01 +
                0.46 * liquidCoverage01 +
                0.12 * secondary01,
              0.10,
              0.90,
            )
          : input.atmosphereRegime === 'SUBSTANTIAL' || atmosphereStrength01 >= 0.45
            ? clamp(
                0.06 +
                  0.16 * input.waterInventoryIndex01 +
                  0.10 * secondary01,
                0.04,
                0.36,
              )
            : 0
        : 0;

  const palette = moonPalette(
    surfaceStyle,
    input.inferredIceRichnessIndex01,
    variant01,
    secondary01,
  );

  const atmosphereColor = atmospherePalette(
    palette.accent,
    atmosphereSpecies,
    input.estimatedSurfaceTemperatureKelvin,
    aerosolScenario,
  );

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
    sourceAtmosphereScenarioSpecies: input.atmosphereScenarioSpecies === undefined
      ? undefined
      : Object.freeze(input.atmosphereScenarioSpecies.map(species => Object.freeze({
        gas: species.gas, moleFraction01: species.moleFraction01,
      }))),
    sourceIceShellThermalRegime: input.iceShellThermalRegime ?? null,
    sourceCryovolcanismScenario: input.cryovolcanismScenario ?? null,
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
    presentationAtmosphereHaze01: atmosphereHaze01,
    presentationAtmosphereShellScale:
      atmospherePresent
        ? atmosphereShellScale(atmosphereStrength01, atmosphereHaze01, input.atmosphereRegime, pressure)
        : 1,
    presentationBaseColorHex: rgbToHex(palette.base),
    presentationAccentColorHex: rgbToHex(palette.accent),
    presentationAtmosphereColorHex: rgbToHex(atmosphereColor),
    presentationSeedUint32: seed,
  });
}


function atmosphereShellScale(
  atmosphereStrength01: number,
  atmosphereHaze01: number,
  regime: string,
  pressurePascal: number | null | undefined,
): number {
  const denseResolvedBoost = pressurePascal !== null && pressurePascal !== undefined && pressurePascal >= 35000
    ? 0.012
    : 0;
  const thinSuppression = regime === 'THIN' || regime === 'TRACE'
    ? 0.002
    : 0;
  return clamp(
    1.020 +
      0.052 * atmosphereStrength01 +
      0.026 * atmosphereHaze01 +
      denseResolvedBoost -
      thinSuppression,
    1.018,
    1.090,
  );
}

function atmospherePalette(
  accent: Rgb,
  atmosphereSpecies: readonly { readonly gas: string; readonly moleFraction01: number }[],
  temperatureKelvin: number,
  aerosolScenario: number,
): Rgb {
  const neutralBase = temperatureKelvin < 220
    ? { r: 173, g: 198, b: 211 }
    : { r: 176, g: 197, b: 206 };
  if (atmosphereSpecies.length === 0) {
    return neutralBase;
  }

  const weighted = weightedAtmosphereColor(atmosphereSpecies, neutralBase);
  let atmosphereColor = mixRgb(neutralBase, weighted, 0.56);
  atmosphereColor = mixRgb(atmosphereColor, mixRgb(accent, weighted, 0.35), 0.22);

  const co2Fraction = sumSpecies(atmosphereSpecies, ['CARBON_DIOXIDE', 'CO2']);
  const sulfurFraction = sumSpecies(atmosphereSpecies, ['SULFUR_DIOXIDE', 'SO2', 'SULFUR_VAPOR']);
  const ammoniaFraction = sumSpecies(atmosphereSpecies, ['AMMONIA', 'NH3']);
  const waterFraction = sumSpecies(atmosphereSpecies, ['H2O', 'WATER_VAPOR']);

  atmosphereColor = mixRgb(atmosphereColor, { r: 214, g: 174, b: 112 }, 0.40 * co2Fraction);
  atmosphereColor = mixRgb(atmosphereColor, { r: 227, g: 190, b: 70 }, 0.46 * sulfurFraction);
  atmosphereColor = mixRgb(atmosphereColor, { r: 198, g: 222, b: 170 }, 0.30 * ammoniaFraction);
  atmosphereColor = mixRgb(atmosphereColor, { r: 214, g: 232, b: 246 }, 0.30 * waterFraction);
  atmosphereColor = mixRgb(atmosphereColor, { r: 104, g: 202, b: 225 }, 0.42 * sumSpecies(atmosphereSpecies, ["METHANE", "CH4"]));
  atmosphereColor = mixRgb(atmosphereColor, { r: 193, g: 150, b: 94 }, 0.46 * aerosolScenario);
  return atmosphereColor;
}

function weightedAtmosphereColor(
  atmosphereSpecies: readonly { readonly gas: string; readonly moleFraction01: number }[],
  fallback: Rgb,
): Rgb {
  let total = 0;
  let r = 0;
  let g = 0;
  let b = 0;
  for (const species of atmosphereSpecies) {
    const weight = clamp01(species.moleFraction01);
    if (weight <= 0) {
      continue;
    }
    const color = gasVisualColor(species.gas);
    total += weight;
    r += color.r * weight;
    g += color.g * weight;
    b += color.b * weight;
  }
  if (total <= 1e-6) {
    return fallback;
  }
  return { r: r / total, g: g / total, b: b / total };
}

function gasVisualColor(gas: string): Rgb {
  const normalized = gas.trim().toUpperCase();
  if (['METHANE', 'CH4'].includes(normalized)) {
    return { r: 98, g: 196, b: 220 };
  }
  if (['CARBON_DIOXIDE', 'CO2'].includes(normalized)) {
    return { r: 214, g: 176, b: 112 };
  }
  if (['SULFUR_DIOXIDE', 'SO2', 'SULFUR_VAPOR'].includes(normalized)) {
    return { r: 228, g: 191, b: 67 };
  }
  if (['AMMONIA', 'NH3'].includes(normalized)) {
    return { r: 198, g: 223, b: 170 };
  }
  if (['H2O', 'WATER_VAPOR'].includes(normalized)) {
    return { r: 217, g: 234, b: 247 };
  }
  if (['HYDROGEN', 'H2', 'HELIUM', 'HE'].includes(normalized)) {
    return { r: 191, g: 208, b: 227 };
  }
  if (['NITROGEN', 'N2', 'OXYGEN', 'O2', 'ARGON', 'AR'].includes(normalized)) {
    return { r: 178, g: 199, b: 210 };
  }
  return { r: 185, g: 194, b: 198 };
}

function sumSpecies(
  atmosphereSpecies: readonly { readonly gas: string; readonly moleFraction01: number }[],
  aliases: readonly string[],
): number {
  return atmosphereSpecies.reduce((sum, species) =>
    sum + (aliases.includes(species.gas.trim().toUpperCase()) ? species.moleFraction01 : 0), 0);
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

function supportsGeneralizedSurfaceIceV1(
  input: SystemSceneMoonPresentationInputV1,
): boolean {
  return input.estimatedSurfaceTemperatureKelvin <= 273.16;
}

function moonSurfaceStyle(
  input: SystemSceneMoonPresentationInputV1,
): SystemSceneMoonSurfaceStyleV1 {
  const coldIceCrust = input.estimatedSurfaceTemperatureKelvin < 200 &&
    input.inferredIceRichnessIndex01 >= 0.35;
  const surfaceLiquidScenario = supportsLiquidSurfaceVisual(input);
  const candidateSurfaceWater = supportsCandidateSurfaceWaterVisual(input);
  if (
    !coldIceCrust &&
    !(surfaceLiquidScenario || candidateSurfaceWater) &&
    (input.geologyRegime === 'EXTREME' ||
    (
      input.geologyRegime === 'TIDALLY_ACTIVE' &&
      input.tidalHeatingIndex01 >= 0.66
    ))
  ) {
    return 'VOLCANIC';
  }

  if (
    (candidateSurfaceWater ||
      (surfaceLiquidScenario && input.waterInventoryIndex01 >= 0.18)) && (
      input.waterRegime === 'SURFACE_LIQUID' ||
      input.waterRegime === 'MIXED' ||
      input.surfaceLiquidWaterPotentialIndex01 >= 0.60 ||
      (
        input.isOceanBearingGiantMoonCandidate &&
        input.surfaceLiquidWaterPotentialIndex01 >= 0.35
      )
    )
  ) {
    // Candidate-only warm worlds may expose basins and volatile-altered rock,
    // but the OCEANIC material implies persistent seas. Keep it MIXED until B
    // resolves enough pressure. Scientific indices remain untouched.
    if (!surfaceLiquidScenario) return 'MIXED';
    return input.inferredIceRichnessIndex01 >= 0.45 || input.giantCompositionRegime === 'ICE_RICH'
      ? 'MIXED'
      : 'OCEANIC';
  }

  const supportsGeneralizedSurfaceIce =
    supportsGeneralizedSurfaceIceV1(input);

  if (
    supportsGeneralizedSurfaceIce &&
    (
      input.giantCompositionRegime === 'ICE_RICH' ||
      input.waterRegime === 'SURFACE_ICE' ||
      input.waterRegime === 'ICE_AND_SUBSURFACE_OCEAN' ||
      input.inferredIceRichnessIndex01 >= 0.62
    )
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

function supportsLiquidSurfaceVisual(input: SystemSceneMoonPresentationInputV1): boolean {
  const kelvin = input.estimatedSurfaceTemperatureKelvin;
  // Water ice/brines below the freezing point are not resolved by this visual
  // projection; temperature and the equilibrium-pressure threshold must both
  // be satisfied before painting persistent *liquid-water* seas.
  if (kelvin < 273.15 || kelvin > 350) return false;
  const pressure = input.atmosphereScenarioPressurePascal;
  if (pressure === undefined || pressure === null) return false;
  const saturationPa = 611.2 * Math.exp(17.62 * (kelvin - 273.15) / (kelvin - 30.03));
  return pressure >= Math.max(611.657, saturationPa);
}


function supportsCandidateSurfaceWaterVisual(input: SystemSceneMoonPresentationInputV1): boolean {
  if (input.atmosphereScenarioPressurePascal !== undefined && input.atmosphereScenarioPressurePascal !== null) {
    return false;
  }
  const kelvin = input.estimatedSurfaceTemperatureKelvin;
  if (kelvin < 268 || kelvin > 325) return false;
  if (input.surfaceLiquidWaterPotentialIndex01 < 0.72) return false;
  if (input.waterInventoryIndex01 < 0.42) return false;
  return input.isOceanBearingGiantMoonCandidate ||
    input.tidalHeatingIndex01 >= 0.42 ||
    input.geologicalActivityIndex01 >= 0.52 ||
    input.waterRegime === 'MIXED' ||
    input.waterRegime === 'SURFACE_LIQUID';
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
