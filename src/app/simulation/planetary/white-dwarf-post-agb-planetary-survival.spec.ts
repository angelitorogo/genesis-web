import { projectWhiteDwarfPostAgbAtmosphereHistory } from './white-dwarf-post-agb-atmosphere-history';
import { assessWhiteDwarfPostAgbPlanetarySurvival as assess } from './white-dwarf-post-agb-planetary-survival';

const historyInput = Object.freeze({
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
  h4WdOnlyGasPressureCeilingPascal: 36_555.703,
  companionIrradiationUnresolved: true,
});
const history = projectWhiteDwarfPostAgbAtmosphereHistory(historyInput)!;
const reference = Object.freeze({
  isWhiteDwarf: true,
  hasConditionalAdiabaticOrbit: true,
  history,
  formationEccentricity: 0.025,
  planetMassEarth: 1.876,
  planetRadiusEarth: 1.273,
  priorAtmosphere: Object.freeze([
    Object.freeze({ gas: 'HYDROGEN', moleFraction01: 0.45 }),
    Object.freeze({ gas: 'HELIUM', moleFraction01: 0.55 }),
  ]),
});

describe('29.1E-H4c — isolated conditional giant-envelope and escape diagnostics', () => {
  it('computes finite giant radius hypotheses and keeps survival unresolved', () => {
    const result = assess(reference)!;
    expect(result).not.toBeNull();
    expect(result.kind).toBe('CONDITIONAL_RGB_AGB_SURVIVAL_AND_ESCAPE_V1');
    expect(result.formationPeriastronAu).toBeCloseTo(4.583 * 0.975, 9);
    expect(result.envelopeRadiusHypothesisAu[1]).toBeGreaterThan(result.envelopeRadiusHypothesisAu[0]);
    expect(result.directEnvelopeIntersection).toBe('NOT_IN_ASSUMED_GIANT_CASES');
    expect(result.planetSurvivalConfirmed).toBe(false);
    expect(result.stellarRadiusHistoryUnresolved).toBe(true);
    expect(result.tidesAndOrbitalStabilityUnresolved).toBe(true);
  });

  it('distinguishes direct overlap hypotheses without claiming actual engulfment', () => {
    const near = assess({ ...reference, formationEccentricity: 0.99 })!;
    expect(near.directEnvelopeIntersection).toBe('IN_ALL_ASSUMED_GIANT_TEMPERATURE_CASES');
    const middle = assess({ ...reference, formationEccentricity: 0.78 })!;
    expect(middle.directEnvelopeIntersection).toBe('POSSIBLE_WITH_ASSUMED_GIANT_PARAMETERS');
    expect(middle.planetSurvivalConfirmed).toBe(false);
  });

  it('makes H2 and He thermally vulnerable in the assumed hot exobase and leaves actual escape unknown', () => {
    const result = assess(reference)!;
    const hydrogen = result.speciesEscapeDiagnostics.find(g => g.gas === 'HYDROGEN')!;
    const helium = result.speciesEscapeDiagnostics.find(g => g.gas === 'HELIUM')!;
    expect(hydrogen.jeansParameterHotExobase).toBeLessThan(helium.jeansParameterHotExobase);
    expect(hydrogen.jeansParameterColdExobase).toBeGreaterThan(hydrogen.jeansParameterHotExobase);
    expect(hydrogen.thermallyMobileUnderHotExobaseHypothesis).toBe(true);
    expect(helium.thermallyMobileUnderHotExobaseHypothesis).toBe(true);
    expect(result.exobaseAndXuvHistoryUnresolved).toBe(true);
  });

  it('does not classify N2 as freely Jeans-escaping just from the hot-exobase hypothesis', () => {
    const result = assess({
      ...reference, priorAtmosphere: [{ gas: 'NITROGEN', moleFraction01: 1 }],
    })!;
    expect(result.speciesEscapeDiagnostics[0].thermallyMobileUnderHotExobaseHypothesis).toBe(false);
    expect(result.atmosphericCompositionCurrentUnresolved).toBe(true);
  });

  it('computes gas-replenishment REQUIREMENT without inventing a supply mechanism', () => {
    const result = assess(reference)!;
    expect(result.sourceInventoryMassKilograms).toBeGreaterThan(0);
    expect(result.meanSupplyToRebuildPriorInventoryKilogramsPerYear).toBeCloseTo(
      result.sourceInventoryMassKilograms / (history.coolingAgeBillionYears * 1e9), 10,
    );
    expect(result.planetaryPostWdOutgassingUnresolved).toBe(true);
  });

  it('is deterministic, frozen and does not mutate H4b or the gas inventory', () => {
    const before = JSON.stringify({ history, gases: reference.priorAtmosphere });
    const first = assess(reference)!;
    expect(first).toEqual(assess(reference));
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.speciesEscapeDiagnostics)).toBe(true);
    expect(JSON.stringify({ history, gases: reference.priorAtmosphere })).toBe(before);
  });

  it('does not apply to NS, BH, ordinary hosts, P-type or unsupported histories', () => {
    expect(assess({ ...reference, isWhiteDwarf: false })).toBeNull();
    expect(assess({ ...reference, hasConditionalAdiabaticOrbit: false })).toBeNull();
    expect(assess({ ...reference, history: null })).toBeNull();
    expect(assess({ ...reference, formationEccentricity: 1 })).toBeNull();
    expect(assess({ ...reference, priorAtmosphere: [{ gas: 'UNSUPPORTED', moleFraction01: 1 }] })).toBeNull();
  });
});
