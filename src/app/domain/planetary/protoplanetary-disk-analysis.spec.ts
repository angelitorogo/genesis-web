import {
  ProtoplanetaryDiskStage,
} from './protoplanetary-disk-stage';

import {
  StellarYouthStage,
} from '../stellar/stellar-youth-stage';

import {
  ProtoplanetaryDiskAnalysis,
} from './protoplanetary-disk-analysis';

describe(
  'ProtoplanetaryDiskAnalysis',
  () => {
    function analysis():
      ProtoplanetaryDiskAnalysis {

      return new ProtoplanetaryDiskAnalysis(
        StellarYouthStage.PRE_MAIN_SEQUENCE,
        ProtoplanetaryDiskStage.EVOLVING_PRIMORDIAL_DISK,
        2.5,
        0.04,
        0.08,
        24,
        108,
        0.985,
        0.015,
        2,
        5,
        3.2,
        6,
        8.4,
        4,
        3,
        2,
      );
    }

    it(
      'should expose only the observation-facing 17.1-17.5 summary and derived flags',
      () => {
        const value =
          analysis();

        expect(
          value.hasGaps,
        ).toBe(true);

        expect(
          value.hasCandidatePopulation,
        ).toBe(true);

        expect(
          value.hasEarlyMigration,
        ).toBe(true);

        expect(
          value.hasEarlyCollisions,
        ).toBe(true);
      },
    );

    it(
      'should require gas and dust fractions to conserve the whole disk mass fraction',
      () => {
        expect(
          () =>
            new ProtoplanetaryDiskAnalysis(
              StellarYouthStage.PROTOSTAR,
              ProtoplanetaryDiskStage.EMBEDDED_ACCRETION_DISK,
              0.1,
              0.1,
              0.05,
              20,
              80,
              0.9,
              0.05,
              0,
              3,
              null,
              0,
              0,
              0,
              0,
              0,
            ),
        ).toThrowError(
          /sum to 1/,
        );
      },
    );

    it(
      'should preserve the frozen 17.4-17.5 candidate collision accounting',
      () => {
        expect(
          () =>
            new ProtoplanetaryDiskAnalysis(
              StellarYouthStage.YOUNG_STAR,
              ProtoplanetaryDiskStage.DISPERSING_DISK,
              5,
              0.01,
              0.1,
              30,
              120,
              0.97,
              0.03,
              1,
              5,
              4,
              5,
              2,
              4,
              1,
              0,
            ),
        ).toThrowError(
          /counts are inconsistent/,
        );
      },
    );
  },
);
