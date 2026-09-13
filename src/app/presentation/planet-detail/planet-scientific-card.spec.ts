import {
  vi,
} from 'vitest';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  BodyLocator,
} from '../../domain/generation/procedural-locator';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  type PlanetScientificResolvedTarget,
} from '../../simulation/planetary/planet-scientific-target-resolver';

import {
  ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailModel,
} from '../genesis-archive/archive-discovery-detail.facade';

import {
  PlanetScientificCardAssembler,
  PlanetScientificFicheResolutionKind,
  type PlanetScientificTargetResolutionResolver,
} from './planet-scientific-card';

describe(
  'PlanetScientificCardAssembler point 26.4',
  () => {

    it(
      'should keep detailed materialization behind the host-system CONFIRMED boundary',
      () => {
        const resolveDetailed =
          vi.fn();

        const resolver:
          PlanetScientificTargetResolutionResolver =
          Object.freeze({
            resolveDetailed,
          });

        const result =
          PlanetScientificCardAssembler
            .build(
              systemModel(
                DiscoveryState.CATALOGUED,
              ),
              0n,
              resolver,
            );

        expect(result.kind).toBe(
          PlanetScientificFicheResolutionKind.LOCKED,
        );
        expect(resolveDetailed).not.toHaveBeenCalled();
      },
    );

    it(
      'should expose the seven 26.4 scientific sections after system confirmation without leaking procedural internals',
      () => {
        const resolver:
          PlanetScientificTargetResolutionResolver =
          Object.freeze({
            resolveDetailed:
              vi.fn(
                () =>
                  detailedTarget(),
              ),
          });

        const result =
          PlanetScientificCardAssembler
            .build(
              systemModel(
                DiscoveryState.CONFIRMED,
              ),
              0n,
              resolver,
            );

        expect(result.kind).toBe(
          PlanetScientificFicheResolutionKind.AVAILABLE,
        );

        if (
          result.kind !==
            PlanetScientificFicheResolutionKind.AVAILABLE
        ) {
          throw new Error(
            'Expected available planet fiche.',
          );
        }

        expect(result.card.title).toBe(
          'Jotheria b',
        );
        expect(result.card.planetOrdinal).toBe(1);
        expect(result.card.orbitTopologyLabel).toBe(
          'Circumbinaria',
        );
        expect(result.card.locatorLabel).toBe(
          'G3 / S-17 / O8 / B0',
        );
        expect(result.card.bodyIndex).toBe(
          0n,
        );
        expect(
          result.card.sections.sections.map(
            section =>
              section.id,
          ),
        ).toEqual([
          'general',
          'orbit',
          'surface',
          'atmosphere',
          'climate',
          'geology',
          'moons',
        ]);
        expect(
          result.card.sections.relevantMoons,
        ).toHaveLength(1);
        expect(
          result.card.planetaryKnowledgeLabel,
        ).toBe(
          'Caracterización científica detallada',
        );
        expect(
          result.card.summary,
        ).toContain(
          'Su sistema anfitrión está confirmado',
        );

        const surfaceSection =
          result.card.sections.sections.find(
            section =>
              section.id ===
                'surface',
          );

        expect(surfaceSection).toBeTruthy();
        expect(
          surfaceSection?.fields.find(
            field =>
              field.label ===
                'Índice de inventario de agua',
          )?.value,
        ).toBe(
          '0,62 / 1',
        );
        expect(
          surfaceSection?.fields.find(
            field =>
              field.label ===
                'Agua líquida superficial',
          )?.value,
        ).toBe(
          'Océanos',
        );

        const serialized =
          JSON.stringify(
            result.card,
            (_key, value) =>
              typeof value ===
                'bigint'
                ? value.toString(10)
                : value,
          );

        for (
          const forbidden
          of [
            'bodySeed',
            'systemSeed',
            'moonSeed',
            'generationKey',
            'formationSnapshot',
            'formationBlueprint',
            'hostPlanetarySystem',
            'planetarySystem',
            'DiscoveryState',
            'Ground Truth',
            '26.4',
            '26.5',
            'Fase 21',
          ]
        ) {
          expect(serialized).not.toContain(
            forbidden,
          );
        }
      },
    );

    it(
      'should distinguish surface ice from persistent liquid water in presentation labels',
      () => {
        const source =
          detailedTarget();

        const target:
          PlanetScientificResolvedTarget =
          Object.freeze({
            ...source,
            detail:
              Object.freeze({
                ...source.detail,
                surface:
                  Object.freeze({
                    ...source.detail.surface,
                    waterPhaseRegime:
                      'ICE',
                    surfaceWaterRegime:
                      'NONE',
                    waterIceFraction01:
                      0.94,
                    waterLiquidFraction01:
                      0,
                    waterVaporFraction01:
                      0.06,
                    surfaceIceCoverageFraction01:
                      0.43,
                    surfaceLiquidWaterCoverageFraction01:
                      0,
                    hasPersistentSurfaceLiquidWater:
                      false,
                  }),
              }),
          });

        const result =
          PlanetScientificCardAssembler
            .build(
              systemModel(
                DiscoveryState.CONFIRMED,
              ),
              0n,
              Object.freeze({
                resolveDetailed:
                  vi.fn(
                    () =>
                      target,
                  ),
              }),
            );

        expect(result.kind).toBe(
          PlanetScientificFicheResolutionKind.AVAILABLE,
        );

        if (
          result.kind !==
            PlanetScientificFicheResolutionKind.AVAILABLE
        ) {
          throw new Error(
            'Expected available planet fiche.',
          );
        }

        const surface =
          result.card.sections.sections.find(
            section =>
              section.id ===
                'surface',
          );

        expect(
          surface?.fields.find(
            field =>
              field.label ===
                'Fases dominantes del agua',
          )?.value,
        ).toBe(
          'Hielo',
        );
        expect(
          surface?.fields.find(
            field =>
              field.label ===
                'Agua líquida superficial',
          )?.value,
        ).toBe(
          'No persistente',
        );
        expect(
          surface?.fields.find(
            field =>
              field.label ===
                'Cobertura de hielo',
          )?.value,
        ).toBe(
          '43 %',
        );
      },
    );

    it(
      'should reject invalid or missing mature planet indices without inventing a target',
      () => {
        const resolver:
          PlanetScientificTargetResolutionResolver =
          Object.freeze({
            resolveDetailed:
              vi.fn(
                () =>
                  null,
              ),
          });

        const negative =
          PlanetScientificCardAssembler
            .build(
              systemModel(
                DiscoveryState.CONFIRMED,
              ),
              -1n,
              resolver,
            );

        expect(negative.kind).toBe(
          PlanetScientificFicheResolutionKind.NOT_FOUND,
        );
        expect(resolver.resolveDetailed).not.toHaveBeenCalled();

        const missing =
          PlanetScientificCardAssembler
            .build(
              systemModel(
                DiscoveryState.CONFIRMED,
              ),
              99n,
              resolver,
            );

        expect(missing.kind).toBe(
          PlanetScientificFicheResolutionKind.NOT_FOUND,
        );
        expect(resolver.resolveDetailed).toHaveBeenCalledTimes(1);
      },
    );
  },
);

