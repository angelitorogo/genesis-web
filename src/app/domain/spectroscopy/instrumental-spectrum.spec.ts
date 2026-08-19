import {
  type LeveledInstrumentObservationSession,
} from '../observation/observation-instrument-capability';

import {
  InstrumentalSpectrum,
  InstrumentalSpectrumModelStatus,
  InstrumentalSpectrumSample,
} from './instrumental-spectrum';

describe(
  'point-13.7 instrumental spectrum domain',
  () => {
    /**
     * This domain-unit test does not validate observation-session assembly.
     * It only needs the opaque domain reference required by InstrumentalSpectrum.
     *
     * Real LeveledInstrumentObservationSession construction is already covered
     * by the observation-domain/simulation tests and by the point-13.7 engine
     * integration tests.
     */
    const observationSession =
      {} as LeveledInstrumentObservationSession;

    it(
      'should derive midpoint, interval width and half-width without storing an exact flux',
      () => {
        const sample =
          new InstrumentalSpectrumSample(
            500,
            0.4,
            0.5,
          );

        expect(
          sample.intervalWidth,
        ).toBeCloseTo(
          0.1,
          12,
        );

        expect(
          sample.midpointEstimate,
        ).toBeCloseTo(
          0.45,
          12,
        );

        expect(
          sample.uncertaintyHalfWidth,
        ).toBeCloseTo(
          0.05,
          12,
        );

        expect(
          Object.prototype
            .hasOwnProperty
            .call(
              sample,
              'exactValue',
            ),
        ).toBe(false);
      },
    );

    it(
      'should clamp only the normalized midpoint projection while preserving the raw point-8.6 interval',
      () => {
        const high =
          new InstrumentalSpectrumSample(
            500,
            1,
            1.2,
          );

        const low =
          new InstrumentalSpectrumSample(
            600,
            -0.2,
            0,
          );

        expect(
          high.normalizedFlux,
        ).toBe(1);

        expect(
          high.upperBoundExclusive,
        ).toBe(1.2);

        expect(
          low.normalizedFlux,
        ).toBe(0);

        expect(
          low.lowerBoundInclusive,
        ).toBe(-0.2);
      },
    );

    it(
      'should reject invalid instrumental sample coordinates and intervals',
      () => {
        expect(
          () =>
            new InstrumentalSpectrumSample(
              0,
              0,
              0.1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new InstrumentalSpectrumSample(
              500,
              Number.NaN,
              0.1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new InstrumentalSpectrumSample(
              500,
              0.5,
              0.5,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should expose the point-13.7 instrumental model status and freeze its samples',
      () => {
        const result =
          new InstrumentalSpectrum(
            observationSession,
            400,
            500,
            [
              new InstrumentalSpectrumSample(
                400,
                0.4,
                0.5,
              ),
              new InstrumentalSpectrumSample(
                500,
                0.5,
                0.6,
              ),
            ],
            5,
            0.1,
            0.05,
          );

        expect(
          result.modelStatus,
        ).toBe(
          InstrumentalSpectrumModelStatus
            .INSTRUMENTALLY_DEGRADED_V1,
        );

        expect(
          result.sampleCount,
        ).toBe(2);

        expect(
          Object.isFrozen(
            result.samples,
          ),
        ).toBe(true);
      },
    );

    it(
      'should reject an invalid spectral window or sample count',
      () => {
        expect(
          () =>
            new InstrumentalSpectrum(
              observationSession,
              500,
              400,
              [
                new InstrumentalSpectrumSample(
                  400,
                  0.4,
                  0.5,
                ),
                new InstrumentalSpectrumSample(
                  500,
                  0.5,
                  0.6,
                ),
              ],
              5,
              0.1,
              0.05,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new InstrumentalSpectrum(
              observationSession,
              400,
              500,
              [
                new InstrumentalSpectrumSample(
                  400,
                  0.4,
                  0.5,
                ),
              ],
              5,
              0.1,
              0.05,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should require strictly ordered samples and both wavelength endpoints',
      () => {
        expect(
          () =>
            new InstrumentalSpectrum(
              observationSession,
              400,
              500,
              [
                new InstrumentalSpectrumSample(
                  400,
                  0.4,
                  0.5,
                ),
                new InstrumentalSpectrumSample(
                  400,
                  0.5,
                  0.6,
                ),
              ],
              5,
              0.1,
              0.05,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new InstrumentalSpectrum(
              observationSession,
              400,
              500,
              [
                new InstrumentalSpectrumSample(
                  410,
                  0.4,
                  0.5,
                ),
                new InstrumentalSpectrumSample(
                  500,
                  0.5,
                  0.6,
                ),
              ],
              5,
              0.1,
              0.05,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject invalid resolution, detectability and uncertainty metadata',
      () => {
        const samples = [
          new InstrumentalSpectrumSample(
            400,
            0.4,
            0.5,
          ),
          new InstrumentalSpectrumSample(
            500,
            0.5,
            0.6,
          ),
        ];

        expect(
          () =>
            new InstrumentalSpectrum(
              observationSession,
              400,
              500,
              samples,
              0,
              0.1,
              0.05,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new InstrumentalSpectrum(
              observationSession,
              400,
              500,
              samples,
              5,
              1.01,
              0.05,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new InstrumentalSpectrum(
              observationSession,
              400,
              500,
              samples,
              5,
              0.1,
              0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
