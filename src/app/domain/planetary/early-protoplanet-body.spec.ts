import {
  EarlyProtoplanetBody,
} from './early-protoplanet-body';

import {
  ProtoplanetCompositionMixture,
} from './protoplanet-composition-mixture';

import {
  ProtoplanetMigrationDirection,
} from './protoplanet-migration-direction';

describe(
  'EarlyProtoplanetBody point 17.5',
  () => {
    it(
      'should preserve source ordinals and expose migration/collision flags',
      () => {
        const ordinals = [
          1,
          3,
        ];

        const body =
          new EarlyProtoplanetBody(
            ordinals,
            4,
            3,
            2,
            new ProtoplanetCompositionMixture(
              0,
              0.5,
              0.5,
              0,
            ),
            0.7,
            0.4,
            ProtoplanetMigrationDirection.INWARD,
            0.5,
            1,
          );

        ordinals.length =
          0;

        expect(
          body.sourceFormationOrdinals,
        ).toEqual([
          1,
          3,
        ]);

        expect(
          body.hasMigrated,
        ).toBe(true);

        expect(
          body.hasCollided,
        ).toBe(true);

        expect(
          Object.isFrozen(
            body.sourceFormationOrdinals,
          ),
        ).toBe(true);
      },
    );

    it(
      'should require migration direction to match net radial displacement',
      () => {
        expect(
          () =>
            new EarlyProtoplanetBody(
              [
                1,
              ],
              2,
              1,
              0.5,
              new ProtoplanetCompositionMixture(
                0,
                1,
                0,
                0,
              ),
              0.5,
              0.2,
              ProtoplanetMigrationDirection.OUTWARD,
              0.4,
              0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should require one fewer collision than source candidates in a perfect-merger survivor',
      () => {
        expect(
          () =>
            new EarlyProtoplanetBody(
              [
                1,
                2,
              ],
              2,
              2,
              0.5,
              new ProtoplanetCompositionMixture(
                0,
                1,
                0,
                0,
              ),
              0.5,
              0.2,
              ProtoplanetMigrationDirection.NONE,
              0,
              0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