function detailedTarget():
  PlanetScientificResolvedTarget {

  return Object.freeze({
    identity:
      Object.freeze({
        locator:
          new BodyLocator(
            3n,
            -17n,
            8n,
            0n,
          ),
        planetOrdinal:
          1,
        designation:
          'Jotheria b',
        hostSystemDesignation:
          'Jotheria',
        orbitTopology:
          PlanetarySystemOrbitTopology.CIRCUMBINARY,
        hostPlanetCount:
          4,
      }),
    detail:
      Object.freeze({
        general:
          Object.freeze({
            planetType:
              'ROCKY',
            massEarth:
              1.2,
            radiusEarth:
              1.08,
            densityGramsPerCubicCentimeter:
              5.2,
            surfaceGravityEarth:
              1.03,
            surfaceGravityMetersPerSecondSquared:
              10.1,
            rotationPeriodHours:
              25.4,
            dayLengthHours:
              25.6,
            axialTiltDegrees:
              18.5,
            isRetrogradeRotation:
              false,
            isTidallySynchronized:
              false,
            referenceBondAlbedo01:
              0.31,
            isTypePhysicallyCoherent:
              true,
            metallicCoreMassFraction01:
              0.3,
            silicateInteriorMassFraction01:
              0.58,
            condensedIceMassFraction01:
              0.04,
            volatileRichInteriorMassFraction01:
              0.05,
            gaseousEnvelopeMassFraction01:
              0.03,
          }),
        orbit:
          Object.freeze({
            semiMajorAxisAu:
              1.12,
            eccentricity:
              0.04,
            inclinationDegrees:
              1.8,
            periastronAu:
              1.0752,
            apoastronAu:
              1.1648,
            periodDays:
              421.3,
            periodYears:
              1.153,
            radiativeHabitableZoneRelation:
              'WHOLLY_WITHIN_ZONE',
            dynamicallyAvailableHabitableZoneRelation:
              'WHOLLY_WITHIN_ZONE',
            referenceMeanInsolationEarth:
              0.96,
            tidalHeatingProxy:
              0.08,
          }),
        surface:
          Object.freeze({
            surfaceBaseRegime:
              'VOLATILE_RICH_SOLID',
            hasDefinedSolidSurfaceBase:
              true,
            baseSolidSurfaceRoughness01:
              0.46,
            waterInventoryIndex01:
              0.62,
            waterPhaseRegime:
              'ICE_AND_LIQUID',
            surfaceWaterRegime:
              'OCEANS',
            waterIceFraction01:
              0.22,
            waterLiquidFraction01:
              0.72,
            waterVaporFraction01:
              0.06,
            surfaceIceCoverageFraction01:
              0.18,
            surfaceLiquidWaterCoverageFraction01:
              0.61,
            hasPersistentSurfaceLiquidWater:
              true,
            surfaceRadiationRegime:
              'LOW',
            surfaceRadiationProtectionRegime:
              'STRONG',
            surfaceRadiationExposureIndex01:
              0.2,
            surfaceRadiationProtectionIndex01:
              0.78,
            hasEffectiveSurfaceRadiationProtection:
              true,
          }),
        atmosphere:
          Object.freeze({
            pressureRegime:
              'MODERATE',
            retainedPressureRegime:
              'MODERATE',
            retainedSurfacePressurePascal:
              101_000,
            retentionRegime:
              'WELL_RETAINED',
            atmosphericInventoryRetentionFraction01:
              0.87,
            retainedReferenceDensityKilogramsPerCubicMeter:
              1.2,
            retainedMeanMolarMassGramsPerMole:
              28.4,
            greenhouseRegime:
              'MODERATE',
            longwaveTrappingFraction01:
              0.34,
            isVacuum:
              false,
            isDeepEnvelope:
              false,
            retainedGasComposition:
              Object.freeze([
                Object.freeze({
                  gas:
                    'NITROGEN',
                  moleFraction01:
                    0.74,
                }),
                Object.freeze({
                  gas:
                    'OXYGEN',
                  moleFraction01:
                    0.19,
                }),
              ]),
          }),
        climate:
          Object.freeze({
            equilibriumTemperatureKelvin:
              257,
            meanSurfaceTemperatureKelvin:
              286,
            greenhouseSurfaceWarmingKelvin:
              29,
            climateStabilityRegime:
              'STABLE',
            climateStabilityIndex01:
              0.82,
            seasonalTemperatureAmplitudeKelvin:
              18,
            diurnalTemperatureRangeKelvin:
              10,
            minimumSurfaceTemperatureKelvin:
              251,
            maximumSurfaceTemperatureKelvin:
              313,
            heatRedistributionEfficiency01:
              0.73,
          }),
        geology:
          Object.freeze({
            geologyRegime:
              'ACTIVE',
            volcanismRegime:
              'MODERATE',
            tectonicRegime:
              'MOBILE_LID',
            internalHeatRetentionIndex01:
              0.71,
            tidalHeatingIndex01:
              0.08,
            geologicalActivityIndex01:
              0.69,
            volcanismIndex01:
              0.52,
            tectonicMobilityIndex01:
              0.64,
            volatileOutgassingPotential01:
              0.58,
            surfaceRenewalPotential01:
              0.55,
            isGeologicallyActive:
              true,
            magneticFieldRegime:
              'STRONG',
            magnetosphereRegime:
              'GLOBAL',
            dynamoPotentialIndex01:
              0.76,
            intrinsicMagneticFieldIndex01:
              0.72,
            magnetosphericProtectionIndex01:
              0.8,
            hasSustainedDynamo:
              true,
          }),
        moons:
          Object.freeze({
            moonCount:
              2,
            relevantMoonCount:
              1,
            unmaterializedMinorMoonCount:
              1,
            potentiallyHabitableMoonCount:
              1,
            surfaceHabitabilityCandidateCount:
              0,
            subsurfaceHabitabilityCandidateCount:
              1,
            relevantMoons:
              Object.freeze([
                Object.freeze({
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
                }),
              ]),
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
    stellarSystemCard:
      {
        title:
          'Jotheria',
      },
  } as unknown as ArchiveDiscoveryDetailModel;
}
