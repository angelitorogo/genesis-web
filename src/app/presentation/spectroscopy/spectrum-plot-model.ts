export const SpectrumPlotRenderKind =
  Object.freeze({
    IDEALIZED:
      'IDEALIZED',

    INSTRUMENTAL:
      'INSTRUMENTAL',
  } as const);

export type SpectrumPlotRenderKind =
  typeof SpectrumPlotRenderKind[
    keyof typeof SpectrumPlotRenderKind
  ];

export interface SpectrumPlotSampleSource {
  readonly wavelengthNanometers:
    number;

  readonly normalizedFlux:
    number;

  readonly lowerBoundInclusive?:
    number;

  readonly upperBoundExclusive?:
    number;
}

/**
 * Minimal structural boundary accepted by the point-13.8 renderer.
 *
 * Both SynthesizedSpectrum (13.1) and InstrumentalSpectrum (13.7) satisfy this
 * contract without the presentation layer importing either scientific class.
 *
 * Optional instrumental metadata is rendered only when the source exposes it.
 */
export interface SpectrumPlotSource {
  readonly minimumWavelengthNanometers:
    number;

  readonly maximumWavelengthNanometers:
    number;

  readonly sampleCount:
    number;

  readonly samples:
    readonly SpectrumPlotSampleSource[];

  readonly effectiveResolutionElementNanometers?:
    number;

  readonly minimumDetectableNormalizedContrast?:
    number;

  readonly quantizationFraction?:
    number;
}

export interface SpectrumPlotPoint {
  readonly x:
    number;

  readonly y:
    number;
}

export interface SpectrumPlotAxisTick {
  readonly value:
    number;

  readonly coordinate:
    number;

  readonly label:
    string;
}

export interface SpectrumPlotLayout {
  readonly viewBoxWidth:
    number;

  readonly viewBoxHeight:
    number;

  readonly plotLeft:
    number;

  readonly plotTop:
    number;

  readonly plotWidth:
    number;

  readonly plotHeight:
    number;

  readonly plotRight:
    number;

  readonly plotBottom:
    number;
}

export interface SpectrumPlotModel {
  readonly renderKind:
    SpectrumPlotRenderKind;

  readonly layout:
    SpectrumPlotLayout;

  readonly spectrumPath:
    string;

  readonly spectrumAreaPath:
    string;

  readonly uncertaintyBandPath:
    string | null;

  readonly points:
    readonly SpectrumPlotPoint[];

  readonly xTicks:
    readonly SpectrumPlotAxisTick[];

  readonly yTicks:
    readonly SpectrumPlotAxisTick[];

  readonly sampleCount:
    number;

  readonly minimumWavelengthNanometers:
    number;

  readonly maximumWavelengthNanometers:
    number;

  readonly effectiveResolutionElementNanometers:
    number | null;

  readonly minimumDetectableNormalizedContrast:
    number | null;

  readonly quantizationFraction:
    number | null;

  readonly hasInstrumentalUncertainty:
    boolean;
}

const VIEW_BOX_WIDTH =
  960;

const VIEW_BOX_HEIGHT =
  420;

const PLOT_LEFT =
  72;

const PLOT_TOP =
  28;

const PLOT_RIGHT_MARGIN =
  28;

const PLOT_BOTTOM_MARGIN =
  62;

const X_TICK_COUNT =
  5;

const Y_TICK_VALUES =
  Object.freeze([
    0,
    0.25,
    0.5,
    0.75,
    1,
  ] as const);

const MAX_RENDER_SAMPLE_COUNT =
  4_096;

const PATH_DECIMAL_PLACES =
  3;

/**
 * Pure point-13.8 presentation transform.
 *
 * This builder knows only chart geometry. It never imports or calls the
 * spectroscopy engines and therefore cannot alter Ground Truth, uncertainty,
 * classification or instrumental behavior.
 */
export class SpectrumPlotModelBuilder {

  private constructor() {}

