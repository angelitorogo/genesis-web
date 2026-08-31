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
  MinorBodyDynamicsState,
} from '../../domain/planetary/minor-body-dynamics-state';

import {
  MinorBodyKind,
} from '../../domain/planetary/minor-body-kind';

import {
  MinorBodyOrbitConicRegime,
} from '../../domain/planetary/minor-body-orbit-conic-regime';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  type RelevantAsteroid,
} from '../../domain/planetary/relevant-asteroid';

import {
  type RelevantCapturedExtrasolarObject,
} from '../../domain/planetary/relevant-captured-extrasolar-object';

import {
  type RelevantComet,
} from '../../domain/planetary/relevant-comet';

import {
  type RelevantInterstellarObject,
} from '../../domain/planetary/relevant-interstellar-object';

import {
  type RelevantTransNeptunianObject,
} from '../../domain/planetary/relevant-trans-neptunian-object';

import {
  type TransNeptunianObjectSystem,
} from '../../domain/planetary/trans-neptunian-object-system';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  MinorBodyDynamicsEngine,
} from './minor-body-dynamics-engine';

import {
  MinorBodyOrbitalElementsEngine,
} from './minor-body-orbital-elements-engine';

describe(
  'MinorBodyOrbitalElementsEngine point 23.2',
  () => {
    it(
      'should normalize all five phase-22 families without changing physical identity or source geometry',
      () => {
        const state =
          populatedState();

        const catalog =
          MinorBodyOrbitalElementsEngine
            .generate(
              state,
            );

        expect(
          catalog.existingObjectCount,
        ).toBe(5);

        expect(
          catalog.boundObjectCount,
        ).toBe(4);

        expect(
          catalog.unboundObjectCount,
        ).toBe(1);

        expect(
          catalog.retrogradeObjectCount,
        ).toBe(2);

        expect(
          catalog.entries.map(
            entry =>
              entry.orbitalElements.kind,
          ),
        ).toEqual([
          MinorBodyKind.ASTEROID,
          MinorBodyKind.COMET,
          MinorBodyKind.TRANS_NEPTUNIAN_OBJECT,
          MinorBodyKind.INTERSTELLAR_OBJECT,
          MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT,
        ]);

        const asteroidOrbit =
          catalog.entries[0]
            .orbitalElements;

        expect(
          asteroidOrbit.semiMajorAxisAu,
        ).toBe(2);

        expect(
          asteroidOrbit.orbitalPeriodYears,
        ).toBeCloseTo(
          Math.sqrt(8),
          14,
        );

        const visitor =
          catalog.entries[3]
            .orbitalElements;

        expect(
          visitor.conicRegime,
        ).toBe(
          MinorBodyOrbitConicRegime.HYPERBOLIC,
        );

        expect(
          visitor.semiMajorAxisAu,
        ).toBe(-20);

        expect(
          visitor.apoapsisAu,
        ).toBeNull();

        expect(
          visitor.orbitalPeriodYears,
        ).toBeNull();

        for (
          let index = 0;
          index <
            catalog.entries.length;
          index += 1
        ) {
          expect(
            catalog.entries[index].body,
          ).toBe(
            state
              .groundTruthInventory
              .entries[index]
              .body,
          );
        }
      },
    );

    it(
      'should expose the point-23.2 catalog through the central MinorBodyDynamicsEngine coordinator',
      () => {
        const state =
          populatedState();

        const catalog =
          MinorBodyDynamicsEngine
            .orbitalElements(
              state,
            );

        expect(
          catalog.dynamicsState,
        ).toBe(state);

        expect(
          catalog.existingObjectCount,
        ).toBe(
          state.existingMinorBodyCount,
        );
      },
    );

    it(
      'should normalize an empty point-23.1 state without inventing orbital objects',
      () => {
        const state =
          emptyState();

        const catalog =
          MinorBodyOrbitalElementsEngine
            .generate(
              state,
            );

        expect(
          catalog.entries,
        ).toEqual([]);

        expect(
          catalog.existingObjectCount,
        ).toBe(0);
      },
    );
  },
);

