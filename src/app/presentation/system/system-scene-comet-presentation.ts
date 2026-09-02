export type SystemSceneCometPeriodRegimeV1 =
  | 'SHORT_PERIOD'
  | 'LONG_PERIOD';

export type SystemSceneCometActivityRegimeV1 =
  | 'DORMANT'
  | 'WEAK'
  | 'MODERATE'
  | 'STRONG'
  | 'EXTREME';

export interface SystemSceneCometPresentationInputV1 {
  readonly proceduralId: string;
  readonly diameterKilometers: number;
  readonly iceFraction01: number;
  readonly dustFraction01: number;
  readonly porosityIndex01: number;
  readonly bulkDensityGramsPerCubicCentimeter: number;
  readonly geometricAlbedo01: number;
  readonly volatileRichnessIndex01: number;
  readonly periodRegime: SystemSceneCometPeriodRegimeV1;
  readonly referenceLuminositySolar: number;
  readonly semiMajorAxisAu: number;
  readonly eccentricity: number;
  readonly periapsisAu: number;
  readonly apoapsisAu: number;
  readonly orbitalPeriodYears: number;
  readonly epochMeanAnomalyDegrees: number;
  readonly presentationTimeScale: number;
}

export interface SystemSceneCometPresentationV1 {
  readonly version: 1;
  readonly source: 'PHASE_22_6_COMET_ACTIVITY';
  readonly proceduralId: string;
  readonly sourceDiameterKilometers: number;
  readonly iceFraction01: number;
  readonly dustFraction01: number;
  readonly porosityIndex01: number;
  readonly bulkDensityGramsPerCubicCentimeter: number;
  readonly geometricAlbedo01: number;
  readonly volatileRichnessIndex01: number;
  readonly periodRegime: SystemSceneCometPeriodRegimeV1;
  readonly referenceLuminositySolar: number;
  readonly semiMajorAxisAu: number;
  readonly eccentricity: number;
  readonly periapsisAu: number;
  readonly apoapsisAu: number;
  readonly orbitalPeriodYears: number;
  readonly epochMeanAnomalyDegrees: number;
  readonly presentationTimeScale: number;
  readonly shapeSeedUint32: number;
  readonly presentationNucleusColorHex: string;
  readonly presentationComaColorHex: string;
  readonly presentationDustTailColorHex: string;
  readonly presentationIonTailColorHex: string;
  readonly presentationNucleusRoughness01: number;
  readonly presentationNucleusAxisScaleX: number;
  readonly presentationNucleusAxisScaleY: number;
  readonly presentationNucleusAxisScaleZ: number;
  readonly presentationNucleusIrregularity01: number;
}

export interface SystemSceneCometActivityPresentationV1 {
  readonly sourceDistanceAu: number;
  readonly solarEquivalentDistanceAu: number;
  readonly incidentFluxEarth: number;
  readonly equilibriumTemperatureKelvin: number;
  readonly waterIceActivitySupportIndex01: number;
  readonly supervolatileActivitySupportIndex01: number;
  readonly activityIndex01: number;
  readonly activityRegime: SystemSceneCometActivityRegimeV1;
  readonly hasComa: boolean;
  readonly hasDustTail: boolean;
  readonly hasIonTail: boolean;
  readonly presentationComaRadiusScale: number;
  readonly presentationComaOpacity01: number;
  readonly presentationDustTailLengthRadii: number;
  readonly presentationDustTailWidthRadii: number;
  readonly presentationDustTailOpacity01: number;
  readonly presentationIonTailLengthRadii: number;
  readonly presentationIonTailWidthRadii: number;
  readonly presentationIonTailOpacity01: number;
  readonly presentationComaRadiusScene: number;
  readonly presentationDustTailLengthScene: number;
  readonly presentationDustTailWidthScene: number;
  readonly presentationIonTailLengthScene: number;
  readonly presentationIonTailWidthScene: number;
}

export const SYSTEM_SCENE_COMET_PRESENTATION_VERSION = 1 as const;

const EQUILIBRIUM_TEMPERATURE_REFERENCE_KELVIN = 278.33;
const DAYS_PER_YEAR = 365.25;
const TWO_PI = Math.PI * 2;

interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/**
 * Point-25.8 immutable bridge from the frozen point-22.5/22.6 comet nucleus and
 * orbit into renderer presentation parameters. No new domain seed or PRNG draw
 * is introduced; all static shape/color variation hashes the stable procedural
 * id and all dynamic activity is a read-only projection of the frozen 22.6 law.
 */
export function buildSystemSceneCometPresentationV1(
  input: SystemSceneCometPresentationInputV1,
): SystemSceneCometPresentationV1 {
  validateInput(input);

  const shapeSeedUint32 =
    systemSceneCometPresentationSeed(input.proceduralId);
  const irregularity = clamp(
    0.34 +
      input.porosityIndex01 * 0.38 +
      (seedUnit(shapeSeedUint32, 3) - 0.5) * 0.12,
    0.28,
    0.78,
  );
  const elongation = 0.11 + irregularity * 0.24;
  const rawAxes = [
    1 + (seedUnit(shapeSeedUint32, 5) - 0.5) * elongation * 2,
    1 + (seedUnit(shapeSeedUint32, 7) - 0.5) * elongation * 2,
    1 + (seedUnit(shapeSeedUint32, 11) - 0.5) * elongation * 2,
  ] as const;
  const averageAxis = (rawAxes[0] + rawAxes[1] + rawAxes[2]) / 3;

  const albedoLift = clamp(
    0.74 + Math.sqrt(input.geometricAlbedo01) * 0.72,
    0.76,
    1.08,
  );
  const nucleusBase = mixRgb(
    rgb(49, 43, 38),
    rgb(91, 99, 102),
    input.iceFraction01 * 0.36,
  );
  const nucleusColor = multiplyRgb(
    nucleusBase,
    albedoLift * (0.92 + seedUnit(shapeSeedUint32, 13) * 0.12),
  );
  const comaColor = mixRgb(
    rgb(216, 235, 224),
    rgb(154, 225, 241),
    clamp01(0.32 + input.iceFraction01 * 0.48),
  );
  const dustTailColor = mixRgb(
    rgb(207, 184, 143),
    rgb(237, 218, 176),
    input.dustFraction01,
  );
  const ionTailColor = mixRgb(
    rgb(116, 190, 245),
    rgb(155, 226, 255),
    input.volatileRichnessIndex01,
  );

  return Object.freeze({
    version: SYSTEM_SCENE_COMET_PRESENTATION_VERSION,
    source: 'PHASE_22_6_COMET_ACTIVITY' as const,
    proceduralId: input.proceduralId,
    sourceDiameterKilometers: input.diameterKilometers,
    iceFraction01: input.iceFraction01,
    dustFraction01: input.dustFraction01,
    porosityIndex01: input.porosityIndex01,
    bulkDensityGramsPerCubicCentimeter:
      input.bulkDensityGramsPerCubicCentimeter,
    geometricAlbedo01: input.geometricAlbedo01,
    volatileRichnessIndex01: input.volatileRichnessIndex01,
    periodRegime: input.periodRegime,
    referenceLuminositySolar: input.referenceLuminositySolar,
    semiMajorAxisAu: input.semiMajorAxisAu,
    eccentricity: input.eccentricity,
    periapsisAu: input.periapsisAu,
    apoapsisAu: input.apoapsisAu,
    orbitalPeriodYears: input.orbitalPeriodYears,
    epochMeanAnomalyDegrees: input.epochMeanAnomalyDegrees,
    presentationTimeScale: input.presentationTimeScale,
    shapeSeedUint32,
    presentationNucleusColorHex: rgbToHex(nucleusColor),
    presentationComaColorHex: rgbToHex(comaColor),
    presentationDustTailColorHex: rgbToHex(dustTailColor),
    presentationIonTailColorHex: rgbToHex(ionTailColor),
    presentationNucleusRoughness01: clamp(
      0.90 + input.porosityIndex01 * 0.08 - input.iceFraction01 * 0.05,
      0.80,
      0.98,
    ),
    presentationNucleusAxisScaleX: rawAxes[0] / averageAxis,
    presentationNucleusAxisScaleY: rawAxes[1] / averageAxis,
    presentationNucleusAxisScaleZ: rawAxes[2] / averageAxis,
    presentationNucleusIrregularity01: irregularity,
  });
}

