import { type AtmosphereOpticalScienceV1 } from './system-scene-atmosphere-optical-science';
import { buildSystemSceneMolecularAtmosphereVisualV2 } from './system-scene-atmosphere-optical-presentation-v2';
export interface SystemSceneAtmosphereOpticsSurfaceInput {
  readonly solidSurfaceAvailable: boolean;
  readonly retainedGasComposition?: readonly { readonly gas: string; readonly moleFraction01: number }[];
  readonly retainedSurfacePressurePascal: number | null;
  readonly retainedAtmosphericWaterVaporMoleFraction01: number;
  readonly presentationCloudCoverageFraction01: number | null;
  readonly surfaceIceCoverageFraction01: number | null;
}

export interface SystemSceneAtmosphereOpticsGiantInput {
  readonly methaneMoleFraction01: number;
  readonly waterVaporMoleFraction01: number;
  readonly presentationMethaneBlueing01: number;
  readonly presentationWarmChromophore01: number;
  readonly presentationPolarHaze01: number;
  readonly presentationUpperHaze01: number;
}

export interface SystemSceneAtmosphereOpticsInput {
  readonly baseColorHex: string;
  readonly surfaceStyle:
    | 'rocky'
    | 'oceanic'
    | 'icy'
    | 'gaseous'
    | 'volcanic';
  readonly surfaceEnvironment:
    SystemSceneAtmosphereOpticsSurfaceInput | null;
  readonly giantAtmosphere:
    SystemSceneAtmosphereOpticsGiantInput | null;
  /** ATM-VIS.2 opt-in physical diagnostic. Missing data keeps D.4d baseline. */
  readonly opticalScience?: AtmosphereOpticalScienceV1 | null;
}

/**
 * Point-25.6 read-only optical presentation derived from the already-frozen
 * 25.3 solid-atmosphere and 25.4 deep-envelope handoffs.
 *
 * The values below are deliberately named `presentation*`: GENESIS does not yet
 * solve wavelength-dependent radiative transfer. They are bounded visual
 * parameters for the GLSL atmosphere shell, terminator and night-side response;
 * none is persisted or written back to phase-20 physics.
 */
export interface SystemSceneAtmosphereOpticsV1 {
  readonly version: 1;
  readonly atmospherePresent: boolean;
  readonly deepEnvelope: boolean;
  readonly presentationShellScale: number;
  readonly presentationRimStrength01: number;
  /** Front-hemisphere scattering envelope, decoupled from science. */
  readonly presentationFrontHaze01: number;
  readonly presentationTerminatorSoftness01: number;
  readonly presentationNightFloor01: number;
  readonly presentationTwilightGlow01: number;
  readonly presentationDayTintHex: string;
  readonly presentationNightTintHex: string;
}

export const SYSTEM_SCENE_ATMOSPHERE_OPTICS_VERSION =
  1 as const;

