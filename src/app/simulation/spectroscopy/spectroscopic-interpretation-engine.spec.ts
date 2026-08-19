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
  SpectroscopicCandidateStatus,
  SpectroscopicEvidenceIndicator,
  SpectroscopicSourceClassification,
} from '../../domain/spectroscopy/spectroscopic-interpretation';

import {
  IdealizedSpectrumDefinition,
  SpectralContinuumAnchor,
  SpectralFeatureKind,
  SpectralLine,
  SynthesizedSpectrum,
} from '../../domain/spectroscopy/spectrum';

import {
  StellarSpectrumProfile,
} from '../../domain/spectroscopy/stellar-spectrum-profile';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ObservationInstrumentCapabilityCatalogV1,
} from '../observation/observation-instrument-capability-catalog';

import {
  ObservationInstrumentCatalogV1,
} from '../observation/observation-instrument-catalog';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  ActiveNucleusSpectrumEngine,
} from './active-nucleus-spectrum-engine';

import {
  AtmosphericSpectrumEngine,
} from './atmospheric-spectrum-engine';

import {
  NebularEmissionSpectrumEngine,
} from './nebular-emission-spectrum-engine';

import {
  SpectroscopicInterpretationEngine,
} from './spectroscopic-interpretation-engine';

import {
  SpectroscopyEngine,
} from './spectroscopy-engine';

import {
  StellarSpectrumEngine,
} from './stellar-spectrum-engine';

import {
  SupernovaRemnantSpectrumEngine,
} from './supernova-remnant-spectrum-engine';

