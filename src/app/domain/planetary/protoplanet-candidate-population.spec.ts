import {
  ProtoplanetaryCondensationRegionKind,
} from './protoplanetary-condensation-region-kind';

import {
  ProtoplanetCandidate,
} from './protoplanet-candidate';

import {
  ProtoplanetCandidateComposition,
} from './protoplanet-candidate-composition';

import {
  ProtoplanetCandidatePopulation,
} from './protoplanet-candidate-population';

describe(
  'ProtoplanetCandidatePopulation point 17.4',
  () => {
    it(
      'should conserve the frozen point-17.3 dust reservoir and freeze the candidate list',
      () => {
        const candidates = [
          candidate(
            2,
            0.8,
            0.15,
          ),
          candidate(
            1,
            3.2,
            0.35,
          ),
        ];

        const population =
          new ProtoplanetCandidatePopulation(
            0.05,
            100,
            10,
            0.5,
            9.5,
            0.05,
            candidates,
          );

        candidates.length =
          0;

        expect(
          population.hasCandidates,
        ).toBe(true);

        expect(
          population.candidates,
        ).toHaveLength(2);

        expect(
          population.candidateSolidMassEarth +
            population.residualDustMassEarth,
        ).toBeCloseTo(
          population.sourceDustMassEarth,
          14,
        );

        expect(
          Object.isFrozen(
            population.candidates,
          ),
        ).toBe(true);
      },
    );

    it(
      'should support an empty candidate population while preserving all source dust',
      () => {
        const population =
          new ProtoplanetCandidatePopulation(
            0.05,
            100,
            4,
            0,
            4,
            0,
            [],
          );

        expect(
          population.hasCandidates,
        ).toBe(false);
      },
    );

    it(
      'should reject unsorted, duplicate-ordinal or mass-inconsistent populations',
      () => {
        expect(
          () =>
            new ProtoplanetCandidatePopulation(
              0.05,
              100,
              10,
              0.5,
              9.5,
              0.05,
              [
                candidate(
                  1,
                  3,
                  0.25,
                ),
                candidate(
                  2,
                  1,
                  0.25,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ProtoplanetCandidatePopulation(
              0.05,
              100,
              10,
              0.5,
              9.5,
              0.05,
              [
                candidate(
                  1,
                  1,
                  0.25,
                ),
                candidate(
                  1,
                  3,
                  0.25,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ProtoplanetCandidatePopulation(
              0.05,
              100,
              10,
              0.7,
              9.3,
              0.07,
              [
                candidate(
                  1,
                  1,
                  0.2,
                ),
                candidate(
                  2,
                  3,
                  0.2,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function candidate(
  ordinal:
    number,

  radiusAu:
    number,

  massEarth:
    number,
): ProtoplanetCandidate {

  return new ProtoplanetCandidate(
    ordinal,
    radiusAu,
    massEarth,
    ProtoplanetCandidateComposition.ROCKY,
    ProtoplanetaryCondensationRegionKind.ROCKY_SILICATE_SOLIDS,
    1,
    0.6,
    0.2,
  );
}
