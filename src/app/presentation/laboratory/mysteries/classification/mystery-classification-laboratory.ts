import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import type { MysteryEvidenceInput } from '../../../../domain/mystery/mystery-observational-evidence';
import { MysteryClassificationEngine } from '../../../../simulation/mystery/mystery-classification-engine';
import { MYSTERY_CLASSIFICATION_CASES } from '../../../../simulation/mystery/mystery-classification-laboratory-fixtures';
import { MysteryEvidenceEngine } from '../../../../simulation/mystery/mystery-evidence-engine';

@Component({
  selector: 'app-mystery-classification-laboratory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mystery-classification-laboratory.html',
  styleUrl: './mystery-classification-laboratory.scss',
})
export class MysteryClassificationLaboratoryPage {
  readonly cases = MYSTERY_CLASSIFICATION_CASES;
  readonly selectedId = signal(this.cases[0].id);
  readonly completedSteps = signal(0);
  readonly selected = computed(() => this.cases.find(c => c.id === this.selectedId()) ?? this.cases[0]);
  readonly evaluation = computed(() => {
    const entry = this.selected();
    let history = MysteryClassificationEngine.review(MysteryEvidenceEngine.assess(entry.subject, entry.initial));
    let inputs: readonly MysteryEvidenceInput[] = entry.initial;
    for (const step of entry.steps.slice(0, this.completedSteps())) {
      inputs = [...inputs, ...step.evidence];
      history = MysteryClassificationEngine.review(MysteryEvidenceEngine.assess(entry.subject, inputs), history);
    }
    return { history, assessment: MysteryEvidenceEngine.assess(entry.subject, inputs) };
  });
  selectCase(id: string): void {
    if (!this.cases.some(c => c.id === id)) return;
    this.selectedId.set(id); this.completedSteps.set(0);
  }
  nextEvidence(): void {
    if (this.completedSteps() < this.selected().steps.length) this.completedSteps.update(n => n + 1);
  }
  reset(): void { this.completedSteps.set(0); }
  classLabel(code: string | null): string {
    switch (code) {
      case 'RADIO_VARIABLE_SOURCE': return 'Fuente variable de radio';
      case 'RADIO_PERIODIC_SIGNAL': return 'Señal periódica de radio';
      default: return 'Sin clasificar';
    }
  }
  statusLabel(status: string): string {
    switch (status) {
      case 'PROVISIONAL': return 'Provisional';
      case 'SUPPORTED': return 'Respaldada por evidencias';
      case 'UNDER_REVIEW': return 'En revisión · sin clase asignada';
      default: return 'Sin clasificar';
    }
  }
  reasonLabel(reason: string): string {
    switch (reason) {
      case 'REQUIRED_SIGNATURE_MET': return 'Requisitos mínimos satisfechos';
      case 'INDEPENDENT_REPLICATION_MET': return 'Repetición en campañas independientes';
      case 'APPARENT_TENSION': return 'Tensión aparente en medidas radio comparables';
      case 'COMPETING_SIGNATURES': return 'Más de una firma compatible';
      default: return 'Evidencia insuficiente o fuera de estas reglas';
    }
  }
}
