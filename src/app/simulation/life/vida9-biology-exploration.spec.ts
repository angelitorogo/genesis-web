import {describe,it,expect} from 'vitest';
import {Vida9BiologyExploration} from './vida9-biology-exploration';
import {vida9TestSources} from './vida9-test-fixture';
import {VIDA9_REVEAL_POLICY} from '../../domain/life/vida9-biology-exploration';


describe('VIDA.9 CT-0 y política de acceso',()=>{
  it('reproduce identidad, revision, resultados y CT-0 sin reloj ni mutación',()=>{
    const sources=vida9TestSources();const a=Vida9BiologyExploration.evaluate(...[
      sources.ecosystem,sources.intelligence,sources.colonization] as const);
    const b=Vida9BiologyExploration.evaluate(...[
      sources.ecosystem,sources.intelligence,sources.colonization] as const);
    expect(b).toEqual(a);
    expect(a.epoch).toBe('CT-0');expect(a.epochOffsetYears).toBe(0);
    expect(a.historicalOriginEpochYears).toBeNull();
    expect(a.revealPolicy).toBe(VIDA9_REVEAL_POLICY);
    expect(a.nativeLifePresent).toBe(true);expect(a.nativeCivilizationPresent).toBe(false);
    expect(a.colonialPopulationPresent).toBe(false);
    expect(a.colonization).toBe(sources.colonization);
  });
  it('no filtra información a sistemas no confirmados',()=>{
    expect(Vida9BiologyExploration.mayReveal(4,5)).toBe(false);
    expect(Vida9BiologyExploration.mayReveal(5,5)).toBe(true);
    expect(Vida9BiologyExploration.mayReveal(6,5)).toBe(true);
  });
  it('rechaza identidades cruzadas, discrepancias de procedencia y promociones ficticias',()=>{
    const s=vida9TestSources();
    expect(()=>Vida9BiologyExploration.evaluate(s.ecosystem,
      {...s.intelligence,identity:{...s.intelligence.identity,bodyIndex:'5'}},s.colonization)).toThrow();
    expect(()=>Vida9BiologyExploration.evaluate(s.ecosystem,s.intelligence,
      {...s.colonization,nativeLifePresent:false})).toThrow();
    expect(()=>Vida9BiologyExploration.evaluate(s.ecosystem,s.intelligence,
      {...s.colonization,nativeCivilizationDigest:'other'})).toThrow();
  });
});
