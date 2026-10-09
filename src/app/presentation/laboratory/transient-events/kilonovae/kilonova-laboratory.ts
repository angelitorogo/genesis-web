import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { KilonovaType, type KilonovaType as KilonovaTypeValue } from '../../../../domain/transient/kilonova-type';
import { KilonovaEventEngine } from '../../../../simulation/transient/kilonova-event-engine';
import { KILONOVA_LABORATORY_CASES } from './kilonova-laboratory-fixtures';

@Component({
  selector: 'app-kilonova-laboratory',
  standalone: true,
  templateUrl: './kilonova-laboratory.html',
  styleUrl: './kilonova-laboratory.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KilonovaLaboratoryPage {
  readonly cases = KILONOVA_LABORATORY_CASES;
  readonly selectedType = signal<KilonovaTypeValue>(KilonovaType.BINARY_NEUTRON_STAR);
  readonly elapsedDays = signal(0);
  readonly selectedCase = computed(() => this.cases.find(item => item.id === this.selectedType()) ?? this.cases[0]);
  readonly snapshot = computed(() => KilonovaEventEngine.sample(this.selectedCase().profile, this.elapsedDays()));
  readonly blueScale = computed(() => Math.min(2.8, 0.12 + Math.sqrt(Math.max(0, this.snapshot().blueEjectaRadiusAu)) * 0.16));
  readonly redScale = computed(() => Math.min(3.5, 0.16 + Math.sqrt(Math.max(0, this.snapshot().redEjectaRadiusAu)) * 0.19));
  selectType(value: KilonovaTypeValue): void { this.selectedType.set(value); this.elapsedDays.set(0); }
  setElapsedDays(value: string | number): void {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(parsed)) this.elapsedDays.set(Math.min(60, Math.max(-1, parsed)));
  }
  format(value: number, digits = 3): string { return new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value); }
  scientific(value: number): string { return value.toExponential(2).replace('e+', ' × 10^').replace('e-', ' × 10^-'); }
}
