import { projectPostRemnantUnresolvedLuminosityThermalState } from '../planetary/post-remnant-unresolved-luminosity-thermal-projection';

/**
 * Simulation-only regression. Presentation and opaque-route checks live in
 * presentation/planet-detail/planet-post-remnant-partial-thermal-presentation.spec.ts.
 * Keeps the architectural direction: presentation -> simulation, never the reverse.
 */
describe('29.1E - post-remnant intrinsic thermal regression (simulation boundary)', () => {
  it.each([
    { label: 'Musia B-2: intrinsic input snapshot', mass: 0.749, radius: 0.948, albedo: 0.138, retention: 0.653 },
    { label: 'Xiria B-4: intrinsic input snapshot', mass: 1.876, radius: 1.273, albedo: 0.207, retention: 0.792 },
  ])('$label remains deterministic without assuming WD luminosity', sample => {
    const input = Object.freeze({
      massEarth: sample.mass,
      radiusEarth: sample.radius,
      referenceBondAlbedo01: sample.albedo,
      internalHeatRetentionIndex01: sample.retention,
      tidalHeatingIndex01: null,
    });
    const first = projectPostRemnantUnresolvedLuminosityThermalState(input);
    expect(first).toEqual(projectPostRemnantUnresolvedLuminosityThermalState(input));
    expect(first?.geothermalFluxWattsPerSquareMeter).toBeGreaterThan(0);
    expect(first?.intrinsicBlackbodyEquivalentKelvin).toBeGreaterThan(0);
    expect(Object.isFrozen(first)).toBe(true);
  });
});
