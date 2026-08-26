import {
  StellarPostMainSequenceStage,
} from './stellar-post-main-sequence-stage';

describe(
  'StellarPostMainSequenceStage',
  () => {
    it(
      'should expose exactly the point-14.4 RGB, AGB and supergiant evolutionary branches',
      () => {
        expect(
          StellarPostMainSequenceStage.values
            .map(
              value =>
                value.name,
            ),
        ).toEqual([
          'RED_GIANT_BRANCH',
          'ASYMPTOTIC_GIANT_BRANCH',
          'SUPERGIANT',
        ]);

        expect(
          StellarPostMainSequenceStage.values
            .map(
              value =>
                value.code,
            ),
        ).toEqual([
          1,
          2,
          3,
        ]);
      },
    );

    it(
      'should recover every V1 stage from its stable code without depending on singleton identity',
      () => {
        for (
          const stage
          of StellarPostMainSequenceStage.values
        ) {
          expect(
            StellarPostMainSequenceStage
              .fromCode(
                stage.code,
              )
              .name,
          ).toBe(
            stage.name,
          );
        }
      },
    );

    it(
      'should preserve nullable lookup and reject unknown codes',
      () => {
        expect(
          StellarPostMainSequenceStage
            .fromCodeOrNull(
              999,
            ),
        ).toBeNull();

        expect(
          () =>
            StellarPostMainSequenceStage
              .fromCode(
                999,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should not invent point-15 physical output, spectral color or point-14.8 transition thresholds',
      () => {
        for (
          const stage
          of StellarPostMainSequenceStage.values
        ) {
          expect(
            Object.keys(
              stage,
            ),
          ).toEqual([
            'name',
            'code',
          ]);

          for (
            const deferredProperty
            of [
              'massSolar',
              'radiusSolar',
              'luminositySolar',
              'effectiveTemperatureKelvin',
              'spectralType',
              'color',
              'minimumMassSolar',
              'maximumMassSolar',
              'lifetimeBillionYears',
            ]
          ) {
            expect(
              deferredProperty in
                stage,
            ).toBe(
              false,
            );
          }
        }
      },
    );
  },
);
