import {
  StellarNeutronStarFormationChannel,
} from './stellar-neutron-star-formation-channel';

describe(
  'StellarNeutronStarFormationChannel',
  () => {
    it(
      'should expose exactly the two point-14.6 isolated-star remnant formation channels',
      () => {
        expect(
          StellarNeutronStarFormationChannel.values
            .map(
              value =>
                value.name,
            ),
        ).toEqual([
          'IRON_CORE_COLLAPSE',
          'ELECTRON_CAPTURE_COLLAPSE',
        ]);
      },
    );

    it(
      'should keep stable V1 codes and resolve every valid code to its canonical singleton',
      () => {
        const expected = [
          [
            StellarNeutronStarFormationChannel.IRON_CORE_COLLAPSE,
            1,
          ],
          [
            StellarNeutronStarFormationChannel.ELECTRON_CAPTURE_COLLAPSE,
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
            StellarNeutronStarFormationChannel
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
          StellarNeutronStarFormationChannel
            .fromCodeOrNull(
              0,
            ),
        ).toBeNull();

        expect(
          StellarNeutronStarFormationChannel
            .fromCodeOrNull(
              3,
            ),
        ).toBeNull();

        expect(
          () =>
            StellarNeutronStarFormationChannel
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
