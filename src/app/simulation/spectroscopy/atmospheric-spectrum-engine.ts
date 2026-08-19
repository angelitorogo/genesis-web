import {
  BodyLocator,
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
  AtmosphericSpectralAbsorber,
  AtmosphericSpectrumProfile,
} from '../../domain/spectroscopy/atmospheric-spectrum-profile';

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
  400;

const V1_MAX_WAVELENGTH_NANOMETERS =
  2_500;

const V1_SAMPLE_COUNT =
  421;

interface V1AtmosphericBand {
  readonly id:
    string;

  readonly absorber:
    AtmosphericSpectralAbsorber;

  readonly centerNanometers:
    number;

  readonly sigmaNanometers:
    number;

  readonly maximumRelativeStrength:
    number;
}

/**
 * Rounded, broad V1 molecular-band anchors for gameplay/scientific
 * visualization.
 *
 * They intentionally approximate recognizable absorption regions rather than
 * reproduce a laboratory line list or solve radiative transfer. Exact line
 * positions, pressure broadening, temperature dependence, clouds/aerosols and
 * overlapping opacity belong to a higher-fidelity future model.
 */
const V1_ATMOSPHERIC_BANDS:
  readonly V1AtmosphericBand[] =
  Object.freeze([
    {
      id:
        'O3_CHAPPUIS_SIMPLIFIED',

      absorber:
        AtmosphericSpectralAbsorber
          .OZONE,

      centerNanometers:
        600,

      sigmaNanometers:
        85,

      maximumRelativeStrength:
        0.22,
    },
    {
      id:
        'H2O_720_SIMPLIFIED',

      absorber:
        AtmosphericSpectralAbsorber
          .WATER_VAPOR,

      centerNanometers:
        720,

      sigmaNanometers:
        20,

      maximumRelativeStrength:
        0.18,
    },
    {
      id:
        'O2_A_760_SIMPLIFIED',

      absorber:
        AtmosphericSpectralAbsorber
          .MOLECULAR_OXYGEN,

      centerNanometers:
        760,

      sigmaNanometers:
        8,

      maximumRelativeStrength:
        0.28,
    },
    {
      id:
        'H2O_940_SIMPLIFIED',

      absorber:
        AtmosphericSpectralAbsorber
          .WATER_VAPOR,

      centerNanometers:
        940,

      sigmaNanometers:
        28,

      maximumRelativeStrength:
        0.38,
    },
    {
      id:
        'H2O_1130_SIMPLIFIED',

      absorber:
        AtmosphericSpectralAbsorber
          .WATER_VAPOR,

      centerNanometers:
        1_130,

      sigmaNanometers:
        35,

      maximumRelativeStrength:
        0.25,
    },
    {
      id:
        'H2O_1400_SIMPLIFIED',

      absorber:
        AtmosphericSpectralAbsorber
          .WATER_VAPOR,

      centerNanometers:
        1_400,

      sigmaNanometers:
        55,

      maximumRelativeStrength:
        0.62,
    },
    {
      id:
        'CO2_1600_SIMPLIFIED',

      absorber:
        AtmosphericSpectralAbsorber
          .CARBON_DIOXIDE,

      centerNanometers:
        1_600,

      sigmaNanometers:
        45,

      maximumRelativeStrength:
        0.42,
    },
    {
      id:
        'CH4_1650_SIMPLIFIED',

      absorber:
        AtmosphericSpectralAbsorber
          .METHANE,

      centerNanometers:
        1_650,

      sigmaNanometers:
        45,

      maximumRelativeStrength:
        0.46,
    },
    {
      id:
        'N2O_1700_SIMPLIFIED',

      absorber:
        AtmosphericSpectralAbsorber
          .NITROUS_OXIDE,

      centerNanometers:
        1_700,

      sigmaNanometers:
        42,

      maximumRelativeStrength:
        0.30,
    },
    {
      id:
        'H2O_1900_SIMPLIFIED',

      absorber:
        AtmosphericSpectralAbsorber
          .WATER_VAPOR,

      centerNanometers:
        1_900,

      sigmaNanometers:
        75,

      maximumRelativeStrength:
        0.72,
    },
    {
      id:
        'CO2_2000_SIMPLIFIED',

      absorber:
        AtmosphericSpectralAbsorber
          .CARBON_DIOXIDE,

      centerNanometers:
        2_000,

      sigmaNanometers:
        55,

      maximumRelativeStrength:
        0.55,
    },
    {
      id:
        'NH3_2050_SIMPLIFIED',

      absorber:
        AtmosphericSpectralAbsorber
          .AMMONIA,

      centerNanometers:
        2_050,

      sigmaNanometers:
        55,

      maximumRelativeStrength:
        0.42,
    },
    {
      id:
        'SO2_2200_SIMPLIFIED',

      absorber:
        AtmosphericSpectralAbsorber
          .SULFUR_DIOXIDE,

      centerNanometers:
        2_200,

      sigmaNanometers:
        60,

      maximumRelativeStrength:
        0.34,
    },
    {
      id:
        'CO_2300_SIMPLIFIED',

      absorber:
        AtmosphericSpectralAbsorber
          .CARBON_MONOXIDE,

      centerNanometers:
        2_300,

      sigmaNanometers:
        48,

      maximumRelativeStrength:
        0.44,
    },
    {
      id:
        'CH4_2300_SIMPLIFIED',

      absorber:
        AtmosphericSpectralAbsorber
          .METHANE,

      centerNanometers:
        2_300,

      sigmaNanometers:
        70,

      maximumRelativeStrength:
        0.58,
    },
  ]);

