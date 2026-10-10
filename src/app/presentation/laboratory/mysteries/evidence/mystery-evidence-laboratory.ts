import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import type { MysteryObservedEvidence } from '../../../../domain/mystery/mystery-observational-evidence';
import { MYSTERY_EVIDENCE_LABORATORY_CASES } from './mystery-evidence-laboratory-fixtures';

@Component({
  selector: 'app-mystery-evidence-laboratory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mystery-evidence-laboratory.html',
  styleUrl: './mystery-evidence-laboratory.scss',
})
export class MysteryEvidenceLaboratoryPage {
  readonly cases = MYSTERY_EVIDENCE_LABORATORY_CASES;
  readonly selectedId = signal('partial');
  readonly selected = computed(() => this.cases.find(c => c.id === this.selectedId()) ?? this.cases[0]);

  selectCase(id: string): void {
    if (this.cases.some(c => c.id === id)) this.selectedId.set(id);
  }

  kindLabel(item: MysteryObservedEvidence): string {
    switch (item.kind) {
      case 'DETECTION': return 'Detección ± incertidumbre 1σ';
      case 'UPPER_LIMIT': return 'Límite superior · no es un valor medido';
      case 'MISSING': return 'Dato ausente · no equivale a cero';
    }
  }

  observableLabel(value: string): string {
    switch (value) {
      case 'FLUX_DENSITY_JY': return 'Densidad de flujo · Jy';
      case 'ENERGY_FLUX_W_M2': return 'Flujo energético · W/m²';
      case 'FREQUENCY_HZ': return 'Frecuencia · Hz';
      case 'PERIOD_S': return 'Periodo · s';
      case 'DURATION_S': return 'Duración · s';
      case 'RADIAL_VELOCITY_M_S': return 'Velocidad radial · m/s';
      case 'ANGULAR_OFFSET_ARCSEC': return 'Separación angular · arcsec';
      case 'POLARIZATION_FRACTION': return 'Fracción de polarización';
      case 'DIMENSIONLESS_RATIO': return 'Razón adimensional';
      case 'STRAIN': return 'Deformación GW';
      default: return 'No resuelto';
    }
  }
}
