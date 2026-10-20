import type {
  PlanetaryHistoryChronology32_1,
  PlanetaryHistoryEpisode32_1,
  PlanetaryHistoryEpisodeKind32_1,
} from '../../domain/planetary-history/planetary-history-32-1';

/**
 * 32.11 — A READ-ONLY visualization projection, never historical ground truth.
 * The observer projection is constructed from an explicit publication allow-list:
 * CONFIRMED alone never publishes physical history.  Hidden event counts, dates,
 * IDs and causal references must not leak through the resulting view model.
 */
export interface HistoryTimelineVisibility32_11 {
  readonly perspective: 'SIMULATED_REALITY' | 'OBSERVED_KNOWLEDGE';
  readonly discovery: 'DETECTED' | 'DISCOVERED' | 'VISITED' | 'CATALOGUED' | 'CONFIRMED';
  readonly ficheAuthorized: boolean;
  /** Exact 32.1 episodeIds whose scientific evidence has been made observable. */
  readonly publishedEpisodeIds: readonly string[];
}

export interface HistoryTimelineRow32_11 {
  readonly id: string;
  readonly kind: PlanetaryHistoryEpisodeKind32_1;
  readonly title: string;
  readonly startYear: number;
  readonly endYear: number;
  readonly timeLabel: string;
  readonly evidenceLabel: string;
  readonly sourceLabel: string;
  /** Only publicly visible connections in OBSERVED_KNOWLEDGE. */
  readonly visibleCauseIds: readonly string[];
  readonly visibleConsequenceIds: readonly string[];
  readonly causeText: string;
  readonly consequenceText: string;
}

export interface HistoryTimelineView32_11 {
  readonly contractVersion: '32.11-CT0';
  readonly mode: 'INTERNAL' | 'OBSERVED';
  readonly status: 'LOCKED' | 'READY';
  readonly bodyKind: 'PLANET' | 'MOON' | null;
  readonly bodyKey: string | null;
  readonly rows: readonly HistoryTimelineRow32_11[];
  readonly coverageLabel: string;
  readonly completeness: 'NOT_ESTABLISHED';
}

const LABELS: Record<PlanetaryHistoryEpisodeKind32_1, string> = {
  FORMATION: 'Formación planetaria', ACCRETION: 'Acreción de material',
  INTERIOR_COOLING: 'Enfriamiento interno', DIFFERENTIATION: 'Diferenciación interna',
  ATMOSPHERE_TRANSITION: 'Transición atmosférica',
  WATER_RESERVOIR_TRANSITION: 'Transformación del agua',
  GLACIATION_TRANSITION: 'Glaciación o deshielo',
  VOLCANIC_EPISODE: 'Actividad volcánica',
  CLIMATE_GEOCHEMISTRY_TRANSITION: 'Cambio climático o geoquímico',
  STELLAR_ENVIRONMENT_CHANGE: 'Cambio del entorno estelar',
  REALIZED_IMPACT: 'Impacto realizado',
  RESOLVED_TRANSIENT_EFFECT: 'Efecto de transitorio resuelto',
};

const GAP_NOTICE = 'Cobertura parcial: los intervalos sin registros visibles no demuestran ausencia de acontecimientos. La historia completa no está establecida.';

export class PlanetaryHistoryTimelineModel32_11 {
  private constructor() {}

