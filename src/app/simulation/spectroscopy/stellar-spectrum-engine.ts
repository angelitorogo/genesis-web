import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type LeveledInstrumentObservationSession,
} from '../../domain/observation/observation-instrument-capability';

import {
  IdealizedSpectrumDefinition,
  SpectralContinuumAnchor,
  SpectralFeatureKind,
  SpectralLine,
  type SynthesizedSpectrum,
} from '../../domain/spectroscopy/spectrum';

import {
  StellarSpectrumProfile,
} from '../../domain/spectroscopy/stellar-spectrum-profile';

import {
  SpectroscopyEngine,
} from './spectroscopy-engine';

const V1_MIN_WAVELENGTH_NANOMETERS =
  380;

const V1_MAX_WAVELENGTH_NANOMETERS =
  750;

const V1_SAMPLE_COUNT =
  741;

const V1_CONTINUUM_ANCHOR_STEP_NANOMETERS =
  10;

/**
 * Second radiation constant h*c/k in metres*kelvin.
 *
 * The common multiplicative factor of Planck spectral radiance cancels during
 * point-13.2 normalization, so only the wavelength/temperature shape term is
 * required here.
 */
const SECOND_RADIATION_CONSTANT_M_K =
  0.014_387_768_77;

interface V1AbsorptionFeature {
  readonly id:
    string;

  readonly centerNanometers:
    number;

  readonly sigmaNanometers:
    number;

  strength(
    effectiveTemperatureKelvin:
      number,
  ): number;
}

/**
 * Point-13.2 simplified stellar photospheric absorption set.
 *
 * Centers are deliberately rounded V1 modeling anchors rather than a precision
 * line catalogue. Point 13.2 models recognizable broad stellar-spectrum shape;
 * it does not claim laboratory-grade line positions, abundances or radiative
 * transfer.
 */
const V1_ABSORPTION_FEATURES:
  readonly V1AbsorptionFeature[] =
  Object.freeze([
    {
      id:
        'CA_II_K_SIMPLIFIED',

      centerNanometers:
        393.5,

      sigmaNanometers:
        0.9,

      strength:
        coolMetalStrengthV1,
    },
    {
      id:
        'CA_II_H_SIMPLIFIED',

      centerNanometers:
        397,

      sigmaNanometers:
        0.9,

      strength:
        (
          temperature,
        ) =>
          0.85 *
          coolMetalStrengthV1(
            temperature,
          ),
    },
    {
      id:
        'H_BETA_SIMPLIFIED',

      centerNanometers:
        486,

      sigmaNanometers:
        1.4,

      strength:
        balmerStrengthV1,
    },
    {
      id:
        'MG_B_SIMPLIFIED',

      centerNanometers:
        517,

      sigmaNanometers:
        1.2,

      strength:
        (
          temperature,
        ) =>
          0.72 *
          coolMetalStrengthV1(
            temperature,
          ),
    },
    {
      id:
        'NA_D_SIMPLIFIED',

      centerNanometers:
        589.5,

      sigmaNanometers:
        1.3,

      strength:
        (
          temperature,
        ) =>
          0.78 *
          coolMetalStrengthV1(
            temperature,
          ),
    },
    {
      id:
        'H_ALPHA_SIMPLIFIED',

      centerNanometers:
        656.5,

      sigmaNanometers:
        1.7,

      strength:
        (
          temperature,
        ) =>
          0.92 *
          balmerStrengthV1(
            temperature,
          ),
    },
  ]);

/**
 * Pure point-13.2 stellar-spectrum projector.
 *
 * It consumes a caller-supplied effective temperature and produces a
 * simplified stellar spectrum through the generic point-13.1
 * SpectroscopyEngine.
 *
 * Roadmap boundaries intentionally preserved:
 * - no Star / StellarEvolutionState creation (point 14);
 * - no stellar mass/radius/luminosity/temperature generation (point 15.1);
 * - no M/K/G/F/A or other spectral classification (point 15.2);
 * - no atmospheric planetary spectrum (point 13.3);
 * - no nebular emission spectrum (point 13.4);
 * - no accretion/extreme-object spectrum (point 13.5);
 * - no biosignature/technosignature interpretation (point 13.6);
 * - no instrument-level degradation or uncertainty (point 13.7).
 */
export class StellarSpectrumEngine {

  private constructor() {}

