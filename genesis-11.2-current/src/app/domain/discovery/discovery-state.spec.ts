import {
  DiscoveryState,
} from './discovery-state';

describe(
  'DiscoveryState',
  () => {
    it(
      'should preserve the exact Android state codes',
      () => {
        expect(
          DiscoveryState
            .values
            .map(
              (state) => ({
                name:
                  state.name,

                code:
                  state.code,
              }),
            ),
        ).toEqual([
          {
            name:
              'UNKNOWN',

            code:
              0,
          },
          {
            name:
              'DETECTED',

            code:
              1,
          },
          {
            name:
              'DISCOVERED',

            code:
              2,
          },
          {
            name:
              'VISITED',

            code:
              3,
          },
          {
            name:
              'CATALOGUED',

            code:
              4,
          },
          {
            name:
              'CONFIRMED',

            code:
              5,
          },
        ]);
      },
    );

    it(
      'should preserve UNKNOWN as code zero',
      () => {
        expect(
          DiscoveryState
            .UNKNOWN
            .code,
        ).toBe(0);
      },
    );

    it(
      'should expose the five persistable known states',
      () => {
        expect(
          DiscoveryState
            .knownValues
            .map(
              (state) =>
                state.name,
            ),
        ).toEqual([
          'DETECTED',
          'DISCOVERED',
          'VISITED',
          'CATALOGUED',
          'CONFIRMED',
        ]);
      },
    );

    it(
      'should resolve every valid code',
      () => {
        for (
          const state
          of DiscoveryState.values
        ) {
          expect(
            DiscoveryState
              .fromCode(
                state.code,
              ),
          ).toBe(
            state,
          );
        }
      },
    );

    it(
      'should return null for unknown codes',
      () => {
        expect(
          DiscoveryState
            .fromCodeOrNull(
              -1,
            ),
        ).toBeNull();

        expect(
          DiscoveryState
            .fromCodeOrNull(
              6,
            ),
        ).toBeNull();

        expect(
          DiscoveryState
            .fromCodeOrNull(
              999,
            ),
        ).toBeNull();
      },
    );

    it(
      'should throw for an unknown code',
      () => {
        expect(
          () =>
            DiscoveryState
              .fromCode(
                6,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should identify UNKNOWN as not known',
      () => {
        expect(
          DiscoveryState
            .isKnown(
              DiscoveryState
                .UNKNOWN,
            ),
        ).toBe(false);
      },
    );

    it(
      'should identify every persisted state as known',
      () => {
        for (
          const state
          of DiscoveryState
            .knownValues
        ) {
          expect(
            DiscoveryState
              .isKnown(
                state,
              ),
          ).toBe(true);
        }
      },
    );
  },
);