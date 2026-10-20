import { describe, expect, it } from 'vitest';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type { MoonTidalState } from '../../domain/planetary/moon-tidal-state';
import type { MoonScientificResolvedTarget } from '../../simulation/planetary/moon-scientific-target-resolver';
import { MoonAtmosphereEngine } from '../../simulation/planetary/moon-atmosphere-engine';
import { lunarAtmosphereFields, labelLunarAtmosphere } from '../moon-detail/moon-scientific-sections';
import { ObservedHabitabilityFiche31Fe } from './observed-habitability-fiche-31-f-e';

const physical = new MoonPhysicalProperties(1, 1, 0.0225, 0.404, 1.88, 0.138);
const tidal = { hostPlanetOrdinal: 1, moonOrdinal: 1, tidalHeatingIndex01: 0.1 } as MoonTidalState;
const quantitative = {
  sourceKind: 'INDEPENDENT_MASS_AND_FLUXES' as const,
  sourceId: 'PRIVATE-PHYSICAL-SOURCE-KEY-32F1',
  durationSeconds: 365.25 * 86400,
  collisionCrossSectionSquareMeters: 1e-19,
  gasForcings: [{ gas: AtmosphereGas.NITROGEN, initialGasMassKilograms: 1e18,
    replenishmentKilogramsPerSecond: 0, thermalEscapeKilogramsPerSecond: 0,
    particleEscapeKilogramsPerSecond: 0, photolysisRatePerSecond: 0,
    photolysisEscapingFraction01: 1 }],
};
const assessment = (withSource: boolean) => MoonAtmosphereEngine.assess(
  physical, tidal, 290, 0.8, 0.01, withSource ? quantitative : null,
);
const target = (withSource: boolean) => ({
  identity: { designation: 'PRIVATE-MOON-IDENTITY' },
  detail: { environment: {
    estimatedSurfaceTemperatureKelvin: 290,
    waterRegime: 'POTENTIAL_ONLY',
    waterInventoryIndex01: 0.8,
    subsurfaceOceanPotentialIndex01: 0.2,
    atmosphereAssessment: assessment(withSource),
    internalWaterAssessment: null,
  } },
} as unknown as MoonScientificResolvedTarget);