function populatedState():
  MinorBodyDynamicsState {
  const host =
    hostSystem();

  const asteroid = {
    proceduralId:
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    localDesignation:
      'AST-IN-001',
    isDiscoverable:
      true,
    orbit: {
      semiMajorAxisAu:
        2,
      eccentricity:
        0.1,
      inclinationDegrees:
        5,
      longitudeAscendingNodeDegrees:
        10,
      argumentOfPeriapsisDegrees:
        20,
      meanAnomalyDegrees:
        30,
      periapsisAu:
        1.8,
      apoapsisAu:
        2.2,
    },
  } as unknown as RelevantAsteroid;

  const comet = {
    proceduralId:
      'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    localDesignation:
      'COM-001',
    isDiscoverable:
      true,
    orbit: {
      gravitatingMassSolar:
        1,
      semiMajorAxisAu:
        4,
      eccentricity:
        0.25,
      inclinationDegrees:
        12,
      longitudeAscendingNodeDegrees:
        40,
      argumentOfPeriapsisDegrees:
        50,
      meanAnomalyDegrees:
        60,
      periapsisAu:
        3,
      apoapsisAu:
        5,
      orbitalPeriodYears:
        8,
    },
  } as unknown as RelevantComet;

  const tno = {
    proceduralId:
      'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    localDesignation:
      'TNO-001',
    isDiscoverable:
      true,
    properties: {
      gravitatingMassSolar:
        1,
      semiMajorAxisAu:
        40,
      eccentricity:
        0.1,
      inclinationDegrees:
        15,
      longitudeOfAscendingNodeDegrees:
        70,
      argumentOfPeriapsisDegrees:
        80,
      meanAnomalyDegrees:
        90,
      periapsisAu:
        36,
      apoapsisAu:
        44,
      orbitalPeriodYears:
        Math.sqrt(
          40 ** 3,
        ),
    },
  } as unknown as RelevantTransNeptunianObject;

  const interstellar = {
    proceduralId:
      'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
    localDesignation:
      'ISO-001',
    isDiscoverable:
      true,
    trajectory: {
      gravitatingMassSolar:
        1,
      semiMajorAxisAu:
        -20,
      eccentricity:
        1.1,
      inclinationDegrees:
        120,
      longitudeOfAscendingNodeDegrees:
        100,
      argumentOfPeriapsisDegrees:
        110,
      periapsisAu:
        2,
    },
  } as unknown as RelevantInterstellarObject;

  const captured = {
    proceduralId:
      'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
    localDesignation:
      'XCAP-001',
    isDiscoverable:
      true,
    orbit: {
      gravitatingMassSolar:
        1,
      semiMajorAxisAu:
        100,
      eccentricity:
        0.5,
      inclinationDegrees:
        130,
      longitudeOfAscendingNodeDegrees:
        120,
      argumentOfPeriapsisDegrees:
        130,
      meanAnomalyDegrees:
        140,
      periapsisAu:
        50,
      apoapsisAu:
        150,
      periodYears:
        1000,
    },
  } as unknown as RelevantCapturedExtrasolarObject;

  return new MinorBodyDynamicsState(
    host,
    asteroidSystem(
      host,
      [
        asteroid,
      ],
    ),
    cometSystem(
      host,
      [
        comet,
      ],
    ),
    tnoSystem(
      host,
      [
        tno,
      ],
    ),
    interstellarSystem(
      host,
      [
        interstellar,
      ],
    ),
    capturedSystem(
      host,
      [
        captured,
      ],
    ),
  );
}

function emptyState():
  MinorBodyDynamicsState {
  const host =
    hostSystem();

  return new MinorBodyDynamicsState(
    host,
    asteroidSystem(
      host,
      [],
    ),
    cometSystem(
      host,
      [],
    ),
    tnoSystem(
      host,
      [],
    ),
    interstellarSystem(
      host,
      [],
    ),
    capturedSystem(
      host,
      [],
    ),
  );
}

function hostSystem():
  PlanetarySystem {
  const generationKey =
    new UniverseGenerationKey(
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      ),
      GeneratorVersion.V1,
    );

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
        PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
      generationInnerLimitAu:
        0.1,
      generationOuterLimitAu:
        100,
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
        100,
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

function asteroidSystem(
  host:
    PlanetarySystem,

  relevantAsteroids:
    readonly RelevantAsteroid[],
): AsteroidBeltSystem {
  return {
    hostPlanetarySystem:
      host,
    relevantAsteroids,
  } as unknown as AsteroidBeltSystem;
}

function cometSystem(
  host:
    PlanetarySystem,

  relevantComets:
    readonly RelevantComet[],
): CometSystem {
  return {
    hostPlanetarySystem:
      host,
    relevantComets,
  } as unknown as CometSystem;
}

function tnoSystem(
  host:
    PlanetarySystem,

  relevantObjects:
    readonly RelevantTransNeptunianObject[],
): TransNeptunianObjectSystem {
  return {
    hostPlanetarySystem:
      host,
    relevantObjects,
  } as unknown as TransNeptunianObjectSystem;
}

function interstellarSystem(
  host:
    PlanetarySystem,

  relevantObjects:
    readonly RelevantInterstellarObject[],
): InterstellarObjectSystem {
  return {
    hostPlanetarySystem:
      host,
    relevantObjects,
  } as unknown as InterstellarObjectSystem;
}

function capturedSystem(
  host:
    PlanetarySystem,

  relevantObjects:
    readonly RelevantCapturedExtrasolarObject[],
): CapturedExtrasolarObjectSystem {
  return {
    hostPlanetarySystem:
      host,
    relevantObjects,
  } as unknown as CapturedExtrasolarObjectSystem;
}
