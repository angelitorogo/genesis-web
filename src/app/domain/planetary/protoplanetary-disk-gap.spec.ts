import {
  ProtoplanetaryDiskGap,
} from './protoplanetary-disk-gap';

import {
  ProtoplanetaryDiskGapKind,
} from './protoplanetary-disk-gap-kind';

describe(
  'ProtoplanetaryDiskGap point 17.3',
  () => {
    it(
      'should expose derived center and width for a coherent annular depletion',
      () => {
        const gap =
          new ProtoplanetaryDiskGap(
            ProtoplanetaryDiskGapKind.VISCOSITY_TRANSITION_GAP,
            4,
            6,
            0.25,
            0.55,
          );

        expect(
          gap.centerRadiusAu,
        ).toBe(
          5,
        );

        expect(
          gap.widthAu,
        ).toBe(
          2,
        );
      },
    );

    it(
      'should reject an inverted annulus and an empty depletion',
      () => {
        expect(
          () =>
            new ProtoplanetaryDiskGap(
              ProtoplanetaryDiskGapKind.PHOTOEVAPORATIVE_GAP,
              6,
              4,
              0.8,
              0.8,
            ),
        ).toThrow(
          /innerRadiusAu < outerRadiusAu/u,
        );

        expect(
          () =>
            new ProtoplanetaryDiskGap(
              ProtoplanetaryDiskGapKind.CONDENSATION_FRONT_DEPLETION_GAP,
              2,
              3,
              0,
              0,
            ),
        ).toThrow(
          /deplete gas, dust or both/u,
        );
      },
    );
  },
);
