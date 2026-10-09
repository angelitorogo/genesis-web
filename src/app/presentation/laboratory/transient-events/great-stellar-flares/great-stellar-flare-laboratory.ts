import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { GreatStellarFlareOutcome } from '../../../../domain/transient/great-stellar-flare-event-profile';
import {
  GREAT_STELLAR_FLARE_LABORATORY_CASES,
  GreatStellarFlareLaboratoryCaseId,
  type GreatStellarFlareLaboratoryCaseId as GreatStellarFlareLaboratoryCaseIdValue,
} from './great-stellar-flare-laboratory-fixtures';

@Component({
  selector: 'app-great-stellar-flare-laboratory',
  standalone: true,
  templateUrl: './great-stellar-flare-laboratory.html',
  styleUrl: './great-stellar-flare-laboratory.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GreatStellarFlareLaboratoryPage {
  readonly cases = GREAT_STELLAR_FLARE_LABORATORY_CASES;
  readonly selectedId = signal<GreatStellarFlareLaboratoryCaseIdValue>(
    GreatStellarFlareLaboratoryCaseId.M_DWARF_SUPERFLARE,
  );
  readonly selectedCase = computed(
    () => this.cases.find(item => item.id === this.selectedId()) ?? this.cases[0],
  );
  readonly outcome = GreatStellarFlareOutcome;

  readonly noIndividualEvent = 'No evaluables: no hay evento individual';
  readonly notApplicable = 'No aplica';

  selectCase(id: GreatStellarFlareLaboratoryCaseIdValue): void {
    this.selectedId.set(id);
  }

  format(value: number, digits = 3): string {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value);
  }

  scientific(value: number | null, unit: string): string {
    if (value === null) return 'No resuelta';
    if (value === 0) return `0 ${unit}`;
    const exponent = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = value / (10 ** exponent);
    return `${this.format(mantissa, 3)} × 10^${exponent} ${unit}`;
  }

  duration(value: number | null): string {
    if (value === null) return 'No resuelta';
    if (value < 1) return `${this.format(value * 1e3, 3)} ms`;
    if (value < 60) return `${this.format(value, 3)} s`;
    if (value < 3600) return `${this.format(value / 60, 3)} min`;
    return `${this.format(value / 3600, 3)} h`;
  }

  rate(value: number | null): string {
    return value === null ? this.notApplicable : `${this.format(value, 4)} / día · media estadística`;
  }

  /**
   * Solo semántica de UI: los null de 29.9 representan estados distintos
   * según exista un evento, haya únicamente estadística 15.4 o el modelo
   * fotosférico no sea aplicable. No se modifica el perfil físico.
   */
  eventMetric(formattedExplicitValue: string): string {
    switch (this.selectedCase().profile.outcome) {
      case GreatStellarFlareOutcome.STATISTICAL_ACTIVITY_WITHOUT_EVENT:
        return this.noIndividualEvent;
      case GreatStellarFlareOutcome.ORDINARY_STELLAR_FLARE_MODEL_NOT_APPLICABLE:
        return this.notApplicable;
      default:
        return formattedExplicitValue;
    }
  }

  statisticalEnergy(value: number | null): string {
    return this.selectedCase().profile.outcome ===
      GreatStellarFlareOutcome.ORDINARY_STELLAR_FLARE_MODEL_NOT_APPLICABLE
      ? this.notApplicable
      : this.scientific(value, 'J');
  }

  nextFlare(): string {
    return this.eventMetric('No inferida desde una tasa media');
  }

  regime(): string {
    const regime = this.selectedCase().profile.source.activityProfile.regime?.name;
    switch (regime) {
      case 'QUIESCENT': return 'Quiescente';
      case 'LOW': return 'Baja';
      case 'MODERATE': return 'Moderada';
      case 'HIGH': return 'Alta';
      case 'EXTREME': return 'Extrema';
      default: return 'No aplica';
    }
  }

  ratio(value: number | null): string {
    return value === null ? 'No resuelta' : `${this.format(value, 4)}×`;
  }

  stellarScale(radiusSolar: number | null, luminositySolar: number | null): string {
    if (radiusSolar === null || luminositySolar === null) return 'No aplica';
    return `${this.format(radiusSolar, 3)} R☉ · ${this.format(luminositySolar, 4)} L☉`;
  }

  percent(value: number | null): string {
    return value === null ? 'No resuelta' : `${this.format(value * 100, 3)} %`;
  }

  energyMarkerPercent(): number {
    const profile = this.selectedCase().profile;
    const eventEnergy = profile.source.flareEnergyJoules;
    const typical = profile.source.activityProfile.typicalFlareEnergyJoules;
    const maximum = profile.source.activityProfile.maximumFlareEnergyJoules;
    if (eventEnergy === null || typical === null || maximum === null || maximum <= typical) return 0;
    const numerator = Math.log10(eventEnergy) - Math.log10(typical);
    const denominator = Math.log10(maximum) - Math.log10(typical);
    return Math.max(0, Math.min(100, 100 * numerator / denominator));
  }
}
