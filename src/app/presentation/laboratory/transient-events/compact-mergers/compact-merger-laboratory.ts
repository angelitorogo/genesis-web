import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  CompactMergerCounterpartKind,
  CompactMergerMassBudgetResolution,
  CompactMergerRemnantKind,
  type CompactMergerCounterpartKind as CompactMergerCounterpartKindValue,
  type CompactMergerMassBudgetResolution as CompactMergerMassBudgetResolutionValue,
  type CompactMergerRemnantKind as CompactMergerRemnantKindValue,
} from '../../../../domain/transient/compact-merger-event-profile';
import { CompactMergerType, type CompactMergerType as CompactMergerTypeValue } from '../../../../domain/transient/compact-merger-type';
import { COMPACT_MERGER_LABORATORY_CASES } from './compact-merger-laboratory-fixtures';

@Component({
  selector: 'app-compact-merger-laboratory',
  standalone: true,
  templateUrl: './compact-merger-laboratory.html',
  styleUrl: './compact-merger-laboratory.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompactMergerLaboratoryPage {
  readonly cases = COMPACT_MERGER_LABORATORY_CASES;
  readonly selectedType = signal<CompactMergerTypeValue>(CompactMergerType.NEUTRON_STAR_NEUTRON_STAR);
  readonly selectedCase = computed(() => this.cases.find(item => item.id === this.selectedType()) ?? this.cases[0]);

  selectType(value: CompactMergerTypeValue): void {
    this.selectedType.set(value);
  }

  format(value: number, digits = 3): string {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value);
  }

  scientific(value: number): string {
    return value.toExponential(2).replace('e+', ' × 10^').replace('e-', ' × 10^-');
  }

  scientificNullable(value: number | null): string {
    return value === null ? '—' : this.scientific(value);
  }

  progenitorPrimaryLabel(type: CompactMergerTypeValue): 'NS' | 'BH' {
    return type === CompactMergerType.BLACK_HOLE_BLACK_HOLE ? 'BH' : 'NS';
  }

  progenitorSecondaryLabel(type: CompactMergerTypeValue): 'NS' | 'BH' {
    return type === CompactMergerType.NEUTRON_STAR_NEUTRON_STAR ? 'NS' : 'BH';
  }

  remnantShortLabel(kind: CompactMergerRemnantKindValue): 'NS' | 'BH' {
    return kind === CompactMergerRemnantKind.STELLAR_BLACK_HOLE ? 'BH' : 'NS';
  }

  remnantLabel(kind: CompactMergerRemnantKindValue): string {
    switch (kind) {
      case CompactMergerRemnantKind.MASSIVE_NEUTRON_STAR:
        return 'Estrella de neutrones masiva';
      case CompactMergerRemnantKind.HYPERMASSIVE_NEUTRON_STAR:
        return 'Estrella de neutrones hipermasiva';
      case CompactMergerRemnantKind.STELLAR_BLACK_HOLE:
        return 'Agujero negro estelar';
    }
  }

  counterpartLabel(kind: CompactMergerCounterpartKindValue): string {
    switch (kind) {
      case CompactMergerCounterpartKind.KILONOVA_EXPECTED:
        return 'Kilonova esperada';
      case CompactMergerCounterpartKind.KILONOVA_TIDAL_DISRUPTION_UNRESOLVED:
        return 'Kilonova / disrupción tidal sin resolver';
      case CompactMergerCounterpartKind.NO_PROMPT_ELECTROMAGNETIC_COUNTERPART_EXPECTED:
        return 'No se espera contraparte electromagnética inmediata';
    }
  }

  massBudgetLabel(resolution: CompactMergerMassBudgetResolutionValue): string {
    switch (resolution) {
      case CompactMergerMassBudgetResolution.NS_NS_KILONOVA_CONSTRAINED:
        return 'Restringido por kilonova NS–NS';
      case CompactMergerMassBudgetResolution.BH_SPIN_UNRESOLVED:
        return 'Sin resolver: spin / orientación Kerr';
    }
  }
}
