import {
  EarlyPlanetaryDynamicsOutcome,
} from './early-planetary-dynamics-outcome';

import {
  EarlyProtoplanetBody,
} from './early-protoplanet-body';

import {
  EarlyProtoplanetCollision,
} from './early-protoplanet-collision';

import {
  ProtoplanetCompositionMixture,
} from './protoplanet-composition-mixture';

import {
  ProtoplanetMigrationDirection,
} from './protoplanet-migration-direction';

describe(
  'EarlyPlanetaryDynamicsOutcome point 17.5',
  () => {
    it(
      'should conserve source solid mass and freeze survivor/collision lists',
      () => {
        const bodies = [
          body(
            [
              1,
              2,
            ],
            2,
            1.8,
            0.7,
          ),
          body(
            [
              3,
            ],
            5,
            5.2,
            0.3,
          ),
        ];

        const collisions = [
          new EarlyProtoplanetCollision(
            1,
            [
              1,
              2,
            ],
            1.8,
            0.7,
            0.5,
          ),
        ];

        const outcome =
          new EarlyPlanetaryDynamicsOutcome(
            0.1,
            100,
            3,
            1,
            1,
            bodies,
            collisions,
          );

        bodies.length =
          0;

        collisions.length =
          0;

        expect(
          outcome.survivorCount,
        ).toBe(2);

        expect(
          outcome.collisionCount,
        ).toBe(1);

        expect(
          outcome.hasMigration,
        ).toBe(true);

        expect(
          outcome.hasCollisions,
        ).toBe(true);

        expect(
          Object.isFrozen(
            outcome.bodies,
          ),
        ).toBe(true);
      },
    );

    it(
      'should support a truly empty source population',
      () => {
        const outcome =
          new EarlyPlanetaryDynamicsOutcome(
            0.1,
            100,
            0,
            0,
            0,
            [],
            [],
          );

        expect(
          outcome.survivorCount,
        ).toBe(0);
      },
    );

    it(
      'should reject duplicated lineage ordinals and non-conserved mass',
      () => {
        expect(
          () =>
            new EarlyPlanetaryDynamicsOutcome(
              0.1,
              100,
              2,
              1,
              1,
              [
                body(
                  [
                    1,
                  ],
                  1,
                  0.9,
                  0.5,
                ),
                body(
                  [
                    1,
                  ],
                  3,
                  2.9,
                  0.5,
                ),
              ],
              [],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new EarlyPlanetaryDynamicsOutcome(
              0.1,
              100,
              1,
              1,
              0.9,
              [
                body(
                  [
                    1,
                  ],
                  1,
                  0.9,
                  0.9,
                ),
              ],
              [],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function body(
  sourceOrdinals:
    readonly number[],

  formationRadiusAu:
    number,

  orbitalRadiusAu:
    number,

  solidMassEarth:
    number,
): EarlyProtoplanetBody {

  const direction =
    orbitalRadiusAu <
      formationRadiusAu
      ? ProtoplanetMigrationDirection.INWARD
      : orbitalRadiusAu >
          formationRadiusAu
        ? ProtoplanetMigrationDirection.OUTWARD
        : ProtoplanetMigrationDirection.NONE;

  return new EarlyProtoplanetBody(
    sourceOrdinals,
    formationRadiusAu,
    orbitalRadiusAu,
    solidMassEarth,
    new ProtoplanetCompositionMixture(
      0,
      1,
      0,
      0,
    ),
    0.5,
    0.3,
    direction,
    direction ===
      ProtoplanetMigrationDirection.NONE
      ? 0
      : 0.4,
    sourceOrdinals.length -
      1,
  );
}
