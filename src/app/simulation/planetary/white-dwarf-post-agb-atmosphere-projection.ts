/**
 * 29.1E-H4: explicitly conditional atmospheric survival/cryochemistry bridge.
 *
 * A phase-20 atmosphere generated for the PROGENITOR is an inventory proxy,
 * NEVER the contemporary atmosphere of an evolved white-dwarf planet.
 *
 * We do not know the RGB/AGB radius, time-resolved XUV exposure, stellar wind,
 * magnetosphere, volatile replenishment or the present-day companion geometry.
 * Therefore survival has a physical lower limit of zero. This module computes
 * a *no-replenishment, WD-only* gas pressure ceiling after cryocondensation,
 * not an actual present-day pressure, composition, climate or proof of survival.
 * No seeded RNG, persisted aggregate, wall clock or mutable cache is used.
 */
import { CRYOGENIC_MOLAR_MASS_KG, cryogenicPressureCeiling, equilibrateCryogenicGasColumns } from './white-dwarf-cryo-phase-equilibrium';

export { cryogenicPressureCeiling } from './white-dwarf-cryo-phase-equilibrium';

export interface PreAgbGasInventoryProxy {
  readonly gas: string;
  readonly moleFraction01: number;
}

export interface ConditionalGasCeiling {
  readonly gas: string;
  readonly gasPressureCeilingPascal: number;
  readonly gasFractionWithinCeiling01: number;
  readonly cryocondensationLimited: boolean;
}

export interface PostAgbAtmosphereScenario {
  readonly kind: 'WD_ONLY_NO_REPLENISHMENT';
  readonly progenitorReferencePressurePascal: number;
  /** The unknown RGB/AGB escape history permits complete atmospheric loss. */
  readonly possiblePressureMinimumPascal: 0;
  /** Only a ceiling for the specifically defined WD-only, no-replenishment scenario. */
  readonly scenarioGasPressureCeilingPascal: number;
  readonly equilibriumTemperatureReferenceKelvin: number;
  readonly greenhouseTemperatureCeilingKelvin: number;
  readonly greenhouseWarmingCeilingKelvin: number;
  readonly coolingAgeBillionYears: number;
  readonly escapeVelocityKilometersPerSecond: number;
  readonly gasCeilings: readonly ConditionalGasCeiling[];
  readonly volatileGasesWithCryogenicCondensation: readonly string[];
  readonly companionIrradiationUnresolved: boolean;
  readonly survivalUnresolved: true;
  readonly currentPressureUnresolved: true;
  readonly currentWaterUnresolved: true;
}

export interface PostAgbAtmosphereScenarioInput {
  readonly isWhiteDwarf: boolean;
  readonly postAgbOrbitHypothesisAvailable: boolean;
  readonly progenitorReferencePressurePascal: number | null;
  readonly progenitorGasComposition: readonly PreAgbGasInventoryProxy[];
  readonly massEarth: number;
  readonly radiusEarth: number;
  readonly coolingAgeBillionYears: number | null;
  /** H3 airless lower-temperature scenario; NOT an observational temperature. */
  readonly airlessReferenceTemperatureKelvin: number | null;
  readonly companionIrradiationUnresolved: boolean;
}

const G = 6.67430e-11;
const M_EARTH = 5.9722e24;
const R_EARTH = 6371000;
const BOLTZMANN = 1.380649e-23;
const AVOGADRO = 6.02214076e23;
const ATM_PASCAL = 101325;

