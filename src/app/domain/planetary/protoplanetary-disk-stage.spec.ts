import {
  ProtoplanetaryDiskStage,
} from './protoplanetary-disk-stage';

describe(
  'ProtoplanetaryDiskStage point 17.2',
  () => {
    it(
      'should expose stable V1 codes for the four bulk primordial-disk stages',
      () => {
        expect(
          ProtoplanetaryDiskStage.values
            .map(
              value => [
                value.name,
                value.code,
              ],
            ),
        ).toEqual([
          [
            'EMBEDDED_ACCRETION_DISK',
            1,
          ],
          [
            'MASSIVE_PRIMORDIAL_DISK',
            2,
          ],
          [
            'EVOLVING_PRIMORDIAL_DISK',
            3,
          ],
          [
            'DISPERSING_DISK',
            4,
          ],
        ]);
      },
    );

    it(
      'should round-trip stable codes and reject unknown ones',
      () => {
        for (
          const stage
          of ProtoplanetaryDiskStage.values
        ) {
          expect(
            ProtoplanetaryDiskStage.fromCode(
              stage.code,
            ),
          ).toBe(
            stage,
          );
        }

        expect(
          ProtoplanetaryDiskStage.fromCodeOrNull(
            999,
          ),
        ).toBeNull();

        expect(
          () =>
            ProtoplanetaryDiskStage.fromCode(
              999,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
