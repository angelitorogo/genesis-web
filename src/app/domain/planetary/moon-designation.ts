import {
  type MoonLocator,
} from '../generation/procedural-locator';

import {
  type MoonSeed,
} from '../seed/hierarchical-seeds';

import {
  type PlanetaryDesignation,
} from './planetary-designation';

/**
 * Point-21.8 human/technical designation for one modeled natural satellite.
 *
 * V1 layers a stable Roman numeral over the frozen point-18.8 planet name.
 * Naming is driven only by moonOrdinal, never by discovery order. The technical
 * code also embeds the canonical MoonSeed for unambiguous regeneration.
 */
export class MoonDesignation {

  readonly name:
    string;

  readonly proceduralCode:
    string;

  constructor(
    readonly hostPlanetDesignation:
      PlanetaryDesignation,

    readonly moonOrdinal:
      number,

    readonly moonLocator:
      MoonLocator,

    readonly moonSeed:
      MoonSeed,

    readonly romanNumeral:
      string,
  ) {
    if (
      !Number.isInteger(
        moonOrdinal,
      ) ||
      moonOrdinal <=
        0
    ) {
      throw new RangeError(
        'MoonDesignation moonOrdinal must be a positive integer.',
      );
    }

    if (
      moonLocator.bodyIndex !==
        hostPlanetDesignation.bodyLocator.bodyIndex ||
      moonLocator.galaxyIndex !==
        hostPlanetDesignation.bodyLocator.galaxyIndex ||
      moonLocator.sectorKey !==
        hostPlanetDesignation.bodyLocator.sectorKey ||
      moonLocator.galacticObjectIndex !==
        hostPlanetDesignation.bodyLocator.galacticObjectIndex ||
      moonLocator.moonIndex !==
        BigInt(
          moonOrdinal -
            1,
        )
    ) {
      throw new RangeError(
        'MoonDesignation must preserve the exact host planet locator and moonOrdinal.',
      );
    }

    if (
      moonSeed.kind !==
      'moon'
    ) {
      throw new RangeError(
        'MoonDesignation requires a MoonSeed.',
      );
    }

    const expectedRomanNumeral =
      moonRomanNumeralV1(
        moonOrdinal,
      );

    if (
      romanNumeral !==
      expectedRomanNumeral
    ) {
      throw new RangeError(
        `Point-21.8 V1 Roman numeral for moonOrdinal ${moonOrdinal} must be ${expectedRomanNumeral}.`,
      );
    }

    this.name =
      `${hostPlanetDesignation.name} ${romanNumeral}`;

    this.proceduralCode =
      `${hostPlanetDesignation.proceduralCode}` +
      `-M${moonOrdinal}` +
      `-${romanNumeral}` +
      `-MOON-${moonSeed.normalizedValue}`;
  }
}

export function moonRomanNumeralV1(
  moonOrdinal:
    number,
): string {
  if (
    !Number.isInteger(
      moonOrdinal,
    ) ||
    moonOrdinal <=
      0 ||
    moonOrdinal >
      3999
  ) {
    throw new RangeError(
      'Point-21.8 V1 moonOrdinal must be an integer in [1, 3999] for Roman-numeral designation.',
    );
  }

  const values = [
    1000,
    900,
    500,
    400,
    100,
    90,
    50,
    40,
    10,
    9,
    5,
    4,
    1,
  ] as const;

  const symbols = [
    'M',
    'CM',
    'D',
    'CD',
    'C',
    'XC',
    'L',
    'XL',
    'X',
    'IX',
    'V',
    'IV',
    'I',
  ] as const;

  let remaining =
    moonOrdinal;

  let result =
    '';

  for (
    let index = 0;
    index <
      values.length;
    index += 1
  ) {
    while (
      remaining >=
      values[index]
    ) {
      result +=
        symbols[index];

      remaining -=
        values[index];
    }
  }

  return result;
}
