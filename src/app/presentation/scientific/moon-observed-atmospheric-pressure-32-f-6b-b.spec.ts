import { describe, expect, it } from 'vitest';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type { MoonAtmosphereAssessment } from '../../domain/planetary/moon-atmosphere-assessment';
import type { MoonScientificResolvedTarget } from '../../simulation/planetary/moon-scientific-target-resolver';
import type { MoonTidalState } from '../../domain/planetary/moon-tidal-state';
import { MoonAtmosphereEngine } from '../../simulation/planetary/moon-atmosphere-engine';
import { HabitabilityMoonIntegration32F6b } from '../../simulation/habitability/habitability-moon-integration-32-f-6b';
import type { HabitabilityEnvironmentContext31_2 } from '../../simulation/habitability/habitability-environment-resolver-31-2';
import { ObservedHabitabilityFiche31Fe } from './observed-habitability-fiche-31-f-e';

const BODY_KEY = 'G0/S-94310951211/O3/B2/M1';
const physical = new MoonPhysicalProperties(3, 2, 0.0225, 0.404, 1.88, 0.138);
const tide = { hostPlanetOrdinal: 3, moonOrdinal: 2,
  tidalHeatingIndex01: 0.1 } as MoonTidalState;
const independentForcing = {
  sourceKind: 'INDEPENDENT_MASS_AND_FLUXES' as const,
  sourceId: 'PRIVATE_ATMOSPHERE_BALANCE_SOURCE_32_F_6B_B',
  durationSeconds: 86400,
  collisionCrossSectionSquareMeters: 1e-19,
  gasForcings: [{ gas: AtmosphereGas.NITROGEN,
    initialGasMassKilograms: 1e18,
    replenishmentKilogramsPerSecond: 0,
    thermalEscapeKilogramsPerSecond: 0,
    particleEscapeKilogramsPerSecond: 0,
    photolysisRatePerSecond: 0,
    photolysisEscapingFraction01: 1,
  }],
};

// Reproduces the Kophara i II contract boundary: 47,915 Pa is a
// conditional atmospheric *scenario*, not an independently resolved column.
function conditional47915(): MoonAtmosphereAssessment {
  const base = MoonAtmosphereEngine.assess(physical, tide, 290, .85, .04);
  return { ...base, pressureBasis: 'CONDITIONAL_SCENARIO',
    estimatedSurfacePressurePascal: 47915, physicalBalance32F1: null };
}
function independent(): MoonAtmosphereAssessment {
  return MoonAtmosphereEngine.assess(physical, tide, 290, .85, .04, independentForcing);
}
function target(atmosphereAssessment: MoonAtmosphereAssessment): MoonScientificResolvedTarget {
  return {
    identity: { hostPlanetOrdinal: 3, moonOrdinal: 2, designation: 'PRIVATE_MOON_ID' },
    detail: {
      habitability: { overallHabitabilityIndex01: .536, surfaceHabitabilityIndex01: .1 },
      environment: {
        estimatedSurfaceTemperatureKelvin: 290,
        waterRegime: 'POTENTIAL_ONLY',
        waterInventoryIndex01: .85,
        subsurfaceOceanPotentialIndex01: .13,
        atmosphereAssessment,
        internalWaterAssessment: null,
        oceanReality32F2c: null,
      },
    },
  } as unknown as MoonScientificResolvedTarget;
}
function fiche(t: MoonScientificResolvedTarget) {
  const result = ObservedHabitabilityFiche31Fe.moon(
    t, DiscoveryState.CONFIRMED, true, BODY_KEY, 'SINGLE');
  expect(result).not.toBeNull();
  return result!;
}
function pressure(t: MoonScientificResolvedTarget) {
  const surface = fiche(t).routes.find(r => r.label === 'Agua líquida superficial')!;
  return surface.criteria.find(c => c.label === 'Presión o confinamiento')!;
}
function context(perspective: HabitabilityEnvironmentContext31_2['perspective']):
  HabitabilityEnvironmentContext31_2 {
  return { bodyKey: BODY_KEY, multiplicity: 'SINGLE', perspective,
    time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: null },
    observerAccessibleEvidence: [{ route: 'SURFACE_AQUEOUS',
      constraint: 'PRESSURE_OR_CONFINEMENT' }],
  };
}
function surfacePressureVerdict(t: MoonScientificResolvedTarget,
  perspective: HabitabilityEnvironmentContext31_2['perspective']) {
  const result = HabitabilityMoonIntegration32F6b.assess(context(perspective), t);
  return result.assessment.routes.find(r => r.route === 'SURFACE_AQUEOUS')!
    .constraints.find(c => c.constraint === 'PRESSURE_OR_CONFINEMENT')!;
}

