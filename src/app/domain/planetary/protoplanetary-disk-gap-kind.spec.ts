import {
  ProtoplanetaryDiskGapKind,
} from './protoplanetary-disk-gap-kind';

describe(
  'ProtoplanetaryDiskGapKind point 17.3',
  () => {
    it(
      'should expose stable V1 codes without implying a protoplanet origin',
      () => {
        expect(
          ProtoplanetaryDiskGapKind.values
            .map(
              value => [
                value.name,
                value.code,
              ],
            ),
        ).toEqual([
          [
            'VISCOSITY_TRANSITION_GAP',
            1,
          ],
          [
            'CONDENSATION_FRONT_DEPLETION_GAP',
            2,
          ],
          [
            'PHOTOEVAPORATIVE_GAP',
            3,
          ],
        ]);
      },
    );

    it(
      'should round-trip stable codes and reject unknown ones',
      () => {
        for (
          const kind
          of ProtoplanetaryDiskGapKind.values
        ) {
          expect(
            ProtoplanetaryDiskGapKind.fromCode(
              kind.code,
            ),
          ).toBe(
            kind,
          );
        }

        expect(
          ProtoplanetaryDiskGapKind.fromCodeOrNull(
            999,
          ),
        ).toBeNull();

        expect(
          () =>
            ProtoplanetaryDiskGapKind.fromCode(
              999,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