  static synthesize(
    generationKey:
      UniverseGenerationKey,

    observationSession:
      LeveledInstrumentObservationSession,

    profile:
      StellarSpectrumProfile,
  ): SynthesizedSpectrum {

    if (
      generationKey !==
      observationSession
        .generationKey
    ) {
      throw new RangeError(
        'StellarSpectrumEngine generationKey must match observationSession.generationKey.',
      );
    }

    if (
      !(
        observationSession
          .targetLocator instanceof
        SystemLocator
      )
    ) {
      throw new RangeError(
        'Point-13.2 stellar spectra require a SystemLocator target until the later stellar-model phases define a dedicated stellar identity contract.',
      );
    }

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return SpectroscopyEngine
        .synthesize(
          generationKey,
          observationSession,
          this.definitionV1(
            profile,
          ),
        );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static definitionV1(
    profile:
      StellarSpectrumProfile,
  ): IdealizedSpectrumDefinition {

    const anchors =
      continuumAnchorsV1(
        profile
          .effectiveTemperatureKelvin,
      );

    const lines =
      V1_ABSORPTION_FEATURES
        .map(
          feature =>
            new SpectralLine(
              feature.id,
              SpectralFeatureKind
                .ABSORPTION,
              feature
                .centerNanometers,
              clamp01(
                feature
                  .strength(
                    profile
                      .effectiveTemperatureKelvin,
                  ),
              ),
              feature
                .sigmaNanometers,
            ),
        );

    return new IdealizedSpectrumDefinition(
      V1_MIN_WAVELENGTH_NANOMETERS,
      V1_MAX_WAVELENGTH_NANOMETERS,
      V1_SAMPLE_COUNT,
      anchors,
      lines,
    );
  }
}

function continuumAnchorsV1(
  effectiveTemperatureKelvin:
    number,
): readonly SpectralContinuumAnchor[] {

  const wavelengths:
    number[] =
    [];

  for (
    let wavelength =
      V1_MIN_WAVELENGTH_NANOMETERS;
    wavelength <=
      V1_MAX_WAVELENGTH_NANOMETERS;
    wavelength +=
      V1_CONTINUUM_ANCHOR_STEP_NANOMETERS
  ) {
    wavelengths.push(
      wavelength,
    );
  }

  if (
    wavelengths[
      wavelengths.length -
        1
    ] !==
    V1_MAX_WAVELENGTH_NANOMETERS
  ) {
    wavelengths.push(
      V1_MAX_WAVELENGTH_NANOMETERS,
    );
  }

  const rawFluxes =
    wavelengths
      .map(
        wavelength =>
          blackbodyShapeV1(
            wavelength,
            effectiveTemperatureKelvin,
          ),
      );

  const maximumFlux =
    Math.max(
      ...rawFluxes,
    );

  if (
    !Number.isFinite(
      maximumFlux,
    ) ||
    maximumFlux <=
      0
  ) {
    throw new RangeError(
      'Point-13.2 blackbody continuum normalization failed.',
    );
  }

  return Object.freeze(
    wavelengths
      .map(
        (
          wavelength,
          index,
        ) =>
          new SpectralContinuumAnchor(
            wavelength,
            clamp01(
              rawFluxes[
                index
              ] /
              maximumFlux,
            ),
          ),
      ),
  );
}

function blackbodyShapeV1(
  wavelengthNanometers:
    number,

  effectiveTemperatureKelvin:
    number,
): number {

  const wavelengthMeters =
    wavelengthNanometers *
    1e-9;

  const exponent =
    SECOND_RADIATION_CONSTANT_M_K /
    (
      wavelengthMeters *
      effectiveTemperatureKelvin
    );

  const denominator =
    wavelengthMeters ** 5 *
    Math.expm1(
      exponent,
    );

  const shape =
    1 /
    denominator;

  if (
    !Number.isFinite(
      shape,
    ) ||
    shape <=
      0
  ) {
    throw new RangeError(
      'Point-13.2 blackbody continuum produced an invalid value.',
    );
  }

  return shape;
}

/**
 * Simplified Balmer-response envelope.
 *
 * It intentionally peaks in a warm/intermediate photospheric regime and fades
 * toward both cooler and much hotter profiles. It is a gameplay/scientific
 * approximation, not a stellar-atmosphere radiative-transfer solution.
 */
function balmerStrengthV1(
  effectiveTemperatureKelvin:
    number,
): number {

  return (
    0.04 +
    0.50 *
      gaussianLogTemperatureV1(
        effectiveTemperatureKelvin,
        9_500,
        0.31,
      )
  );
}

/**
 * Simplified neutral/low-ionization metal-line response.
 *
 * Cooler photospheres receive stronger aggregate metal absorption in this V1
 * approximation. Elemental abundance and surface gravity are deliberately
 * deferred because the required stellar model does not exist until later
 * roadmap phases.
 */
function coolMetalStrengthV1(
  effectiveTemperatureKelvin:
    number,
): number {

  const logistic =
    1 /
    (
      1 +
      Math.exp(
        (
          effectiveTemperatureKelvin -
          6_500
        ) /
        1_250,
      )
    );

  return (
    0.05 +
    0.32 *
      logistic
  );
}

function gaussianLogTemperatureV1(
  temperature:
    number,

  centerTemperature:
    number,

  sigmaLog:
    number,
): number {

  const delta =
    (
      Math.log(
        temperature,
      ) -
      Math.log(
        centerTemperature,
      )
    ) /
    sigmaLog;

  return Math.exp(
    -0.5 *
    delta ** 2,
  );
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
