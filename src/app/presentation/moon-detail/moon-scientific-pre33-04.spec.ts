import type { MoonSubsurfaceDomainPRE3304 } from '../../domain/planetary/moon-subsurface-domain-pre33-04';
import { lunarSubsurfaceDomainFieldsPRE3304 } from './moon-scientific-sections';

const example: MoonSubsurfaceDomainPRE3304 = {
  contractVersion: 'PRE-33.04/V3-LUNAR-SUBSURFACE-DOMAIN/v1',
  provenance: 'V3_PUBLIC_PROJECTION_FROM_MATERIALIZED_32F_LUNAR_SOURCES',
  hostPlanetOrdinal: 3, moonOrdinal: 1,
  domain: 'EXTENDED_2_TO_10_GPA',
  waterMassKilograms: 1e20, shellThicknessKilometers: 200,
  basalPressurePascal: 3.65e9,
  depthAt2GPaKilometers: 120,
  depthAt10GPaKilometers: null,
  pressureProfile: [], thermalEvaluation: 'THREE_CONDITIONAL_CASES',
  thermalScenarios: [{
    thermalCase: 'NOMINAL_CT0', heatFluxWattsPerSquareMeter: .01,
    iceCoverKilometers: 35, liquidLayerKilometers: 90,
    highPressureIceKilometers: 75, liquidMassKilograms: 5e19,
    solidMassKilograms: 5e19, classification: 'CONDITIONAL_LIQUID_AND_HIGH_PRESSURE_ICE',
  }],
  actualPhaseCertified: false, actualSalinityResolved: false,
  lunarHistoryWaterBudgetResolved: false, observationalOceanConfirmed: false,
  scientificLimits: [],
};

describe('PRE-33.04 — ficha científica lunar V3 sin duplicar agua ni conocimiento', () => {
  it('explica presión, agua y geometrías condicionales en el apartado existente', () => {
    const fields = lunarSubsurfaceDomainFieldsPRE3304(example);
    expect(fields.some(x => x.label.includes('dominio físico') && x.value.includes('10 GPa'))).toBe(true);
    expect(fields.find(x => x.label.includes('presión basal'))?.value).toContain('3,65');
    expect(fields.find(x => x.label.includes('sensibilidad'))?.value).toContain('90 km');
    expect(fields.find(x => x.label.includes('certificación'))?.value).toContain('no confirmado');
  });
  it('no genera sección PRE-33.04 para fichas V1/V2 sin fuente V3', () => {
    expect(lunarSubsurfaceDomainFieldsPRE3304(null)).toEqual([]);
  });
  it('no transforma presión no evaluable en fase líquida certificada', () => {
    const fields = lunarSubsurfaceDomainFieldsPRE3304({
      ...example, domain: 'BEYOND_10_GPA_UNRESOLVED',
      thermalEvaluation: 'OUTSIDE_PRESSURE_DOMAIN', thermalScenarios: [],
    });
    expect(fields.find(x => x.label.includes('sensibilidad'))?.value).toContain('fuera del dominio');
    expect(fields.find(x => x.label.includes('certificación'))?.value).toContain('no confirmado');
  });
});
