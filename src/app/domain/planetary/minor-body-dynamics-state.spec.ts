import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  SystemLocator,
} from '../generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  SystemSeed,
} from '../seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  type AsteroidBeltSystem,
} from './asteroid-belt-system';

import {
  type CapturedExtrasolarObjectSystem,
} from './captured-extrasolar-object-system';

import {
  type CometSystem,
} from './comet-system';

import {
  type InterstellarObjectSystem,
} from './interstellar-object-system';

import {
  MinorBodyDynamicsState,
} from './minor-body-dynamics-state';

import {
  type PlanetarySystem,
} from './planetary-system';

import {
  type RelevantAsteroid,
} from './relevant-asteroid';

import {
  type RelevantCapturedExtrasolarObject,
} from './relevant-captured-extrasolar-object';

import {
  type RelevantComet,
} from './relevant-comet';

import {
  type RelevantInterstellarObject,
} from './relevant-interstellar-object';

import {
  type RelevantTransNeptunianObject,
} from './relevant-trans-neptunian-object';

import {
  type TransNeptunianObjectSystem,
} from './trans-neptunian-object-system';

describe(
  'MinorBodyDynamicsState point 23.1',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const host =
      hostSystem(
        generationKey,
      );

    it(
      'should preserve the exact host/source aggregates and build one complete Ground Truth inventory',
      () => {
        const asteroid =
          discoverableBody(
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          ) as RelevantAsteroid;

        const comet =
          discoverableBody(
            'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
          ) as RelevantComet;

        const tno =
          discoverableBody(
            'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
          ) as RelevantTransNeptunianObject;

        const interstellar =
          discoverableBody(
            'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
          ) as RelevantInterstellarObject;

        const captured =
          discoverableBody(
            'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
          ) as RelevantCapturedExtrasolarObject;

        const sources = sourceSystems(
          host,
          [
            asteroid,
          ],
          [
            comet,
          ],
          [
            tno,
          ],
          [
            interstellar,
          ],
          [
            captured,
          ],
        );

        const state =
          new MinorBodyDynamicsState(
            host,
            sources.asteroids,
            sources.comets,
            sources.tnos,
            sources.interstellar,
            sources.captured,
          );

        expect(
          state.hostPlanetarySystem,
        ).toBe(host);

        expect(
          state.asteroidBeltSystem,
        ).toBe(sources.asteroids);

        expect(
          state.cometSystem,
        ).toBe(sources.comets);

        expect(
          state.transNeptunianObjectSystem,
        ).toBe(sources.tnos);

        expect(
          state.interstellarObjectSystem,
        ).toBe(sources.interstellar);

        expect(
          state.capturedExtrasolarObjectSystem,
        ).toBe(sources.captured);

        expect(
          state.groundTruthInventory.asteroids[0],
        ).toBe(asteroid);

        expect(
          state.groundTruthInventory.comets[0],
        ).toBe(comet);

        expect(
          state.groundTruthInventory.transNeptunianObjects[0],
        ).toBe(tno);

        expect(
          state.groundTruthInventory.interstellarObjects[0],
        ).toBe(interstellar);

        expect(
          state.groundTruthInventory.capturedExtrasolarObjects[0],
        ).toBe(captured);

        expect(
          state.existingMinorBodyCount,
        ).toBe(5);

        expect(
          state.boundMinorBodyCount,
        ).toBe(4);

        expect(
          state.unboundMinorBodyCount,
        ).toBe(1);

        expect(
          state.hasMinorBodies,
        ).toBe(true);
      },
    );

    it(
      'should accept a physically empty minor-body context',
      () => {
        const sources =
          sourceSystems(
            host,
          );

        const state =
          new MinorBodyDynamicsState(
            host,
            sources.asteroids,
            sources.comets,
            sources.tnos,
            sources.interstellar,
            sources.captured,
          );

        expect(
          state.existingMinorBodyCount,
        ).toBe(0);

        expect(
          state.boundMinorBodyCount,
        ).toBe(0);

        expect(
          state.unboundMinorBodyCount,
        ).toBe(0);

        expect(
          state.hasMinorBodies,
        ).toBe(false);
      },
    );

    it(
      'should reject phase-22 source aggregates built from another PlanetarySystem instance',
      () => {
        const otherHost =
          hostSystem(
            generationKey,
          );

        const sources =
          sourceSystems(
            otherHost,
          );

        expect(
          () =>
            new MinorBodyDynamicsState(
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
      'should remain a pure Ground Truth boundary without point-23.2+ or player-knowledge products',
      () => {
        const sources =
          sourceSystems(
            host,
          );

        const state =
          new MinorBodyDynamicsState(
            host,
            sources.asteroids,
            sources.comets,
            sources.tnos,
            sources.interstellar,
            sources.captured,
          );

        for (
          const reserved
          of [
            'knowledgeSnapshot',
            'knowledgeRecords',
            'orbitalStates',
            'orbitCrossings',
            'resonances',
            'unstableZones',
            'closeEncounters',
            'impactRisks',
            'impactEvents',
          ]
        ) {
          expect(
            reserved in
              (state as unknown as Record<string, unknown>),
          ).toBe(false);
        }
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

function discoverableBody(
  proceduralId:
    string,
): {
  readonly proceduralId:
    string;

  readonly isDiscoverable:
    true;
} {
  return Object.freeze({
    proceduralId,
    isDiscoverable:
      true,
  });
}

function sourceSystems(
  host:
    PlanetarySystem,

  asteroids:
    readonly RelevantAsteroid[] =
    [],

  comets:
    readonly RelevantComet[] =
    [],

  tnos:
    readonly RelevantTransNeptunianObject[] =
    [],

  interstellar:
    readonly RelevantInterstellarObject[] =
    [],

  captured:
    readonly RelevantCapturedExtrasolarObject[] =
    [],
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
        asteroids,
    } as AsteroidBeltSystem,
    comets: {
      hostPlanetarySystem:
        host,
      relevantComets:
        comets,
    } as CometSystem,
    tnos: {
      hostPlanetarySystem:
        host,
      relevantObjects:
        tnos,
    } as TransNeptunianObjectSystem,
    interstellar: {
      hostPlanetarySystem:
        host,
      relevantObjects:
        interstellar,
    } as InterstellarObjectSystem,
    captured: {
      hostPlanetarySystem:
        host,
      relevantObjects:
        captured,
    } as CapturedExtrasolarObjectSystem,
  };
}