  static build(
    source:
      SpectrumPlotSource,
  ): SpectrumPlotModel {

    validateSource(
      source,
    );

    const layout =
      buildLayout();

    const points =
      Object.freeze(
        source
          .samples
          .map(
            sample =>
              Object.freeze({
                x:
                  projectWavelength(
                    sample
                      .wavelengthNanometers,
                    source,
                    layout,
                  ),

                y:
                  projectFlux(
                    sample
                      .normalizedFlux,
                    layout,
                  ),
              }),
          ),
      );

    const spectrumPath =
      buildLinePath(
        points,
      );

    const spectrumAreaPath =
      buildAreaPath(
        points,
        layout,
      );

    const hasInstrumentalUncertainty =
      source
        .samples
        .every(
          sample =>
            sample
              .lowerBoundInclusive !==
              undefined &&
            sample
              .upperBoundExclusive !==
              undefined,
        );

    const uncertaintyBandPath =
      hasInstrumentalUncertainty
        ? buildUncertaintyBandPath(
            source,
            layout,
          )
        : null;

    const xTicks =
      buildXTicks(
        source,
        layout,
      );

    const yTicks =
      buildYTicks(
        layout,
      );

    return Object.freeze({
      renderKind:
        hasInstrumentalUncertainty
          ? SpectrumPlotRenderKind
              .INSTRUMENTAL
          : SpectrumPlotRenderKind
              .IDEALIZED,

      layout,

      spectrumPath,

      spectrumAreaPath,

      uncertaintyBandPath,

      points,

      xTicks,

      yTicks,

      sampleCount:
        source.sampleCount,

      minimumWavelengthNanometers:
        source
          .minimumWavelengthNanometers,

      maximumWavelengthNanometers:
        source
          .maximumWavelengthNanometers,

      effectiveResolutionElementNanometers:
        optionalPositiveFinite(
          source
            .effectiveResolutionElementNanometers,
          'effectiveResolutionElementNanometers',
        ),

      minimumDetectableNormalizedContrast:
        optionalNormalized(
          source
            .minimumDetectableNormalizedContrast,
          'minimumDetectableNormalizedContrast',
        ),

      quantizationFraction:
        optionalPositiveNormalized(
          source
            .quantizationFraction,
          'quantizationFraction',
        ),

      hasInstrumentalUncertainty,
    });
  }
}

