/**
 * 29.1E-H4b — deterministic, read-only sensitivity reconstruction.
 *
 * A star's mass and terminal age do NOT determine its time-resolved RGB/AGB
 * irradiation, XUV spectrum, wind history, maximum radius or a planet's
 * atmospheric escape efficiency. Consequently this is a PARAMETRIC EXPOSURE
 * EXPERIMENT, not a new present-day Ground Truth atmospheric generator.
 *
 * Physical relationship used for the sensitivity calculation:
 *   delta(p) = epsilon_eff * integral(F_bol dt) / (4 * R_planet).
 * This follows the ideal, energy-limited escape expression with a fixed
 * radius/mass, provided epsilon_eff jointly represents XUV fraction, heating
 * efficiency and atmospheric escape coupling. epsilon_eff is UNKNOWN.
 *
 * Representative giant luminosities/durations below are transparent GENESIS
 * assumptions, NOT calibrated stellar evolutionary tracks. Results must
 * never be reported as physical upper bounds for actual multihost atmospheres:
 * winds, shielding, engulfment, chemistry, resupply, orbital changes and
 * irradiation from companions have not been reconstructed.
 */
const GYR_SECONDS = 365.25 * 86400 * 1e9;
const SOLAR_LUMINOSITY_W = 3.828e26;
const AU_METERS = 1.495978707e11;
const EARTH_RADIUS_METERS = 6371000;
const FOUR_PI = 4 * Math.PI;
const WD_YOUNG_COOLING_CUTOFF_GYR = 0.02;
const WD_MESTEL_EXPONENT = 1.4;

/** Sensitivity parameters, not empirical XUV efficiencies or probabilities. */
export const H4B_EFFECTIVE_ESCAPE_COUPLING_EXPERIMENTS = Object.freeze([
  0, 1e-10, 1e-8, 1e-6, 1e-5,
] as const);

export type PostAgbHistoryStageName = 'RGB' | 'AGB' | 'WD_COOLING_RESOLVED_WINDOW';

export interface PostAgbHistoryStage {
  readonly stage: PostAgbHistoryStageName;
  readonly representativeDurationBillionYears: number;
  readonly representativeLuminositySolar: number | null;
  readonly bolometricFluenceMinimumJoulePerSquareMeter: number;
  readonly bolometricFluenceMaximumJoulePerSquareMeter: number;
}

export interface PostAgbEscapeSensitivity {
  readonly effectiveBolometricToEscapeCoupling01: number;
  /** Minimal / maximal cumulative loss for this SPECIFIED exposure scenario. */
  readonly afterRgbGasInventoryPressureRangePascal: readonly [number, number];
  readonly afterAgbGasInventoryPressureRangePascal: readonly [number, number];
  readonly afterWdCoolingGasInventoryPressureRangePascal: readonly [number, number];
  /** Additional independent H4 cryogenic ceiling; gas ratios are NOT inferred. */
  readonly afterH4CryocondensationCeilingRangePascal: readonly [number, number];
}

export interface WhiteDwarfPostAgbAtmosphereHistory {
  readonly kind: 'PARAMETRIC_RGB_AGB_WD_EXPOSURE_SENSITIVITY_V1';
  readonly initialStellarMassSolar: number;
  readonly whiteDwarfMassSolar: number;
  readonly stellarMassLostSolar: number;
  readonly formationSemiMajorAxisAu: number;
  readonly hypotheticalPostAgbSemiMajorAxisAu: number;
  readonly progenitorTerminalAgeBillionYears: number;
  readonly postMainSequenceDurationBillionYears: number;
  readonly coolingAgeBillionYears: number;
  readonly stages: readonly PostAgbHistoryStage[];
  readonly scenarios: readonly PostAgbEscapeSensitivity[];
  readonly minimumBolometricFluenceJoulePerSquareMeter: number;
  readonly maximumBolometricFluenceJoulePerSquareMeter: number;
  /** Effective coupling required to exhaust the initial gaseous INVENTORY. */
  readonly completeLossCouplingThresholdRange01: readonly [number, number];
  readonly missingEarlyWdCoolingExposure: true;
  readonly rgbAgbLuminosityTrackAssumedNotResolved: true;
  readonly stellarWindAndXuvSpectrumUnresolved: true;
  readonly planetaryEngulfmentUnresolved: true;
  readonly volatileResupplyUnresolved: true;
  readonly companionIrradiationUnresolved: boolean;
  readonly presentAtmosphereUnresolved: true;
}

