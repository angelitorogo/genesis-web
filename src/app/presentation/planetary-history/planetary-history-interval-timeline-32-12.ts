import type { PlanetaryHistoryIntervalRequest32_12 } from '../../domain/planetary-history/planetary-history-interval-32-12';
import type { PlanetaryHistoryIntervalEngine32_12 } from '../../simulation/planetary-history/planetary-history-interval-engine-32-12';
import {
  PlanetaryHistoryTimelineModel32_11,
} from './planetary-history-timeline-model-32-11';
import type {
  HistoryTimelineView32_11,
  HistoryTimelineVisibility32_11,
} from './planetary-history-timeline-model-32-11';

/**
 * 32.12 presentation boundary for a requested interval. In OBSERVED_KNOWLEDGE,
 * refuse access BEFORE touching private physical catalogs or their cache.
 * Published IDs outside the requested slice are ignored; the original 32.11
 * projector still enforces exact per-episode authorization and causal filtering.
 */
export class PlanetaryHistoryIntervalTimeline32_12 {
  private constructor() {}

  static build(
    engine: PlanetaryHistoryIntervalEngine32_12,
    request: PlanetaryHistoryIntervalRequest32_12,
    visibility: HistoryTimelineVisibility32_11,
  ): HistoryTimelineView32_11 {
    if (!visibility || !Array.isArray(visibility.publishedEpisodeIds) ||
      !['SIMULATED_REALITY', 'OBSERVED_KNOWLEDGE'].includes(visibility.perspective)) {
      throw new TypeError('Timeline requires an explicit scientific-knowledge perspective.');
    }
    if (visibility.perspective === 'OBSERVED_KNOWLEDGE' &&
      (visibility.discovery !== 'CONFIRMED' || !visibility.ficheAuthorized)) {
      return Object.freeze({
        contractVersion: '32.11-CT0', mode: 'OBSERVED', status: 'LOCKED',
        bodyKind: null, bodyKey: null, rows: Object.freeze([]),
        coverageLabel: 'La cronología científica requiere confirmación y autorización de ficha.',
        completeness: 'NOT_ESTABLISHED',
      });
    }
    const result = engine.read(request);
    const localIds = new Set(result.chronology.episodes.map(e => e.episodeId));
    const localPublished = visibility.perspective === 'OBSERVED_KNOWLEDGE'
      ? visibility.publishedEpisodeIds.filter(id => localIds.has(id))
      : [];
    return PlanetaryHistoryTimelineModel32_11.build(result.chronology, {
      ...visibility, publishedEpisodeIds: localPublished,
    });
  }
}
