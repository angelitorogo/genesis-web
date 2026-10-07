import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  SupernovaCompactRemnantKind,
} from '../../../../domain/transient/supernova-event-profile';
import {
  type SupernovaPhase,
} from '../../../../domain/transient/supernova-phase';
import {
  SupernovaType,
  type SupernovaType as SupernovaTypeValue,
} from '../../../../domain/transient/supernova-type';
import {
  SupernovaEventEngine,
} from '../../../../simulation/transient/supernova-event-engine';
import {
  SUPERNOVA_LABORATORY_CASES,
} from './supernova-laboratory-fixtures';
import { YoungSupernovaRender } from './young-supernova-render';

@Component({
  selector: 'app-supernova-laboratory',
  standalone: true,
  imports: [RouterLink, YoungSupernovaRender],
  templateUrl: './supernova-laboratory.html',
  styleUrl: './supernova-laboratory.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupernovaLaboratoryPage {
  readonly cases = SUPERNOVA_LABORATORY_CASES;

  readonly selectedType = signal<SupernovaTypeValue>(SupernovaType.TYPE_IA);
  readonly elapsedDays = signal(0);

  readonly selectedCase = computed(() =>
    this.cases.find(candidate => candidate.id === this.selectedType()) ?? this.cases[0],
  );

  readonly snapshot = computed(() =>
    SupernovaEventEngine.sample(
      this.selectedCase().profile,
      this.elapsedDays(),
    ),
  );

  readonly lightCurvePath = computed(() => {
    const profile = this.selectedCase().profile;
    const maxDays = 450;
    const points: string[] = [];

    for (let index = 0; index <= 90; index += 1) {
      const day = maxDays * index / 90;
      const sample = SupernovaEventEngine.sample(profile, day);
      const x = 40 + 900 * index / 90;
      const magnitude = clamp(sample.absoluteBolometricMagnitude, -20.5, -9.5);
      const y = 28 + ((magnitude + 20.5) / 11) * 180;
      points.push(`${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
    }

    return points.join(' ');
  });

  readonly currentCurveX = computed(() =>
    40 + 900 * clamp(this.elapsedDays(), 0, 450) / 450,
  );


  selectType(type: SupernovaTypeValue): void {
    this.selectedType.set(type);
    this.elapsedDays.set(0);
  }

  setElapsedDays(value: string | number): void {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(parsed)) {
      this.elapsedDays.set(clamp(parsed, -20, 1200));
    }
  }

  jumpToPeak(): void {
    this.elapsedDays.set(this.selectedCase().profile.riseTimeDays);
  }

  jumpToRemnant(): void {
    this.elapsedDays.set(this.selectedCase().profile.earlyRemnantTransitionDays + 20);
  }

  phaseLabel(phase: SupernovaPhase): string {
    return ({
      PRECURSOR: 'Precursor',
      EXPLOSION: 'Explosión',
      RISE: 'Ascenso',
      PEAK: 'Pico',
      PLATEAU: 'Meseta',
      DECLINE: 'Declive',
      EARLY_REMNANT: 'Remanente temprano',
      COMPLETE: 'Transitorio finalizado',
    } as Record<SupernovaPhase, string>)[phase];
  }

  remnantLabel(kind: SupernovaCompactRemnantKind): string {
    if (kind === SupernovaCompactRemnantKind.NONE) {
      return 'Sin remanente compacto central';
    }
    if (kind === SupernovaCompactRemnantKind.NEUTRON_STAR) {
      return 'Estrella de neutrones';
    }
    return 'Agujero negro estelar';
  }

  formatScientific(value: number, digits = 3): string {
    return value.toExponential(digits).replace('e+', ' × 10^').replace('e-', ' × 10^-');
  }

  format(value: number, digits = 2): string {
    return new Intl.NumberFormat('es-ES', {
      maximumFractionDigits: digits,
      minimumFractionDigits: 0,
    }).format(value);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