/**
 * Evaluates the exact point-22.6 normalized activity law at the orbital
 * distance represented by the current presentation phase. The presentation
 * time scale comes from 24.6 and only accelerates traversal of the already
 * frozen physical orbit; it does not mutate orbital elements or game time.
 */
export function systemSceneCometActivityAtSimulationDayV1(
  comet: SystemSceneCometPresentationV1,
  simulationDay: number,
  radiusScene = 1,
): SystemSceneCometActivityPresentationV1 {
  if (!Number.isFinite(simulationDay)) {
    throw new RangeError('Comet presentation simulationDay must be finite.');
  }

  const sourceDistanceAu =
    systemSceneCometOrbitalDistanceAuV1({
      semiMajorAxisAu: comet.semiMajorAxisAu,
      eccentricity: comet.eccentricity,
      periodDays: comet.orbitalPeriodYears * DAYS_PER_YEAR,
      epochMeanAnomalyDegrees: comet.epochMeanAnomalyDegrees,
      simulationDay: simulationDay * comet.presentationTimeScale,
    });

  return systemSceneCometActivityAtDistanceV1(
    comet,
    sourceDistanceAu,
    radiusScene,
  );
}

export function systemSceneCometActivityAtDistanceV1(
  comet: SystemSceneCometPresentationV1,
  sourceDistanceAu: number,
  radiusScene: number,
): SystemSceneCometActivityPresentationV1 {
  if (
    !Number.isFinite(sourceDistanceAu) ||
    sourceDistanceAu <= 0 ||
    sourceDistanceAu < comet.periapsisAu - 1e-8 ||
    sourceDistanceAu > comet.apoapsisAu + 1e-8
  ) {
    throw new RangeError('Comet activity distance must lie on the frozen point-22.6 orbit.');
  }
  if (!Number.isFinite(radiusScene) || radiusScene <= 0) {
    throw new RangeError('Comet presentation radiusScene must be positive and finite.');
  }

  const boundedDistanceAu = clamp(
    sourceDistanceAu,
    comet.periapsisAu,
    comet.apoapsisAu,
  );
  const incidentFluxEarth =
    comet.referenceLuminositySolar / boundedDistanceAu ** 2;
    comet.referenceLuminositySolar / sourceDistanceAu ** 2;
  const solarEquivalentDistanceAu =
    boundedDistanceAu / Math.sqrt(comet.referenceLuminositySolar);
  const waterIceActivitySupportIndex01 =
    waterIceActivitySupportV1(solarEquivalentDistanceAu);
  const supervolatileActivitySupportIndex01 =
    supervolatileActivitySupportV1(solarEquivalentDistanceAu);
  const diameterSupport =
    0.72 +
    0.28 * clamp01(
      Math.log1p(comet.sourceDiameterKilometers) /
        Math.log1p(50),
    );
  const activityIndex01 = clamp01(
    comet.volatileRichnessIndex01 *
      diameterSupport *
      (
        0.70 * waterIceActivitySupportIndex01 +
        0.30 * supervolatileActivitySupportIndex01
      ),
  );
  const equilibriumTemperatureKelvin =
    EQUILIBRIUM_TEMPERATURE_REFERENCE_KELVIN *
    (
      incidentFluxEarth *
      (1 - comet.geometricAlbedo01)
    ) ** 0.25;
  const activityRegime =
    cometActivityRegimeV1(activityIndex01);
  const hasComa = activityIndex01 >= 0.04;
  const hasDustTail = activityIndex01 >= 0.12;
  const hasIonTail = activityIndex01 >= 0.28;
  const active01 = clamp01(
    (activityIndex01 - 0.04) / 0.96,
  );

  return Object.freeze({
    sourceDistanceAu: boundedDistanceAu,
    solarEquivalentDistanceAu,
    incidentFluxEarth,
    equilibriumTemperatureKelvin,
    waterIceActivitySupportIndex01,
    supervolatileActivitySupportIndex01,
    activityIndex01,
    activityRegime,
    hasComa,
    hasDustTail,
    hasIonTail,
    presentationComaRadiusScale:
      hasComa
        ? 1.65 + Math.sqrt(active01) * 5.10
        : 1,
    presentationComaOpacity01:
      hasComa
        ? clamp(0.08 + activityIndex01 * 0.28, 0.08, 0.34)
        : 0,
    presentationDustTailLengthRadii:
      hasDustTail
        ? 8 + 32 * Math.sqrt(activityIndex01)
        : 0,
    presentationDustTailWidthRadii:
      hasDustTail
        ? 1.25 + 2.25 * activityIndex01
        : 0,
    presentationDustTailOpacity01:
      hasDustTail
        ? clamp(0.06 + activityIndex01 * 0.22, 0.06, 0.26)
        : 0,
    presentationIonTailLengthRadii:
      hasIonTail
        ? 12 + 44 * Math.sqrt(activityIndex01)
        : 0,
    presentationIonTailWidthRadii:
      hasIonTail
        ? 0.42 + 0.66 * activityIndex01
        : 0,
    presentationIonTailOpacity01:
      hasIonTail
        ? clamp(0.08 + activityIndex01 * 0.28, 0.08, 0.32)
        : 0,
    presentationComaRadiusScene:
      radiusScene *
      (hasComa ? 1.65 + Math.sqrt(active01) * 5.10 : 1),
    presentationDustTailLengthScene:
      radiusScene *
      (hasDustTail ? 8 + 32 * Math.sqrt(activityIndex01) : 0),
    presentationDustTailWidthScene:
      radiusScene *
      (hasDustTail ? 1.25 + 2.25 * activityIndex01 : 0),
    presentationIonTailLengthScene:
      radiusScene *
      (hasIonTail ? 12 + 44 * Math.sqrt(activityIndex01) : 0),
    presentationIonTailWidthScene:
      radiusScene *
      (hasIonTail ? 0.42 + 0.66 * activityIndex01 : 0),
  });
}

