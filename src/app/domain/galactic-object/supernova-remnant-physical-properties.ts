/**
 * Point-12.6 intrinsic Ground Truth for one persistent supernova remnant.
 *
 * The remnant is a long-lived GalacticObject, not the transient supernova
 * flash that created it. These properties are regenerated from its persistent
 * GalacticObjectLocator and are not copied into IndexedDB.
 */
export class SupernovaRemnantPhysicalProperties {

  constructor(
    readonly ageYears:
      number,

    readonly radiusParsecs:
      number,

    readonly expansionVelocityKmPerSecond:
      number,

    readonly shockTemperatureKelvin:
      number,

    readonly explosionEnergyErgs:
      number,

    readonly ambientHydrogenNumberDensityPerCm3:
      number,

    readonly ejectaMassSolarMasses:
      number,

    readonly sweptUpMassSolarMasses:
      number,
  ) {
    requirePositiveFinite(
      ageYears,
      'ageYears',
    );

    requirePositiveFinite(
      radiusParsecs,
      'radiusParsecs',
    );

    requirePositiveFinite(
      expansionVelocityKmPerSecond,
      'expansionVelocityKmPerSecond',
    );

    requirePositiveFinite(
      shockTemperatureKelvin,
      'shockTemperatureKelvin',
    );

    requirePositiveFinite(
      explosionEnergyErgs,
      'explosionEnergyErgs',
    );

    requirePositiveFinite(
      ambientHydrogenNumberDensityPerCm3,
      'ambientHydrogenNumberDensityPerCm3',
    );

    requirePositiveFinite(
      ejectaMassSolarMasses,
      'ejectaMassSolarMasses',
    );

    requirePositiveFinite(
      sweptUpMassSolarMasses,
      'sweptUpMassSolarMasses',
    );
  }
}

function requirePositiveFinite(
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
      `${propertyName} must be finite and greater than 0.`,
    );
  }
}
