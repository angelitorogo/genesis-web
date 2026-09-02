export interface SystemSceneAtmosphereOpticsSurfaceInput {
  readonly solidSurfaceAvailable: boolean;
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

    const blueTarget = rgb(89, 190, 226);
    const warmTarget = rgb(238, 180, 116);
    const neutralTarget = rgb(206, 224, 232);
    const compositionTint =
      mixRgb(
        mixRgb(neutralTarget, blueTarget, clamp01(methane * 0.88)),
        warmTarget,
        clamp01(warm * (1 - methane * 0.42)),
      );
    const dayTint = mixRgb(
      mixRgb(base, compositionTint, 0.62),
      rgb(236, 246, 250),
      haze * 0.18,
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
        1.028 + 0.020 * haze + 0.010 * polar,
      presentationRimStrength01:
        clamp01(0.26 + 0.30 * haze + 0.12 * polar + 0.08 * condensable),
      presentationTerminatorSoftness01:
        clamp01(0.15 + 0.20 * haze + 0.08 * condensable),
      presentationNightFloor01:
        clamp(0.035 + 0.035 * haze, 0.03, 0.085),
      presentationTwilightGlow01:
        clamp01(0.18 + 0.30 * haze + 0.10 * polar),
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
  const vapor = surface?.retainedAtmosphericWaterVaporMoleFraction01 ?? 0;
  const clouds = surface?.presentationCloudCoverageFraction01 ?? 0;
  const ice = surface?.surfaceIceCoverageFraction01 ?? 0;

  assertIndex01(vapor, 'retainedAtmosphericWaterVaporMoleFraction01');
  assertIndex01(clouds, 'presentationCloudCoverageFraction01');
  assertIndex01(ice, 'surfaceIceCoverageFraction01');

  const surfaceTint = surfaceAtmosphereTint(input.surfaceStyle);
  const paleAir = rgb(143, 201, 232);
  const humidAir = rgb(188, 220, 235);
  const dryAir = rgb(214, 190, 153);
  let airTint = mixRgb(
    surfaceTint,
    paleAir,
    0.55 + 0.25 * pressureSupport01,
  );
  airTint = mixRgb(
    airTint,
    humidAir,
    clamp01(vapor * 2.4 + clouds * 0.25),
  );
  airTint = mixRgb(
    airTint,
    dryAir,
    clamp01((1 - vapor) * pressureSupport01 * 0.10),
  );
  airTint = mixRgb(
    airTint,
    rgb(230, 240, 248),
    ice * 0.10,
  );

  const nightTint = mixRgb(
    airTint,
    rgb(27, 52, 78),
    0.72,
  );

  return Object.freeze({
    version: SYSTEM_SCENE_ATMOSPHERE_OPTICS_VERSION,
    atmospherePresent,
    deepEnvelope: false,
    presentationShellScale:
      atmospherePresent
        ? 1.020 + 0.018 * pressureSupport01 + 0.006 * clouds
        : 1,
    presentationRimStrength01:
      atmospherePresent
        ? clamp01(0.12 + 0.34 * pressureSupport01 + 0.12 * clouds)
        : 0,
    presentationTerminatorSoftness01:
      atmospherePresent
        ? clamp01(0.055 + 0.18 * pressureSupport01 + 0.06 * clouds)
        : 0.022,
    presentationNightFloor01:
      atmospherePresent
        ? clamp(0.020 + 0.035 * pressureSupport01, 0.02, 0.07)
        : 0.012,
    presentationTwilightGlow01:
      atmospherePresent
        ? clamp01(0.08 + 0.30 * pressureSupport01 + 0.10 * clouds)
        : 0,
    presentationDayTintHex: rgbToHex(airTint),
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