export function buildSystemSceneAtmosphereOpticsV1(
  input: SystemSceneAtmosphereOpticsInput,
): SystemSceneAtmosphereOpticsV1 {
  const base = parseHexColor(input.baseColorHex);

  if (
    input.giantAtmosphere !== null
  ) {
    const giant = input.giantAtmosphere;
    assertIndex01(giant.methaneMoleFraction01, 'methaneMoleFraction01');
    assertIndex01(giant.waterVaporMoleFraction01, 'waterVaporMoleFraction01');
    assertIndex01(giant.presentationMethaneBlueing01, 'presentationMethaneBlueing01');
    assertIndex01(giant.presentationWarmChromophore01, 'presentationWarmChromophore01');
    assertIndex01(giant.presentationPolarHaze01, 'presentationPolarHaze01');
    assertIndex01(giant.presentationUpperHaze01, 'presentationUpperHaze01');

    const methane = giant.presentationMethaneBlueing01;
    const warm = giant.presentationWarmChromophore01;
    const haze = giant.presentationUpperHaze01;
    const polar = giant.presentationPolarHaze01;
    const condensable = clamp01(
      giant.methaneMoleFraction01 +
        giant.waterVaporMoleFraction01,
    );

    // D.4b: tint comes from the existing cloud-top presentation proxies.
    // The jade/violet branches are *illustrative hazes*, not detections of
    // colour-producing aerosols or wavelength-resolved radiative transfer.
    const neutralTarget = rgb(205, 219, 230);
    const methaneTarget = rgb(78, 185, 226);
    const warmTarget = rgb(236, 176, 119);
    const jadeHaze01 = clamp01(methane * polar * (1 - warm) * 1.55);
    const violetHaze01 = clamp01(
      methane * warm * haze * polar * 2.45,
    );
    let compositionTint = mixRgb(
      neutralTarget, methaneTarget, clamp01(methane * 0.94),
    );
    compositionTint = mixRgb(
      compositionTint, warmTarget,
      clamp01(warm * (1 - 0.35 * methane)),
    );
    compositionTint = mixRgb(
      compositionTint, rgb(101, 181, 157), 0.60 * jadeHaze01,
    );
    compositionTint = mixRgb(
      compositionTint, rgb(168, 143, 206), 0.65 * violetHaze01,
    );
    const dayTint = mixRgb(
      mixRgb(base, compositionTint, 0.78),
      rgb(235, 242, 246), haze * 0.09,
    );
    const nightTint = mixRgb(
      dayTint,
      rgb(35, 77, 108),
      0.62 + methane * 0.16,
    );

    return Object.freeze({
      version: SYSTEM_SCENE_ATMOSPHERE_OPTICS_VERSION,
      atmospherePresent: true,
      deepEnvelope: true,
      presentationShellScale:
        1.055 + 0.028 * haze + 0.013 * polar,
      presentationRimStrength01:
        clamp01(0.68 + 0.22 * haze + 0.12 * polar + 0.07 * condensable),
      presentationFrontHaze01:
        clamp01(0.33 + 0.18 * haze + 0.09 * polar),
      // D.4d: deep gas columns have a broad day/night transition;
      // vacuum and rocky profiles keep their own, separate behavior.
      presentationTerminatorSoftness01:
        clamp01(0.28 + 0.21 * haze + 0.08 * condensable),
      presentationNightFloor01:
        clamp(0.035 + 0.035 * haze, 0.03, 0.085),
      presentationTwilightGlow01:
        clamp01(0.30 + 0.32 * haze + 0.12 * polar),
      presentationDayTintHex: rgbToHex(dayTint),
      presentationNightTintHex: rgbToHex(nightTint),
    });
  }

  const surface = input.surfaceEnvironment;
  const pressure =
    surface?.solidSurfaceAvailable === true
      ? surface.retainedSurfacePressurePascal ?? 0
      : 0;
  const pressureSupport01 = atmosphericPressureSupport01(pressure);
  const atmospherePresent = pressureSupport01 > 0;
  // D.4b: physically resolved pressure controls *visibility* separately from
  // logarithmic terminator support. Traces remain almost transparent; a
  // 0.46-bar or 2.4-bar atmosphere has an unmistakable optical envelope.
  const envelopeStrength01 = clamp01(
    (Math.sqrt(pressure / (pressure + 75_000)) - 0.055) * 1.18,
  );
  const vapor = surface?.retainedAtmosphericWaterVaporMoleFraction01 ?? 0;
  const clouds = surface?.presentationCloudCoverageFraction01 ?? 0;
  const ice = surface?.surfaceIceCoverageFraction01 ?? 0;

  assertIndex01(vapor, 'retainedAtmosphericWaterVaporMoleFraction01');
  assertIndex01(clouds, 'presentationCloudCoverageFraction01');
  assertIndex01(ice, 'surfaceIceCoverageFraction01');

  const surfaceTint = surfaceAtmosphereTint(input.surfaceStyle);
  const gasFractions = surface?.retainedGasComposition ?? [];
  for (const component of gasFractions) {
    assertIndex01(component.moleFraction01, `retainedGasComposition[${component.gas}]`);
  }
  const fraction = (gas: string): number => clamp01(
    gasFractions.reduce((sum, item) =>
      sum + (item.gas === gas ? item.moleFraction01 : 0), 0),
  );
  const carbonDioxide01 = fraction('CARBON_DIOXIDE');
  const sulfurDioxide01 = fraction('SULFUR_DIOXIDE');
  const methane01 = fraction('METHANE');
  const ammonia01 = fraction('AMMONIA');
  const nitrogen01 = fraction('NITROGEN');
  const oxygen01 = fraction('OXYGEN');
  // Gases such as CO2 and SO2 are not intrinsically orange or purple.
  // These tints represent possible aerosol/cloud optical appearances only;
  // the model has no spectral transfer or resolved aerosol chemistry.
  const warmHaze01 = clamp01(
    (0.16 * carbonDioxide01 + 2.2 * sulfurDioxide01) *
      (0.35 + 0.65 * clouds),
  );
  const blueRayleigh01 = clamp01((nitrogen01 + oxygen01) * 0.55);
  const methaneHaze01 = clamp01(
    (2.6 * methane01 + 0.55 * vapor) * (0.38 + 0.62 * clouds),
  );
  const ammoniaHaze01 = clamp01(
    2.0 * ammonia01 * (0.38 + 0.62 * clouds),
  );
  const violetHaze01 = clamp01(
    8.0 * methane01 * sulfurDioxide01 * (0.30 + 0.70 * clouds),
  );
  let airTint = mixRgb(
    surfaceTint, rgb(137, 188, 222),
    0.68 + 0.18 * pressureSupport01,
  );
  airTint = mixRgb(airTint, rgb(116, 178, 239), 0.34 * blueRayleigh01);
  airTint = mixRgb(
    airTint, rgb(188, 217, 228), clamp01(vapor * 2 + clouds * 0.23),
  );
  airTint = mixRgb(airTint, rgb(227, 237, 244), ice * 0.08);
  airTint = mixRgb(airTint, rgb(226, 151, 104), 0.78 * warmHaze01);
  airTint = mixRgb(airTint, rgb(83, 180, 215), 0.71 * methaneHaze01);
  airTint = mixRgb(airTint, rgb(113, 185, 141), 0.70 * ammoniaHaze01);
  airTint = mixRgb(airTint, rgb(170, 134, 194), 0.64 * violetHaze01);

  const molecular = buildSystemSceneMolecularAtmosphereVisualV2(
    input.opticalScience, surface?.presentationCloudCoverageFraction01 ?? null,
  );
  // The 25.x gas-specific illustrative palettes remain a strict compatibility
  // fallback for fixtures/unknown columns. Fully resolved surface atmospheres
  // use molecular scattering without inventing CO2/SO2 aerosol pigments.
  const chosenAirTint = molecular !== null
    ? parseHexColor(molecular.dayTintHex)
    : input.opticalScience !== null && input.opticalScience !== undefined
      // An unresolved chemical column cannot justify a gas-specific palette.
      // Retain the frozen geometry, but use a subdued neutral presentation.
      ? mixRgb(base, rgb(204, 211, 215), 0.72)
      : airTint;
  const nightTint = mixRgb(
    chosenAirTint,
    rgb(27, 52, 78),
    0.72,
  );
  // ATM-VIS.2a: reduce shell brightness without touching the independently
  // rendered surface/water specular shader or the canonical D.4d geometry.
  const molecularScatterScale = molecular === null ? 1 :
    (0.92 + 0.10 * molecular.molecularVisibility01) *
    molecular.shellRadianceScale01;
  const molecularTerminatorScale = molecular === null ? 1 :
    0.93 + 0.10 * molecular.molecularVisibility01;

  return Object.freeze({
    version: SYSTEM_SCENE_ATMOSPHERE_OPTICS_VERSION,
    atmospherePresent,
    deepEnvelope: false,
    // D.4d: curvature in the *visual* optical profile makes a 2.4-bar
    // atmosphere materially deeper than a 0.46-bar one. The near-vacuum
    // branch stays effectively invisible. No pressure or gases are inferred.
    presentationShellScale:
      atmospherePresent
        ? 1.008 + 0.060 * envelopeStrength01 +
          0.022 * envelopeStrength01 ** 2 +
          0.010 * clouds * envelopeStrength01
        : 1,
    presentationRimStrength01:
      atmospherePresent
        ? clamp01((0.016 + 0.60 * envelopeStrength01 +
          0.37 * envelopeStrength01 ** 2 +
          0.07 * clouds * envelopeStrength01) * molecularScatterScale)
        : 0,
    presentationFrontHaze01:
      atmospherePresent
        ? clamp01((0.42 * envelopeStrength01 +
          0.28 * envelopeStrength01 ** 2 +
          0.055 * clouds * envelopeStrength01) * molecularScatterScale)
        : 0,
    presentationTerminatorSoftness01:
      atmospherePresent
        ? clamp01((0.035 + 0.16 * envelopeStrength01 +
          0.18 * envelopeStrength01 ** 2 +
          0.045 * clouds * envelopeStrength01) * molecularTerminatorScale)
        : 0.022,
    presentationNightFloor01:
      atmospherePresent
        ? clamp(0.020 + 0.035 * pressureSupport01, 0.02, 0.07)
        : 0.012,
    presentationTwilightGlow01:
      atmospherePresent
        ? clamp01((0.08 + 0.50 * envelopeStrength01 + 0.12 * clouds * envelopeStrength01) *
          (molecular?.twilightRadianceScale01 ?? 1))
        : 0,
    presentationDayTintHex: rgbToHex(chosenAirTint),
    presentationNightTintHex: rgbToHex(nightTint),
  });
}

