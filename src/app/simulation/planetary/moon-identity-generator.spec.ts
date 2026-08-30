import {
  BodyLocator,
  MoonLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  BodySeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  MoonPopulationProfile,
} from '../../domain/planetary/moon-population-profile';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  type PlanetaryDesignation,
} from '../../domain/planetary/planetary-designation';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  MoonIdentityGenerator,
} from './moon-identity-generator';

describe(
  'MoonIdentityGenerator point 21.8',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const system = {
      generationKey,
      locator:
        new SystemLocator(
          4n,
          -9n,
          12n,
        ),
      planetCount:
        1,
    } as unknown as PlanetarySystem;

    it(
      'should create one frozen deterministic lightweight identity per modeled moon and resolve the same MoonSeed from its locator',
      () => {
        const planet =
          planetFixture(
            system,
            1,
            'FE36DE89E9E7D5D403D77BC3522761CD',
          );

        const population =
          populationFixture(
            planet,
            3,
          );

        const identities =
          MoonIdentityGenerator
            .generateAll(
              generationKey,
              planet,
              population,
            );

        expect(
          Object.isFrozen(
            identities,
          ),
        ).toBe(true);

        expect(
          identities.map(
            identity =>
              identity.moonOrdinal,
          ),
        ).toEqual([
          1,
          2,
          3,
        ]);

        expect(
          identities.map(
            identity =>
              identity.designation.name,
          ),
        ).toEqual([
          'Jotheria b I',
          'Jotheria b II',
          'Jotheria b III',
        ]);

        expect(
          identities.map(
            identity =>
              identity.seed.normalizedValue,
          ),
        ).toEqual([
          'FF6EA6F00D77E8F4BBAB8BE952538CAB',
          'F32CF678840C4B0B69041670E60021BE',
          '9F04DA5701B89023DA8BBB283C042B4D',
        ]);

        for (
          const identity
          of identities
        ) {
          expect(
            identity.locator,
          ).toBeInstanceOf(
            MoonLocator,
          );

          expect(
            ProceduralTargetResolver
              .resolveTargetSeed(
                generationKey,
                identity.locator,
              )
              .normalizedValue,
          ).toBe(
            identity.seed.normalizedValue,
          );
        }

        expect(
          MoonIdentityGenerator
            .generateAll(
              generationKey,
              planet,
              population,
            )
            .map(
              identity =>
                identity.seed.normalizedValue,
            ),
        ).toEqual(
          identities.map(
            identity =>
              identity.seed.normalizedValue,
          ),
        );
      },
    );

    it(
      'should reject an out-of-range ordinal or population/designation from another host identity',
      () => {
        const planet =
          planetFixture(
            system,
            1,
            'FE36DE89E9E7D5D403D77BC3522761CD',
          );

        const population =
          populationFixture(
            planet,
            1,
          );

        expect(
          () =>
            MoonIdentityGenerator
              .generate(
                generationKey,
                planet,
                population,
                2,
              ),
        ).toThrow(
          RangeError,
        );

        const wrongLocator =
          new BodyLocator(
            4n,
            -9n,
            12n,
            1n,
          );

        const forged = {
          ...planet,
          designation: {
            ...planet.designation,
            bodyLocator:
              wrongLocator,
          },
        } as unknown as Planet;

        expect(
          () =>
            MoonIdentityGenerator
              .generateAll(
                generationKey,
                forged,
                population,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function planetFixture(
  system:
    PlanetarySystem,

  planetOrdinal:
    number,

  seedHex:
    string,
): Planet {
  const locator =
    new BodyLocator(
      system.locator.galaxyIndex,
      system.locator.sectorKey,
      system.locator.galacticObjectIndex,
      BigInt(
        planetOrdinal -
          1,
      ),
    );

  const seed =
    new BodySeed(
      seedHex,
    );

  const designation = {
    planetOrdinal,
    bodyLocator:
      locator,
    bodySeed:
      seed,
    name:
      'Jotheria b',
    proceduralCode:
      `GEN-V1-TEST-P${planetOrdinal}-b-BODY-${seed.normalizedValue}`,
  } as PlanetaryDesignation;

  return {
    generationKey:
      system.generationKey,
    hostPlanetarySystem:
      system,
    systemLocator:
      system.locator,
    planetOrdinal,
    locator,
    seed,
    designation,
    planetType:
      PlanetType.ROCKY,
    massEarth:
      1,
    radiusEarth:
      1,
    orbit: {
      semiMajorAxisAu:
        1,
      eccentricity:
        0.01,
    },
    orbitalPeriod: {
      gravitatingMassSolar:
        1,
    },
    isTypePhysicallyCoherent:
      true,
  } as unknown as Planet;
}

function populationFixture(
  planet:
    Planet,

  moonCount:
    number,
): MoonPopulationProfile {
  return new MoonPopulationProfile(
    planet.planetOrdinal,
    planet.locator,
    planet.seed,
    planet.planetType,
    planet.massEarth,
    planet.radiusEarth,
    planet.orbit.semiMajorAxisAu,
    planet.orbit.eccentricity,
    planet.orbitalPeriod.gravitatingMassSolar,
    230,
    0.67,
    moonCount,
  );
}
