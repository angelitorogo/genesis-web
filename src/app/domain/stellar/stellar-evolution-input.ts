export const STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR =
  0.012;

export const STELLAR_EVOLUTION_V1_MAX_INITIAL_MASS_SOLAR =
  150.0;

/**
 * Point-14.8 physical input for the simplified isolated-star evolution model.
 *
 * initialMassSolar is the zero-age/progenitor mass expressed in solar masses.
 * metallicitySolarRatio is the bulk metallicity relative to the Sun.
 * ageBillionYears is the elapsed stellar age in Gyr.
 *
 * Important roadmap boundary:
 * - these are evolution inputs, not yet generated Star physical properties;
 * - point 15.1 will generate mass/radius/luminosity/temperature;
 * - point 15.3 will expose age and remaining life on generated stars;
 * - point 14.8 only consumes the three quantities required to decide the
 *   current coarse evolutionary state.
 */
export class StellarEvolutionInput {

  constructor(
    readonly initialMassSolar:
      number,

    readonly metallicitySolarRatio:
      number,

    readonly ageBillionYears:
      number,
  ) {
    if (
      !Number.isFinite(
        initialMassSolar,
      ) ||
      initialMassSolar <
        STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR ||
      initialMassSolar >
        STELLAR_EVOLUTION_V1_MAX_INITIAL_MASS_SOLAR
    ) {
      throw new RangeError(
        `initialMassSolar must be finite and in [${STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR}, ${STELLAR_EVOLUTION_V1_MAX_INITIAL_MASS_SOLAR}].`,
      );
    }

    if (
      !Number.isFinite(
        metallicitySolarRatio,
      ) ||
      metallicitySolarRatio <
        0
    ) {
      throw new RangeError(
        'metallicitySolarRatio must be finite and non-negative.',
      );
    }

    if (
      !Number.isFinite(
        ageBillionYears,
      ) ||
      ageBillionYears <
        0
    ) {
      throw new RangeError(
        'ageBillionYears must be finite and non-negative.',
      );
    }
  }
}