export function systemSceneCometOrbitalDistanceAuV1(
  input: {
    readonly semiMajorAxisAu: number;
    readonly eccentricity: number;
    readonly periodDays: number;
    readonly epochMeanAnomalyDegrees: number;
    readonly simulationDay: number;
  },
): number {
  if (
    !Number.isFinite(input.semiMajorAxisAu) ||
    input.semiMajorAxisAu <= 0 ||
    !Number.isFinite(input.eccentricity) ||
    input.eccentricity < 0 ||
    input.eccentricity >= 1 ||
    !Number.isFinite(input.periodDays) ||
    input.periodDays <= 0 ||
    !Number.isFinite(input.epochMeanAnomalyDegrees) ||
    !Number.isFinite(input.simulationDay)
  ) {
    throw new RangeError('Comet orbital-distance projection requires finite elliptic motion inputs.');
  }

  const meanAnomalyRadians = normalizeRadians(
    input.epochMeanAnomalyDegrees * Math.PI / 180 +
      TWO_PI * input.simulationDay / input.periodDays,
  );
  const eccentricAnomaly = solveEccentricAnomaly(
    meanAnomalyRadians,
    input.eccentricity,
  );
  return input.semiMajorAxisAu *
    (1 - input.eccentricity * Math.cos(eccentricAnomaly));
}

