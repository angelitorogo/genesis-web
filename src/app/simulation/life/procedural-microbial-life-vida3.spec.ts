import { ProceduralMicrobialLifeVIDA3 as Life } from './procedural-microbial-life-vida3';
import type { Vida3BodyIdentity } from '../../domain/life/procedural-microbial-vida3';
import type { Vida2WorldAssessment } from './life-plausibility-engine-vida2';

const base: Vida3BodyIdentity = {
  universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5', generatorVersionCode:3,
  kind:'PLANET', galaxyIndex:'0', sectorKey:'-94489280510',
  galacticObjectIndex:'0', bodyIndex:'12', moonIndex:null,
};
const assessment = (surface: 'PLAUSIBLE' | 'INDETERMINATE' | 'NOT_PLAUSIBLE',
  subsurface: 'PLAUSIBLE' | 'INDETERMINATE' | 'NOT_PLAUSIBLE'): Vida2WorldAssessment => {
  const routes = [{route:'SURFACE',classification:surface,score:surface==='PLAUSIBLE'?100:null,
    factors:{water:'FAVORABLE',temperature:'FAVORABLE',protection:'FAVORABLE',energy:'FAVORABLE'},
    explanation:'test',provenance:'test'},
  {route:'SUBSURFACE',classification:subsurface,score:subsurface==='PLAUSIBLE'?100:null,
    factors:{water:'FAVORABLE',temperature:'FAVORABLE',protection:'FAVORABLE',energy:'FAVORABLE'},
    explanation:'test',provenance:'test'}] as const;
  const classification = surface==='PLAUSIBLE'||subsurface==='PLAUSIBLE'?'PLAUSIBLE':
    surface==='INDETERMINATE'||subsurface==='INDETERMINATE'?'INDETERMINATE':'NOT_PLAUSIBLE';
  return {contract:'VIDA.2/plausibility/v2',classification,
    selectedRoute:classification==='PLAUSIBLE'?(surface==='PLAUSIBLE'?'SURFACE':'SUBSURFACE'):null,
    routes,lifeGenerated:false};
};

describe('VIDA.3 microbial Ground Truth, deterministic 20%', () => {
  it('same world + seed => identical complete snapshot even after repeated reads', () => {
    const a=Life.evaluate(base,assessment('PLAUSIBLE','PLAUSIBLE'));
    expect(Life.evaluate({...base},assessment('PLAUSIBLE','PLAUSIBLE'))).toEqual(a);
    expect(a.selectedRoute).toBe('SURFACE'); // Never two rolls for two plausible habitats.
    expect(a.biology).toBe(a.lifePresent?'MICROBIAL':'NONE');
  });
  it('indeterminate and not-plausible are never selected', () => {
    for(const v of [assessment('INDETERMINATE','NOT_PLAUSIBLE'),assessment('NOT_PLAUSIBLE','NOT_PLAUSIBLE')]){
      const s=Life.evaluate(base,v);
      expect(s.lifePresent).toBe(false);
      expect(s.biosphereId).toBeNull();
    }
  });
  it('moons, planets, sectors and universe seeds cannot collide', () => {
    const moon={...base,kind:'MOON' as const,moonIndex:'0'};
    expect(Life.evaluate(moon,assessment('NOT_PLAUSIBLE','PLAUSIBLE')).bodyStorageKey)
      .not.toBe(Life.evaluate(base,assessment('PLAUSIBLE','NOT_PLAUSIBLE')).bodyStorageKey);
    const second=Life.evaluate({...base,bodyIndex:'13'},assessment('PLAUSIBLE','NOT_PLAUSIBLE'));
    expect(second.digest).not.toBe(Life.evaluate(base,assessment('PLAUSIBLE','NOT_PLAUSIBLE')).digest);
  });
  it('approximate 20 percent frequency for a large selection, no quotas per system', () => {
    const results=Array.from({length:4096},(_,i)=>Life.evaluate({...base,bodyIndex:String(i)},assessment('PLAUSIBLE','NOT_PLAUSIBLE')));
    const count=results.filter(s=>s.lifePresent).length;
    expect(count).toBeGreaterThan(700);
    expect(count).toBeLessThan(940);
    expect(new Set(results.map(x=>x.bodyStorageKey)).size).toBe(results.length);
  });
  it('world classification and route remain physical input, not invented ecology', () => {
    const moon={...base,kind:'MOON' as const,moonIndex:'3'};
    const s=Life.evaluate(moon,assessment('INDETERMINATE','PLAUSIBLE'));
    expect(s.selectedRoute).toBe('SUBSURFACE');
    expect(s.revision).toBe('VIDA.3/microbial/v3-aquifer-lunar-surface');
    expect((s as unknown as Record<string,unknown>)['civilization']).toBeUndefined();
  });
  it('rejects V1/V2 generation and malformed moon identities', () => {
    expect(()=>Life.evaluate({...base,generatorVersionCode:2},assessment('PLAUSIBLE','NOT_PLAUSIBLE'))).toThrow();
    expect(()=>Life.evaluate({...base,kind:'MOON'},assessment('PLAUSIBLE','NOT_PLAUSIBLE'))).toThrow();
  });
});
