import {
  POST_REMNANT_MINIMUM_RADIATIVE_FORCING_EARTH,
  postRemnantEffectiveRadiativeForcingEarth,
  postRemnantIntrinsicThermalStateFromInputs,
} from './post-remnant-conditional-environment-reassessment';

describe('29.1E-e.2 post-remnant cryogenic thermal closure', () => {
  it('keeps real present-day irradiation unchanged when no extra floor is needed', () => {
    expect(postRemnantEffectiveRadiativeForcingEarth(0.1527)).toBe(0.1527);
  });

  it('does not resurrect progenitor luminosity when total thermal forcing is zero', () => {
    const forcing = postRemnantEffectiveRadiativeForcingEarth(0);
    expect(forcing).toBe(POST_REMNANT_MINIMUM_RADIATIVE_FORCING_EARTH);
    expect(forcing).toBeLessThan(1e-6);
  });

  it('adds a physically non-zero intrinsic thermal floor for an active super-Earth without calling it stellar light', () => {
    const state = postRemnantIntrinsicThermalStateFromInputs(
      2.955,
      1.315,
      0.168,
      0.788,
      0,
    );

    expect(state.geothermalHeatFluxWattsPerSquareMeter).toBeGreaterThan(0.14);
    expect(state.geothermalHeatFluxWattsPerSquareMeter).toBeLessThan(0.20);
    expect(state.tidalHeatFluxWattsPerSquareMeter).toBe(0);
    expect(state.intrinsicEquivalentInsolationEarth).toBeGreaterThan(5e-4);
    expect(state.intrinsicEquivalentInsolationEarth).toBeLessThan(7e-4);
    expect(state.intrinsicEquivalentInsolationEarth).toBeGreaterThan(
      POST_REMNANT_MINIMUM_RADIATIVE_FORCING_EARTH,
    );
  });

  it('keeps the tidal contribution bounded and independent of stellar luminosity', () => {
    const state = postRemnantIntrinsicThermalStateFromInputs(1, 1, 0.3, 0, 1);
    expect(state.geothermalHeatFluxWattsPerSquareMeter).toBe(0);
    expect(state.tidalHeatFluxWattsPerSquareMeter).toBe(2.5);
    expect(state.totalIntrinsicHeatFluxWattsPerSquareMeter).toBe(2.5);
  });

  it('rejects invalid current-host irradiation instead of inventing a value', () => {
    expect(() => postRemnantEffectiveRadiativeForcingEarth(-1)).toThrow(RangeError);
    expect(() => postRemnantEffectiveRadiativeForcingEarth(Number.NaN)).toThrow(RangeError);
  });
});
