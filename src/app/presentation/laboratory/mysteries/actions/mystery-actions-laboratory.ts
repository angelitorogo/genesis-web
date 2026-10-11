import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import type { MysteryObservedEvidence } from '../../../../domain/mystery/mystery-observational-evidence';
import type { MysteryObservationRun } from '../../../../domain/mystery/mystery-observation-action';
import { MysteryObservationActionEngine } from '../../../../simulation/mystery/mystery-observation-action-engine';
import {
  MYSTERY_ACTION_LABORATORY_CASES,
} from '../../../../simulation/mystery/mystery-action-laboratory-fixtures';

@Component({
  selector: 'app-mystery-actions-laboratory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mystery-actions-laboratory.html',
  styleUrl: './mystery-actions-laboratory.scss',
})
export class MysteryActionsLaboratoryPage {
  readonly cases = MYSTERY_ACTION_LABORATORY_CASES;
  readonly selectedId = signal(this.cases[0].id);
  readonly executions = signal<readonly MysteryObservationRun[]>([]);
  readonly selected = computed(() => this.cases.find(item => item.id === this.selectedId()) ?? this.cases[0]);
  readonly plans = computed(() => MysteryObservationActionEngine.plan(
    this.selected().subject,
    this.selected().instruments,
    this.selected().actions.map(item => item.request),
  ));
  readonly evaluated = computed(() => MysteryObservationActionEngine.evaluate(
    this.selected().subject, this.selected().initial,
    this.selected().instruments,
    this.selected().actions.map(item => item.request),
    this.executions(),
  ));

  selectCase(id: string): void {
    if (!this.cases.some(item => item.id === id)) return;
    this.selectedId.set(id);
    this.executions.set([]);
  }

  takeObservation(id: string): void {
    const action = this.selected().actions.find(item => item.request.id === id);
    const plan = this.plans().find(item => item.request.id === id);
    if (!action || !plan || plan.status !== 'AVAILABLE' ||
        this.executions().some(run => run.requestId === id)) return;
    this.executions.update(existing => [...existing, {
      requestId: id,
      packet: action.packet,
    }]);
  }

  resetObservations(): void { this.executions.set([]); }

  planFor(actionId: string) {
    return this.plans().find(plan => plan.request.id === actionId)!;
  }

  actionReason(value: string | null): string {
    switch (value) {
      case 'INSTRUMENT_UNAVAILABLE': return 'Instrumento no operativo o ausente';
      case 'OUTSIDE_POINTING_SCOPE': return 'Ámbito fuera del alcance instrumental';
      case 'MODE_UNSUPPORTED': return 'Modalidad no disponible';
      case 'BAND_UNSUPPORTED': return 'Banda no cubierta';
      case 'MEASUREMENT_UNSUPPORTED': return 'Magnitud no medible';
      case 'EXPOSURE_EXCEEDS_CAPACITY': return 'Exposición excede la capacidad';
      default: return 'Observación autorizada';
    }
  }

  evidenceLabel(value: MysteryObservedEvidence): string {
    if (value.kind === 'DETECTION') return `${value.value} (−${value.sigmaMinus} / +${value.sigmaPlus} a 1σ)`;
    if (value.kind === 'UPPER_LIMIT') return `≤ ${value.limit} · límite ${value.thresholdSigma}σ`;
    return `Sin medida · ${value.reason}`;
  }
}
