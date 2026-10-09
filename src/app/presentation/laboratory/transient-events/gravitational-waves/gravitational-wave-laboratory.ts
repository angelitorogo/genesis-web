import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  GravitationalWavePostMergerResolution,
  type GravitationalWavePostMergerResolution as GravitationalWavePostMergerResolutionValue,
} from '../../../../domain/transient/gravitational-wave-event-profile';
import { CompactMergerType, type CompactMergerType as CompactMergerTypeValue } from '../../../../domain/transient/compact-merger-type';
import { GRAVITATIONAL_WAVE_LABORATORY_CASES } from './gravitational-wave-laboratory-fixtures';

@Component({
  selector: 'app-gravitational-wave-laboratory',
  standalone: true,
  templateUrl: './gravitational-wave-laboratory.html',
  styleUrl: './gravitational-wave-laboratory.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GravitationalWaveLaboratoryPage {
  readonly cases = GRAVITATIONAL_WAVE_LABORATORY_CASES;
  readonly selectedType = signal<CompactMergerTypeValue>(CompactMergerType.NEUTRON_STAR_NEUTRON_STAR);
  readonly selectedCase = computed(() => this.cases.find(item => item.id === this.selectedType()) ?? this.cases[0]);

  selectType(value: CompactMergerTypeValue): void { this.selectedType.set(value); }

  format(value: number, digits = 3): string {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value);
  }
  scientific(value: number): string {
    return value.toExponential(2).replace('e+', ' × 10^').replace('e-', ' × 10^-');
  }
  frequency(value: number): string {
    if (value >= 1_000) return `${this.format(value / 1_000, 3)} kHz`;
    if (value >= 1) return `${this.format(value, 3)} Hz`;
    if (value >= 1e-3) return `${this.format(value * 1e3, 3)} mHz`;
    return `${this.format(value * 1e6, 3)} µHz`;
  }
  wavelength(meters: number): string {
    const au = meters / 149_597_870_700;
    return au >= 0.01 ? `${this.format(au, 3)} UA` : `${this.format(meters / 1e9, 3)} Gm`;
  }
  postMergerLabel(value: GravitationalWavePostMergerResolutionValue): string {
    return value === GravitationalWavePostMergerResolution.NEUTRON_STAR_EOS_UNRESOLVED
      ? 'Sin resolver: ecuación de estado / dinámica post-fusión NS'
      : 'Sin resolver: masa final / spin Kerr';
  }
}
