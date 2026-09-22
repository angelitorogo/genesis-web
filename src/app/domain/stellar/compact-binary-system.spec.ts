import { CompactBinaryMember, CompactBinarySystem } from './compact-binary-system';
import { StellarRelativeOrbit } from './stellar-relative-orbit';

const a: CompactBinaryMember = {
  label: 'A', componentSeedHex: 'A'.repeat(32), remnantKind: 'NEUTRON_STAR',
  massSolar: 1.4, referenceRadiusKm: 12, formationAgeBillionYears: 0.02,
  currentAgeBillionYears: 1,
};
const b: CompactBinaryMember = {
  label: 'B', componentSeedHex: 'B'.repeat(32), remnantKind: 'STELLAR_BLACK_HOLE',
  massSolar: 8, referenceRadiusKm: 23.63, formationAgeBillionYears: 0.005,
  currentAgeBillionYears: 1,
};
const orbit = new StellarRelativeOrbit(0.04, 0.12, 0.04);
const build = (first = a, second = b, inner = orbit) =>
  new CompactBinarySystem('C'.repeat(32), first, second, inner);

describe('27.8 — physically read-only compact A-B system', () => {
  it('classifies the actual existing NS-BH pair with chirp mass and a new REMNANT period', () => {
    const result = build();
    expect(result.kind).toBe('NS_BH');
    expect(result.totalRemnantMassSolar).toBeCloseTo(9.4);
    expect(result.chirpMassSolar).toBeCloseTo((1.4 * 8) ** 0.6 / 9.4 ** 0.2, 10);
    expect(result.remnantKeplerPeriodDays).toBeGreaterThan(0);
    expect(result.remnantKeplerPeriodDays).not.toBeCloseTo(orbit.periodDays, 4);
    expect(result.originalInnerOrbit).toBe(orbit);
    expect(result.periastronAu).toBeCloseTo(orbit.periastronAu);
    expect(result.referenceCircularInspiralYears).toBeGreaterThan(0);
    expect(result.componentAgesAgree).toBe(true);
  });

  it('recognizes WD-WD, WD-NS, WD-BH, NS-NS and BH-BH without creating another body', () => {
    const white: CompactBinaryMember = { ...a, remnantKind: 'WHITE_DWARF', massSolar: 0.62, referenceRadiusKm: 7_000 };
    const neutron: CompactBinaryMember = { ...b, remnantKind: 'NEUTRON_STAR', massSolar: 1.8, referenceRadiusKm: 11.7 };
    const black: CompactBinaryMember = { ...b };
    expect(build(white, { ...white, label: 'B', componentSeedHex: 'B'.repeat(32) }).kind).toBe('WD_WD');
    expect(build(white, neutron).kind).toBe('WD_NS');
    expect(build(white, black).kind).toBe('WD_BH');
    expect(build(a, neutron).kind).toBe('NS_NS');
    expect(build({ ...black, label: 'A', componentSeedHex: 'A'.repeat(32) }, black).kind).toBe('BH_BH');
  });

  it('uses the circular formula as a reference, never a merger event or eccentric prediction', () => {
    const eccentric = build(a, b, new StellarRelativeOrbit(0.04, 0.65, 0.04));
    expect(eccentric.referenceCircularInspiralYears).toBeCloseTo(build().referenceCircularInspiralYears);
    expect('mergerDate' in eccentric).toBe(false);
    expect('massTransferConfirmed' in eccentric).toBe(false);
    expect('observed' in eccentric).toBe(false);
  });

  it('preserves original member values, locks snapshots, and reports mismatched ages', () => {
    const first = { ...a };
    const second = { ...b, currentAgeBillionYears: 0.5 };
    const result = build(first, second);
    first.massSolar = 2;
    expect(result.primary.massSolar).toBe(1.4);
    expect(result.componentAgesAgree).toBe(false);
    expect(Object.isFrozen(result.primary)).toBe(true);
    expect(Object.isFrozen(result.secondary)).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(orbit)).toBe(false);
  });

  it('rejects a single source masquerading as two components and invalid remnant input', () => {
    expect(() => build(a, { ...b, componentSeedHex: a.componentSeedHex })).toThrow(RangeError);
    expect(() => build({ ...a, label: 'B' }, b)).toThrow(RangeError);
    expect(() => build(a, { ...b, massSolar: Number.NaN })).toThrow(RangeError);
    expect(() => build(a, { ...b, formationAgeBillionYears: 2 })).toThrow(RangeError);
    expect(() => build(a, { ...b, remnantKind: 'WHITE_DWARF', massSolar: 2 })).toThrow(RangeError);
    expect(() => new CompactBinarySystem('invalid', a, b, orbit)).toThrow(RangeError);
  });

  it('refuses detached binary configurations with overlapping physical surfaces', () => {
    expect(() => build(a, { ...b, remnantKind: 'WHITE_DWARF', massSolar: 0.6, referenceRadiusKm: 7000 },
      new StellarRelativeOrbit(0.00002, 0.5, 0.000001))).toThrow(RangeError);
  });
});
