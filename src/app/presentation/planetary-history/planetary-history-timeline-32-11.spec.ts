import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PlanetaryHistoryEngine } from '../../simulation/planetary-history/planetary-history-engine';
import type { PlanetaryHistorySourceEpisode32_1 } from '../../domain/planetary-history/planetary-history-32-1';
import { PlanetaryHistoryTimelineModel32_11 } from './planetary-history-timeline-model-32-11';
import { PlanetaryHistoryTimeline32_11 } from './planetary-history-timeline-32-11';

function history(count: number) {
  const events: PlanetaryHistorySourceEpisode32_1[] = Array.from({length:count},(_,i)=>({
    episodeKey:`case-${i}`,targetBodyKind:'PLANET',targetBodyKey:'planet-fixture',
    kind:i%2===0?'REALIZED_IMPACT':'WATER_RESERVOIR_TRANSITION',
    time:{timeScale:'YEARS_SINCE_SYSTEM_FORMATION',startYear:i+1,endYear:i+1,
      resolution:'MODELLED_INSTANT'},
    source:{sourcePhase:'32.8',sourceModel:'SyntheticUnitTest',
      sourceRecordKey:`case-${i}`,evidenceKind:'RESOLVED_PHYSICAL_EVENT'},
    causedByEpisodeKeys:[],
  }));
  return PlanetaryHistoryEngine.build({bodyKind:'PLANET',bodyKey:'planet-fixture',
    multiplicity:'SINGLE',time:{kind:'CURRENT_SNAPSHOT',systemAgeBillionYears:4.6},
    episodes:events});
}
async function mount() {
  await TestBed.configureTestingModule({imports:[PlanetaryHistoryTimeline32_11]}).compileComponents();
  return TestBed.createComponent(PlanetaryHistoryTimeline32_11);
}

describe('32.11 Angular timeline / observation and virtual DOM',()=>{
  it('does not render any event when history is locked',async()=>{
    const fixture=await mount();
    fixture.componentRef.setInput('timeline',PlanetaryHistoryTimelineModel32_11.build(history(5),{
      perspective:'OBSERVED_KNOWLEDGE',discovery:'CATALOGUED',ficheAuthorized:false,
      publishedEpisodeIds:[],
    }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-testid="history-row"]')).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('[data-testid="history-locked"]')).not.toBeNull();
  });
  it('renders only explicitly published events and lets the user inspect them',async()=>{
    const fixture=await mount();
    const canonical=history(5);
    const visibleId=canonical.episodes[0].episodeId;
    fixture.componentRef.setInput('timeline',PlanetaryHistoryTimelineModel32_11.build(canonical,{
      perspective:'OBSERVED_KNOWLEDGE',discovery:'CONFIRMED',ficheAuthorized:true,
      publishedEpisodeIds:[visibleId],
    }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-testid="history-row"]')).toHaveLength(1);
    const button:HTMLButtonElement=fixture.nativeElement.querySelector('[data-testid="history-row"]');
    button.click(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="history-details"]')).not.toBeNull();
  });
  it('keeps the DOM bounded for a large, scrolled chronology',async()=>{
    const fixture=await mount();
    fixture.componentRef.setInput('timeline',PlanetaryHistoryTimelineModel32_11.build(history(5000),{
      perspective:'SIMULATED_REALITY',discovery:'DETECTED',ficheAuthorized:false,
      publishedEpisodeIds:[],
    }));
    fixture.detectChanges();
    const viewport:HTMLElement=fixture.nativeElement.querySelector('[data-testid="history-viewport"]');
    expect(fixture.nativeElement.querySelectorAll('[data-testid="history-row"]').length).toBeLessThan(20);
    viewport.scrollTop=300_000;
    viewport.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-testid="history-row"]').length).toBeLessThan(20);
    expect(fixture.nativeElement.textContent).toContain('Cobertura parcial');
  });
});
