import {
  SpectrumPlotModelBuilder,
  SpectrumPlotRenderKind,
  type SpectrumPlotSource,
} from './spectrum-plot-model';

describe(
  'SpectrumPlotModelBuilder point 13.8',
  () => {
    function idealizedSource():
      SpectrumPlotSource {

      return {
        minimumWavelengthNanometers:
          400,

        maximumWavelengthNanometers:
          700,

        sampleCount:
          4,

        samples: [
          {
            wavelengthNanometers:
              400,
            normalizedFlux:
              0.2,
          },
          {
            wavelengthNanometers:
              500,
            normalizedFlux:
              0.8,
          },
          {
            wavelengthNanometers:
              600,
            normalizedFlux:
              0.4,
          },
          {
            wavelengthNanometers:
              700,
            normalizedFlux:
              1,
          },
        ],
      };
    }

    function instrumentalSource():
      SpectrumPlotSource {

      return {
        minimumWavelengthNanometers:
          400,

        maximumWavelengthNanometers:
          700,

        sampleCount:
          4,

        samples: [
          {
            wavelengthNanometers:
              400,
            normalizedFlux:
              0.2,
            lowerBoundInclusive:
              0.1,
            upperBoundExclusive:
              0.3,
          },
          {
            wavelengthNanometers:
              500,
            normalizedFlux:
              0.8,
            lowerBoundInclusive:
              0.7,
            upperBoundExclusive:
              0.9,
          },
          {
            wavelengthNanometers:
              600,
            normalizedFlux:
              0.4,
            lowerBoundInclusive:
              0.3,
            upperBoundExclusive:
              0.5,
          },
          {
            wavelengthNanometers:
              700,
            normalizedFlux:
              1,
            lowerBoundInclusive:
              1,
            upperBoundExclusive:
              1.2,
          },
        ],

        effectiveResolutionElementNanometers:
          2.5,

        minimumDetectableNormalizedContrast:
          0.05,

        quantizationFraction:
          0.02,
      };
    }

    it(
      'should project the full wavelength window into one deterministic SVG plot area',
      () => {
        const model =
          SpectrumPlotModelBuilder
            .build(
              idealizedSource(),
            );

        expect(
          model.renderKind,
        ).toBe(
          SpectrumPlotRenderKind
            .IDEALIZED,
        );

        expect(
          model.points[
            0
          ].x,
        ).toBe(
          model
            .layout
            .plotLeft,
        );

        expect(
          model.points[
            model.points.length -
              1
          ].x,
        ).toBe(
          model
            .layout
            .plotRight,
        );

        expect(
          model.spectrumPath
            .startsWith(
              'M ',
            ),
        ).toBe(true);

        expect(
          model.spectrumAreaPath
            .endsWith(
              ' Z',
            ),
        ).toBe(true);
      },
    );

    it(
      'should map normalized flux 1 to the plot top and 0 toward the plot bottom',
      () => {
        const source =
          idealizedSource();

        const model =
          SpectrumPlotModelBuilder
            .build({
              ...source,
              samples: [
                {
                  wavelengthNanometers:
                    400,
                  normalizedFlux:
                    0,
                },
                {
                  wavelengthNanometers:
                    500,
                  normalizedFlux:
                    0.25,
                },
                {
                  wavelengthNanometers:
                    600,
                  normalizedFlux:
                    0.75,
                },
                {
                  wavelengthNanometers:
                    700,
                  normalizedFlux:
                    1,
                },
              ],
            });

        expect(
          model.points[
            0
          ].y,
        ).toBe(
          model
            .layout
            .plotBottom,
        );

        expect(
          model.points[
            3
          ].y,
        ).toBe(
          model
            .layout
            .plotTop,
        );
      },
    );

    it(
      'should preserve every source sample instead of thinning or inventing spectral points',
      () => {
        const sampleCount =
          4_096;

        const samples =
          Array.from(
            {
              length:
                sampleCount,
            },
            (
              _,
              index,
            ) => ({
              wavelengthNanometers:
                400 +
                (
                  300 *
                  index
                ) /
                (
                  sampleCount -
                  1
                ),

              normalizedFlux:
                (
                  index %
                  100
                ) /
                100,
            }),
          );

        const model =
          SpectrumPlotModelBuilder
            .build({
              minimumWavelengthNanometers:
                400,
              maximumWavelengthNanometers:
                700,
              sampleCount,
              samples,
            });

        expect(
          model.points,
        ).toHaveLength(
          sampleCount,
        );

        expect(
          (
            model
              .spectrumPath
              .match(
                /\b[ML]\s/g,
              ) ??
            []
          ).length,
        ).toBe(
          sampleCount,
        );
      },
    );

    it(
      'should build a closed uncertainty band only for a fully instrumental frame',
      () => {
        const idealized =
          SpectrumPlotModelBuilder
            .build(
              idealizedSource(),
            );

        const instrumental =
          SpectrumPlotModelBuilder
            .build(
              instrumentalSource(),
            );

        expect(
          idealized
            .uncertaintyBandPath,
        ).toBeNull();

        expect(
          idealized
            .hasInstrumentalUncertainty,
        ).toBe(false);

        expect(
          instrumental
            .renderKind,
        ).toBe(
          SpectrumPlotRenderKind
            .INSTRUMENTAL,
        );

        expect(
          instrumental
            .uncertaintyBandPath
            ?.endsWith(
              ' Z',
            ),
        ).toBe(true);

        expect(
          instrumental
            .hasInstrumentalUncertainty,
        ).toBe(true);
      },
    );

    it(
      'should clamp only uncertainty geometry to the normalized viewport while preserving the source object',
      () => {
        const source =
          instrumentalSource();

        const originalUpper =
          source
            .samples[
              3
            ]
            .upperBoundExclusive;

        const model =
          SpectrumPlotModelBuilder
            .build(
              source,
            );

        expect(
          originalUpper,
        ).toBe(
          1.2,
        );

        expect(
          model
            .uncertaintyBandPath,
        ).toContain(
          model
            .layout
            .plotTop
            .toFixed(
              3,
            ),
        );

        expect(
          source
            .samples[
              3
            ]
            .upperBoundExclusive,
        ).toBe(
          1.2,
        );
      },
    );

    it(
      'should expose fixed axes and optional point-13.7 instrumental metadata for presentation only',
      () => {
        const model =
          SpectrumPlotModelBuilder
            .build(
              instrumentalSource(),
            );

        expect(
          model.xTicks,
        ).toHaveLength(
          5,
        );

        expect(
          model.yTicks
            .map(
              tick =>
                tick.value,
            ),
        ).toEqual([
          0,
          0.25,
          0.5,
          0.75,
          1,
        ]);

        expect(
          model
            .effectiveResolutionElementNanometers,
        ).toBe(
          2.5,
        );

        expect(
          model
            .minimumDetectableNormalizedContrast,
        ).toBe(
          0.05,
        );

        expect(
          model
            .quantizationFraction,
        ).toBe(
          0.02,
        );
      },
    );

    it(
      'should be exactly deterministic and avoid mutating the source',
      () => {
        const source =
          instrumentalSource();

        const before =
          JSON.stringify(
            source,
          );

        expect(
          SpectrumPlotModelBuilder
            .build(
              source,
            ),
        ).toEqual(
          SpectrumPlotModelBuilder
            .build(
              source,
            ),
        );

        expect(
          JSON.stringify(
            source,
          ),
        ).toBe(
          before,
        );
      },
    );

    it(
      'should reject malformed windows, sample counts, ordering and normalized flux',
      () => {
        const source =
          idealizedSource();

        expect(
          () =>
            SpectrumPlotModelBuilder
              .build({
                ...source,
                maximumWavelengthNanometers:
                  400,
              }),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            SpectrumPlotModelBuilder
              .build({
                ...source,
                sampleCount:
                  3,
              }),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            SpectrumPlotModelBuilder
              .build({
                minimumWavelengthNanometers:
                  400,
                maximumWavelengthNanometers:
                  700,
                sampleCount:
                  4_097,
                samples:
                  Array.from(
                    {
                      length:
                        4_097,
                    },
                    (
                      _,
                      index,
                    ) => ({
                      wavelengthNanometers:
                        400 +
                        (
                          300 *
                          index
                        ) /
                        4_096,
                      normalizedFlux:
                        0.5,
                    }),
                  ),
              }),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            SpectrumPlotModelBuilder
              .build({
                ...source,
                samples: [
                  source.samples[
                    0
                  ],
                  source.samples[
                    2
                  ],
                  source.samples[
                    1
                  ],
                  source.samples[
                    3
                  ],
                ],
              }),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            SpectrumPlotModelBuilder
              .build({
                ...source,
                samples: [
                  source.samples[
                    0
                  ],
                  {
                    wavelengthNanometers:
                      500,
                    normalizedFlux:
                      1.01,
                  },
                  source.samples[
                    2
                  ],
                  source.samples[
                    3
                  ],
                ],
              }),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject mixed or incomplete uncertainty intervals and invalid optional metadata',
      () => {
        const source =
          instrumentalSource();

        expect(
          () =>
            SpectrumPlotModelBuilder
              .build({
                ...source,
                samples: [
                  source.samples[
                    0
                  ],
                  {
                    wavelengthNanometers:
                      500,
                    normalizedFlux:
                      0.8,
                  },
                  source.samples[
                    2
                  ],
                  source.samples[
                    3
                  ],
                ],
              }),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            SpectrumPlotModelBuilder
              .build({
                ...source,
                samples: [
                  {
                    wavelengthNanometers:
                      400,
                    normalizedFlux:
                      0.2,
                    lowerBoundInclusive:
                      0.1,
                  },
                  ...source.samples
                    .slice(
                      1,
                    ),
                ],
              }),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            SpectrumPlotModelBuilder
              .build({
                ...source,
                quantizationFraction:
                  0,
              }),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
