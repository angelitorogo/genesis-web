import { projectWhiteDwarfPostAgbAtmosphereScenario } from './white-dwarf-post-agb-atmosphere-projection';
import { projectWhiteDwarfPostAgbAtmosphereHistory } from './white-dwarf-post-agb-atmosphere-history';
import { assessWhiteDwarfPostAgbPlanetarySurvival } from './white-dwarf-post-agb-planetary-survival';
import { assessWhiteDwarfPostAgbEnvironmentalResolution as assess } from './white-dwarf-post-agb-environment-resolution';

const gasInventory = Object.freeze([
  Object.freeze({ gas: 'HYDROGEN', moleFraction01: 0.45 }),
  Object.freeze({ gas: 'HELIUM', moleFraction01: 0.55 }),
]);
const atmosphere = projectWhiteDwarfPostAgbAtmosphereScenario({
  isWhiteDwarf: true,
  postAgbOrbitHypothesisAvailable: true,
  progenitorReferencePressurePascal: 1_281_021.912,
  progenitorGasComposition: gasInventory,
  massEarth: 1.876,
  radiusEarth: 1.273,
  coolingAgeBillionYears: 9.803,
  airlessReferenceTemperatureKelvin: 37.5,
  companionIrradiationUnresolved: true,
})!;
const history = projectWhiteDwarfPostAgbAtmosphereHistory({
  isWhiteDwarf: true,
  postAgbOrbitHypothesisAvailable: true,
  initialStellarMassSolar: 1.7,
  currentWhiteDwarfMassSolar: 0.58,
  progenitorTerminalAgeBillionYears: 1.4,
  postMainSequenceDurationBillionYears: 0.3,
  coolingAgeBillionYears: 9.803,
  presentWhiteDwarfLuminositySolar: 1.57e-5,
  formationSemiMajorAxisAu: 4.583,
  hypotheticalPostAgbSemiMajorAxisAu: 13.461,
  planetRadiusEarth: 1.273,
  referenceAtmospherePressurePascal: 1_281_021.912,
  h4WdOnlyGasPressureCeilingPascal: atmosphere.scenarioGasPressureCeilingPascal,
  companionIrradiationUnresolved: true,
})!;
const survival = assessWhiteDwarfPostAgbPlanetarySurvival({
  isWhiteDwarf: true,
  hasConditionalAdiabaticOrbit: true,
  history,
  formationEccentricity: 0.025,
  planetMassEarth: 1.876,
  planetRadiusEarth: 1.273,
  priorAtmosphere: gasInventory,
})!;
const reference = Object.freeze({
  canonicalPlanetExists: true,
  isWhiteDwarfCircumstellar: true,
  orbitIsHypotheticalNotValidated: true,
  actualCurrentAtmosphereReassessmentApplied: false,
  scenario: atmosphere,
  history,
  survival,
  currentTotalIrradiationUpperEarth: null,
});

describe('29.1E-H4d — canonical existence and conditional environmental resolution', () => {
  it('reconciles named escape scenarios without assigning a current atmosphere', () => {
    const result = assess(reference)!;
    expect(result).not.toBeNull();
    expect(result.planetCanonicalStatus).toBe('PRESENT_IN_GENERATED_GROUND_TRUTH');
    expect(result.evolutionarySurvivalExplanation).toBe('NOT_RECONSTRUCTED');
    expect(result.presentOrbitStatus).toBe('NOT_VALIDATED_ADIABATIC_HYPOTHESIS_ONLY');
    expect(result.presentAtmosphereStatus).toBe('UNRESOLVED_CONDITIONAL_SCENARIOS_ONLY');
    expect(result.presentClimateStatus).toBe('UNRESOLVED_CONDITIONAL_THERMAL_FLOOR_ONLY');
    expect(result.atmosphericFieldsMayBePromotedToCurrent).toBe(false);
    expect(result.canonicalAggregateWasMutated).toBe(false);
    expect(result.scenariosDisagreeOnAtmosphericPresence).toBe(true);
    expect(result.pressureByEscapeHypothesis).toHaveLength(history.scenarios.length);
    expect(result.combinedScenarioPressureRangePascal[0]).toBe(0);
    expect(result.combinedScenarioPressureRangePascal[1])
      .toBeLessThanOrEqual(atmosphere.scenarioGasPressureCeilingPascal);
    expect(result.escapeSusceptibleGasSpeciesAtHypotheticalHotExobase)
      .toEqual(['HYDROGEN', 'HELIUM']);
    expect(result.missingConstraints).toContain('MULTIHOST_ORBIT_AND_STABILITY');
  });

  it('is deterministic and cannot mutate H4/H4b/H4c source objects', () => {
    const before = JSON.stringify({ atmosphere, history, survival });
    const result = assess(reference)!;
    expect(result).toEqual(assess(reference));
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.pressureByEscapeHypothesis)).toBe(true);
    expect(Object.isFrozen(result.missingConstraints)).toBe(true);
    expect(JSON.stringify({ atmosphere, history, survival })).toBe(before);
  });

  it('does not declare an atmosphere from an assumed giant-envelope intersection', () => {
    const crossed = Object.freeze({
      ...survival,
      directEnvelopeIntersection: 'IN_ALL_ASSUMED_GIANT_TEMPERATURE_CASES' as const,
    });
    const result = assess({ ...reference, survival: crossed })!;
    expect(result.assumedEnvelopeCrossing).toBe('IN_ALL_ASSUMED_GIANT_TEMPERATURE_CASES');
    expect(result.planetCanonicalStatus).toBe('PRESENT_IN_GENERATED_GROUND_TRUTH');
    expect(result.evolutionarySurvivalExplanation).toBe('NOT_RECONSTRUCTED');
    expect(result.conditionalEnvelopeHypothesisInTensionWithCanonicalPresence).toBe(true);
    expect(result.atmosphericFieldsMayBePromotedToCurrent).toBe(false);
  });

  it('never runs for ungenerated, non-WD, P-type/unreconstructed or reassessed worlds', () => {
    expect(assess({ ...reference, canonicalPlanetExists: false })).toBeNull();
    expect(assess({ ...reference, isWhiteDwarfCircumstellar: false })).toBeNull();
    expect(assess({ ...reference, orbitIsHypotheticalNotValidated: false })).toBeNull();
    expect(assess({ ...reference, actualCurrentAtmosphereReassessmentApplied: true })).toBeNull();
    expect(assess({ ...reference, scenario: null })).toBeNull();
    expect(assess({ ...reference, history: null })).toBeNull();
    expect(assess({ ...reference, survival: null })).toBeNull();
  });

  it('rejects inconsistent scenario pressure bounds instead of propagating a misleading range', () => {
    const invalidHistory = {
      ...history, scenarios: [
        { ...history.scenarios[0],
          afterH4CryocondensationCeilingRangePascal: [
            0, atmosphere.scenarioGasPressureCeilingPascal + 100,
          ] as const },
      ],
    };
    expect(assess({ ...reference, history: invalidHistory })).toBeNull();
    expect(assess({ ...reference, currentTotalIrradiationUpperEarth: Number.NaN })).toBeNull();
  });
});
