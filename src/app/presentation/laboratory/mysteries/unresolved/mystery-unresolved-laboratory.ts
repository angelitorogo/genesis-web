import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import type { MysteryUnresolvedClosure } from '../../../../domain/mystery/mystery-unresolved-review';
import { MysteryEvidenceEngine } from '../../../../simulation/mystery/mystery-evidence-engine';
import { MysteryClassificationEngine } from '../../../../simulation/mystery/mystery-classification-engine';
import { MysteryUnresolvedEngine } from '../../../../simulation/mystery/mystery-unresolved-engine';
import { MYSTERY_UNRESOLVED_CASES } from '../../../../simulation/mystery/mystery-unresolved-laboratory-fixtures';

@Component({
  selector: 'app-mystery-unresolved-laboratory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mystery-unresolved-laboratory.html',
  styleUrl: './mystery-unresolved-laboratory.scss',
})
export class MysteryUnresolvedLaboratoryPage {
  readonly cases = MYSTERY_UNRESOLVED_CASES;
  readonly selectedId = signal(this.cases[0].id);
  readonly additionalEvidence = signal(false);
  readonly closure = signal<MysteryUnresolvedClosure | null>(null);
  readonly selected = computed(() => this.cases.find(c => c.id === this.selectedId()) ?? this.cases[0]);
  readonly state = computed(() => {
    const entry = this.selected();
    const before = MysteryEvidenceEngine.assess(entry.subject, entry.initial);
    const first = MysteryClassificationEngine.review(before);
    const assessment = this.additionalEvidence()
      ? MysteryEvidenceEngine.assess(entry.subject, [...entry.initial, ...entry.later]) : before;
    const history = this.additionalEvidence() ? MysteryClassificationEngine.review(assessment, first) : first;
    return { assessment, history, result: MysteryUnresolvedEngine.assess(assessment, history, this.closure()) };
  });
  selectCase(id: string): void {
    if (!this.cases.some(c => c.id === id)) return;
    this.selectedId.set(id); this.additionalEvidence.set(false); this.closure.set(null);
  }
  closeInvestigation(): void {
    const { assessment, history, result } = this.state();
    if (result.status === 'OBSERVATIONALLY_CLASSIFIED' || this.closure()) return;
    this.closure.set(MysteryUnresolvedEngine.close(assessment, history, this.selected().closeScope));
  }
  addEvidence(): void {
    if (this.selected().later.length && !this.additionalEvidence()) this.additionalEvidence.set(true);
  }
  reset(): void { this.additionalEvidence.set(false); this.closure.set(null); }
  stateLabel(status: string): string {
    switch (status) {
      case 'OPEN_UNRESOLVED': return 'Abierto · sin clasificar';
      case 'CLOSED_UNRESOLVED': return 'Cerrado sin resolver · ámbito limitado';
      case 'REOPENED_BY_NEW_EVIDENCE': return 'Reabierto por nueva evidencia';
      default: return 'Firma observacional clasificada';
    }
  }
  reasonLabel(reason: string): string {
    switch (reason) {
      case 'SUBDETERMINED_OBSERVATIONAL_SIGNATURES': return 'Subdeterminado: varias firmas candidatas';
      case 'OUTSIDE_CURRENT_OBSERVATIONAL_RULES': return 'Firma fuera de las reglas observacionales actuales';
      case 'APPARENT_TENSION': return 'Tensiones aparentes · requiere investigación';
      case 'OBSERVATIONAL_CLASS_AVAILABLE': return 'Existe una clase observacional justificada (no identidad física)';
      default: return 'Datos insuficientes · falta información discriminante';
    }
  }
}
