import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  TidalDisruptionOutcome,
  type TidalDisruptionOutcome as TidalDisruptionOutcomeValue,
  TidalFallbackResolution,
  type TidalFallbackResolution as TidalFallbackResolutionValue,
} from '../../../../domain/transient/tidal-disruption-event-profile';
import {
  TidalDisruptionVictimKind,
  type TidalDisruptionVictimKind as TidalDisruptionVictimKindValue,
} from '../../../../domain/transient/tidal-disruption-encounter-profile';
import {
  TIDAL_DISRUPTION_LABORATORY_CASES,
  TidalDisruptionLaboratoryCaseId,
  type TidalDisruptionLaboratoryCaseId as TidalDisruptionLaboratoryCaseIdValue,
} from './tidal-disruption-laboratory-fixtures';

@Component({
  selector: 'app-tidal-disruption-laboratory',
  standalone: true,
  templateUrl: './tidal-disruption-laboratory.html',
  styleUrl: './tidal-disruption-laboratory.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TidalDisruptionLaboratoryPage {
  readonly cases = TIDAL_DISRUPTION_LABORATORY_CASES;
  readonly selectedId = signal<TidalDisruptionLaboratoryCaseIdValue>(
    TidalDisruptionLaboratoryCaseId.SOLAR_SMBH,
  );
  readonly selectedCase = computed(() =>
    this.cases.find(item => item.id === this.selectedId()) ?? this.cases[0],
  );

  selectCase(id: TidalDisruptionLaboratoryCaseIdValue): void {
    this.selectedId.set(id);
  }

  format(value: number, digits = 3): string {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value);
  }

  scientific(value: number): string {
    return value.toExponential(2).replace('e+', ' × 10^').replace('e-', ' × 10^-');
  }

  mass(value: number): string {
    if (value >= 1e3) {
      const exponent = Math.floor(Math.log10(value));
      const mantissa = value / 10 ** exponent;
      return `${this.format(mantissa, 3)} × 10^${exponent} M☉`;
    }
    return `${this.format(value, 3)} M☉`;
  }

  distance(meters: number): string {
    const astronomicalUnit = 149_597_870_700;
    const solarRadius = 6.957e8;
    const au = meters / astronomicalUnit;
    if (au >= 0.01) return `${this.format(au, 4)} UA`;
    const solar = meters / solarRadius;
    if (solar >= 0.05) return `${this.format(solar, 4)} R☉`;
    return `${this.format(meters / 1_000, 1)} km`;
  }

  duration(seconds: number | null): string {
    if (seconds === null) return 'No cuantificado';
    const minutes = seconds / 60;
    if (minutes < 60) return `${this.format(minutes, 2)} min`;
    const hours = minutes / 60;
    if (hours < 48) return `${this.format(hours, 2)} h`;
    const days = hours / 24;
    if (days < 730) return `${this.format(days, 2)} días`;
    return `${this.format(days / 365.25, 2)} años`;
  }

  fallbackRate(value: number | null): string {
    if (value === null) return 'No cuantificada';
    if (value >= 1e3) return `${this.scientific(value)} M☉/año`;
    return `${this.format(value, 3)} M☉/año`;
  }

  victimLabel(value: TidalDisruptionVictimKindValue): string {
    switch (value) {
      case TidalDisruptionVictimKind.MAIN_SEQUENCE_STAR: return 'Estrella de secuencia principal';
      case TidalDisruptionVictimKind.RED_GIANT: return 'Gigante roja';
      case TidalDisruptionVictimKind.WHITE_DWARF: return 'Enana blanca';
    }
  }

  outcomeLabel(value: TidalDisruptionOutcomeValue): string {
    switch (value) {
      case TidalDisruptionOutcome.EXTERNAL_DISRUPTION_EXPECTED:
        return 'Disrupción tidal externa esperada';
      case TidalDisruptionOutcome.GRAZING_PARTIAL_DISRUPTION_UNRESOLVED:
        return 'Encuentro rasante · stripping parcial sin resolver';
      case TidalDisruptionOutcome.DIRECT_CAPTURE_NONSPINNING_REFERENCE:
        return 'Captura directa en referencia Schwarzschild';
    }
  }

  fallbackLabel(value: TidalFallbackResolutionValue): string {
    switch (value) {
      case TidalFallbackResolution.FROZEN_IN_REFERENCE_AVAILABLE:
        return 'Referencia frozen-in disponible';
      case TidalFallbackResolution.BOUND_MASS_FRACTION_UNRESOLVED:
        return 'Fracción de masa ligada sin resolver';
      case TidalFallbackResolution.NO_EXTERNAL_FALLBACK_REFERENCE:
        return 'Sin fallback externo bajo esta referencia';
    }
  }
}
