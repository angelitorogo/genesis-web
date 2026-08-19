import {
  type SupernovaRemnant,
} from '../../domain/galactic-object/supernova-remnant';

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

const SPEED_OF_LIGHT_KM_PER_SECOND =
  299_792.458;

interface SupernovaRemnantLineV1 {
  readonly id:
    string;

  readonly centerWavelengthNanometers:
    number;

  readonly family:
    'HYDROGEN' |
    'OXYGEN' |
    'NITROGEN' |
    'SULFUR' |
    'NEUTRAL_OXYGEN';

  readonly relativeScale:
    number;
}

/**
 * Rounded optical shock-line anchors used by the simplified point-13.5 V1
 * supernova-remnant spectrum.
 */
const V1_SHOCK_LINES:
  readonly SupernovaRemnantLineV1[] =
  Object.freeze([
    {
      id:
        'H_BETA_SHOCK_SIMPLIFIED',

      centerWavelengthNanometers:
        486.1,

      family:
        'HYDROGEN',

      relativeScale:
        0.34,
    },
    {
      id:
        'O_III_4959_SHOCK_SIMPLIFIED',

      centerWavelengthNanometers:
        495.9,

      family:
        'OXYGEN',

      relativeScale:
        0.34,
    },
    {
      id:
        'O_III_5007_SHOCK_SIMPLIFIED',

      centerWavelengthNanometers:
        500.7,

      family:
        'OXYGEN',

      relativeScale:
        1,
    },
    {
      id:
        'O_I_6300_SHOCK_SIMPLIFIED',

      centerWavelengthNanometers:
        630,

      family:
        'NEUTRAL_OXYGEN',

      relativeScale:
        1,
    },
    {
      id:
        'O_I_6363_SHOCK_SIMPLIFIED',

      centerWavelengthNanometers:
        636.3,

      family:
        'NEUTRAL_OXYGEN',

      relativeScale:
        0.33,
    },
    {
      id:
        'N_II_6548_SHOCK_SIMPLIFIED',

      centerWavelengthNanometers:
        654.8,

      family:
        'NITROGEN',

      relativeScale:
        0.34,
    },
    {
      id:
        'H_ALPHA_SHOCK_SIMPLIFIED',

      centerWavelengthNanometers:
        656.3,

      family:
        'HYDROGEN',

      relativeScale:
        1,
    },
    {
      id:
        'N_II_6584_SHOCK_SIMPLIFIED',

      centerWavelengthNanometers:
        658.4,

      family:
        'NITROGEN',

      relativeScale:
        1,
    },
    {
      id:
        'S_II_6717_SHOCK_SIMPLIFIED',

      centerWavelengthNanometers:
        671.7,

      family:
        'SULFUR',

      relativeScale:
        1,
    },
    {
      id:
        'S_II_6731_SHOCK_SIMPLIFIED',

      centerWavelengthNanometers:
        673.1,

      family:
        'SULFUR',

      relativeScale:
        0.82,
    },
  ]);

/**
 * Point-13.5 simplified optical shock spectrum for the already-existing
 * point-12.6 persistent SupernovaRemnant Ground Truth.
 *
 * This engine does not classify the reserved EXTREME_OBJECT complement and
 * does not create neutron stars, pulsars, magnetars, compact binaries or black
 * holes. It only projects spectroscopy from a SupernovaRemnant that already
 * exists.
 *
 * Expansion velocity is used as a bounded Doppler-width proxy; shock
 * temperature and ambient hydrogen density modulate relative line families.
 * This is intentionally a stable V1 approximation, not a full plasma/shock
 * radiative-transfer solver.
 */
export class SupernovaRemnantSpectrumEngine {

  private constructor() {}

