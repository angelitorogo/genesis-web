import {
  ProtoplanetaryDiskStage,
} from '../../domain/planetary/protoplanetary-disk-stage';

import {
  StellarYouthStage,
} from '../../domain/stellar/stellar-youth-stage';

import {
  type ProtoplanetaryFormationSnapshot,
} from './protoplanetary-formation-snapshot-generator';

import {
  ProtoplanetaryDiskAnalysisEngine,
} from './protoplanetary-disk-analysis-engine';

describe(
  'ProtoplanetaryDiskAnalysisEngine',
  () => {
    it(
      'should project the frozen 17.1-17.5 snapshot without creating a second formation model',
      () => {
        const snapshot =
          {
            stellarYouthProfile: {
              stage:
                StellarYouthStage.PRE_MAIN_SEQUENCE,
            },
            diskProfile: {
              stage:
                ProtoplanetaryDiskStage.EVOLVING_PRIMORDIAL_DISK,
              ageMillionYears:
                2.4,
              diskMassSolar:
                0.041,
              innerRadiusAu:
                0.09,
              characteristicRadiusAu:
                26,
              outerRadiusAu:
                112,
            },
            diskStructure: {
              gasMassFraction01:
                0.982,
              dustMassFraction01:
                0.018,
              gaps: [
                {},
                {},
              ],
              condensationRegions: [
                {},
                {},
                {},
                {},
                {},
              ],
              waterSnowLineRadiusAuOrNull:
                3.4,
            },
            candidatePopulation: {
              candidates: [
                {},
                {},
                {},
                {},
              ],
              candidateSolidMassEarth:
                7.25,
            },
            earlyDynamics: {
              survivorCount:
                3,
              migratedBodyCount:
                2,
              collisionCount:
                1,
            },
          } as unknown as
            ProtoplanetaryFormationSnapshot;

        const analysis =
          ProtoplanetaryDiskAnalysisEngine
            .fromSnapshot(
              snapshot,
            );

        expect(
          analysis.stellarYouthStage,
        ).toBe(
          StellarYouthStage.PRE_MAIN_SEQUENCE,
        );

        expect(
          analysis.diskStage,
        ).toBe(
          ProtoplanetaryDiskStage.EVOLVING_PRIMORDIAL_DISK,
        );

        expect(
          analysis.gapCount,
        ).toBe(2);

        expect(
          analysis.initialCandidateCount,
        ).toBe(4);

        expect(
          analysis.survivingBodyCount,
        ).toBe(3);

        expect(
          analysis.collisionCount,
        ).toBe(1);
      },
    );
  },
);
