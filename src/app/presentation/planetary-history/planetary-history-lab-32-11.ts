import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { PlanetaryHistorySourceEpisode32_1 } from '../../domain/planetary-history/planetary-history-32-1';
import { PlanetaryHistoryEngine } from '../../simulation/planetary-history/planetary-history-engine';
import {
  PlanetaryHistoryTimelineModel32_11,
  type HistoryTimelineVisibility32_11,
} from './planetary-history-timeline-model-32-11';
import { PlanetaryHistoryTimeline32_11 } from './planetary-history-timeline-32-11';

/**
 * Laboratory fixtures ONLY. This route cannot persist, observe or create canonical
 * planet history. Its synthetic events exist exclusively to test UI/virtualization.
 */
@Component({
  selector: 'app-planetary-history-lab', standalone: true,
  imports: [RouterLink, PlanetaryHistoryTimeline32_11],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="lab-history">
      <a routerLink="/laboratory">← Laboratorios GENESIS</a>
      <header>
        <small>GENESIS WEB · LABORATORIO 32.11</small>
        <h1>Timeline de historia planetaria</h1>
        <p class="lab-history__warning">DEMOSTRACIÓN SINTÉTICA: los episodios de esta página son fixtures de prueba, no sucesos del universo generado ni evidencias descubiertas.</p>
      </header>
      <div class="lab-history__controls">
        <button type="button" (click)="mode.set('SIMULATED_REALITY')"
          [attr.aria-pressed]="mode() === 'SIMULATED_REALITY'">Vista interna de prueba</button>
        <button type="button" (click)="mode.set('OBSERVED_KNOWLEDGE')"
          [attr.aria-pressed]="mode() === 'OBSERVED_KNOWLEDGE'">Conocimiento publicado</button>
        <button type="button" (click)="large.set(!large())">{{ large() ? '5 episodios' : '5.000 episodios sintéticos' }}</button>
      </div>
      <app-planetary-history-timeline [timeline]="timeline()" />
    </main>
  `,
  styles: [`
    :host{display:block;min-height:100dvh;background:#080e18;color:#f0f7ff}
    .lab-history{display:grid;gap:1.2rem;width:min(100% - 2rem,1100px);margin:0 auto;padding:2rem 0 5rem}
    a{color:#6ad7ff;text-decoration:none;font-size:.85rem}
    header small{font:700 .7rem monospace;color:#6ad7ff}
    h1{margin:.25rem 0;font-size:clamp(1.5rem,3vw,2.6rem)}
    .lab-history__warning{border-left:3px solid #ecad58;background:#342715;padding:.8rem;line-height:1.5}
    .lab-history__controls{display:flex;flex-wrap:wrap;gap:.7rem}
    button{padding:.7rem;border:1px solid #45738c;border-radius:8px;color:#eaf7fc;background:#132230;cursor:pointer}
    button[aria-pressed=true]{background:#1b4b63}button:focus-visible{outline:2px solid #6ad7ff}
  `],
})
export class PlanetaryHistoryLab32_11 {
  readonly mode = signal<HistoryTimelineVisibility32_11['perspective']>('OBSERVED_KNOWLEDGE');
  readonly large = signal(false);
  readonly chronology = computed(() => this.buildFixture(this.large() ? 5000 : 5));
  readonly timeline = computed(() => {
    const history = this.chronology();
    const published = history.episodes.filter((_, i) => i % 2 === 0)
      .map(e => e.episodeId);
    return PlanetaryHistoryTimelineModel32_11.build(history, {
      perspective: this.mode(), discovery: 'CONFIRMED',
      ficheAuthorized: true, publishedEpisodeIds: published,
    });
  });

  private buildFixture(count: number) {
    const kind = 'PLANET' as const;
    const bodyKey = 'LAB-32.11-ONLY';
    const types = ['FORMATION', 'ACCRETION', 'ATMOSPHERE_TRANSITION',
      'REALIZED_IMPACT', 'CLIMATE_GEOCHEMISTRY_TRANSITION'] as const;
    const episodes: PlanetaryHistorySourceEpisode32_1[] = Array.from(
      { length: count }, (_, i) => {
        const start = 100 + i * 30;
        const isInferred = i % 5 < 2;
        return {
          episodeKey: `lab-event-${i}`, targetBodyKind: kind,
          targetBodyKey: bodyKey, kind: types[i % types.length],
          time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION' as const,
            startYear: start, endYear: isInferred ? start + 12 : start,
            resolution: isInferred ? 'INFERRED_INTERVAL' as const : 'MODELLED_INSTANT' as const },
          source: { sourcePhase: isInferred ? '32.2' : '32.8',
            sourceModel: 'SyntheticTimelineLaboratoryFixture',
            sourceRecordKey: `lab-${i}`,
            evidenceKind: isInferred ? 'INFERRED_PHYSICAL_EPISODE' as const
              : 'RESOLVED_PHYSICAL_EVENT' as const },
          causedByEpisodeKeys: i > 0 && i % 5 !== 0 ? [`lab-event-${i - 1}`] : [],
        };
      });
    return PlanetaryHistoryEngine.build({ bodyKind: kind, bodyKey,
      multiplicity: 'SINGLE', time: {
        kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 4.6,
      }, episodes });
  }
}
