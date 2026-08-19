import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

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
  SupernovaRemnantSpectrumEngine,
} from './supernova-remnant-spectrum-engine';

describe(
  'SupernovaRemnantSpectrumEngine point 13.5',
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

    function remnant(
      expansionVelocityKmPerSecond =
        590,

      shockTemperatureKelvin =
        4_700_000,

      ambientHydrogenNumberDensityPerCm3 =
        0.8,

      morphology:
        SupernovaRemnantMorphology =
        SupernovaRemnantMorphology
          .SHELL,

      key:
        UniverseGenerationKey =
        generationKey,

      targetLocator:
        GalacticObjectLocator =
        locator,
    ): SupernovaRemnant {

      return new SupernovaRemnant(
        key,
        targetLocator,
        location,
        morphology,
        new SupernovaRemnantPhysicalProperties(
          12_000,
          18,
          expansionVelocityKmPerSecond,
          shockTemperatureKelvin,
          1e51,
          ambientHydrogenNumberDensityPerCm3,
          6.5,
          676,
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
      targetRemnant:
        SupernovaRemnant,

      level:
        ObservationInstrumentLevel =
        ObservationInstrumentLevel
          .LEVEL_3,
    ) {

      return SupernovaRemnantSpectrumEngine
        .synthesize(
          generationKey,
          session(
            level,
          ),
          targetRemnant,
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
      'should synthesize the frozen V1 optical supernova-remnant shock sampling contract',
      () => {
        const result =
          spectrum(
            remnant(),
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
      'should reproduce exactly the same supernova-remnant spectrum for the same Ground Truth',
      () => {
        const target =
          remnant();

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
      'should produce a clear H-alpha shock emission peak',
      () => {
        const result =
          spectrum(
            remnant(),
          );

        expect(
          nearestFlux(
            result,
            656.3,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            result,
            645,
          ),
        );
      },
    );

    it(
      'should produce a clear S-II shock-emission doublet',
      () => {
        const result =
          spectrum(
            remnant(),
          );

        expect(
          nearestFlux(
            result,
            671.7,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            result,
            665,
          ),
        );

        expect(
          nearestFlux(
            result,
            673.1,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            result,
            680,
          ),
        );
      },
    );

    it(
      'should produce a clear O-III 500.7 nm shock emission peak for a sufficiently energetic shock',
      () => {
        const result =
          spectrum(
            remnant(
              700,
              6_000_000,
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
      'should strengthen O-III as the existing shock Ground Truth becomes faster and hotter',
      () => {
        const slow =
          spectrum(
            remnant(
              70,
              70_000,
            ),
          );

        const fast =
          spectrum(
            remnant(
              700,
              6_000_000,
            ),
          );

        expect(
          nearestFlux(
            fast,
            500.7,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            slow,
            500.7,
          ),
        );
      },
    );

    it(
      'should broaden shock lines as expansion velocity increases',
      () => {
        const slow =
          spectrum(
            remnant(
              100,
              140_000,
            ),
          );

        const fast =
          spectrum(
            remnant(
              3_000,
              10_000_000,
            ),
          );

        expect(
          nearestFlux(
            fast,
            488.1,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            slow,
            488.1,
          ),
        );
      },
    );

    it(
      'should strengthen the simplified sulfur response in a denser ambient medium',
      () => {
        const sparse =
          spectrum(
            remnant(
              500,
              3_500_000,
              0.005,
            ),
          );

        const dense =
          spectrum(
            remnant(
              500,
              3_500_000,
              10,
            ),
          );

        expect(
          nearestFlux(
            dense,
            671.7,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            sparse,
            671.7,
          ),
        );
      },
    );

    it(
      'should accept every already-existing point-12.6 remnant morphology without inventing a new extreme-object class',
      () => {
        for (
          const morphology
          of Object.values(
            SupernovaRemnantMorphology,
          )
        ) {
          expect(
            () =>
              spectrum(
                remnant(
                  590,
                  4_700_000,
                  0.8,
                  morphology,
                ),
              ),
          ).not.toThrow();
        }
      },
    );

    it(
      'should keep every synthesized remnant sample finite, normalized and strictly wavelength-ordered',
      () => {
        const result =
          spectrum(
            remnant(
              1_500,
              8_000_000,
              2,
              SupernovaRemnantMorphology
                .COMPOSITE,
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
          remnant();

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
      'should reject a non-GalacticObjectLocator target',
      () => {
        expect(
          () =>
            SupernovaRemnantSpectrumEngine
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
                remnant(),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a GalacticObjectLocator that differs from the supplied remnant identity',
      () => {
        expect(
          () =>
            SupernovaRemnantSpectrumEngine
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
                remnant(),
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
            SupernovaRemnantSpectrumEngine
              .synthesize(
                generationKey,
                session(
                  ObservationInstrumentLevel
                    .LEVEL_3,
                  ObservationInstrumentType
                    .OPTICAL,
                ),
                remnant(),
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
            SupernovaRemnantSpectrumEngine
              .synthesize(
                otherKey,
                session(),
                remnant(),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a generation key that differs from the supplied remnant Ground Truth',
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
            SupernovaRemnantSpectrumEngine
              .synthesize(
                generationKey,
                session(),
                remnant(
                  590,
                  4_700_000,
                  0.8,
                  SupernovaRemnantMorphology
                    .SHELL,
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

        const unsupportedRemnant =
          new SupernovaRemnant(
            unsupported,
            locator,
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

        expect(
          () =>
            SupernovaRemnantSpectrumEngine
              .synthesize(
                unsupported,
                session(
                  ObservationInstrumentLevel
                    .LEVEL_3,
                  ObservationInstrumentType
                    .SPECTROSCOPY,
                  unsupported,
                ),
                unsupportedRemnant,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should not expose remnant physical Ground Truth, morphology or the internal shock-line catalogue through the synthesized result',
      () => {
        const result =
          spectrum(
            remnant(),
          );

        for (
          const forbiddenProperty
          of [
            'morphology',
            'physicalProperties',
            'expansionVelocityKmPerSecond',
            'shockTemperatureKelvin',
            'ambientHydrogenNumberDensityPerCm3',
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
