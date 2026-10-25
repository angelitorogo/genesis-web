import { describe, expect, it } from 'vitest';
import type { Planet } from '../../domain/planetary/planet';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import { PlanetH2OFormationEnginePRE3303A } from './planet-h2o-formation-engine-pre33-03a';
import { validatePlanetH2OFormationPRE3303A } from '../../domain/planetary/planet-h2o-formation-contract-pre33-03a';

const KEY = '7F21A9D418CE4B7092F16A0C6E35D8B5';
function sources(opts: { deep?: boolean; temp?: number; p?: number; seed?: string;
  ice?: number; volatile?: number; silicate?: number; waterMole?: number } = {}) {
  const { deep=false, temp=288, p=90000, seed=KEY, ice=.5,
    volatile=.2, silicate=.8, waterMole=0.01 } = opts;
  const loc={galaxyIndex:0n,sectorKey:12n,galacticObjectIndex:2n,bodyIndex:0n};
  const envelope=.1;
  const total=ice+volatile+silicate+.4+envelope;
  const planet={name:'PRE33a test',planetOrdinal:1,locator:loc,seed:{kind:'body',normalizedValue:seed},
    physicalProperties:{massEarth:total,radiusEarth:1.2,accretedEnvelopeMassEarth:envelope,
      surfaceGravityMetersPerSecondSquared:12},
    internalComposition:{metallicCoreMassEarth:.4,silicateInteriorMassEarth:silicate,
      condensedIceMassEarth:ice,volatileRichInteriorMassEarth:volatile,gaseousEnvelopeMassEarth:envelope}
  } as unknown as Planet;
  const eff=deep?null:p;
  const phase=deep?null:{converged:true,sourceSurfacePressurePascal:p,effectiveSurfacePressurePascal:p,
    effectiveGasComponents:[{gas:'NITROGEN',moleFraction01:1-waterMole},
      {gas:'WATER_VAPOR',moleFraction01:waterMole}],speciesEquilibria:[]};
  const atm={hostPlanet:planet,
    retentionState:{bodyLocator:loc,planetOrdinal:1,retainedSurfacePressurePascal:eff},
    climateState:{planetOrdinal:1,meanSurfaceTemperatureKelvin:deep?null:temp},
    climateVariabilityState:{planetOrdinal:1,sourceRetainedSurfacePressurePascal:eff},
    waterInventory:{bodyLocator:loc,planetOrdinal:1,sourceRetainedSurfacePressurePascal:eff,
      waterInventoryIndex01:0.7,surfaceLiquidWaterCoverageFraction01:deep?null:0.3,
      surfaceIceCoverageFraction01:deep?null:.1},
    greenhouseEffect:{condensableEquilibriumState:phase,waterVaporEquilibriumState:null}
  } as unknown as Atmosphere;
  return {planet,atm};
}
const project=(arg:ReturnType<typeof sources>)=>PlanetH2OFormationEnginePRE3303A.project(arg.planet,arg.atm);
const close=(a:number,b:number)=>Math.abs(a-b)<=Math.max(1,Math.abs(a),Math.abs(b))*1e-11;

