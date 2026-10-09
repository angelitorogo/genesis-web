import { TestBed } from '@angular/core/testing';
import {
  GammaRayBurstObserverPromptStatus,
  GammaRayBurstOutcome,
} from '../../../../domain/transient/gamma-ray-burst-event-profile';
import { GammaRayBurstLaboratoryPage } from './gamma-ray-burst-laboratory';
import { GammaRayBurstLaboratoryCaseId } from './gamma-ray-burst-laboratory-fixtures';

describe('GammaRayBurstLaboratoryPage 29.7', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GammaRayBurstLaboratoryPage] }).compileComponents();
  });

  it('renders the five deterministic GRB boundary cases', () => {
    const fixture = TestBed.createComponent(GammaRayBurstLaboratoryPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;

    expect(component.cases.map(item => item.id)).toEqual([
      GammaRayBurstLaboratoryCaseId.SHORT_NS_NS,
      GammaRayBurstLaboratoryCaseId.SHORT_NS_BH_UNRESOLVED,
      GammaRayBurstLaboratoryCaseId.LONG_COLLAPSAR_ON_AXIS,
      GammaRayBurstLaboratoryCaseId.SHORT_OFF_AXIS_REFERENCE,
      GammaRayBurstLaboratoryCaseId.CHOKED_COLLAPSAR,
    ]);
    expect(element.querySelector('[data-testid="gamma-ray-burst-jet-geometry"]')).toBeTruthy();
    expect(element.textContent).toContain('Estallidos de rayos gamma');
  });

  it('keeps the NS-NS source intrinsically resolved while leaving observer prompt geometry unresolved', () => {
    const fixture = TestBed.createComponent(GammaRayBurstLaboratoryPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;
    const current = component.selectedCase();

    expect(current.profile.outcome).toBe(GammaRayBurstOutcome.SUCCESSFUL_SHORT_GRB_ENGINE);
    expect(current.profile.observerPromptStatus).toBe(
      GammaRayBurstObserverPromptStatus.ORIENTATION_UNRESOLVED,
    );
    expect(current.profile.isotropicEquivalentGammaEnergyJoules).toBeNull();
    expect(element.textContent).toContain('Un jet intrínseco no equivale a un GRB observado');
  });

  it('does not promote NS-BH into a GRB while jet launch remains unresolved', () => {
    const fixture = TestBed.createComponent(GammaRayBurstLaboratoryPage);
    const component = fixture.componentInstance;
    component.selectCase(GammaRayBurstLaboratoryCaseId.SHORT_NS_BH_UNRESOLVED);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(component.selectedCase().profile.outcome).toBe(
      GammaRayBurstOutcome.JET_LAUNCH_UNRESOLVED,
    );
    expect(element.querySelector('[data-testid="gamma-ray-burst-engine-unresolved"]')).toBeTruthy();
    expect(element.textContent).toContain('la fusión existe, el GRB no se inventa');
  });

  it('shows breakout for a successful collapsar and preserves the distinction between engine time and observed T90', () => {
    const fixture = TestBed.createComponent(GammaRayBurstLaboratoryPage);
    const component = fixture.componentInstance;
    component.selectCase(GammaRayBurstLaboratoryCaseId.LONG_COLLAPSAR_ON_AXIS);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const profile = component.selectedCase().profile;

    expect(profile.outcome).toBe(GammaRayBurstOutcome.SUCCESSFUL_LONG_GRB_ENGINE);
    expect(profile.stellarBreakoutTimeSeconds!).toBeLessThan(profile.engineActivityDurationSeconds!);
    expect(element.querySelector('[data-testid="gamma-ray-burst-engine-timeline"]')).toBeTruthy();
    expect(element.textContent).toContain('Actividad del motor ≠ T90 observado');
  });

  it('distinguishes off-axis geometry from an absent jet and a choked collapsar', () => {
    const fixture = TestBed.createComponent(GammaRayBurstLaboratoryPage);
    const component = fixture.componentInstance;

    component.selectCase(GammaRayBurstLaboratoryCaseId.SHORT_OFF_AXIS_REFERENCE);
    fixture.detectChanges();
    expect(component.selectedCase().profile.observerPromptStatus).toBe(
      GammaRayBurstObserverPromptStatus.OFF_AXIS_PROMPT_SUPPRESSED,
    );

    component.selectCase(GammaRayBurstLaboratoryCaseId.CHOKED_COLLAPSAR);
    fixture.detectChanges();
    expect(component.selectedCase().profile.outcome).toBe(
      GammaRayBurstOutcome.CHOKED_COLLAPSAR_NO_CLASSICAL_GRB,
    );
    expect(component.selectedCase().profile.sourceFrameExternalJetActivitySeconds).toBeNull();
  });

  it('renders stellar breakout as not applicable for compact-merger channels', () => {
    const fixture = TestBed.createComponent(GammaRayBurstLaboratoryPage);
    const component = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;

    for (const id of [
      GammaRayBurstLaboratoryCaseId.SHORT_NS_NS,
      GammaRayBurstLaboratoryCaseId.SHORT_NS_BH_UNRESOLVED,
      GammaRayBurstLaboratoryCaseId.SHORT_OFF_AXIS_REFERENCE,
    ]) {
      component.selectCase(id);
      fixture.detectChanges();

      const breakoutMetric = Array.from(element.querySelectorAll('.grb-lab__metrics > div'))
        .find(metric => metric.querySelector('dt')?.textContent?.includes('Breakout estelar'));

      expect(breakoutMetric?.querySelector('dd')?.textContent?.trim()).toBe('No aplica');
    }
  });

  it('renders a choked collapsar external jet as resolved absent rather than unresolved', () => {
    const fixture = TestBed.createComponent(GammaRayBurstLaboratoryPage);
    const component = fixture.componentInstance;
    component.selectCase(GammaRayBurstLaboratoryCaseId.CHOKED_COLLAPSAR);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const externalJetMetric = Array.from(element.querySelectorAll('.grb-lab__metrics > div'))
      .find(metric => metric.querySelector('dt')?.textContent?.includes('Jet externo disponible'));

    expect(externalJetMetric?.querySelector('dd')?.textContent?.trim())
      .toBe('No: jet ahogado / no emerge');
  });

  it('keeps 29.7 separated from canonical progenitor events and excludes BH-BH prompt GRBs', () => {
    const fixture = TestBed.createComponent(GammaRayBurstLaboratoryPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="gamma-ray-burst-channel-boundary"]')?.textContent)
      .toContain('29.1, 29.3, 29.4 ni 29.5');
    expect(element.textContent).toContain('BH–BH no se trata como canal GRB prompt');
  });
});
