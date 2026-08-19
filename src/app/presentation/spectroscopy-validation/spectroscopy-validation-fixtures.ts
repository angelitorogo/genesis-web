import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  NebulaPhysicalProperties,
} from '../../domain/galactic-object/nebula-physical-properties';

import {
  NebulaType,
} from '../../domain/galactic-object/nebula-type';

import {
  Nebula,
} from '../../domain/galactic-object/nebula';

import {
  SupernovaRemnantMorphology,
} from '../../domain/galactic-object/supernova-remnant-morphology';

import {
  SupernovaRemnantPhysicalProperties,
} from '../../domain/galactic-object/supernova-remnant-physical-properties';

import {
  SupernovaRemnant,
} from '../../domain/galactic-object/supernova-remnant';

import {
  BodyLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  type ProceduralLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  InstrumentObservationSession,
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  LeveledInstrumentObservationSession,
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  ObservationSession,
  Observatory,
} from '../../domain/observation/observatory';

import {
  GalaxySectorCoordinates,
} from '../../domain/sector/galaxy-sector-coordinates';

import {
  GalaxySectorObjectLocation,
} from '../../domain/sector/galaxy-sector-object-location';

import {
  AtmosphericSpectralAbsorber,
  AtmosphericSpectralComponent,
  AtmosphericSpectrumProfile,
} from '../../domain/spectroscopy/atmospheric-spectrum-profile';

import {
  type InstrumentalSpectrum,
} from '../../domain/spectroscopy/instrumental-spectrum';

import {
  type SynthesizedSpectrum,
} from '../../domain/spectroscopy/spectrum';

import {
  StellarSpectrumProfile,
} from '../../domain/spectroscopy/stellar-spectrum-profile';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ObservationInstrumentCapabilityCatalogV1,
} from '../../simulation/observation/observation-instrument-capability-catalog';

import {
  ObservationInstrumentCatalogV1,
} from '../../simulation/observation/observation-instrument-catalog';

import {
  ActiveNucleusSpectrumEngine,
} from '../../simulation/spectroscopy/active-nucleus-spectrum-engine';

import {
  AtmosphericSpectrumEngine,
} from '../../simulation/spectroscopy/atmospheric-spectrum-engine';

import {
  InstrumentalSpectrumEngine,
} from '../../simulation/spectroscopy/instrumental-spectrum-engine';

import {
  NebularEmissionSpectrumEngine,
} from '../../simulation/spectroscopy/nebular-emission-spectrum-engine';

import {
  StellarSpectrumEngine,
} from '../../simulation/spectroscopy/stellar-spectrum-engine';

import {
  SupernovaRemnantSpectrumEngine,
} from '../../simulation/spectroscopy/supernova-remnant-spectrum-engine';

import {
  GalaxyGenerator,
} from '../../simulation/universe/galaxy-generator';

export const SpectroscopyValidationCaseId =
  Object.freeze({
    STELLAR:
      'STELLAR',

    ATMOSPHERE:
      'ATMOSPHERE',

    NEBULA:
      'NEBULA',

    AGN:
      'AGN',

    QUASAR:
      'QUASAR',

    SUPERNOVA_REMNANT:
      'SUPERNOVA_REMNANT',
  } as const);

export type SpectroscopyValidationCaseId =
  typeof SpectroscopyValidationCaseId[
    keyof typeof SpectroscopyValidationCaseId
  ];

export interface SpectroscopyValidationCase {
  readonly id:
    SpectroscopyValidationCaseId;

  readonly label:
    string;

  readonly description:
    string;
}

