/**
 * 29.1E-H5 — reproducible *simulated* RGB/AGB/WD atmospheric trajectory.
 *
 * MODEL, not observation or recovered Ground Truth. It consumes H4b's assumed
 * giant bolometric tracks and H3's isolated-host adiabatic orbit. XUV-to-escape
 * efficiencies, preferential gas loss, potential secondary reservoirs and
 * grey-opacity response are explicit GENESIS V1 closure hypotheses. Results
 * are conditional on the planet existing and on those assumptions. They are
 * not probabilities, measured XUV, a calibrated evolutionary track, or a
 * validated multihost surface climate. Never mutate generated input objects.
 */
import type { PreAgbGasInventoryProxy, PostAgbAtmosphereScenario } from './white-dwarf-post-agb-atmosphere-projection';
import { equilibrateCryogenicGasColumns } from './white-dwarf-cryo-phase-equilibrium';
import type { WhiteDwarfPostAgbAtmosphereHistory } from './white-dwarf-post-agb-atmosphere-history';
import type { PostAgbPlanetarySurvivalAssessment } from './white-dwarf-post-agb-planetary-survival';

const GAS_MOLAR_MASS: Readonly<Record<string, number>> = Object.freeze({
  HYDROGEN: 0.00201588, HELIUM: 0.004002602, NITROGEN: 0.0280134,
  OXYGEN: 0.0319988, CARBON_DIOXIDE: 0.0440095, WATER_VAPOR: 0.01801528,
  METHANE: 0.0160425, ARGON: 0.039948, SULFUR_DIOXIDE: 0.064066,
  CARBON_MONOXIDE: 0.0280101, AMMONIA: 0.01703052,
});
const R_EARTH = 6371000;
const G = 6.67430e-11;
const M_EARTH = 5.9722e24;
const BOLTZMANN = 1.380649e-23;
const AVOGADRO = 6.02214076e23;
const GREENHOUSE_WEIGHT: Readonly<Record<string, number>> = Object.freeze({
  CARBON_DIOXIDE: 1.2, WATER_VAPOR: 1.6, METHANE: 1,
  AMMONIA: 0.9, SULFUR_DIOXIDE: 0.6, HYDROGEN: 0.03,
});
/** Three *model sensitivities*, NOT credible confidence-interval endpoints. */
export const POST_AGB_H5_CLOSURE_ASSUMPTIONS = Object.freeze([
  Object.freeze({name: 'LOW_ESCAPE' as const, escapeScale: 0.02, resupplyScale: 2}),
  Object.freeze({name: 'REFERENCE' as const, escapeScale: 1, resupplyScale: 1}),
  Object.freeze({name: 'HIGH_ESCAPE' as const, escapeScale: 50, resupplyScale: 0}),
]);