function validateSource(
  source:
    SpectrumPlotSource,
): void {

  requirePositiveFinite(
    source
      .minimumWavelengthNanometers,
    'minimumWavelengthNanometers',
  );

  requirePositiveFinite(
    source
      .maximumWavelengthNanometers,
    'maximumWavelengthNanometers',
  );

  if (
    source
      .maximumWavelengthNanometers <=
    source
      .minimumWavelengthNanometers
  ) {
    throw new RangeError(
      'SpectrumPlotSource requires maximumWavelengthNanometers > minimumWavelengthNanometers.',
    );
  }

  if (
    !Number.isInteger(
      source.sampleCount,
    ) ||
    source.sampleCount <
      2 ||
    source.sampleCount >
      MAX_RENDER_SAMPLE_COUNT ||
    source.sampleCount !==
      source.samples.length
  ) {
    throw new RangeError(
      `SpectrumPlotSource sampleCount must be an integer in [2, ${MAX_RENDER_SAMPLE_COUNT}] and match samples.length.`,
    );
  }

  let previousWavelength =
    Number.NEGATIVE_INFINITY;

  let intervalMode:
    boolean | null =
    null;

  for (
    const sample
    of source.samples
  ) {
    requirePositiveFinite(
      sample
        .wavelengthNanometers,
      'sample.wavelengthNanometers',
    );

    requireNormalized(
      sample
        .normalizedFlux,
      'sample.normalizedFlux',
    );

    if (
      sample
        .wavelengthNanometers <
        source
          .minimumWavelengthNanometers ||
      sample
        .wavelengthNanometers >
        source
          .maximumWavelengthNanometers
    ) {
      throw new RangeError(
        'SpectrumPlotSource contains a sample outside its wavelength window.',
      );
    }

    if (
      sample
        .wavelengthNanometers <=
      previousWavelength
    ) {
      throw new RangeError(
        'SpectrumPlotSource wavelengths must be strictly increasing.',
      );
    }

    previousWavelength =
      sample
        .wavelengthNanometers;

    const hasLower =
      sample
        .lowerBoundInclusive !==
      undefined;

    const hasUpper =
      sample
        .upperBoundExclusive !==
      undefined;

    if (
      hasLower !==
      hasUpper
    ) {
      throw new RangeError(
        'SpectrumPlotSource uncertainty samples must expose both interval bounds or neither.',
      );
    }

    const hasInterval =
      hasLower &&
      hasUpper;

    if (
      intervalMode ===
      null
    ) {
      intervalMode =
        hasInterval;
    } else if (
      intervalMode !==
      hasInterval
    ) {
      throw new RangeError(
        'SpectrumPlotSource cannot mix idealized samples and uncertainty-bearing samples.',
      );
    }

    if (
      hasInterval
    ) {
      const lower =
        sample
          .lowerBoundInclusive as
            number;

      const upper =
        sample
          .upperBoundExclusive as
            number;

      requireFinite(
        lower,
        'sample.lowerBoundInclusive',
      );

      requireFinite(
        upper,
        'sample.upperBoundExclusive',
      );

      if (
        upper <=
        lower
      ) {
        throw new RangeError(
          'SpectrumPlotSource uncertainty requires upperBoundExclusive > lowerBoundInclusive.',
        );
      }
    }
  }

  if (
    source.samples[
      0
    ]
      .wavelengthNanometers !==
      source
        .minimumWavelengthNanometers ||
    source.samples[
      source.samples.length -
        1
    ]
      .wavelengthNanometers !==
      source
        .maximumWavelengthNanometers
  ) {
    throw new RangeError(
      'SpectrumPlotSource must include both wavelength-window endpoints.',
    );
  }
}

function buildLayout():
  SpectrumPlotLayout {

  const plotRight =
    VIEW_BOX_WIDTH -
    PLOT_RIGHT_MARGIN;

  const plotBottom =
    VIEW_BOX_HEIGHT -
    PLOT_BOTTOM_MARGIN;

  return Object.freeze({
    viewBoxWidth:
      VIEW_BOX_WIDTH,

    viewBoxHeight:
      VIEW_BOX_HEIGHT,

    plotLeft:
      PLOT_LEFT,

    plotTop:
      PLOT_TOP,

    plotWidth:
      plotRight -
      PLOT_LEFT,

    plotHeight:
      plotBottom -
      PLOT_TOP,

    plotRight,

    plotBottom,
  });
}

function projectWavelength(
  wavelengthNanometers:
    number,

  source:
    SpectrumPlotSource,

  layout:
    SpectrumPlotLayout,
): number {

  const normalized =
    (
      wavelengthNanometers -
      source
        .minimumWavelengthNanometers
    ) /
    (
      source
        .maximumWavelengthNanometers -
      source
        .minimumWavelengthNanometers
    );

  return (
    layout.plotLeft +
    normalized *
      layout.plotWidth
  );
}

function projectFlux(
  normalizedFlux:
    number,

  layout:
    SpectrumPlotLayout,
): number {

  return (
    layout.plotTop +
    (
      1 -
      clamp01(
        normalizedFlux,
      )
    ) *
      layout.plotHeight
  );
}

function buildLinePath(
  points:
    readonly SpectrumPlotPoint[],
): string {

  return points
    .map(
      (
        point,
        index,
      ) =>
        `${
          index ===
          0
            ? 'M'
            : 'L'
        } ${formatCoordinate(point.x)} ${formatCoordinate(point.y)}`,
    )
    .join(
      ' ',
    );
}

function buildAreaPath(
  points:
    readonly SpectrumPlotPoint[],

  layout:
    SpectrumPlotLayout,
): string {

  const first =
    points[
      0
    ];

  const last =
    points[
      points.length -
      1
    ];

  return [
    buildLinePath(
      points,
    ),
    `L ${formatCoordinate(last.x)} ${formatCoordinate(layout.plotBottom)}`,
    `L ${formatCoordinate(first.x)} ${formatCoordinate(layout.plotBottom)}`,
    'Z',
  ].join(
    ' ',
  );
}

