/**
 * Human-readable and technical procedural designation of the canonical V1
 * stellar-system target.
 *
 * GENESIS V1 intentionally has no StarLocator: SystemLocator is the stable
 * procedural identity shared by the planetary system and its canonical primary
 * star. Point 15.6 therefore names that shared target without inserting a new
 * seed level. Phase 16 may add component labels for multiple-star systems on top
 * of this base designation without changing it.
 */
export class StellarDesignation {

  constructor(
    readonly name:
      string,

    readonly proceduralCode:
      string,
  ) {

    if (
      name.length ===
        0 ||
      name.trim() !==
        name
    ) {
      throw new RangeError(
        'Stellar designation name must be non-empty and cannot contain surrounding whitespace.',
      );
    }

    if (
      proceduralCode.length ===
        0 ||
      proceduralCode.trim() !==
        proceduralCode
    ) {
      throw new RangeError(
        'Stellar procedural code must be non-empty and cannot contain surrounding whitespace.',
      );
    }
  }
}
