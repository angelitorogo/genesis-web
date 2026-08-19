import {
  SpectroscopicCandidateStatus,
  SpectroscopicEvidenceIndicator,
  SpectroscopicInterpretation,
  SpectroscopicSourceClassification,
} from './spectroscopic-interpretation';

describe(
  'point-13.6 spectroscopic interpretation domain',
  () => {
    it(
      'should expose exactly the six V1 spectral source-family classifications',
      () => {
        expect(
          Object.values(
            SpectroscopicSourceClassification,
          ),
        ).toEqual([
          'UNCLASSIFIED',
          'STELLAR_PHOTOSPHERIC',
          'ATMOSPHERIC_ABSORPTION',
          'NEBULAR_EMISSION',
          'SUPERNOVA_REMNANT_SHOCK',
          'ACTIVE_GALACTIC_NUCLEUS',
        ]);
      },
    );

    it(
      'should expose only NONE and CANDIDATE instead of prematurely adding probable or confirmed states',
      () => {
        expect(
          Object.values(
            SpectroscopicCandidateStatus,
          ),
        ).toEqual([
          'NONE',
          'CANDIDATE',
        ]);
      },
    );

    it(
      'should canonicalize and freeze evidence indicators independently of caller ordering',
      () => {
        const result =
          new SpectroscopicInterpretation(
            SpectroscopicSourceClassification
              .ATMOSPHERIC_ABSORPTION,
            [
              SpectroscopicEvidenceIndicator
                .NARROW_ISOLATED_OPTICAL_EMISSION_ANOMALY,
              SpectroscopicEvidenceIndicator
                .OXYGEN_METHANE_DISEQUILIBRIUM_CANDIDATE,
            ],
          );

        expect(
          result.indicators,
        ).toEqual([
          SpectroscopicEvidenceIndicator
            .NARROW_ISOLATED_OPTICAL_EMISSION_ANOMALY,
          SpectroscopicEvidenceIndicator
            .OXYGEN_METHANE_DISEQUILIBRIUM_CANDIDATE,
        ]);

        expect(
          Object.isFrozen(
            result.indicators,
          ),
        ).toBe(true);
      },
    );

    it(
      'should derive candidate statuses from evidence without numeric confidence',
      () => {
        const result =
          new SpectroscopicInterpretation(
            SpectroscopicSourceClassification
              .UNCLASSIFIED,
            [
              SpectroscopicEvidenceIndicator
                .OXYGEN_METHANE_DISEQUILIBRIUM_CANDIDATE,
              SpectroscopicEvidenceIndicator
                .NARROW_ISOLATED_OPTICAL_EMISSION_ANOMALY,
            ],
          );

        expect(
          result.biosignatureStatus,
        ).toBe(
          SpectroscopicCandidateStatus
            .CANDIDATE,
        );

        expect(
          result.technosignatureStatus,
        ).toBe(
          SpectroscopicCandidateStatus
            .CANDIDATE,
        );

        expect(
          result.hasBiosignatureCandidate,
        ).toBe(true);

        expect(
          result.hasTechnosignatureCandidate,
        ).toBe(true);
      },
    );

    it(
      'should remain evidence-free and unclassified when no spectral interpretation is supported',
      () => {
        const result =
          new SpectroscopicInterpretation(
            SpectroscopicSourceClassification
              .UNCLASSIFIED,
            [],
          );

        expect(
          result.biosignatureStatus,
        ).toBe(
          SpectroscopicCandidateStatus
            .NONE,
        );

        expect(
          result.technosignatureStatus,
        ).toBe(
          SpectroscopicCandidateStatus
            .NONE,
        );

        expect(
          result.isSourceClassified,
        ).toBe(false);
      },
    );

    it(
      'should reject duplicate evidence indicators',
      () => {
        expect(
          () =>
            new SpectroscopicInterpretation(
              SpectroscopicSourceClassification
                .ATMOSPHERIC_ABSORPTION,
              [
                SpectroscopicEvidenceIndicator
                  .OXYGEN_METHANE_DISEQUILIBRIUM_CANDIDATE,
                SpectroscopicEvidenceIndicator
                  .OXYGEN_METHANE_DISEQUILIBRIUM_CANDIDATE,
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject unsupported runtime classification and evidence values',
      () => {
        expect(
          () =>
            new SpectroscopicInterpretation(
              'ALIEN' as SpectroscopicSourceClassification,
              [],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new SpectroscopicInterpretation(
              SpectroscopicSourceClassification
                .UNCLASSIFIED,
              [
                'UNKNOWN_EVIDENCE' as SpectroscopicEvidenceIndicator,
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
