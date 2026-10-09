import { TestBed } from '@angular/core/testing';
import { TidalDisruptionOutcome } from '../../../../domain/transient/tidal-disruption-event-profile';
import { TidalDisruptionLaboratoryPage } from './tidal-disruption-laboratory';
import { TidalDisruptionLaboratoryCaseId } from './tidal-disruption-laboratory-fixtures';

describe('TidalDisruptionLaboratoryPage 29.6', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TidalDisruptionLaboratoryPage] }).compileComponents();
  });

  it('renders the four deterministic stellar TDE reference cases', () => {
    const fixture = TestBed.createComponent(TidalDisruptionLaboratoryPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;

    expect(component.cases.map(item => item.id)).toEqual([
      TidalDisruptionLaboratoryCaseId.SOLAR_SMBH,
      TidalDisruptionLaboratoryCaseId.RED_GIANT_SMBH,
      TidalDisruptionLaboratoryCaseId.WHITE_DWARF_IMBH,
      TidalDisruptionLaboratoryCaseId.DIRECT_CAPTURE_REFERENCE,
    ]);
    expect(element.querySelector('[data-testid="tidal-disruption-geometry"]')).toBeTruthy();
    expect(element.textContent).toContain('Disrupciones de marea estrella–agujero negro');
  });

  it('renders normalized fallback only when an external disruption is physically resolved', () => {
    const fixture = TestBed.createComponent(TidalDisruptionLaboratoryPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="tidal-disruption-fallback-curve"]')).toBeTruthy();
    expect(element.textContent).toContain('no es luminosidad');

    component.selectCase(TidalDisruptionLaboratoryCaseId.RED_GIANT_SMBH);
    fixture.detectChanges();
    expect(element.querySelector('[data-testid="tidal-disruption-fallback-curve"]')).toBeNull();
    expect(element.querySelector('[data-testid="tidal-disruption-fallback-unresolved"]')).toBeTruthy();
    expect(element.textContent).toContain('Fracción de masa ligada sin resolver');
  });

  it('shows direct capture as a Schwarzschild reference rather than fabricating Kerr physics', () => {
    const fixture = TestBed.createComponent(TidalDisruptionLaboratoryPage);
    const component = fixture.componentInstance;
    component.selectCase(TidalDisruptionLaboratoryCaseId.DIRECT_CAPTURE_REFERENCE);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const current = component.selectedCase();

    expect(current.profile.outcome).toBe(TidalDisruptionOutcome.DIRECT_CAPTURE_NONSPINNING_REFERENCE);
    expect(current.profile.pericenterToCaptureRatio).toBeLessThan(1);
    expect(element.textContent).toContain('Captura directa en referencia Schwarzschild');
    expect(element.querySelector('[data-testid="tidal-disruption-observer-boundary"]')?.textContent).toContain('Spin Kerr');
  });

  it('keeps classical TDEs separated from the NS-BH tidal-disruption channel', () => {
    const fixture = TestBed.createComponent(TidalDisruptionLaboratoryPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="tidal-disruption-channel-boundary"]')?.textContent).toContain('29.3/29.4');
    expect(element.textContent).toContain('IMBH/SMBH');
  });
});
