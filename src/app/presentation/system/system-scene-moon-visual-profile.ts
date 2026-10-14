import type { SystemSceneMoonPresentationV1 } from './system-scene-moon-presentation';

/** D.3: deterministic visual interpretation only, never a scientific resolution. */
export interface MoonVisualProfileD3 {
  readonly ice01: number;
  readonly rock01: number;
  readonly mineralRegions01: number;
  readonly resurfacing01: number;
  readonly tectonics01: number;
  readonly silicateVolcanism01: number;
  readonly cryotectonics01: number;
  readonly craterRetention01: number;
  readonly basinScale01: number;
  readonly reliefContrast01: number;
  readonly atmosphericOpacity01: number;
  readonly atmosphericHaze01: number;
  readonly atmosphericClouds01: number;
  readonly liquidVisual01: number;
  readonly thermallySupportedCryosphere: boolean;
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));

export function buildMoonVisualProfileD3(moon: SystemSceneMoonPresentationV1): MoonVisualProfileD3 {
  const ice = clamp(moon.sourceInferredIceRichnessIndex01);
  const coldIce = moon.sourceEstimatedSurfaceTemperatureKelvin < 240 && ice >= 0.15;
  const activity = clamp(moon.sourceGeologicalActivityIndex01);
  const tides = clamp(moon.sourceTidalHeatingIndex01);
  const thermal = moon.sourceIceShellThermalRegime;
  // Unknown thermal state cannot be promoted to a *confirmed* active cryosphere.
  const thermalPossible = thermal === 'CONDITIONAL_ICE_OCEAN' ||
    thermal === 'HIGH_TIDAL_FLUX_SCENARIO';
  const cryoConditional = moon.sourceCryovolcanismScenario === 'CONDITIONAL';
  const cryotectonics = coldIce ? clamp(ice * (0.16 + activity * 0.67 + tides * 0.22) *
    (thermal === 'TIDAL_HEAT_INSUFFICIENT_IN_SCENARIO' ? 0.40 : 1)) : 0;
  const silicateVolcanism = !coldIce && moon.surfaceStyle === 'VOLCANIC'
    ? clamp(activity * (0.48 + tides * 0.40) * (1 - ice * 0.40)) : 0;
  const resurfacing = clamp(activity * (0.18 + 0.36 * (1 - ice)) +
    cryotectonics * (cryoConditional ? 0.42 : 0.13) + silicateVolcanism * 0.42);
  const gravity = clamp(Math.sqrt(moon.sourceSurfaceGravityEarth / 0.35));
  const size = clamp(Math.sqrt(moon.sourceRadiusEarth / 0.48));
  const craterRetention = clamp(0.92 - resurfacing * 0.77);
  const pressurePresent = moon.presentationAtmospherePresent;
  return Object.freeze({
    ice01: ice,
    rock01: 1 - ice,
    mineralRegions01: clamp(0.34 + 0.34 * (1 - ice) + 0.18 * resurfacing),
    resurfacing01: resurfacing,
    tectonics01: clamp(0.15 * activity + 0.38 * cryotectonics + 0.34 * silicateVolcanism),
    silicateVolcanism01: silicateVolcanism,
    cryotectonics01: cryotectonics,
    craterRetention01: craterRetention,
    basinScale01: clamp(0.22 + 0.38 * (1 - size) + 0.27 * (1 - gravity)),
    reliefContrast01: clamp(0.85 - 0.36 * gravity + 0.18 * (1 - ice)),
    atmosphericOpacity01: pressurePresent ? clamp(moon.presentationAtmosphereStrength01) : 0,
    atmosphericHaze01: pressurePresent ? clamp(moon.presentationAtmosphereHaze01 ?? 0) : 0,
    atmosphericClouds01: pressurePresent ? clamp(moon.presentationCloudCoverage01) : 0,
    liquidVisual01: clamp(moon.presentationLiquidCoverage01),
    thermallySupportedCryosphere: thermalPossible,
  });
}
