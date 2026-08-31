import {
  SystemLocator,
} from '../generation/procedural-locator';

import {
  GeneratorVersion,
} from '../generation/generator-version';

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
  MinorBodyKind,
} from './minor-body-kind';

import {
  MinorBodyOrbitConicRegime,
} from './minor-body-orbit-conic-regime';

import {
  MinorBodyOrbitalElements,
} from './minor-body-orbital-elements';

import {
  MinorBodyOrbitalElementsCatalog,
} from './minor-body-orbital-elements-catalog';

import {
  type PlanetarySystem,
} from './planetary-system';

import {
  type RelevantAsteroid,
} from './relevant-asteroid';

import {
  type TransNeptunianObjectSystem,
} from './trans-neptunian-object-system';

describe(
  'MinorBodyOrbitalElementsCatalog point 23.2',
  () => {
    it(
      'should preserve exact Ground Truth object reference and identity in one-to-one order',
      () => {
        const body =
          asteroid();

        const state =
          dynamicsState(
            [
              body,
            ],
          );

        const orbit =
          new MinorBodyOrbitalElements(
            MinorBodyKind.ASTEROID,
            body.proceduralId,
            body.localDesignation,
            MinorBodyOrbitConicRegime.ELLIPTIC,
            1,
            2,
            0.1,
            5,
            10,
            20,
            30,
            1.8,
            2.2,
            Math.sqrt(8),
          );

        const catalog =
          new MinorBodyOrbitalElementsCatalog(
            state,
            [
              Object.freeze({
                body,
                orbitalElements:
                  orbit,
              }),
            ],
          );

        expect(
          catalog.existingObjectCount,
        ).toBe(1);

        expect(
          catalog.entries[0].body,
        ).toBe(body);

        expect(
          catalog.find(
            MinorBodyKind.ASTEROID,
            body.proceduralId,
          )?.body,
        ).toBe(body);
      },
    );

    it(
      'should reject missing orbital coverage for an existing Ground Truth body',
      () => {
        expect(
          () =>
            new MinorBodyOrbitalElementsCatalog(
              dynamicsState([
                asteroid(),
              ]),
              [],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function asteroid():
  RelevantAsteroid {
  return {
    proceduralId:
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    localDesignation:
      'AST-IN-001',
    isDiscoverable:
      true,
  } as unknown as RelevantAsteroid;
}

function dynamicsState(
  asteroids:
    readonly RelevantAsteroid[],
): MinorBodyDynamicsState {
  const generationKey =
    new UniverseGenerationKey(
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      ),
      GeneratorVersion.V1,
    );

  const host = {
    generationKey,
    locator:
      new SystemLocator(
        1n,
        2n,
        3n,
      ),
    seed:
      new SystemSeed(
        '0123456789ABCDEFFEDCBA9876543210',
      ),
  } as unknown as PlanetarySystem;

  return new MinorBodyDynamicsState(
    host,
    {
      hostPlanetarySystem:
        host,
      relevantAsteroids:
        asteroids,
    } as unknown as AsteroidBeltSystem,
    {
      hostPlanetarySystem:
        host,
      relevantComets:
        [],
    } as unknown as CometSystem,
    {
      hostPlanetarySystem:
        host,
      relevantObjects:
        [],
    } as unknown as TransNeptunianObjectSystem,
    {
      hostPlanetarySystem:
        host,
      relevantObjects:
        [],
    } as unknown as InterstellarObjectSystem,
    {
      hostPlanetarySystem:
        host,
      relevantObjects:
        [],
    } as unknown as CapturedExtrasolarObjectSystem,
  );
}
