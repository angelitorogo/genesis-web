import { StellarCompactHostPlanetaryCoherence } from './stellar-compact-host-planetary-coherence';
import { projectWhiteDwarfConditionalThermalEnvelope } from '../planetary/white-dwarf-conditional-thermal-envelope';

/** Exercise read-only multihost envelope against geometries, not random seeds. */
function bridge(triple: boolean, a: number | null, b: number | null, c: number | null = null) {
  const instance = Object.create(StellarCompactHostPlanetaryCoherence.prototype) as StellarCompactHostPlanetaryCoherence;
  Object.assign(instance, {
    formation: {
      components: triple ? [{label: 'A'}, {label: 'B'}, {label: 'C'}] : [{label: 'A'}, {label: 'B'}],
      innerOrbit: {periastronAu: 300, apoastronAu: 370},
      outerOrbit: triple ? {periastronAu: 2000, apoastronAu: 2450} : null,
    },
    stateFor: (label: string) => ({currentLuminositySolar: label === 'A' ? a : label === 'B' ? b : c}),
  });
  return instance;
}

describe('29.1E-H2 - S-type multihost companion bounds', () => {
  it('a binary WD B sees bounded companion A without modifying either source', () => {
    const model = bridge(false, 1, 1.73e-5);
    const result = model.companionRadiativeBoundEarth('B', 1.819, 0.029);
    expect(result.lowerEarth).toBeGreaterThan(0);
    expect(result.upperEarth).toBeGreaterThan(result.lowerEarth);
    const thermal = projectWhiteDwarfConditionalThermalEnvelope({
      currentWhiteDwarfLuminositySolar: 1.73e-5,
      planetSemiMajorAxisAu: 1.819, planetEccentricity: 0.029,
      referenceBondAlbedo01: 0.138, intrinsicHeatFluxWattsPerSquareMeter: 0.066,
      companionRadiativeBound: result,
    });
    expect(thermal?.equilibriumUpperKelvin).toBeGreaterThan(thermal?.equilibriumLowerKelvin ?? 0);
    expect(model.companionRadiativeBoundEarth('B', 1.819, 0.029)).toEqual(result);
  });

  it('triple C includes both A/B with unresolved phase offsets', () => {
    const model = bridge(true, 1, 0.7, 1.57e-5);
    const result = model.companionRadiativeBoundEarth('C', 4.583, 0.025);
    expect(result.lowerEarth).toBeGreaterThan(0);
    expect(result.upperEarth).toBeGreaterThan(result.lowerEarth);
  });

  it('triple B includes A inner and C outer; unknown C leaves upper unresolved', () => {
    const model = bridge(true, 1, 1.73e-5, null);
    const result = model.companionRadiativeBoundEarth('B', 1.819, 0.029);
    expect(result.lowerEarth).toBeGreaterThan(0);
    expect(result.upperEarth).toBeNull();
    expect(result.unresolvedSource).toBe(true);
  });

  it('refuses invalid planetary geometry without touching formation', () => {
    const model = bridge(false, 1, 1.73e-5);
    expect(() => model.companionRadiativeBoundEarth('B', 1, 1)).toThrow(RangeError);
  });
});
