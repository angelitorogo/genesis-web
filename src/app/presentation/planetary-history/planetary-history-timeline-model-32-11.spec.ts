import { describe, expect, it } from 'vitest';
import type { PlanetaryHistorySourceEpisode32_1 } from '../../domain/planetary-history/planetary-history-32-1';
import { PlanetaryHistoryEngine } from '../../simulation/planetary-history/planetary-history-engine';
import {
  PlanetaryHistoryTimelineModel32_11, formatHistoryTime32_11,
  historyTimelineWindow32_11,
} from './planetary-history-timeline-model-32-11';

const bodyKey = 'G0/S7/O0/B2';
function episode(key: string, year: number, parents: readonly string[] = []): PlanetaryHistorySourceEpisode32_1 {
  return {
    episodeKey: key, targetBodyKind: 'PLANET', targetBodyKey: bodyKey,
    kind: key === 'impact' ? 'REALIZED_IMPACT' : 'ATMOSPHERE_TRANSITION',
    time: {timeScale:'YEARS_SINCE_SYSTEM_FORMATION',startYear:year,endYear:year,
      resolution:'MODELLED_INSTANT'},
    source: {sourcePhase:key === 'impact' ? '23.13' : '32.3',
      sourceModel:`PhysicalSource${key}`,sourceRecordKey:`record-${key}`,
      evidenceKind:'RESOLVED_PHYSICAL_EVENT'},
    causedByEpisodeKeys:parents,
  };
}
function chronology(events:readonly PlanetaryHistorySourceEpisode32_1[]=[]) {
  return PlanetaryHistoryEngine.build({bodyKind:'PLANET',bodyKey,multiplicity:'BINARY',
    time:{kind:'CURRENT_SNAPSHOT',systemAgeBillionYears:4.6},episodes:events});
}
const access = (ids:readonly string[]=[]) => ({
  perspective:'OBSERVED_KNOWLEDGE' as const, discovery:'CONFIRMED' as const,
  ficheAuthorized:true,publishedEpisodeIds:ids,
});
const internal = {perspective:'SIMULATED_REALITY' as const,
  discovery:'DETECTED' as const,ficheAuthorized:false,publishedEpisodeIds:[]};

function sample() {
  return chronology([episode('effect',300,['impact']),episode('impact',200),episode('old',100)]);
}

