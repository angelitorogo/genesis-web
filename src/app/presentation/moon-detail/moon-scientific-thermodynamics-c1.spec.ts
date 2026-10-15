import { type MoonInternalWaterAssessment } from '../../domain/planetary/moon-internal-water-assessment';
import { type MoonScientificResolvedTarget } from '../../simulation/planetary/moon-scientific-target-resolver';
import {
  lunarConductiveShellPresentation,
  lunarInternalWaterFields,
  lunarSubsurfacePotentialNoteV1,
  MoonScientificSectionsAssembler,
} from './moon-scientific-sections';

// Regression fixtures transcribed from scientific fiches: these are inputs to
// presentation, never seed or body-name exceptions in a production generator.
function thermal(
  minimumKm: number,
  maximumKm: number,
  regime: MoonInternalWaterAssessment['iceShellThermalRegime'],
  minimumFlux: number,
  maximumFlux: number,
): MoonInternalWaterAssessment {
  return {
    basis: 'ECCENTRICITY_TIDES_BOUNDED_SCENARIO',
    tidalHeatFluxMinimumWattsPerSquareMeter: minimumFlux,
    tidalHeatFluxMaximumWattsPerSquareMeter: maximumFlux,
    conductiveShellThicknessMinimumKilometers: minimumKm,
    conductiveShellThicknessMaximumKilometers: maximumKm,
    iceShellThermalRegime: regime,
    cryovolcanism: regime === 'CONDITIONAL_ICE_OCEAN'
      ? 'CONDITIONAL' : 'NOT_SUPPORTED_BY_SCENARIO',
    radiogenicHeatResolved: false,
    oceanConfirmed: false,
  };
}

function moonTarget(
  assessment: MoonInternalWaterAssessment,
  radiusEarth: number,
  subsurfaceIndex: number,
  subsurfaceCandidate: boolean,
  surfaceTemp: number,
  hasSubsurfaceOcean = true,
): MoonScientificResolvedTarget {
  return {
    identity: {
      designation: 'Luna de prueba', moonOrdinal: 1, moonIndex: 0,
      hostPlanetDesignation: 'Planeta', hostPlanetOrdinal: 1,
      hostPlanetType: 'GAS_GIANT', hostSystemDesignation: 'Sistema',
      hostMoonCount: 2, hostRelevantMoonCount: 2,
    },
    detail: {
      general: {
        massEarth: 0.027, radiusEarth,
        meanDensityGramsPerCubicCentimeter: 1.4,
        surfaceGravityEarth: 0.121,
        giantHostSpecialization: true,
        giantMoonOrbitalFamily: 'MAJOR_REGULAR',
        giantMoonCompositionRegime: 'ICE_RICH', isLargeGiantMoon: true,
      },
      orbit: {
        semiMajorAxisPlanetRadii: 19.129, semiMajorAxisKilometers: 1384025,
        eccentricity: 0.021, inclinationDegrees: 0.91,
        orbitalPeriodDays: 15.907, rocheLimitPlanetRadii: 1.756,
        hillSphereRadiusPlanetRadii: 6434.87,
      },
      tides: {
        synchronousOrbitPlanetRadii: 3.881, tidalForcingIndex01: 0.679,
        tidalHeatingIndex01: 0.567, tidalRegime: 'STRONG',
        tidalLockingIndex01: 1, tidalLockingRegime: 'SYNCHRONIZED',
        rotationPeriodHours: 381.76, migrationRegime: 'OUTWARD',
        isTidallyLocked: true, isTidallyActiveGiantMoon: true,
      },
      environment: {
        referenceMeanInsolationEarth: 0.000681,
        inferredIceRichnessIndex01: 1, inferredBondAlbedo01: 0.55,
        equilibriumTemperatureKelvin: 36.8,
        estimatedSurfaceTemperatureKelvin: surfaceTemp,
        atmosphereRetentionIndex01: 0.571, atmosphereRegime: 'EXOSPHERE',
        internalWaterAssessment: assessment, atmosphereAssessment: null,
        waterInventoryIndex01: 0.989,
        subsurfaceOceanPotentialIndex01: subsurfaceIndex,
        surfaceLiquidWaterPotentialIndex01: 0,
        waterRegime: hasSubsurfaceOcean ? 'ICE_AND_SUBSURFACE_OCEAN' : 'SURFACE_ICE',
        internalHeatRetentionIndex01: 0.639,
        geologicalActivityIndex01: 0.592,
        geologyRegime: 'TIDALLY_ACTIVE', hasAtmosphere: false,
        hasWater: true, hasSubsurfaceOcean,
        hasSurfaceLiquidWater: false, isGeologicallyActive: true,
        isOceanBearingGiantMoonCandidate: true,
      },
      habitability: {
        surfaceTemperatureSupportIndex01: 0,
        surfaceAtmosphereSupportIndex01: 1,
        surfaceGravitySupportIndex01: 1,
        tidalModerationIndex01: 1,
        subsurfaceEnergySupportIndex01: 0.752,
        surfaceHabitabilityIndex01: 0,
        subsurfaceHabitabilityIndex01: subsurfaceCandidate ? 0.859 : 0.212,
        overallHabitabilityIndex01: subsurfaceCandidate ? 0.859 : 0.212,
        surfaceCandidate: false, subsurfaceCandidate,
        habitabilityRegime: subsurfaceCandidate ? 'SUBSURFACE_CANDIDATE' : 'NONE',
        isPotentiallyHabitable: subsurfaceCandidate,
      },
    },
  };
}