/**
 * Pure point-13.3 simplified planetary/lunar atmospheric transmission engine.
 *
 * It consumes only a spectroscopy-facing atmospheric profile supplied by the
 * caller and delegates final sampling to the generic point-13.1
 * SpectroscopyEngine.
 *
 * Roadmap boundaries intentionally preserved:
 * - BodyLocator is used for both future planets and moons;
 * - no PlanetGenerator / MoonGenerator / AtmosphereGenerator is introduced;
 * - no physical pressure or density is invented before point 20.2;
 * - no climate, water inventory, geology or habitability is inferred;
 * - no biosignature or technosignature conclusion is produced (point 13.6);
 * - no instrument-level degradation or uncertainty is applied (point 13.7).
 */
export class AtmosphericSpectrumEngine {

  private constructor() {}

  static synthesize(
    generationKey:
      UniverseGenerationKey,

    observationSession:
      LeveledInstrumentObservationSession,

    profile:
      AtmosphericSpectrumProfile,
  ): SynthesizedSpectrum {

    if (
      generationKey !==
      observationSession
        .generationKey
    ) {
      throw new RangeError(
        'AtmosphericSpectrumEngine generationKey must match observationSession.generationKey.',
      );
    }

    if (
      !(
        observationSession
          .targetLocator instanceof
        BodyLocator
      )
    ) {
      throw new RangeError(
        'Point-13.3 atmospheric spectra require a BodyLocator target.',
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
      AtmosphericSpectrumProfile,
  ): IdealizedSpectrumDefinition {

    const componentByAbsorber =
      new Map(
        profile
          .components
          .map(
            component =>
              [
                component
                  .absorber,
                component,
              ] as const,
          ),
      );

    const lines =
      V1_ATMOSPHERIC_BANDS
        .flatMap(
          band => {
            const component =
              componentByAbsorber
                .get(
                  band
                    .absorber,
                );

            if (
              component ===
              undefined
            ) {
              return [];
            }

            const relativeStrength =
              band
                .maximumRelativeStrength *
              abundanceResponseV1(
                component
                  .volumeMixingRatio,
                profile
                  .relativeColumnScale,
              );

            if (
              relativeStrength <=
              0
            ) {
              return [];
            }

            return [
              new SpectralLine(
                band.id,
                SpectralFeatureKind
                  .ABSORPTION,
                band
                  .centerNanometers,
                clamp01(
                  relativeStrength,
                ),
                band
                  .sigmaNanometers,
              ),
            ];
          },
        );

    return new IdealizedSpectrumDefinition(
      V1_MIN_WAVELENGTH_NANOMETERS,
      V1_MAX_WAVELENGTH_NANOMETERS,
      V1_SAMPLE_COUNT,
      [
        new SpectralContinuumAnchor(
          V1_MIN_WAVELENGTH_NANOMETERS,
          1,
        ),
        new SpectralContinuumAnchor(
          V1_MAX_WAVELENGTH_NANOMETERS,
          1,
        ),
      ],
      lines,
    );
  }
}

/**
 * Bounded V1 response from represented abundance and effective absorbing
 * column. This is intentionally not Beer-Lambert radiative transfer: point
 * 13.3 only needs a stable monotonic simplified spectrum before physical
 * pressure/density and atmospheric temperature exist in the roadmap.
 */
function abundanceResponseV1(
  volumeMixingRatio:
    number,

  relativeColumnScale:
    number,
): number {

  if (
    relativeColumnScale ===
    0
  ) {
    return 0;
  }

  const abundanceResponse =
    1 -
    Math.exp(
      -10 *
      Math.sqrt(
        volumeMixingRatio,
      ),
    );

  return clamp01(
    abundanceResponse *
    relativeColumnScale,
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