describe(
  'SpectroscopicInterpretationEngine point 13.6',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const galacticObjectLocator =
      new GalacticObjectLocator(
        0n,
        0n,
        0n,
      );

    const location =
      new GalaxySectorObjectLocation(
        new GalaxySectorCoordinates(
          0,
          0,
        ),
        0.25,
        0.75,
      );

    function session(
      targetLocator:
        ProceduralLocator,

      level:
        ObservationInstrumentLevel =
        ObservationInstrumentLevel
          .LEVEL_3,

      instrumentType:
        ObservationInstrumentType =
        ObservationInstrumentType
          .SPECTROSCOPY,

      key:
        UniverseGenerationKey =
        generationKey,
    ): LeveledInstrumentObservationSession {

      const observatory =
        new Observatory(
          key,
        );

      const baseSession =
        new ObservationSession(
          observatory,
          targetLocator,
          DiscoveryState
            .DISCOVERED,
        );

      const instrument =
        ObservationInstrumentCatalogV1
          .instrument(
            instrumentType,
          );

      return new LeveledInstrumentObservationSession(
        new InstrumentObservationSession(
          baseSession,
          instrument,
        ),
        ObservationInstrumentCapabilityCatalogV1
          .profile(
            instrumentType,
            level,
          ),
      );
    }

    function stellarSpectrum(
      level:
        ObservationInstrumentLevel =
        ObservationInstrumentLevel
          .LEVEL_3,
    ) {
      return StellarSpectrumEngine
        .synthesize(
          generationKey,
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

    function atmosphereSpectrum(
      components:
        readonly AtmosphericSpectralComponent[],

      level:
        ObservationInstrumentLevel =
        ObservationInstrumentLevel
          .LEVEL_3,
    ) {
      return AtmosphericSpectrumEngine
        .synthesize(
          generationKey,
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
            components,
            1,
          ),
        );
    }

    function nebulaSpectrum() {
      const target =
        new Nebula(
          generationKey,
          galacticObjectLocator,
          location,
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
          generationKey,
          session(
            galacticObjectLocator,
          ),
          target,
        );
    }

    function remnantSpectrum() {
      const target =
        new SupernovaRemnant(
          generationKey,
          galacticObjectLocator,
          location,
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
          generationKey,
          session(
            galacticObjectLocator,
          ),
          target,
        );
    }

    function activeSpectrum(
      galaxyIndex:
        bigint,
    ) {
      const galaxy =
        GalaxyGenerator
          .generate(
            generationKey,
            galaxyIndex,
          );

      return ActiveNucleusSpectrumEngine
        .synthesize(
          generationKey,
          session(
            new GalaxyLocator(
              galaxyIndex,
            ),
          ),
          galaxy,
        );
    }

    function genericSpectrum(
      minimum:
        number,

      maximum:
        number,

      lines:
        readonly SpectralLine[] =
        [],

      level:
        ObservationInstrumentLevel =
        ObservationInstrumentLevel
          .LEVEL_3,
    ) {
      const sampleCount =
        Math.round(
          (
            maximum -
            minimum
          ) /
          0.5,
        ) +
        1;

      return SpectroscopyEngine
        .synthesize(
          generationKey,
          session(
            new SystemLocator(
              0n,
              0n,
              0n,
            ),
            level,
          ),
          new IdealizedSpectrumDefinition(
            minimum,
            maximum,
            sampleCount,
            [
              new SpectralContinuumAnchor(
                minimum,
                0.5,
              ),
              new SpectralContinuumAnchor(
                maximum,
                0.5,
              ),
            ],
            lines,
          ),
        );
    }

    function interpret(
      spectrum:
        SynthesizedSpectrum,
    ) {
      return SpectroscopicInterpretationEngine
        .interpret(
          generationKey,
          spectrum,
        );
    }

    it(
      'should classify the actual point-13.2 stellar spectrum as a stellar photospheric pattern',
      () => {
        expect(
          interpret(
            stellarSpectrum(),
          )
            .sourceClassification,
        ).toBe(
          SpectroscopicSourceClassification
            .STELLAR_PHOTOSPHERIC,
        );
      },
    );

    it(
      'should classify the actual point-13.3 atmospheric spectrum from its absorption morphology',
      () => {
        const result =
          interpret(
            atmosphereSpectrum([
              new AtmosphericSpectralComponent(
                AtmosphericSpectralAbsorber
                  .WATER_VAPOR,
                0.01,
              ),
            ]),
          );

        expect(
          result.sourceClassification,
        ).toBe(
          SpectroscopicSourceClassification
            .ATMOSPHERIC_ABSORPTION,
        );
      },
    );

    it(
      'should classify the actual point-13.4 emission-nebula spectrum as nebular emission',
      () => {
        expect(
          interpret(
            nebulaSpectrum(),
          )
            .sourceClassification,
        ).toBe(
          SpectroscopicSourceClassification
            .NEBULAR_EMISSION,
        );
      },
    );

    it(
      'should classify the actual point-13.5 supernova-remnant spectrum as shock-excited remnant emission',
      () => {
        expect(
          interpret(
            remnantSpectrum(),
          )
            .sourceClassification,
        ).toBe(
          SpectroscopicSourceClassification
            .SUPERNOVA_REMNANT_SHOCK,
        );
      },
    );

    it(
      'should classify the actual point-13.5 AGN spectrum as an active galactic nucleus',
      () => {
        expect(
          interpret(
            activeSpectrum(
              20n,
            ),
          )
            .sourceClassification,
        ).toBe(
          SpectroscopicSourceClassification
            .ACTIVE_GALACTIC_NUCLEUS,
        );
      },
    );

    it(
      'should classify the actual point-13.5 QUASAR spectrum into the same active-nucleus source family',
      () => {
        expect(
          interpret(
            activeSpectrum(
              331n,
            ),
          )
            .sourceClassification,
        ).toBe(
          SpectroscopicSourceClassification
            .ACTIVE_GALACTIC_NUCLEUS,
        );
      },
    );

    it(
      'should keep a featureless spectrum spectroscopically unclassified',
      () => {
        const result =
          interpret(
            genericSpectrum(
              410,
              690,
            ),
          );

        expect(
          result.sourceClassification,
        ).toBe(
          SpectroscopicSourceClassification
            .UNCLASSIFIED,
        );

        expect(
          result.isSourceClassified,
        ).toBe(false);
      },
    );

    it(
      'should mark simultaneous O2 and CH4 atmospheric absorption as a biosignature candidate only',
      () => {
        const result =
          interpret(
            atmosphereSpectrum([
              new AtmosphericSpectralComponent(
                AtmosphericSpectralAbsorber
                  .MOLECULAR_OXYGEN,
                0.21,
              ),
              new AtmosphericSpectralComponent(
                AtmosphericSpectralAbsorber
                  .METHANE,
                0.01,
              ),
            ]),
          );

        expect(
          result.biosignatureStatus,
        ).toBe(
          SpectroscopicCandidateStatus
            .CANDIDATE,
        );

        expect(
          result.indicators,
        ).toContain(
          SpectroscopicEvidenceIndicator
            .OXYGEN_METHANE_DISEQUILIBRIUM_CANDIDATE,
        );
      },
    );

    it(
      'should not treat O2 alone as a biosignature candidate',
      () => {
        const result =
          interpret(
            atmosphereSpectrum([
              new AtmosphericSpectralComponent(
                AtmosphericSpectralAbsorber
                  .MOLECULAR_OXYGEN,
                0.21,
              ),
            ]),
          );

        expect(
          result.biosignatureStatus,
        ).toBe(
          SpectroscopicCandidateStatus
            .NONE,
        );
      },
    );

    it(
      'should not treat CH4 alone as a biosignature candidate',
      () => {
        const result =
          interpret(
            atmosphereSpectrum([
              new AtmosphericSpectralComponent(
                AtmosphericSpectralAbsorber
                  .METHANE,
                0.01,
              ),
            ]),
          );

        expect(
          result.biosignatureStatus,
        ).toBe(
          SpectroscopicCandidateStatus
            .NONE,
        );
      },
    );

    it(
      'should never infer a biosignature candidate from a non-atmospheric spectral family',
      () => {
        for (
          const spectrum
          of [
            stellarSpectrum(),
            nebulaSpectrum(),
            remnantSpectrum(),
            activeSpectrum(
              20n,
            ),
          ]
        ) {
          expect(
            interpret(
              spectrum,
            )
              .biosignatureStatus,
          ).toBe(
            SpectroscopicCandidateStatus
              .NONE,
          );
        }
      },
    );

    it(
      'should mark a sufficiently narrow isolated unknown optical emission line as a technosignature candidate',
      () => {
        const result =
          interpret(
            genericSpectrum(
              400,
              700,
              [
                new SpectralLine(
                  'UNKNOWN_NARROW_532',
                  SpectralFeatureKind
                    .EMISSION,
                  532,
                  0.5,
                  0.18,
                ),
              ],
            ),
          );

        expect(
          result.technosignatureStatus,
        ).toBe(
          SpectroscopicCandidateStatus
            .CANDIDATE,
        );

        expect(
          result.indicators,
        ).toContain(
          SpectroscopicEvidenceIndicator
            .NARROW_ISOLATED_OPTICAL_EMISSION_ANOMALY,
        );
      },
    );

    it(
      'should not flag the known natural H-alpha position as a technosignature candidate',
      () => {
        const result =
          interpret(
            genericSpectrum(
              400,
              700,
              [
                new SpectralLine(
                  'NATURAL_H_ALPHA',
                  SpectralFeatureKind
                    .EMISSION,
                  656.3,
                  0.6,
                  0.18,
                ),
              ],
            ),
          );

        expect(
          result.technosignatureStatus,
        ).toBe(
          SpectroscopicCandidateStatus
            .NONE,
        );
      },
    );

    it(
      'should not flag a broad unknown optical emission feature as a technosignature candidate',
      () => {
        const result =
          interpret(
            genericSpectrum(
              400,
              700,
              [
                new SpectralLine(
                  'UNKNOWN_BROAD_532',
                  SpectralFeatureKind
                    .EMISSION,
                  532,
                  0.5,
                  5,
                ),
              ],
            ),
          );

        expect(
          result.technosignatureStatus,
        ).toBe(
          SpectroscopicCandidateStatus
            .NONE,
        );
      },
    );

    it(
      'should not misclassify the actual narrow natural nebular lines as a technosignature',
      () => {
        expect(
          interpret(
            nebulaSpectrum(),
          )
            .technosignatureStatus,
        ).toBe(
          SpectroscopicCandidateStatus
            .NONE,
        );
      },
    );

    it(
      'should not misclassify the actual supernova-remnant shock lines as a technosignature',
      () => {
        expect(
          interpret(
            remnantSpectrum(),
          )
            .technosignatureStatus,
        ).toBe(
          SpectroscopicCandidateStatus
            .NONE,
        );
      },
    );

    it(
      'should not misclassify the broad active-nucleus emission template as a technosignature',
      () => {
        expect(
          interpret(
            activeSpectrum(
              331n,
            ),
          )
            .technosignatureStatus,
        ).toBe(
          SpectroscopicCandidateStatus
            .NONE,
        );
      },
    );

    it(
      'should be exactly deterministic for the same synthesized spectrum',
      () => {
        const spectrum =
          atmosphereSpectrum([
            new AtmosphericSpectralComponent(
              AtmosphericSpectralAbsorber
                .MOLECULAR_OXYGEN,
              0.21,
            ),
            new AtmosphericSpectralComponent(
              AtmosphericSpectralAbsorber
                .METHANE,
              0.01,
            ),
          ]);

        expect(
          interpret(
            spectrum,
          ),
        ).toEqual(
          interpret(
            spectrum,
          ),
        );
      },
    );

    it(
      'should remain level-independent while point 13.7 has not degraded the idealized spectra',
      () => {
        const level1 =
          interpret(
            stellarSpectrum(
              ObservationInstrumentLevel
                .LEVEL_1,
            ),
          );

        const level5 =
          interpret(
            stellarSpectrum(
              ObservationInstrumentLevel
                .LEVEL_5,
            ),
          );

        expect(
          level1,
        ).toEqual(
          level5,
        );
      },
    );

    it(
      'should reject a generation key that differs from the spectrum observation session',
      () => {
        const otherKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '1111-2222-3333-4444-5555-6666-7777-8888',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            SpectroscopicInterpretationEngine
              .interpret(
                otherKey,
                stellarSpectrum(),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a spectrum whose embedded session was not acquired with spectroscopy',
      () => {
        const opticalSession =
          session(
            new SystemLocator(
              0n,
              0n,
              0n,
            ),
            ObservationInstrumentLevel
              .LEVEL_3,
            ObservationInstrumentType
              .OPTICAL,
          );

        const invalidSpectrum =
          new SynthesizedSpectrum(
            opticalSession,
            400,
            700,
            genericSpectrum(
              400,
              700,
            )
              .samples,
          );

        expect(
          () =>
            SpectroscopicInterpretationEngine
              .interpret(
                generationKey,
                invalidSpectrum,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject unsupported generator versions explicitly',
      () => {
        const unsupported =
          new UniverseGenerationKey(
            generationKey
              .universeSeed,
            {
              code:
                999,
            } as unknown as GeneratorVersion,
          );

        const unsupportedSession =
          session(
            new SystemLocator(
              0n,
              0n,
              0n,
            ),
            ObservationInstrumentLevel
              .LEVEL_3,
            ObservationInstrumentType
              .SPECTROSCOPY,
            unsupported,
          );

        const source =
          genericSpectrum(
            400,
            700,
          );

        const unsupportedSpectrum =
          new SynthesizedSpectrum(
            unsupportedSession,
            source
              .minimumWavelengthNanometers,
            source
              .maximumWavelengthNanometers,
            source.samples,
          );

        expect(
          () =>
            SpectroscopicInterpretationEngine
              .interpret(
                unsupported,
                unsupportedSpectrum,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should return interpretation only and never expose the input spectrum, numeric probability or Ground Truth',
      () => {
        const result =
          interpret(
            atmosphereSpectrum([
              new AtmosphericSpectralComponent(
                AtmosphericSpectralAbsorber
                  .MOLECULAR_OXYGEN,
                0.21,
              ),
              new AtmosphericSpectralComponent(
                AtmosphericSpectralAbsorber
                  .METHANE,
                0.01,
              ),
            ]),
          );

        for (
          const forbiddenProperty
          of [
            'spectrum',
            'samples',
            'probability',
            'confidence',
            'evidenceScore',
            'groundTruth',
            'classification',
            'certainty',
            'discoveryState',
          ]
        ) {
          expect(
            Object.prototype
              .hasOwnProperty
              .call(
                result,
                forbiddenProperty,
              ),
          ).toBe(false);
        }
      },
    );

    it(
      'should derive candidates from spectral shape rather than from locator type',
      () => {
        const synthetic =
          genericSpectrum(
            400,
            700,
            [
              new SpectralLine(
                'UNKNOWN_NARROW_532',
                SpectralFeatureKind
                  .EMISSION,
                532,
                0.5,
                0.18,
              ),
            ],
          );

        expect(
          synthetic
            .observationSession
            .targetLocator,
        ).toBeInstanceOf(
          SystemLocator,
        );

        expect(
          interpret(
            synthetic,
          )
            .technosignatureStatus,
        ).toBe(
          SpectroscopicCandidateStatus
            .CANDIDATE,
        );
      },
    );
  },
);
