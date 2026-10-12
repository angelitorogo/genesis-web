import {
  postRemnantIntrinsicThermalStateFromInputs,
} from './post-remnant-conditional-environment-reassessment';

const STEFAN_BOLTZMANN = 5.670374419e-8;

/**
 * HOTFIX 29.1E (post-remnant partial science): this is an INTRINSIC-ONLY
 * thermodynamic projection. It does NOT establish present-day stellar
 * irradiation, atmosphere, climate, surface water or biological exposure.
 *
 * In particular, unknown white-dwarf/neutron-star luminosity must never be
 * silently replaced by zero or by the progenitor luminosity.
 */
export interface PostRemnantUnresolvedLuminosityThermalProjection {
  readonly geothermalFluxWattsPerSquareMeter: number;
  readonly tidalFluxWattsPerSquareMeter: number;
  readonly totalIntrinsicFluxWattsPerSquareMeter: number;
  /** Blackbody effective temperature of the *intrinsic component alone*;
   * NOT a surface/climate temperature or a bound without thermal equilibrium. */
  readonly intrinsicBlackbodyEquivalentKelvin: number | null;
}

export function projectPostRemnantUnresolvedLuminosityThermalState(
  inputs: Readonly<{
    massEarth: number;
    radiusEarth: number;
    referenceBondAlbedo01: number;
    internalHeatRetentionIndex01: number | null;
    tidalHeatingIndex01: number | null;
  }>,
): PostRemnantUnresolvedLuminosityThermalProjection | null {
  // Missing intrinsic source proxies are unknown, not zero. At least one
  // physical proxy is needed before reporting even a conditional estimate.
  if (inputs.internalHeatRetentionIndex01 === null &&
      inputs.tidalHeatingIndex01 === null) return null;
  const state = postRemnantIntrinsicThermalStateFromInputs(
    inputs.massEarth,
    inputs.radiusEarth,
    inputs.referenceBondAlbedo01,
    inputs.internalHeatRetentionIndex01,
    inputs.tidalHeatingIndex01,
  );
  const flux = state.totalIntrinsicHeatFluxWattsPerSquareMeter;
  return Object.freeze({
    geothermalFluxWattsPerSquareMeter: state.geothermalHeatFluxWattsPerSquareMeter,
    tidalFluxWattsPerSquareMeter: state.tidalHeatFluxWattsPerSquareMeter,
    totalIntrinsicFluxWattsPerSquareMeter: flux,
    intrinsicBlackbodyEquivalentKelvin: flux > 0
      ? (flux / STEFAN_BOLTZMANN) ** 0.25
      : null,
  });
}
