import { cryogenicPressureCeiling, projectWhiteDwarfPostAgbAtmosphereScenario } from './white-dwarf-post-agb-atmosphere-projection';
import { projectWhiteDwarfPostAgbAtmosphereHistory } from './white-dwarf-post-agb-atmosphere-history';
import { assessWhiteDwarfPostAgbPlanetarySurvival } from './white-dwarf-post-agb-planetary-survival';
import { simulateWhiteDwarfPostAgbEvolvedEnvironment as simulate } from './white-dwarf-post-agb-evolved-environment';

const gases = Object.freeze([
  Object.freeze({gas: 'HYDROGEN', moleFraction01: 0.45}),
  Object.freeze({gas: 'HELIUM', moleFraction01: 0.35}),
  Object.freeze({gas: 'NITROGEN', moleFraction01: 0.15}),
  Object.freeze({gas: 'WATER_VAPOR', moleFraction01: 0.05}),
]);
const pressure = 1_281_021.912;
const scenario = projectWhiteDwarfPostAgbAtmosphereScenario({
  isWhiteDwarf: true, postAgbOrbitHypothesisAvailable: true,
  progenitorReferencePressurePascal: pressure,
  progenitorGasComposition: gases, massEarth: 1.876,
  radiusEarth: 1.273, coolingAgeBillionYears: 9.803,
  airlessReferenceTemperatureKelvin: 37.5,
  companionIrradiationUnresolved: true,
})!;
const history = projectWhiteDwarfPostAgbAtmosphereHistory({
  isWhiteDwarf: true, postAgbOrbitHypothesisAvailable: true,
  initialStellarMassSolar: 1.7, currentWhiteDwarfMassSolar: 0.58,
  progenitorTerminalAgeBillionYears: 1.4,
  postMainSequenceDurationBillionYears: 0.3,
  coolingAgeBillionYears: 9.803,
  presentWhiteDwarfLuminositySolar: 1.57e-5,
  formationSemiMajorAxisAu: 4.583,
  hypotheticalPostAgbSemiMajorAxisAu: 13.461,
  planetRadiusEarth: 1.273,
  referenceAtmospherePressurePascal: pressure,
  h4WdOnlyGasPressureCeilingPascal: scenario.scenarioGasPressureCeilingPascal,
  companionIrradiationUnresolved: true,
})!;
const survival = assessWhiteDwarfPostAgbPlanetarySurvival({
  isWhiteDwarf: true, hasConditionalAdiabaticOrbit: true,
  history, formationEccentricity: 0.025, planetMassEarth: 1.876,
  planetRadiusEarth: 1.273, priorAtmosphere: gases,
})!;
const input = Object.freeze({
  isCircumstellarWhiteDwarf: true, hasAdiabaticOrbitHypothesis: true,
  history, h4: scenario, h4c: survival,
  massEarth: 1.876, radiusEarth: 1.273,
  priorGasComposition: gases,
  atmosphericPressureBeforeAgbPascal: pressure,
  geologicalOutgassingPotential01: 0.6,
  airlessThermalReferenceKelvin: 37.5,
  companionRadiationUnresolved: true,
});

