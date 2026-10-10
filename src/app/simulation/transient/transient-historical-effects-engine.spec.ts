import { TransientHistoricalEffectsEngine as Engine, ASTRONOMICAL_UNIT_METERS_29_11 as AU } from './transient-historical-effects-engine';
import { type HistoricalTargetBody, type HistoricalTransientEvent } from '../../domain/transient/transient-historical-effects-profile';
const body: HistoricalTargetBody = {
  id:'planet', label:'Planeta',kind:'PLANET',separationAu:1,effectiveOpticalDepth:null,biosphereCharacterized:false,
};
const sample: HistoricalTransientEvent = {
  id:'flare', label:'Llamarada explícita',family:'STELLAR_FLARE', state:'PAST_INTRINSIC_EXPLICIT',
  yearsBeforeReference:300,photonEnergyJoules:1e24,band:'UV', geometry:'ISOTROPIC_TOTAL',sourceDurationSeconds:100,
};
const assess = (b=body,e=sample) => Engine.assessEvent(b,e);

describe('29.11 · historia física sin daños biológicos inventados',()=>{
  it('calcula 1/r², fluencia de fotones en TOA y potencia media, no pico ni dosis',()=>{
    const a=assess();
    expect(a.state).toBe('TOA_RESOLVED_ATMOSPHERE_UNRESOLVED');
    expect(a.topOfAtmosphereFluenceJoulesPerSquareMeter).toBeCloseTo(1e24/(4*Math.PI*AU**2),7);
    expect(a.meanTopOfAtmosphereFluxWattsPerSquareMeter).toBeCloseTo(1e24/(4*Math.PI*AU**2)/100,7);
    expect(a.transmittedFluenceJoulesPerSquareMeter).toBeNull();
    expect(assess({...body,separationAu:2}).topOfAtmosphereFluenceJoulesPerSquareMeter!)
      .toBeCloseTo(a.topOfAtmosphereFluenceJoulesPerSquareMeter!/4,8);
    expect(a.biosphereResponse).toBe('NOT_DERIVED');
    expect(a.atmosphereEvolution).toBe('NOT_DERIVED');
    expect(a.inventedPlanetaryMutations).toBe(0);
  });
  it('no interpreta una duración ausente como un flujo medio nulo',()=>{
    const a=assess(body,{...sample,sourceDurationSeconds:null});
    expect(a.topOfAtmosphereFluenceJoulesPerSquareMeter).not.toBeNull();
    expect(a.meanTopOfAtmosphereFluxWattsPerSquareMeter).toBeNull();
  });
  it('aplica τ solo cuando la profundidad óptica de ESA banda es explícita',()=>{
    const result=assess({...body,effectiveOpticalDepth:2});
    expect(result.state).toBe('BAND_ATTENUATION_RESOLVED');
    expect(result.transmittedFluenceJoulesPerSquareMeter)
      .toBeCloseTo(result.topOfAtmosphereFluenceJoulesPerSquareMeter!*Math.exp(-2),8);
    const lunar=assess({...body,kind:'MOON',effectiveOpticalDepth:0});
    expect(lunar.transmittedFluenceJoulesPerSquareMeter)
      .toBe(lunar.topOfAtmosphereFluenceJoulesPerSquareMeter);
  });
  it('bloquea un jet sin eje aunque exista una energía isotrópica equivalente',()=>{
    expect(assess(body,{...sample,geometry:'BEAM_ORIENTATION_UNKNOWN'}).state).toBe('GEOMETRY_UNRESOLVED');
    expect(assess(body,{...sample,geometry:'BEAM_ORIENTATION_UNKNOWN'}).topOfAtmosphereFluenceJoulesPerSquareMeter).toBeNull();
    expect(assess(body,{...sample,geometry:'BEAM_INTERSECTION_EXPLICIT'}).topOfAtmosphereFluenceJoulesPerSquareMeter).not.toBeNull();
  });
  it('rechaza espectro ausente y distancia ausente sin tratarlos como cero',()=>{
    expect(assess(body,{...sample,photonEnergyJoules:null,band:null}).state).toBe('NO_RADIANT_SPECTRUM');
    expect(assess({...body,separationAu:null}).state).toBe('DISTANCE_UNRESOLVED');
    expect(assess({...body,separationAu:null}).topOfAtmosphereFluenceJoulesPerSquareMeter).toBeNull();
  });
  it('no crea exposición desde una tasa ni desde una fusión futura',()=>{
    for(const state of ['STATISTICAL_ONLY','FUTURE_CANONICAL','UNCONFIRMED_CANDIDATE'] as const){
      const e={...sample,state,yearsBeforeReference:null,photonEnergyJoules:null,band:null,sourceDurationSeconds:null};
      expect(assess(body,e).state).toBe('NO_INDIVIDUAL_PAST_EVENT');
      expect(assess(body,e).topOfAtmosphereFluenceJoulesPerSquareMeter).toBeNull();
    }
  });
  it('ordena exclusivamente épocas explícitas y suma únicamente subtotales de la misma banda',()=>{
    const e2={...sample,id:'two',yearsBeforeReference:100,photonEnergyJoules:2e24};
    const e3={...sample,id:'three',yearsBeforeReference:200,photonEnergyJoules:null,band:null};
    const e4={...sample,id:'other',yearsBeforeReference:null,band:'GAMMA' as const};
    const rep=Engine.assess(body,[e2,e4,e3,sample]);
    expect(rep.events.map(e=>e.eventId)).toEqual(['flare','three','two','other']);
    expect(rep.knownBandSubtotals.find(e=>e.band==='UV')?.contributingEventCount).toBe(2);
    expect(rep.knownBandSubtotals.find(e=>e.band==='GAMMA')?.contributingEventCount).toBe(1);
    expect(rep.unresolvedPastEventCount).toBe(1);
    expect(rep.historicalCompleteness).toBe('PARTIAL_ONLY');
    expect(rep.eventCountPersisted).toBe(0);
    expect(rep.alteredAtmospheres).toBe(0);
    expect(rep.alteredBiospheres).toBe(0);
  });
  it('no inventa efectos biológicos aunque la biosfera esté caracterizada',()=>{
    const outcome=assess({...body,biosphereCharacterized:true,effectiveOpticalDepth:1});
    expect(outcome.biosphereResponse).toBe('NOT_DERIVED');
    expect(outcome.atmosphereEvolution).toBe('NOT_DERIVED');
  });
  it('rechaza distancias, energías, atenuaciones, edades y duraciones inválidas',()=>{
    for(const separationAu of [0,-1,Number.NaN,Number.POSITIVE_INFINITY])
      expect(()=>assess({...body,separationAu})).toThrow(RangeError);
    for(const effectiveOpticalDepth of [-0.1, Number.NaN, Number.POSITIVE_INFINITY])
      expect(()=>assess({...body,effectiveOpticalDepth})).toThrow(RangeError);
    for(const photonEnergyJoules of [-1,0,Number.NaN])
      expect(()=>assess(body,{...sample,photonEnergyJoules})).toThrow(RangeError);
    expect(()=>assess(body,{...sample,yearsBeforeReference:-3})).toThrow(RangeError);
    expect(()=>assess(body,{...sample,sourceDurationSeconds:0})).toThrow(RangeError);
    expect(()=>assess(body,{...sample,band:null})).toThrow(RangeError);
  });
  it('no permite convertir predicción o estadística en evento con energía histórica',()=>{
    expect(()=>assess(body,{...sample,state:'FUTURE_CANONICAL'})).toThrow(RangeError);
    expect(()=>assess(body,{...sample,state:'STATISTICAL_ONLY'})).toThrow(RangeError);
  });
  it('impide identificadores repetidos y desbordamientos numéricos',()=>{
    expect(()=>Engine.assess(body,[sample,sample])).toThrow(RangeError);
    expect(()=>assess({...body,separationAu:1e-250},{...sample,photonEnergyJoules:1e300})).toThrow(RangeError);
    expect(()=>assess({...body,separationAu:1e308})).toThrow(RangeError);
  });
});