export interface WhiteDwarfPostAgbAtmosphereHistoryInput {
  readonly isWhiteDwarf: boolean;
  readonly postAgbOrbitHypothesisAvailable: boolean;
  readonly initialStellarMassSolar: number | null;
  readonly currentWhiteDwarfMassSolar: number | null;
  readonly progenitorTerminalAgeBillionYears: number | null;
  readonly postMainSequenceDurationBillionYears: number | null;
  readonly coolingAgeBillionYears: number | null;
  readonly presentWhiteDwarfLuminositySolar: number | null;
  readonly formationSemiMajorAxisAu: number | null;
  readonly hypotheticalPostAgbSemiMajorAxisAu: number | null;
  readonly planetRadiusEarth: number;
  readonly referenceAtmospherePressurePascal: number | null;
  readonly h4WdOnlyGasPressureCeilingPascal: number | null;
  readonly companionIrradiationUnresolved: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function finitePositive(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}

/** Time-integrated F_bol, not F_XUV or energy actually deposited into escape. */
function constantFluence(luminositySolar: number, durationGyr: number, distanceAu: number): number {
  return luminositySolar * SOLAR_LUMINOSITY_W * durationGyr * GYR_SECONDS /
    (FOUR_PI * (AU_METERS * distanceAu) ** 2);
}

/** Bounded H1 Mestel-inspired cooling integral, starting at 20 Myr.
 * Excludes the younger and potentially much brighter WD cooling epoch. */
function coolingFluence(
  luminosityAtCurrentAgeSolar: number, currentAgeGyr: number, axisAu: number,
): number {
  const exponentIntegral = (
    Math.pow(WD_YOUNG_COOLING_CUTOFF_GYR, 1 - WD_MESTEL_EXPONENT) -
    Math.pow(currentAgeGyr, 1 - WD_MESTEL_EXPONENT)
  ) / (WD_MESTEL_EXPONENT - 1);
  const solarLuminosityGyrIntegral =
    luminosityAtCurrentAgeSolar * Math.pow(currentAgeGyr, WD_MESTEL_EXPONENT) *
    exponentIntegral;
  return constantFluence(solarLuminosityGyrIntegral, 1, axisAu);
}

function pressureAfterFluence(
  initialPressure: number, fluence: number, effectiveCoupling: number, radiusMeters: number,
): number {
  return clamp(initialPressure - effectiveCoupling * fluence / (4 * radiusMeters), 0, initialPressure);
}

function stage(
  name: PostAgbHistoryStageName,
  durationGyr: number,
  luminositySolar: number | null,
  lower: number,
  upper: number,
): PostAgbHistoryStage {
  return Object.freeze({
    stage: name,
    representativeDurationBillionYears: durationGyr,
    representativeLuminositySolar: luminositySolar,
    bolometricFluenceMinimumJoulePerSquareMeter: lower,
    bolometricFluenceMaximumJoulePerSquareMeter: upper,
  });
}

export function projectWhiteDwarfPostAgbAtmosphereHistory(
  input: WhiteDwarfPostAgbAtmosphereHistoryInput,
): WhiteDwarfPostAgbAtmosphereHistory | null {
  if (!input.isWhiteDwarf || !input.postAgbOrbitHypothesisAvailable) return null;
  const m0 = input.initialStellarMassSolar;
  const mf = input.currentWhiteDwarfMassSolar;
  const terminal = input.progenitorTerminalAgeBillionYears;
  const cooling = input.coolingAgeBillionYears;
  const postMainSequence = input.postMainSequenceDurationBillionYears;
  const luminosity = input.presentWhiteDwarfLuminositySolar;
  const a0 = input.formationSemiMajorAxisAu;
  const af = input.hypotheticalPostAgbSemiMajorAxisAu;
  const pressure = input.referenceAtmospherePressurePascal;
  const h4Ceiling = input.h4WdOnlyGasPressureCeilingPascal;
  const radius = input.planetRadiusEarth;

  if (!finitePositive(m0) || !finitePositive(mf) || !finitePositive(terminal) || !finitePositive(postMainSequence) ||
      !finitePositive(cooling) || !finitePositive(luminosity) ||
      !finitePositive(a0) || !finitePositive(af) ||
      !Number.isFinite(radius) || radius <= 0 ||
      pressure === null || !Number.isFinite(pressure) || pressure < 0 ||
      h4Ceiling === null || !Number.isFinite(h4Ceiling) || h4Ceiling < 0 ||
      h4Ceiling > pressure + 1e-8 ||
      m0 <= mf || m0 < 0.7 || m0 > 8 ||
      mf < 0.3 || mf > 1.35 ||
      af < a0 || cooling < WD_YOUNG_COOLING_CUTOFF_GYR || cooling > 13 ||
      terminal > 14 || postMainSequence >= terminal) return null;

  // Reuse the EXISTING phase-14 post-main-sequence lifetime and RGB/AGB
  // partition (the same initial-mass 2.2 solar threshold as StellarEvolutionEngine).
  // Only the luminosities below are assumed, not the phase durations.
  const redGiantFraction = m0 <= 2.2 ? 0.72 : 0.48;
  const rgbGyr = postMainSequence * redGiantFraction;
  const agbGyr = postMainSequence * (1 - redGiantFraction);
  const rgbLum = clamp(250 * Math.sqrt(m0), 120, 1500);
  const agbLum = clamp(3200 * Math.sqrt(m0), 1000, 12000);
  const rgbMin = constantFluence(rgbLum, rgbGyr, af);
  const rgbMax = constantFluence(rgbLum, rgbGyr, a0);
  const agbMin = constantFluence(agbLum, agbGyr, af);
  const agbMax = constantFluence(agbLum, agbGyr, a0);
  const wdFluence = coolingFluence(luminosity, cooling, af);
  const minFluence = rgbMin + agbMin + wdFluence;
  const maxFluence = rgbMax + agbMax + wdFluence;
  if (![rgbMin, rgbMax, agbMin, agbMax, wdFluence, minFluence, maxFluence].every(
    value => Number.isFinite(value) && value >= 0)) return null;

  const radiusMeters = radius * EARTH_RADIUS_METERS;
  const scenarios = Object.freeze(H4B_EFFECTIVE_ESCAPE_COUPLING_EXPERIMENTS.map(coupling => {
    const after = (minExposure: number, maxExposure: number): readonly [number, number] =>
      Object.freeze([
        pressureAfterFluence(pressure, maxExposure, coupling, radiusMeters),
        pressureAfterFluence(pressure, minExposure, coupling, radiusMeters),
      ] as const);
    const afterRgb = after(rgbMin, rgbMax);
    const afterAgb = after(rgbMin + agbMin, rgbMax + agbMax);
    const afterWd = after(minFluence, maxFluence);
    return Object.freeze({
      effectiveBolometricToEscapeCoupling01: coupling,
      afterRgbGasInventoryPressureRangePascal: afterRgb,
      afterAgbGasInventoryPressureRangePascal: afterAgb,
      afterWdCoolingGasInventoryPressureRangePascal: afterWd,
      afterH4CryocondensationCeilingRangePascal: Object.freeze([
        Math.min(afterWd[0], h4Ceiling),
        Math.min(afterWd[1], h4Ceiling),
      ] as const),
    });
  }));
  const threshold = Object.freeze([
    4 * radiusMeters * pressure / maxFluence,
    4 * radiusMeters * pressure / minFluence,
  ] as const);
  return Object.freeze({
    kind: 'PARAMETRIC_RGB_AGB_WD_EXPOSURE_SENSITIVITY_V1' as const,
    initialStellarMassSolar: m0,
    whiteDwarfMassSolar: mf,
    stellarMassLostSolar: m0 - mf,
    formationSemiMajorAxisAu: a0,
    hypotheticalPostAgbSemiMajorAxisAu: af,
    progenitorTerminalAgeBillionYears: terminal,
    postMainSequenceDurationBillionYears: postMainSequence,
    coolingAgeBillionYears: cooling,
    stages: Object.freeze([
      stage('RGB', rgbGyr, rgbLum, rgbMin, rgbMax),
      stage('AGB', agbGyr, agbLum, agbMin, agbMax),
      stage('WD_COOLING_RESOLVED_WINDOW',
        cooling - WD_YOUNG_COOLING_CUTOFF_GYR, null, wdFluence, wdFluence),
    ]),
    scenarios,
    minimumBolometricFluenceJoulePerSquareMeter: minFluence,
    maximumBolometricFluenceJoulePerSquareMeter: maxFluence,
    completeLossCouplingThresholdRange01: threshold,
    missingEarlyWdCoolingExposure: true as const,
    rgbAgbLuminosityTrackAssumedNotResolved: true as const,
    stellarWindAndXuvSpectrumUnresolved: true as const,
    planetaryEngulfmentUnresolved: true as const,
    volatileResupplyUnresolved: true as const,
    companionIrradiationUnresolved: input.companionIrradiationUnresolved,
    presentAtmosphereUnresolved: true as const,
  });
}