  static build(
    chronology: PlanetaryHistoryChronology32_1,
    visibility: HistoryTimelineVisibility32_11,
  ): HistoryTimelineView32_11 {
    if (!chronology || chronology.contractVersion !== '32.1-CT0' ||
      chronology.layer !== 'SIMULATED_REALITY' ||
      chronology.historicalCompleteness !== 'NOT_ESTABLISHED' ||
      chronology.coverage !== 'SUPPLIED_EPISODES_ONLY' ||
      !Array.isArray(chronology.episodes)) {
      throw new RangeError('32.11 requires a canonical 32.1 CT-0 chronology.');
    }
    if (!visibility || !Array.isArray(visibility.publishedEpisodeIds)) {
      throw new TypeError('32.11 requires explicit observational authorization.');
    }
    const isObserved = visibility.perspective === 'OBSERVED_KNOWLEDGE';
    if (!isObserved && visibility.perspective !== 'SIMULATED_REALITY') {
      throw new RangeError('Invalid history projection perspective.');
    }
    if (isObserved && (visibility.discovery !== 'CONFIRMED' || !visibility.ficheAuthorized)) {
      // Do not expose bodyKey, dates, event totals or hidden IDs while locked.
      return Object.freeze({
        contractVersion: '32.11-CT0', mode: 'OBSERVED', status: 'LOCKED',
        bodyKind: null, bodyKey: null, rows: Object.freeze([]),
        coverageLabel: 'La cronología científica requiere confirmación y autorización de ficha.',
        completeness: 'NOT_ESTABLISHED',
      });
    }
    const all: readonly PlanetaryHistoryEpisode32_1[] = chronology.episodes;
    const byId = new Map<string, PlanetaryHistoryEpisode32_1>();
    for (const episode of all) {
      if (byId.has(episode.episodeId) || episode.targetBodyKey !== chronology.bodyKey ||
        episode.targetBodyKind !== chronology.bodyKind) {
        throw new RangeError('32.11 refuses inconsistent episode identity or duplicate IDs.');
      }
      byId.set(episode.episodeId, episode);
    }
    const published = new Set(visibility.publishedEpisodeIds);
    if (published.size !== visibility.publishedEpisodeIds.length) {
      throw new RangeError('Repeated published episodeId.');
    }
    for (const id of published) {
      if (!byId.has(id)) throw new RangeError('Authorization references an unknown historical episode.');
    }
    const visible = isObserved ? all.filter(e => published.has(e.episodeId)) : all;
    const visibleIds = new Set(visible.map(e => e.episodeId));
    const children = new Map<string, string[]>();
    for (const episode of visible) children.set(episode.episodeId, []);
    for (const episode of visible) {
      for (const cause of episode.causedByEpisodeIds) {
        if (visibleIds.has(cause)) children.get(cause)!.push(episode.episodeId);
      }
    }
    const rows = visible.map((episode): HistoryTimelineRow32_11 => {
      const parents = episode.causedByEpisodeIds.filter(id => visibleIds.has(id));
      const descendants = children.get(episode.episodeId)!;
      return Object.freeze({
        id: episode.episodeId, kind: episode.kind, title: LABELS[episode.kind],
        startYear: episode.time.startYear, endYear: episode.time.endYear,
        timeLabel: formatHistoryTime32_11(episode.time.startYear, episode.time.endYear,
          episode.time.resolution),
        evidenceLabel: episode.source.evidenceKind === 'RESOLVED_PHYSICAL_EVENT'
          ? 'Acontecimiento físico resuelto' : 'Episodio físico inferido',
        sourceLabel: `${episode.source.sourcePhase} · ${episode.source.sourceModel}`,
        visibleCauseIds: Object.freeze([...parents]),
        visibleConsequenceIds: Object.freeze([...descendants]),
        causeText: parents.length > 0
          ? `${parents.length} causa(s) visible(s) vinculada(s)`
          : 'Sin causa demostrada en los registros accesibles',
        consequenceText: descendants.length > 0
          ? `${descendants.length} consecuencia(s) visible(s) vinculada(s)`
          : 'Sin consecuencia demostrada en los registros accesibles',
      });
    });
    return Object.freeze({
      contractVersion: '32.11-CT0', mode: isObserved ? 'OBSERVED' : 'INTERNAL',
      status: 'READY', bodyKind: chronology.bodyKind, bodyKey: chronology.bodyKey,
      rows: Object.freeze(rows), coverageLabel: GAP_NOTICE,
      completeness: 'NOT_ESTABLISHED',
    });
  }
}

export function formatHistoryTime32_11(
  start: number, end: number,
  resolution: 'MODELLED_INSTANT' | 'MODELLED_INTERVAL' | 'INFERRED_INTERVAL',
): string {
  const fmt = (x: number): string => `${x.toLocaleString('es-ES')} años desde formación`;
  if (resolution === 'MODELLED_INSTANT') return fmt(start);
  const prefix = resolution === 'INFERRED_INTERVAL' ? 'Intervalo inferido' : 'Intervalo modelado';
  return `${prefix}: ${fmt(start)} – ${fmt(end)}`;
}

/** Fixed-height viewport model. Rendering complexity depends on page size, not N. */
export interface TimelineWindow32_11<T> {
  readonly start: number;
  readonly end: number;
  readonly topPaddingPx: number;
  readonly bottomPaddingPx: number;
  readonly visible: readonly T[];
}

export function historyTimelineWindow32_11<T>(
  rows: readonly T[], scrollTopPx: number, viewportHeightPx: number,
  rowHeightPx = 120, overscan = 4,
): TimelineWindow32_11<T> {
  if (!Number.isFinite(scrollTopPx) || !Number.isFinite(viewportHeightPx) ||
    !Number.isSafeInteger(rowHeightPx) || rowHeightPx <= 0 ||
    !Number.isSafeInteger(overscan) || overscan < 0) {
    throw new RangeError('Invalid virtual timeline viewport.');
  }
  const safeScroll = Math.min(Math.max(0, scrollTopPx), rows.length * rowHeightPx);
  const first = Math.floor(safeScroll / rowHeightPx);
  const start = Math.max(0, first - overscan);
  const size = Math.ceil(Math.max(1, viewportHeightPx) / rowHeightPx) + 1;
  const end = Math.min(rows.length, first + size + overscan);
  return {
    start, end, topPaddingPx: start * rowHeightPx,
    bottomPaddingPx: (rows.length - end) * rowHeightPx,
    visible: rows.slice(start, end),
  };
}
