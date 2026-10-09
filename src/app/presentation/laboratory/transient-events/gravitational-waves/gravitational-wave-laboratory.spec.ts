import { TestBed } from '@angular/core/testing';
import { CompactMergerType } from '../../../../domain/transient/compact-merger-type';
import { GravitationalWaveLaboratoryPage } from './gravitational-wave-laboratory';

describe('GravitationalWaveLaboratoryPage 29.5', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GravitationalWaveLaboratoryPage] }).compileComponents();
  });

  it('renders one intrinsic normalized waveform for each of the three 29.4 merger channels', () => {
    const fixture = TestBed.createComponent(GravitationalWaveLaboratoryPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;

    expect(component.cases.map(item => item.id)).toEqual([
      CompactMergerType.NEUTRON_STAR_NEUTRON_STAR,
      CompactMergerType.NEUTRON_STAR_BLACK_HOLE,
      CompactMergerType.BLACK_HOLE_BLACK_HOLE,
    ]);
    expect(element.querySelector('[data-testid="gw-normalized-waveform"]')).toBeTruthy();
    expect(element.textContent).toContain('amplitud normalizada ≠ strain observado');
  });

  it('keeps observer strain unresolved instead of inventing distance or orientation', () => {
    const fixture = TestBed.createComponent(GravitationalWaveLaboratoryPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="gw-observer-boundary"]')?.textContent).toContain('faltan distancia luminosidad');
    expect(element.textContent).toContain('Strain observado');
    expect(element.textContent).toContain('No resuelto');
  });

  it('keeps every laboratory waveform above the anti-alias sampling target at its final frequency', () => {
    const fixture = TestBed.createComponent(GravitationalWaveLaboratoryPage);
    const component = fixture.componentInstance;

    for (const item of component.cases) {
      const sampleIntervalSeconds = item.waveform.durationSeconds / (item.waveform.samples.length - 1);
      const samplesPerEndFrequencyCycle = 1 / (sampleIntervalSeconds * item.waveform.endFrequencyHz);
      expect(samplesPerEndFrequencyCycle).toBeGreaterThanOrEqual(12);
    }
  });

  it('switches to BH-BH while preserving a finite Schwarzschild ISCO reference', () => {
    const fixture = TestBed.createComponent(GravitationalWaveLaboratoryPage);
    fixture.componentInstance.selectType(CompactMergerType.BLACK_HOLE_BLACK_HOLE);
    fixture.detectChanges();
    const current = fixture.componentInstance.selectedCase();
    expect(current.id).toBe(CompactMergerType.BLACK_HOLE_BLACK_HOLE);
    expect(current.profile.nonSpinningIscoFrequencyHz).toBeGreaterThan(70);
    expect(current.profile.nonSpinningIscoFrequencyHz).toBeLessThan(80);
    expect(current.waveform.samples.length).toBeGreaterThanOrEqual(512);
    expect(current.waveform.samples.length).toBeLessThanOrEqual(4096);
  });
});