function findField(
  target: MoonScientificResolvedTarget,
  section: 'environment' | 'habitability',
  label: string,
) {
  const projected = MoonScientificSectionsAssembler.build(target);
  return projected.sections.find(s => s.id === section)?.fields.find(f => f.label === label);
}

describe('C.1 — Lunar geometrical shell and legacy-science semantic closure', () => {
  it('Aaeviar B-6 I: restricts the mathematical 1.93–2360 km shell to its physically bounded interval', () => {
    const model = thermal(1.93, 2360, 'CONDITIONAL_ICE_OCEAN', 0.000191, 0.191);
    const shell = lunarConductiveShellPresentation(model, 0.11);
    expect(shell.value).toContain('1,93–245 km');
    expect(shell.value).not.toContain('2360');
    expect(shell.note).toContain('2360 km');
    expect(shell.note).toContain('35 %');
    expect(lunarInternalWaterFields(model, 0.11)
      .find(f => f.label === 'Flujo de calentamiento mareal (escenario)')?.value)
      .toContain('W/m²');
    expect(model.conductiveShellThicknessMaximumKilometers).toBe(2360);
    expect(model.oceanConfirmed).toBe(false);
    const target = moonTarget(model, 0.11, 0.62, false, 92.4);
    expect(findField(target, 'environment', 'Potencial de océano subsuperficial')?.value).toBe('0,62 / 1');
    expect(findField(target, 'habitability', 'Índice global')?.value).toBe('0,212 / 1');
    expect(MoonScientificSectionsAssembler.build(target).badges)
      .toContain('Posible océano subsuperficial (no confirmado)');
  });

  it('Nuvus C-9 II: mathematical shell starts beyond the geometrical 35%-radius limit, even though old indices say candidate', () => {
    const model = thermal(1510, 1.79e6, 'TIDAL_HEAT_INSUFFICIENT_IN_SCENARIO', 3.03e-7, 3.03e-4);
    const target = moonTarget(model, 0.475, 1, true, 56.7);
    const projected = MoonScientificSectionsAssembler.build(target);
    const shell = findField(target, 'environment', 'Espesor conductivo de hielo (escenario)');
    expect(shell?.value).toBe('Sin solución geométricamente admisible');
    expect(shell?.note).toContain('1510');
    expect(projected.badges).not.toContain('Candidata potencialmente habitable');
    expect(projected.badges.some(b => b.includes('heredada'))).toBe(true);
    expect(findField(target, 'habitability', 'Clasificación')?.value).toBe('Sin candidatura potencial');
    expect(findField(target, 'habitability', 'Clasificación')?.note).toContain('no corroborada');
    expect(findField(target, 'habitability', 'Ruta subsuperficial')?.value).toContain('No candidata');
    expect(findField(target, 'habitability', 'Índice global')?.value).toBe('0,859 / 1');
    expect(findField(target, 'habitability', 'Ruta subsuperficial')?.note).toContain('mareas modeladas');
    expect(findField(target, 'environment', 'Agua')?.value).toContain('sin soporte térmico');
    expect(model.oceanConfirmed).toBe(false);
  });

  it('Aaemoria f I: rejects a shell enormously larger than the moon, without asserting that radiogenic heating is absent', () => {
    const model = thermal(29300, 34.2e6, 'TIDAL_HEAT_INSUFFICIENT_IN_SCENARIO', 1.7e-8, 1.7e-5);
    const shell = lunarConductiveShellPresentation(model, 0.142);
    expect(shell.value).toBe('Sin solución geométricamente admisible');
    expect(shell.note).toContain('3,42E7');
    expect(shell.note).toContain('otras fuentes de calor');
    expect(model.radiogenicHeatResolved).toBe(false);
    const target = moonTarget(model, 0.142, 0.203, false, 41, false);
    expect(findField(target, 'environment', 'Potencial de océano subsuperficial')?.value).toBe('0,203 / 1');
    expect(findField(target, 'environment', 'Agua')?.value).toBe('Hielo superficial');
    expect(MoonScientificSectionsAssembler.build(target).badges
      .some(b => b.includes('océano'))).toBe(false);
  });

  it('preserves the C assessment and makes no claim when the lunar radius is unavailable', () => {
    const model = thermal(10, 200, 'CONDITIONAL_ICE_OCEAN', 1e-5, 0.01);
    expect(lunarConductiveShellPresentation(model, null).value).toBe('No evaluable sin radio lunar');
    expect(lunarConductiveShellPresentation(model, 0.2).value).toContain('10–200 km');
    expect(model.conductiveShellThicknessMaximumKilometers).toBe(200);
  });
});