export const SPECTROSCOPY_VALIDATION_CASES:
  readonly SpectroscopyValidationCase[] =
  Object.freeze([
    Object.freeze({
      id:
        SpectroscopyValidationCaseId
          .STELLAR,
      label:
        'Estrella',
      description:
        'Continuo fotosférico simplificado con líneas de absorción.',
    }),
    Object.freeze({
      id:
        SpectroscopyValidationCaseId
          .ATMOSPHERE,
      label:
        'Atmósfera',
      description:
        'Bandas anchas de H₂O, O₂, CO₂ y CH₄.',
    }),
    Object.freeze({
      id:
        SpectroscopyValidationCaseId
          .NEBULA,
      label:
        'Nebulosa',
      description:
        'Líneas estrechas de emisión de una nebulosa de emisión.',
    }),
    Object.freeze({
      id:
        SpectroscopyValidationCaseId
          .AGN,
      label:
        'AGN',
      description:
        'Núcleo galáctico activo real del vector V1, galaxia 20.',
    }),
    Object.freeze({
      id:
        SpectroscopyValidationCaseId
          .QUASAR,
      label:
        'QUASAR',
      description:
        'QUASAR real del vector V1, galaxia 331.',
    }),
    Object.freeze({
      id:
        SpectroscopyValidationCaseId
          .SUPERNOVA_REMNANT,
      label:
        'Remanente SN',
      description:
        'Patrón de emisión de choque de un remanente de supernova.',
    }),
  ]);

export interface SpectroscopyValidationFrame {
  readonly idealized:
    SynthesizedSpectrum;

  readonly instrumental:
    InstrumentalSpectrum;
}

export interface SpectroscopyValidationComparison {
  readonly level1:
    SpectroscopyValidationFrame;

  readonly level5:
    SpectroscopyValidationFrame;
}

const GENERATION_KEY =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V1,
  );

const GALACTIC_OBJECT_LOCATOR =
  new GalacticObjectLocator(
    0n,
    0n,
    0n,
  );

const GALACTIC_OBJECT_LOCATION =
  new GalaxySectorObjectLocation(
    new GalaxySectorCoordinates(
      0,
      0,
    ),
    0.25,
    0.75,
  );

export class SpectroscopyValidationFixtures {

  private constructor() {}

  static frame(
    caseId:
      SpectroscopyValidationCaseId,

    level:
      ObservationInstrumentLevel,
  ): SpectroscopyValidationFrame {

    const idealized =
      this.idealized(
        caseId,
        level,
      );

    return Object.freeze({
      idealized,

      instrumental:
        InstrumentalSpectrumEngine
          .observe(
            GENERATION_KEY,
            idealized,
          ),
    });
  }

  static comparison(
    caseId:
      SpectroscopyValidationCaseId,
  ): SpectroscopyValidationComparison {

    return Object.freeze({
      level1:
        this.frame(
          caseId,
          ObservationInstrumentLevel
            .LEVEL_1,
        ),

      level5:
        this.frame(
          caseId,
          ObservationInstrumentLevel
            .LEVEL_5,
        ),
    });
  }

  private static idealized(
    caseId:
      SpectroscopyValidationCaseId,

    level:
      ObservationInstrumentLevel,
  ): SynthesizedSpectrum {

    switch (
      caseId
    ) {
      case SpectroscopyValidationCaseId
        .STELLAR:
        return this
          .stellar(
            level,
          );

      case SpectroscopyValidationCaseId
        .ATMOSPHERE:
        return this
          .atmosphere(
            level,
          );

      case SpectroscopyValidationCaseId
        .NEBULA:
        return this
          .nebula(
            level,
          );

      case SpectroscopyValidationCaseId
        .AGN:
        return this
          .activeNucleus(
            20n,
            level,
          );

      case SpectroscopyValidationCaseId
        .QUASAR:
        return this
          .activeNucleus(
            331n,
            level,
          );

      case SpectroscopyValidationCaseId
        .SUPERNOVA_REMNANT:
        return this
          .supernovaRemnant(
            level,
          );

      default:
        throw new RangeError(
          `Unsupported spectroscopy validation case: ${String(caseId)}.`,
        );
    }
  }

