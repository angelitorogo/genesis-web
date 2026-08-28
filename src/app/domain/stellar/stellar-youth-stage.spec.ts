import {
  StellarYouthStage,
} from './stellar-youth-stage';

describe(
  'StellarYouthStage point 17.1',
  () => {
    it(
      'should expose stable V1 codes for proto, pre-main-sequence and young components',
      () => {
        expect(
          StellarYouthStage.values
            .map(
              value => [
                value.name,
                value.code,
              ],
            ),
        ).toEqual([
          [
            'PROTOSTAR',
            1,
          ],
          [
            'PRE_MAIN_SEQUENCE',
            2,
          ],
          [
            'YOUNG_STAR',
            3,
          ],
          [
            'YOUNG_BROWN_DWARF',
            4,
          ],
        ]);
      },
    );

    it(
      'should round-trip stable codes and reject unknown values',
      () => {
        for (
          const stage
          of StellarYouthStage.values
        ) {
          expect(
            StellarYouthStage.fromCode(
              stage.code,
            ),
          ).toBe(
            stage,
          );
        }

        expect(
          StellarYouthStage.fromCodeOrNull(
            999,
          ),
        ).toBeNull();

        expect(
          () =>
            StellarYouthStage.fromCode(
              999,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
