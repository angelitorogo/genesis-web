import {
  BodyLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  BodySeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  type AtmosphereGreenhouseEffect,
} from '../../domain/planetary/atmosphere-greenhouse-effect';

import {
  AtmosphereGreenhouseRegime,
} from '../../domain/planetary/atmosphere-greenhouse-regime';

import {
  AtmospherePressureRegime,
} from '../../domain/planetary/atmosphere-pressure-regime';

import {
  AtmosphereRetentionRegime,
} from '../../domain/planetary/atmosphere-retention-regime';

import {
  type AtmosphereRetentionState,
} from '../../domain/planetary/atmosphere-retention-state';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  type PlanetClimateState,
} from '../../domain/planetary/planet-climate-state';

import {
  PlanetClimateStabilityRegime,
} from '../../domain/planetary/planet-climate-stability-regime';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ClimateVariabilityEngine,
} from './climate-variability-engine';

describe(
  'ClimateVariabilityEngine point 20.6',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should produce bounded seasons/extremes and a stable Earth-like climate baseline',
      () => {
        const fixture =
          climateFixture({
            eccentricity:
              0.0167,
            axialTiltDegrees:
              23.4,
            rotationPeriodHours:
              23.93,
            dayLengthHours:
              24,
            retainedSurfacePressurePascal:
              101_325,
            longwaveTrappingFraction01:
              0.55,
            meanSurfaceTemperatureKelvin:
              288,
          });

        const variability =
          ClimateVariabilityEngine
            .generate(
              generationKey,
              fixture.planet,
              fixture.retention,
              fixture.greenhouse,
              fixture.climate,
            );

        expect(
          variability.heatRedistributionEfficiency01,
        ).toBeGreaterThan(0.5);

        expect(
          variability.seasonalTemperatureAmplitudeKelvin!,
        ).toBeGreaterThan(0);

        expect(
          288,
        ).toBeGreaterThan(
          variability.minimumSurfaceTemperatureKelvin!,
        );

        expect(
          variability.maximumSurfaceTemperatureKelvin!,
        ).toBeGreaterThan(288);

        expect(
          variability.stabilityRegime,
        ).toBe(
          PlanetClimateStabilityRegime.STABLE,
        );
      },
    );

    it(
      'should give an airless synchronous world weaker redistribution and stronger thermal contrast',
      () => {
        const buffered =
          climateFixture({
            eccentricity:
              0,
            axialTiltDegrees:
              0,
            rotationPeriodHours:
              24,
            dayLengthHours:
              24,
            retainedSurfacePressurePascal:
              101_325,
            longwaveTrappingFraction01:
              0.5,
            meanSurfaceTemperatureKelvin:
              280,
          });

        const airlessSynchronous =
          climateFixture({
            eccentricity:
              0,
            axialTiltDegrees:
              0,
            rotationPeriodHours:
              240,
            dayLengthHours:
              null,
            retainedSurfacePressurePascal:
              0,
            longwaveTrappingFraction01:
              0,
            meanSurfaceTemperatureKelvin:
              280,
          });

        const bufferedState =
          ClimateVariabilityEngine
            .generate(
              generationKey,
              buffered.planet,
              buffered.retention,
              buffered.greenhouse,
              buffered.climate,
            );

        const airlessState =
          ClimateVariabilityEngine
            .generate(
              generationKey,
              airlessSynchronous.planet,
              airlessSynchronous.retention,
              airlessSynchronous.greenhouse,
              airlessSynchronous.climate,
            );

        expect(
          airlessState.heatRedistributionEfficiency01,
        ).toBe(0);

        expect(
          airlessState.diurnalTemperatureRangeKelvin!,
        ).toBeGreaterThan(
          bufferedState.diurnalTemperatureRangeKelvin!,
        );

        expect(
          bufferedState.stabilityIndex01!,
        ).toBeGreaterThan(
          airlessState.stabilityIndex01!,
        );
      },
    );

    it(
      'should classify high-eccentricity high-obliquity airless climates as extreme',
      () => {
        const fixture =
          climateFixture({
            eccentricity:
              0.55,
            axialTiltDegrees:
              88,
            rotationPeriodHours:
              100,
            dayLengthHours:
              160,
            retainedSurfacePressurePascal:
              0,
            longwaveTrappingFraction01:
              0,
            meanSurfaceTemperatureKelvin:
              260,
          });

        const variability =
          ClimateVariabilityEngine
            .generate(
              generationKey,
              fixture.planet,
              fixture.retention,
              fixture.greenhouse,
              fixture.climate,
            );

        expect(
          variability.stabilityRegime,
        ).toBe(
          PlanetClimateStabilityRegime.EXTREME,
        );

        expect(
          variability.approximateSurfaceTemperatureRangeKelvin!,
        ).toBeGreaterThan(
          260,
        );
      },
    );

    it(
      'should preserve deep-envelope semantics without inventing solid-surface extrema',
      () => {
        const fixture =
          climateFixture({
            eccentricity:
              0.08,
            axialTiltDegrees:
              12,
            rotationPeriodHours:
              10,
            dayLengthHours:
              10.1,
            retainedSurfacePressurePascal:
              null,
            longwaveTrappingFraction01:
              0.8,
            meanSurfaceTemperatureKelvin:
              null,
          });

        const variability =
          ClimateVariabilityEngine
            .generate(
              generationKey,
              fixture.planet,
              fixture.retention,
              fixture.greenhouse,
              fixture.climate,
            );

        expect(
          variability.stabilityRegime,
        ).toBe(
          PlanetClimateStabilityRegime.DEEP_ENVELOPE,
        );

        expect(
          variability.minimumSurfaceTemperatureKelvin,
        ).toBeNull();

        expect(
          variability.maximumSurfaceTemperatureKelvin,
        ).toBeNull();

        expect(
          variability.stabilityIndex01,
        ).toBeNull();
      },
    );

    it(
      'should be deterministic, freeze generateAll and reject cross-identity handoffs',
      () => {
        const firstFixture =
          climateFixture({});

        const secondFixture =
          climateFixture(
            {
              eccentricity:
                0.12,
              axialTiltDegrees:
                35,
            },
            2,
          );

        const system =
          firstFixture.system;

        const planets = [
          firstFixture.planet,
          {
            ...secondFixture.planet,
            hostPlanetarySystem:
              system,
          } as Planet,
        ];

        const retentions = [
          firstFixture.retention,
          secondFixture.retention,
        ];

        const greenhouseEffects = [
          firstFixture.greenhouse,
          secondFixture.greenhouse,
        ];

        const climates = [
          firstFixture.climate,
          secondFixture.climate,
        ];

        const systemWithTwo = {
          ...system,
          planetCount:
            2,
        } as PlanetarySystem;

        (planets[0] as unknown as {
          hostPlanetarySystem:
            PlanetarySystem;
        }).hostPlanetarySystem =
          systemWithTwo;

        (planets[1] as unknown as {
          hostPlanetarySystem:
            PlanetarySystem;
        }).hostPlanetarySystem =
          systemWithTwo;

        const first =
          ClimateVariabilityEngine
            .generateAll(
              generationKey,
              systemWithTwo,
              planets,
              retentions,
              greenhouseEffects,
              climates,
            );

        const second =
          ClimateVariabilityEngine
            .generateAll(
              generationKey,
              systemWithTwo,
              planets,
              retentions,
              greenhouseEffects,
              climates,
            );

        expect(
          first,
        ).toEqual(
          second,
        );

        expect(
          Object.isFrozen(
            first,
          ),
        ).toBe(true);

        expect(
          () =>
            ClimateVariabilityEngine
              .generate(
                generationKey,
                planets[0],
                {
                  ...retentions[0],
                  planetOrdinal:
                    2,
                } as AtmosphereRetentionState,
                greenhouseEffects[0],
                climates[0],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function climateFixture(
      overrides: {
        readonly eccentricity?:
          number;
        readonly axialTiltDegrees?:
          number;
        readonly rotationPeriodHours?:
          number;
        readonly dayLengthHours?:
          number | null;
        readonly retainedSurfacePressurePascal?:
          number | null;
        readonly longwaveTrappingFraction01?:
          number;
        readonly meanSurfaceTemperatureKelvin?:
          number | null;
      },

      planetOrdinal:
        number = 1,
    ): {
      readonly system:
        PlanetarySystem;
      readonly planet:
        Planet;
      readonly retention:
        AtmosphereRetentionState;
      readonly greenhouse:
        AtmosphereGreenhouseEffect;
      readonly climate:
        PlanetClimateState;
    } {
      const systemLocator =
        new SystemLocator(
          2n,
          -5n,
          15n,
        );

      const system = {
        generationKey,
        locator:
          systemLocator,
        planetCount:
          1,
      } as PlanetarySystem;

      const locator =
        new BodyLocator(
          systemLocator.galaxyIndex,
          systemLocator.sectorKey,
          systemLocator.galacticObjectIndex,
          BigInt(
            planetOrdinal -
              1,
          ),
        );

      const seed =
        new BodySeed(
          planetOrdinal
            .toString(16)
            .toUpperCase()
            .repeat(32)
            .slice(0, 32),
        );

      const meanSurfaceTemperatureKelvin =
        overrides.meanSurfaceTemperatureKelvin ===
          undefined
          ? 288
          : overrides.meanSurfaceTemperatureKelvin;

      const retainedSurfacePressurePascal =
        overrides.retainedSurfacePressurePascal ===
          undefined
          ? 101_325
          : overrides.retainedSurfacePressurePascal;

      const longwaveTrappingFraction01 =
        overrides.longwaveTrappingFraction01 ??
        0.5;

      const planet = {
        generationKey,
        hostPlanetarySystem:
          system,
        planetOrdinal,
        locator,
        seed,
        isTypePhysicallyCoherent:
          true,
        orbit: {
          eccentricity:
            overrides.eccentricity ??
            0.02,
        },
        axialTiltDegrees:
          overrides.axialTiltDegrees ??
          23,
        rotationPeriodHours:
          overrides.rotationPeriodHours ??
          24,
        dayLengthHours:
          overrides.dayLengthHours ===
            undefined
            ? 24
            : overrides.dayLengthHours,
      } as unknown as Planet;

      const deepEnvelope =
        retainedSurfacePressurePascal ===
        null;

      const retention = {
        planetOrdinal,
        bodyLocator:
          locator,
        bodySeed:
          seed,
        retentionRegime:
          deepEnvelope
            ? AtmosphereRetentionRegime.DEEP_ENVELOPE
            : AtmosphereRetentionRegime.WELL_RETAINED,
        retainedPressureRegime:
          deepEnvelope
            ? AtmospherePressureRegime.DEEP_ENVELOPE
            : retainedSurfacePressurePascal ===
                0
              ? AtmospherePressureRegime.VACUUM
              : AtmospherePressureRegime.MODERATE,
        retainedSurfacePressurePascal,
        sourceReferenceMeanInsolationEarth:
          1,
        sourceReferenceBondAlbedo01:
          0.3,
      } as AtmosphereRetentionState;

      const greenhouse = {
        planetOrdinal,
        bodyLocator:
          locator,
        bodySeed:
          seed,
        sourceRetentionRegime:
          retention.retentionRegime,
        sourceReferenceMeanInsolationEarth:
          1,
        sourceReferenceBondAlbedo01:
          0.3,
        regime:
          deepEnvelope
            ? AtmosphereGreenhouseRegime.DEEP_ENVELOPE
            : AtmosphereGreenhouseRegime.MODERATE,
        infraredOpticalDepthProxy:
          deepEnvelope
            ? 4
            : 0.8,
        longwaveTrappingFraction01,
      } as AtmosphereGreenhouseEffect;

      const climate = {
        planetOrdinal,
        bodyLocator:
          locator,
        bodySeed:
          seed,
        sourceGreenhouseRegime:
          greenhouse.regime,
        sourceInfraredOpticalDepthProxy:
          greenhouse.infraredOpticalDepthProxy,
        sourceReferenceMeanInsolationEarth:
          1,
        sourceReferenceBondAlbedo01:
          0.3,
        equilibriumTemperatureKelvin:
          255,
        meanSurfaceTemperatureKelvin,
      } as PlanetClimateState;

      return {
        system,
        planet,
        retention,
        greenhouse,
        climate,
      };
    }
  },
);
