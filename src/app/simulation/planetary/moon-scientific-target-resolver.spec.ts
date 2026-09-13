import {
  vi,
} from 'vitest';

import {
  BodyLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  type PlanetScientificResolvedTarget,
} from './planet-scientific-target-resolver';

import {
  MoonScientificTargetResolver,
  type MoonScientificPlanetResolver,
} from './moon-scientific-target-resolver';

describe(
  'MoonScientificTargetResolver point 26.5',
  () => {

    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const planetLocator =
      new BodyLocator(
        3n,
        -17n,
        8n,
        0n,
      );

    it(
      'should resolve only an individually characterized relevant moon and preserve its zero-based route index',
      () => {
        const resolveDetailed =
          vi.fn(
            () =>
              planetTarget(),
          );

        const planetResolver:
          MoonScientificPlanetResolver =
          Object.freeze({
            resolveDetailed,
          });

        const result =
          MoonScientificTargetResolver
            .resolveDetailed(
              generationKey,
              planetLocator,
              0n,
              planetResolver,
            );

        expect(result).not.toBeNull();
        expect(result?.identity.designation).toBe(
          'Jotheria b I',
        );
        expect(result?.identity.moonOrdinal).toBe(
          1,
        );
        expect(result?.identity.moonIndex).toBe(
          0,
        );
        expect(result?.detail.orbit.semiMajorAxisKilometers).toBe(
          384_400,
        );
        expect(result?.detail.tides.isTidallyLocked).toBe(
          true,
        );
        expect(result?.detail.environment.hasSubsurfaceOcean).toBe(
          true,
        );
        expect(result?.detail.habitability.subsurfaceCandidate).toBe(
          true,
        );
        expect(resolveDetailed).toHaveBeenCalledTimes(1);

        const serialized =
          JSON.stringify(
            result,
          );

        for (
          const forbidden
          of [
            'moonSeed',
            'bodySeed',
            'systemSeed',
            'generationKey',
            'planetarySystem',
            'hostPlanetSeed',
          ]
        ) {
          expect(serialized).not.toContain(
            forbidden,
          );
        }
      },
    );

    it(
      'should not invent a detailed fiche for summarized minor moons or invalid indices',
      () => {
        const resolveDetailed =
          vi.fn(
            () =>
              planetTarget(),
          );

        const planetResolver:
          MoonScientificPlanetResolver =
          Object.freeze({
            resolveDetailed,
          });

        expect(
          MoonScientificTargetResolver
            .resolveDetailed(
              generationKey,
              planetLocator,
              -1n,
              planetResolver,
            ),
        ).toBeNull();
        expect(resolveDetailed).not.toHaveBeenCalled();

        expect(
          MoonScientificTargetResolver
            .resolveDetailed(
              generationKey,
              planetLocator,
              1n,
              planetResolver,
            ),
        ).toBeNull();
        expect(resolveDetailed).toHaveBeenCalledTimes(1);
      },
    );
  },
);

function planetTarget():
  PlanetScientificResolvedTarget {

  return {
    identity: {
      planetOrdinal:
        1,
      designation:
        'Jotheria b',
      hostSystemDesignation:
        'Jotheria',
    },
    detail: {
      general: {
        planetType:
          'ROCKY',
      },
      moons: {
        moonCount:
          2,
        relevantMoonCount:
          1,
        relevantMoons: [
          {
            designation:
              'Jotheria b I',
            moonOrdinal:
              1,
            moonIndex:
              0,
            massEarth:
              0.012,
            radiusEarth:
              0.27,
            meanDensityGramsPerCubicCentimeter:
              3.3,
            surfaceGravityEarth:
              0.165,
            semiMajorAxisPlanetRadii:
              55,
            semiMajorAxisKilometers:
              384_400,
            eccentricity:
              0.055,
            inclinationDegrees:
              5.1,
            orbitalPeriodDays:
              27.2,
            rocheLimitPlanetRadii:
              2.9,
            hillSphereRadiusPlanetRadii:
              230,
            synchronousOrbitPlanetRadii:
              6.6,
            tidalForcingIndex01:
              0.54,
            tidalHeatingIndex01:
              0.48,
            tidalRegime:
              'STRONG',
            tidalLockingIndex01:
              0.96,
            tidalLockingRegime:
              'SYNCHRONIZED',
            rotationPeriodHours:
              652.8,
            migrationRegime:
              'OUTWARD',
            isTidallyLocked:
              true,
            referenceMeanInsolationEarth:
              0.96,
            inferredIceRichnessIndex01:
              0.72,
            inferredBondAlbedo01:
              0.34,
            equilibriumTemperatureKelvin:
              238,
            estimatedSurfaceTemperatureKelvin:
              245,
            atmosphereRetentionIndex01:
              0.17,
            atmosphereRegime:
              'EXOSPHERE',
            waterInventoryIndex01:
              0.78,
            subsurfaceOceanPotentialIndex01:
              0.81,
            surfaceLiquidWaterPotentialIndex01:
              0.12,
            waterRegime:
              'ICE_AND_SUBSURFACE_OCEAN',
            internalHeatRetentionIndex01:
              0.52,
            geologicalActivityIndex01:
              0.58,
            geologyRegime:
              'TIDALLY_ACTIVE',
            hasAtmosphere:
              true,
            hasWater:
              true,
            hasSubsurfaceOcean:
              true,
            hasSurfaceLiquidWater:
              false,
            isGeologicallyActive:
              true,
            surfaceTemperatureSupportIndex01:
              0.31,
            surfaceAtmosphereSupportIndex01:
              0.18,
            surfaceGravitySupportIndex01:
              0.42,
            tidalModerationIndex01:
              0.66,
            subsurfaceEnergySupportIndex01:
              0.83,
            surfaceHabitabilityIndex01:
              0.22,
            subsurfaceHabitabilityIndex01:
              0.59,
            overallHabitabilityIndex01:
              0.62,
            surfaceHabitabilityCandidate:
              false,
            subsurfaceHabitabilityCandidate:
              true,
            habitabilityRegime:
              'SUBSURFACE_CANDIDATE',
            isPotentiallyHabitable:
              true,
            giantHostSpecialization:
              false,
            giantMoonOrbitalFamily:
              'NOT_APPLICABLE',
            giantMoonCompositionRegime:
              'NOT_APPLICABLE',
            isLargeGiantMoon:
              false,
            isTidallyActiveGiantMoon:
              false,
            isOceanBearingGiantMoonCandidate:
              false,
          },
        ],
      },
    },
  } as unknown as PlanetScientificResolvedTarget;
}
