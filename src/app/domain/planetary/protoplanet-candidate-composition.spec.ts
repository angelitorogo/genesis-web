import {
  ProtoplanetCandidateComposition,
} from './protoplanet-candidate-composition';

describe(
  'ProtoplanetCandidateComposition point 17.4',
  () => {
    it(
      'should keep stable V1 codes and increasingly ice-rich broad solid families',
      () => {
        expect(
          ProtoplanetCandidateComposition.values.map(
            value =>
              value.code,
          ),
        ).toEqual([
          1,
          2,
          3,
          4,
        ]);

        expect(
          ProtoplanetCandidateComposition.values.map(
            value =>
              value.name,
          ),
        ).toEqual([
          'REFRACTORY_RICH',
          'ROCKY',
          'ICE_RICH',
          'VOLATILE_RICH',
        ]);

        const iceFractions =
          ProtoplanetCandidateComposition.values.map(
            value =>
              value.nominalIceMassFraction01,
          );

        expect(
          iceFractions,
        ).toEqual(
          [
            ...iceFractions,
          ].sort(
            (
              first,
              second,
            ) =>
              first -
              second,
          ),
        );
      },
    );

    it(
      'should round-trip codes and reject unknown codes',
      () => {
        for (
          const value
          of ProtoplanetCandidateComposition.values
        ) {
          expect(
            ProtoplanetCandidateComposition.fromCode(
              value.code,
            ),
          ).toBe(
            value,
          );
        }

        expect(
          ProtoplanetCandidateComposition.fromCodeOrNull(
            999,
          ),
        ).toBeNull();

        expect(
          () =>
            ProtoplanetCandidateComposition.fromCode(
              999,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
