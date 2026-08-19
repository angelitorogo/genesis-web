import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  HiiRegionPhysicalProperties,
} from '../../domain/galactic-object/hii-region-physical-properties';

import {
  HiiRegion,
} from '../../domain/galactic-object/hii-region';

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
  StarFormationActivity,
} from '../../domain/galactic-object/star-formation-activity';

import {
  StarFormationProfile,
} from '../../domain/galactic-object/star-formation-profile';

import {
  GalacticObjectLocator,
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
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ObservationInstrumentCapabilityCatalogV1,
} from '../observation/observation-instrument-capability-catalog';

import {
  ObservationInstrumentCatalogV1,
} from '../observation/observation-instrument-catalog';

import {
  NebularEmissionSpectrumEngine,
} from './nebular-emission-spectrum-engine';

describe(
  'NebularEmissionSpectrumEngine point 13.4',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const locator =
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

    function physicalProperties(
      ionizationFraction =
        0.85,

      gasTemperatureKelvin =
        9_500,

      hydrogenNumberDensityPerCm3 =
        300,
    ): NebulaPhysicalProperties {

      return new NebulaPhysicalProperties(
        20,
        2_500,
        gasTemperatureKelvin,
        hydrogenNumberDensityPerCm3,
        ionizationFraction,
        0.012,
      );
    }

    function nebula(
      nebulaType:
        typeof NebulaType[
          keyof typeof NebulaType
        ],

      ionizationFraction =
        0.85,

      gasTemperatureKelvin =
        9_500,

      hydrogenNumberDensityPerCm3 =
        300,

      key:
        UniverseGenerationKey =
        generationKey,

      targetLocator:
        GalacticObjectLocator =
        locator,
    ): Nebula {

      return new Nebula(
        key,
        targetLocator,
        location,
        nebulaType,
        physicalProperties(
          ionizationFraction,
          gasTemperatureKelvin,
          hydrogenNumberDensityPerCm3,
        ),
      );
    }

    function hiiRegion(
      electronTemperatureKelvin:
        number,

      electronDensityPerCm3:
        number,

      ionizationFraction =
        0.92,
    ): HiiRegion {

      return new HiiRegion(
        generationKey,
        locator,
        location,
        physicalProperties(
          ionizationFraction,
          9_000,
          250,
        ),
        new HiiRegionPhysicalProperties(
          8,
          electronTemperatureKelvin,
          electronDensityPerCm3,
        ),
        new StarFormationProfile(
          StarFormationActivity
            .MODERATE,
          2_500,
          2.1,
          18,
          8e49,
        ),
      );
    }

    function session(
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

      target:
        GalacticObjectLocator |
        SystemLocator =
        locator,
    ): LeveledInstrumentObservationSession {

      const observatory =
        new Observatory(
          key,
        );

      const baseSession =
        new ObservationSession(
          observatory,
          target,
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

    function spectrum(
      targetNebula:
        Nebula,

      level:
        ObservationInstrumentLevel =
        ObservationInstrumentLevel
          .LEVEL_3,
    ) {

      return NebularEmissionSpectrumEngine
        .synthesize(
          generationKey,
          session(
            level,
          ),
          targetNebula,
        );
    }

    function nearestFlux(
      synthesized:
        ReturnType<
          typeof spectrum
        >,

      wavelengthNanometers:
        number,
    ): number {

      let nearest =
        synthesized
          .samples[
            0
          ];

      let nearestDistance =
        Math.abs(
          nearest
            .wavelengthNanometers -
          wavelengthNanometers,
        );

      for (
        const sample
        of synthesized
          .samples
      ) {
        const distance =
          Math.abs(
            sample
              .wavelengthNanometers -
            wavelengthNanometers,
          );

        if (
          distance <
          nearestDistance
        ) {
          nearest =
            sample;

          nearestDistance =
            distance;
        }
      }

      return nearest
        .normalizedFlux;
    }

    it(
      'should synthesize the frozen V1 optical nebular-emission sampling contract',
      () => {
        const result =
          spectrum(
            nebula(
              NebulaType.EMISSION,
            ),
          );

        expect(
          result.sampleCount,
        ).toBe(
          2_501,
        );

        expect(
          result
            .minimumWavelengthNanometers,
        ).toBe(
          450,
        );

        expect(
          result
            .maximumWavelengthNanometers,
        ).toBe(
          700,
        );
      },
    );

    it(
      'should reproduce exactly the same nebular spectrum for the same Ground Truth',
      () => {
        const target =
          nebula(
            NebulaType.EMISSION,
          );

        expect(
          spectrum(
            target,
          )
            .samples,
        ).toEqual(
          spectrum(
            target,
          )
            .samples,
        );
      },
    );

    it(
      'should keep a reflection nebula continuum-only in the point-13.4 emission model',
      () => {
        const result =
          spectrum(
            nebula(
              NebulaType.REFLECTION,
              0.05,
              100,
              500,
            ),
          );

        expect(
          result
            .samples
            .every(
              sample =>
                sample
                  .normalizedFlux ===
                0.03,
            ),
        ).toBe(true);
      },
    );

    it(
      'should keep a dark nebula continuum-only in the point-13.4 emission model',
      () => {
        const result =
          spectrum(
            nebula(
              NebulaType.DARK,
              0.01,
              30,
              2_000,
            ),
          );

        expect(
          result
            .samples
            .every(
              sample =>
                sample
                  .normalizedFlux ===
                0.03,
            ),
        ).toBe(true);
      },
    );

    it(
      'should produce a clear H-alpha emission peak for an emission nebula',
      () => {
        const result =
          spectrum(
            nebula(
              NebulaType.EMISSION,
            ),
          );

        expect(
          nearestFlux(
            result,
            656.3,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            result,
            640,
          ),
        );
      },
    );

    it(
      'should produce a clear O-III 500.7 nm peak for a planetary nebula',
      () => {
        const result =
          spectrum(
            nebula(
              NebulaType.PLANETARY,
              0.92,
              10_000,
              1_000,
            ),
          );

        expect(
          nearestFlux(
            result,
            500.7,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            result,
            510,
          ),
        );
      },
    );

    it(
      'should keep H-alpha stronger than H-beta in the simplified V1 recombination pattern',
      () => {
        const result =
          spectrum(
            nebula(
              NebulaType.EMISSION,
            ),
          );

        expect(
          nearestFlux(
            result,
            656.3,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            result,
            486.1,
          ),
        );
      },
    );

    it(
      'should keep the simplified O-III 500.7 line stronger than its 495.9 companion',
      () => {
        const result =
          spectrum(
            nebula(
              NebulaType.PLANETARY,
              0.95,
              10_000,
              500,
            ),
          );

        expect(
          nearestFlux(
            result,
            500.7,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            result,
            495.9,
          ),
        );
      },
    );

    it(
      'should keep the simplified N-II 658.4 line stronger than its 654.8 companion',
      () => {
        const result =
          spectrum(
            nebula(
              NebulaType.PLANETARY,
              0.70,
              9_500,
              500,
            ),
          );

        expect(
          nearestFlux(
            result,
            658.4,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            result,
            654.8,
          ),
        );
      },
    );

    it(
      'should strengthen O-III when the existing Ground Truth is more highly ionized',
      () => {
        const weaklyIonized =
          spectrum(
            nebula(
              NebulaType.EMISSION,
              0.30,
              10_000,
              300,
            ),
          );

        const stronglyIonized =
          spectrum(
            nebula(
              NebulaType.EMISSION,
              0.95,
              10_000,
              300,
            ),
          );

        expect(
          nearestFlux(
            stronglyIonized,
            500.7,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            weaklyIonized,
            500.7,
          ),
        );
      },
    );

    it(
      'should strengthen low-ionization N-II for a less ionized Ground Truth profile',
      () => {
        const weaklyIonized =
          spectrum(
            nebula(
              NebulaType.EMISSION,
              0.35,
              9_500,
              300,
            ),
          );

        const stronglyIonized =
          spectrum(
            nebula(
              NebulaType.EMISSION,
              0.95,
              9_500,
              300,
            ),
          );

        expect(
          nearestFlux(
            weaklyIonized,
            658.4,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            stronglyIonized,
            658.4,
          ),
        );
      },
    );

    it(
      'should use H-II electron temperature to modulate the O-III response',
      () => {
        const cooler =
          spectrum(
            hiiRegion(
              7_000,
              400,
            ),
          );

        const nearPeak =
          spectrum(
            hiiRegion(
              10_000,
              400,
            ),
          );

        expect(
          nearestFlux(
            nearPeak,
            500.7,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            cooler,
            500.7,
          ),
        );
      },
    );

    it(
      'should make the simplified S-II doublet density-sensitive for H-II regions',
      () => {
        const lowDensity =
          spectrum(
            hiiRegion(
              9_500,
              10,
              0.70,
            ),
          );

        const highDensity =
          spectrum(
            hiiRegion(
              9_500,
              10_000,
              0.70,
            ),
          );

        expect(
          nearestFlux(
            lowDensity,
            671.7,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            lowDensity,
            673.1,
          ),
        );

        expect(
          nearestFlux(
            highDensity,
            673.1,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            highDensity,
            671.7,
          ),
        );
      },
    );

    it(
      'should keep every synthesized nebular sample finite, normalized and strictly wavelength-ordered',
      () => {
        const result =
          spectrum(
            nebula(
              NebulaType.PLANETARY,
              0.9,
              11_000,
              1_500,
            ),
          );

        for (
          let index =
            0;
          index <
            result
              .samples
              .length;
          index +=
            1
        ) {
          const sample =
            result
              .samples[
                index
              ];

          expect(
            Number.isFinite(
              sample
                .wavelengthNanometers,
            ),
          ).toBe(true);

          expect(
            Number.isFinite(
              sample
                .normalizedFlux,
            ),
          ).toBe(true);

          expect(
            sample
              .normalizedFlux,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            sample
              .normalizedFlux,
          ).toBeLessThanOrEqual(
            1,
          );

          if (
            index >
            0
          ) {
            expect(
              sample
                .wavelengthNanometers,
            ).toBeGreaterThan(
              result
                .samples[
                  index -
                  1
                ]
                .wavelengthNanometers,
            );
          }
        }
      },
    );

    it(
      'should remain level-independent until point 13.7 applies instrument-dependent uncertainty',
      () => {
        const target =
          nebula(
            NebulaType.EMISSION,
          );

        const level1 =
          spectrum(
            target,
            ObservationInstrumentLevel
              .LEVEL_1,
          );

        const level5 =
          spectrum(
            target,
            ObservationInstrumentLevel
              .LEVEL_5,
          );

        expect(
          level1.samples,
        ).toEqual(
          level5.samples,
        );
      },
    );

    it(
      'should reject a non-GalacticObjectLocator observation target',
      () => {
        const target =
          nebula(
            NebulaType.EMISSION,
          );

        expect(
          () =>
            NebularEmissionSpectrumEngine
              .synthesize(
                generationKey,
                session(
                  ObservationInstrumentLevel
                    .LEVEL_3,
                  ObservationInstrumentType
                    .SPECTROSCOPY,
                  generationKey,
                  new SystemLocator(
                    0n,
                    0n,
                    0n,
                  ),
                ),
                target,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a different GalacticObjectLocator than the supplied nebula identity',
      () => {
        const target =
          nebula(
            NebulaType.EMISSION,
          );

        expect(
          () =>
            NebularEmissionSpectrumEngine
              .synthesize(
                generationKey,
                session(
                  ObservationInstrumentLevel
                    .LEVEL_3,
                  ObservationInstrumentType
                    .SPECTROSCOPY,
                  generationKey,
                  new GalacticObjectLocator(
                    0n,
                    0n,
                    1n,
                  ),
                ),
                target,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should preserve point-13.1 spectroscopy-only instrument enforcement',
      () => {
        expect(
          () =>
            NebularEmissionSpectrumEngine
              .synthesize(
                generationKey,
                session(
                  ObservationInstrumentLevel
                    .LEVEL_3,
                  ObservationInstrumentType
                    .OPTICAL,
                ),
                nebula(
                  NebulaType.EMISSION,
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a generation key that differs from the observation session',
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
            NebularEmissionSpectrumEngine
              .synthesize(
                otherKey,
                session(),
                nebula(
                  NebulaType.EMISSION,
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a generation key that differs from the supplied nebula Ground Truth',
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
            NebularEmissionSpectrumEngine
              .synthesize(
                generationKey,
                session(),
                nebula(
                  NebulaType.EMISSION,
                  0.85,
                  9_500,
                  300,
                  otherKey,
                ),
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

        const unsupportedNebula =
          new Nebula(
            unsupported,
            locator,
            location,
            NebulaType.EMISSION,
            physicalProperties(),
          );

        expect(
          () =>
            NebularEmissionSpectrumEngine
              .synthesize(
                unsupported,
                session(
                  ObservationInstrumentLevel
                    .LEVEL_3,
                  ObservationInstrumentType
                    .SPECTROSCOPY,
                  unsupported,
                ),
                unsupportedNebula,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should not expose the nebula subtype, physical properties or source emission-line catalogue through the synthesized result',
      () => {
        const result =
          spectrum(
            nebula(
              NebulaType.PLANETARY,
            ),
          );

        for (
          const forbiddenProperty
          of [
            'nebulaType',
            'physicalProperties',
            'hiiPhysicalProperties',
            'starFormationProfile',
            'lines',
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

        expect(
          result
            .samples
            .every(
              sample =>
                Object.keys(
                  sample,
                )
                  .sort()
                  .join(
                    ',',
                  ) ===
                'normalizedFlux,wavelengthNanometers',
            ),
        ).toBe(true);
      },
    );
  },
);
