export type StellarSpectralFamily =
  | 'O'
  | 'B'
  | 'A'
  | 'F'
  | 'G'
  | 'K'
  | 'M'
  | 'L'
  | 'T'
  | 'Y';

export const STELLAR_SPECTRAL_FAMILIES:
  readonly StellarSpectralFamily[] =
    Object.freeze([
      'O',
      'B',
      'A',
      'F',
      'G',
      'K',
      'M',
      'L',
      'T',
      'Y',
    ]);

/**
 * Point-15.2 detailed photospheric/substellar spectral type.
 *
 * The family reuses the phase-14 vocabulary:
 * - O/B/A/F/G/K/M for hydrogen-burning stellar primaries;
 * - L/T/Y for brown dwarfs.
 *
 * subtype is the simplified integer 0..9 subdivision inside that broad family.
 * GENESIS does not invent luminosity classes or white-dwarf DA/DB/etc. labels at
 * this point because current age/evolution is not generated until point 15.3.
 */
export class StellarSpectralType {

  readonly designation:
    string;

  constructor(
    readonly family:
      StellarSpectralFamily,

    readonly subtype:
      number,
  ) {
    if (
      !STELLAR_SPECTRAL_FAMILIES
        .includes(
          family,
        )
    ) {
      throw new RangeError(
        `Unsupported stellar spectral family: ${family}.`,
      );
    }

    if (
      !Number.isInteger(
        subtype,
      ) ||
      subtype <
        0 ||
      subtype >
        9
    ) {
      throw new RangeError(
        `spectral subtype must be an integer in [0, 9]: ${subtype}.`,
      );
    }

    this.designation =
      `${family}${subtype}`;
  }
}
