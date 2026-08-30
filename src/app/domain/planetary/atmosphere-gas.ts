/**
 * Point-20.2 atmospheric gas species supported by the V1 bulk-chemistry model.
 *
 * These values are chemical species only. Their presence does not imply a
 * biological origin, breathable conditions or a stable long-term inventory;
 * point 20.3 still owns atmospheric retention/loss.
 */
export enum AtmosphereGas {
  HYDROGEN =
    'HYDROGEN',

  HELIUM =
    'HELIUM',

  NITROGEN =
    'NITROGEN',

  OXYGEN =
    'OXYGEN',

  CARBON_DIOXIDE =
    'CARBON_DIOXIDE',

  WATER_VAPOR =
    'WATER_VAPOR',

  METHANE =
    'METHANE',

  ARGON =
    'ARGON',

  SULFUR_DIOXIDE =
    'SULFUR_DIOXIDE',

  CARBON_MONOXIDE =
    'CARBON_MONOXIDE',

  AMMONIA =
    'AMMONIA',
}

export function atmosphereGasMolarMassGramsPerMole(
  gas:
    AtmosphereGas,
): number {

  switch (
    gas
  ) {
    case AtmosphereGas.HYDROGEN:
      return 2.01588;

    case AtmosphereGas.HELIUM:
      return 4.002602;

    case AtmosphereGas.NITROGEN:
      return 28.0134;

    case AtmosphereGas.OXYGEN:
      return 31.9988;

    case AtmosphereGas.CARBON_DIOXIDE:
      return 44.0095;

    case AtmosphereGas.WATER_VAPOR:
      return 18.01528;

    case AtmosphereGas.METHANE:
      return 16.0425;

    case AtmosphereGas.ARGON:
      return 39.948;

    case AtmosphereGas.SULFUR_DIOXIDE:
      return 64.066;

    case AtmosphereGas.CARBON_MONOXIDE:
      return 28.0101;

    case AtmosphereGas.AMMONIA:
      return 17.03052;
  }
}
