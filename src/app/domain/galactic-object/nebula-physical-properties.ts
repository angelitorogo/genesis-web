/**
 * Regenerable physical Ground Truth shared by the four point-12.2 nebula
 * subtypes.
 *
 * All values describe intrinsic physical state, not what the player currently
 * knows about the object. They must therefore not be persisted merely to
 * reconstruct a nebula and must not be exposed before observation rules allow
 * it.
 */
export class NebulaPhysicalProperties {

  constructor(
    readonly radiusParsecs:
      number,

    readonly massSolarMasses:
      number,

    readonly gasTemperatureKelvin:
      number,

    readonly hydrogenNumberDensityPerCm3:
      number,

    readonly ionizationFraction:
      number,

    readonly dustToGasMassRatio:
      number,
  ) {
    requirePositiveFinite(
      radiusParsecs,
      'radiusParsecs',
    );

    requirePositiveFinite(
      massSolarMasses,
      'massSolarMasses',
    );

    requirePositiveFinite(
      gasTemperatureKelvin,
      'gasTemperatureKelvin',
    );

    requirePositiveFinite(
      hydrogenNumberDensityPerCm3,
      'hydrogenNumberDensityPerCm3',
    );

    requireUnitInterval(
      ionizationFraction,
      'ionizationFraction',
    );

    requireUnitInterval(
      dustToGasMassRatio,
      'dustToGasMassRatio',
    );
  }
}

function requirePositiveFinite(
  value:
    number,

  name:
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
      `${name} must be finite and positive.`,
    );
  }
}

function requireUnitInterval(
  value:
    number,

  name:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${name} must be finite and belong to [0, 1].`,
    );
  }
}
