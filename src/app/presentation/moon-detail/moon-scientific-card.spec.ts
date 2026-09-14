import {
  vi,
} from 'vitest';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailModel,
} from '../genesis-archive/archive-discovery-detail.facade';

import {
  type MoonScientificResolvedTarget,
} from '../../simulation/planetary/moon-scientific-target-resolver';

import {
  type ScientificBodyPreviewSceneResolver,
} from '../scientific/scientific-body-preview';

import {
  type SystemSceneSnapshot,
} from '../system/system-scene-snapshot';

import {
  MoonScientificCardAssembler,
  MoonScientificFicheResolutionKind,
  type MoonScientificTargetResolutionResolver,
} from './moon-scientific-card';

describe(
  'MoonScientificCardAssembler point 26.5',
  () => {

    it(
      'should keep lunar materialization behind the host-system CONFIRMED boundary',
      () => {
        const resolveDetailed =
          vi.fn();

        const resolver:
          MoonScientificTargetResolutionResolver =
          Object.freeze({
            resolveDetailed,
          });

        const result =
          MoonScientificCardAssembler
            .build(
              systemModel(
                DiscoveryState.CATALOGUED,
              ),
              0n,
              0n,
              resolver,
            );

        expect(result.kind).toBe(
          MoonScientificFicheResolutionKind.LOCKED,
        );
        expect(resolveDetailed).not.toHaveBeenCalled();
      },
    );

    it(
      'should expose the lunar sections plus the point-26.9 Earth comparison without leaking procedural internals',
      () => {
        const resolver:
          MoonScientificTargetResolutionResolver =
          Object.freeze({
            resolveDetailed:
              vi.fn(
                () =>
                  moonTarget(),
              ),
          });

        const result =
          MoonScientificCardAssembler
            .build(
              systemModel(
                DiscoveryState.CONFIRMED,
              ),
              0n,
              0n,
              resolver,
              previewSceneResolver(),
            );

        expect(result.kind).toBe(
          MoonScientificFicheResolutionKind.AVAILABLE,
        );

        if (
          result.kind !==
            MoonScientificFicheResolutionKind.AVAILABLE
        ) {
          throw new Error(
            'Expected available moon fiche.',
          );
        }

        expect(result.card.title).toBe(
          'Jotheria b I',
        );
        expect(result.card.preview.kind).toBe(
          'MOON',
        );
        expect(result.card.hostPlanetTitle).toBe(
          'Jotheria b',
        );
        expect(result.card.locatorLabel).toBe(
          'G3 / S-17 / O8 / B0 / M0',
        );
        expect(
          result.card.sections.sections.map(
            section =>
              section.id,
          ),
        ).toEqual([
          'general',
          'orbit',
          'tides',
          'environment',
          'habitability',
          'comparison',
        ]);
        expect(
          result.card.sections.comparison.radiusEarth,
        ).toBe(0.27);
        expect(
          result.card.sections.comparison.earthDiameterPercent,
        ).toBe(100);
        expect(
          result.card.sections.comparison.worldDiameterPercent,
        ).toBeCloseTo(
          27,
          8,
        );
        expect(
          result.card.sections.comparison.surfaceAreaEarth,
        ).toBeCloseTo(
          0.27 ** 2,
          8,
        );
        expect(
          result.card.sections.comparison.volumeEarth,
        ).toBeCloseTo(
          0.27 ** 3,
          8,
        );

        const comparisonSection =
          result.card.sections.sections.find(
            section =>
              section.id ===
                'comparison',
          );

        expect(
          comparisonSection?.title,
        ).toBe(
          'Comparación con la Tierra',
        );

        expect(result.card.sections.badges).toContain(
          'Océano subsuperficial',
        );
        expect(result.card.sections.badges).toContain(
          'Candidata potencialmente habitable',
        );

        const serialized =
          JSON.stringify(
            result.card,
          );

        for (
          const forbidden
          of [
            'moonSeed',
            'bodySeed',
            'systemSeed',
            'generationKey',
            'presentationSeedUint32',
            'shapeSeedUint32',
            'planetarySystem',
            'Ground Truth',
            'Fase 21',
            '26.5',
          ]
        ) {
          expect(serialized).not.toContain(
            forbidden,
          );
        }
      },
    );

    it(
      'should reject invalid or unavailable lunar indices without inventing a fiche',
      () => {
        const resolver:
          MoonScientificTargetResolutionResolver =
          Object.freeze({
            resolveDetailed:
              vi.fn(
                () =>
                  null,
              ),
          });

        const negative =
          MoonScientificCardAssembler
            .build(
              systemModel(
                DiscoveryState.CONFIRMED,
              ),
              0n,
              -1n,
              resolver,
            );

        expect(negative.kind).toBe(
          MoonScientificFicheResolutionKind.NOT_FOUND,
        );
        expect(resolver.resolveDetailed).not.toHaveBeenCalled();

        const unavailable =
          MoonScientificCardAssembler
            .build(
              systemModel(
                DiscoveryState.CONFIRMED,
              ),
              0n,
              9n,
              resolver,
            );

        expect(unavailable.kind).toBe(
          MoonScientificFicheResolutionKind.NOT_FOUND,
        );
        expect(resolver.resolveDetailed).toHaveBeenCalledTimes(1);
      },
    );
  },
);