function buildUncertaintyBandPath(
  source:
    SpectrumPlotSource,

  layout:
    SpectrumPlotLayout,
): string {

  const upperPoints =
    source
      .samples
      .map(
        sample => ({
          x:
            projectWavelength(
              sample
                .wavelengthNanometers,
              source,
              layout,
            ),

          y:
            projectFlux(
              sample
                .upperBoundExclusive as
                  number,
              layout,
            ),
        }),
      );

  const lowerPoints =
    source
      .samples
      .map(
        sample => ({
          x:
            projectWavelength(
              sample
                .wavelengthNanometers,
              source,
              layout,
            ),

          y:
            projectFlux(
              sample
                .lowerBoundInclusive as
                  number,
              layout,
            ),
        }),
      )
      .reverse();

  const allPoints =
    [
      ...upperPoints,
      ...lowerPoints,
    ];

  return `${buildLinePath(allPoints)} Z`;
}

function buildXTicks(
  source:
    SpectrumPlotSource,

  layout:
    SpectrumPlotLayout,
): readonly SpectrumPlotAxisTick[] {

  const range =
    source
      .maximumWavelengthNanometers -
    source
      .minimumWavelengthNanometers;

  return Object.freeze(
    Array.from(
      {
        length:
          X_TICK_COUNT,
      },
      (
        _,
        index,
      ) => {
        const ratio =
          index /
          (
            X_TICK_COUNT -
            1
          );

        const value =
          source
            .minimumWavelengthNanometers +
          range *
            ratio;

        return Object.freeze({
          value,

          coordinate:
            layout.plotLeft +
            layout.plotWidth *
              ratio,

          label:
            formatWavelengthTick(
              value,
              range,
            ),
        });
      },
    ),
  );
}

function buildYTicks(
  layout:
    SpectrumPlotLayout,
): readonly SpectrumPlotAxisTick[] {

  return Object.freeze(
    Y_TICK_VALUES
      .map(
        value =>
          Object.freeze({
            value,

            coordinate:
              projectFlux(
                value,
                layout,
              ),

            label:
              value
                .toFixed(
                  value ===
                    0 ||
                  value ===
                    1
                    ? 0
                    : 2,
                ),
          }),
      ),
  );
}

function formatWavelengthTick(
  value:
    number,

  range:
    number,
): string {

  if (
    range >=
    20
  ) {
    return Math
      .round(
        value,
      )
      .toString();
  }

  return value
    .toFixed(
      1,
    );
}

function formatCoordinate(
  value:
    number,
): string {

  return value
    .toFixed(
      PATH_DECIMAL_PLACES,
    );
}

function optionalPositiveFinite(
  value:
    number | undefined,

  name:
    string,
): number | null {

  if (
    value ===
    undefined
  ) {
    return null;
  }

  requirePositiveFinite(
    value,
    name,
  );

  return value;
}

function optionalNormalized(
  value:
    number | undefined,

  name:
    string,
): number | null {

  if (
    value ===
    undefined
  ) {
    return null;
  }

  requireNormalized(
    value,
    name,
  );

  return value;
}

function optionalPositiveNormalized(
  value:
    number | undefined,

  name:
    string,
): number | null {

  if (
    value ===
    undefined
  ) {
    return null;
  }

  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${name} must be finite and in (0, 1].`,
    );
  }

  return value;
}

function requireFinite(
  value:
    number,

  name:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    )
  ) {
    throw new RangeError(
      `${name} must be finite.`,
    );
  }
}

function requirePositiveFinite(
  value:
    number,

  name:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${name} must be finite and greater than zero.`,
    );
  }
}

function requireNormalized(
  value:
    number,

  name:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${name} must be finite and in [0, 1].`,
    );
  }
}

function clamp01(
  value:
    number,
): number {

  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
  );
}