  private static stellar(
    level:
      ObservationInstrumentLevel,
  ): SynthesizedSpectrum {

    return StellarSpectrumEngine
      .synthesize(
        GENERATION_KEY,
        session(
          new SystemLocator(
            0n,
            0n,
            0n,
          ),
          level,
        ),
        new StellarSpectrumProfile(
          5_800,
        ),
      );
  }

  private static atmosphere(
    level:
      ObservationInstrumentLevel,
  ): SynthesizedSpectrum {

    return AtmosphericSpectrumEngine
      .synthesize(
        GENERATION_KEY,
        session(
          new BodyLocator(
            0n,
            0n,
            0n,
            0n,
          ),
          level,
        ),
        new AtmosphericSpectrumProfile(
          [
            new AtmosphericSpectralComponent(
              AtmosphericSpectralAbsorber
                .WATER_VAPOR,
              0.02,
            ),
            new AtmosphericSpectralComponent(
              AtmosphericSpectralAbsorber
                .MOLECULAR_OXYGEN,
              0.21,
            ),
            new AtmosphericSpectralComponent(
              AtmosphericSpectralAbsorber
                .CARBON_DIOXIDE,
              0.04,
            ),
            new AtmosphericSpectralComponent(
              AtmosphericSpectralAbsorber
                .METHANE,
              0.01,
            ),
          ],
          1,
        ),
      );
  }

  private static nebula(
    level:
      ObservationInstrumentLevel,
  ): SynthesizedSpectrum {

    const target =
      new Nebula(
        GENERATION_KEY,
        GALACTIC_OBJECT_LOCATOR,
        GALACTIC_OBJECT_LOCATION,
        NebulaType.EMISSION,
        new NebulaPhysicalProperties(
          20,
          2_500,
          9_500,
          300,
          0.85,
          0.012,
        ),
      );

    return NebularEmissionSpectrumEngine
      .synthesize(
        GENERATION_KEY,
        session(
          GALACTIC_OBJECT_LOCATOR,
          level,
        ),
        target,
      );
  }

  private static activeNucleus(
    galaxyIndex:
      bigint,

    level:
      ObservationInstrumentLevel,
  ): SynthesizedSpectrum {

    const galaxy =
      GalaxyGenerator
        .generate(
          GENERATION_KEY,
          galaxyIndex,
        );

    return ActiveNucleusSpectrumEngine
      .synthesize(
        GENERATION_KEY,
        session(
          new GalaxyLocator(
            galaxyIndex,
          ),
          level,
        ),
        galaxy,
      );
  }

  private static supernovaRemnant(
    level:
      ObservationInstrumentLevel,
  ): SynthesizedSpectrum {

    const target =
      new SupernovaRemnant(
        GENERATION_KEY,
        GALACTIC_OBJECT_LOCATOR,
        GALACTIC_OBJECT_LOCATION,
        SupernovaRemnantMorphology
          .SHELL,
        new SupernovaRemnantPhysicalProperties(
          12_000,
          18,
          590,
          4_700_000,
          1e51,
          0.8,
          6.5,
          676,
        ),
      );

    return SupernovaRemnantSpectrumEngine
      .synthesize(
        GENERATION_KEY,
        session(
          GALACTIC_OBJECT_LOCATOR,
          level,
        ),
        target,
      );
  }
}

function session(
  targetLocator:
    ProceduralLocator,

  level:
    ObservationInstrumentLevel,
): LeveledInstrumentObservationSession {

  const baseSession =
    new ObservationSession(
      new Observatory(
        GENERATION_KEY,
      ),
      targetLocator,
      DiscoveryState
        .DISCOVERED,
    );

  const instrument =
    ObservationInstrumentCatalogV1
      .instrument(
        ObservationInstrumentType
          .SPECTROSCOPY,
      );

  return new LeveledInstrumentObservationSession(
    new InstrumentObservationSession(
      baseSession,
      instrument,
    ),
    ObservationInstrumentCapabilityCatalogV1
      .profile(
        ObservationInstrumentType
          .SPECTROSCOPY,
        level,
      ),
  );
}
