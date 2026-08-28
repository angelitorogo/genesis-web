import {
  ProtoplanetaryCondensationRegionKind,
} from './protoplanetary-condensation-region-kind';

import {
  ProtoplanetCandidate,
} from './protoplanet-candidate';

import {
  ProtoplanetCandidateComposition,
} from './protoplanet-candidate-composition';

describe(
  'ProtoplanetCandidate point 17.4',
  () => {
    it(
      'should expose one bounded initial solid candidate without materializing migration or a gas envelope',
      () => {
        const candidate =
          new ProtoplanetCandidate(
            3,
            4.8,
            1.25,
            ProtoplanetCandidateComposition.ICE_RICH,
            ProtoplanetaryCondensationRegionKind.WATER_ICE_RICH_SOLIDS,
            0.82,
            0.74,
            0.41,
          );

        expect(
          candidate.formationOrdinal,
        ).toBe(3);

        expect(
          candidate.orbitalRadiusAu,
        ).toBe(4.8);

        expect(
          candidate.solidMassEarth,
        ).toBe(1.25);

        expect(
          candidate.isIceBearing,
        ).toBe(true);
      },
    );

    it(
      'should distinguish refractory/rocky candidates from ice-bearing candidates',
      () => {
        const rocky =
          new ProtoplanetCandidate(
            1,
            0.7,
            0.12,
            ProtoplanetCandidateComposition.ROCKY,
            ProtoplanetaryCondensationRegionKind.ROCKY_SILICATE_SOLIDS,
            1,
            0.6,
            0.1,
          );

        const volatile =
          new ProtoplanetCandidate(
            2,
            20,
            0.8,
            ProtoplanetCandidateComposition.VOLATILE_RICH,
            ProtoplanetaryCondensationRegionKind.CO2_ICE_RICH_SOLIDS,
            1,
            0.7,
            0.5,
          );

        expect(
          rocky.isIceBearing,
        ).toBe(false);

        expect(
          volatile.isIceBearing,
        ).toBe(true);
      },
    );

    it(
      'should reject invalid ordinals, masses, radii and normalized potentials',
      () => {
        const create =
          (
            ordinal:
              number,

            radius:
              number,

            mass:
              number,

            retention:
              number,

            growth:
              number,

            gas:
              number,
          ) =>
            new ProtoplanetCandidate(
              ordinal,
              radius,
              mass,
              ProtoplanetCandidateComposition.ROCKY,
              ProtoplanetaryCondensationRegionKind.ROCKY_SILICATE_SOLIDS,
              retention,
              growth,
              gas,
            );

        expect(
          () =>
            create(
              0,
              1,
              1,
              1,
              1,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            create(
              1,
              0,
              1,
              1,
              1,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            create(
              1,
              1,
              0,
              1,
              1,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            create(
              1,
              1,
              1,
              1.01,
              1,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            create(
              1,
              1,
              1,
              1,
              -0.01,
              1,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