describe('PRE-33.03a — formación H2O con química explícita, NO vida CT0', () => {
  it('parte de cubos físicos 19.5 pero distingue especies H2O, no toda la masa helada',()=>{
    const x=project(sources());
    expect(x.formation.iceH2OFraction01).toBeGreaterThan(.55);
    expect(x.formation.iceH2OFraction01).toBeLessThan(.90);
    expect(x.formation.otherIceCarrierKilograms).toBeGreaterThan(0);
    expect(x.formation.otherVolatileCarrierKilograms).toBeGreaterThan(0);
    expect(x.formation.drySilicateCarrierKilograms).toBeGreaterThan(0);
    expect(x.formation.iceCarrierH2OKilograms).toBeGreaterThan(0);
  });
  it('conserva cada fuente (hielos, volátiles y minerales)',()=>{
    const f=project(sources()).formation;
    expect(close(f.iceBearingCarrierKilograms,f.iceCarrierH2OKilograms+f.otherIceCarrierKilograms)).toBe(true);
    expect(close(f.volatileRichCarrierKilograms,f.volatileCarrierH2OKilograms+f.otherVolatileCarrierKilograms)).toBe(true);
    expect(close(f.silicateCarrierKilograms,f.silicateBoundH2OKilograms+f.drySilicateCarrierKilograms)).toBe(true);
    expect(close(f.modeledFormationH2OKilograms,f.iceCarrierH2OKilograms+f.volatileCarrierH2OKilograms+f.silicateBoundH2OKilograms)).toBe(true);
  });
  it('se reproduce con semilla sin lecturas de PRNG ni modificar fuentes',()=>{
    const pair=sources();const a=project(pair);const b=project(pair);
    expect(a).toEqual(b); expect(Object.isFrozen(a)).toBe(true);
    expect(Object.isFrozen(a.formation)).toBe(true);
  });
  it('distintas semillas cambian composición sin tocar 19.5',()=>{
    const a=project(sources()), b=project(sources({seed:'1'.repeat(32)}));
    expect(a.formation.iceBearingCarrierKilograms).toBe(b.formation.iceBearingCarrierKilograms);
    expect(a.formation.iceH2OFraction01).not.toBe(b.formation.iceH2OFraction01);
  });
  it('no deriva kg de agua del índice V1 ni de cobertura 20.7',()=>{
    const s=sources();const a=project(s);
    (s.atm.waterInventory as any).waterInventoryIndex01=.01;
    (s.atm.waterInventory as any).surfaceLiquidWaterCoverageFraction01=.95;
    const b=project(s);
    expect(a.formation).toEqual(b.formation);
    expect(b.current.surfaceLiquidH2OKilograms).toBeNull();
  });
  it('reserva fase superficial hasta resolver pérdidas/transporte',()=>{
    const x=project(sources());
    expect(x.current.conditionalH2OInMatureCarriersKilograms).toBe(x.formation.modeledFormationH2OKilograms);
    expect(x.current.retainedH2OKilograms).toBeNull();
    expect(x.current.escapedH2OKilograms).toBeNull();
    expect(x.current.surfaceLiquidH2OKilograms).toBeNull();
    expect(x.current.subsurfaceLiquidH2OKilograms).toBeNull();
    expect(x.current.interiorBoundH2OKilograms).toBeNull();
    expect(x.physicalCT0WaterConserved).toBe(false);
    expect(x.lifeEvaluated).toBe(false);
  });
  it('un balance hipotético de vapor sin pérdida cierra sin declarar océano',()=>{
    const x=project(sources());
    expect(x.closedReference.status).toBe('CONDITIONAL_BALANCE');
    expect(x.closedReference.referenceVaporKilograms).toBeGreaterThan(0);
    expect(close(x.closedReference.referenceVaporKilograms!+x.closedReference.unallocatedNonVaporKilograms!,x.formation.modeledFormationH2OKilograms)).toBe(true);
    expect(x.current.atmosphericVaporH2OKilograms).toBeNull();
  });
  it('columna atmosférica mayor que H2O de formación NO se recorta silenciosamente',()=>{
    const x=project(sources({ice:0,volatile:0,silicate:0,waterMole:.99}));
    expect(x.closedReference.status).toBe('NO_COUPLED_VAPOR_SOURCE');
    expect(x.closedReference.referenceVaporKilograms).toBeNull();
    expect(x.current.atmosphericVaporH2OKilograms).toBeNull();
  });
  it('envoltura profunda mantiene speciation de sólido pero sin océano ni columna de vapor',()=>{
    const x=project(sources({deep:true}));
    expect(x.formation.modeledFormationH2OKilograms).toBeGreaterThan(0);
    expect(x.current.conditionalVaporReferenceKilograms).toBeNull();
    expect(x.closedReference.status).toBe('NO_COUPLED_VAPOR_SOURCE');
    expect(x.current.surfaceWindow).toBe('NOT_RESOLVED');
  });
  it('ventana térmica cercana a 288 K y presión atmosférica posible NO indica océano',()=>{
    const x=project(sources());
    expect(x.current.surfaceWindow).toBe('SURFACE_LIQUID_REFERENCE_POSSIBLE');
    expect(x.current.surfaceLiquidH2OKilograms).toBeNull();
    expect(x.habitableEnvironmentCertified).toBe(false);
  });
  it('presión menor que triple point desfavorece líquido',()=>{
    expect(project(sources({p:300})).current.surfaceWindow).toBe('SURFACE_LIQUID_REFERENCE_DISFAVORED');
  });
  it('temperatura fría desfavorece líquido de superficie sin descartar subsuelo',()=>{
    const x=project(sources({temp:170}));
    expect(x.current.surfaceWindow).toBe('SURFACE_LIQUID_REFERENCE_DISFAVORED');
    expect(x.current.subsurfaceLiquidH2OKilograms).toBeNull();
  });
  it('temperatura o presión fuera de EOS superficial son no resueltas',()=>{
    expect(project(sources({temp:800})).current.surfaceWindow).toBe('NOT_RESOLVED');
    expect(project(sources({p:30_000_000})).current.surfaceWindow).toBe('NOT_RESOLVED');
  });
  it('rechaza presión incorrecta antes de calcular H2O',()=>{
    const s=sources();(s.atm.waterInventory as any).sourceRetainedSurfacePressurePascal=101;
    expect(()=>project(s)).toThrow(/PRE-33.02 coherent/);
  });
  it('rechaza masas 19.5 no conservadas',()=>{
    const s=sources();(s.planet.internalComposition as any).condensedIceMassEarth=2;
    expect(()=>project(s)).toThrow(/budget is inconsistent/);
  });
  it('rechaza semillas malformadas',()=>{
    const s=sources({seed:'BAD'});expect(()=>project(s)).toThrow(/valid frozen BodySeed/);
  });
  it('validador detecta generación fraudulenta de CT0 y corrupción de balances',()=>{
    const x=project(sources());expect(validatePlanetH2OFormationPRE3303A(x)).toEqual([]);
    const bad={...x,current:{...x.current,surfaceLiquidH2OKilograms:1e20}} as any;
    expect(validatePlanetH2OFormationPRE3303A(bad)).toContain('UNSUPPORTED_CT0_WATER_PROMOTION');
    const bad2={...x,formation:{...x.formation,otherIceCarrierKilograms:0}} as any;
    expect(validatePlanetH2OFormationPRE3303A(bad2)).toContain('FORMATION_SPECIES_MASS_NOT_CONSERVED');
  });
});
