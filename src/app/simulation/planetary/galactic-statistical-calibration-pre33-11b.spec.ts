import { describe, expect, it } from 'vitest';
import {
  GALACTIC_STATISTICAL_CALIBRATION_PRE3311B,calibrateGalaxyOpportunityPRE3311b,
  enumerateGalacticSectorFramePRE3311b,radialRegionPRE3311b,
  type SectorDesignObservationPRE3311b,type GalacticRegionPRE3311b,
} from './galactic-statistical-calibration-pre33-11b';
const REGIONS: GalacticRegionPRE3311b[]=['CENTRAL','INNER','MIDDLE','OUTER'];
const make=(region:GalacticRegionPRE3311b,x:number,water:number,unknown=0):SectorDesignObservationPRE3311b=>({
  region,sectorX:x,sectorY:0,frameSectors:4,selectedSectors:2,locators:2,
  planets:1,detailedMoons:2,identityOnlyMoons:1,moonLiquidH2O:water,
  moonAbsentH2O:2-water-unknown,moonUnknownH2O:unknown,planetLiquidH2O:0,
  families:{ROCKY:1},architecture:'SINGLE',evidence:'SIMULATED_CT0_ONLY_NOT_BIOLOGY',
});
const fixture=()=>REGIONS.flatMap((region,i)=>[make(region,i*10,1),make(region,i*10+1,0,1)]);
describe('PRE-33.11b: inferencia sectorial conservativa',()=>{
  it('usa un marco radial sin salirse de la región física',()=>{
    const frame=enumerateGalacticSectorFramePRE3311b(12);
    for(const region of REGIONS)for(const p of frame[region])expect(radialRegionPRE3311b(p.x,p.y,12)).toBe(region);
    expect(REGIONS.reduce((a,r)=>a+frame[r].length,0)).toBeLessThan((2*12+1)**2);
    expect(radialRegionPRE3311b(12,12,12)).toBeNull();
    expect(()=>enumerateGalacticSectorFramePRE3311b(-1)).toThrow();
  });
  it('expande por N_h/n_h y número de localizadores, sin confundir sectores con planetas',()=>{
    const c=calibrateGalaxyOpportunityPRE3311b(fixture());
    expect(c.contract).toBe(GALACTIC_STATISTICAL_CALIBRATION_PRE3311B);
    expect(c.status).toBe('CALIBRATED_MODEL_OPPORTUNITY_INDICATORS');
    expect(c.expanded['planets']).toBe(32);
    expect(c.expanded['detailedMoons']).toBe(64);
    expect(c.expanded['identityOnlyMoons']).toBe(32);
    expect(c.expanded['moonLiquidH2O']).toBe(16);
    expect(c.amongDetailedMoons.point).toBe(.25);
    expect(c.amongAllMoonsLowerBound.point).toBeCloseTo(1/6);
    expect(c.potentialAllMoonEnvelope?.[1]).toBeCloseTo(2/3);
    expect(c.families['ROCKY']).toBe(32);
    expect(c.life).toBe('NOT_EVALUATED');
    expect(c.alternativeSolvents).toBe('PHASE_UNRESOLVED');
  });
  it('nunca emite intervalo [0,0] como certeza si el evento acuoso es raro',()=>{
    const zero=fixture().map(x=>({...x,moonLiquidH2O:0,moonAbsentH2O:2,moonUnknownH2O:0}));
    const c=calibrateGalaxyOpportunityPRE3311b(zero);
    expect(c.amongDetailedMoons.point).toBe(0);
    expect(c.amongDetailedMoons.interval95Approx).toBeNull();
    expect(c.potentialAllMoonEnvelope?.[1]).toBeCloseTo(1/3);
  });
  it('no otorga estimación si no hay muestra probabilística en cada región',()=>{
    const c=calibrateGalaxyOpportunityPRE3311b(fixture().slice(0,6));
    expect(c.status).toBe('INSUFFICIENT_PROBABILITY_SAMPLE');
    expect(c.amongDetailedMoons.point).toBeNull();
  });
  it('rechaza duplicados, pérdida de identidad, biología implícita y balances rotos',()=>{
    const a=fixture();
    expect(()=>calibrateGalaxyOpportunityPRE3311b([...a,a[0]])).toThrow('DUPLICATE_SECTOR');
    expect(()=>calibrateGalaxyOpportunityPRE3311b(a.map((x,i)=>i?x:{...x,moonLiquidH2O:3}))).toThrow('INVALID_DESIGN_OBSERVATION');
    expect(()=>calibrateGalaxyOpportunityPRE3311b(a.map((x,i)=>i?x:{...x,families:{ROCKY:2}}))).toThrow('PLANET_FAMILY_PARTITION_INVALID');
    expect(()=>calibrateGalaxyOpportunityPRE3311b(a.map((x,i)=>i?x:{...x,evidence:'LIFE_DETECTED' as SectorDesignObservationPRE3311b['evidence']}))).toThrow('INVALID_DESIGN_OBSERVATION');
    expect(()=>calibrateGalaxyOpportunityPRE3311b(a.map((x,i)=>i?x:{...x,frameSectors:5}))).toThrow('INCONSISTENT_FRAME');
  });
  it('conserva la entrada y produce siempre el mismo resultado congelado',()=>{
    const a=fixture(),before=JSON.stringify(a);const x=calibrateGalaxyOpportunityPRE3311b(a);
    expect(x).toEqual(calibrateGalaxyOpportunityPRE3311b(a));
    expect(Object.isFrozen(x)).toBe(true);
    expect(JSON.stringify(a)).toBe(before);
    expect(x.physicalEnergyAndRadiation).toBe('NOT_CERTIFIED');
  });
});
