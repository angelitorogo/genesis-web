import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  type AsteroidBeltSystem,
} from '../../domain/planetary/asteroid-belt-system';

import {
  type CapturedExtrasolarObjectSystem,
} from '../../domain/planetary/captured-extrasolar-object-system';

import {
  type CometSystem,
} from '../../domain/planetary/comet-system';

import {
  type InterstellarObjectSystem,
} from '../../domain/planetary/interstellar-object-system';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  type TransNeptunianObjectSystem,
} from '../../domain/planetary/trans-neptunian-object-system';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  MinorBodyDynamicsEngine,
} from './minor-body-dynamics-engine';

describe(
  'MinorBodyDynamicsEngine point 23.1',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should deterministically initialize the phase-23 boundary without consuming knowledge state or entropy',
      () => {
        const host =
          hostSystem(
            generationKey,
          );

        const sources =
          sourceSystems(
            host,
          );

        const first =
          MinorBodyDynamicsEngine
            .initialize(
              generationKey,
              host,
              sources.asteroids,
              sources.comets,
              sources.tnos,
              sources.interstellar,
              sources.captured,
            );

        const second =
          MinorBodyDynamicsEngine
            .initialize(
              generationKey,
              host,
              sources.asteroids,
              sources.comets,
              sources.tnos,
              sources.interstellar,
              sources.captured,
            );

        expect(
          first.hostPlanetarySystem,
        ).toBe(host);

        expect(
          first.generationKey,
        ).toBe(
          host.generationKey,
        );

        expect(
          first.systemLocator,
        ).toBe(
          host.locator,
        );

        expect(
          first.systemSeed,
        ).toBe(
          host.seed,
        );

        expect(
          first.existingMinorBodyCount,
        ).toBe(0);

        expect(
          second.existingMinorBodyCount,
        ).toBe(
          first.existingMinorBodyCount,
        );

        expect(
          Object.keys(first),
        ).not.toContain(
          'knowledgeSnapshot',
        );
      },
    );

    it(
      'should reject a host from a different UniverseGenerationKey',
      () => {
        const host =
          hostSystem(
            generationKey,
          );

        const sources =
          sourceSystems(
            host,
          );

        const foreignKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '0123-4567-89AB-CDEF-FEDC-BA98-7654-3210',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            MinorBodyDynamicsEngine
              .initialize(
                foreignKey,
                host,
                sources.asteroids,
                sources.comets,
                sources.tnos,
                sources.interstellar,
                sources.captured,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject unsupported generator versions before initializing dynamics',
      () => {
        const host =
          hostSystem(
            generationKey,
          );

        const sources =
          sourceSystems(
            host,
          );

        const unsupported = {
          ...generationKey,
          generatorVersion: {
            code:
              999,
          },
          equals:
            generationKey.equals.bind(
              generationKey,
            ),
        } as unknown as UniverseGenerationKey;

        expect(
          () =>
            MinorBodyDynamicsEngine
              .initialize(
                unsupported,
                host,
                sources.asteroids,
                sources.comets,
                sources.tnos,
                sources.interstellar,
                sources.captured,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function hostSystem(
  generationKey:
    UniverseGenerationKey,
): PlanetarySystem {
  return {
    generationKey,
    locator:
      new SystemLocator(
        3n,
        5n,
        7n,
      ),
    seed:
      new SystemSeed(
        '0123456789ABCDEFFEDCBA9876543210',
      ),
    planetCount:
      0,
    hostStellarSystem: {
      secondaryCompanion:
        null,
    },
    orbits:
      [],
    orbitalLayout: {
      orbitTopology:
        'CIRCUMSTELLAR' as PlanetarySystem['orbitalLayout']['orbitTopology'],
      generationInnerLimitAu:
        0.1,
      generationOuterLimitAu:
        50,
    },
    orbitalPeriodLayout: {
      gravitatingMassSolar:
        1,
    },
    habitableZone: {
      referenceLuminositySolar:
        1,
    },
    formationBlueprint: {
      centralMassSolar:
        1,
      sourceInnerRadiusAu:
        0.1,
      sourceOuterRadiusAu:
        50,
      residualDustMassEarth:
        5,
      sourceCandidateCount:
        0,
      sourceMigratedBodyCount:
        0,
      sourceCollisionCount:
        0,
    },
  } as unknown as PlanetarySystem;
}

function sourceSystems(
  host:
    PlanetarySystem,
): {
  readonly asteroids:
    AsteroidBeltSystem;

  readonly comets:
    CometSystem;

  readonly tnos:
    TransNeptunianObjectSystem;

  readonly interstellar:
    InterstellarObjectSystem;

  readonly captured:
    CapturedExtrasolarObjectSystem;
} {
  return {
    asteroids: {
      hostPlanetarySystem:
        host,
      relevantAsteroids:
        [],
    } as unknown as AsteroidBeltSystem,
    comets: {
      hostPlanetarySystem:
        host,
      relevantComets:
        [],
    } as unknown as CometSystem,
    tnos: {
      hostPlanetarySystem:
        host,
      relevantObjects:
        [],
    } as unknown as TransNeptunianObjectSystem,
    interstellar: {
      hostPlanetarySystem:
        host,
      relevantObjects:
        [],
    } as unknown as InterstellarObjectSystem,
    captured: {
      hostPlanetarySystem:
        host,
      relevantObjects:
        [],
    } as unknown as CapturedExtrasolarObjectSystem,
  };
}
