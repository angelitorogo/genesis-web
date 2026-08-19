import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  InstrumentalSpectrum,
  InstrumentalSpectrumSample,
} from '../../domain/spectroscopy/instrumental-spectrum';

import {
  type SynthesizedSpectrum,
} from '../../domain/spectroscopy/spectrum';

import {
  ObservationMeasurementUncertaintyEngine,
} from '../observation/observation-measurement-uncertainty-engine';

const NORMALIZED_FLUX_REFERENCE_SCALE =
  1;

const MAX_GAUSSIAN_SIGMA_SAMPLES =
  6;

const GAUSSIAN_RADIUS_SIGMAS =
  3;

const GAUSSIAN_FWHM_FACTOR =
  2.3548200450309493;

const MINIMUM_DETECTABLE_CONTRAST_AT_FULL_SENSITIVITY =
  0.01;

const ADDITIONAL_CONTRAST_PENALTY_AT_ZERO_SENSITIVITY =
  0.20;

/**
 * Point-13.7 instrumental projection of an idealized point-13.1 spectrum.
 *
 * The idealized spectrum remains the internal scientific signal. This engine
 * creates a separate Observed-Knowledge projection by applying:
 *
 * 1) deterministic Gaussian resolution smoothing driven only by the existing
 *    point-8.3 normalizedPrecision;
 * 2) a dimensionless detectability floor driven by normalizedSensitivity;
 * 3) the existing point-8.6 deterministic scalar uncertainty quantization to
 *    every normalized-flux sample, with referenceScale = 1.
 *
 * normalizedReach is intentionally not used to distort an already-acquired
 * spectral frame. Reach belongs target-access/acquisition semantics, not the
 * post-acquisition spectral shape.
 *
 * No PRNG, Gaussian noise draw, Poisson noise, SNR, persistence, PD,
 * DiscoveryState mutation or ObservationCertainty promotion is introduced.
 */
export class InstrumentalSpectrumEngine {

  private constructor() {}

  static observe(
    generationKey:
      UniverseGenerationKey,

    idealizedSpectrum:
      SynthesizedSpectrum,
  ): InstrumentalSpectrum {

    if (
      generationKey !==
      idealizedSpectrum
        .observationSession
        .generationKey
    ) {
      throw new RangeError(
        'InstrumentalSpectrumEngine generationKey must match idealizedSpectrum.observationSession.generationKey.',
      );
    }

    if (
      idealizedSpectrum
        .observationSession
        .instrumentType !==
      ObservationInstrumentType
        .SPECTROSCOPY
    ) {
      throw new RangeError(
        'Point-13.7 instrumental spectra require ObservationInstrumentType.SPECTROSCOPY.',
      );
    }

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this
        .observeV1(
          generationKey,
          idealizedSpectrum,
        );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static observeV1(
    generationKey:
      UniverseGenerationKey,

    idealizedSpectrum:
      SynthesizedSpectrum,
  ): InstrumentalSpectrum {

    const observationSession =
      idealizedSpectrum
        .observationSession;

    const sigmaSamples =
      MAX_GAUSSIAN_SIGMA_SAMPLES *
      (
        1 -
        observationSession
          .normalizedPrecision
      );

    const smoothedFluxes =
      smoothNormalizedFluxV1(
        idealizedSpectrum,
        sigmaSamples,
      );

    const observedSamples:
      InstrumentalSpectrumSample[] =
      [];

    let quantizationFraction:
      number | null =
      null;

    for (
      let index =
        0;
      index <
        idealizedSpectrum
          .samples
          .length;
      index +=
        1
    ) {
      const sourceSample =
        idealizedSpectrum
          .samples[
            index
          ];

      const measurement =
        ObservationMeasurementUncertaintyEngine
          .estimateScalar(
            generationKey,
            observationSession,
            smoothedFluxes[
              index
            ],
            NORMALIZED_FLUX_REFERENCE_SCALE,
          );

      const currentFraction =
        measurement
          .upperBoundExclusive -
        measurement
          .lowerBoundInclusive;

      if (
        quantizationFraction ===
        null
      ) {
        quantizationFraction =
          currentFraction;
      }

      observedSamples.push(
        new InstrumentalSpectrumSample(
          sourceSample
            .wavelengthNanometers,
          measurement
            .lowerBoundInclusive,
          measurement
            .upperBoundExclusive,
        ),
      );
    }

    if (
      quantizationFraction ===
      null
    ) {
      throw new RangeError(
        'Point-13.7 instrumental projection requires at least one measured sample.',
      );
    }

    const nominalSampleStep =
      (
        idealizedSpectrum
          .maximumWavelengthNanometers -
        idealizedSpectrum
          .minimumWavelengthNanometers
      ) /
      (
        idealizedSpectrum
          .sampleCount -
        1
      );

    const effectiveResolutionElementNanometers =
      nominalSampleStep *
      Math.max(
        1,
        GAUSSIAN_FWHM_FACTOR *
        sigmaSamples,
      );

    const minimumDetectableNormalizedContrast =
      clamp01(
        MINIMUM_DETECTABLE_CONTRAST_AT_FULL_SENSITIVITY +
        ADDITIONAL_CONTRAST_PENALTY_AT_ZERO_SENSITIVITY *
        (
          1 -
          observationSession
            .normalizedSensitivity
        ),
      );

    return new InstrumentalSpectrum(
      observationSession,
      idealizedSpectrum
        .minimumWavelengthNanometers,
      idealizedSpectrum
        .maximumWavelengthNanometers,
      observedSamples,
      effectiveResolutionElementNanometers,
      minimumDetectableNormalizedContrast,
      quantizationFraction,
    );
  }
}

function smoothNormalizedFluxV1(
  spectrum:
    SynthesizedSpectrum,

  sigmaSamples:
    number,
): readonly number[] {

  if (
    sigmaSamples <=
    Number.EPSILON
  ) {
    return spectrum
      .samples
      .map(
        sample =>
          sample
            .normalizedFlux,
      );
  }

  const radius =
    Math.max(
      1,
      Math.ceil(
        sigmaSamples *
        GAUSSIAN_RADIUS_SIGMAS,
      ),
    );

  const output:
    number[] =
    [];

  for (
    let centerIndex =
      0;
    centerIndex <
      spectrum
        .samples
        .length;
    centerIndex +=
      1
  ) {
    let weightedFlux =
      0;

    let totalWeight =
      0;

    const minimumIndex =
      Math.max(
        0,
        centerIndex -
        radius,
      );

    const maximumIndex =
      Math.min(
        spectrum
          .samples
          .length -
        1,
        centerIndex +
        radius,
      );

    for (
      let sampleIndex =
        minimumIndex;
      sampleIndex <=
        maximumIndex;
      sampleIndex +=
        1
    ) {
      const deltaSamples =
        sampleIndex -
        centerIndex;

      const weight =
        Math.exp(
          -0.5 *
          (
            deltaSamples /
            sigmaSamples
          ) ** 2,
        );

      weightedFlux +=
        spectrum
          .samples[
            sampleIndex
          ]
          .normalizedFlux *
        weight;

      totalWeight +=
        weight;
    }

    output.push(
      clamp01(
        weightedFlux /
        totalWeight,
      ),
    );
  }

  return output;
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