function atmosphericPressureSupport01(
  pressurePascal: number,
): number {
  if (!Number.isFinite(pressurePascal) || pressurePascal < 0) {
    throw new RangeError(
      `retainedSurfacePressurePascal must be finite and >= 0: ${pressurePascal}.`,
    );
  }

  if (pressurePascal === 0) {
    return 0;
  }

  // Logarithmic because phase-20 pressure spans many orders of magnitude.
  return clamp01(
    Math.log10(1 + pressurePascal) /
      Math.log10(1 + 2_000_000),
  );
}

function surfaceAtmosphereTint(
  style: SystemSceneAtmosphereOpticsInput['surfaceStyle'],
): Rgb {
  switch (style) {
    case 'oceanic':
      return rgb(102, 174, 220);
    case 'icy':
      return rgb(174, 214, 238);
    case 'volcanic':
      return rgb(196, 151, 118);
    case 'rocky':
      return rgb(159, 187, 207);
    case 'gaseous':
      return rgb(166, 205, 222);
  }
}

interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

function parseHexColor(value: string): Rgb {
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new RangeError(`baseColorHex must be #RRGGBB: ${value}.`);
  }

  return rgb(
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  );
}

function rgb(r: number, g: number, b: number): Rgb {
  return Object.freeze({ r, g, b });
}

function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  const amount = clamp01(t);
  return rgb(
    a.r + (b.r - a.r) * amount,
    a.g + (b.g - a.g) * amount,
    a.b + (b.b - a.b) * amount,
  );
}

function rgbToHex(value: Rgb): string {
  return `#${toByte(value.r).toString(16).padStart(2, '0')}${toByte(value.g).toString(16).padStart(2, '0')}${toByte(value.b).toString(16).padStart(2, '0')}`.toUpperCase();
}

function toByte(value: number): number {
  return Math.round(clamp(value, 0, 255));
}

function assertIndex01(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${label} must be finite in [0, 1]: ${value}.`);
  }
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
