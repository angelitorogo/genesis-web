import {
  ScientificEvidence,
  mergeScientificEvidence,
} from './scientific-evidence';

describe(
  'ScientificEvidence point 26.A.2',
  () => {
    function evidence(
      overrides:
        Partial<
          ConstructorParameters<
            typeof ScientificEvidence
          >[0]
        > = {},
    ): ScientificEvidence {

      return new ScientificEvidence({
        dimensionCode:
          'IDENTITY',
        evidenceCode:
          'SOURCE_RESOLUTION',
        sourceKey:
          'OPTICAL:OBSERVE:1',
        independenceKey:
          'OPTICAL',
        quality01:
          0.7,
        uncertainty01:
          0.3,
        observedAtEpochMs:
          1000,
        ...overrides,
      });
    }

    it(
      'should model only observed evidence provenance and remain immutable',
      () => {
        const value =
          evidence();

        expect(
          Object.isFrozen(
            value,
          ),
        ).toBe(true);

        expect(
          value.identityKey,
        ).toBe(
          '["IDENTITY","SOURCE_RESOLUTION","OPTICAL:OBSERVE:1"]',
        );

        expect(
          Object.keys(
            value,
          ).sort(),
        ).toEqual([
          'dimensionCode',
          'evidenceCode',
          'independenceKey',
          'observedAtEpochMs',
          'quality01',
          'sourceKey',
          'uncertainty01',
        ]);

        expect(
          JSON.stringify(
            value,
          ),
        ).not.toMatch(
          /ground.?truth|mass|radius|luminosity|temperature/i,
        );
      },
    );

    it(
      'should reject malformed identifiers, quality, uncertainty and timestamps',
      () => {
        expect(
          () =>
            evidence({
              dimensionCode:
                ' ',
            }),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            evidence({
              sourceKey:
                ' source ',
            }),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            evidence({
              quality01:
                1.01,
            }),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            evidence({
              uncertainty01:
                Number.NaN,
            }),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            evidence({
              observedAtEpochMs:
                -1,
            }),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should merge repeated evidence monotonically and keep stale retries idempotent',
      () => {
        const current =
          evidence();

        const improved =
          mergeScientificEvidence(
            current,
            evidence({
              quality01:
                0.9,
              uncertainty01:
                0.2,
              observedAtEpochMs:
                2000,
            }),
          );

        expect(
          improved.quality01,
        ).toBe(
          0.9,
        );

        expect(
          improved.uncertainty01,
        ).toBe(
          0.2,
        );

        expect(
          improved.observedAtEpochMs,
        ).toBe(
          2000,
        );

        const stale =
          mergeScientificEvidence(
            improved,
            evidence({
              quality01:
                0.1,
              uncertainty01:
                0.9,
              observedAtEpochMs:
                3000,
            }),
          );

        expect(
          stale,
        ).toBe(
          improved,
        );
      },
    );

    it(
      'should reject identity or independence rewrites for the same evidence record',
      () => {
        const current =
          evidence();

        expect(
          () =>
            mergeScientificEvidence(
              current,
              evidence({
                sourceKey:
                  'RADIO:OBSERVE:1',
              }),
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            mergeScientificEvidence(
              current,
              evidence({
                independenceKey:
                  'RADIO',
              }),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