export interface WhiteDwarfEvolvedGas {
  readonly gas: string;
  /** Species gravity-weighted mass column in Pa, NOT its gas partial pressure. */
  readonly gasPressurePascal: number;
  /** True ideal-mixture partial pressure: mole fraction × total surface pressure. */
  readonly gasPartialPressurePascal: number;
  readonly condensedReservoirPressureEquivalentPascal: number;
  readonly escapedPressureEquivalentPascal: number;
  readonly secondarySuppliedPressureEquivalentPascal: number;
  readonly gasMoleFraction01: number;
}
export interface WhiteDwarfEvolvedAtmosphereCase {
  readonly assumption: 'LOW_ESCAPE' | 'REFERENCE' | 'HIGH_ESCAPE';
  readonly pressurePascal: number;
  readonly climateTemperatureKelvin: number;
  readonly greenhouseWarmingKelvin: number;
  readonly afterRgbInventoryPressureEquivalentPascal: number;
  readonly afterAgbInventoryPressureEquivalentPascal: number;
  readonly afterWdEscapeInventoryPressureEquivalentPascal: number;
  readonly gases: readonly WhiteDwarfEvolvedGas[];
  readonly totalEscapedPressureEquivalentPascal: number;
  readonly totalCondensedPressureEquivalentPascal: number;
  readonly totalSecondarySuppliedPressureEquivalentPascal: number;
  /** Precision of the accounting identity is checked by tests. */
  readonly atmosphericMassBudgetErrorPascal: number;
}
export interface WhiteDwarfEvolvedEnvironment {
  readonly kind: 'POST_AGB_WD_EVOLVED_ENVIRONMENT_MODEL_V1';
  readonly status: 'SIMULATED_REFERENCE_SCENARIO_NOT_OBSERVED';
  readonly reference: WhiteDwarfEvolvedAtmosphereCase;
  readonly alternatives: readonly WhiteDwarfEvolvedAtmosphereCase[];
  readonly sensitivityPressureRangePascal: readonly [number, number];
  readonly sensitivityTemperatureRangeKelvin: readonly [number, number];
  readonly waterPhaseInReference: 'ICE_IF_WATER_INVENTORY_SURVIVED' | 'POSSIBLE_VAPOR' | 'NO_INITIAL_WATER_GAS_INFORMATION';
  readonly atmosphericSurfaceCondition: 'HOST_ONLY_CONDITIONAL' | 'ADIABATIC_MULTIPLE_HIERARCHY_CONDITIONAL';
  readonly modeledCompanionIrradiationEarth: number | null;
  readonly orbitalEvolutionAssumed: 'ADIABATIC_ISOLATED_HOST';
  readonly phaseTrackAssumed: true;
  readonly xuvAndEscapeEfficiencyAssumed: true;
  readonly volatileResupplyProxyAssumed: true;
  readonly multiHostRadiationUnresolved: boolean;
  readonly historicalSurvivalUnvalidated: true;
  readonly canonicalPlanetModified: false;
}
export interface WhiteDwarfEvolvedEnvironmentInput {
  readonly isCircumstellarWhiteDwarf: boolean;
  readonly hasAdiabaticOrbitHypothesis: boolean;
  readonly history: WhiteDwarfPostAgbAtmosphereHistory | null;
  readonly h4: PostAgbAtmosphereScenario | null;
  readonly h4c: PostAgbPlanetarySurvivalAssessment | null;
  readonly massEarth: number;
  readonly radiusEarth: number;
  readonly priorGasComposition: readonly PreAgbGasInventoryProxy[];
  readonly atmosphericPressureBeforeAgbPascal: number | null;
  readonly geologicalOutgassingPotential01: number | null;
  readonly airlessThermalReferenceKelvin: number | null;
  readonly companionRadiationUnresolved: boolean;
  /** Optional, explicitly modelled AB/C irradiation, not observed ephemerides. */
  readonly modeledCompanionIrradiationEarth?: number | null;
  readonly referenceBondAlbedo01?: number | null;
}
const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export function simulateWhiteDwarfPostAgbEvolvedEnvironment(
  input: WhiteDwarfEvolvedEnvironmentInput,
): WhiteDwarfEvolvedEnvironment | null {
  const {history, h4, h4c} = input;
  const p0 = input.atmosphericPressureBeforeAgbPascal;
  const temp = input.airlessThermalReferenceKelvin;
  // Missing geological proxy -> conservative no-new-supply branch.
  const outgassingPotential = input.geologicalOutgassingPotential01 ?? 0;
  const companionFlux = input.modeledCompanionIrradiationEarth ?? null;
  const albedo = input.referenceBondAlbedo01 ?? null;
  if (!input.isCircumstellarWhiteDwarf || !input.hasAdiabaticOrbitHypothesis ||
      !history || !h4 || !h4c || !Number.isFinite(input.massEarth) || input.massEarth <= 0 ||
      !Number.isFinite(input.radiusEarth) || input.radiusEarth <= 0 ||
      p0 === null || !Number.isFinite(p0) || p0 < 0 ||
      temp === null || !Number.isFinite(temp) || temp < 2.7 || temp > 2500 ||
      history.kind !== 'PARAMETRIC_RGB_AGB_WD_EXPOSURE_SENSITIVITY_V1' ||
      h4.kind !== 'WD_ONLY_NO_REPLENISHMENT' ||
      h4c.kind !== 'CONDITIONAL_RGB_AGB_SURVIVAL_AND_ESCAPE_V1' ||
      history.stages.length !== 3 ||
      history.stages.some(s => !Number.isFinite(s.bolometricFluenceMinimumJoulePerSquareMeter) ||
        !Number.isFinite(s.bolometricFluenceMaximumJoulePerSquareMeter) ||
        s.bolometricFluenceMaximumJoulePerSquareMeter < s.bolometricFluenceMinimumJoulePerSquareMeter) ||
      !Number.isFinite(history.coolingAgeBillionYears) || history.coolingAgeBillionYears <= 0 ||
      h4.gasCeilings.length === 0 || input.priorGasComposition.length === 0 ||
      !Number.isFinite(outgassingPotential) ||
      outgassingPotential < 0 || outgassingPotential > 1 ||
      (companionFlux !== null && (!Number.isFinite(companionFlux) || companionFlux < 0 ||
        albedo === null || !Number.isFinite(albedo) || albedo < 0 || albedo > 1)) ||
      h4.progenitorReferencePressurePascal !== p0 ||
      h4c.directEnvelopeIntersection === 'IN_ALL_ASSUMED_GIANT_TEMPERATURE_CASES') return null;
  const totalFraction = sum(input.priorGasComposition.map(s => s.moleFraction01));
  if (!Number.isFinite(totalFraction) || totalFraction <= 0 ||
      input.priorGasComposition.some(g => !(g.gas in GAS_MOLAR_MASS) ||
        !Number.isFinite(g.moleFraction01) || g.moleFraction01 < 0) ||
      new Set(input.priorGasComposition.map(g => g.gas)).size !== input.priorGasComposition.length ||
      h4.gasCeilings.length !== input.priorGasComposition.length) return null;
  const vaporCeilings = new Map(h4.gasCeilings.map(g => [g.gas, g.gasPressureCeilingPascal]));
  if (input.priorGasComposition.some(g => !vaporCeilings.has(g.gas))) return null;
  // H2/H3 T^4 already incorporates the WD irradiation and intrinsic heat.
  // Only ADD the estimated companion flux, not the WD a second time.
  const currentAirlessKelvin = companionFlux !== null && albedo !== null
    ? Math.pow(temp ** 4 + companionFlux * 1361 * (1 - albedo) /
      (4 * 5.670374419e-8), 0.25) : temp;
  const assumptions = POST_AGB_H5_CLOSURE_ASSUMPTIONS;
  const radiusMeters = input.radiusEarth * R_EARTH;
  const gravityParameter = G * input.massEarth * M_EARTH / radiusMeters;
  // Selected closure values combine an assumed XUV fraction and energy-limited
  // escape efficiency. They are NOT extracted from a WD spectrum. The giant
  // fractions are small because RGB/AGB bolometric flux is primarily optical.
  const effectiveCouplings = [1e-10, 3e-10, 2e-11] as const;
  // Assumed thermosphere and exobase pressure: insufficient to reconstruct a
  // true Parker/Jeans escape history; retain full sensitivity in outputs.
  const exobaseTemperaturesKelvin = [3200, 5000, 600] as const;
  const phaseSeconds = history.stages.map(s =>
    s.representativeDurationBillionYears * 1e9 * 365.25 * 86400);
  // Phase-20 compositions are mole fractions. Atmospheric pressure is a
  // hydrostatic MASS column, so species inventories in pressure-equivalent
  // units must be initialized using MASS fraction, not partial pressure.
  const meanMolarMass = sum(input.priorGasComposition.map(g =>
    g.moleFraction01 * GAS_MOLAR_MASS[g.gas])) / totalFraction;
  const initial = input.priorGasComposition.map(g =>
    p0 * (g.moleFraction01 / totalFraction) * GAS_MOLAR_MASS[g.gas] /
      meanMolarMass);
  const planetGravity = gravityParameter / radiusMeters;
  const make = (assumption: (typeof assumptions)[number]): WhiteDwarfEvolvedAtmosphereCase => {
    const gasP = initial.slice();
    const escaped = initial.map(() => 0);
    const condensation = initial.map(() => 0);
    const supplied = initial.map(() => 0);
    const after: number[] = [];
    for (let stageIndex = 0; stageIndex < 3; stageIndex++) {
      const stage = history.stages[stageIndex];
      // Midpoint fluence is the declared orbit interpolation closure;
      // not a reconstructed ephemeris. The alternative cases vary coupling.
      const fluence = (stage.bolometricFluenceMinimumJoulePerSquareMeter +
        stage.bolometricFluenceMaximumJoulePerSquareMeter) / 2;
      let pressureLoss = clamp(
        fluence * effectiveCouplings[stageIndex] * assumption.escapeScale /
          (4 * radiusMeters), 0, sum(gasP),
      );
      // Energy-limited budget allocated preferentially to molecules with
      // smaller gravitational binding relative to exobase thermal energy.
      // Renormalize after depletion to conserve inventory and energy budget.
      for (let pass = 0; pass < 8 && pressureLoss > 1e-8; pass++) {
        const weights = gasP.map((p, i) => {
          if (p <= 0) return 0;
          const moleculeKg = GAS_MOLAR_MASS[input.priorGasComposition[i].gas] / AVOGADRO;
          const jeans = gravityParameter * moleculeKg /
            (BOLTZMANN * exobaseTemperaturesKelvin[stageIndex]);
          return p * (1 + 40 / (1 + Math.max(0, jeans)));
        });
        const totalWeight = sum(weights);
        if (totalWeight <= 0) break;
        let taken = 0;
        for (let i = 0; i < gasP.length; i++) {
          const removed = Math.min(gasP[i], pressureLoss * weights[i] / totalWeight);
          gasP[i] -= removed;
          escaped[i] += removed;
          taken += removed;
        }
        pressureLoss = Math.max(0, pressureLoss - taken);
      }
      // Species-selective Jeans leakage at an EXPLICITLY ASSUMED exobase
      // pressure. The formula is dimensional mass flux and therefore includes
      // molecular masses when converting escaping particles to Pa of column.
      // It does not replace wind, photochemistry or hydrodynamic escape.
      const moleNumbers = gasP.map((p, i) =>
        p / GAS_MOLAR_MASS[input.priorGasComposition[i].gas]);
      const totalMoles = sum(moleNumbers);
      const referenceExobasePressurePascal = 1e-7 * assumption.escapeScale;
      for (let i = 0; i < gasP.length; i++) {
        if (gasP[i] <= 0 || totalMoles <= 0) continue;
        const molecularMass = GAS_MOLAR_MASS[input.priorGasComposition[i].gas] / AVOGADRO;
        const T = exobaseTemperaturesKelvin[stageIndex];
        const lambda = gravityParameter * molecularMass / (BOLTZMANN * T);
        // exp(-lambda) is naturally negligible for well-retained heavy gases.
        const n = (referenceExobasePressurePascal * moleNumbers[i] / totalMoles) /
          (BOLTZMANN * T);
        const thermalSpeed = Math.sqrt(2 * BOLTZMANN * T / molecularMass);
        const particleFlux = n * thermalSpeed / (2 * Math.sqrt(Math.PI)) *
          (1 + lambda) * Math.exp(-lambda);
        const thermalLoss = Math.min(gasP[i], planetGravity * molecularMass *
          particleFlux * phaseSeconds[stageIndex]);
        gasP[i] -= thermalLoss;
        escaped[i] += thermalLoss;
      }
      after.push(sum(gasP));
    }
    // Conservatively allocate an EXPLICITLY ASSUMED secondary reservoir:
    // at most 6% of the old atmosphere-equivalent, not a fictional unlimited
    // rate derived from the planet's volcanism descriptor. Never synthesize
    // a species absent from the original chemical inventory.
    const secondaryBudget = p0 * 0.06 * outgassingPotential *
      assumption.resupplyScale * (history.coolingAgeBillionYears /
        (history.coolingAgeBillionYears + 0.6));
    const eligible = input.priorGasComposition.map((g, i) =>
      (g.gas === 'HYDROGEN' || g.gas === 'HELIUM' || g.gas === 'ARGON') ? 0 : initial[i]);
    const eligibleTotal = sum(eligible);
    if (eligibleTotal > 0) {
      for (let i = 0; i < gasP.length; i++) {
        supplied[i] = secondaryBudget * eligible[i] / eligibleTotal;
        gasP[i] += supplied[i];
      }
    }
    // Fixed-point atmosphere–cryocondensation coupling in the modeled
    // radiation field. Re-equilibrate the conserved post-escape inventory as
    // greenhouse opacity changes temperature. H4 uses the same rough vapor
    // anchors, not a chemical EOS; every iteration returns the cold-trapped
    // mass to the available reservoir instead of destroying it.
    const available = gasP.slice();
    let climateTemperature = currentAirlessKelvin;
    const updateGasAtTemperature = (T: number): void => {
      const equilibrated = equilibrateCryogenicGasColumns(
        input.priorGasComposition.map((g, i) => ({
          gas: g.gas,
          massColumnPressureEquivalentPascal: available[i],
        })), T);
      if (equilibrated === null) throw new Error('Validated H5 gas inventory failed cryoequilibrium');
      for (let i = 0; i < gasP.length; i++) {
        gasP[i] = equilibrated[i].gasMassColumnPressureEquivalentPascal;
        condensation[i] = equilibrated[i].condensedMassColumnPressureEquivalentPascal;
      }
    };
    const opticalTemperature = (): number => {
      const remainingMoles = gasP.map((p, i) =>
        p / GAS_MOLAR_MASS[input.priorGasComposition[i].gas]);
      const molarDenominator = sum(remainingMoles);
      const pressureTotal = sum(gasP);
      const tau = clamp(sum(gasP.map((_p, i) => {
        const gas = input.priorGasComposition[i].gas;
        const partialP = molarDenominator > 0 ?
          pressureTotal * remainingMoles[i] / molarDenominator : 0;
        const linear = (GREENHOUSE_WEIGHT[gas] ?? 0) * partialP / 101325;
        return gas === 'HYDROGEN'
          ? linear + 0.02 * (partialP / 101325) ** 2 : linear;
      })), 0, 12);
      return currentAirlessKelvin * (1 + 0.75 * tau) ** 0.25;
    };
    for (let iteration = 0; iteration < 24; iteration++) {
      updateGasAtTemperature(climateTemperature);
      const updated = opticalTemperature();
      const delta = updated - climateTemperature;
      // Damping avoids oscillation at saturation/greenhouse transitions.
      climateTemperature += delta * 0.5;
      if (Math.abs(delta) < 1e-7) break;
    }
    updateGasAtTemperature(climateTemperature);
    climateTemperature = opticalTemperature();
    updateGasAtTemperature(climateTemperature);
    const pressure = sum(gasP);
    const gasMoles = gasP.map((p, i) =>
      p / GAS_MOLAR_MASS[input.priorGasComposition[i].gas]);
    const totalGasMoles = sum(gasMoles);
    const gases = Object.freeze(input.priorGasComposition.map((gas, i) => Object.freeze({
      gas: gas.gas,
      gasPressurePascal: gasP[i],
      gasPartialPressurePascal: totalGasMoles > 0 ? pressure * gasMoles[i] / totalGasMoles : 0,
      condensedReservoirPressureEquivalentPascal: condensation[i],
      escapedPressureEquivalentPascal: escaped[i],
      secondarySuppliedPressureEquivalentPascal: supplied[i],
      gasMoleFraction01: totalGasMoles > 0 ? gasMoles[i] / totalGasMoles : 0,
    })));
    const totalEscaped = sum(escaped);
    const totalCondensed = sum(condensation);
    const totalSupplied = sum(supplied);
    const budgetError = Math.abs(p0 + totalSupplied -
      pressure - totalEscaped - totalCondensed);
    return Object.freeze({
      assumption: assumption.name,
      pressurePascal: pressure,
      climateTemperatureKelvin: climateTemperature,
      greenhouseWarmingKelvin: climateTemperature - currentAirlessKelvin,
      afterRgbInventoryPressureEquivalentPascal: after[0],
      afterAgbInventoryPressureEquivalentPascal: after[1],
      afterWdEscapeInventoryPressureEquivalentPascal: after[2],
      gases,
      totalEscapedPressureEquivalentPascal: totalEscaped,
      totalCondensedPressureEquivalentPascal: totalCondensed,
      totalSecondarySuppliedPressureEquivalentPascal: totalSupplied,
      atmosphericMassBudgetErrorPascal: budgetError,
    });
  };
  const alternatives = Object.freeze(assumptions.map(make));
  if (alternatives.some(a => !Number.isFinite(a.pressurePascal) ||
      !Number.isFinite(a.climateTemperatureKelvin) ||
      !Number.isFinite(a.atmosphericMassBudgetErrorPascal) ||
      a.atmosphericMassBudgetErrorPascal > Math.max(1e-5, p0 * 1e-9))) return null;
  const reference = alternatives[1];
  const pressures = alternatives.map(a => a.pressurePascal);
  const temperatures = alternatives.map(a => a.climateTemperatureKelvin);
  const originalWater = input.priorGasComposition.some(g =>
    g.gas === 'WATER_VAPOR' && g.moleFraction01 > 0);
  return Object.freeze({
    kind: 'POST_AGB_WD_EVOLVED_ENVIRONMENT_MODEL_V1' as const,
    status: 'SIMULATED_REFERENCE_SCENARIO_NOT_OBSERVED' as const,
    reference,
    alternatives,
    sensitivityPressureRangePascal: Object.freeze([Math.min(...pressures), Math.max(...pressures)] as const),
    sensitivityTemperatureRangeKelvin: Object.freeze([Math.min(...temperatures), Math.max(...temperatures)] as const),
    waterPhaseInReference: !originalWater ? 'NO_INITIAL_WATER_GAS_INFORMATION' as const :
      reference.climateTemperatureKelvin < 273.15 ? 'ICE_IF_WATER_INVENTORY_SURVIVED' as const :
        'POSSIBLE_VAPOR' as const,
    atmosphericSurfaceCondition: companionFlux === null
      ? 'HOST_ONLY_CONDITIONAL' as const
      : 'ADIABATIC_MULTIPLE_HIERARCHY_CONDITIONAL' as const,
    modeledCompanionIrradiationEarth: companionFlux,
    orbitalEvolutionAssumed: 'ADIABATIC_ISOLATED_HOST' as const,
    phaseTrackAssumed: true as const,
    xuvAndEscapeEfficiencyAssumed: true as const,
    volatileResupplyProxyAssumed: true as const,
    multiHostRadiationUnresolved: input.companionRadiationUnresolved && companionFlux === null,
    historicalSurvivalUnvalidated: true as const,
    canonicalPlanetModified: false as const,
  });
}
