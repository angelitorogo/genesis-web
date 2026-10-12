/**
 * 29.1E-H5-A.1 — cryogenic ideal-gas/solid phase equilibrium.
 *
 * Solid–gas Clapeyron estimates anchored to the TRIPLE POINT, not to the
 * atmospheric-pressure boiling point. They are explicit first-order model
 * curves (constant enthalpy, no non-ideal EOS or adsorption), NOT measurements
 * at 30–40 K. No artificial Tref/2 vapour-pressure plateau.
 *
 * Anchors: NIST nitrogen (63.151 K, 12.523 kPa), argon (83.8058 K,
 * 68.891 kPa), SO2 (197.64 K, 1.67 kPa); thermodynamic triple-point
 * references for other molecular species. Latent heats are approximate.
 * Helium has NO low-pressure solid at these temperatures; its liquid vapour
 * boundary is handled separately (only below 5.2 K).
 *
 * Atmospheric column accounting uses u_i = g * (mass_i / area), with units Pa.
 * Surface partial pressure is p_i = (u_i/M_i)/sum(u_j/M_j) * sum(u_j),
 * never u_i, and never u_i * M_i / progenitor_mean_M.
 */
export const CRYOGENIC_MOLAR_MASS_KG: Readonly<Record<string, number>> = Object.freeze({
  HYDROGEN: 0.00201588, HELIUM: 0.004002602,
  NITROGEN: 0.0280134, OXYGEN: 0.0319988,
  CARBON_DIOXIDE: 0.0440095, WATER_VAPOR: 0.01801528,
  METHANE: 0.0160425, ARGON: 0.039948,
  SULFUR_DIOXIDE: 0.064066, CARBON_MONOXIDE: 0.0280101,
  AMMONIA: 0.01703052,
});
interface PhaseAnchor {
  readonly tripleKelvin: number;
  readonly triplePascal: number;
  readonly sublimationJPerMol: number;
  readonly vaporizationJPerMol: number;
}
// The latent heat in each branch is an effective constant, NOT a fitted EOS.
const PHASE_ANCHORS: Readonly<Record<string, PhaseAnchor>> = Object.freeze({
  NITROGEN: {tripleKelvin: 63.151, triplePascal: 12523, sublimationJPerMol: 7100, vaporizationJPerMol: 5600},
  ARGON: {tripleKelvin: 83.8058, triplePascal: 68891, sublimationJPerMol: 7800, vaporizationJPerMol: 6400},
  CARBON_MONOXIDE: {tripleKelvin: 68.10, triplePascal: 15370, sublimationJPerMol: 7500, vaporizationJPerMol: 6000},
  OXYGEN: {tripleKelvin: 54.36, triplePascal: 146.25, sublimationJPerMol: 8200, vaporizationJPerMol: 6800},
  METHANE: {tripleKelvin: 90.68, triplePascal: 11700, sublimationJPerMol: 9400, vaporizationJPerMol: 8200},
  CARBON_DIOXIDE: {tripleKelvin: 216.59, triplePascal: 517000, sublimationJPerMol: 26000, vaporizationJPerMol: 16000},
  WATER_VAPOR: {tripleKelvin: 273.16, triplePascal: 611.657, sublimationJPerMol: 51000, vaporizationJPerMol: 44000},
  SULFUR_DIOXIDE: {tripleKelvin: 197.64, triplePascal: 1670, sublimationJPerMol: 31000, vaporizationJPerMol: 25000},
  AMMONIA: {tripleKelvin: 195.40, triplePascal: 6060, sublimationJPerMol: 30000, vaporizationJPerMol: 23000},
  HYDROGEN: {tripleKelvin: 13.8033, triplePascal: 7040, sublimationJPerMol: 1100, vaporizationJPerMol: 900},
});
const GAS_R = 8.314462618;
export function cryogenicPressureCeiling(gas: string, kelvin: number): number | null {
  if (!Number.isFinite(kelvin) || kelvin <= 0) return null;
  if (gas === 'HELIUM') {
    // Helium does not freeze at ordinary pressure. Liquid only for T < Tc.
    if (kelvin >= 5.2) return Infinity;
    return 101325 * Math.exp((-80 / GAS_R) * (1 / kelvin - 1 / 4.22));
  }
  const anchor = Object.prototype.hasOwnProperty.call(PHASE_ANCHORS, gas)
    ? PHASE_ANCHORS[gas] : null;
  if (anchor === null) return null;
  const enthalpy = kelvin < anchor.tripleKelvin
    ? anchor.sublimationJPerMol : anchor.vaporizationJPerMol;
  // Underflow to zero is a legitimate effectively complete cold trap, unlike
  // freezing to a nonzero plateau. Clamp large positive exponent for safety.
  const lnP = Math.log(anchor.triplePascal) - enthalpy / GAS_R *
    (1 / kelvin - 1 / anchor.tripleKelvin);
  return lnP < -745 ? 0 : lnP > 700 ? Infinity : Math.exp(lnP);
}