function moonTarget():
  MoonScientificResolvedTarget {

  return Object.freeze({
    identity:
      Object.freeze({
        designation:
          'Jotheria b I',
        moonOrdinal:
          1,
        moonIndex:
          0,
        hostPlanetDesignation:
          'Jotheria b',
        hostPlanetOrdinal:
          1,
        hostPlanetType:
          'ROCKY',
        hostSystemDesignation:
          'Jotheria',
        hostMoonCount:
          2,
        hostRelevantMoonCount:
          1,
      }),
    detail:
      Object.freeze({
        general:
          Object.freeze({
            massEarth:
              0.012,
            radiusEarth:
              0.27,
            meanDensityGramsPerCubicCentimeter:
              3.3,
            surfaceGravityEarth:
              0.165,
            giantHostSpecialization:
              false,
            giantMoonOrbitalFamily:
              'NOT_APPLICABLE',
            giantMoonCompositionRegime:
              'NOT_APPLICABLE',
            isLargeGiantMoon:
              false,
          }),
        orbit:
          Object.freeze({
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
          }),
        tides:
          Object.freeze({
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
            isTidallyActiveGiantMoon:
              false,
          }),
        environment:
          Object.freeze({
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
            isOceanBearingGiantMoonCandidate:
              false,
          }),
        habitability:
          Object.freeze({
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
            surfaceCandidate:
              false,
            subsurfaceCandidate:
              true,
            habitabilityRegime:
              'SUBSURFACE_CANDIDATE',
            isPotentiallyHabitable:
              true,
          }),
      }),
  });
}

function systemModel(
  state:
    typeof DiscoveryState.CATALOGUED |
    typeof DiscoveryState.CONFIRMED,
): ArchiveDiscoveryDetailModel {

  return {
    universeSeed:
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    generatorVersionCode:
      1,
    locatorKind:
      ArchiveDiscoveryLocatorKind.SYSTEM,
    discoveryState:
      state,
    discoveryStateLabel:
      state.name,
    galaxyIndex:
      3n,
    sectorKey:
      -17n,
    galacticObjectIndex:
      8n,
    stellarSystemCard: {
      title:
        'Jotheria',
    },
  } as unknown as ArchiveDiscoveryDetailModel;
}

function previewSceneResolver():
  ScientificBodyPreviewSceneResolver {

  return Object.freeze({
    build: () =>
      ({
        universeSeed:
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        generatorVersionCode:
          1,
        proceduralIdentity:
          'G3/S-17/O8',
        planets: [],
        moons: [
          {
            id: 'moon-1-1',
            kind: 'moon',
            label: 'Jotheria b I',
            title: 'Jotheria b I',
            hostPlanetId: 'planet-1',
            hostPlanetOrdinal: 1,
            colorHex: '#A9ADB2',
            radiusScene: 0.05,
            position: { x: 0, y: 0, z: 0 },
            orbitId: 'moon-orbit-1-1',
            motionContributions: [],
            spin: {
              source: 'MOON_21_4',
              rotationPeriodHours: 652.8,
              axialTiltDegrees: 6.7,
              epochPhaseDegrees: 31,
              isSynchronized: true,
            },
            visualPresentation: {
              version: 1,
              sourceMoonIdentity: 'Jotheria b I',
              sourceHostPlanetType: 'ROCKY',
              sourceRadiusEarth: 0.27,
              sourceMassEarth: 0.012,
              sourceMeanDensityGramsPerCubicCentimeter: 3.3,
              sourceSurfaceGravityEarth: 0.165,
              sourceAtmosphereRetentionIndex01: 0.17,
              sourceAtmosphereRegime: 'EXOSPHERE',
              sourceWaterInventoryIndex01: 0.78,
              sourceInferredIceRichnessIndex01: 0.72,
              sourceSubsurfaceOceanPotentialIndex01: 0.81,
              sourceSurfaceLiquidWaterPotentialIndex01: 0.12,
              sourceWaterRegime: 'ICE_AND_SUBSURFACE_OCEAN',
              sourceEstimatedSurfaceTemperatureKelvin: 245,
              sourceGeologicalActivityIndex01: 0.58,
              sourceTidalHeatingIndex01: 0.48,
              sourceGeologyRegime: 'TIDALLY_ACTIVE',
              sourceOverallHabitabilityIndex01: 0.51,
              sourceIsPotentiallyHabitable: true,
              sourceGiantHostSpecialization: false,
              sourceGiantCompositionRegime: 'NOT_APPLICABLE',
              sourceIsLargeGiantMoon: false,
              sourceIsTidallyActiveGiantMoon: false,
              sourceIsOceanBearingGiantMoonCandidate: false,
              shapeClass: 'MAJOR_PLANETARY',
              surfaceStyle: 'ICY',
              presentationRadiusScene: 0.05,
              presentationIrregularity01: 0.01,
              presentationLiquidCoverage01: 0,
              presentationIceCoverage01: 0.62,
              presentationVolcanicCoverage01: 0.12,
              presentationCloudCoverage01: 0,
              presentationAtmospherePresent: false,
              presentationAtmosphereStrength01: 0,
              presentationAtmosphereShellScale: 1,
              presentationBaseColorHex: '#A9ADB2',
              presentationAccentColorHex: '#D8E4EC',
              presentationAtmosphereColorHex: '#B0D0E8',
              presentationSeedUint32: 0x12345678,
            },
          },
        ],
        minorBodies: [],
      } as unknown as SystemSceneSnapshot),
  });
}
