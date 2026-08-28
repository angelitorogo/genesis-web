import {
  EarlyProtoplanetCollision,
} from './early-protoplanet-collision';

describe(
  'EarlyProtoplanetCollision point 17.5',
  () => {
    it(
      'should freeze the source lineage of a simplified perfect merger',
      () => {
        const participants = [
          1,
          4,
        ];

        const collision =
          new EarlyProtoplanetCollision(
            1,
            participants,
            3.5,
            2.2,
            0.65,
          );

        participants.length =
          0;

        expect(
          collision.participantSourceFormationOrdinals,
        ).toEqual([
          1,
          4,
        ]);

        expect(
          Object.isFrozen(
            collision.participantSourceFormationOrdinals,
          ),
        ).toBe(true);
      },
    );

    it(
      'should reject a collision with fewer than two participants or invalid severity',
      () => {
        expect(
          () =>
            new EarlyProtoplanetCollision(
              1,
              [
                1,
              ],
              1,
              1,
              0.5,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new EarlyProtoplanetCollision(
              1,
              [
                1,
                2,
              ],
              1,
              1,
              1.1,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
