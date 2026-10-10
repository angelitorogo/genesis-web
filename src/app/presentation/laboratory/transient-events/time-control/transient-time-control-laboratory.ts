import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import type {
  TransientUpdateClock,
  TransientProjectedState,
} from '../../../../domain/transient/transient-time-control-profile';
import { TransientTimeControlEngine } from '../../../../simulation/transient/transient-time-control-engine';
import { TRANSIENT_TIME_CONTROL_LABORATORY_CASES } from './transient-time-control-laboratory-fixtures';

@Component({
  selector: 'app-transient-time-control-laboratory',
  standalone: true,
  templateUrl: './transient-time-control-laboratory.html',
  styleUrl: './transient-time-control-laboratory.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransientTimeControlLaboratoryPage {
  readonly cases = TRANSIENT_TIME_CONTROL_LABORATORY_CASES;
  readonly selectedId = signal('nova');
  readonly clock = signal<TransientUpdateClock>(TransientTimeControlEngine.seekSimulation(0));
  readonly selectedCase = computed(() => this.cases.find(c => c.id === this.selectedId()) ?? this.cases[0]);
  readonly report = computed(() => TransientTimeControlEngine.update(this.clock(), this.selectedCase().scheduled));
  readonly realClockIsEnabled = computed(() => this.clock().mode === 'EXPLICIT_WALL_SAMPLE');

  selectCase(id: string): void {
    if (!this.cases.some(item => item.id === id)) return;
    this.selectedId.set(id);
    this.clock.set(TransientTimeControlEngine.seekSimulation(0));
  }
  reset(): void { this.clock.set(TransientTimeControlEngine.seekSimulation(0)); }
  seek(seconds: number): void { this.clock.set(TransientTimeControlEngine.seekSimulation(seconds)); }
  advance(seconds: number): void {
    this.clock.set(TransientTimeControlEngine.advanceSimulation(
      TransientTimeControlEngine.seekSimulation(this.report().simulationSeconds), seconds));
  }
  /**
   * Only this explicit user click may read the browser clock. No automatic
   * polling/interval, no implicit synchronization, no cross-component changes.
   */
  authorizeBrowserClock(): void {
    if (this.realClockIsEnabled()) return;
    const sampled = Date.now();
    this.clock.set({ mode: 'EXPLICIT_WALL_SAMPLE', expresslyAuthorized: true,
      anchorSimulationSeconds: this.report().simulationSeconds,
      anchorEpochMilliseconds: sampled, sampledEpochMilliseconds: sampled,
      simulationSecondsPerWallSecond: 1 });
  }
  /** Takes exactly one fresh sample, only after explicit authorization. */
  sampleBrowserClock(): void {
    const clock = this.clock();
    if (clock.mode !== 'EXPLICIT_WALL_SAMPLE') return;
    const sampled = Math.max(clock.sampledEpochMilliseconds, Date.now());
    this.clock.set({ ...clock, sampledEpochMilliseconds: sampled });
  }
  unlinkBrowserClock(): void { this.seek(this.report().simulationSeconds); }

  nextMilestone(): void {
    const now = this.report().simulationSeconds;
    const times = this.selectedCase().scheduled.flatMap(item => [
      ...(item.sourceOnsetSimulationSeconds === null ? [] : item.assessment.modelMilestones.map(
        milestone => item.sourceOnsetSimulationSeconds! + milestone.timeAfterOnsetSeconds)),
      ...(item.dueSimulationSeconds === null ? [] : [item.dueSimulationSeconds]),
    ]);
    const next = times.filter(value => value > now).sort((a, b) => a - b)[0];
    if (next !== undefined) this.seek(next);
  }
  hasNextMilestone(): boolean {
    const now = this.report().simulationSeconds;
    return this.selectedCase().scheduled.some(item =>
      (item.dueSimulationSeconds !== null && item.dueSimulationSeconds > now) ||
      (item.sourceOnsetSimulationSeconds !== null && item.assessment.modelMilestones.some(m =>
        item.sourceOnsetSimulationSeconds! + m.timeAfterOnsetSeconds > now)));
  }
  formatSeconds(seconds: number): string {
    const format = (v: number) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 3 }).format(v);
    if (seconds < 60) return `${format(seconds)} s`;
    if (seconds < 3600) return `${format(seconds / 60)} min`;
    if (seconds < 86400) return `${format(seconds / 3600)} h`;
    if (seconds < 86400 * 365.25) return `${format(seconds / 86400)} días`;
    return `${format(seconds / (86400 * 365.25))} años`;
  }
  stateLabel(state: TransientProjectedState): string {
    switch (state) {
      case 'MODEL_NOT_STARTED': return 'Modelo · todavía no comienza';
      case 'MODEL_IN_PROGRESS': return 'Modelo · fase calculada';
      case 'MODEL_END_REFERENCE': return 'Modelo · fin de referencia';
      case 'FUTURE_PENDING': return 'Predicción · todavía futura';
      case 'FUTURE_DUE_UNCONFIRMED': return 'Predicción vencida · suceso SIN confirmar';
      case 'NO_INDIVIDUAL_EVENT': return 'Sin evento individual';
      case 'OBSERVATION_ONLY_UNALIGNED': return 'Evidencia observacional · sin marco fuente';
    }
  }
}
