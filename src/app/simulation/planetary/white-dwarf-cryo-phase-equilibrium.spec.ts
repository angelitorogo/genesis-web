import { cryogenicPressureCeiling, equilibrateCryogenicGasColumns } from './white-dwarf-cryo-phase-equilibrium';

const fixed = (gas: string, massColumnPressureEquivalentPascal: number) =>
  ({gas, massColumnPressureEquivalentPascal});

describe('29.1E-H5-A.1 cryogenic solid–gas pressure and atmospheric mass-column semantics', () => {
  it('uses nitrogen solid sublimation below its 63.151 K triple point, not a 38.68 K plateau', () => {
    const p33 = cryogenicPressureCeiling('NITROGEN', 32.9)!;
    const p38 = cryogenicPressureCeiling('NITROGEN', 38)!;
    const pTriple = cryogenicPressureCeiling('NITROGEN', 63.151)!;
    expect(p33).toBeGreaterThan(0);
    expect(p33).toBeLessThan(0.5); // Original H4 floor permitted ~15 Pa of N2.
    expect(p38).toBeGreaterThan(p33);
    expect(pTriple).toBeCloseTo(12523, 4);
    expect(cryogenicPressureCeiling('NITROGEN', 28)!).toBeLessThan(p33);
  });
  it('anchors Ar/CO and CO2 and does not falsely solidify helium at 33–38 K', () => {
    expect(cryogenicPressureCeiling('ARGON', 83.8058)).toBeCloseTo(68891, 3);
    expect(cryogenicPressureCeiling('CARBON_MONOXIDE', 68.1)).toBeCloseTo(15370, 3);
    expect(cryogenicPressureCeiling('CARBON_DIOXIDE', 216.59)).toBeCloseTo(517000, 2);
    expect(cryogenicPressureCeiling('ARGON', 32.9)!).toBeLessThan(0.1);
    expect(cryogenicPressureCeiling('CARBON_MONOXIDE', 32.9)!).toBeLessThan(1);
    expect(cryogenicPressureCeiling('HELIUM', 37.5)).toBe(Infinity);
    expect(cryogenicPressureCeiling('HYDROGEN', 37.5)!).toBeGreaterThan(100000);
    expect(cryogenicPressureCeiling('UNMODELED_GAS', 35)).toBeNull();
  });
  it('solves saturated partial pressure using evolving mole fractions, not progenitor mean molecular mass', () => {
    const source = Object.freeze([
      fixed('HELIUM', 85000), fixed('NITROGEN', 45000),
      fixed('CARBON_MONOXIDE', 30000), fixed('ARGON', 20000),
    ]);
    const result = equilibrateCryogenicGasColumns(source, 32.9)!;
    const again = equilibrateCryogenicGasColumns(source, 32.9)!;
    expect(result).toEqual(again);
    expect(Object.isFrozen(result)).toBe(true);
    const pressure = result.reduce((a, g) => a + g.gasMassColumnPressureEquivalentPascal, 0);
    const partials = result.reduce((a, g) => a + g.gasPartialPressurePascal, 0);
    expect(partials).toBeCloseTo(pressure, 7);
    for (let i = 0; i < source.length; i++) {
      const gas = result[i];
      expect(gas.gasMassColumnPressureEquivalentPascal + gas.condensedMassColumnPressureEquivalentPascal)
        .toBeCloseTo(source[i].massColumnPressureEquivalentPascal, 7);
      expect(gas.gasPartialPressurePascal).toBeLessThanOrEqual(gas.saturationPressurePascal + 1e-8);
    }
    expect(result.find(g => g.gas === 'HELIUM')!.condensedMassColumnPressureEquivalentPascal).toBe(0);
    expect(result.find(g => g.gas === 'NITROGEN')!.gasPartialPressurePascal)
      .toBeLessThan(0.5);
    expect(result.find(g => g.gas === 'HELIUM')!.gasMoleFraction01).toBeGreaterThan(0.99);
  });
  it('does not invent gas for an empty column or accept invalid / duplicate species', () => {
    const zero = equilibrateCryogenicGasColumns([fixed('NITROGEN', 0)], 33)!;
    expect(zero[0].gasPartialPressurePascal).toBe(0);
    expect(zero[0].gasMassColumnPressureEquivalentPascal).toBe(0);
    expect(equilibrateCryogenicGasColumns([fixed('NITROGEN', 1), fixed('NITROGEN', 2)], 33)).toBeNull();
    expect(equilibrateCryogenicGasColumns([fixed('UNKNOWN', 1)], 33)).toBeNull();
    expect(equilibrateCryogenicGasColumns([fixed('NITROGEN', -1)], 33)).toBeNull();
  });
});
