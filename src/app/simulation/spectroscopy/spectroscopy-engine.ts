import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  type LeveledInstrumentObservationSession,
} from '../../domain/observation/observation-instrument-capability';

import {
  IdealizedSpectrumDefinition,
  SpectrumSample,
  SpectralFeatureKind,
  SynthesizedSpectrum,
} from '../../domain/spectroscopy/spectrum';

/**
 * Pure point-13.1 spectroscopy synthesis engine.
 *
 * Scope frozen for 13.1:
 * - deterministic normalized spectral synthesis;
 * - linear continuum interpolation;
 * - simplified Gaussian absorption/emission features;
 * - explicit GeneratorVersion.V1 dispatch;
 * - no I/O, persistence, PD, DiscoveryState mutation or PRNG;
 * - no stellar/planetary/nebular/extreme-object source model yet;
 * - no biosignature/technosignature interpretation yet;
 * - no instrument-level degradation or uncertainty yet.
 */
export class SpectroscopyEngine {

  private constructor() {}

  static synthesize(
    generationKey:
      UniverseGenerationKey,

    observationSession:
      LeveledInstrumentObservationSession,

    definition:
      IdealizedSpectrumDefinition,
  ): SynthesizedSpectrum {

    if (
      generationKey !==
      observationSession
        .generationKey
    ) {
      throw new RangeError(
        'SpectroscopyEngine generationKey must match observationSession.generationKey.',
      );
    }

    if (
      observationSession
        .instrumentType !==
      ObservationInstrumentType
        .SPECTROSCOPY
    ) {
      throw new RangeError(
        `SpectroscopyEngine requires ObservationInstrumentType.SPECTROSCOPY, received ${observationSession.instrumentType}.`,
      );
    }

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this
        .synthesizeV1(
          observationSession,
          definition,
        );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static synthesizeV1(
    observationSession:
      LeveledInstrumentObservationSession,

    definition:
      IdealizedSpectrumDefinition,
  ): SynthesizedSpectrum {

    const samples:
      SpectrumSample[] =
      [];

    const range =
      definition
        .maximumWavelengthNanometers -
      definition
        .minimumWavelengthNanometers;

    for (
      let sampleIndex =
        0;
      sampleIndex <
        definition
          .sampleCount;
      sampleIndex +=
        1
    ) {
      const wavelength =
        definition
          .minimumWavelengthNanometers +
        (
          range *
          sampleIndex
        ) /
        (
          definition
            .sampleCount -
          1
        );

      let normalizedFlux =
        continuumFluxAtV1(
          definition,
          wavelength,
        );

      for (
        const line
        of definition
          .lines
      ) {
        const delta =
          wavelength -
          line
            .centerWavelengthNanometers;

        const sigma =
          line
            .gaussianSigmaNanometers;

        const gaussian =
          Math.exp(
            -0.5 *
            (
              delta /
              sigma
            ) ** 2,
          );

        const contribution =
          line
            .relativeStrength *
          gaussian;

        normalizedFlux +=
          line.kind ===
          SpectralFeatureKind
            .EMISSION
            ? contribution
            : -contribution;
      }

      samples.push(
        new SpectrumSample(
          wavelength,
          clamp01(
            normalizedFlux,
          ),
        ),
      );
    }

    return new SynthesizedSpectrum(
      observationSession,
      definition
        .minimumWavelengthNanometers,
      definition
        .maximumWavelengthNanometers,
      samples,
    );
  }
}

function continuumFluxAtV1(
  definition:
    IdealizedSpectrumDefinition,

  wavelength:
    number,
): number {

  const anchors =
    definition
      .continuumAnchors;

  if (
    wavelength <=
    anchors[
      0
    ]
      .wavelengthNanometers
  ) {
    return anchors[
      0
    ]
      .normalizedFlux;
  }

  for (
    let index =
      1;
    index <
      anchors.length;
    index +=
      1
  ) {
    const right =
      anchors[
        index
      ];

    if (
      wavelength <=
      right
        .wavelengthNanometers
    ) {
      const left =
        anchors[
          index -
          1
        ];

      const fraction =
        (
          wavelength -
          left
            .wavelengthNanometers
        ) /
        (
          right
            .wavelengthNanometers -
          left
            .wavelengthNanometers
        );

      return left
        .normalizedFlux +
        (
          right
            .normalizedFlux -
          left
            .normalizedFlux
        ) *
        fraction;
    }
  }

  return anchors[
    anchors.length -
      1
  ]
    .normalizedFlux;
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
