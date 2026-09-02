export interface SystemScenePlanetSurfacePresentationInput {
  readonly waterInventoryIndex01: number;
  readonly surfaceLiquidWaterCoverageFraction01: number | null;
  readonly surfaceIceCoverageFraction01: number | null;
  readonly waterVaporFraction01: number | null;
  readonly retainedAtmosphericWaterVaporMoleFraction01: number;
  readonly meanSurfaceTemperatureKelvin: number | null;
  readonly climateStabilityIndex01: number | null;
  readonly retainedSurfacePressurePascal: number | null;
  readonly geologicalActivityIndex01: number | null;
  readonly volcanismIndex01: number | null;
  readonly surfaceWaterRegime: string;
  readonly volcanismRegime: string;
}

/**
 * Point-25.3 read-only surface handoff from phase-20 environment Ground Truth.
 *
 * Fields prefixed with `presentation` are deliberately derived visual coverage
 * proxies, never new physical state. Direct 20.7/20.8 values are carried
 * separately so the renderer remains auditable and cannot write presentation
 * guesses back into the domain.
 */
export interface SystemScenePlanetSurfacePresentationSnapshot {
  readonly source: 'PHASE_20_SURFACE_ENVIRONMENT';
  readonly solidSurfaceAvailable: boolean;

  readonly waterInventoryIndex01: number;
  readonly surfaceLiquidWaterCoverageFraction01: number | null;
  readonly surfaceIceCoverageFraction01: number | null;
  readonly waterVaporFraction01: number | null;
  readonly retainedAtmosphericWaterVaporMoleFraction01: number;
  readonly meanSurfaceTemperatureKelvin: number | null;
  readonly climateStabilityIndex01: number | null;
  readonly retainedSurfacePressurePascal: number | null;
  readonly geologicalActivityIndex01: number | null;
  readonly volcanismIndex01: number | null;
  readonly surfaceWaterRegime: string;
  readonly volcanismRegime: string;

  readonly exposedLandCoverageFraction01: number | null;
  readonly presentationDesertCoverageFraction01: number | null;
  readonly presentationVolcanicCoverageFraction01: number | null;
  readonly presentationCloudCoverageFraction01: number | null;
}