describe('GENESIS 32.11 — canonical history visualization and observational privacy', () => {
  it('renders no fabricated episode for an empty chronology', () => {
    const result=PlanetaryHistoryTimelineModel32_11.build(chronology(),internal);
    expect(result.rows).toEqual([]);
    expect(result.completeness).toBe('NOT_ESTABLISHED');
    expect(result.coverageLabel).toContain('no demuestran ausencia');
  });
  it('keeps chronological order and stable identities', () => {
    const first=PlanetaryHistoryTimelineModel32_11.build(sample(),internal);
    const second=PlanetaryHistoryTimelineModel32_11.build(chronology([
      episode('impact',200),episode('old',100),episode('effect',300,['impact'])]),internal);
    expect(first.rows.map(x=>x.id)).toEqual(second.rows.map(x=>x.id));
    expect(first.rows.map(x=>x.startYear)).toEqual([100,200,300]);
  });
  it('shows physical provenance and resolved/inferred nature without new inference', () => {
    const result=PlanetaryHistoryTimelineModel32_11.build(sample(),internal);
    expect(result.rows[1].evidenceLabel).toContain('resuelto');
    expect(result.rows[1].sourceLabel).toContain('23.13');
    expect(result.rows[1].title).toBe('Impacto realizado');
  });
  it('shows only real graph causes and consequences', () => {
    const view=PlanetaryHistoryTimelineModel32_11.build(sample(),internal);
    expect(view.rows[1].visibleConsequenceIds).toEqual([view.rows[2].id]);
    expect(view.rows[2].visibleCauseIds).toEqual([view.rows[1].id]);
    expect(view.rows[0].visibleCauseIds).toEqual([]);
  });
  it.each(['DETECTED','DISCOVERED','VISITED','CATALOGUED'] as const)(
    'locks historical view at %s without leaking existence or quantity', (state: 'DETECTED' | 'DISCOVERED' | 'VISITED' | 'CATALOGUED') => {
      const history=sample();
      const view=PlanetaryHistoryTimelineModel32_11.build(history,
        {...access(history.episodes.map(x=>x.episodeId)),discovery:state});
      expect(view.status).toBe('LOCKED');
      expect(view.bodyKey).toBeNull();
      expect(view.rows).toHaveLength(0);
      expect(JSON.stringify(view)).not.toContain(history.bodyKey);
      expect(JSON.stringify(view)).not.toContain('23.13');
    });
  it('locks CONFIRMED without individual fiche authorization', () => {
    const view=PlanetaryHistoryTimelineModel32_11.build(sample(),{...access(),ficheAuthorized:false});
    expect(view.status).toBe('LOCKED');
    expect(view.rows).toEqual([]);
  });
  it('does not promote CONFIRMED to automatic evidence publication', () => {
    const result=PlanetaryHistoryTimelineModel32_11.build(sample(),access());
    expect(result.status).toBe('READY');
    expect(result.rows).toEqual([]);
    expect(result.coverageLabel).toContain('Cobertura parcial');
  });
  it('does not leak hidden event dates, causes, IDs, provenance or counts', () => {
    const h=sample();
    const effect=h.episodes.find(e=>e.episodeKey==='effect')!;
    const hidden=h.episodes.find(e=>e.episodeKey==='impact')!;
    const view=PlanetaryHistoryTimelineModel32_11.build(h,access([effect.episodeId]));
    const json=JSON.stringify(view);
    expect(view.rows).toHaveLength(1);
    expect(view.rows[0].visibleCauseIds).toEqual([]);
    expect(view.rows[0].visibleConsequenceIds).toEqual([]);
    expect(json).not.toContain(hidden.episodeId);
    expect(json).not.toContain(hidden.source.sourceModel);
    expect(json).not.toContain(hidden.time.startYear.toString());
    expect(json).not.toContain('3 registros');
  });
  it('keeps published cause visible when both sides are authorized', () => {
    const h=sample();
    const ids=h.episodes.filter(x=>x.episodeKey!=='old').map(x=>x.episodeId);
    const view=PlanetaryHistoryTimelineModel32_11.build(h,access(ids));
    expect(view.rows).toHaveLength(2);
    expect(view.rows[0].visibleConsequenceIds).toEqual([view.rows[1].id]);
  });
  it('rejects duplicate and unrelated publication identifiers', () => {
    const h=sample();
    const id=h.episodes[0].episodeId;
    expect(()=>PlanetaryHistoryTimelineModel32_11.build(h,access([id,id]))).toThrow();
    expect(()=>PlanetaryHistoryTimelineModel32_11.build(h,access(['another-body']))).toThrow();
  });
  it('rejects inconsistent body identity even in a projection', () => {
    const h=sample();
    const e={...h.episodes[0],targetBodyKey:'other-world'};
    expect(()=>PlanetaryHistoryTimelineModel32_11.build({...h,episodes:[e]},internal)).toThrow();
  });
  it('rejects a noncanonical history or fabricated completeness', () => {
    const h=sample();
    expect(()=>PlanetaryHistoryTimelineModel32_11.build(
      {...h,historicalCompleteness:'COMPLETE' as 'NOT_ESTABLISHED'},internal)).toThrow();
  });
  it('does not confuse source intervals with historical instants', () => {
    expect(formatHistoryTime32_11(10,20,'INFERRED_INTERVAL')).toContain('inferido');
    expect(formatHistoryTime32_11(10,20,'MODELLED_INTERVAL')).toContain('modelado');
    expect(formatHistoryTime32_11(10,10,'MODELLED_INSTANT')).not.toContain('Intervalo');
  });
  it('makes a bounded slice irrespective of source size', () => {
    const a=Array.from({length:100_000},(_,i)=>i);
    const w=historyTimelineWindow32_11(a,500_000,456,120,4);
    expect(w.visible.length).toBeLessThanOrEqual(14);
    expect(w.visible[0]).toBe(w.start);
    expect(w.start).toBeGreaterThan(4000);
    expect(w.topPaddingPx+w.visible.length*120+w.bottomPaddingPx).toBe(100_000*120);
  });
  it('handles empty, negative scroll and bottom padding', () => {
    expect(historyTimelineWindow32_11([],0,456).visible).toEqual([]);
    expect(historyTimelineWindow32_11([1,2,3],-5,456).start).toBe(0);
    const w=historyTimelineWindow32_11([1,2,3],9999,456);
    expect(w.end).toBe(3);
    expect(w.bottomPaddingPx).toBe(0);
  });
  it('rejects nonsensical viewport arguments', () => {
    expect(()=>historyTimelineWindow32_11([1],NaN,456)).toThrow();
    expect(()=>historyTimelineWindow32_11([1],0,456,0)).toThrow();
    expect(()=>historyTimelineWindow32_11([1],0,456,120,-1)).toThrow();
  });
  it('is reproducible for SINGLE BINARY TRIPLE and moons', () => {
    for (const multiplicity of ['SINGLE','BINARY','TRIPLE'] as const) {
      for (const bodyKind of ['PLANET','MOON'] as const) {
        const h=PlanetaryHistoryEngine.build({bodyKind,bodyKey:`world-${bodyKind}`,
          multiplicity,time:{kind:'CURRENT_SNAPSHOT',systemAgeBillionYears:4.6},episodes:[]});
        expect(PlanetaryHistoryTimelineModel32_11.build(h,internal).rows).toEqual([]);
      }
    }
  });
});
