import {
  MoonLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  MoonDesignation,
  moonRomanNumeralV1,
} from '../../domain/planetary/moon-designation';

import {
  MoonIdentity,
} from '../../domain/planetary/moon-identity';

import {
  type MoonPopulationProfile,
} from '../../domain/planetary/moon-population-profile';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  SeedDeriver,
} from '../seed/seed-deriver';

/**
 * Point-21.8 pure identity layer for every modeled moon in one MoonSystem.
 *
 * All point-21.2 moonCount entries receive lightweight MoonLocator/MoonSeed/
 * designation identities. Only the bounded point-21.3 relevant subset receives
 * physical/orbital/tidal/environment materialization. No PRNG draw is consumed.
 */
export class MoonIdentityGenerator {

  private constructor() {}

  static generateAll(
    generationKey:
      UniverseGenerationKey,

    planet:
      Planet,

    populationProfile:
      MoonPopulationProfile,
  ): readonly MoonIdentity[] {
    assertContext(
      generationKey,
      planet,
      populationProfile,
    );

    return Object.freeze(
      Array.from(
        {
          length:
            populationProfile.moonCount,
        },
        (
          _,
          index,
        ) =>
          this.generate(
            generationKey,
            planet,
            populationProfile,
            index +
              1,
          ),
      ),
    );
  }

  static generate(
    generationKey:
      UniverseGenerationKey,

    planet:
      Planet,

    populationProfile:
      MoonPopulationProfile,

    moonOrdinal:
      number,
  ): MoonIdentity {
    assertContext(
      generationKey,
      planet,
      populationProfile,
    );

    if (
      !Number.isInteger(
        moonOrdinal,
      ) ||
      moonOrdinal <=
        0 ||
      moonOrdinal >
        populationProfile.moonCount
    ) {
      throw new RangeError(
        'MoonIdentityGenerator moonOrdinal must address an existing point-21.2 modeled moon.',
      );
    }

    const locator =
      new MoonLocator(
        planet.locator.galaxyIndex,
        planet.locator.sectorKey,
        planet.locator.galacticObjectIndex,
        planet.locator.bodyIndex,
        BigInt(
          moonOrdinal -
            1,
        ),
      );

    const seed =
      SeedDeriver
        .moon(
          planet.seed,
          locator.moonIndex,
        );

    const designation =
      new MoonDesignation(
        planet.designation,
        moonOrdinal,
        locator,
        seed,
        moonRomanNumeralV1(
          moonOrdinal,
        ),
      );

    return new MoonIdentity(
      planet.planetOrdinal,
      planet.locator,
      planet.seed,
      moonOrdinal,
      locator,
      seed,
      designation,
    );
  }
}

function assertContext(
  generationKey:
    UniverseGenerationKey,

  planet:
    Planet,

  populationProfile:
    MoonPopulationProfile,
): void {
  if (
    generationKey.generatorVersion !==
    GeneratorVersion.V1
  ) {
    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  if (
    !generationKey.equals(
      planet.generationKey,
    ) ||
    populationProfile.hostPlanetOrdinal !==
      planet.planetOrdinal ||
    populationProfile.hostPlanetLocator !==
      planet.locator ||
    populationProfile.hostPlanetSeed !==
      planet.seed
  ) {
    throw new RangeError(
      'MoonIdentityGenerator requires the exact point-21.2 host Planet/population identity.',
    );
  }

  if (
    planet.designation.planetOrdinal !==
      planet.planetOrdinal ||
    planet.designation.bodyLocator !==
      planet.locator ||
    planet.designation.bodySeed !==
      planet.seed
  ) {
    throw new RangeError(
      'MoonIdentityGenerator requires the exact frozen point-18.8 PlanetaryDesignation.',
    );
  }
}
