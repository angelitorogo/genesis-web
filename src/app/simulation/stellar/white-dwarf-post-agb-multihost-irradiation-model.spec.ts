import { projectH5MultiHostCompanionIrradiation as project } from './white-dwarf-post-agb-multihost-irradiation-model';

const ab = Object.freeze({
  host: 'B' as const,
  components: Object.freeze([
    Object.freeze({label: 'A' as const, initialMassSolar: 1.1,
      currentMassSolar: 1.1, currentLuminositySolar: 1.1}),
    Object.freeze({label: 'B' as const, initialMassSolar: 1.7,
      currentMassSolar: .58, currentLuminositySolar: 1.5e-5}),
  ]),
  innerOrbit: Object.freeze({semiMajorAxisAu: 500, eccentricity: .12}),
  outerOrbit: null,
  projectedPlanetSemiMajorAxisAu: 13.46,
  planetaryEccentricity: .025,
});

describe('29.1E-H5 conditional S-type A/B/C companion irradiation', () => {
  it('projects binary relative orbit by total stellar mass loss, not the planetary host mass alone', () => {
    const result = project(ab)!;
    expect(result).not.toBeNull();
    const axis = 500 * (1.1 + 1.7) / (1.1 + .58);
    expect(result.innerRelativeAxisAu).toBeCloseTo(axis, 9);
    expect(result.companionMeanFluxEarth).toBeCloseTo(
      1.1 / (axis * axis * Math.sqrt(1 - .12 ** 2)), 10);
    expect(result.stabilityValidated).toBe(false);
    expect(result.geometryWasProjected).toBe(true);
    expect(result).toEqual(project(ab));
  });
  it('supports C-type and triple outer hierarchy without changing AB ground truth', () => {
    const triple = {...ab, components: [
      ...ab.components, {label: 'C' as const,
        initialMassSolar: .9, currentMassSolar: .9, currentLuminositySolar: .7}],
      outerOrbit: {semiMajorAxisAu: 4000, eccentricity: .18}};
    const b = project(triple)!;
    const c = project({...triple, host: 'C' as const})!;
    expect(b).not.toBeNull();
    expect(c).not.toBeNull();
    expect(b.outerRelativeAxisAu).toBeGreaterThan(4000);
    expect(b.companionMeanFluxEarth).toBeGreaterThan(project(ab)!.companionMeanFluxEarth);
    expect(c.companionMeanFluxEarth).toBeGreaterThan(0);
  });
  it('does not infer unknown emission or unstable close-approach geometry', () => {
    expect(project({...ab, components: [ab.components[0],
      {...ab.components[1], currentLuminositySolar: null}]})).toBeNull();
    expect(project({...ab, projectedPlanetSemiMajorAxisAu: 900})).toBeNull();
    expect(project({...ab, innerOrbit: {semiMajorAxisAu: 500, eccentricity: .9}})).toBeNull();
    expect(project({...ab, host: 'C'})).toBeNull();
  });
});
