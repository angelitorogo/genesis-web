import {
  CometActivityRegime,
  cometActivityRegimeV1,
} from './comet-activity-regime';

describe(
  'CometActivityRegime point 22.6 V1',
  () => {
    it(
      'should map the frozen normalized activity thresholds exactly',
      () => {
        expect(
          cometActivityRegimeV1(
            0.039,
          ),
        ).toBe(
          CometActivityRegime
            .DORMANT,
        );

        expect(
          cometActivityRegimeV1(
            0.04,
          ),
        ).toBe(
          CometActivityRegime
            .WEAK,
        );

        expect(
          cometActivityRegimeV1(
            0.15,
          ),
        ).toBe(
          CometActivityRegime
            .MODERATE,
        );

        expect(
          cometActivityRegimeV1(
            0.35,
          ),
        ).toBe(
          CometActivityRegime
            .STRONG,
        );

        expect(
          cometActivityRegimeV1(
            0.65,
          ),
        ).toBe(
          CometActivityRegime
            .EXTREME,
        );
      },
    );
  },
);
