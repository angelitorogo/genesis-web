import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import type { MoonOceanReality32F2c } from '../../domain/planetary/moon-ocean-reality-32-f-2c';
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

import { ObservedHabitabilityFiche31Fe } from '../scientific/observed-habitability-fiche-31-f-e';

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

    it.each([
      ['tarjeta sin descriptor render', undefined, 'UNKNOWN'],
      ['tarjeta con multiplicidad binaria', { multiplicity: { name: 'BINARY' } }, 'BINARY'],
    ] as const)(
      '31.F.e preserva la multiplicidad observada: %s',
      (_case, render, expectedMultiplicity) => {
        const originalModel = systemModel(DiscoveryState.CONFIRMED);
        const model = {
          ...originalModel,
          stellarSystemCard: render === undefined
            ? { title: 'Jotheria' }
            : { title: 'Jotheria', render },
        } as unknown as ArchiveDiscoveryDetailModel;
        const projectionSpy = vi.spyOn(ObservedHabitabilityFiche31Fe, 'moon');
        try {
          const result = MoonScientificCardAssembler.build(
              model, 0n, 0n,
              Object.freeze({ resolveDetailed: () => moonTarget() }),
              previewSceneResolver(),
          );
          expect(result.kind).toBe(MoonScientificFicheResolutionKind.AVAILABLE);
          expect(projectionSpy).toHaveBeenCalledWith(
            expect.anything(), DiscoveryState.CONFIRMED, true,
            'G3/S-17/O8/B0/M0', expectedMultiplicity,
          );
        } finally {
          projectionSpy.mockRestore();
        }
      },
    );

    it('32.F.2c: CONFIRMED gives direct access to every materialized relevant moon model without per-moon discovery', () => {
      const base = moonTarget();
      // 32.F.6b requires a complete CT-0 constitutive contract before its
      // reservoir, pressure and geometry can become physical evidence in 31.10.
      // The older partial fixture contained only presentation fields and was
      // correctly refused by that validation, causing a false regression.
      const generatedModel = {
        contractVersion: '32.F.2c-seeded-interior-ocean-model-v1',
        provenance: 'SIMULATED_CT0_CONSTITUTIVE_MODEL_NOT_DIRECT_OBSERVATION',
        hostPlanetOrdinal: base.identity.hostPlanetOrdinal,
        moonOrdinal: base.identity.moonOrdinal,
        state: 'PRESENT_IN_SIMULATED_MODEL',
        reason: 'SUBSURFACE_LIQUID_IN_GENERATED_MODEL',
        generatedTidalFluxWattsPerSquareMeter: .001,
        generatedRadiogenicSpecificPowerWattsPerKilogramRock: 0,
        generatedRadiogenicFluxWattsPerSquareMeter: 0,
        generatedTotalSurfaceHeatFluxWattsPerSquareMeter: .001,
        assumedIceConductivityWattsPerMeterKelvin: 2.5,
        assumedOceanAdiabaticTemperatureGradientKelvinPerPascal: 1.2e-8,
        meltingDiagram: 'APPROX_PURE_H2O_IH_III_V_VI_0_TO_2_GPA',
        surfaceTemperatureKelvin: base.detail.environment.estimatedSurfaceTemperatureKelvin,
        waterInventoryKilograms: 1.55e21,
        pressureAtWaterShellBasePascal: 7e7,
        waterShellThicknessKilometers: 44,
        iceCoverThicknessKilometers: 12,
        liquidLayerThicknessKilometers: 32,
        highPressureIceThicknessKilometers: 0,
        simulatedLiquidWaterMassKilograms: 1.15e21,
        simulatedSolidWaterMassKilograms: 4e20,
        radialLayers: [
          { phase: 'ICE_IH', topDepthKilometers: 0, bottomDepthKilometers: 12,
            massKilograms: 4e20, pressureTopPascal: 0, pressureBottomPascal: 1.8e7,
            temperatureTopKelvin: 245, temperatureBottomKelvin: 271.5 },
          { phase: 'LIQUID_H2O', topDepthKilometers: 12, bottomDepthKilometers: 44,
            massKilograms: 1.15e21, pressureTopPascal: 1.8e7, pressureBottomPascal: 7e7,
            temperatureTopKelvin: 271.5, temperatureBottomKelvin: 273.5 },
        ],
        scientificLimits: ['Fixture constitutivo de regresión; no es una observación'],
      } satisfies MoonOceanReality32F2c;
      const target = {
        ...base, detail: { ...base.detail,
          environment: { ...base.detail.environment, oceanReality32F2c: generatedModel },
        },
      } as MoonScientificResolvedTarget;
      const resolver = Object.freeze({ resolveDetailed: () => target });
      const result = MoonScientificCardAssembler.build(
        systemModel(DiscoveryState.CONFIRMED), 0n, 0n, resolver, previewSceneResolver());
      expect(result.kind).toBe(MoonScientificFicheResolutionKind.AVAILABLE);
      if (result.kind !== MoonScientificFicheResolutionKind.AVAILABLE) return;
      expect(result.card.sections.sections.find(s => s.id === 'environment')?.fields.some(
        f => f.label.includes('Océano CT-0 del universo simulado'))).toBe(true);
      expect(result.card.observedHabitability?.routes[1].facts.some(
        f => f.label.includes('realidad simulada'))).toBe(true);
      expect(result.card.accessLabel).toBe('Consulta científica habilitada');
      expect(result.card.sections.badges).toContain(
        'Océano subsuperficial presente (universo simulado CT-0)',
      );
      expect(result.card.sections.badges).not.toContain(
        'Potencial de océano subsuperficial (índice V1)',
      );
    });

    it.each([
      ['PRESENT_IN_SIMULATED_MODEL', 'SUBSURFACE_LIQUID_IN_GENERATED_MODEL'],
      ['ABSENT_IN_SIMULATED_MODEL', 'ICE_STABLE_IN_GENERATED_MODEL'],
      ['UNRESOLVED_IN_SIMULATED_MODEL', 'TEMPERATE_SURFACE_WITH_UNRESOLVED_CONFINEMENT'],
    ] as const)(
      '32.F.2c.b: ocean CT-0 %s synchronizes badges, environment and legacy habitability without modifying V1 indices',
      (state, reason) => {
        const base = moonTarget();
        const model = {
          provenance: 'SIMULATED_CT0_CONSTITUTIVE_MODEL_NOT_DIRECT_OBSERVATION',
          state, reason,
          iceCoverThicknessKilometers: state === 'PRESENT_IN_SIMULATED_MODEL' ? 2 : null,
          liquidLayerThicknessKilometers: state === 'PRESENT_IN_SIMULATED_MODEL' ? 28 : null,
          highPressureIceThicknessKilometers: state === 'PRESENT_IN_SIMULATED_MODEL' ? 0 : null,
          simulatedLiquidWaterMassKilograms: state === 'PRESENT_IN_SIMULATED_MODEL' ? 1e19 : null,
          simulatedSolidWaterMassKilograms: state === 'PRESENT_IN_SIMULATED_MODEL' ? 2e19 : null,
          waterInventoryKilograms: 3e19,
          generatedTotalSurfaceHeatFluxWattsPerSquareMeter: .002,
        } as NonNullable<MoonScientificResolvedTarget['detail']['environment']['oceanReality32F2c']>;
        const withOcean = {
          ...base, detail: { ...base.detail,
            environment: {
              ...base.detail.environment,
              oceanReality32F2c: model,
              waterPhaseInventory32F2a: {
                contractVersion: '32.F.2a-conditional-water-endmembers-v1',
                provenance: 'FORMATION_H2O_ENDMEMBER_CONDITIONAL_NOT_OBSERVED',
                hostPlanetOrdinal: 1,
                moonOrdinal: 1,
                sourceFormationWaterKilograms: 3e19,
                sourceFormationMassKilograms: 1e20,
                sourceSurfaceTemperatureKelvin: 245,
                waterSaturationPressurePascal: null,
                saturatedVaporCapacityKilograms: null,
                surfaceLiquidRequiresPressureAtLeastPascal: null,
                possibleEndmembers: [],
                actualSurfaceIceMassKilograms: null,
                actualSurfaceLiquidMassKilograms: null,
                actualSurfaceVaporMassKilograms: null,
                actualInteriorLiquidMassKilograms: null,
                actualInteriorIceMassKilograms: null,
                actualWaterDistributionStatus: 'UNRESOLVED_EXPOSURE_PRESSURE_INTERIOR_GEOMETRY_AND_HISTORY',
                modelLimits: [],
              },
            },
          },
        } as MoonScientificResolvedTarget;
        const result = MoonScientificCardAssembler.build(
          systemModel(DiscoveryState.CONFIRMED), 0n, 0n,
          Object.freeze({ resolveDetailed: () => withOcean }), previewSceneResolver(),
        );
        expect(result.kind).toBe(MoonScientificFicheResolutionKind.AVAILABLE);
        if (result.kind !== MoonScientificFicheResolutionKind.AVAILABLE) return;
        const sections = result.card.sections;
        const environment = sections.sections.find(section => section.id === 'environment')!;
        const habitability = sections.sections.find(section => section.id === 'habitability')!;
        const field = (label: string) => environment.fields.find(x => x.label === label);
        const habit = (label: string) => habitability.fields.find(x => x.label === label);
        expect(field('Distribución de fases del escenario previo 32.F.2a')?.value)
          .toBe('No determinada por 32.F.2a');
        expect(field('Distribución real hielo / líquido / vapor')).toBeUndefined();
        expect(field('Potencial de océano subsuperficial')?.note).toContain('Índice V1 histórico');
        expect(field('Dominio termodinámico 32.F.2c')?.value).not.toMatch(/[_]|subsurface liquid|temperate surface/i);
        expect(habit('Índice global')?.value).toBe('0,62 / 1');
        expect(habit('Ruta subsuperficial')?.note).toContain('Índice V1');
        expect(habit('Clasificación')?.note).not.toContain('océano no confirmado');
        if (state === 'PRESENT_IN_SIMULATED_MODEL') {
          expect(field('Agua')?.value).toContain('realidad simulada CT-0');
          expect(habit('Clasificación')?.note).toContain('Océano subsuperficial presente');
          expect(habit('Ruta subsuperficial')?.value).toContain('océano H₂O presente CT-0');
          expect(sections.badges).toContain(
            'Potencial de habitabilidad V1 (océano CT-0 modelado; otros criterios pendientes)');
          expect(sections.badges).not.toContain('Candidatura subsuperficial condicional (sin confirmar)');
        } else if (state === 'ABSENT_IN_SIMULATED_MODEL') {
          expect(field('Agua')?.value).toContain('Sin océano subsuperficial H₂O');
          expect(habit('Ruta subsuperficial')?.value).toContain('Sin candidatura subsuperficial acuosa CT-0');
          expect(sections.badges).not.toContain('Candidatura subsuperficial condicional (sin confirmar)');
          expect(sections.badges).toContain(
            'Potencial de habitabilidad V1 no corroborado (sin océano H₂O CT-0)');
        } else {
          expect(field('Agua')?.value).toBe('Hielo y océano subsuperficial');
          expect(habit('Clasificación')?.value).toBe('Candidata subsuperficial');
          expect(sections.badges).not.toContain('Océano subsuperficial presente (universo simulado CT-0)');
        }
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
        expect(result.card.observedHabitability?.routes).toHaveLength(3);
        expect(JSON.stringify(result.card.observedHabitability)).not.toMatch(/simulatedReality|physicalPotential|lifeProbability|sourceKey/);
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
          'atmosphere',
          'radiation',
          'geochemistry',
          'history',
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

        const synthesis = result.card.sections.sections
          .find(section => section.id === 'general')?.fields ?? [];
        expect(synthesis.find(item => item.label === 'Síntesis 32.F.6 — reservorio H₂O')?.value)
          .toBe('Modelo oceánico CT-0 no disponible');
        expect(synthesis.find(item => item.label === 'Síntesis 32.F.6 — atmósfera y radiación')?.value)
          .toContain('dosis ionizante real no resuelta');
        expect(synthesis.find(item => item.label === 'Síntesis 32.F.6 — energía e historia')?.value)
          .toContain('sin tramos fechados disponibles');
        const atmosphericFields = result.card.sections.sections
          .find(section => section.id === 'atmosphere')?.fields ?? [];
        const environmentFields = result.card.sections.sections
          .find(section => section.id === 'environment')?.fields ?? [];
        expect(environmentFields.find(item => item.label === 'Atmósfera')).toBeUndefined();
        expect(environmentFields.find(item => item.label === 'Temperatura superficial estimada')).toBeTruthy();
        expect(result.card.sections.sections.find(section => section.id === 'atmosphere')?.eyebrow)
          .toBe('SECCIÓN 05');
        expect(result.card.sections.sections.find(section => section.id === 'radiation')?.eyebrow)
          .toBe('SECCIÓN 06');
        expect(result.card.sections.sections.find(section => section.id === 'radiation')?.fields
          .some(item => item.label === 'Exposición ionizante y protección')).toBe(true);
        expect(result.card.sections.sections.find(section => section.id === 'geochemistry')?.eyebrow)
          .toBe('SECCIÓN 07');
        expect(result.card.sections.sections.find(section => section.id === 'history')?.eyebrow)
          .toBe('SECCIÓN 08');
        expect(result.card.sections.sections.find(section => section.id === 'habitability')?.eyebrow)
          .toBe('SECCIÓN 09');
        expect(result.card.sections.sections.find(section => section.id === 'comparison')?.eyebrow)
          .toBe('SECCIÓN 10');
        expect(atmosphericFields.find(item => item.label === 'Atmósfera')?.value)
          .toBe('Atmósfera sustancial (escenario)');
        expect(atmosphericFields.find(item => item.label === 'Atmósfera')?.note)
          .toContain('Soporte de columna heredado');
        expect(atmosphericFields.find(item => item.label === 'Presión superficial atmosférica (escenario)')?.value)
          .toContain('bar');
        expect(atmosphericFields.find(item => item.label === 'Composición gaseosa candidata')?.value)
          .toContain('N₂');
        expect(atmosphericFields.find(item => item.label === 'Entorno radiativo y magnetosférico')?.value)
          .toContain('no evaluables');

        // El fixture heredado solo aporta hasSubsurfaceOcean (índice V1),
        // no un estado oceánico CT-0 generado por 32.F.2c.
        expect(result.card.sections.badges).toContain(
          'Potencial de océano subsuperficial (índice V1)',
        );
        expect(result.card.sections.badges).not.toContain(
          'Océano subsuperficial presente (universo simulado CT-0)',
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
            atmosphereAssessment: Object.freeze({
              volatileInventoryIndex01: 0.65,
              thermalEscapeSupportIndex01: 0.78,
              replenishmentSupportIndex01: 0.20,
              condensationRemovalIndex01: 0.12,
              estimatedSurfacePressurePascal: 150_000,
              pressureBasis: 'CONDITIONAL_SCENARIO' as const,
              species: Object.freeze([{
                gas: AtmosphereGas.NITROGEN,
                moleFraction01: 1,
                partialPressurePascal: 150_000,
              }]),
              irradiationReferenceEarth: 0.96,
              chargedParticleEnvironment: 'UNRESOLVED' as const,
              hostMagnetosphereShielding: 'UNRESOLVED' as const,
            }),
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
        orbits: [
          {
            id: 'moon-orbit-1-1',
            kind: 'moon',
            label: 'Jotheria b I',
            colorHex: '#7EAFC6',
            opacity: 0.32,
            semiMajorScene: 0.14,
            semiMinorScene: 0.139,
            focusOffsetScene: 0.006,
            rotationDegrees: 12,
            inclinationDegrees: 5.1,
            motionId: 'moon-1-1-motion',
            motionScale: 1,
            anchorMotionContributions: [],
          },
        ],
        motions: [
          {
            id: 'moon-1-1-motion',
            semiMajorAxisAu: 0.00257,
            eccentricity: 0.04,
            periodDays: 27.3,
            rotationDegrees: 12,
            inclinationDegrees: 5.1,
            epochMeanAnomalyDegrees: 31,
          },
        ],
        simulation: {
          epochSimulationDay: 0,
          playbackDaysPerRealSecond: 1,
        },
        minorBodies: [],
      } as unknown as SystemSceneSnapshot),
  });
}
