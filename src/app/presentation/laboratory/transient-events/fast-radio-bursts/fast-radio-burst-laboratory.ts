import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FastRadioBurstOutcome } from '../../../../domain/transient/fast-radio-burst-event-profile';
import {
  FastRadioBurstRepetitionState,
  FastRadioBurstSourceKind,
  type FastRadioBurstRepetitionState as FastRadioBurstRepetitionStateValue,
  type FastRadioBurstSourceKind as FastRadioBurstSourceKindValue,
} from '../../../../domain/transient/fast-radio-burst-source-profile';
import {
  FAST_RADIO_BURST_LABORATORY_CASES,
  FastRadioBurstLaboratoryCaseId,
  type FastRadioBurstLaboratoryCaseId as FastRadioBurstLaboratoryCaseIdValue,
} from './fast-radio-burst-laboratory-fixtures';

@Component({
  selector: 'app-fast-radio-burst-laboratory',
  standalone: true,
  templateUrl: './fast-radio-burst-laboratory.html',
  styleUrl: './fast-radio-burst-laboratory.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FastRadioBurstLaboratoryPage {
  readonly cases = FAST_RADIO_BURST_LABORATORY_CASES;
  readonly selectedId = signal<FastRadioBurstLaboratoryCaseIdValue>(
    FastRadioBurstLaboratoryCaseId.MAGNETAR_BURST,
  );
  readonly selectedCase = computed(() =>
    this.cases.find(item => item.id === this.selectedId()) ?? this.cases[0],
  );

  readonly outcome = FastRadioBurstOutcome;
  readonly repetitionState = FastRadioBurstRepetitionState;

  selectCase(id: FastRadioBurstLaboratoryCaseIdValue): void {
    this.selectedId.set(id);
  }

  format(value: number, digits = 3): string {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value);
  }

  duration(value: number | null): string {
    if (value === null) return 'No resuelta';
    if (value < 1e-3) return `${this.format(value * 1e6, 2)} µs`;
    if (value < 1) return `${this.format(value * 1e3, 3)} ms`;
    return `${this.format(value, 3)} s`;
  }

  frequency(value: number | null): string {
    if (value === null) return 'No resuelta';
    if (value >= 1e9) return `${this.format(value / 1e9, 4)} GHz`;
    if (value >= 1e6) return `${this.format(value / 1e6, 3)} MHz`;
    return `${this.format(value, 3)} Hz`;
  }

  bandwidth(value: number | null): string {
    if (value === null) return 'No resuelto';
    return value >= 1e9
      ? `${this.format(value / 1e9, 4)} GHz`
      : `${this.format(value / 1e6, 3)} MHz`;
  }

  wavelength(value: number | null): string {
    if (value === null) return 'No resuelta';
    if (value < 1) return `${this.format(value * 100, 3)} cm`;
    return `${this.format(value, 3)} m`;
  }

  scale(value: number | null): string {
    if (value === null) return 'No resuelta';
    if (value >= 1e6) return `${this.format(value / 1e6, 3)} × 10⁶ m`;
    if (value >= 1e3) return `${this.format(value / 1e3, 3)} km`;
    return `${this.format(value, 3)} m`;
  }

  dm(value: number | null): string {
    return value === null ? 'No resuelta' : `${this.format(value, 3)} pc·cm⁻³`;
  }

  sourceLabel(value: FastRadioBurstSourceKindValue): string {
    switch (value) {
      case FastRadioBurstSourceKind.MAGNETAR: return 'Magnetar';
      case FastRadioBurstSourceKind.UNKNOWN_SOURCE: return 'Fuente no clasificada';
      case FastRadioBurstSourceKind.COMPACT_MERGER_NS_NS_CANDIDATE: return 'Fusión NS–NS · candidato';
    }
  }

  repetitionLabel(
    value: FastRadioBurstRepetitionStateValue,
    burstOutcome: FastRadioBurstOutcome,
  ): string {
    if (burstOutcome === FastRadioBurstOutcome.BURST_ENGINE_UNRESOLVED) {
      return 'No evaluable hasta resolver el burst FRB';
    }

    switch (value) {
      case FastRadioBurstRepetitionState.REPEATING_CONFIRMED:
        return 'Repetición confirmada · periodo no inferido';
      case FastRadioBurstRepetitionState.REPETITION_UNRESOLVED:
        return 'Sin resolver · un burst no demuestra no repetición';
    }
  }
}