export function systemSceneCometPresentationSeed(
  proceduralId: string,
): number {
  const normalized = proceduralId.trim();
  if (normalized.length === 0) {
    throw new RangeError('Comet proceduralId must not be blank.');
  }

  const key = `${normalized}|GENESIS-25.8-COMET-V1`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function solveEccentricAnomaly(
  meanAnomalyRadians: number,
  eccentricity: number,
): number {
  let eccentricAnomaly =
    eccentricity < 0.8
      ? meanAnomalyRadians
      : Math.PI;

  for (let iteration = 0; iteration < 12; iteration += 1) {
    const delta =
      (
        eccentricAnomaly -
        eccentricity * Math.sin(eccentricAnomaly) -
        meanAnomalyRadians
      ) /
      (1 - eccentricity * Math.cos(eccentricAnomaly));
    eccentricAnomaly -= delta;
    if (Math.abs(delta) < 1e-12) {
      break;
    }
  }

  return eccentricAnomaly;
}

function cometActivityRegimeV1(
  activityIndex01: number,
): SystemSceneCometActivityRegimeV1 {
  if (activityIndex01 < 0.04) {
    return 'DORMANT';
  }
  if (activityIndex01 < 0.15) {
    return 'WEAK';
  }
  if (activityIndex01 < 0.35) {
    return 'MODERATE';
  }
  if (activityIndex01 < 0.65) {
    return 'STRONG';
  }
  return 'EXTREME';
}

function waterIceActivitySupportV1(
  solarEquivalentDistanceAu: number,
): number {
  if (solarEquivalentDistanceAu <= 1.5) {
    return 1;
  }
  if (solarEquivalentDistanceAu >= 4.5) {
    return 0;
  }
  return clamp01((4.5 - solarEquivalentDistanceAu) / 3);
}

function supervolatileActivitySupportV1(
  solarEquivalentDistanceAu: number,
): number {
  if (solarEquivalentDistanceAu <= 3) {
    return 1;
  }
  if (solarEquivalentDistanceAu >= 25) {
    return 0;
  }
  return clamp01((25 - solarEquivalentDistanceAu) / 22);
}

function validateInput(
  input: SystemSceneCometPresentationInputV1,
): void {
  systemSceneCometPresentationSeed(input.proceduralId);

  for (const [name, value] of [
    ['diameterKilometers', input.diameterKilometers],
    ['bulkDensityGramsPerCubicCentimeter', input.bulkDensityGramsPerCubicCentimeter],
    ['referenceLuminositySolar', input.referenceLuminositySolar],
    ['semiMajorAxisAu', input.semiMajorAxisAu],
    ['periapsisAu', input.periapsisAu],
    ['apoapsisAu', input.apoapsisAu],
    ['orbitalPeriodYears', input.orbitalPeriodYears],
    ['presentationTimeScale', input.presentationTimeScale],
  ] as const) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} must be positive and finite.`);
    }
  }

  for (const [name, value] of [
    ['iceFraction01', input.iceFraction01],
    ['dustFraction01', input.dustFraction01],
    ['porosityIndex01', input.porosityIndex01],
    ['geometricAlbedo01', input.geometricAlbedo01],
    ['volatileRichnessIndex01', input.volatileRichnessIndex01],
  ] as const) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new RangeError(`${name} must be finite in [0, 1].`);
    }
  }

  if (Math.abs(input.iceFraction01 + input.dustFraction01 - 1) > 1e-8) {
    throw new RangeError('Comet ice/dust fractions must sum to 1.');
  }
  if (!Number.isFinite(input.eccentricity) || input.eccentricity < 0 || input.eccentricity >= 1) {
    throw new RangeError('Comet eccentricity must be finite in [0, 1).');
  }
  if (!Number.isFinite(input.epochMeanAnomalyDegrees)) {
    throw new RangeError('Comet epoch mean anomaly must be finite.');
  }
  if (input.periodRegime !== 'SHORT_PERIOD' && input.periodRegime !== 'LONG_PERIOD') {
    throw new RangeError('Comet presentation requires a known point-22.6 period regime.');
  }

  const expectedPeriapsis = input.semiMajorAxisAu * (1 - input.eccentricity);
  const expectedApoapsis = input.semiMajorAxisAu * (1 + input.eccentricity);
  if (
    !approximatelyEqual(input.periapsisAu, expectedPeriapsis) ||
    !approximatelyEqual(input.apoapsisAu, expectedApoapsis)
  ) {
    throw new RangeError('Comet presentation orbit must preserve point-22.6 apsides.');
  }
}

function normalizeRadians(value: number): number {
  const wrapped = value % TWO_PI;
  return wrapped < 0 ? wrapped + TWO_PI : wrapped;
}

function seedUnit(seed: number, salt: number): number {
  let hash = seed ^ Math.imul(salt, 0x9e3779b9);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 0xffffffff;
}

function rgb(r: number, g: number, b: number): Rgb {
  return { r, g, b };
}

function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  const amount = clamp01(t);
  return rgb(
    a.r + (b.r - a.r) * amount,
    a.g + (b.g - a.g) * amount,
    a.b + (b.b - a.b) * amount,
  );
}

function multiplyRgb(value: Rgb, factor: number): Rgb {
  return rgb(
    clamp(value.r * factor, 0, 255),
    clamp(value.g * factor, 0, 255),
    clamp(value.b * factor, 0, 255),
  );
}

function rgbToHex(value: Rgb): string {
  const component = (channel: number) =>
    Math.round(clamp(channel, 0, 255))
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  return `#${component(value.r)}${component(value.g)}${component(value.b)}`;
}

function approximatelyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-8 * Math.max(1, Math.abs(a), Math.abs(b));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
