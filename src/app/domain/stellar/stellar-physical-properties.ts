import {
  STELLAR_EVOLUTION_V1_MAX_INITIAL_MASS_SOLAR,
  STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR,
} from './stellar-evolution-input';

/**
 * Point-15.1 physical baseline for one procedurally generated stellar primary.
 *
 * Units are solar masses, solar radii, solar luminosities and Kelvin.
 *
 * Point 15.1 deliberately generates a zero-age/reference physical baseline:
 * initialMassSolar and currentMassSolar are therefore identical here. Age,
 * age-dependent mass loss, current evolutionary state and remaining life are
 * deferred to point 15.3, which can evolve this baseline without changing its
 * initial-mass identity.
 *
 * effectiveTemperatureKelvin is tied to radius/luminosity through the
 * Stefan-Boltzmann relation in StellarGenerator. Spectral type and color remain
 * point-15.2 contracts and are intentionally absent.
 */
export class StellarPhysicalProperties {

  constructor(
    readonly initialMassSolar:
      number,

    readonly currentMassSolar:
      number,

    readonly radiusSolar:
      number,

    readonly luminositySolar:
      number,

    readonly effectiveTemperatureKelvin:
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
        currentMassSolar,
      ) ||
      currentMassSolar <=
        0 ||
      currentMassSolar >
        initialMassSolar
    ) {
      throw new RangeError(
        'currentMassSolar must be finite, greater than 0 and no greater than initialMassSolar.',
      );
    }

    assertPositiveFinite(
      radiusSolar,
      'radiusSolar',
    );

    assertPositiveFinite(
      luminositySolar,
      'luminositySolar',
    );

    assertPositiveFinite(
      effectiveTemperatureKelvin,
      'effectiveTemperatureKelvin',
    );
  }
}

function assertPositiveFinite(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and greater than 0: ${value}.`,
    );
  }
}
