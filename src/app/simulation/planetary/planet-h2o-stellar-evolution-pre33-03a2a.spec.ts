import {describe,it,expect} from 'vitest';
import type {Planet} from '../../domain/planetary/planet';
import type {Atmosphere} from '../../domain/planetary/atmosphere';
import type {PlanetH2OStellarInputPRE3303A2A} from '../../domain/planetary/planet-h2o-stellar-evolution-pre33-03a2a';
import {PlanetH2OFormationEnginePRE3303A} from './planet-h2o-formation-engine-pre33-03a';
import {PlanetH2OStellarEvolutionPRE3303A2A as engine} from './planet-h2o-stellar-evolution-pre33-03a2a';
import {validatePlanetH2OEvolutionPRE3303A1} from '../../domain/planetary/planet-h2o-evolution-contract-pre33-03a1';
const make=(temperature:number|null=285)=>{
  const locator={galaxyIndex:0n,sectorKey:12n,galacticObjectIndex:2n,bodyIndex:0n};
  const planet={name:'PRE-33.03a.2a test',planetOrdinal:1,locator,
    seed:{kind:'body',normalizedValue:'7F21A9D418CE4B7092F16A0C6E35D8B5'},
    orbit:{semiMajorAxisAu:1,eccentricity:.04},
    physicalProperties:{massEarth:2,radiusEarth:1.2,accretedEnvelopeMassEarth:.2,surfaceGravityMetersPerSecondSquared:13.625},
    internalComposition:{metallicCoreMassEarth:.4,silicateInteriorMassEarth:.8,
      condensedIceMassEarth:.4,volatileRichInteriorMassEarth:.2,gaseousEnvelopeMassEarth:.2}} as unknown as Planet;
  const p=temperature===null?null:80000;
  const atmosphere={hostPlanet:planet,retentionState:{bodyLocator:locator,planetOrdinal:1,retainedSurfacePressurePascal:p},
    climateState:{planetOrdinal:1,meanSurfaceTemperatureKelvin:temperature},
    climateVariabilityState:{planetOrdinal:1,sourceRetainedSurfacePressurePascal:p},
    waterInventory:{bodyLocator:locator,planetOrdinal:1,sourceRetainedSurfacePressurePascal:p,
      waterInventoryIndex01:.5,surfaceLiquidWaterCoverageFraction01:temperature===null?null:.1,
      surfaceIceCoverageFraction01:temperature===null?null:.2},
    greenhouseEffect:{condensableEquilibriumState:p===null?null:{converged:true,sourceSurfacePressurePascal:p,
      effectiveSurfacePressurePascal:p,effectiveGasComponents:[{gas:'NITROGEN',moleFraction01:.98},
        {gas:'WATER_VAPOR',moleFraction01:.02}],speciesEquilibria:[]},waterVaporEquilibriumState:null}} as unknown as Atmosphere;
  return {planet,atmosphere,formation:PlanetH2OFormationEnginePRE3303A.project(planet,atmosphere)};
};
const MS:PlanetH2OStellarInputPRE3303A2A={
  ageBillionYears:4,massSolar:1,initialMassSolar:1,luminositySolar:1,
  mainSequenceLifetimeBillionYears:10,postMainSequenceDurationBillionYears:1,
  evolutionState:'MAIN_SEQUENCE',stellarState:'MAIN_SEQUENCE',
  sourceRecordKey:'FROZEN_HOST_15_3/G0/S12/O2/A',orbitalFluxGeometry:'HOST_CIRCUMSTELLAR',
  luminosityBasis:'FROZEN_15_1_REFERENCE_NOT_HISTORICAL_TRACK',
};
const scenario=(h:PlanetH2OStellarInputPRE3303A2A,t:number|null=285)=>{
  const a=make(t);return engine.project(a.planet,a.atmosphere,a.formation,h);
};
describe('PRE-33.03a.2a — stellar stages and dated H2O model (INTERNAL)',()=>{
  it('reusa el motor MS anterior sin cambiar trayectoria',()=>{
    const a=scenario(MS);expect(a.status).toBe('MODELED_DATED_CONDITIONAL_MAIN_SEQUENCE');
    expect(a.mainSequenceReference?.evolution).toEqual(a.evolution);
    expect(a.evolution?.massBalance.conditionalConservationVerified).toBe(true);
  });
  it('gigante deriva cambio de fase 14.8 en la fecha MS, nunca evento inventado',()=>{
    const h={...MS,ageBillionYears:10.4,stellarState:'GIANT' as const,evolutionState:'OTHER' as const};
    const a=scenario(h);expect(a.status).toBe('MODELED_DATED_CONDITIONAL_GIANT');
    expect(a.phaseBoundaries.mainSequenceEndYear).toBe(10e9);
    expect(a.history?.segments.some(s=>s.startYear===10e9)).toBe(true);
    expect(a.history?.segments.at(-1)?.endYear).toBe(10.4e9);
    expect(a.ct0Certified).toBe(false);
  });
  it('supergigante solo escenario radiativo, no presupone XUV observado',()=>{
    const h={...MS,ageBillionYears:10.7,stellarState:'SUPERGIANT' as const,evolutionState:'OTHER' as const};
    const a=scenario(h);expect(a.status).toBe('MODELED_DATED_CONDITIONAL_SUPERGIANT');
    expect(a.radiativeModel).toBe('POST_MS_LUMINOSITY_HYPOTHESIS');
    expect(validatePlanetH2OEvolutionPRE3303A1(a.evolution!)).toEqual([]);
  });
  it('enana blanca usa el límite terminal, sin proyectar su luz actual al MS',()=>{
    const h={...MS,ageBillionYears:12,stellarState:'WHITE_DWARF' as const,evolutionState:'OTHER' as const};
    const a=scenario(h);expect(a.status).toBe('MODELED_DATED_CONDITIONAL_WHITE_DWARF');
    expect(a.phaseBoundaries.terminalYear).toBe(11e9);
    expect(a.history?.segments.some(s=>s.startYear===11e9)).toBe(true);
    expect(a.history?.segments.at(-1)?.xuvEscape?.sourceRecordKey).toContain('WHITE_DWARF');
    expect(a.orbitalHistory).toBe('FROZEN_ORBIT_APPROXIMATION_NOT_MASS_LOSS_EVOLUTION');
  });
  it('no asume enfriamiento enana marrón cuando 14.8 no da vida MS',()=>{
    const h={...MS,stellarState:'BROWN_DWARF' as const,evolutionState:'OTHER' as const,
      mainSequenceLifetimeBillionYears:null,postMainSequenceDurationBillionYears:null};
    expect(scenario(h).status).toBe('UNRESOLVED_BROWN_DWARF_COOLING');
  });
  it('NS y BH no reciben espectros XUV fabricados',()=>{
    for(const stellarState of ['NEUTRON_STAR','STELLAR_BLACK_HOLE'] as const){
      const h={...MS,ageBillionYears:12,stellarState,evolutionState:'OTHER' as const};
      const a=scenario(h);expect(a.status).toBe('UNRESOLVED_COMPACT_HIGH_ENERGY_HISTORY');
      expect(a.history).toBeNull();
    }
  });
  it('geometrías múltiples necesitan cálculo separado PRE-33.03a.2b',()=>{
    const h={...MS,ageBillionYears:12,stellarState:'WHITE_DWARF' as const,evolutionState:'OTHER' as const,
      orbitalFluxGeometry:'UNRESOLVED_MULTIPLE_FLUX' as const};
    expect(scenario(h).status).toBe('UNRESOLVED_MULTIPLE_HOST_GEOMETRY');
  });
  it('no inventa agua líquida en una superficie fría',()=>{
    const h={...MS,ageBillionYears:12,stellarState:'WHITE_DWARF' as const,evolutionState:'OTHER' as const};
    const a=scenario(h,170);expect(a.evolution?.reservoirs.SURFACE_LIQUID).toBe(0);
  });
  it('sin superficie definida no transforma una envoltura en océano',()=>{
    const h={...MS,ageBillionYears:12,stellarState:'WHITE_DWARF' as const,evolutionState:'OTHER' as const};
    const a=scenario(h,null);expect(a.status).toBe('UNRESOLVED_SURFACE_DOMAIN');expect(a.evolution).toBeNull();
  });
  it('rechaza estrellas de otra galaxia, aunque edad y masa coincidan',()=>{
    expect(()=>scenario({...MS,sourceRecordKey:'FROZEN_HOST_15_3/G1/S12/O2/A'})).toThrow(/FOREIGN/);
  });
  it('rechaza edad NaN, masa y referencia estelar no trazable',()=>{
    expect(()=>scenario({...MS,ageBillionYears:NaN})).toThrow(/INVALID/);
    expect(()=>scenario({...MS,luminosityBasis:'FAKE' as never})).toThrow(/INVALID/);
  });
  it('rechaza evolución incompatible con los límites de fase',()=>{
    expect(scenario({...MS,ageBillionYears:1,stellarState:'GIANT',evolutionState:'OTHER'}).history).toBeNull();
    expect(scenario({...MS,ageBillionYears:10.5,stellarState:'WHITE_DWARF',evolutionState:'OTHER'}).history).toBeNull();
  });
  it('rechaza una fase congelada contradictoria con el estado declarado',()=>{
    expect(scenario({...MS,stellarState:'GIANT'}).status).toBe('UNRESOLVED_STELLAR_SOURCE_OR_TIMELINE');
  });
  it('conserva exactamente balance condicional entre CT0 y escape',()=>{
    const h={...MS,ageBillionYears:12,stellarState:'WHITE_DWARF' as const,evolutionState:'OTHER' as const};
    const a=scenario(h);expect(validatePlanetH2OEvolutionPRE3303A1(a.evolution!)).toEqual([]);
    expect(a.observedEvidenceGranted).toBe(false);expect(a.lifeEvaluated).toBe(false);
  });
  it('repite historia bit a bit con los mismos datos y no utiliza PRNG',()=>{
    const h={...MS,ageBillionYears:12,stellarState:'WHITE_DWARF' as const,evolutionState:'OTHER' as const};
    expect(JSON.stringify(scenario(h))).toEqual(JSON.stringify(scenario(h)));
  });
});