/** Returns null unless every gas can be meaningfully bounded by this model. */
export function projectWhiteDwarfPostAgbAtmosphereScenario(
  input: PostAgbAtmosphereScenarioInput,
): PostAgbAtmosphereScenario | null {
  if (!input.isWhiteDwarf || !input.postAgbOrbitHypothesisAvailable) return null;
  const {progenitorReferencePressurePascal: pressure,
    progenitorGasComposition: composition, massEarth: mass,
    radiusEarth: radius, coolingAgeBillionYears: age,
    airlessReferenceTemperatureKelvin: temp} = input;
  if (pressure === null || age === null || temp === null || !Number.isFinite(pressure) ||
      pressure < 0 || !Number.isFinite(mass) || mass <= 0 ||
      !Number.isFinite(radius) || radius <= 0 ||
      !Number.isFinite(age) || age < 0 || age > 14 ||
      !Number.isFinite(temp) || temp < 2.7 || temp > 2500 ||
      composition.length === 0) return null;
  const total = composition.reduce((acc, entry) => acc + entry.moleFraction01, 0);
  if (!Number.isFinite(total) || total <= 0 || composition.some(entry =>
    !Number.isFinite(entry.moleFraction01) || entry.moleFraction01 < 0 ||
    !Object.prototype.hasOwnProperty.call(CRYOGENIC_MOLAR_MASS_KG, entry.gas))) return null;

  const escapeVelocity = Math.sqrt(2 * G * M_EARTH * mass / (R_EARTH * radius)) / 1000;
  const meanMass = composition.reduce((a, entry) =>
    a + entry.moleFraction01 * CRYOGENIC_MOLAR_MASS_KG[entry.gas], 0) / total;
  const inventory = composition.map(entry => {
    const molarMass = CRYOGENIC_MOLAR_MASS_KG[entry.gas];
    const moleculeMass = molarMass / AVOGADRO;
    const lambda = G * M_EARTH * mass * moleculeMass /
      (R_EARTH * radius * BOLTZMANN * temp);
    return {
      gas: entry.gas,
      massColumnPressureEquivalentPascal: lambda < 10 ? 0 :
        pressure * (entry.moleFraction01 / total) * molarMass / meanMass,
    };
  });
  const equilibrium = equilibrateCryogenicGasColumns(inventory, temp);
  if (equilibrium === null) return null;
  const gasUpper = equilibrium.reduce((acc, gas) =>
    acc + gas.gasMassColumnPressureEquivalentPascal, 0);
  const condensed = equilibrium.filter((gas, i) =>
    gas.condensedMassColumnPressureEquivalentPascal >
      1e-12 * Math.max(1, inventory[i].massColumnPressureEquivalentPascal))
    .map(gas => gas.gas);
  const gasCeilings = Object.freeze(equilibrium.map(gas => Object.freeze({
    gas: gas.gas,
    // Partial pressure, not a gravity-weighted mass column.
    gasPressureCeilingPascal: gas.gasPartialPressurePascal,
    gasFractionWithinCeiling01: gas.gasMoleFraction01,
    cryocondensationLimited: condensed.includes(gas.gas),
  })));
  // Optical-depth upper proxy for this no-replenishment scenario only. It is
  // not a spectroscopic greenhouse calculation. Bound tau <= 10 to avoid
  // claiming arbitrarily large feedback with an unknown atmosphere.
  const greenhouseWeight: Record<string, number> = {
    CARBON_DIOXIDE: 1.5, WATER_VAPOR: 2, METHANE: 1,
    AMMONIA: 1.2, SULFUR_DIOXIDE: 1, HYDROGEN: 0.05,
  };
  const tau = Math.min(10, equilibrium.reduce((acc, gas) =>
    acc + Math.min(gas.gasPartialPressurePascal / ATM_PASCAL, 10) *
      (greenhouseWeight[gas.gas] ?? 0), 0));
  const surfaceCeiling = temp * (1 + 0.75 * tau) ** 0.25;
  return Object.freeze({
    kind: 'WD_ONLY_NO_REPLENISHMENT' as const,
    progenitorReferencePressurePascal: pressure,
    possiblePressureMinimumPascal: 0 as const,
    scenarioGasPressureCeilingPascal: gasUpper,
    equilibriumTemperatureReferenceKelvin: temp,
    greenhouseTemperatureCeilingKelvin: surfaceCeiling,
    greenhouseWarmingCeilingKelvin: surfaceCeiling - temp,
    coolingAgeBillionYears: age,
    escapeVelocityKilometersPerSecond: escapeVelocity,
    gasCeilings,
    volatileGasesWithCryogenicCondensation: Object.freeze(condensed),
    companionIrradiationUnresolved: input.companionIrradiationUnresolved,
    survivalUnresolved: true as const,
    currentPressureUnresolved: true as const,
    currentWaterUnresolved: true as const,
  });
}
