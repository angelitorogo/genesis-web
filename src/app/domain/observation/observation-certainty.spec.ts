import {
  ObservationCertainty,
  ObservationCertaintyAssessment,
  ObservationCertaintyTransition,
} from './observation-certainty';

describe(
  'ObservationCertainty',
  () => {

    it(
      'should preserve the exact canonical CANDIDATE PROBABLE CONFIRMED order with explicit ranks',
      () => {
        expect(
          ObservationCertainty
            .values
            .map(
              (
                certainty,
              ) => [
                certainty.name,
                certainty.rank,
              ],
            ),
        ).toEqual([
          [
            'CANDIDATE',
            1,
          ],
          [
            'PROBABLE',
            2,
          ],
          [
            'CONFIRMED',
            3,
          ],
        ]);

        expect(
          ObservationCertainty
            .fromRank(
              2,
            ),
        ).toBe(
          ObservationCertainty
            .PROBABLE,
        );

        expect(
          () =>
            ObservationCertainty
              .fromRank(
                0,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should expose only the qualitative certainty stage and derive the three assessment flags',
      () => {
        const candidate =
          new ObservationCertaintyAssessment(
            ObservationCertainty
              .CANDIDATE,
          );

        expect(
          Object.keys(
            candidate,
          ),
        ).toEqual([
          'certainty',
        ]);

        expect(
          candidate.isCandidate,
        ).toBe(
          true,
        );

        expect(
          candidate.isProbable,
        ).toBe(
          false,
        );

        expect(
          candidate.isConfirmed,
        ).toBe(
          false,
        );

        const probable =
          new ObservationCertaintyAssessment(
            ObservationCertainty
              .PROBABLE,
          );

        expect(
          probable.isCandidate,
        ).toBe(
          false,
        );

        expect(
          probable.isProbable,
        ).toBe(
          true,
        );

        expect(
          probable.isConfirmed,
        ).toBe(
          false,
        );

        const confirmed =
          new ObservationCertaintyAssessment(
            ObservationCertainty
              .CONFIRMED,
          );

        expect(
          confirmed.isCandidate,
        ).toBe(
          false,
        );

        expect(
          confirmed.isProbable,
        ).toBe(
          false,
        );

        expect(
          confirmed.isConfirmed,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should derive transition flags without introducing numeric confidence or evidence fields',
      () => {
        const idempotent =
          new ObservationCertaintyTransition(
            ObservationCertainty
              .CANDIDATE,
            ObservationCertainty
              .CANDIDATE,
          );

        expect(
          idempotent.didChange,
        ).toBe(
          false,
        );

        expect(
          idempotent.didAdvance,
        ).toBe(
          false,
        );

        expect(
          idempotent.isIdempotent,
        ).toBe(
          true,
        );

        const advance =
          new ObservationCertaintyTransition(
            ObservationCertainty
              .CANDIDATE,
            ObservationCertainty
              .PROBABLE,
          );

        expect(
          advance.didChange,
        ).toBe(
          true,
        );

        expect(
          advance.didAdvance,
        ).toBe(
          true,
        );

        expect(
          advance.isIdempotent,
        ).toBe(
          false,
        );

        expect(
          Object.keys(
            advance,
          ),
        ).toEqual([
          'previousCertainty',
          'newCertainty',
        ]);

        expect(
          Object.keys(
            advance,
          ),
        ).not.toContain(
          'probability',
        );

        expect(
          Object.keys(
            advance,
          ),
        ).not.toContain(
          'confidence',
        );

        expect(
          Object.keys(
            advance,
          ),
        ).not.toContain(
          'evidenceScore',
        );
      },
    );

    it(
      'should reject non-canonical runtime certainty instances',
      () => {
        const invalid =
          {
            name:
              'CANDIDATE',

            rank:
              1,
          } as unknown as
            ObservationCertainty;

        expect(
          () =>
            new ObservationCertaintyAssessment(
              invalid,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ObservationCertaintyTransition(
              ObservationCertainty
                .CANDIDATE,
              invalid,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