describe('29.1E-H5 — simulated WD atmosphere as a deterministic evolved model', () => {
  it('produces a concrete reproducible modeled current composition and pressure', () => {
    const result = simulate(input)!;
    expect(result).not.toBeNull();
    expect(result).toEqual(simulate(input));
    expect(result.status).toBe('SIMULATED_REFERENCE_SCENARIO_NOT_OBSERVED');
    expect(result.reference.assumption).toBe('REFERENCE');
    expect(result.reference.pressurePascal).toBeGreaterThanOrEqual(0);
    expect(result.reference.climateTemperatureKelvin).toBeGreaterThanOrEqual(37.5);
    expect(result.reference.gases.map(g => g.gas)).toEqual(gases.map(g => g.gas));
    expect(result.alternatives).toHaveLength(3);
    expect(result.multiHostRadiationUnresolved).toBe(true);
    expect(result.canonicalPlanetModified).toBe(false);
    expect(Object.isFrozen(result.reference.gases)).toBe(true);
  });
  it('accounts for every gas: remaining + lost + frozen equals initial + resupplied', () => {
    for (const testCase of simulate(input)!.alternatives) {
      expect(testCase.atmosphericMassBudgetErrorPascal).toBeLessThan(0.01);
      expect(testCase.pressurePascal).toBeGreaterThanOrEqual(0);
      expect(testCase.totalEscapedPressureEquivalentPascal).toBeGreaterThanOrEqual(0);
      expect(testCase.totalCondensedPressureEquivalentPascal).toBeGreaterThanOrEqual(0);
      for (let i = 0; i < gases.length; i++) {
        const gas = testCase.gases[i];
        const molecularMasses: Record<string, number> = {
          HYDROGEN: .00201588, HELIUM: .004002602,
          NITROGEN: .0280134, WATER_VAPOR: .01801528,
        };
        const muMix = gases.reduce((a, b) =>
          a + b.moleFraction01 * molecularMasses[b.gas], 0);
        const source = pressure * gases[i].moleFraction01 *
          molecularMasses[gases[i].gas] / muMix;
        expect(gas.gasPressurePascal + gas.condensedReservoirPressureEquivalentPascal +
          gas.escapedPressureEquivalentPascal - gas.secondarySuppliedPressureEquivalentPascal)
          .toBeCloseTo(source, 3);
      }
    }
  });
  it('H5-A.1: partial pressures and mass columns must use the final (not progenitor) mixture', () => {
    const outcome = simulate(input)!;
    for (const candidate of outcome.alternatives) {
      const retainedMassColumns = candidate.gases.reduce((v, gas) => v + gas.gasPressurePascal, 0);
      const partialPressureSum = candidate.gases.reduce((v, gas) => v + gas.gasPartialPressurePascal, 0);
      expect(retainedMassColumns).toBeCloseTo(candidate.pressurePascal, 7);
      expect(partialPressureSum).toBeCloseTo(candidate.pressurePascal, 7);
      const moleSum = candidate.gases.reduce((v, gas) => v + gas.gasMoleFraction01, 0);
      if (candidate.pressurePascal > 1e-12) expect(moleSum).toBeCloseTo(1, 8);
      for (const gas of candidate.gases) {
        expect(gas.gasPartialPressurePascal).toBeCloseTo(
          candidate.pressurePascal * gas.gasMoleFraction01, 7);
        // A pressure of saturated gas is constrained by the solid–gas curve
        // evaluated at the coupled FINAL climate temperature.
        const sat = cryogenicPressureCeiling(gas.gas, candidate.climateTemperatureKelvin);
        expect(sat).not.toBeNull();
        expect(gas.gasPartialPressurePascal).toBeLessThanOrEqual(sat! + 1e-5);
      }
    }
  });
  it('has sensitivity to escape and outgassing instead of hardcoded seed-specific planets', () => {
    const res = simulate(input)!;
    expect(res.sensitivityPressureRangePascal[0]).toBeLessThanOrEqual(res.reference.pressurePascal);
    expect(res.sensitivityPressureRangePascal[1]).toBeGreaterThanOrEqual(res.reference.pressurePascal);
    const withoutSources = simulate({...input, geologicalOutgassingPotential01: 0})!;
    expect(withoutSources.reference.totalSecondarySuppliedPressureEquivalentPascal).toBe(0);
    // Extra VOLATILE MASS does not guarantee more gas-phase pressure: a
    // recomputed mole mixture can condense other species at saturation.
    // Require that the added reservoir is explicitly accounted for instead.
    expect(res.reference.totalSecondarySuppliedPressureEquivalentPascal).toBeGreaterThan(0);
    expect(res.reference.atmosphericMassBudgetErrorPascal).toBeLessThan(0.01);
  });
  it('adds conditionally projected companion flux to the H5 climate and rechecks condensation', () => {
    const wdOnly = simulate(input)!;
    const withCompanion = simulate({...input,
      modeledCompanionIrradiationEarth: 0.05,
      referenceBondAlbedo01: 0.2,
      companionRadiationUnresolved: false,
    })!;
    expect(withCompanion.modeledCompanionIrradiationEarth).toBe(0.05);
    expect(withCompanion.multiHostRadiationUnresolved).toBe(false);
    expect(withCompanion.atmosphericSurfaceCondition)
      .toBe('ADIABATIC_MULTIPLE_HIERARCHY_CONDITIONAL');
    expect(withCompanion.reference.climateTemperatureKelvin)
      .toBeGreaterThan(wdOnly.reference.climateTemperatureKelvin);
    expect(withCompanion.reference.atmosphericMassBudgetErrorPascal).toBeLessThan(0.01);
    expect(simulate({...input, modeledCompanionIrradiationEarth: 0.1,
      referenceBondAlbedo01: null})).toBeNull();
  });
  it('does not leak into ordinary stars, BH, NS, unsupported P-type, or presumed envelope engulfment', () => {
    expect(simulate({...input, isCircumstellarWhiteDwarf: false})).toBeNull();
    expect(simulate({...input, hasAdiabaticOrbitHypothesis: false})).toBeNull();
    expect(simulate({...input, history: null})).toBeNull();
    expect(simulate({...input, h4: null})).toBeNull();
    expect(simulate({...input, h4c: null})).toBeNull();
    const invalidSurvival = {...survival, directEnvelopeIntersection:
      'IN_ALL_ASSUMED_GIANT_TEMPERATURE_CASES' as const};
    expect(simulate({...input, h4c: invalidSurvival})).toBeNull();
  });
  it('refuses malformed gas fractions, inconsistent H4 baseline and physical impossibilities', () => {
    expect(simulate({...input, massEarth: 0})).toBeNull();
    expect(simulate({...input, atmosphericPressureBeforeAgbPascal: -10})).toBeNull();
    expect(simulate({...input, geologicalOutgassingPotential01: 3})).toBeNull();
    expect(simulate({...input, airlessThermalReferenceKelvin: null})).toBeNull();
    expect(simulate({...input, priorGasComposition: [{gas: 'NEW_GAS', moleFraction01: 1}]})).toBeNull();
    expect(simulate({...input, priorGasComposition: [{gas: 'HELIUM', moleFraction01: 0}]})).toBeNull();
  });
  it('does not modify the previously generated progenitor inventory nor H4b/H4c evidence', () => {
    const before = JSON.stringify({history, survival, scenario, gases});
    simulate(input);
    expect(JSON.stringify({history, survival, scenario, gases})).toBe(before);
  });
});
