import { ChangeDetectionStrategy, Component, computed, ElementRef, input, signal, viewChild } from '@angular/core';
import {
  historyTimelineWindow32_11,
  type HistoryTimelineRow32_11,
  type HistoryTimelineView32_11,
} from './planetary-history-timeline-model-32-11';

/** GENESIS 32.11: virtualized, read-only timeline. No physics or discovery transitions. */
@Component({
  selector: 'app-planetary-history-timeline',
  standalone: true,
  templateUrl: './planetary-history-timeline-32-11.html',
  styleUrl: './planetary-history-timeline-32-11.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanetaryHistoryTimeline32_11 {
  readonly timeline = input<HistoryTimelineView32_11 | null>(null);
  readonly category = signal<'ALL' | 'EVENTS' | 'PROCESSES'>('ALL');
  readonly scrollTop = signal(0);
  readonly viewportElement = viewChild<ElementRef<HTMLElement>>('viewport');
  readonly selectedId = signal<string | null>(null);

  readonly filtered = computed(() => {
    const rows = this.timeline()?.rows ?? [];
    const category = this.category();
    if (category === 'ALL') return rows;
    const eventKinds = new Set(['REALIZED_IMPACT', 'RESOLVED_TRANSIENT_EFFECT']);
    return rows.filter(row => category === 'EVENTS'
      ? eventKinds.has(row.kind) : !eventKinds.has(row.kind));
  });
  readonly visibleWindow = computed(() => historyTimelineWindow32_11(
    this.filtered(), this.scrollTop(), 456, 120, 4));
  readonly byId = computed(() => new Map((this.timeline()?.rows ?? []).map(row => [row.id, row])));
  readonly selected = computed(() => this.byId().get(this.selectedId() ?? '') ?? null);
  readonly selectedCauses = computed(() => this.relatedRows(this.selected()?.visibleCauseIds ?? []));
  readonly selectedEffects = computed(() => this.relatedRows(this.selected()?.visibleConsequenceIds ?? []));

  setFilter(value: 'ALL' | 'EVENTS' | 'PROCESSES'): void {
    this.category.set(value);
    this.scrollTop.set(0);
    const viewport = this.viewportElement()?.nativeElement;
    if (viewport) viewport.scrollTop = 0;
    this.selectedId.set(null);
  }
  onScroll(event: Event): void {
    this.scrollTop.set((event.target as HTMLElement).scrollTop);
  }
  toggleSelection(row: HistoryTimelineRow32_11): void {
    this.selectedId.update(previous => previous === row.id ? null : row.id);
  }
  private relatedRows(ids: readonly string[]): readonly HistoryTimelineRow32_11[] {
    return ids.map(id => this.byId().get(id)).filter(
      (row): row is HistoryTimelineRow32_11 => row !== undefined);
  }
}
