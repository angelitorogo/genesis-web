import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type NovaPhase } from '../../../../domain/transient/nova-phase';
import { NovaType, type NovaType as NovaTypeValue } from '../../../../domain/transient/nova-type';
import { NovaEventEngine } from '../../../../simulation/transient/nova-event-engine';
import { NOVA_LABORATORY_CASES } from './nova-laboratory-fixtures';

@Component({
  selector: 'app-nova-laboratory',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './nova-laboratory.html',
  styleUrl: './nova-laboratory.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovaLaboratoryPage {
  readonly cases = NOVA_LABORATORY_CASES;
  readonly selectedType = signal<NovaTypeValue>(NovaType.CLASSICAL);
  readonly elapsedDays = signal(0);
  readonly selectedCase = computed(() =>
    this.cases.find(candidate => candidate.id === this.selectedType()) ?? this.cases[0],
  );
  readonly snapshot = computed(() => NovaEventEngine.sample(this.selectedCase().profile, this.elapsedDays()));
  readonly timelineMaxDays = computed(() =>
    Math.min(5_000, Math.max(500, Math.ceil(this.selectedCase().profile.returnToQuiescenceDays * 1.12))),
  );
  readonly visualScale = computed(() =>
    Math.min(2.75, 0.18 + Math.log10(Math.max(0, this.elapsedDays()) + 1) * 0.72),
  );
  readonly flashOpacity = computed(() =>
    clamp(Math.sqrt(this.snapshot().normalizedBrightness) * 1.18, 0.035, 1),
  );
  readonly shellOpacity = computed(() => {
    const elapsed = this.elapsedDays();
    if (elapsed < 0) return 0;
    const profile = this.selectedCase().profile;
    const build = clamp(elapsed / Math.max(1, profile.riseTimeDays), 0, 1);
    const fade = 1 - 0.62 * clamp(elapsed / profile.returnToQuiescenceDays, 0, 1);
    return clamp(0.12 + build * 0.78, 0, 0.92) * fade;
  });
  readonly lightCurvePath = computed(() => {
    const profile = this.selectedCase().profile;
    const maxDays = Math.min(1_200, Math.max(120, profile.returnToQuiescenceDays));
    const points: string[] = [];
    for (let i = 0; i <= 100; i += 1) {
      const day = maxDays * i / 100;
      const sample = NovaEventEngine.sample(profile, day);
      const magnitude = clamp(sample.absoluteBolometricMagnitude, -11, -2);
      const x = 40 + 900 * i / 100;
      const y = 28 + ((magnitude + 11) / 9) * 180;
      points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return points.join(' ');
  });

  selectType(type: NovaTypeValue): void { this.selectedType.set(type); this.elapsedDays.set(0); }
  setElapsedDays(value: string | number): void {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(parsed)) this.elapsedDays.set(clamp(parsed, -10, this.timelineMaxDays()));
  }
  jumpToPeak(): void { this.elapsedDays.set(this.selectedCase().profile.riseTimeDays); }
  jumpToNebular(): void { this.elapsedDays.set(this.selectedCase().profile.nebularTransitionDays); }
  phaseLabel(phase: NovaPhase): string {
    return ({
      QUIESCENT: 'Quiescencia', PRECURSOR: 'Precursor', ERUPTION: 'Erupción', RISE: 'Ascenso',
      PEAK: 'Pico', DECLINE: 'Declive', NEBULAR: 'Fase nebular', RETURN_TO_QUIESCENCE: 'Retorno a quiescencia',
    } as Record<NovaPhase, string>)[phase];
  }
  format(value: number, digits = 2): string {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value);
  }
  scientific(value: number, digits = 2): string {
    return value.toExponential(digits).replace('e+', ' × 10^').replace('e-', ' × 10^-');
  }
}
function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