export function buildSystemScenePlanetSurfacePresentationV1(
  input: SystemScenePlanetSurfacePresentationInput,
): SystemScenePlanetSurfacePresentationSnapshot {
  assertIndex01(input.waterInventoryIndex01, 'waterInventoryIndex01');
  assertNullableIndex01(
    input.surfaceLiquidWaterCoverageFraction01,
    'surfaceLiquidWaterCoverageFraction01',
  );
  assertNullableIndex01(
    input.surfaceIceCoverageFraction01,
    'surfaceIceCoverageFraction01',
  );
  assertNullableIndex01(input.waterVaporFraction01, 'waterVaporFraction01');
  assertIndex01(
    input.retainedAtmosphericWaterVaporMoleFraction01,
    'retainedAtmosphericWaterVaporMoleFraction01',
  );
  assertNullableIndex01(input.climateStabilityIndex01, 'climateStabilityIndex01');
  assertNullableIndex01(input.geologicalActivityIndex01, 'geologicalActivityIndex01');
  assertNullableIndex01(input.volcanismIndex01, 'volcanismIndex01');
  assertNullablePositiveFinite(
    input.retainedSurfacePressurePascal,
    'retainedSurfacePressurePascal',
  );
  assertNullablePositiveFinite(
    input.meanSurfaceTemperatureKelvin,
    'meanSurfaceTemperatureKelvin',
  );

  const liquid = input.surfaceLiquidWaterCoverageFraction01;
  const ice = input.surfaceIceCoverageFraction01;
  const solidSurfaceAvailable = liquid !== null && ice !== null;

  if (!solidSurfaceAvailable) {
    if (liquid !== null || ice !== null) {
      throw new RangeError(
        'Point-25.3 requires liquid/ice surface coverages to be both null or both defined.',
      );
    }

    return Object.freeze({
      source: 'PHASE_20_SURFACE_ENVIRONMENT' as const,
      solidSurfaceAvailable: false,
      waterInventoryIndex01: input.waterInventoryIndex01,
      surfaceLiquidWaterCoverageFraction01: liquid,
      surfaceIceCoverageFraction01: ice,
      waterVaporFraction01: input.waterVaporFraction01,
      retainedAtmosphericWaterVaporMoleFraction01:
        input.retainedAtmosphericWaterVaporMoleFraction01,
      meanSurfaceTemperatureKelvin: input.meanSurfaceTemperatureKelvin,
      climateStabilityIndex01: input.climateStabilityIndex01,
      retainedSurfacePressurePascal: input.retainedSurfacePressurePascal,
      geologicalActivityIndex01: input.geologicalActivityIndex01,
      volcanismIndex01: input.volcanismIndex01,
      surfaceWaterRegime: input.surfaceWaterRegime,
      volcanismRegime: input.volcanismRegime,
      exposedLandCoverageFraction01: null,
      presentationDesertCoverageFraction01: null,
      presentationVolcanicCoverageFraction01: null,
      presentationCloudCoverageFraction01: null,
    });
  }

  if (liquid! + ice! > 1 + 1e-9) {
    throw new RangeError(
      'Point-25.3 surface liquid-water and ice coverage cannot exceed the full surface.',
    );
  }

  const exposedLandCoverageFraction01 = clamp01(1 - liquid! - ice!);
  const heatIndex01 = temperatureHeatIndex01(input.meanSurfaceTemperatureKelvin);
  const drynessIndex01 = clamp01(
    0.58 * (1 - input.waterInventoryIndex01) +
      0.24 * (1 - liquid!) +
      0.18 * heatIndex01,
  );
  const presentationDesertCoverageFraction01 =
    exposedLandCoverageFraction01 *
    clamp01(
      drynessIndex01 * 0.90 -
        ice! * 0.18,
    );

  const volcanismIndex01 = input.volcanismIndex01 ?? 0;
  const geologicalActivityIndex01 = input.geologicalActivityIndex01 ?? 0;
  const presentationVolcanicCoverageFraction01 =
    exposedLandCoverageFraction01 *
    clamp01(
      0.012 +
        0.12 * volcanismIndex01 +
        0.035 * geologicalActivityIndex01,
    );

  const pressureSupport01 = atmosphericPressureSupport01(
    input.retainedSurfacePressurePascal,
  );
  const vapor01 = input.retainedAtmosphericWaterVaporMoleFraction01;
  const stability01 = input.climateStabilityIndex01 ?? 0.5;
  const presentationCloudCoverageFraction01 =
    pressureSupport01 <= 0
      ? 0
      : clamp01(
          pressureSupport01 *
          (
            0.03 +
            0.38 * vapor01 +
            0.18 * input.waterInventoryIndex01 +
            0.28 * liquid! +
            0.08 * stability01
          ),
        );

  return Object.freeze({
    source: 'PHASE_20_SURFACE_ENVIRONMENT' as const,
    solidSurfaceAvailable: true,
    waterInventoryIndex01: input.waterInventoryIndex01,
    surfaceLiquidWaterCoverageFraction01: liquid,
    surfaceIceCoverageFraction01: ice,
    waterVaporFraction01: input.waterVaporFraction01,
    retainedAtmosphericWaterVaporMoleFraction01:
      input.retainedAtmosphericWaterVaporMoleFraction01,
    meanSurfaceTemperatureKelvin: input.meanSurfaceTemperatureKelvin,
    climateStabilityIndex01: input.climateStabilityIndex01,
    retainedSurfacePressurePascal: input.retainedSurfacePressurePascal,
    geologicalActivityIndex01: input.geologicalActivityIndex01,
    volcanismIndex01: input.volcanismIndex01,
    surfaceWaterRegime: input.surfaceWaterRegime,
    volcanismRegime: input.volcanismRegime,
    exposedLandCoverageFraction01,
    presentationDesertCoverageFraction01,
    presentationVolcanicCoverageFraction01,
    presentationCloudCoverageFraction01,
  });
}

function temperatureHeatIndex01(
  kelvin: number | null,
): number {
  if (kelvin === null) {
    return 0.5;
  }

  return clamp01((kelvin - 265) / 75);
}

function atmosphericPressureSupport01(
  pressurePascal: number | null,
): number {
  if (pressurePascal === null || pressurePascal <= 0) {
    return 0;
  }

  return clamp01(pressurePascal / (pressurePascal + 25_000));
}

function assertIndex01(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${label} must be finite in [0, 1].`);
  }
}

function assertNullableIndex01(
  value: number | null,
  label: string,
): void {
  if (value !== null) {
    assertIndex01(value, label);
  }
}

function assertNullablePositiveFinite(
  value: number | null,
  label: string,
): void {
  if (value !== null && (!Number.isFinite(value) || value < 0)) {
    throw new RangeError(`${label} must be null or finite and non-negative.`);
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
