import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  GammaRayBurstFamily,
  type GammaRayBurstFamily as GammaRayBurstFamilyValue,
  GammaRayBurstObserverPromptStatus,
  type GammaRayBurstObserverPromptStatus as GammaRayBurstObserverPromptStatusValue,
  GammaRayBurstOutcome,
  type GammaRayBurstOutcome as GammaRayBurstOutcomeValue,
} from '../../../../domain/transient/gamma-ray-burst-event-profile';
import {
  GammaRayBurstProgenitorKind,
  type GammaRayBurstProgenitorKind as GammaRayBurstProgenitorKindValue,
} from '../../../../domain/transient/gamma-ray-burst-source-profile';
import {
  GAMMA_RAY_BURST_LABORATORY_CASES,
  GammaRayBurstLaboratoryCaseId,
  type GammaRayBurstLaboratoryCaseId as GammaRayBurstLaboratoryCaseIdValue,
} from './gamma-ray-burst-laboratory-fixtures';

@Component({
  selector: 'app-gamma-ray-burst-laboratory',
  standalone: true,
  templateUrl: './gamma-ray-burst-laboratory.html',
  styleUrl: './gamma-ray-burst-laboratory.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GammaRayBurstLaboratoryPage {
  readonly cases = GAMMA_RAY_BURST_LABORATORY_CASES;
  readonly selectedId = signal<GammaRayBurstLaboratoryCaseIdValue>(
    GammaRayBurstLaboratoryCaseId.SHORT_NS_NS,
  );
  readonly selectedCase = computed(() =>
    this.cases.find(item => item.id === this.selectedId()) ?? this.cases[0],
  );

  selectCase(id: GammaRayBurstLaboratoryCaseIdValue): void {
    this.selectedId.set(id);
  }

  format(value: number, digits = 3): string {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value);
  }

  duration(value: number | null): string {
    if (value === null) return 'No resuelta';
    if (value < 1) return `${this.format(value * 1_000, 2)} ms`;
    if (value < 120) return `${this.format(value, 3)} s`;
    return `${this.format(value / 60, 2)} min`;
  }

  stellarBreakoutLabel(
    progenitorKind: GammaRayBurstProgenitorKindValue,
    value: number | null,
  ): string {
    if (
      progenitorKind === GammaRayBurstProgenitorKind.COMPACT_MERGER_NS_NS ||
      progenitorKind === GammaRayBurstProgenitorKind.COMPACT_MERGER_NS_BH
    ) {
      return 'No aplica';
    }

    return this.duration(value);
  }

  externalJetAvailabilityLabel(
    outcome: GammaRayBurstOutcomeValue,
    value: number | null,
  ): string {
    if (outcome === GammaRayBurstOutcome.CHOKED_COLLAPSAR_NO_CLASSICAL_GRB) {
      return 'No: jet ahogado / no emerge';
    }

    return this.duration(value);
  }

  angle(value: number | null): string {
    return value === null ? 'No resuelto' : `${this.format(value, 3)}°`;
  }

  lorentz(value: number | null): string {
    return value === null ? 'No resuelto' : `Γ = ${this.format(value, 1)}`;
  }

  fraction(value: number | null): string {
    return value === null ? 'No resuelta' : `${this.format(value * 100, 4)} % del cielo`;
  }

  progenitorLabel(value: GammaRayBurstProgenitorKindValue): string {
    switch (value) {
      case GammaRayBurstProgenitorKind.COMPACT_MERGER_NS_NS: return 'Fusión NS–NS';
      case GammaRayBurstProgenitorKind.COMPACT_MERGER_NS_BH: return 'Fusión NS–BH';
      case GammaRayBurstProgenitorKind.COLLAPSAR_STRIPPED_STAR: return 'Collapsar · estrella despojada';
    }
  }

  familyLabel(value: GammaRayBurstFamilyValue): string {
    switch (value) {
      case GammaRayBurstFamily.SHORT_MERGER: return 'Familia corta · fusión compacta';
      case GammaRayBurstFamily.LONG_COLLAPSAR: return 'Familia larga · collapsar';
      case GammaRayBurstFamily.NO_CLASSICAL_GRB: return 'Sin GRB clásico emergente';
      case GammaRayBurstFamily.UNRESOLVED: return 'Familia GRB sin resolver';
    }
  }

  outcomeLabel(value: GammaRayBurstOutcomeValue): string {
    switch (value) {
      case GammaRayBurstOutcome.SUCCESSFUL_SHORT_GRB_ENGINE:
        return 'Jet relativista externo · canal corto intrínseco';
      case GammaRayBurstOutcome.SUCCESSFUL_LONG_GRB_ENGINE:
        return 'Breakout resuelto · canal largo intrínseco';
      case GammaRayBurstOutcome.JET_LAUNCH_UNRESOLVED:
        return 'Lanzamiento del jet sin resolver';
      case GammaRayBurstOutcome.CHOKED_COLLAPSAR_NO_CLASSICAL_GRB:
        return 'Jet ahogado · no emerge un GRB clásico';
    }
  }

  promptLabel(value: GammaRayBurstObserverPromptStatusValue): string {
    switch (value) {
      case GammaRayBurstObserverPromptStatus.ON_AXIS_PROMPT_GEOMETRY:
        return 'Geometría on-axis compatible con prompt';
      case GammaRayBurstObserverPromptStatus.OFF_AXIS_PROMPT_SUPPRESSED:
        return 'Off-axis · prompt directo geométricamente suprimido';
      case GammaRayBurstObserverPromptStatus.ORIENTATION_UNRESOLVED:
        return 'Sin resolver: orientación del observador';
      case GammaRayBurstObserverPromptStatus.ENGINE_UNRESOLVED:
        return 'Sin resolver: primero debe existir un jet';
      case GammaRayBurstObserverPromptStatus.NO_CLASSICAL_PROMPT:
        return 'Sin prompt clásico: el jet no emerge';
    }
  }
}
