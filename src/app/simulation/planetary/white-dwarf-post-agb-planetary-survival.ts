/**
 * 29.1E-H4c — read-only tests of envelope intersection, molecular escape
 * susceptibility and the amount of subsequent replenishment required.
 *
 * These are CONDITIONAL diagnostics, not a resolved survivor or an atmosphere
 * generator. H4b's representative RGB/AGB luminosities are not stellar tracks;
 * this module explicitly assumes cool-star effective-temperature intervals.
 * Giant radii inferred through Stefan–Boltzmann are hypothetical, not measured
 * radii or rigorous astrophysical confidence bounds. A companion, tides, rapid
 * mass loss, stellar wind, XUV evolution and the unmodelled early WD epoch can
 * all invalidate the isolated-star picture. Never write back into Ground Truth.
 */
import type { WhiteDwarfPostAgbAtmosphereHistory } from './white-dwarf-post-agb-atmosphere-history';
import type { PreAgbGasInventoryProxy } from './white-dwarf-post-agb-atmosphere-projection';

const SOLAR_EFFECTIVE_TEMPERATURE_KELVIN = 5772;
const SOLAR_RADIUS_AU = 6.957e8 / 1.495978707e11;
const EARTH_MASS_KG = 5.9722e24;
const EARTH_RADIUS_METERS = 6_371_000;
const G = 6.67430e-11;
const BOLTZMANN = 1.380649e-23;
const AVOGADRO = 6.02214076e23;
const YEAR_SECONDS = 365.25 * 86400;

// Reference ranges used only to ask WHAT IF the giant had the H4b assumed
// luminosity at these temperatures; not maximum radii from real evolution.
const GIANT_EFFECTIVE_TEMPERATURE_HYPOTHESES = Object.freeze({
  RGB: Object.freeze([3200, 4500] as const),
  AGB: Object.freeze([2500, 4000] as const),
});
const EXOBASE_TEMPERATURE_HYPOTHESES_KELVIN = Object.freeze([1000, 5000] as const);
const GAS_MOLAR_MASS_KG_PER_MOL = Object.freeze({
  HYDROGEN: 0.00201588, HELIUM: 0.004002602, NITROGEN: 0.0280134,
  OXYGEN: 0.0319988, CARBON_DIOXIDE: 0.0440095, WATER_VAPOR: 0.01801528,
  METHANE: 0.0160425, ARGON: 0.039948, SULFUR_DIOXIDE: 0.064066,
  CARBON_MONOXIDE: 0.0280101, AMMONIA: 0.01703052,
} as const);

export interface PostAgbSpeciesEscapeDiagnostic {
  readonly gas: string;
  readonly progenitorInventoryFraction01: number;
  /** Thermal Jeans parameter at 1000 K; NOT a real exobase temperature. */
  readonly jeansParameterColdExobase: number;
  /** Thermal Jeans parameter at 5000 K; ignores photochemical/nonthermal escape. */
  readonly jeansParameterHotExobase: number;
  readonly thermallyMobileUnderHotExobaseHypothesis: boolean;
}

export interface PostAgbPlanetarySurvivalAssessment {
  readonly kind: 'CONDITIONAL_RGB_AGB_SURVIVAL_AND_ESCAPE_V1';
  readonly formationPeriastronAu: number;
  readonly hypotheticalPostAgbPeriastronAu: number;
  /** Stefan–Boltzmann radii at assumed H4b luminosities/temperatures. */
  readonly rgbRadiusHypothesisAu: readonly [number, number];
  readonly agbRadiusHypothesisAu: readonly [number, number];
  readonly envelopeRadiusHypothesisAu: readonly [number, number];
  readonly directEnvelopeIntersection: 'POSSIBLE_WITH_ASSUMED_GIANT_PARAMETERS' |
    'IN_ALL_ASSUMED_GIANT_TEMPERATURE_CASES' | 'NOT_IN_ASSUMED_GIANT_CASES';
  readonly planetSurvivalConfirmed: false;
  readonly tidesAndOrbitalStabilityUnresolved: true;
  readonly stellarRadiusHistoryUnresolved: true;
  readonly exobaseAndXuvHistoryUnresolved: true;
  readonly planetaryPostWdOutgassingUnresolved: true;
  readonly atmosphericCompositionCurrentUnresolved: true;
  readonly speciesEscapeDiagnostics: readonly PostAgbSpeciesEscapeDiagnostic[];
  /** Mean gas supply needed to recreate prior surface pressure FROM ZERO, with
   * no later erosion. A requirement, not a predicted outgassing rate. */
  readonly meanSupplyToRebuildPriorInventoryKilogramsPerYear: number;
  readonly sourceInventoryMassKilograms: number;
  readonly companionPerturbationsUnresolved: boolean;
}

