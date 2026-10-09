import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  TransientFollowUpClassification as Classification,
  TransientFollowUpFamily as Family,
  TransientFollowUpOrigin as Origin,
  type TransientFollowUpFamily,
  type TransientFollowUpClassification,
} from '../../../../domain/transient/transient-follow-up-profile';
import { TransientFollowUpEngine } from '../../../../simulation/transient/transient-follow-up-engine';
import { TRANSIENT_FOLLOW_UP_LABORATORY_CASES } from './transient-follow-up-laboratory-fixtures';

@Component({
  selector: 'app-transient-follow-up-laboratory',
  standalone: true,
  templateUrl: './transient-follow-up-laboratory.html',
  styleUrl: './transient-follow-up-laboratory.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransientFollowUpLaboratoryPage {
  readonly cases = TRANSIENT_FOLLOW_UP_LABORATORY_CASES;
  readonly selectedId = signal('nova');
  readonly modelTimeSeconds = signal(0);
  readonly selectedCase = computed(() => this.cases.find(item => item.id === this.selectedId()) ?? this.cases[0]);
  readonly track = computed(() => this.selectedCase().assessment);
  readonly activeModelMilestone = computed(() =>
    TransientFollowUpEngine.modelPhaseAt(this.track(), this.modelTimeSeconds()));
  readonly origin = Origin;

  selectCase(id: string): void {
    if (!this.cases.some(item => item.id === id)) return;
    this.selectedId.set(id);
    this.modelTimeSeconds.set(0);
  }
  selectSourceTime(time: number): void { this.modelTimeSeconds.set(time); }

  formatTime(seconds: number): string {
    if (seconds === 0) return 't = 0';
    const format = (v: number) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 3 }).format(v);
    if (seconds < 1) return `${format(seconds * 1000)} ms`;
    if (seconds < 60) return `${format(seconds)} s`;
    if (seconds < 3600) return `${format(seconds / 60)} min`;
    if (seconds < 86400) return `${format(seconds / 3600)} h`;
    return `${format(seconds / 86400)} días`;
  }

  percent(time: number, times: readonly number[]): number {
    const max = Math.max(0, ...times);
    return max > 0 ? 100 * time / max : 0;
  }
  modelPercent(seconds: number): number {
    return this.percent(seconds, this.track().modelMilestones.map(item => item.timeAfterOnsetSeconds));
  }
  observerPercent(seconds: number): number {
    return this.percent(seconds, this.track().observations.map(item => item.timeAfterObserverReferenceSeconds));
  }

  classificationLabel(classification: TransientFollowUpClassification): string {
    switch (classification) {
      case Classification.CANONICAL_FUTURE: return 'Evento canónico futuro · no observado';
      case Classification.INTRINSIC_ONLY: return 'Evento intrínseco resuelto · sin observación';
      case Classification.INTRINSIC_WITH_OBSERVATIONS: return 'Modelo físico y observaciones explícitas · sin fusionar marcos';
      case Classification.PROGENITOR_ONLY: return 'Solo progenitor / motor sin resolver';
      case Classification.STATISTICAL_ONLY: return 'Solo estadística · sin evento';
      case Classification.NOT_APPLICABLE: return 'Modelo físico no aplicable';
      case Classification.OBSERVATION_COMPATIBLE: return 'Señales compatibles · no confirmación física';
      case Classification.OBSERVATION_AMBIGUOUS: return 'Señal ambigua · origen sin clasificar';
    }
  }
  familyLabel(family: TransientFollowUpFamily): string {
    switch (family) {
      case Family.SUPERNOVA: return 'Supernova';
      case Family.NOVA: return 'Nova';
      case Family.KILONOVA: return 'Kilonova';
      case Family.COMPACT_MERGER: return 'Fusión compacta';
      case Family.GRAVITATIONAL_WAVE: return 'Ondas gravitacionales';
      case Family.TIDAL_DISRUPTION: return 'Disrupción de marea';
      case Family.GAMMA_RAY_BURST: return 'GRB';
      case Family.FAST_RADIO_BURST: return 'FRB';
      case Family.STELLAR_FLARE: return 'Llamarada estelar';
      case Family.UNKNOWN: return 'Origen sin identificar';
    }
  }
  forecastYears(): string {
    const value = this.track().forecastDelayYears;
    if (value === null) return 'No aplica';
    return `${new Intl.NumberFormat('es-ES', { maximumSignificantDigits: 4 }).format(value)} años desde edad estelar canónica`;
  }
}
