import {
  IdealizedSpectrumDefinition,
  SpectralContinuumAnchor,
  SpectralFeatureKind,
  SpectralLine,
  SPECTRUM_MAX_SAMPLE_COUNT,
  SpectrumSample,
} from './spectrum';

describe(
  'point-13.1 spectroscopy domain contracts',
  () => {

    it(
      'should canonicalize continuum anchors and spectral lines independently of caller ordering',
      () => {
        const definition =
          new IdealizedSpectrumDefinition(
            400,
            700,
            301,
            [
              new SpectralContinuumAnchor(
                700,
                0.7,
              ),
              new SpectralContinuumAnchor(
                400,
                0.4,
              ),
              new SpectralContinuumAnchor(
                550,
                0.55,
              ),
            ],
            [
              new SpectralLine(
                'line-b',
                SpectralFeatureKind
                  .EMISSION,
                620,
                0.2,
                2,
              ),
              new SpectralLine(
                'line-a',
                SpectralFeatureKind
                  .ABSORPTION,
                500,
                0.1,
                1,
              ),
            ],
          );

        expect(
          definition
            .continuumAnchors
            .map(
              anchor =>
                anchor
                  .wavelengthNanometers,
            ),
        ).toEqual([
          400,
          550,
          700,
        ]);

        expect(
          definition
            .lines
            .map(
              line =>
                line.id,
            ),
        ).toEqual([
          'line-a',
          'line-b',
        ]);

        expect(
          Object.isFrozen(
            definition
              .continuumAnchors,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            definition
              .lines,
          ),
        ).toBe(true);
      },
    );

    it(
      'should require continuum coverage at both wavelength-window endpoints',
      () => {
        expect(
          () =>
            new IdealizedSpectrumDefinition(
              400,
              700,
              301,
              [
                new SpectralContinuumAnchor(
                  450,
                  0.4,
                ),
                new SpectralContinuumAnchor(
                  700,
                  0.7,
                ),
              ],
              [],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject duplicate anchor wavelengths and duplicate spectral-line ids',
      () => {
        expect(
          () =>
            new IdealizedSpectrumDefinition(
              400,
              700,
              301,
              [
                new SpectralContinuumAnchor(
                  400,
                  0.4,
                ),
                new SpectralContinuumAnchor(
                  400,
                  0.5,
                ),
                new SpectralContinuumAnchor(
                  700,
                  0.7,
                ),
              ],
              [],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new IdealizedSpectrumDefinition(
              400,
              700,
              301,
              [
                new SpectralContinuumAnchor(
                  400,
                  0.4,
                ),
                new SpectralContinuumAnchor(
                  700,
                  0.7,
                ),
              ],
              [
                new SpectralLine(
                  'duplicate',
                  SpectralFeatureKind
                    .EMISSION,
                  500,
                  0.2,
                  1,
                ),
                new SpectralLine(
                  'duplicate',
                  SpectralFeatureKind
                    .ABSORPTION,
                  600,
                  0.1,
                  1,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject spectral lines outside the requested wavelength window',
      () => {
        expect(
          () =>
            new IdealizedSpectrumDefinition(
              400,
              700,
              301,
              [
                new SpectralContinuumAnchor(
                  400,
                  0.5,
                ),
                new SpectralContinuumAnchor(
                  700,
                  0.5,
                ),
              ],
              [
                new SpectralLine(
                  'outside',
                  SpectralFeatureKind
                    .EMISSION,
                  701,
                  0.2,
                  1,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should keep all normalized quantities finite and inside their V1 bounds',
      () => {
        expect(
          () =>
            new SpectralContinuumAnchor(
              500,
              Number.NaN,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new SpectralLine(
              'invalid',
              SpectralFeatureKind
                .ABSORPTION,
              500,
              1.01,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new SpectrumSample(
              500,
              -0.01,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should enforce the bounded point-13.1 sample budget',
      () => {
        const anchors =
          [
            new SpectralContinuumAnchor(
              400,
              0.5,
            ),
            new SpectralContinuumAnchor(
              700,
              0.5,
            ),
          ];

        expect(
          () =>
            new IdealizedSpectrumDefinition(
              400,
              700,
              1,
              anchors,
              [],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new IdealizedSpectrumDefinition(
              400,
              700,
              SPECTRUM_MAX_SAMPLE_COUNT +
                1,
              anchors,
              [],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
