import { describe, expect, it } from 'vitest';
import { RadiationTransportEnginePRE3308 as Engine } from './radiation-transport-engine-pre33-08';
import type { RadiationForcingPRE3308, RadiationTargetPRE3308 } from '../../domain/planetary/radiation-transport-pre33-08';
const photons:RadiationForcingPRE3308['photons']={state:'QUANTIFIED_SPECTRUM',
  sourceRecordKey:'LAB-PHOTON-SPECTRUM',spectralCoverageComplete:true,
  bands:[{energyMeV:0.1,energyFluxWattsPerSquareMeter:2,sourceRecordKey:'LAB-0.1MeV'}]};
const particles:RadiationForcingPRE3308['particles']={state:'INDEPENDENT_ABSENCE',
  sourceRecordKey:'LAB-PARTICLE-ABSENCE',spectralCoverageComplete:true,bands:[]};
const source:RadiationForcingPRE3308={epoch:'CT0',recordKey:'LAB-SOURCE',
  geometryRecordKey:'LAB-ORBIT',geometryTransmission01:0.5,photons,particles,
  durationSeconds:null,transientEventId:null};
const target:RadiationTargetPRE3308={niche:'SURFACE',targetRecordKey:'LAB-SURFACE',
  columnProfileComplete:true,responseRecordKey:'LAB-TRANSPORT',
  columnProfile:[{material:'GAS',kilogramsPerSquareMeter:1000,
    sourceRecordKey:'LAB-COLUMN',provenance:'INDEPENDENT_QUANTIFIED'}],
  responses:[{channel:'PHOTON',energyMeV:0.1,grayPerJoulePerSquareMeter:0.002,
    sourceRecordKey:'LAB-MASS-ENERGY-ABSORPTION-AND-SECONDARIES',includesSecondaryAndScattered:true}]};
describe('PRE-33.08 radiación espectral independiente',()=>{
  it('CT0: dos canales explícitos + respuesta completa -> Gy/año',()=>{
    const d=Engine.dose(source,target);
    expect(d.status).toBe('MODELLED_CT0_DOSE');
    expect(d.doseGrayPerYear).toBeCloseTo(2*0.5*0.002*365.25*86400,5);
    expect(d.eventDoseGray).toBeNull(); expect(d.lifeOrSafetyCertified).toBe(false);
  });
  it('sin fuente -> UNKNOWN, nunca dosis cero',()=>expect(Engine.dose(null,target).doseGrayPerYear).toBeNull());
  it('sin espectro de partículas: no se extrapola solo de fotones',()=>{
    const d=Engine.dose({...source,particles:{...particles,state:'UNKNOWN',sourceRecordKey:null,
      spectralCoverageComplete:false}},target);
    expect(d.status).toBe('UNKNOWN_SOURCE'); expect(d.doseGrayPerYear).toBeNull();
  });
  it('sin columna o respuesta -> UNKNOWN_TRANSPORT',()=>{
    expect(Engine.dose(source,{...target,columnProfileComplete:false}).status).toBe('UNKNOWN_TRANSPORT');
    expect(Engine.dose(source,{...target,responses:[]}).doseGrayPerYear).toBeNull();
  });
  it('sin superficie sólida: NO_SURFACE_REFERENCE',()=>{
    expect(Engine.dose(source,target,false).status).toBe('NO_SURFACE_REFERENCE');
    expect(Engine.dose(source,target,false).doseGrayPerYear).toBeNull();
  });
  it('dos bandas: exigencia exacta de respuesta por energía',()=>{
    const extended={...source,photons:{...photons,bands:[...photons.bands,
      {energyMeV:1,energyFluxWattsPerSquareMeter:0.2,sourceRecordKey:'LAB-1MeV'}]}};
    expect(Engine.dose(extended,target).status).toBe('UNKNOWN_TRANSPORT');
  });
  it('cero energía demostrado en ambos canales -> dosis nula válida',()=>{
    const absent={state:'INDEPENDENT_ABSENCE' as const,sourceRecordKey:'LAB-ABSENCE',
      spectralCoverageComplete:true,bands:[]};
    expect(Engine.dose({...source,photons:absent,particles:absent},target).doseGrayPerYear).toBe(0);
  });
  it('episodio fechado expresa Gy/evento y no Gy/año',()=>{
    const d=Engine.dose({...source,epoch:'DATED_EVENT',transientEventId:'LAB-GRB-1',
      durationSeconds:10},target);
    expect(d.status).toBe('MODELLED_TRANSIENT_EVENT');expect(d.eventDoseGray).toBeCloseTo(0.02,10);
    expect(d.doseGrayPerYear).toBeNull();
  });
  it('evento sin identificación se rechaza',()=>expect(()=>Engine.dose({...source,
    epoch:'DATED_EVENT',durationSeconds:100},target)).toThrow());
  it('no se obtiene dosis desde gamma 1MeV ni bolométrica',()=>{
    const w=Engine.world({bodyKind:'MOON',hasSolidSurface:true,surfaceGravityEarth:0.17,
      atmosphericClosure:null,lunarReference:null});
    expect(w.surface.doseGrayPerYear).toBeNull();expect(w.subsurface.doseGrayPerYear).toBeNull();
    expect(w.stellarBolometricIsIonizingSource).toBe(false);
  });
  it('sin columnas atmosféricas causales no se inventa gas',()=>{
    const w=Engine.world({bodyKind:'PLANET',hasSolidSurface:true,surfaceGravityEarth:1,
      atmosphericClosure:null});expect(w.atmosphereColumn).toBeNull();
    expect(w.photonSource).toBe('UNRESOLVED');
  });
  it('reproducibilidad bit a bit y fuentes trazadas',()=>{
    expect(JSON.stringify(Engine.dose(source,target))).toBe(JSON.stringify(Engine.dose(source,target)));
    expect(Engine.dose(source,target).sourceRecordKeys).toContain('LAB-COLUMN');
  });
});
describe('PRE-33.08 proyección CT-0 completa',()=>{
 it('fuente independiente y respuesta calibrada se transportan al mundo V3',()=>{
  const w=Engine.world({bodyKind:'PLANET',hasSolidSurface:true,surfaceGravityEarth:1,
    atmosphericClosure:null,forcing:source,targets:{SURFACE:target}});
  expect(w.surface.status).toBe('MODELLED_CT0_DOSE');
  expect(w.surface.doseGrayPerYear).not.toBeNull();
  expect(w.observationallyConfirmed).toBe(false);
 });
});
