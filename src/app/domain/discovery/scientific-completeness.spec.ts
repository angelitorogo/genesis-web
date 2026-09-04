import {
  ScientificCompletenessRequirement,
  evaluateScientificCompleteness,
} from './scientific-completeness';

import {
  ScientificEvidence,
} from './scientific-evidence';

describe(
  'ScientificCompleteness point 26.A.2',
  () => {
    const identity =
      new ScientificCompletenessRequirement({
        dimensionCode:
          'IDENTITY',
        weight:
          2,
        minimumEvidenceCount:
          1,
        minimumIndependentSources:
          1,
        minimumQuality01:
          0.6,
        maximumUncertainty01:
          0.4,
      });

    const validation =
      new ScientificCompletenessRequirement({
        dimensionCode:
          'VALIDATION',
        weight:
          3,
        minimumEvidenceCount:
          2,
        minimumIndependentSources:
          2,
        minimumQuality01:
          0.75,
        maximumUncertainty01:
          0.25,
      });

    function evidence(
      dimensionCode:
        string,

      sourceKey:
        string,

      independenceKey:
        string,

      quality01 =
        0.9,

      uncertainty01 =
        0.1,
    ): ScientificEvidence {

      return new ScientificEvidence({
        dimensionCode,
        evidenceCode:
          `EVIDENCE:${sourceKey}`,
        sourceKey,
        independenceKey,
        quality01,
        uncertainty01,
        observedAtEpochMs:
          1000,
      });
    }

    it(
      'should evaluate requirements from evidence without reading Ground Truth',
      () => {
        const result =
          evaluateScientificCompleteness(
            [
              identity,
              validation,
            ],
            [
              evidence(
                'IDENTITY',
                'OPTICAL-1',
                'OPTICAL',
              ),
              evidence(
                'VALIDATION',
                'SPECTRUM-1',
                'SPECTROSCOPY',
              ),
              evidence(
                'VALIDATION',
                'PERIOD-1',
                'TEMPORAL',
              ),
            ],
          );

        expect(
          result.isComplete,
        ).toBe(true);

        expect(
          result.satisfiedRequirementCount,
        ).toBe(2);

        expect(
          result.totalRequirementCount,
        ).toBe(2);

        expect(
          result.satisfiedWeight,
        ).toBe(5);

        expect(
          result.totalWeight,
        ).toBe(5);

        expect(
          Object.isFrozen(
            result,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            result.requirements,
          ),
        ).toBe(true);
      },
    );

    it(
      'should require independent qualifying sources when the profile asks for them',
      () => {
        const sameMethod =
          evaluateScientificCompleteness(
            [
              validation,
            ],
            [
              evidence(
                'VALIDATION',
                'SPECTRUM-1',
                'SPECTROSCOPY',
              ),
              evidence(
                'VALIDATION',
                'SPECTRUM-2',
                'SPECTROSCOPY',
              ),
            ],
          );

        expect(
          sameMethod.isComplete,
        ).toBe(false);

        expect(
          sameMethod.requirements[0]
            .qualifyingEvidenceCount,
        ).toBe(2);

        expect(
          sameMethod.requirements[0]
            .independentSourceCount,
        ).toBe(1);
      },
    );

    it(
      'should exclude evidence that does not meet quality or uncertainty thresholds',
      () => {
        const result =
          evaluateScientificCompleteness(
            [
              identity,
            ],
            [
              evidence(
                'IDENTITY',
                'LOW-QUALITY',
                'OPTICAL',
                0.59,
                0.1,
              ),
              evidence(
                'IDENTITY',
                'HIGH-UNCERTAINTY',
                'RADIO',
                0.9,
                0.41,
              ),
            ],
          );

        expect(
          result.isComplete,
        ).toBe(false);

        expect(
          result.requirements[0]
            .qualifyingEvidenceCount,
        ).toBe(0);
      },
    );

    it(
      'should keep visual percentage out of the authoritative completeness model',
      () => {
        const result =
          evaluateScientificCompleteness(
            [
              identity,
              validation,
            ],
            [
              evidence(
                'IDENTITY',
                'OPTICAL-1',
                'OPTICAL',
              ),
            ],
          );

        const serialized =
          JSON.stringify(
            result,
          );

        expect(
          serialized,
        ).not.toMatch(
          /percent|percentage/i,
        );

        expect(
          'percentage' in
            result,
        ).toBe(false);
      },
    );

    it(
      'should reject duplicate requirements and duplicate evidence identities',
      () => {
        expect(
          () =>
            evaluateScientificCompleteness(
              [
                identity,
                identity,
              ],
              [],
            ),
        ).toThrow(
          /Duplicate ScientificCompleteness dimension/,
        );

        const duplicate =
          evidence(
            'IDENTITY',
            'OPTICAL-1',
            'OPTICAL',
          );

        expect(
          () =>
            evaluateScientificCompleteness(
              [
                identity,
              ],
              [
                duplicate,
                duplicate,
              ],
            ),
        ).toThrow(
          /Duplicate ScientificEvidence identity/,
        );
      },
    );

    it(
      'should reject malformed requirement contracts',
      () => {
        expect(
          () =>
            new ScientificCompletenessRequirement({
              dimensionCode:
                'VALIDATION',
              weight:
                1,
              minimumEvidenceCount:
                1,
              minimumIndependentSources:
                2,
              minimumQuality01:
                0,
              maximumUncertainty01:
                1,
            }),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            evaluateScientificCompleteness(
              [],
              [],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
