import { describe, expect, it } from 'vitest';
import { Vida2PhysicalInput } from './life-plausibility-physical-adapter-vida2';
import { ProceduralMicrobialLifeVIDA3 } from './procedural-microbial-life-vida3';
import { VIDA3_LIFE_ROLL_NAMESPACE, VIDA3_MODEL_REVISION } from '../../domain/life/procedural-microbial-vida3';
import type { PlanetScientificResolvedTarget } from '../planetary/planet-scientific-target-resolver';
import type { MoonScientificResolvedTarget } from '../planetary/moon-scientific-target-resolver';

const planet = (extra: Record<string, unknown> = {}) => ({detail: {
  atmosphere: {isDeepEnvelope:false,retainedSurfacePressurePascal:90000},
  surface: {hasPersistentSurfaceLiquidWater:false,waterInventoryIndex01:.75,
    waterLiquidFraction01:0, surfaceLiquidWaterCoverageFraction01:0,
    hasDefinedSolidSurfaceBase:true},
  general: {condensedIceMassFraction01:.2},
  climate: {meanSurfaceTemperatureKelvin:225},
  orbit: {referenceMeanInsolationEarth:.05},
  geology: {isGeologicallyActive:true,geologicalActivityIndex01:.65,
    internalHeatRetentionIndex01:.62},
  ...extra,
}} as unknown as PlanetScientificResolvedTarget);

const moon = (extra: Record<string, unknown> = {}) => ({detail: {
  environment: { estimatedSurfaceTemperatureKelvin:282,
    referenceMeanInsolationEarth:.6,hasSurfaceLiquidWater:false,
    surfaceLiquidWaterPotentialIndex01:.16,waterInventoryIndex01:.4,
    hasAtmosphere:true, atmosphereRetentionIndex01:.24,
    geologicalActivityIndex01:.48,isGeologicallyActive:true,
    inferredIceRichnessIndex01:.2,subsurfaceOceanPotentialIndex01:.1,
    oceanReality32F2c:{state:'UNRESOLVED_IN_SIMULATED_MODEL',
      generatedTotalSurfaceHeatFluxWattsPerSquareMeter:null,
      iceCoverThicknessKilometers:null},
    ...extra,
  },
  tides:{tidalHeatingIndex01:.52},
  habitability:{surfaceAtmosphereSupportIndex01:.4},
}} as unknown as MoonScientificResolvedTarget);

const id={universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
  generatorVersionCode:3, kind:'MOON' as const,galaxyIndex:'0',sectorKey:'11',
  galacticObjectIndex:'0',bodyIndex:'2',moonIndex:'0'};

describe('VIDA.3b — roca planetaria y superficie lunar protegida',()=>{
  it('planeta frío con inventario H2O y calor geológico positivo: acuífero potencial, no océano certificado',()=>{
    const p=planet(); const original=JSON.stringify(p);
    const result=Vida2PhysicalInput.planet(p);
    expect(result.routes[0].classification).not.toBe('PLAUSIBLE');
    expect(result.routes[1].classification).toBe('PLAUSIBLE');
    expect(result.selectedRoute).toBe('SUBSURFACE');
    expect(result.routes[1].factors.water).toBe('MARGINAL');
    expect(result.routes[1].factors.energy).toBe('MARGINAL');
    expect(JSON.stringify(p)).toBe(original);
  });
  it('no inventa acuíferos si falla agua, calor o roca',()=>{
    const dry=Vida2PhysicalInput.planet(planet({surface:{hasPersistentSurfaceLiquidWater:false,
      waterInventoryIndex01:0,waterLiquidFraction01:0,hasDefinedSolidSurfaceBase:true},
      general:{condensedIceMassFraction01:0}}));
    expect(dry.routes[1].classification).not.toBe('PLAUSIBLE');
    const cold=Vida2PhysicalInput.planet(planet({geology:{isGeologicallyActive:false,
      geologicalActivityIndex01:0,internalHeatRetentionIndex01:0}}));
    expect(cold.routes[1].classification).not.toBe('PLAUSIBLE');
    const gaseous=Vida2PhysicalInput.planet(planet({atmosphere:{isDeepEnvelope:true,
      retainedSurfacePressurePascal:1000000}}));
    expect(gaseous.routes[1].classification).toBe('NOT_PLAUSIBLE');
  });
  it('luna templada con salmuera protegida: superficie plausible solo en microhábitat',()=>{
    const m=moon();const original=JSON.stringify(m);
    const assessment=Vida2PhysicalInput.moon(m);
    expect(assessment.routes[0].classification).toBe('PLAUSIBLE');
    expect(assessment.routes[0].factors.protection).toBe('MARGINAL');
    expect(assessment.routes[0].surfaceMicrohabitatKind).toBe('PROTECTED_SEEP');
    const snap=ProceduralMicrobialLifeVIDA3.evaluate(id,assessment);
    expect(snap.selectedRoute).toBe('SURFACE');
    expect(snap.habitat).toBe('SURFACE_PROTECTED_SEEP');
    expect(JSON.stringify(m)).toBe(original);
  });
  it('luna fría, seca, sin mareas o sin confinamiento: nunca superficie plausible',()=>{
    for(const changes of [
      {estimatedSurfaceTemperatureKelvin:50},
      {waterInventoryIndex01:.02},
      {geologicalActivityIndex01:.05,isGeologicallyActive:false},
      {atmosphereRetentionIndex01:0,hasAtmosphere:false},
    ]) {
      const result=Vida2PhysicalInput.moon(moon(changes));
      expect(result.routes[0].classification).not.toBe('PLAUSIBLE');
    }
    const m=moon();
    const weak=Vida2PhysicalInput.moon({detail:{...m.detail,
      tides:{tidalHeatingIndex01:0}}} as unknown as MoonScientificResolvedTarget);
    expect(weak.routes[0].classification).not.toBe('PLAUSIBLE');
  });
  it('presión lunar condicional nunca se transforma en presión física',()=>{
    const result=Vida2PhysicalInput.moon(moon({atmosphereAssessment:{
      estimatedSurfacePressurePascal:1000000,pressureBasis:'CONDITIONAL_SCENARIO',
    }}));
    expect(result.routes[0].factors.protection).toBe('MARGINAL');
  });
  it('misma identidad y semilla: única tirada del 20 %, versión nueva sin reescribir anteriores',()=>{
    const a=Vida2PhysicalInput.moon(moon());
    const first=ProceduralMicrobialLifeVIDA3.evaluate(id,a);
    expect(ProceduralMicrobialLifeVIDA3.evaluate(id,a)).toEqual(first);
    expect(VIDA3_MODEL_REVISION).toBe('VIDA.3/microbial/v3-aquifer-lunar-surface');
    expect(VIDA3_LIFE_ROLL_NAMESPACE).toBe('VIDA.3/microbial/v1');
    expect(first.biology).toBe(first.lifePresent?'MICROBIAL':'NONE');
  });
});
