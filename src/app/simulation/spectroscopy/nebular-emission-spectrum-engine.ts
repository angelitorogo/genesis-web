import {
  HiiRegion,
} from '../../domain/galactic-object/hii-region';

import {
  NebulaType,
} from '../../domain/galactic-object/nebula-type';

import {
  type Nebula,
} from '../../domain/galactic-object/nebula';

import {
  GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

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
  SpectroscopyEngine,
} from './spectroscopy-engine';

const V1_MIN_WAVELENGTH_NANOMETERS =
  450;

const V1_MAX_WAVELENGTH_NANOMETERS =
  700;

const V1_SAMPLE_COUNT =
  2_501;

const V1_CONTINUUM_NORMALIZED_FLUX =
  0.03;

interface NebularLineStrengthsV1 {
  readonly hBeta:
    number;

  readonly oxygen5007:
    number;

  readonly nitrogen6584:
    number;

  readonly hAlpha:
    number;

  readonly sulfurBase:
    number;

  readonly sulfurDensityResponse:
    number;
}

/**
 * Point-13.4 simplified optical emission-line synthesis for existing point-12
 * nebula Ground Truth.
 *
 * Important boundaries:
 * - consumes the already-authoritative Nebula / HiiRegion domain models;
 * - does not create a second nebula physical profile;
 * - REFLECTION and DARK nebulae remain continuum-only in this V1 emission
 *   model instead of receiving invented line emission;
 * - HiiRegion uses its existing electron temperature/density specialization;
 * - output remains the generic point-13.1 SynthesizedSpectrum;
 * - no classification, PD, persistence, DiscoveryState mutation, rendering or
 *   instrument-level degradation occurs here.
 */
export class NebularEmissionSpectrumEngine {

  private constructor() {}

