/**
 * Regenerable physical Ground Truth for the ionized volume represented by a
 * point-12.3 H II region.
 *
 * The values are intrinsic properties, not measurements already known by the
 * player. They therefore remain separate from observation state and are not
 * persisted merely to reconstruct the procedural object.
 */
export class HiiRegionPhysicalProperties {

  constructor(
    readonly radiusParsecs:
      number,

    readonly electronTemperatureKelvin:
      number,

    readonly electronDensityPerCm3:
      number,
  ) {
    requirePositiveFinite(
      radiusParsecs,
      'radiusParsecs',
    );

    requirePositiveFinite(
      electronTemperatureKelvin,
      'electronTemperatureKelvin',
    );

    requirePositiveFinite(
      electronDensityPerCm3,
      'electronDensityPerCm3',
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
