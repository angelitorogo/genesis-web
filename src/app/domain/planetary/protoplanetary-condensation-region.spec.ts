import {
  ProtoplanetaryCondensationRegion,
} from './protoplanetary-condensation-region';

import {
  ProtoplanetaryCondensationRegionKind,
} from './protoplanetary-condensation-region-kind';

describe(
  'ProtoplanetaryCondensationRegion point 17.3',
  () => {
    it(
      'should expose the V1 condensable-solid fraction from its region kind',
      () => {
        const region =
          new ProtoplanetaryCondensationRegion(
            ProtoplanetaryCondensationRegionKind.WATER_ICE_RICH_SOLIDS,
            3,
            10,
            170,
            90,
          );

        expect(
          region.condensableSolidFraction01,
        ).toBe(
          0.72,
        );

        expect(
          region.geometricMidpointRadiusAu,
        ).toBeCloseTo(
          Math.sqrt(
            30,
          ),
          12,
        );
      },
    );

    it(
      'should reject a region whose temperature increases outward',
      () => {
        expect(
          () =>
            new ProtoplanetaryCondensationRegion(
              ProtoplanetaryCondensationRegionKind.ROCKY_SILICATE_SOLIDS,
              1,
              2,
              200,
              400,
            ),
        ).toThrow(
          /must not increase radially outward/u,
        );
      },
    );
  },
);