  static synthesize(
    generationKey:
      UniverseGenerationKey,

    observationSession:
      LeveledInstrumentObservationSession,

    remnant:
      SupernovaRemnant,
  ): SynthesizedSpectrum {

    if (
      generationKey !==
      observationSession
        .generationKey
    ) {
      throw new RangeError(
        'SupernovaRemnantSpectrumEngine generationKey must match observationSession.generationKey.',
      );
    }

    if (
      generationKey !==
      remnant
        .generationKey
    ) {
      throw new RangeError(
        'SupernovaRemnantSpectrumEngine generationKey must match remnant.generationKey.',
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
        'Point-13.5 supernova-remnant spectra require a GalacticObjectLocator target.',
      );
    }

    if (
      !sameGalacticObjectLocator(
        targetLocator,
        remnant.locator,
      )
    ) {
      throw new RangeError(
        'Point-13.5 observation target must match the supplied SupernovaRemnant locator.',
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

    return SpectroscopyEngine
      .synthesize(
        generationKey,
        observationSession,
        this.definitionV1(
          remnant,
        ),
      );
  }

  private static definitionV1(
    remnant:
      SupernovaRemnant,
  ): IdealizedSpectrumDefinition {

    const physical =
      remnant
        .physicalProperties;

    const oxygenResponse =
      clamp01(
        0.58 *
          logisticV1(
            (
              physical
                .expansionVelocityKmPerSecond -
              110
            ) /
            35,
          ) +
        0.42 *
          normalizedLogV1(
            physical
              .shockTemperatureKelvin,
            1.0e4,
            1.0e7,
          ),
      );

    const densityResponse =
      normalizedLogV1(
        physical
          .ambientHydrogenNumberDensityPerCm3,
        0.005,
        10,
      );

    const hydrogenStrength =
      0.60;

    const oxygenStrength =
      0.10 +
      0.62 *
      oxygenResponse;

    const lowIonizationResponse =
      1 -
      0.38 *
      oxygenResponse;

    const nitrogenStrength =
      0.34 *
      lowIonizationResponse;

    const sulfurStrength =
      0.30 +
      0.34 *
      densityResponse *
      lowIonizationResponse;

    const neutralOxygenStrength =
      0.18 +
      0.22 *
      lowIonizationResponse;

    const lines =
      V1_SHOCK_LINES
        .map(
          line =>
            new SpectralLine(
              line.id,
              SpectralFeatureKind
                .EMISSION,
              line
                .centerWavelengthNanometers,
              clamp01(
                line
                  .relativeScale *
                familyStrengthV1(
                  line.family,
                  hydrogenStrength,
                  oxygenStrength,
                  nitrogenStrength,
                  sulfurStrength,
                  neutralOxygenStrength,
                ),
              ),
              dopplerSigmaV1(
                line
                  .centerWavelengthNanometers,
                physical
                  .expansionVelocityKmPerSecond,
              ),
            ),
        );

    const hotContinuumResponse =
      normalizedLogV1(
        physical
          .shockTemperatureKelvin,
        1.0e4,
        1.0e7,
      );

    return new IdealizedSpectrumDefinition(
      V1_MIN_WAVELENGTH_NANOMETERS,
      V1_MAX_WAVELENGTH_NANOMETERS,
      V1_SAMPLE_COUNT,
      [
        new SpectralContinuumAnchor(
          V1_MIN_WAVELENGTH_NANOMETERS,
          0.045 +
          0.045 *
          hotContinuumResponse,
        ),
        new SpectralContinuumAnchor(
          575,
          0.045,
        ),
        new SpectralContinuumAnchor(
          V1_MAX_WAVELENGTH_NANOMETERS,
          0.035,
        ),
      ],
      lines,
    );
  }
}

function familyStrengthV1(
  family:
    SupernovaRemnantLineV1[
      'family'
    ],

  hydrogen:
    number,

  oxygen:
    number,

  nitrogen:
    number,

  sulfur:
    number,

  neutralOxygen:
    number,
): number {

  switch (
    family
  ) {
    case 'HYDROGEN':
      return hydrogen;

    case 'OXYGEN':
      return oxygen;

    case 'NITROGEN':
      return nitrogen;

    case 'SULFUR':
      return sulfur;

    case 'NEUTRAL_OXYGEN':
      return neutralOxygen;
  }
}

function dopplerSigmaV1(
  centerWavelengthNanometers:
    number,

  expansionVelocityKmPerSecond:
    number,
): number {

  const projectedFraction =
    expansionVelocityKmPerSecond /
    SPEED_OF_LIGHT_KM_PER_SECOND *
    0.25;

  return clamp(
    0.18,
    4,
    centerWavelengthNanometers *
    projectedFraction,
  );
}

function normalizedLogV1(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {

  return clamp01(
    (
      Math.log(
        value,
      ) -
      Math.log(
        minimum,
      )
    ) /
    (
      Math.log(
        maximum,
      ) -
      Math.log(
        minimum,
      )
    ),
  );
}

function logisticV1(
  value:
    number,
): number {

  return 1 /
    (
      1 +
      Math.exp(
        -value,
      )
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

function clamp(
  minimum:
    number,

  maximum:
    number,

  value:
    number,
): number {

  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}

function clamp01(
  value:
    number,
): number {

  return clamp(
    0,
    1,
    value,
  );
}
