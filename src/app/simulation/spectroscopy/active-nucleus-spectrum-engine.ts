import {
  GalaxyLocator,
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
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

import {
  type Galaxy,
} from '../../domain/universe/galaxy';

import {
  GalacticNuclearActivityProfileGenerator,
} from '../nuclear/galactic-nuclear-activity-profile-generator';

import {
  SpectroscopyEngine,
} from './spectroscopy-engine';

const V1_MIN_WAVELENGTH_NANOMETERS =
  100;

const V1_MAX_WAVELENGTH_NANOMETERS =
  900;

const V1_SAMPLE_COUNT =
  1_601;

interface ActiveNucleusContinuumAnchorV1 {
  readonly wavelengthNanometers:
    number;

  readonly agnNormalizedFlux:
    number;

  readonly quasarNormalizedFlux:
    number;
}

interface ActiveNucleusEmissionFeatureV1 {
  readonly id:
    string;

  readonly centerWavelengthNanometers:
    number;

  readonly agnStrength:
    number;

  readonly quasarStrength:
    number;

  readonly agnSigmaNanometers:
    number;

  readonly quasarSigmaNanometers:
    number;
}

/**
 * Simplified V1 optical/UV active-nucleus continuum.
 *
 * It is a spectroscopy template for an already-active AGN/QUASAR Ground Truth,
 * not a physical AccretionDisk model. Point 27.7 remains authoritative for
 * future accretion-disk and relativistic-jet domain models.
 */
const V1_CONTINUUM:
  readonly ActiveNucleusContinuumAnchorV1[] =
  Object.freeze([
    {
      wavelengthNanometers:
        100,

      agnNormalizedFlux:
        0.52,

      quasarNormalizedFlux:
        0.72,
    },
    {
      wavelengthNanometers:
        120,

      agnNormalizedFlux:
        0.66,

      quasarNormalizedFlux:
        0.88,
    },
    {
      wavelengthNanometers:
        150,

      agnNormalizedFlux:
        0.82,

      quasarNormalizedFlux:
        1,
    },
    {
      wavelengthNanometers:
        220,

      agnNormalizedFlux:
        1,

      quasarNormalizedFlux:
        0.96,
    },
    {
      wavelengthNanometers:
        300,

      agnNormalizedFlux:
        0.90,

      quasarNormalizedFlux:
        0.84,
    },
    {
      wavelengthNanometers:
        400,

      agnNormalizedFlux:
        0.78,

      quasarNormalizedFlux:
        0.70,
    },
    {
      wavelengthNanometers:
        500,

      agnNormalizedFlux:
        0.66,

      quasarNormalizedFlux:
        0.57,
    },
    {
      wavelengthNanometers:
        650,

      agnNormalizedFlux:
        0.56,

      quasarNormalizedFlux:
        0.43,
    },
    {
      wavelengthNanometers:
        750,

      agnNormalizedFlux:
        0.50,

      quasarNormalizedFlux:
        0.35,
    },
    {
      wavelengthNanometers:
        900,

      agnNormalizedFlux:
        0.44,

      quasarNormalizedFlux:
        0.28,
    },
  ]);

/**
 * Rounded V1 broad-emission anchors representative of unobscured active
 * nuclei. They are deliberately a compact gameplay/scientific-visualization
 * template rather than a precision atomic catalogue or a broad-line-region
 * dynamics solver.
 */
const V1_BROAD_EMISSION_FEATURES:
  readonly ActiveNucleusEmissionFeatureV1[] =
  Object.freeze([
    {
      id:
        'LY_ALPHA_SIMPLIFIED',

      centerWavelengthNanometers:
        121.6,

      agnStrength:
        0.54,

      quasarStrength:
        0.72,

      agnSigmaNanometers:
        3,

      quasarSigmaNanometers:
        4.8,
    },
    {
      id:
        'C_IV_SIMPLIFIED',

      centerWavelengthNanometers:
        154.9,

      agnStrength:
        0.42,

      quasarStrength:
        0.60,

      agnSigmaNanometers:
        3.4,

      quasarSigmaNanometers:
        5.2,
    },
    {
      id:
        'MG_II_SIMPLIFIED',

      centerWavelengthNanometers:
        279.8,

      agnStrength:
        0.34,

      quasarStrength:
        0.46,

      agnSigmaNanometers:
        4.8,

      quasarSigmaNanometers:
        6.6,
    },
    {
      id:
        'H_BETA_BROAD_SIMPLIFIED',

      centerWavelengthNanometers:
        486.1,

      agnStrength:
        0.30,

      quasarStrength:
        0.38,

      agnSigmaNanometers:
        5.8,

      quasarSigmaNanometers:
        7.5,
    },
    {
      id:
        'H_ALPHA_BROAD_SIMPLIFIED',

      centerWavelengthNanometers:
        656.3,

      agnStrength:
        0.38,

      quasarStrength:
        0.46,

      agnSigmaNanometers:
        7.2,

      quasarSigmaNanometers:
        9.5,
    },
  ]);

/**
 * Point-13.5 idealized active-galactic-nucleus spectrum.
 *
 * The engine consumes the existing Galaxy + nuclear-activity Ground Truth.
 * It intentionally does NOT introduce an AccretionDisk, accretion rate,
 * black-hole spin, jet power, absolute luminosity, inclination or time
 * evolution. Those physical models belong to later roadmap phases.
 *
 * Applicability is strict: only an already-existing AGN or QUASAR episode can
 * be synthesized. A QUIESCENT/no-nucleus galaxy is rejected rather than being
 * given an invented accretion spectrum.
 */
export class ActiveNucleusSpectrumEngine {

  private constructor() {}

  static synthesize(
    generationKey:
      UniverseGenerationKey,

    observationSession:
      LeveledInstrumentObservationSession,

    galaxy:
      Galaxy,
  ): SynthesizedSpectrum {

    if (
      generationKey !==
      observationSession
        .generationKey
    ) {
      throw new RangeError(
        'ActiveNucleusSpectrumEngine generationKey must match observationSession.generationKey.',
      );
    }

    if (
      generationKey !==
      galaxy
        .generationKey
    ) {
      throw new RangeError(
        'ActiveNucleusSpectrumEngine generationKey must match galaxy.generationKey.',
      );
    }

    const targetLocator =
      observationSession
        .targetLocator;

    if (
      !(
        targetLocator instanceof
        GalaxyLocator
      )
    ) {
      throw new RangeError(
        'Point-13.5 active-nucleus spectra require a GalaxyLocator target.',
      );
    }

    if (
      targetLocator
        .galaxyIndex !==
      galaxy.index
    ) {
      throw new RangeError(
        'Point-13.5 observation target must match the supplied Galaxy index.',
      );
    }

    if (
      generationKey
        .generatorVersion !==
      GeneratorVersion.V1
    ) {
      throw new RangeError(
        `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
      );
    }

    const nuclearActivity =
      GalacticNuclearActivityProfileGenerator
        .generate(
          galaxy,
        );

    if (
      !nuclearActivity
        .isActiveEpisode ||
      !nuclearActivity
        .hasSupermassiveBlackHole
    ) {
      throw new RangeError(
        'Point-13.5 active-nucleus spectrum is applicable only to an existing AGN or QUASAR episode with a supermassive black hole.',
      );
    }

    const nucleusState =
      nuclearActivity
        .nucleusState;

    if (
      nucleusState !==
        GalacticNucleusState.AGN &&
      nucleusState !==
        GalacticNucleusState.QUASAR
    ) {
      throw new RangeError(
        'Point-13.5 active-nucleus spectrum received an unsupported active nucleus state.',
      );
    }

    return SpectroscopyEngine
      .synthesize(
        generationKey,
        observationSession,
        this.definitionV1(
          nucleusState,
        ),
      );
  }

  private static definitionV1(
    nucleusState:
      typeof GalacticNucleusState.AGN |
      typeof GalacticNucleusState.QUASAR,
  ): IdealizedSpectrumDefinition {

    const isQuasar =
      nucleusState ===
      GalacticNucleusState
        .QUASAR;

    const continuum =
      V1_CONTINUUM
        .map(
          anchor =>
            new SpectralContinuumAnchor(
              anchor
                .wavelengthNanometers,

              isQuasar
                ? anchor
                    .quasarNormalizedFlux
                : anchor
                    .agnNormalizedFlux,
            ),
        );

    const lines =
      V1_BROAD_EMISSION_FEATURES
        .map(
          feature =>
            new SpectralLine(
              feature.id,
              SpectralFeatureKind
                .EMISSION,
              feature
                .centerWavelengthNanometers,
              isQuasar
                ? feature
                    .quasarStrength
                : feature
                    .agnStrength,
              isQuasar
                ? feature
                    .quasarSigmaNanometers
                : feature
                    .agnSigmaNanometers,
            ),
        );

    return new IdealizedSpectrumDefinition(
      V1_MIN_WAVELENGTH_NANOMETERS,
      V1_MAX_WAVELENGTH_NANOMETERS,
      V1_SAMPLE_COUNT,
      continuum,
      lines,
    );
  }
}
