import {
  type LeveledInstrumentObservationSession,
} from '../observation/observation-instrument-capability';

import {
  SPECTRUM_MAX_SAMPLE_COUNT,
  SPECTRUM_MIN_SAMPLE_COUNT,
} from './spectrum';

/**
 * Scientific status of the point-13.7 observational spectral projection.
 *
 * The source spectrum remains the idealized point-13.1 scientific frame.
 * This status marks the separate instrument-dependent view that may be shown
 * or interpreted as Observed Knowledge.
 */
export enum InstrumentalSpectrumModelStatus {
  INSTRUMENTALLY_DEGRADED_V1 =
    'INSTRUMENTALLY_DEGRADED_V1',
}

/**
 * One point-13.7 observed spectral sample.
 *
 * The exact pre-quantized normalized flux is intentionally absent. The sample
 * exposes only the deterministic point-8.6 half-open uncertainty interval and
 * a midpoint estimate suitable for downstream visualization/interpretation.
 */
export class InstrumentalSpectrumSample {

  constructor(
    readonly wavelengthNanometers:
      number,

    readonly lowerBoundInclusive:
      number,

    readonly upperBoundExclusive:
      number,
  ) {
    requirePositiveFinite(
      wavelengthNanometers,
      'wavelengthNanometers',
    );

    requireFinite(
      lowerBoundInclusive,
      'lowerBoundInclusive',
    );

    requireFinite(
      upperBoundExclusive,
      'upperBoundExclusive',
    );

    if (
      upperBoundExclusive <=
      lowerBoundInclusive
    ) {
      throw new RangeError(
        'InstrumentalSpectrumSample requires upperBoundExclusive > lowerBoundInclusive.',
      );
    }
  }

  get intervalWidth():
    number {

    return (
      this
        .upperBoundExclusive -
      this
        .lowerBoundInclusive
    );
  }

  get midpointEstimate():
    number {

    return (
      this
        .lowerBoundInclusive +
      this.intervalWidth /
        2
    );
  }

  get uncertaintyHalfWidth():
    number {

    return this
      .intervalWidth /
      2;
  }

  /**
   * UI/interpretation-safe normalized midpoint.
   *
   * Raw point-8.6 intervals are intentionally preserved even when an upper
   * bucket boundary extends slightly above 1. The spectral projection itself
   * remains normalized for existing point-13.6 consumers.
   */
  get normalizedFlux():
    number {

    return clamp01(
      this
        .midpointEstimate,
    );
  }
}

/**
 * Point-13.7 observed spectral projection.
 *
 * It deliberately does not retain the idealized source spectrum or any exact
 * pre-quantized flux. Wavelengths remain exact sampling coordinates; flux is
 * exposed as measurement intervals plus their observational midpoint.
 */
export class InstrumentalSpectrum {

  readonly modelStatus =
    InstrumentalSpectrumModelStatus
      .INSTRUMENTALLY_DEGRADED_V1;

  readonly samples:
    readonly InstrumentalSpectrumSample[];

  constructor(
    readonly observationSession:
      LeveledInstrumentObservationSession,

    readonly minimumWavelengthNanometers:
      number,

    readonly maximumWavelengthNanometers:
      number,

    samples:
      readonly InstrumentalSpectrumSample[],

    readonly effectiveResolutionElementNanometers:
      number,

    readonly minimumDetectableNormalizedContrast:
      number,

    readonly quantizationFraction:
      number,
  ) {
    requirePositiveFinite(
      minimumWavelengthNanometers,
      'minimumWavelengthNanometers',
    );

    requirePositiveFinite(
      maximumWavelengthNanometers,
      'maximumWavelengthNanometers',
    );

    if (
      maximumWavelengthNanometers <=
      minimumWavelengthNanometers
    ) {
      throw new RangeError(
        'InstrumentalSpectrum wavelength window is invalid.',
      );
    }

    if (
      samples.length <
        SPECTRUM_MIN_SAMPLE_COUNT ||
      samples.length >
        SPECTRUM_MAX_SAMPLE_COUNT
    ) {
      throw new RangeError(
        `InstrumentalSpectrum sample count must be in [${SPECTRUM_MIN_SAMPLE_COUNT}, ${SPECTRUM_MAX_SAMPLE_COUNT}].`,
      );
    }

    requirePositiveFinite(
      effectiveResolutionElementNanometers,
      'effectiveResolutionElementNanometers',
    );

    requireNormalized(
      minimumDetectableNormalizedContrast,
      'minimumDetectableNormalizedContrast',
    );

    if (
      !Number.isFinite(
        quantizationFraction,
      ) ||
      quantizationFraction <=
        0 ||
      quantizationFraction >
        1
    ) {
      throw new RangeError(
        'quantizationFraction must be finite and in (0, 1].',
      );
    }

    let previousWavelength =
      Number.NEGATIVE_INFINITY;

    for (
      const sample
      of samples
    ) {
      if (
        sample
          .wavelengthNanometers <
          minimumWavelengthNanometers ||
        sample
          .wavelengthNanometers >
          maximumWavelengthNanometers
      ) {
        throw new RangeError(
          'InstrumentalSpectrum contains a sample outside its wavelength window.',
        );
      }

      if (
        sample
          .wavelengthNanometers <=
        previousWavelength
      ) {
        throw new RangeError(
          'InstrumentalSpectrum wavelengths must be strictly increasing.',
        );
      }

      previousWavelength =
        sample
          .wavelengthNanometers;
    }

    if (
      samples[
        0
      ]
        .wavelengthNanometers !==
        minimumWavelengthNanometers ||
      samples[
        samples.length -
          1
      ]
        .wavelengthNanometers !==
        maximumWavelengthNanometers
    ) {
      throw new RangeError(
        'InstrumentalSpectrum must include both wavelength-window endpoints.',
      );
    }

    this.samples =
      Object.freeze([
        ...samples,
      ]);
  }

  get sampleCount():
    number {

    return this
      .samples
      .length;
  }
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
