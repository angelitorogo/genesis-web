import {
  StellarBlackHoleFormationChannel,
} from './stellar-black-hole-formation-channel';

describe(
  'StellarBlackHoleFormationChannel',
  () => {
    it(
      'should expose exactly the two point-14.7 isolated-star remnant formation channels',
      () => {
        expect(
          StellarBlackHoleFormationChannel.values
            .map(
              value =>
                value.name,
            ),
        ).toEqual([
          'FALLBACK_CORE_COLLAPSE',
          'DIRECT_COLLAPSE',
        ]);
      },
    );

    it(
      'should keep stable V1 codes and resolve every valid code to its canonical singleton',
      () => {
        const expected = [
          [
            StellarBlackHoleFormationChannel.FALLBACK_CORE_COLLAPSE,
            1,
          ],
          [
            StellarBlackHoleFormationChannel.DIRECT_COLLAPSE,
            2,
          ],
        ] as const;

        for (
          const [
            channel,
            code,
          ] of expected
        ) {
          expect(
            channel.code,
          ).toBe(
            code,
          );

          expect(
            StellarBlackHoleFormationChannel
              .fromCode(
                code,
              ),
          ).toBe(
            channel,
          );
        }
      },
    );

    it(
      'should reject unknown serialization codes',
      () => {
        expect(
          StellarBlackHoleFormationChannel
            .fromCodeOrNull(
              0,
            ),
        ).toBeNull();

        expect(
          StellarBlackHoleFormationChannel
            .fromCodeOrNull(
              3,
            ),
        ).toBeNull();

        expect(
          () =>
            StellarBlackHoleFormationChannel
              .fromCode(
                0,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
