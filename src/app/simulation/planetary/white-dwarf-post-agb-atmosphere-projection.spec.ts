import {cryogenicPressureCeiling, projectWhiteDwarfPostAgbAtmosphereScenario as project} from './white-dwarf-post-agb-atmosphere-projection';

const input = {
  isWhiteDwarf: true,
  postAgbOrbitHypothesisAvailable: true,
  progenitorReferencePressurePascal: 1.2e6,
  progenitorGasComposition: Object.freeze([
    {gas: 'NITROGEN', moleFraction01: 0.78},
    {gas: 'CARBON_DIOXIDE', moleFraction01: 0.2},
    {gas: 'ARGON', moleFraction01: 0.02},
  ]),
  massEarth: 1.876,
  radiusEarth: 1.273,
  coolingAgeBillionYears: 9.803,
  airlessReferenceTemperatureKelvin: 37.5,
  companionIrradiationUnresolved: true,
};

describe('29.1E-H4 WD post-AGB conditional atmospheric scenario', () => {
  it('produces a repeatable finite cryochemical scenario for Xiria without declaring a current atmosphere', () => {
    const a = project(input)!;
    expect(a).toEqual(project(input));
    expect(Object.isFrozen(a)).toBe(true);
    expect(Object.isFrozen(a.gasCeilings)).toBe(true);
    expect(a.scenarioGasPressureCeilingPascal).toBeGreaterThanOrEqual(0);
    expect(a.scenarioGasPressureCeilingPascal).toBeLessThan(input.progenitorReferencePressurePascal);
    expect(a.possiblePressureMinimumPascal).toBe(0);
    expect(a.survivalUnresolved).toBe(true);
    expect(a.currentPressureUnresolved).toBe(true);
    expect(a.currentWaterUnresolved).toBe(true);
    expect(a.volatileGasesWithCryogenicCondensation).toContain('NITROGEN');
    expect(a.greenhouseTemperatureCeilingKelvin).toBeGreaterThanOrEqual(37.5);
    expect(a.escapeVelocityKilometersPerSecond).toBeGreaterThan(11);
  });
  it('H5-A.1: at 32.9 K rejects the old fixed N2 vapour ceiling', () => {
    const at33 = project({...input, airlessReferenceTemperatureKelvin: 32.9})!;
    const at38 = project({...input, airlessReferenceTemperatureKelvin: 38})!;
    const n33 = at33.gasCeilings.find(g => g.gas === 'NITROGEN')!;
    expect(n33.gasPressureCeilingPascal).toBeLessThan(cryogenicPressureCeiling('NITROGEN', 32.9)! + 1e-6);
    expect(at38.gasCeilings.find(g => g.gas === 'NITROGEN')!.gasPressureCeilingPascal)
      .toBeGreaterThan(n33.gasPressureCeilingPascal);
    expect(at33.gasCeilings.reduce((v, g) => v + g.gasPressureCeilingPascal, 0))
      .toBeCloseTo(at33.scenarioGasPressureCeilingPascal, 6);
    expect(at33.gasCeilings.reduce((v, g) => v + g.gasFractionWithinCeiling01, 0)).toBeCloseTo(1, 8);
  });
  it('calculates independent Musia-like scenario without synthetic system identifiers', () => {
    const a = project({...input, massEarth: 0.749, radiusEarth: 0.948,
      coolingAgeBillionYears: 8.893, airlessReferenceTemperatureKelvin: 32.9});
    expect(a?.equilibriumTemperatureReferenceKelvin).toBe(32.9);
    expect(a?.coolingAgeBillionYears).toBe(8.893);
  });
  it('does not leak into normal stars, NS, BH or nonreconstructed P-type', () => {
    expect(project({...input, isWhiteDwarf: false})).toBeNull();
    expect(project({...input, postAgbOrbitHypothesisAvailable: false})).toBeNull();
  });
  it('rejects missing historical inventory instead of inventing gas, pressure or cooling age', () => {
    expect(project({...input, progenitorReferencePressurePascal: null})).toBeNull();
    expect(project({...input, coolingAgeBillionYears: null})).toBeNull();
    expect(project({...input, progenitorGasComposition: []})).toBeNull();
    expect(project({...input, airlessReferenceTemperatureKelvin: null})).toBeNull();
    expect(project({...input, massEarth: -2})).toBeNull();
  });
  it('keeps the progenitor gas inventory untouched while cryocondensing individual gases', () => {
    const gases = Object.freeze([{gas: 'OXYGEN', moleFraction01: 0.4},
      {gas: 'WATER_VAPOR', moleFraction01: 0.6}]);
    const before = JSON.stringify(gases);
    const projected = project({...input, progenitorGasComposition: gases});
    expect(JSON.stringify(gases)).toBe(before);
    expect(projected?.gasCeilings.map(g => g.gas)).toEqual(['OXYGEN','WATER_VAPOR']);
    expect(projected?.scenarioGasPressureCeilingPascal).toBeLessThan(input.progenitorReferencePressurePascal);
  });
  it('does not confuse WD-only scenario ceiling with an upper limit for real multihost irradiation', () => {
    const a = project(input)!;
    expect(a.companionIrradiationUnresolved).toBe(true);
    expect(a.kind).toBe('WD_ONLY_NO_REPLENISHMENT');
    expect(a.greenhouseTemperatureCeilingKelvin).toBeGreaterThanOrEqual(a.equilibriumTemperatureReferenceKelvin);
  });
});
