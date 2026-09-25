import {
  ProtoplanetCandidateComposition,
} from './protoplanet-candidate-composition';

import {
  ProtoplanetCompositionMixture,
} from './protoplanet-composition-mixture';

describe(
  'ProtoplanetCompositionMixture point 17.5',
  () => {
    it(
      'should materialize pure point-17.4 source compositions',
      () => {
        const rocky =
          ProtoplanetCompositionMixture
            .fromCandidateComposition(
              ProtoplanetCandidateComposition.ROCKY,
            );

        expect(
          rocky.rockyFraction01,
        ).toBe(1);

        expect(
          rocky.dominantComposition,
        ).toBe(
          ProtoplanetCandidateComposition.ROCKY,
        );
      },
    );

    it(
      'should conserve source-family fractions when collision products are mass weighted',
      () => {
        const mixed =
          ProtoplanetCompositionMixture
            .mergeWeighted([
              {
                mixture:
                  ProtoplanetCompositionMixture
                    .fromCandidateComposition(
                      ProtoplanetCandidateComposition.ROCKY,
                    ),
                solidMassEarth:
                  3,
              },
              {
                mixture:
                  ProtoplanetCompositionMixture
                    .fromCandidateComposition(
                      ProtoplanetCandidateComposition.ICE_RICH,
                    ),
                solidMassEarth:
                  1,
              },
            ]);

        expect(
          mixed.rockyFraction01,
        ).toBeCloseTo(
          0.75,
          14,
        );

        expect(
          mixed.iceRichFraction01,
        ).toBeCloseTo(
          0.25,
          14,
        );

        expect(
          mixed.dominantComposition,
        ).toBe(
          ProtoplanetCandidateComposition.ROCKY,
        );
      },
    );


    it(
      'should clamp only the derived ice-bearing fraction when normalized source roundoff lands a few ulps above one',
      () => {
        const mixture =
          new ProtoplanetCompositionMixture(
            0,
            0,
            0.7,
            0.3000000000000002,
          );

        expect(
          mixture.iceRichFraction01,
        ).toBe(0.7);

        expect(
          mixture.volatileRichFraction01,
        ).toBe(0.3000000000000002);

        expect(
          mixture.iceBearingFraction01,
        ).toBe(1);
      },
    );

    it(
      'should reject non-normalized mixtures and invalid contribution masses',
      () => {
        expect(
          () =>
            new ProtoplanetCompositionMixture(
              0.4,
              0.4,
              0.4,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ProtoplanetCompositionMixture
              .mergeWeighted([
                {
                  mixture:
                    new ProtoplanetCompositionMixture(
                      0,
                      1,
                      0,
                      0,
                    ),
                  solidMassEarth:
                    0,
                },
              ]),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
