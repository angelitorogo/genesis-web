import type { MoonEnergyConfinementPRE3305 } from '../../domain/planetary/moon-energy-confinement-pre33-05';
import { lunarEnergyConfinementFieldsPRE3305 } from './moon-scientific-sections';
const fixture:MoonEnergyConfinementPRE3305 = {
  contractVersion:'PRE-33.05/V3-LUNAR-ENERGY-CONFINEMENT/v1',
  provenance:'V3_MATERIALIZED_ORBIT_INTERIOR_AND_CT0_RADIOGENIC_PRIOR',
  hostPlanetOrdinal:3,moonOrdinal:1,tidalRegime:'BOUNDED_SYNCHRONOUS_LOW_E',
  tidalResponseK2OverQMinimum:1e-5,tidalResponseK2OverQMaximum:1e-3,
  tidalPowerMinimumWatts:1e10,tidalPowerMaximumWatts:1e12,
  tidalFluxMinimumWattsPerSquareMeter:.001,tidalFluxMaximumWattsPerSquareMeter:.1,
  eccentricityDampingYearsMinimum:1e6,eccentricityDampingYearsMaximum:1e8,
  radiogenicFluxWattsPerSquareMeter:.01,totalFluxMinimumWattsPerSquareMeter:.011,
  totalFluxNominalWattsPerSquareMeter:.04,totalFluxMaximumWattsPerSquareMeter:.11,
  referenceConductiveBasalMeltingFluxWattsPerSquareMeter:.02,confinementPressurePascal:1e9,
  thermalConfinement:'ENERGY_SPANS_REFERENCE',pressureDomain:'BELOW_2_GPA',
  oceanConfirmed:false,independentThermalHistoryResolved:false,tidalResonanceSustained:false,
  scientificLimits:Object.freeze([]),
};
describe('PRE-33.05 — fichas lunares V3',()=>{
  it('añade 4 campos a la sección ambiental actual, sin ficha independiente',()=>{
    const fields=lunarEnergyConfinementFieldsPRE3305(fixture);
    expect(fields).toHaveLength(4);
    expect(fields.map(x=>x.label)).toEqual([
      'PRE-33.05 — calentamiento mareal físico',
      'PRE-33.05 — energía interna CT-0',
      'PRE-33.05 — amortiguamiento orbital',
      'PRE-33.05 — confinamiento y fusión',
    ]);
  });
  it('no inventa respuesta térmica ni océano cuando faltan entradas',()=>{
    const fields=lunarEnergyConfinementFieldsPRE3305({...fixture,
      tidalFluxMinimumWattsPerSquareMeter:null,
      tidalFluxMaximumWattsPerSquareMeter:null,
      totalFluxMinimumWattsPerSquareMeter:null,
      thermalConfinement:'UNRESOLVED_HEAT_OR_STRUCTURE',
    });
    expect(fields[0].value).toContain('No resuelto');
    expect(fields[3].value).toContain('No resuelto');
    expect(fields[3].note).toContain('No identifica un océano real');
  });
  it('no modifica fichas anteriores sin modelo V3',()=>{
    expect(lunarEnergyConfinementFieldsPRE3305(null)).toHaveLength(0);
  });
});
