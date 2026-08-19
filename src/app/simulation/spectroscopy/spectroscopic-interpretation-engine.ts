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
  type LeveledInstrumentObservationSession,
} from '../../domain/observation/observation-instrument-capability';

import {
  SpectroscopicEvidenceIndicator,
  SpectroscopicInterpretation,
  SpectroscopicSourceClassification,
} from '../../domain/spectroscopy/spectroscopic-interpretation';

export interface SpectroscopicInterpretationSample {
  readonly wavelengthNanometers:
    number;

  readonly normalizedFlux:
    number;
}

export interface SpectroscopicInterpretationInput {
  readonly observationSession:
    LeveledInstrumentObservationSession;

  readonly minimumWavelengthNanometers:
    number;

  readonly maximumWavelengthNanometers:
    number;

  readonly sampleCount:
    number;

  readonly samples:
    readonly SpectroscopicInterpretationSample[];

  /**
   * Optional point-13.7 instrument-dependent relative detectability floor.
   *
   * Idealized point-13.1 spectra omit it and therefore preserve the exact
   * point-13.6 behavior. InstrumentalSpectrum supplies it.
   */
  readonly minimumDetectableNormalizedContrast?:
    number;
}

const WINDOW_EPSILON_NANOMETERS =
  1e-9;

const MIN_SOURCE_FEATURE_CONTRAST =
  0.035;

const MIN_BIOSIGNATURE_BAND_CONTRAST =
  0.08;

const MIN_TECHNOSIGNATURE_PROMINENCE =
  0.14;

const MAX_TECHNOSIGNATURE_SAMPLE_STEP_NANOMETERS =
  1;

const MAX_TECHNOSIGNATURE_FWHM_NANOMETERS =
  1.5;

const TECHNO_SEARCH_MIN_NANOMETERS =
  400;

const TECHNO_SEARCH_MAX_NANOMETERS =
  800;

const KNOWN_NATURAL_FEATURE_EXCLUSION_NANOMETERS =
  2.5;

/**
 * Current natural-feature anchors already modeled by points 13.2-13.5.
 *
 * Point 13.6 deliberately does not call a narrow line a technosignature when
 * the line sits on top of a feature that GENESIS itself already models as a
 * stellar, nebular, remnant or active-nucleus feature.
 */
const KNOWN_NATURAL_FEATURES_NANOMETERS =
  Object.freeze([
    121.6,
    154.9,
    279.8,
    393.5,
    397,
    486,
    486.1,
    495.9,
    500.7,
    517,
    589.5,
    630,
    636.3,
    654.8,
    656.3,
    656.5,
    658.4,
    671.7,
    673.1,
  ]);

/**
 * Pure point-13.6 interpretation of an already-synthesized spectrum.
 *
 * Architectural boundaries:
 * - consumes only a structural spectral frame / observed spectral shape;
 * - does not inspect source Ground Truth objects;
 * - does not infer physical class from ProceduralLocator type;
 * - does not mutate point-8.9 ObservationClassification;
 * - does not mutate ObservationCertainty, DiscoveryState or completeness;
 * - returns no probability/confidence score;
 * - biosignatures and technosignatures are candidate evidence only;
 * - no PRNG, I/O, persistence, PD or rendering.
 *
 * Point 13.7 may now supply an InstrumentalSpectrum through the same
 * structural input contract. Idealized point-13.1 spectra remain accepted for
 * backwards-compatible simulation/regression use.
 */
export class SpectroscopicInterpretationEngine {

  private constructor() {}

