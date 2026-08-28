import {
  ProtoplanetaryCondensationRegion,
} from './protoplanetary-condensation-region';

import {
  ProtoplanetaryCondensationRegionKind,
} from './protoplanetary-condensation-region-kind';

import {
  ProtoplanetaryDiskGap,
} from './protoplanetary-disk-gap';

import {
  ProtoplanetaryDiskGapKind,
} from './protoplanetary-disk-gap-kind';

import {
  ProtoplanetaryDiskStructure,
} from './protoplanetary-disk-structure';

describe(
  'ProtoplanetaryDiskStructure point 17.3',
  () => {
    const regions =
      () => [
        new ProtoplanetaryCondensationRegion(
          ProtoplanetaryCondensationRegionKind.ROCKY_SILICATE_SOLIDS,
          0.1,
          3,
          800,
          170,
        ),
        new ProtoplanetaryCondensationRegion(
          ProtoplanetaryCondensationRegionKind.WATER_ICE_RICH_SOLIDS,
          3,
          100,
          170,
          30,
        ),
      ];

    const validStructure =
      () =>
        new ProtoplanetaryDiskStructure(
          0.05,
          0.1,
          100,
          0.049,
          0.001,
          0.98,
          0.02,
          0.001 /
            0.049,
          0.2,
          0.4,
          0.52,
          [
            new ProtoplanetaryDiskGap(
              ProtoplanetaryDiskGapKind.VISCOSITY_TRANSITION_GAP,
              5,
              7,
              0.2,
              0.5,
            ),
          ],
          regions(),
        );

    it(
      'should accept a coherent gas/dust partition, gaps and complete condensation tiling',
      () => {
        const structure =
          validStructure();

        expect(
          structure.hasGaps,
        ).toBe(true);

        expect(
          structure.isGasDominated,
        ).toBe(true);

        expect(
          structure.waterSnowLineRadiusAuOrNull,
        ).toBe(
          3,
        );
      },
    );

    it(
      'should reject gas and dust masses that do not reconstruct the frozen point-17.2 bulk mass',
      () => {
        expect(
          () =>
            new ProtoplanetaryDiskStructure(
              0.05,
              0.1,
              100,
              0.040,
              0.001,
              0.98,
              0.02,
              0.025,
              0.2,
              0.4,
              0.52,
              [],
              regions(),
            ),
        ).toThrow(
          /must equal sourceDiskMassSolar/u,
        );
      },
    );

    it(
      'should reject overlapping gaps',
      () => {
        expect(
          () =>
            new ProtoplanetaryDiskStructure(
              0.05,
              0.1,
              100,
              0.049,
              0.001,
              0.98,
              0.02,
              0.001 /
                0.049,
              0.2,
              0.4,
              0.52,
              [
                new ProtoplanetaryDiskGap(
                  ProtoplanetaryDiskGapKind.VISCOSITY_TRANSITION_GAP,
                  5,
                  8,
                  0.2,
                  0.5,
                ),
                new ProtoplanetaryDiskGap(
                  ProtoplanetaryDiskGapKind.CONDENSATION_FRONT_DEPLETION_GAP,
                  7,
                  9,
                  0.1,
                  0.4,
                ),
              ],
              regions(),
            ),
        ).toThrow(
          /non-overlapping/u,
        );
      },
    );

    it(
      'should reject condensation regions that do not tile the whole disk continuously',
      () => {
        expect(
          () =>
            new ProtoplanetaryDiskStructure(
              0.05,
              0.1,
              100,
              0.049,
              0.001,
              0.98,
              0.02,
              0.001 /
                0.049,
              0.2,
              0.4,
              0.52,
              [],
              [
                new ProtoplanetaryCondensationRegion(
                  ProtoplanetaryCondensationRegionKind.ROCKY_SILICATE_SOLIDS,
                  0.1,
                  2,
                  800,
                  200,
                ),
                new ProtoplanetaryCondensationRegion(
                  ProtoplanetaryCondensationRegionKind.WATER_ICE_RICH_SOLIDS,
                  3,
                  100,
                  170,
                  30,
                ),
              ],
            ),
        ).toThrow(
          /contiguous/u,
        );
      },
    );
  },
);
