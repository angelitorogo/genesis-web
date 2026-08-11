/**
 * Characteristic stellar-population properties of one galactic sector.
 *
 * These values are deterministic environmental Ground Truth.
 *
 * They do not represent:
 *
 * - one individual star;
 * - an observed measurement;
 * - discovery state;
 * - persisted universe materialization.
 *
 * characteristicMetallicitySolarRatio expresses the characteristic
 * metallicity of the sector relative to the Sun.
 *
 * characteristicStellarAgeBillionYears expresses the characteristic
 * stellar-population age of the sector in billions of years.
 */
export class GalaxySectorStellarPopulationProperties {

  constructor(
    readonly characteristicMetallicitySolarRatio:
      number,

    readonly characteristicStellarAgeBillionYears:
      number,
  ) {
    if (
      !Number.isFinite(
        characteristicMetallicitySolarRatio,
      ) ||
      characteristicMetallicitySolarRatio <
        0
    ) {
      throw new RangeError(
        'characteristicMetallicitySolarRatio must be finite and non-negative.',
      );
    }

    if (
      !Number.isFinite(
        characteristicStellarAgeBillionYears,
      ) ||
      characteristicStellarAgeBillionYears <=
        0
    ) {
      throw new RangeError(
        'characteristicStellarAgeBillionYears must be finite and greater than 0.',
      );
    }
  }
}