  static interpret(
    generationKey:
      UniverseGenerationKey,

    spectrum:
      SpectroscopicInterpretationInput,
  ): SpectroscopicInterpretation {

    if (
      generationKey !==
      spectrum
        .observationSession
        .generationKey
    ) {
      throw new RangeError(
        'SpectroscopicInterpretationEngine generationKey must match spectrum.observationSession.generationKey.',
      );
    }

    if (
      spectrum
        .observationSession
        .instrumentType !==
      ObservationInstrumentType
        .SPECTROSCOPY
    ) {
      throw new RangeError(
        'Point-13.6 interpretation requires a spectrum acquired with ObservationInstrumentType.SPECTROSCOPY.',
      );
    }

    const minimumDetectableNormalizedContrast =
      spectrum
        .minimumDetectableNormalizedContrast;

    if (
      minimumDetectableNormalizedContrast !==
        undefined &&
      (
        !Number.isFinite(
          minimumDetectableNormalizedContrast,
        ) ||
        minimumDetectableNormalizedContrast <
          0 ||
        minimumDetectableNormalizedContrast >
          1
      )
    ) {
      throw new RangeError(
        'minimumDetectableNormalizedContrast must be finite and in [0, 1] when provided.',
      );
    }

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this
        .interpretV1(
          spectrum,
        );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static interpretV1(
    spectrum:
      SpectroscopicInterpretationInput,
  ): SpectroscopicInterpretation {

    const sourceClassification =
      classifySourceV1(
        spectrum,
      );

    const indicators:
      SpectroscopicEvidenceIndicator[] =
      [];

    if (
      sourceClassification ===
        SpectroscopicSourceClassification
          .ATMOSPHERIC_ABSORPTION &&
      hasOxygenMethaneCandidateV1(
        spectrum,
      )
    ) {
      indicators.push(
        SpectroscopicEvidenceIndicator
          .OXYGEN_METHANE_DISEQUILIBRIUM_CANDIDATE,
      );
    }

    if (
      hasNarrowIsolatedOpticalEmissionAnomalyV1(
        spectrum,
      )
    ) {
      indicators.push(
        SpectroscopicEvidenceIndicator
          .NARROW_ISOLATED_OPTICAL_EMISSION_ANOMALY,
      );
    }

    return new SpectroscopicInterpretation(
      sourceClassification,
      indicators,
    );
  }
}

function classifySourceV1(
  spectrum:
    SpectroscopicInterpretationInput,
): SpectroscopicSourceClassification {

  if (
    matchesWindowV1(
      spectrum,
      100,
      900,
    ) &&
    isActiveNucleusPatternV1(
      spectrum,
    )
  ) {
    return SpectroscopicSourceClassification
      .ACTIVE_GALACTIC_NUCLEUS;
  }

  if (
    matchesWindowV1(
      spectrum,
      400,
      2_500,
    ) &&
    isAtmosphericAbsorptionPatternV1(
      spectrum,
    )
  ) {
    return SpectroscopicSourceClassification
      .ATMOSPHERIC_ABSORPTION;
  }

  if (
    matchesWindowV1(
      spectrum,
      450,
      700,
    )
  ) {
    if (
      isSupernovaRemnantShockPatternV1(
        spectrum,
      )
    ) {
      return SpectroscopicSourceClassification
        .SUPERNOVA_REMNANT_SHOCK;
    }

    if (
      isNebularEmissionPatternV1(
        spectrum,
      )
    ) {
      return SpectroscopicSourceClassification
        .NEBULAR_EMISSION;
    }
  }

  if (
    matchesWindowV1(
      spectrum,
      380,
      750,
    ) &&
    isStellarPhotosphericPatternV1(
      spectrum,
    )
  ) {
    return SpectroscopicSourceClassification
      .STELLAR_PHOTOSPHERIC;
  }

  return SpectroscopicSourceClassification
    .UNCLASSIFIED;
}

function isActiveNucleusPatternV1(
  spectrum:
    SpectroscopicInterpretationInput,
): boolean {

  const ultravioletExcess =
    fluxAtV1(
      spectrum,
      220,
    ) -
    fluxAtV1(
      spectrum,
      850,
    );

  const broadUvEmission =
    Math.max(
      emissionContrastV1(
        spectrum,
        154.9,
        15,
      ),
      emissionContrastV1(
        spectrum,
        279.8,
        20,
      ),
    );

  return (
    ultravioletExcess >=
      0.12 &&
    broadUvEmission >=
      MIN_SOURCE_FEATURE_CONTRAST
  );
}

function isAtmosphericAbsorptionPatternV1(
  spectrum:
    SpectroscopicInterpretationInput,
): boolean {

  const contrasts = [
    absorptionContrastV1(
      spectrum,
      760,
      30,
    ),
    absorptionContrastV1(
      spectrum,
      940,
      80,
    ),
    absorptionContrastV1(
      spectrum,
      1_400,
      140,
    ),
    absorptionContrastV1(
      spectrum,
      1_900,
      150,
    ),
    absorptionContrastV1(
      spectrum,
      2_000,
      140,
    ),
    absorptionContrastV1(
      spectrum,
      2_300,
      120,
    ),
  ];

  return contrasts
    .filter(
      contrast =>
        contrast >=
        MIN_SOURCE_FEATURE_CONTRAST,
    )
    .length >=
    1;
}

function isStellarPhotosphericPatternV1(
  spectrum:
    SpectroscopicInterpretationInput,
): boolean {

  const absorptionFeatures = [
    [
      393.5,
      4,
    ],
    [
      486,
      6,
    ],
    [
      517,
      5,
    ],
    [
      589.5,
      5,
    ],
    [
      656.5,
      7,
    ],
  ] as const;

  return absorptionFeatures
    .filter(
      ([
        center,
        shoulder,
      ]) =>
        absorptionContrastV1(
          spectrum,
          center,
          shoulder,
        ) >=
        0.012,
    )
    .length >=
    2;
}

function isSupernovaRemnantShockPatternV1(
  spectrum:
    SpectroscopicInterpretationInput,
): boolean {

  return (
    emissionContrastV1(
      spectrum,
      656.3,
      5,
    ) >=
      0.08 &&
    emissionContrastV1(
      spectrum,
      630,
      4,
    ) >=
      0.045 &&
    emissionContrastV1(
      spectrum,
      671.7,
      3,
    ) >=
      0.045
  );
}

function isNebularEmissionPatternV1(
  spectrum:
    SpectroscopicInterpretationInput,
): boolean {

  const hAlpha =
    emissionContrastV1(
      spectrum,
      656.3,
      5,
    );

  const supportingLine =
    Math.max(
      emissionContrastV1(
        spectrum,
        500.7,
        5,
      ),
      emissionContrastV1(
        spectrum,
        658.4,
        4,
      ),
      emissionContrastV1(
        spectrum,
        671.7,
        3,
      ),
    );

  return (
    hAlpha >=
      0.08 &&
    supportingLine >=
      0.04
  );
}

function hasOxygenMethaneCandidateV1(
  spectrum:
    SpectroscopicInterpretationInput,
): boolean {

  const oxygenA =
    absorptionContrastV1(
      spectrum,
      760,
      30,
    );

  const methane1650 =
    absorptionContrastV1(
      spectrum,
      1_650,
      120,
    );

  const methane2300 =
    absorptionContrastV1(
      spectrum,
      2_300,
      120,
    );

  const detectableContrast =
    minimumDetectableContrastV1(
      spectrum,
      MIN_BIOSIGNATURE_BAND_CONTRAST,
    );

  return (
    oxygenA >=
      detectableContrast &&
    Math.max(
      methane1650,
      methane2300,
    ) >=
      detectableContrast
  );
}

function hasNarrowIsolatedOpticalEmissionAnomalyV1(
  spectrum:
    SpectroscopicInterpretationInput,
): boolean {

  if (
    spectrum.sampleCount <
    3
  ) {
    return false;
  }

  const sampleStep =
    minimumSampleStepV1(
      spectrum,
    );

  if (
    sampleStep >
    MAX_TECHNOSIGNATURE_SAMPLE_STEP_NANOMETERS
  ) {
    return false;
  }

  const samples =
    spectrum.samples;

  for (
    let index =
      1;
    index <
      samples.length -
      1;
    index +=
      1
  ) {
    const sample =
      samples[
        index
      ];

    const wavelength =
      sample
        .wavelengthNanometers;

    if (
      wavelength <
        TECHNO_SEARCH_MIN_NANOMETERS ||
      wavelength >
        TECHNO_SEARCH_MAX_NANOMETERS ||
      isKnownNaturalFeatureV1(
        wavelength,
      )
    ) {
      continue;
    }

    if (
      sample
        .normalizedFlux <=
        samples[
          index -
          1
        ]
          .normalizedFlux ||
      sample
        .normalizedFlux <
        samples[
          index +
          1
        ]
          .normalizedFlux
    ) {
      continue;
    }

    const shoulderDistance =
      Math.max(
        2,
        sampleStep *
          4,
      );

    const baseline =
      average(
        fluxAtV1(
          spectrum,
          wavelength -
          shoulderDistance,
        ),
        fluxAtV1(
          spectrum,
          wavelength +
          shoulderDistance,
        ),
      );

    const prominence =
      sample
        .normalizedFlux -
      baseline;

    if (
      prominence <
      minimumDetectableContrastV1(
        spectrum,
        MIN_TECHNOSIGNATURE_PROMINENCE,
      )
    ) {
      continue;
    }

    const halfMaximum =
      baseline +
      prominence /
        2;

    const leftWavelength =
      firstBelowHalfMaximumLeftV1(
        spectrum,
        index,
        halfMaximum,
      );

    const rightWavelength =
      firstBelowHalfMaximumRightV1(
        spectrum,
        index,
        halfMaximum,
      );

    if (
      leftWavelength ===
        null ||
      rightWavelength ===
        null
    ) {
      continue;
    }

    if (
      rightWavelength -
        leftWavelength <=
      MAX_TECHNOSIGNATURE_FWHM_NANOMETERS
    ) {
      return true;
    }
  }

  return false;
}

function firstBelowHalfMaximumLeftV1(
  spectrum:
    SpectroscopicInterpretationInput,

  peakIndex:
    number,

  halfMaximum:
    number,
): number | null {

  for (
    let index =
      peakIndex -
      1;
    index >=
      0;
    index -=
      1
  ) {
    const sample =
      spectrum.samples[
        index
      ];

    if (
      sample
        .normalizedFlux <=
      halfMaximum
    ) {
      return sample
        .wavelengthNanometers;
    }
  }

  return null;
}

function firstBelowHalfMaximumRightV1(
  spectrum:
    SpectroscopicInterpretationInput,

  peakIndex:
    number,

  halfMaximum:
    number,
): number | null {

  for (
    let index =
      peakIndex +
      1;
    index <
      spectrum.samples.length;
    index +=
      1
  ) {
    const sample =
      spectrum.samples[
        index
      ];

    if (
      sample
        .normalizedFlux <=
      halfMaximum
    ) {
      return sample
        .wavelengthNanometers;
    }
  }

  return null;
}

function isKnownNaturalFeatureV1(
  wavelengthNanometers:
    number,
): boolean {

  return KNOWN_NATURAL_FEATURES_NANOMETERS
    .some(
      knownWavelength =>
        Math.abs(
          wavelengthNanometers -
          knownWavelength,
        ) <=
        KNOWN_NATURAL_FEATURE_EXCLUSION_NANOMETERS,
    );
}

function matchesWindowV1(
  spectrum:
    SpectroscopicInterpretationInput,

  minimumWavelengthNanometers:
    number,

  maximumWavelengthNanometers:
    number,
): boolean {

  return (
    Math.abs(
      spectrum
        .minimumWavelengthNanometers -
      minimumWavelengthNanometers,
    ) <=
      WINDOW_EPSILON_NANOMETERS &&
    Math.abs(
      spectrum
        .maximumWavelengthNanometers -
      maximumWavelengthNanometers,
    ) <=
      WINDOW_EPSILON_NANOMETERS
  );
}

function emissionContrastV1(
  spectrum:
    SpectroscopicInterpretationInput,

  centerWavelengthNanometers:
    number,

  shoulderDistanceNanometers:
    number,
): number {

  if (
    !containsWavelengthV1(
      spectrum,
      centerWavelengthNanometers -
        shoulderDistanceNanometers,
    ) ||
    !containsWavelengthV1(
      spectrum,
      centerWavelengthNanometers +
        shoulderDistanceNanometers,
    )
  ) {
    return 0;
  }

  const baseline =
    average(
      fluxAtV1(
        spectrum,
        centerWavelengthNanometers -
          shoulderDistanceNanometers,
      ),
      fluxAtV1(
        spectrum,
        centerWavelengthNanometers +
          shoulderDistanceNanometers,
      ),
    );

  return Math.max(
    0,
    fluxAtV1(
      spectrum,
      centerWavelengthNanometers,
    ) -
      baseline,
  );
}

function absorptionContrastV1(
  spectrum:
    SpectroscopicInterpretationInput,

  centerWavelengthNanometers:
    number,

  shoulderDistanceNanometers:
    number,
): number {

  if (
    !containsWavelengthV1(
      spectrum,
      centerWavelengthNanometers -
        shoulderDistanceNanometers,
    ) ||
    !containsWavelengthV1(
      spectrum,
      centerWavelengthNanometers +
        shoulderDistanceNanometers,
    )
  ) {
    return 0;
  }

  const baseline =
    average(
      fluxAtV1(
        spectrum,
        centerWavelengthNanometers -
          shoulderDistanceNanometers,
      ),
      fluxAtV1(
        spectrum,
        centerWavelengthNanometers +
          shoulderDistanceNanometers,
      ),
    );

  return Math.max(
    0,
    baseline -
      fluxAtV1(
        spectrum,
        centerWavelengthNanometers,
      ),
  );
}

function containsWavelengthV1(
  spectrum:
    SpectroscopicInterpretationInput,

  wavelengthNanometers:
    number,
): boolean {

  return (
    wavelengthNanometers >=
      spectrum
        .minimumWavelengthNanometers &&
    wavelengthNanometers <=
      spectrum
        .maximumWavelengthNanometers
  );
}

function fluxAtV1(
  spectrum:
    SpectroscopicInterpretationInput,

  wavelengthNanometers:
    number,
): number {

  let nearest =
    spectrum.samples[
      0
    ];

  let nearestDistance =
    Math.abs(
      nearest
        .wavelengthNanometers -
      wavelengthNanometers,
    );

  for (
    let index =
      1;
    index <
      spectrum.samples.length;
    index +=
      1
  ) {
    const candidate =
      spectrum.samples[
        index
      ];

    const distance =
      Math.abs(
        candidate
          .wavelengthNanometers -
        wavelengthNanometers,
      );

    if (
      distance <
      nearestDistance
    ) {
      nearest =
        candidate;

      nearestDistance =
        distance;
    }
  }

  return nearest
    .normalizedFlux;
}

function minimumSampleStepV1(
  spectrum:
    SpectroscopicInterpretationInput,
): number {

  let minimumStep =
    Number.POSITIVE_INFINITY;

  for (
    let index =
      1;
    index <
      spectrum.samples.length;
    index +=
      1
  ) {
    minimumStep =
      Math.min(
        minimumStep,
        spectrum.samples[
          index
        ]
          .wavelengthNanometers -
        spectrum.samples[
          index -
          1
        ]
          .wavelengthNanometers,
      );
  }

  return minimumStep;
}

function minimumDetectableContrastV1(
  spectrum:
    SpectroscopicInterpretationInput,

  baselineThreshold:
    number,
): number {

  return Math.max(
    baselineThreshold,
    spectrum
      .minimumDetectableNormalizedContrast ??
      0,
  );
}

function average(
  left:
    number,

  right:
    number,
): number {

  return (
    left +
    right
  ) /
    2;
}