  static synthesize(
    generationKey:
      UniverseGenerationKey,

    observationSession:
      LeveledInstrumentObservationSession,

    nebula:
      Nebula,
  ): SynthesizedSpectrum {

    if (
      generationKey !==
      observationSession
        .generationKey
    ) {
      throw new RangeError(
        'NebularEmissionSpectrumEngine generationKey must match observationSession.generationKey.',
      );
    }

    if (
      generationKey !==
      nebula
        .generationKey
    ) {
      throw new RangeError(
        'NebularEmissionSpectrumEngine generationKey must match nebula.generationKey.',
      );
    }

    const targetLocator =
      observationSession
        .targetLocator;

    if (
      !(
        targetLocator instanceof
        GalacticObjectLocator
      )
    ) {
      throw new RangeError(
        'Point-13.4 nebular emission spectra require a GalacticObjectLocator target.',
      );
    }

    if (
      !sameGalacticObjectLocator(
        targetLocator,
        nebula.locator,
      )
    ) {
      throw new RangeError(
        'Point-13.4 observation target must match the supplied Nebula locator.',
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
            nebula,
          ),
        );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static definitionV1(
    nebula:
      Nebula,
  ): IdealizedSpectrumDefinition {

    const lines =
      supportsEmissionLinesV1(
        nebula,
      )
        ? linesV1(
            nebula,
          )
        : [];

    return new IdealizedSpectrumDefinition(
      V1_MIN_WAVELENGTH_NANOMETERS,
      V1_MAX_WAVELENGTH_NANOMETERS,
      V1_SAMPLE_COUNT,
      [
        new SpectralContinuumAnchor(
          V1_MIN_WAVELENGTH_NANOMETERS,
          V1_CONTINUUM_NORMALIZED_FLUX,
        ),
        new SpectralContinuumAnchor(
          V1_MAX_WAVELENGTH_NANOMETERS,
          V1_CONTINUUM_NORMALIZED_FLUX,
        ),
      ],
      lines,
    );
  }
}

function supportsEmissionLinesV1(
  nebula:
    Nebula,
): boolean {

  return (
    nebula.nebulaType ===
      NebulaType.EMISSION ||
    nebula.nebulaType ===
      NebulaType.PLANETARY
  );
}

function linesV1(
  nebula:
    Nebula,
): readonly SpectralLine[] {

  const strengths =
    strengthsV1(
      nebula,
    );

  const sulfur6717 =
    strengths
      .sulfurBase *
    (
      1 -
      0.45 *
      strengths
        .sulfurDensityResponse
    );

  const sulfur6731 =
    strengths
      .sulfurBase *
    (
      0.55 +
      0.45 *
      strengths
        .sulfurDensityResponse
    );

  return Object.freeze([
    emissionLine(
      'H_BETA_SIMPLIFIED',
      486.1,
      strengths.hBeta,
      0.24,
    ),

    emissionLine(
      'O_III_4959_SIMPLIFIED',
      495.9,
      strengths
        .oxygen5007 *
        0.34,
      0.20,
    ),

    emissionLine(
      'O_III_5007_SIMPLIFIED',
      500.7,
      strengths
        .oxygen5007,
      0.22,
    ),

    emissionLine(
      'N_II_6548_SIMPLIFIED',
      654.8,
      strengths
        .nitrogen6584 *
        0.34,
      0.20,
    ),

    emissionLine(
      'H_ALPHA_SIMPLIFIED',
      656.3,
      strengths.hAlpha,
      0.28,
    ),

    emissionLine(
      'N_II_6584_SIMPLIFIED',
      658.4,
      strengths
        .nitrogen6584,
      0.22,
    ),

    emissionLine(
      'S_II_6717_SIMPLIFIED',
      671.7,
      sulfur6717,
      0.22,
    ),

    emissionLine(
      'S_II_6731_SIMPLIFIED',
      673.1,
      sulfur6731,
      0.22,
    ),
  ]);
}

function strengthsV1(
  nebula:
    Nebula,
): NebularLineStrengthsV1 {

  const physical =
    nebula
      .physicalProperties;

  const electronTemperatureKelvin =
    nebula instanceof
      HiiRegion
      ? nebula
          .hiiPhysicalProperties
          .electronTemperatureKelvin
      : physical
          .gasTemperatureKelvin;

  const electronDensityPerCm3 =
    nebula instanceof
      HiiRegion
      ? nebula
          .hiiPhysicalProperties
          .electronDensityPerCm3
      : physical
          .hydrogenNumberDensityPerCm3;

  const ionization =
    clamp01(
      physical
        .ionizationFraction,
    );

  const oxygenTemperatureResponse =
    gaussianLogResponseV1(
      electronTemperatureKelvin,
      10_000,
      0.42,
    );

  const hydrogenTemperatureResponse =
    0.82 +
    0.18 *
    gaussianLogResponseV1(
      electronTemperatureKelvin,
      9_000,
      0.65,
    );

  const lowIonizationResponse =
    0.25 +
    0.75 *
    (
      1 -
      ionization
    );

  const densityResponse =
    clamp01(
      (
        Math.log10(
          electronDensityPerCm3,
        ) -
        1
      ) /
      3,
    );

  const subtype =
    nebula.nebulaType ===
      NebulaType.PLANETARY
      ? {
          hydrogen:
            0.82,

          oxygen:
            1.12,

          nitrogen:
            1.18,

          sulfur:
            0.72,
        }
      : {
          hydrogen:
            1,

          oxygen:
            0.92,

          nitrogen:
            0.82,

          sulfur:
            0.90,
        };

  const hBeta =
    clamp01(
      0.30 *
      (
        0.20 +
        0.80 *
        ionization
      ) *
      hydrogenTemperatureResponse *
      subtype
        .hydrogen,
    );

  const hAlpha =
    clamp01(
      hBeta *
      2.15,
    );

  const oxygen5007 =
    clamp01(
      0.72 *
      (
        0.12 +
        0.88 *
        ionization
      ) *
      oxygenTemperatureResponse *
      subtype
        .oxygen,
    );

  const nitrogen6584 =
    clamp01(
      0.34 *
      lowIonizationResponse *
      subtype
        .nitrogen,
    );

  const sulfurBase =
    clamp01(
      0.24 *
      lowIonizationResponse *
      subtype
        .sulfur,
    );

  return {
    hBeta,
    oxygen5007,
    nitrogen6584,
    hAlpha,
    sulfurBase,
    sulfurDensityResponse:
      densityResponse,
  };
}

function emissionLine(
  id:
    string,

  centerWavelengthNanometers:
    number,

  relativeStrength:
    number,

  gaussianSigmaNanometers:
    number,
): SpectralLine {

  return new SpectralLine(
    id,
    SpectralFeatureKind
      .EMISSION,
    centerWavelengthNanometers,
    clamp01(
      relativeStrength,
    ),
    gaussianSigmaNanometers,
  );
}

function gaussianLogResponseV1(
  value:
    number,

  center:
    number,

  sigmaLog:
    number,
): number {

  const delta =
    (
      Math.log(
        value,
      ) -
      Math.log(
        center,
      )
    ) /
    sigmaLog;

  return Math.exp(
    -0.5 *
    delta ** 2,
  );
}

function sameGalacticObjectLocator(
  left:
    GalacticObjectLocator,

  right:
    GalacticObjectLocator,
): boolean {

  return (
    left
      .galaxyIndex ===
    right
      .galaxyIndex &&
    left
      .sectorKey ===
    right
      .sectorKey &&
    left
      .galacticObjectIndex ===
    right
      .galacticObjectIndex
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
