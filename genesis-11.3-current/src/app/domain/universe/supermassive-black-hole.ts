/**
 * Supermassive black hole located in a galactic nucleus.
 *
 * At roadmap point 4.4 only its physical mass is modeled.
 * Activity/state belongs to later roadmap points.
 */
export class SupermassiveBlackHole {

  constructor(
    readonly massSolarMasses:
      number,
  ) {
    if (
      !Number.isFinite(
        massSolarMasses,
      ) ||
      massSolarMasses <=
        0
    ) {
      throw new RangeError(
        `massSolarMasses must be finite and greater than 0: ${massSolarMasses}.`,
      );
    }
  }
}