export interface CryogenicGasMassColumn {
  readonly gas: string;
  /** Gravity-weighted mass per area in Pa; not species partial pressure. */
  readonly massColumnPressureEquivalentPascal: number;
}
export interface CryogenicEquilibratedGasColumn {
  readonly gas: string;
  readonly gasMassColumnPressureEquivalentPascal: number;
  readonly condensedMassColumnPressureEquivalentPascal: number;
  readonly gasPartialPressurePascal: number;
  readonly gasMoleFraction01: number;
  readonly saturationPressurePascal: number;
}

/** Mass conserving, iterative partial-pressure / cold-trap equilibrium. */
export function equilibrateCryogenicGasColumns(
  inventory: readonly CryogenicGasMassColumn[], kelvin: number,
): readonly CryogenicEquilibratedGasColumn[] | null {
  if (!Number.isFinite(kelvin) || kelvin <= 0 || inventory.length === 0 ||
      new Set(inventory.map(g => g.gas)).size !== inventory.length ||
      inventory.some(g => !Object.prototype.hasOwnProperty.call(CRYOGENIC_MOLAR_MASS_KG, g.gas) ||
        !Number.isFinite(g.massColumnPressureEquivalentPascal) ||
        g.massColumnPressureEquivalentPascal < 0)) return null;
  const caps = inventory.map(g => cryogenicPressureCeiling(g.gas, kelvin)!);
  const molarMasses = inventory.map(g => CRYOGENIC_MOLAR_MASS_KG[g.gas]);
  const available = inventory.map(g => g.massColumnPressureEquivalentPascal);
  const mass = available.slice();
  const partialPressure = (i: number, speciesMass: number): number => {
    const totalMass = speciesMass + mass.reduce((v, m, j) => v + (j === i ? 0 : m), 0);
    const molarCount = speciesMass / molarMasses[i];
    const totalMoles = molarCount + mass.reduce((v, m, j) =>
      v + (j === i ? 0 : m / molarMasses[j]), 0);
    return totalMoles > 0 ? molarCount / totalMoles * totalMass : 0;
  };
  // Monotone Gauss–Seidel: condensed molecules cannot reappear unless the
  // temperature or TOTAL available reservoir changes on the next climate pass.
  for (let sweep = 0; sweep < 128; sweep++) {
    let largestChange = 0;
    for (let i = 0; i < mass.length; i++) {
      const cap = caps[i];
      if (!Number.isFinite(cap) || partialPressure(i, mass[i]) <= cap) continue;
      let low = 0;
      let high = mass[i];
      for (let k = 0; k < 65; k++) {
        const mid = (low + high) / 2;
        if (partialPressure(i, mid) > cap) high = mid;
        else low = mid;
      }
      largestChange = Math.max(largestChange, mass[i] - low);
      mass[i] = low;
    }
    if (largestChange <= 1e-13 * Math.max(1, mass.reduce((a, b) => a + b, 0))) break;
  }
  const totalMass = mass.reduce((a, b) => a + b, 0);
  const moles = mass.map((m, i) => m / molarMasses[i]);
  const totalMoles = moles.reduce((a, b) => a + b, 0);
  return Object.freeze(inventory.map((g, i) => Object.freeze({
    gas: g.gas,
    gasMassColumnPressureEquivalentPascal: mass[i],
    condensedMassColumnPressureEquivalentPascal: available[i] - mass[i],
    gasMoleFraction01: totalMoles > 0 ? moles[i] / totalMoles : 0,
    gasPartialPressurePascal: totalMoles > 0 ? totalMass * moles[i] / totalMoles : 0,
    saturationPressurePascal: caps[i],
  })));
}