describe('32.F.1 — consumo público solo de fuentes cuantificadas y autorizadas', () => {
  it('32.F.1c: proyecta límites físicos automáticos, pero nunca presión ni masa gaseosa deducida', () => {
    const observed = ObservedHabitabilityFiche31Fe.moon(target(false), DiscoveryState.CONFIRMED,
      true, 'G0/S0/O0/B0/M0', 'SINGLE');
    const facts = observed?.routes[0].facts ?? [];
    expect(facts.some(f => f.label === 'Velocidad de escape lunar (gravedad V2)')).toBe(true);
    expect(facts.some(f => f.label === 'Saturación de vapor H₂O (solo equilibrio hipotético)')).toBe(true);
    expect(facts.some(f => f.label === 'Masa gaseosa del intervalo 32.F.1')).toBe(false);
    expect(facts.some(f => f.label === 'Presión del balance físico lunar 32.F.1')).toBe(false);
    expect(observed?.routes[0].criteria.find(c => c.label === 'Presión o confinamiento')?.status)
      .toBe('Desconocido');
    expect(JSON.stringify(observed)).not.toContain('PRIVATE-PHYSICAL-SOURCE-KEY-32F1');
    expect(JSON.stringify(observed)).not.toContain('PRIVATE-MOON-IDENTITY');
  });

  it('no transforma el escenario V1 de retención en presión física independiente', () => {
    expect(assessment(false).physicalBalance32F1).toBeNull();
    const fields = lunarAtmosphereFields(assessment(false));
    expect(fields.find(f => f.label === 'Balance físico lunar 32.F.1')?.value)
      .toContain('No evaluable');
  });
  it('expone presión modelada específica de un mundo y nunca su identificador fuente', () => {
    const t = target(true);
    const projected = ObservedHabitabilityFiche31Fe.moon(t, DiscoveryState.CONFIRMED,
      true, 'G0/S0/O0/B0/M0', 'SINGLE');
    const facts = projected?.routes[0].facts ?? [];
    expect(facts.some(f => f.label === 'Presión del balance físico lunar 32.F.1')).toBe(true);
    expect(facts.some(f => f.label === 'Masa gaseosa del intervalo 32.F.1')).toBe(true);
    expect(projected?.routes[0].criteria.find(c => c.label === 'Presión o confinamiento')?.origin)
      .toBe('Modelo físico');
    const json = JSON.stringify(projected);
    expect(json).not.toContain(quantitative.sourceId);
    expect(json).not.toContain('PRIVATE-MOON-IDENTITY');
    expect(json).not.toContain('photolysisRatePerSecond');
    expect(projected?.routes[0].status).toBe('Evidencia insuficiente');
  });

  it('32.F.1e: el escenario de formación aparece solo autorizado y nunca certifica presión ni vida', () => {
    const formation = {
      provenance: 'DETERMINISTIC_CONDITIONAL_FORMATION_MODEL_NOT_OBSERVATION',
      hostPlanetOrdinal: physical.hostPlanetOrdinal,
      moonOrdinal: physical.moonOrdinal,
      totalMassKilograms: physical.massEarth * 5.9722e24,
      waterIceMassKilograms: 1e20,
      otherCondensableMassKilograms: 0,
    } as const;
    const atmosphere = MoonAtmosphereEngine.assess(physical, tidal, 290, 0.8, 0.01,
      null, formation as unknown as import('../../domain/planetary/moon-formation-inventory-32-f-1d').MoonFormationInventory32F1d,
      2);
    const specimen = {
      detail: { environment: {
        estimatedSurfaceTemperatureKelvin: 290,
        waterRegime: 'POTENTIAL_ONLY',
        waterInventoryIndex01: 0.8,
        subsurfaceOceanPotentialIndex01: 0.2,
        atmosphereAssessment: atmosphere,
        internalWaterAssessment: null,
      } },
    } as unknown as MoonScientificResolvedTarget;
    const publicView = ObservedHabitabilityFiche31Fe.moon(specimen, DiscoveryState.CONFIRMED,
      true, 'G0/S0/O0/B0/M0', 'SINGLE');
    expect(publicView?.routes[0].facts.some(f => f.label.includes('32.F.1'))).toBe(true);
    expect(publicView?.routes[0].facts.some(f => f.label.includes('solo escenario'))).toBe(true);
    expect(publicView?.routes[0].facts.some(f => f.label.includes('tras una órbita'))).toBe(false);
    expect(atmosphere.formationEvolution32F1e?.conditionalFinalWaterVaporPressurePascal).toBeNull();
    expect(publicView?.routes[0].criteria.find(c => c.label === 'Presión o confinamiento')?.status)
      .toBe('Desconocido');
    expect(atmosphere.physicalBalance32F1).toBeNull();
    const exposed = JSON.stringify(publicView);
    expect(exposed).not.toContain('sourceId');
    expect(exposed).not.toContain('sourceWaterIceMassKilograms');
    expect(exposed).not.toContain('CONDITIONAL_FORMATION_ENDMEMBER');
    expect(ObservedHabitabilityFiche31Fe.moon(specimen, DiscoveryState.CATALOGUED,
      true, 'G0/S0/O0/B0/M0', 'SINGLE')).toBeNull();
  });

  it('no consulta las propiedades de una luna no autorizada', () => {
    const forbidden = new Proxy({}, { get() { throw new Error('PRIVATE MOON READ'); } });
    expect(ObservedHabitabilityFiche31Fe.moon(forbidden as MoonScientificResolvedTarget,
      DiscoveryState.CATALOGUED, true, 'G0/S0/O0/B0/M0', 'SINGLE')).toBe(null);
    expect(ObservedHabitabilityFiche31Fe.moon(forbidden as MoonScientificResolvedTarget,
      DiscoveryState.CONFIRMED, false, 'G0/S0/O0/B0/M0', 'SINGLE')).toBe(null);
  });
  it('distingue masas reales cuantificadas sin cambiar la clasificación V1', () => {
    const a = assessment(true);
    const b = MoonAtmosphereEngine.assess(physical, tidal, 290, 0.8, 0.01,
      { ...quantitative, gasForcings: [{ ...quantitative.gasForcings[0], initialGasMassKilograms: 1000 }] });
    expect(labelLunarAtmosphere('TRACE', a)).toContain('estable');
    expect(labelLunarAtmosphere('TRACE', b)).toContain('Exosfera');
    expect(a.physicalBalance32F1?.surfacePressurePascal).toBeGreaterThan(b.physicalBalance32F1?.surfacePressurePascal ?? 0);
    expect(assessment(false).physicalBalance32F1).toBeNull();
  });
});
