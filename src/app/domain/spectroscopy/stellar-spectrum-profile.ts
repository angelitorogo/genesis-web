/**
 * Point-13.2 validity envelope for the simplified stellar-spectrum model.
 *
 * These bounds are a V1 numerical/modeling contract, not a claim that every
 * astrophysical stellar or substellar object must fall inside them.
 */
export const STELLAR_SPECTRUM_MIN_EFFECTIVE_TEMPERATURE_KELVIN =
  1_000;

export const STELLAR_SPECTRUM_MAX_EFFECTIVE_TEMPERATURE_KELVIN =
  200_000;

/**
 * Minimal physical input required by point 13.2.
 *
 * Important roadmap boundary:
 * - this is NOT Star from point 14.1;
 * - it does NOT generate temperature (point 15.1);
 * - it does NOT classify spectral type/color (point 15.2);
 * - it carries no identity, persistence or discovery state.
 *
 * A future Star/StellarGenerator may provide this value without changing the
 * spectroscopy contract.
 */
export class StellarSpectrumProfile {

  constructor(
    readonly effectiveTemperatureKelvin:
      number,
  ) {
    if (
      !Number.isFinite(
        effectiveTemperatureKelvin,
      ) ||
      effectiveTemperatureKelvin <
        STELLAR_SPECTRUM_MIN_EFFECTIVE_TEMPERATURE_KELVIN ||
      effectiveTemperatureKelvin >
        STELLAR_SPECTRUM_MAX_EFFECTIVE_TEMPERATURE_KELVIN
    ) {
      throw new RangeError(
        `effectiveTemperatureKelvin must be finite and in [${STELLAR_SPECTRUM_MIN_EFFECTIVE_TEMPERATURE_KELVIN}, ${STELLAR_SPECTRUM_MAX_EFFECTIVE_TEMPERATURE_KELVIN}].`,
      );
    }
  }
}