describe('32.F.6b.b — frontera de presión observada 31.12', () => {
  it('Kophara: 47.915 Pa condicionales se muestran como escenario, no como criterio compatible', () => {
    const t = target(conditional47915());
    expect(HabitabilityMoonIntegration32F6b.hasPhysicalSurfacePressure32F1(t)).toBe(false);
    expect(pressure(t)).toMatchObject({ status: 'Desconocido', origin: 'Sin evidencia' });
    const surface = fiche(t).routes.find(r => r.label === 'Agua líquida superficial')!;
    expect(surface.facts).toContainEqual(expect.objectContaining({
      label: 'Presión del escenario atmosférico', value: '47915 Pa',
      origin: 'Inferencia condicional CT-0',
    }));
    expect(surface.facts.some(f => f.label === 'Presión del balance físico lunar 32.F.1'))
      .toBe(false);
  });

  it('el puente 31.2→31.12 elimina incluso un permiso superficial concedido por error', () => {
    const t = target(conditional47915());
    const before = JSON.stringify(t);
    const simulated = surfacePressureVerdict(t, 'SIMULATED_REALITY');
    expect(simulated).toMatchObject({ verdict: 'SUPPORTS', basis: 'INFERRED_MODEL' });
    const observed = surfacePressureVerdict(t, 'OBSERVED_KNOWLEDGE');
    expect(observed.verdict).toBe('UNRESOLVED');
    expect(observed.sourceKey).toBeNull();
    expect(JSON.stringify(t)).toBe(before);
  });

  it('un balance 32.F.1 de masa y flujos independientes sí fundamenta presión observada', () => {
    const t = target(independent());
    expect(t.detail.environment.atmosphereAssessment?.pressureBasis).toBe('PHYSICAL_BALANCE');
    expect(HabitabilityMoonIntegration32F6b.hasPhysicalSurfacePressure32F1(t)).toBe(true);
    expect(pressure(t)).toMatchObject({ status: 'Compatible', origin: 'Modelo físico' });
    expect(surfacePressureVerdict(t, 'OBSERVED_KNOWLEDGE')).toMatchObject({
      verdict: 'SUPPORTS', basis: 'PHYSICAL_MODEL',
    });
    const output = JSON.stringify(fiche(t));
    expect(output).toContain('Presión del balance físico lunar 32.F.1');
    expect(output).not.toContain(independentForcing.sourceId);
    expect(output).not.toContain('sourceKey');
    expect(output).not.toContain('gasForcings');
    expect(output).not.toContain('PRIVATE_MOON_ID');
  });

  it('una etiqueta PHYSICAL_BALANCE sin balance completo y coherente no abre la frontera', () => {
    const good = independent();
    const withoutBalance = target({ ...good, physicalBalance32F1: null });
    const mismatched = target({ ...good,
      estimatedSurfacePressurePascal: (good.estimatedSurfacePressurePascal ?? 0) + 1 });
    const missingSource = target({ ...good, physicalBalance32F1: {
      ...good.physicalBalance32F1!, sourceId: '',
    } });
    for (const t of [withoutBalance, mismatched, missingSource]) {
      expect(HabitabilityMoonIntegration32F6b.hasPhysicalSurfacePressure32F1(t)).toBe(false);
      expect(pressure(t).status).toBe('Desconocido');
      expect(surfacePressureVerdict(t, 'OBSERVED_KNOWLEDGE').verdict).toBe('UNRESOLVED');
    }
  });

  it('el sistema no confirmado nunca abre el objetivo ni consulta el estado atmosférico', () => {
    const inaccessible = new Proxy({} as MoonScientificResolvedTarget, {
      get: () => { throw new Error('Acceso privado no permitido'); },
    });
    expect(ObservedHabitabilityFiche31Fe.moon(inaccessible,
      DiscoveryState.CATALOGUED, true, BODY_KEY, 'SINGLE')).toBeNull();
    expect(ObservedHabitabilityFiche31Fe.moon(inaccessible,
      DiscoveryState.CONFIRMED, false, BODY_KEY, 'SINGLE')).toBeNull();
  });
});