export interface PostAgbPlanetarySurvivalInput {
  readonly isWhiteDwarf: boolean;
  readonly hasConditionalAdiabaticOrbit: boolean;
  readonly history: WhiteDwarfPostAgbAtmosphereHistory | null;
  readonly formationEccentricity: number;
  readonly planetMassEarth: number;
  readonly planetRadiusEarth: number;
  readonly priorAtmosphere: readonly PreAgbGasInventoryProxy[];
}

function positive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function radiusAuFromLuminosityAndTemperature(luminositySolar: number, kelvin: number): number {
  return SOLAR_RADIUS_AU * Math.sqrt(luminositySolar) *
    (SOLAR_EFFECTIVE_TEMPERATURE_KELVIN / kelvin) ** 2;
}

function radiusHypothesis(
  luminositySolar: number, minKelvin: number, maxKelvin: number,
): readonly [number, number] {
  return Object.freeze([
    radiusAuFromLuminosityAndTemperature(luminositySolar, maxKelvin),
    radiusAuFromLuminosityAndTemperature(luminositySolar, minKelvin),
  ] as const);
}

export function assessWhiteDwarfPostAgbPlanetarySurvival(
  input: PostAgbPlanetarySurvivalInput,
): PostAgbPlanetarySurvivalAssessment | null {
  if (!input.isWhiteDwarf || !input.hasConditionalAdiabaticOrbit || input.history === null) return null;
  const history = input.history;
  if (history.kind !== 'PARAMETRIC_RGB_AGB_WD_EXPOSURE_SENSITIVITY_V1' ||
      !positive(input.planetMassEarth) || !positive(input.planetRadiusEarth) ||
      !Number.isFinite(input.formationEccentricity) ||
      input.formationEccentricity < 0 || input.formationEccentricity >= 1 ||
      !positive(history.formationSemiMajorAxisAu) ||
      !positive(history.hypotheticalPostAgbSemiMajorAxisAu) ||
      !positive(history.coolingAgeBillionYears) ||
      !positive(history.initialStellarMassSolar) ||
      !positive(history.whiteDwarfMassSolar) ||
      history.whiteDwarfMassSolar >= history.initialStellarMassSolar ||
      history.hypotheticalPostAgbSemiMajorAxisAu < history.formationSemiMajorAxisAu ||
      history.stages.length !== 3 || history.stages[0].stage !== 'RGB' ||
      history.stages[1].stage !== 'AGB' ||
      history.stages[2].stage !== 'WD_COOLING_RESOLVED_WINDOW') return null;

  const rgbLuminosity = history.stages[0].representativeLuminositySolar;
  const agbLuminosity = history.stages[1].representativeLuminositySolar;
  if (rgbLuminosity === null || agbLuminosity === null ||
      !positive(rgbLuminosity) || !positive(agbLuminosity)) return null;
  const rgb = radiusHypothesis(rgbLuminosity, ...GIANT_EFFECTIVE_TEMPERATURE_HYPOTHESES.RGB);
  const agb = radiusHypothesis(agbLuminosity, ...GIANT_EFFECTIVE_TEMPERATURE_HYPOTHESES.AGB);
  const envelope = Object.freeze([
    Math.max(rgb[0], agb[0]), Math.max(rgb[1], agb[1]),
  ] as const);
  const firstPeriastron = history.formationSemiMajorAxisAu * (1 - input.formationEccentricity);
  const finalPeriastron = history.hypotheticalPostAgbSemiMajorAxisAu * (1 - input.formationEccentricity);
  // Compare to the FORMATION periastron only as a deliberately conservative
  // fixed-orbit diagnostic: the orbit expands WHILE the envelope grows.
  const intersection = firstPeriastron <= envelope[0]
    ? 'IN_ALL_ASSUMED_GIANT_TEMPERATURE_CASES' as const
    : firstPeriastron <= envelope[1]
      ? 'POSSIBLE_WITH_ASSUMED_GIANT_PARAMETERS' as const
      : 'NOT_IN_ASSUMED_GIANT_CASES' as const;

  const fractions = input.priorAtmosphere;
  const total = fractions.reduce((sum, gas) => sum + gas.moleFraction01, 0);
  if (fractions.length === 0 || !positive(total) || fractions.some(gas =>
    !(gas.gas in GAS_MOLAR_MASS_KG_PER_MOL) ||
    !Number.isFinite(gas.moleFraction01) || gas.moleFraction01 < 0)) return null;
  const planetRadiusMeters = input.planetRadiusEarth * EARTH_RADIUS_METERS;
  const planetMassKilograms = input.planetMassEarth * EARTH_MASS_KG;
  const escapeVelocitySquared = 2 * G * planetMassKilograms / planetRadiusMeters;
  const diagnostics = fractions.map(gas => {
    const molarMass = GAS_MOLAR_MASS_KG_PER_MOL[gas.gas as keyof typeof GAS_MOLAR_MASS_KG_PER_MOL];
    const jeans = (temp: number) =>
      escapeVelocitySquared * molarMass / (2 * AVOGADRO * BOLTZMANN * temp);
    return Object.freeze({
      gas: gas.gas,
      progenitorInventoryFraction01: gas.moleFraction01 / total,
      jeansParameterColdExobase: jeans(EXOBASE_TEMPERATURE_HYPOTHESES_KELVIN[0]),
      jeansParameterHotExobase: jeans(EXOBASE_TEMPERATURE_HYPOTHESES_KELVIN[1]),
      // Merely a Jeans susceptibility flag. Not a probability or rate.
      thermallyMobileUnderHotExobaseHypothesis: jeans(5000) < 15,
    });
  });
  const gravity = G * planetMassKilograms / planetRadiusMeters ** 2;
  const pressure = history.scenarios[0]?.afterWdCoolingGasInventoryPressureRangePascal[1];
  // At zero coupling, the H4b scenario must exactly preserve the old inventory.
  if (pressure === undefined || !Number.isFinite(pressure) || pressure < 0 ||
      !Number.isFinite(gravity) || gravity <= 0 ||
      !diagnostics.every(d => Number.isFinite(d.jeansParameterHotExobase))) return null;
  const sourceMass = 4 * Math.PI * planetRadiusMeters ** 2 * pressure / gravity;
  const annualSupply = sourceMass / (history.coolingAgeBillionYears * 1e9);
  if (![sourceMass, annualSupply, ...rgb, ...agb, ...envelope].every(Number.isFinite)) return null;

  return Object.freeze({
    kind: 'CONDITIONAL_RGB_AGB_SURVIVAL_AND_ESCAPE_V1' as const,
    formationPeriastronAu: firstPeriastron,
    hypotheticalPostAgbPeriastronAu: finalPeriastron,
    rgbRadiusHypothesisAu: rgb,
    agbRadiusHypothesisAu: agb,
    envelopeRadiusHypothesisAu: envelope,
    directEnvelopeIntersection: intersection,
    planetSurvivalConfirmed: false as const,
    tidesAndOrbitalStabilityUnresolved: true as const,
    stellarRadiusHistoryUnresolved: true as const,
    exobaseAndXuvHistoryUnresolved: true as const,
    planetaryPostWdOutgassingUnresolved: true as const,
    atmosphericCompositionCurrentUnresolved: true as const,
    speciesEscapeDiagnostics: Object.freeze(diagnostics),
    meanSupplyToRebuildPriorInventoryKilogramsPerYear: annualSupply,
    sourceInventoryMassKilograms: sourceMass,
    companionPerturbationsUnresolved: history.companionIrradiationUnresolved,
  });
}