// C.1a presentation regression: the V1 flag identifies a candidate only.
// Input values mirror the Livier fiche; no body-name or seed conditional is
// introduced into the production assembler.
describe('C.1a — lunar surface-liquid headline semantics', () => {
  it('keeps the Livier-like V1 index and replaces the unverified surface-liquid badge', () => {
    const assessment = thermal(0, 2.45, 'CONDITIONAL_ICE_OCEAN', 0.00199, 1.99);
    const original = moonTarget(assessment, 0.203, 1, false, 271.2);
    const target: MoonScientificResolvedTarget = {
      ...original,
      detail: {
        ...original.detail,
        environment: {
          ...original.detail.environment,
          surfaceLiquidWaterPotentialIndex01: 0.943,
          hasSurfaceLiquidWater: true,
          atmosphereAssessment: null,
        },
      },
    };
    const projected = MoonScientificSectionsAssembler.build(target);
    expect(projected.badges).toContain('Potencial de agua líquida superficial (no confirmado)');
    expect(projected.badges).not.toContain('Agua líquida superficial');
    expect(projected.badges).toContain('Posible océano subsuperficial (no confirmado)');
    expect(findField(target, 'environment', 'Potencial de agua líquida superficial')?.value).toBe('0,943 / 1');
    expect(findField(target, 'environment', 'Potencial de agua líquida superficial')?.note).toContain('no confirmado');
    expect(target.detail.environment.estimatedSurfaceTemperatureKelvin).toBe(271.2);
    expect(target.detail.environment.surfaceLiquidWaterPotentialIndex01).toBe(0.943);
    expect(assessment.oceanConfirmed).toBe(false);
  });

  it('does not reveal surface liquid from a high potential index alone', () => {
    const assessment = thermal(1.93, 2360, 'CONDITIONAL_ICE_OCEAN', 0.000191, 0.191);
    const original = moonTarget(assessment, 0.11, 0.62, false, 92.4);
    const target: MoonScientificResolvedTarget = {
      ...original,
      detail: {
        ...original.detail,
        environment: {
          ...original.detail.environment,
          surfaceLiquidWaterPotentialIndex01: 0.943,
          hasSurfaceLiquidWater: false,
        },
      },
    };
    const projected = MoonScientificSectionsAssembler.build(target);
    expect(projected.badges).not.toContain('Agua líquida superficial');
    expect(projected.badges).not.toContain('Potencial de agua líquida superficial (no confirmado)');
    expect(findField(target, 'environment', 'Potencial de agua líquida superficial')?.value).toBe('0,943 / 1');
  });
});


describe('Global lunar potential-label coherence (presentation only)', () => {
  it('describes index 0.355 as limited, not elevated, while preserving the thermal exclusion', () => {
    const assessment = thermal(0, 0, 'NO_STABLE_SURFACE_ICE', 0.000114, 0.114);
    const target = moonTarget(assessment, 0.098, 0.355, false, 919.6, false);
    const projected = findField(target, 'environment', 'Potencial de océano subsuperficial');
    expect(projected?.value).toBe('0,355 / 1');
    expect(projected?.note).toContain('estructural V1 limitado');
    expect(projected?.note).toContain('sin corteza global de hielo');
    expect(projected?.note).not.toContain('elevado');
    expect(findField(target, 'habitability', 'Ruta subsuperficial')?.value).toBe('No candidata');
  });

  it('labels every index range consistently, independent of body, seed or thermal regime', () => {
    const assessment = thermal(0, 0, 'TIDAL_HEAT_INSUFFICIENT_IN_SCENARIO', 0.0001, 0.01);
    expect(lunarSubsurfacePotentialNoteV1(0.20, false, assessment)).toContain('V1 bajo');
    expect(lunarSubsurfacePotentialNoteV1(0.35, false, assessment)).toContain('V1 limitado');
    expect(lunarSubsurfacePotentialNoteV1(0.59, false, assessment)).toContain('V1 moderado');
    expect(lunarSubsurfacePotentialNoteV1(0.90, false, assessment)).toContain('V1 alto');
    expect(lunarSubsurfacePotentialNoteV1(0, false, assessment)).toBeNull();
    expect(lunarSubsurfacePotentialNoteV1(1, true, assessment)).toContain('Candidatura oceánica condicionada');
    expect(lunarSubsurfacePotentialNoteV1(0.59, false, null)).toContain('Balance térmico no resuelto');
  });
});
