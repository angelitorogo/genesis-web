import {
  ProtoplanetaryDiskProfile,
} from './protoplanetary-disk-profile';

import {
  ProtoplanetaryDiskStage,
} from './protoplanetary-disk-stage';

describe(
  'ProtoplanetaryDiskProfile point 17.2',
  () => {
    const validProfile =
      () =>
        new ProtoplanetaryDiskProfile(
          ProtoplanetaryDiskStage.MASSIVE_PRIMORDIAL_DISK,
          1,
          5,
          0.2,
          1,
          0.05,
          0.05,
          0.05,
          30,
          100,
          300,
          1.0,
          0.04,
          1e-8,
        );

    it(
      'should accept a coherent axisymmetric bulk disk envelope',
      () => {
        const profile =
          validProfile();

        expect(
          profile.isEmbedded,
        ).toBe(false);

        expect(
          profile.isDispersing,
        ).toBe(false);

        expect(
          profile.isActivelyAccreting,
        ).toBe(true);
      },
    );

    it(
      'should reject an inconsistent disk-to-central mass ratio',
      () => {
        expect(
          () =>
            new ProtoplanetaryDiskProfile(
              ProtoplanetaryDiskStage.MASSIVE_PRIMORDIAL_DISK,
              1,
              5,
              0.2,
              1,
              0.05,
              0.07,
              0.05,
              30,
              100,
              300,
              1.0,
              0.04,
              1e-8,
            ),
        ).toThrow(
          /diskToCentralMassRatio/u,
        );
      },
    );

    it(
      'should reject a radial envelope whose characteristic radius is not between its inner and outer edges',
      () => {
        expect(
          () =>
            new ProtoplanetaryDiskProfile(
              ProtoplanetaryDiskStage.EVOLVING_PRIMORDIAL_DISK,
              2,
              5,
              0.4,
              1,
              0.04,
              0.04,
              40,
              30,
              100,
              280,
              1.0,
              0.04,
              1e-8,
            ),
        ).toThrow(
          /innerRadiusAu < characteristicRadiusAu < outerRadiusAu/u,
        );
      },
    );

    it(
      'should reject an evolution progress that disagrees with disk age and dispersal age',
      () => {
        expect(
          () =>
            new ProtoplanetaryDiskProfile(
              ProtoplanetaryDiskStage.DISPERSING_DISK,
              4,
              5,
              0.5,
              1,
              0.01,
              0.01,
              0.05,
              35,
              100,
              260,
              1.05,
              0.04,
              1e-9,
            ),
        ).toThrow(
          /evolutionProgress01/u,
        );
      },
    );
  },
);
