import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { TRANSIENT_HISTORICAL_EFFECTS_CASES } from './transient-historical-effects-laboratory-fixtures';
import { type HistoricalExposureState, type HistoricalPhotonBand, type HistoricalEventState } from '../../../../domain/transient/transient-historical-effects-profile';

@Component({
  selector: 'app-transient-historical-effects-laboratory', standalone: true,
  templateUrl: './transient-historical-effects-laboratory.html',
  styleUrl: './transient-historical-effects-laboratory.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransientHistoricalEffectsLaboratoryPage {
  readonly cases = TRANSIENT_HISTORICAL_EFFECTS_CASES;
  readonly selectedId = signal('m-flare');
  readonly selectedCase = computed(() => this.cases.find(c => c.id === this.selectedId()) ?? this.cases[0]);
  readonly report = computed(() => this.selectedCase().report);

  selectCase(id: string): void {
    if (this.cases.some(c => c.id === id)) this.selectedId.set(id);
  }
  formatScientific(value: number | null, unit: string): string {
    if (value === null) return 'No resuelto';
    if (value === 0) return `0 ${unit}`;
    if (value >= 1e5 || value < 1e-3) {
      const power = Math.floor(Math.log10(Math.abs(value)));
      const mantissa = value / 10 ** power;
      return `${new Intl.NumberFormat('es-ES', {maximumFractionDigits:3}).format(mantissa)} × 10^${power} ${unit}`;
    }
    return `${new Intl.NumberFormat('es-ES', {maximumFractionDigits:3}).format(value)} ${unit}`;
  }
  statusLabel(state: HistoricalExposureState): string {
    switch (state) {
      case 'NO_INDIVIDUAL_PAST_EVENT': return 'No existe evento histórico individual resuelto';
      case 'NO_RADIANT_SPECTRUM': return 'Radiación / espectro sin resolver';
      case 'GEOMETRY_UNRESOLVED': return 'Intersección de emisión sin resolver';
      case 'DISTANCE_UNRESOLVED': return 'Separación fuente–objetivo sin resolver';
      case 'TOA_RESOLVED_ATMOSPHERE_UNRESOLVED': return 'Fluencia TOA calculada · atmósfera sin resolver';
      case 'BAND_ATTENUATION_RESOLVED': return 'Fluencia y transmisión de banda calculadas';
    }
  }
  bandLabel(band: HistoricalPhotonBand | null): string {
    switch (band) {
      case 'BOLOMETRIC': return 'Bolométrica (no espectral)';
      case 'OPTICAL': return 'Óptico';
      case 'UV': return 'Ultravioleta';
      case 'X_RAY': return 'Rayos X';
      case 'GAMMA': return 'Rayos gamma';
      default: return 'No resuelta';
    }
  }
  timeLabel(years: number | null, state: HistoricalEventState): string {
    if (state === 'FUTURE_CANONICAL') return 'Predicción futura · no ha ocurrido';
    if (state === 'STATISTICAL_ONLY') return 'Solo estadística · sin fecha individual';
    if (state === 'INTRINSIC_REFERENCE_ONLY') return 'Referencia intrínseca · no registrada históricamente';
    if (state === 'UNCONFIRMED_CANDIDATE') return 'Candidato no confirmado · sin cronología';
    return years === null ? 'Fecha histórica no resuelta' :
      `Hace ${new Intl.NumberFormat('es-ES',{maximumFractionDigits:3}).format(years)} años · referencia local explícita`;
  }
  exposureLabel(value: number | null, unit: string, state: HistoricalExposureState, transmission = false): string {
    if (value !== null) return this.formatScientific(value, unit);
    if (state === 'NO_INDIVIDUAL_PAST_EVENT') return 'No aplica: sin evento pasado';
    if (state === 'TOA_RESOLVED_ATMOSPHERE_UNRESOLVED' && transmission) return 'No resuelta: atenuación desconocida';
    return 'No resuelta';
  }
}
