import {
  type LeveledInstrumentObservationSession,
} from '../observation/observation-instrument-capability';

export const SPECTRUM_MIN_SAMPLE_COUNT =
  2;

export const SPECTRUM_MAX_SAMPLE_COUNT =
  4_096;

/**
 * Scientific status of the point-13.1 spectroscopy core.
 *
 * The V1 engine synthesizes an idealized normalized spectral shape. It is not
 * calibrated physical flux and it is not yet degraded by instrumental
 * resolution or measurement uncertainty. Those observational effects belong
 * to point 13.7.
 */
export enum SpectroscopyModelStatus {
  SIMPLIFIED_IDEALIZED_V1 =
    'SIMPLIFIED_IDEALIZED_V1',
}

export enum SpectralFeatureKind {
  ABSORPTION =
    'ABSORPTION',

  EMISSION =
    'EMISSION',
}

/**
 * One control point of the idealized continuum.
 *
 * normalizedFlux is dimensionless and constrained to [0, 1].
 */
export class SpectralContinuumAnchor {

  constructor(
    readonly wavelengthNanometers:
      number,

    readonly normalizedFlux:
      number,
  ) {
    requirePositiveFinite(
      wavelengthNanometers,
      'wavelengthNanometers',
    );

    requireNormalized(
      normalizedFlux,
      'normalizedFlux',
    );
  }
}

/**
 * One idealized spectral line used internally by the simulation core.
 *
 * relativeStrength is a normalized amplitude in [0, 1].
 * gaussianSigmaNanometers controls the simplified Gaussian width.
 */
export class SpectralLine {

  constructor(
    readonly id:
      string,

    readonly kind:
      SpectralFeatureKind,

    readonly centerWavelengthNanometers:
      number,

    readonly relativeStrength:
      number,

    readonly gaussianSigmaNanometers:
      number,
  ) {
    if (
      id.trim().length ===
      0
    ) {
      throw new RangeError(
        'SpectralLine id must not be blank.',
      );
    }

    requirePositiveFinite(
      centerWavelengthNanometers,
      'centerWavelengthNanometers',
    );

    requireNormalized(
      relativeStrength,
      'relativeStrength',
    );

    requirePositiveFinite(
      gaussianSigmaNanometers,
      'gaussianSigmaNanometers',
    );
  }
}

/**
 * Exact, internal point-13.1 input for synthesizing a spectrum.
 *
 * This object belongs to the simulation boundary and must not be exposed as an
 * observed result. Anchors and lines are canonicalized so synthesis is
 * independent of caller-provided ordering.
 */
export class IdealizedSpectrumDefinition {

  readonly continuumAnchors:
    readonly SpectralContinuumAnchor[];

  readonly lines:
    readonly SpectralLine[];

  constructor(
    readonly minimumWavelengthNanometers:
      number,

    readonly maximumWavelengthNanometers:
      number,

    readonly sampleCount:
      number,

    continuumAnchors:
      readonly SpectralContinuumAnchor[],

    lines:
      readonly SpectralLine[],
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
        'maximumWavelengthNanometers must be greater than minimumWavelengthNanometers.',
      );
    }

    if (
      !Number.isInteger(
        sampleCount,
      ) ||
      sampleCount <
        SPECTRUM_MIN_SAMPLE_COUNT ||
      sampleCount >
        SPECTRUM_MAX_SAMPLE_COUNT
    ) {
      throw new RangeError(
        `sampleCount must be an integer in [${SPECTRUM_MIN_SAMPLE_COUNT}, ${SPECTRUM_MAX_SAMPLE_COUNT}].`,
      );
    }

    if (
      continuumAnchors.length <
      2
    ) {
      throw new RangeError(
        'At least two continuum anchors are required.',
      );
    }

    const canonicalAnchors =
      [
        ...continuumAnchors,
      ]
        .sort(
          (
            left,
            right,
          ) =>
            left
              .wavelengthNanometers -
            right
              .wavelengthNanometers,
        );

    ensureUniqueAnchorWavelengths(
      canonicalAnchors,
    );

    for (
      const anchor
      of canonicalAnchors
    ) {
      if (
        anchor
          .wavelengthNanometers <
          minimumWavelengthNanometers ||
        anchor
          .wavelengthNanometers >
          maximumWavelengthNanometers
      ) {
        throw new RangeError(
          'Every continuum anchor must lie inside the spectral window.',
        );
      }
    }

    if (
      canonicalAnchors[
        0
      ]
        .wavelengthNanometers !==
        minimumWavelengthNanometers ||
      canonicalAnchors[
        canonicalAnchors.length -
          1
      ]
        .wavelengthNanometers !==
        maximumWavelengthNanometers
    ) {
      throw new RangeError(
        'Continuum anchors must include both spectral-window endpoints.',
      );
    }

    const canonicalLines =
      [
        ...lines,
      ]
        .sort(
          compareSpectralLines,
        );

    ensureUniqueLineIds(
      canonicalLines,
    );

    for (
      const line
      of canonicalLines
    ) {
      if (
        line
          .centerWavelengthNanometers <
          minimumWavelengthNanometers ||
        line
          .centerWavelengthNanometers >
          maximumWavelengthNanometers
      ) {
        throw new RangeError(
          `Spectral line ${line.id} lies outside the spectral window.`,
        );
      }
    }

    this.continuumAnchors =
      Object.freeze(
        canonicalAnchors,
      );

    this.lines =
      Object.freeze(
        canonicalLines,
      );
  }
}

