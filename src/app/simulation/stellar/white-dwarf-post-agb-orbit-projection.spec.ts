import { projectWhiteDwarfPostAgbOrbit, type WhiteDwarfOrbitContext } from './white-dwarf-post-agb-orbit-projection';

const sample = (context: WhiteDwarfOrbitContext = 'BINARY_S') => ({
  evolutionStateName: 'WHITE_DWARF', context,
  initialHostMassSolar: 1.65, currentHostMassSolar: 0.55,
  formationSemiMajorAxisAu: 1.819, formationEccentricity: 0.029,
  currentWhiteDwarfLuminositySolar: 1.73e-5,
  explosiveReconfiguration: false,
});

describe('29.1E-H3 — post-AGB orbital hypothesis is NOT a canonical orbit', () => {
  it.each(['SINGLE', 'BINARY_S', 'TRIPLE_S'] as const)('calculates an adiabatic %s hypothesis without asserting survival', context => {
    const input = Object.freeze(sample(context));
    const first = projectWhiteDwarfPostAgbOrbit(input)!;
    expect(first.hypotheticalSemiMajorAxisAu).toBeCloseTo(1.819 * 3, 8);
    expect(first.hypotheticalEccentricity).toBe(input.formationEccentricity);
    expect(first.hypotheticalPeriodYears).toBeCloseTo(Math.sqrt((1.819 * 3) ** 3 / 0.55), 8);
    expect(first.hypotheticalHostMeanInsolationEarth).toBeCloseTo(
      1.73e-5 / ((1.819 * 3) ** 2 * Math.sqrt(1 - 0.029 ** 2)), 12);
    expect(first.survivalResolved).toBe(false);
    expect(first.stabilityResolved).toBe(false);
    expect(first.companionHierarchyResolved).toBe(false);
    expect(first).toEqual(projectWhiteDwarfPostAgbOrbit(input));
    expect(Object.isFrozen(first)).toBe(true);
    expect(input.formationSemiMajorAxisAu).toBe(1.819);
  });
  it('refuses P-type without a barycentric mass-loss / stability model', () => {
    expect(projectWhiteDwarfPostAgbOrbit(sample('P_TYPE'))).toBeNull();
  });
  it.each(['NEUTRON_STAR', 'STELLAR_BLACK_HOLE', 'MAIN_SEQUENCE'])('never changes %s', name => {
    expect(projectWhiteDwarfPostAgbOrbit({...sample(), evolutionStateName: name})).toBeNull();
  });
  it('refuses an explosive reconfiguration and missing or unphysical mass', () => {
    expect(projectWhiteDwarfPostAgbOrbit({...sample(), explosiveReconfiguration: true})).toBeNull();
    expect(projectWhiteDwarfPostAgbOrbit({...sample(), initialHostMassSolar: null})).toBeNull();
    expect(projectWhiteDwarfPostAgbOrbit({...sample(), currentHostMassSolar: 2})).toBeNull();
    expect(projectWhiteDwarfPostAgbOrbit({...sample(), formationEccentricity: 1})).toBeNull();
  });
  it('cannot conjure a luminosity or an insolation when the current WD luminosity is unknown', () => {
    expect(projectWhiteDwarfPostAgbOrbit({...sample(), currentWhiteDwarfLuminositySolar: null})
      ?.hypotheticalHostMeanInsolationEarth).toBeNull();
  });
  it('preserves visible Musia and Xiria physical snapshots without impersonating their unknown real seed', () => {
    for (const data of [
      {mass:0.554, lum:1.73e-5, a:1.819, e:0.029},
      {mass:0.580, lum:1.57e-5, a:4.583, e:0.025},
    ]) {
      const result = projectWhiteDwarfPostAgbOrbit({
        evolutionStateName:'WHITE_DWARF', context:'BINARY_S',
        initialHostMassSolar:1.5, currentHostMassSolar:data.mass,
        formationSemiMajorAxisAu:data.a, formationEccentricity:data.e,
        currentWhiteDwarfLuminositySolar:data.lum, explosiveReconfiguration:false,
      });
      expect(result?.hypotheticalSemiMajorAxisAu).toBeGreaterThan(data.a);
      expect(result?.hypotheticalHostMeanInsolationEarth).toBeGreaterThan(0);
    }
  });
});