/**
 * One sampled point from a synthesized normalized spectrum.
 */
export class SpectrumSample {

  constructor(
    readonly wavelengthNanometers:
      number,

    readonly normalizedFlux:
      number,
  ) {
    requirePositiveFinite(
      wavelengthNanometers,
      'wavelengthNanometers',
    );

    requireNormalized(
      normalizedFlux,
      'normalizedFlux',
    );
  }
}

/**
 * Point-13.1 synthesized spectrum.
 *
 * This is an internal idealized spectral frame, not yet a final UI-safe
 * observational product. Source line identifiers and the exact source
 * definition are intentionally absent from this result.
 */
export class SynthesizedSpectrum {

  readonly modelStatus =
    SpectroscopyModelStatus
      .SIMPLIFIED_IDEALIZED_V1;

  readonly samples:
    readonly SpectrumSample[];

  constructor(
    readonly observationSession:
      LeveledInstrumentObservationSession,

    readonly minimumWavelengthNanometers:
      number,

    readonly maximumWavelengthNanometers:
      number,

    samples:
      readonly SpectrumSample[],
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
        'Synthesized spectrum wavelength window is invalid.',
      );
    }

    if (
      samples.length <
      SPECTRUM_MIN_SAMPLE_COUNT
    ) {
      throw new RangeError(
        'Synthesized spectrum requires at least two samples.',
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
          'Synthesized spectrum contains a sample outside its wavelength window.',
        );
      }

      if (
        sample
          .wavelengthNanometers <=
        previousWavelength
      ) {
        throw new RangeError(
          'Synthesized spectrum wavelengths must be strictly increasing.',
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
        'Synthesized spectrum must include both wavelength-window endpoints.',
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

function compareSpectralLines(
  left:
    SpectralLine,

  right:
    SpectralLine,
): number {

  const wavelengthComparison =
    left
      .centerWavelengthNanometers -
    right
      .centerWavelengthNanometers;

  if (
    wavelengthComparison !==
    0
  ) {
    return wavelengthComparison;
  }

  const kindComparison =
    left
      .kind
      .localeCompare(
        right.kind,
      );

  if (
    kindComparison !==
    0
  ) {
    return kindComparison;
  }

  return left
    .id
    .localeCompare(
      right.id,
    );
}

function ensureUniqueAnchorWavelengths(
  anchors:
    readonly SpectralContinuumAnchor[],
): void {

  const wavelengths =
    new Set<number>();

  for (
    const anchor
    of anchors
  ) {
    if (
      wavelengths.has(
        anchor
          .wavelengthNanometers,
      )
    ) {
      throw new RangeError(
        `Duplicate continuum-anchor wavelength: ${anchor.wavelengthNanometers}.`,
      );
    }

    wavelengths.add(
      anchor
        .wavelengthNanometers,
    );
  }
}

function ensureUniqueLineIds(
  lines:
    readonly SpectralLine[],
): void {

  const ids =
    new Set<string>();

  for (
    const line
    of lines
  ) {
    if (
      ids.has(
        line.id,
      )
    ) {
      throw new RangeError(
        `Duplicate spectral-line id: ${line.id}.`,
      );
    }

    ids.add(
      line.id,
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
