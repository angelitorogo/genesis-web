import { TestBed } from '@angular/core/testing';
import { FastRadioBurstOutcome } from '../../../../domain/transient/fast-radio-burst-event-profile';
import { FastRadioBurstRepetitionState } from '../../../../domain/transient/fast-radio-burst-source-profile';
import { FastRadioBurstLaboratoryPage } from './fast-radio-burst-laboratory';
import { FastRadioBurstLaboratoryCaseId } from './fast-radio-burst-laboratory-fixtures';

describe('FastRadioBurstLaboratoryPage 29.8', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FastRadioBurstLaboratoryPage] }).compileComponents();
  });

  it('renders the five deterministic FRB boundary cases', () => {
    const fixture = TestBed.createComponent(FastRadioBurstLaboratoryPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;

    expect(component.cases.map(item => item.id)).toEqual([
      FastRadioBurstLaboratoryCaseId.MAGNETAR_BURST,
      FastRadioBurstLaboratoryCaseId.MAGNETAR_REPEATER,
      FastRadioBurstLaboratoryCaseId.DISPERSION_REFERENCE,
      FastRadioBurstLaboratoryCaseId.UNKNOWN_SOURCE_BURST,
      FastRadioBurstLaboratoryCaseId.NS_NS_ENGINE_UNRESOLVED,
    ]);
    expect(element.querySelector('[data-testid="fast-radio-burst-intrinsic-diagram"]')).toBeTruthy();
    expect(element.textContent).toContain('Fast Radio Bursts (FRB)');
  });

  it('does not infer non-repetition from a single magnetar burst', () => {
    const fixture = TestBed.createComponent(FastRadioBurstLaboratoryPage);
    fixture.detectChanges();
    const profile = fixture.componentInstance.selectedCase().profile;
    const element = fixture.nativeElement as HTMLElement;

    expect(profile.source.repetitionState).toBe(FastRadioBurstRepetitionState.REPETITION_UNRESOLVED);
    expect(profile.repetitionPeriodSeconds).toBeNull();
    expect(element.textContent).toContain('un burst no demuestra no repetición');
  });

  it('shows confirmed repetition without inventing a recurrence period', () => {
    const fixture = TestBed.createComponent(FastRadioBurstLaboratoryPage);
    const component = fixture.componentInstance;
    component.selectCase(FastRadioBurstLaboratoryCaseId.MAGNETAR_REPEATER);
    fixture.detectChanges();

    expect(component.selectedCase().profile.source.repetitionState)
      .toBe(FastRadioBurstRepetitionState.REPEATING_CONFIRMED);
    expect(component.selectedCase().profile.repetitionPeriodSeconds).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent)
      .toContain('Repetición confirmada · periodo no inferido');
  });

  it('renders a DM sweep only for the explicit propagation reference and keeps distance unresolved', () => {
    const fixture = TestBed.createComponent(FastRadioBurstLaboratoryPage);
    const component = fixture.componentInstance;
    component.selectCase(FastRadioBurstLaboratoryCaseId.DISPERSION_REFERENCE);
    fixture.detectChanges();
    const profile = component.selectedCase().profile;
    const element = fixture.nativeElement as HTMLElement;

    expect(profile.coldPlasmaDispersionDelaySeconds).toBeCloseTo(0.58083312, 7);
    expect(profile.luminosityDistanceParsec).toBeNull();
    expect(element.querySelector('[data-testid="fast-radio-burst-dispersion-sweep"]')).toBeTruthy();
    expect(element.textContent).toContain('Es dispersión, no distancia');
  });

  it('allows an intrinsic FRB while leaving the progenitor unclassified', () => {
    const fixture = TestBed.createComponent(FastRadioBurstLaboratoryPage);
    const component = fixture.componentInstance;
    component.selectCase(FastRadioBurstLaboratoryCaseId.UNKNOWN_SOURCE_BURST);
    fixture.detectChanges();

    expect(component.selectedCase().profile.outcome)
      .toBe(FastRadioBurstOutcome.INTRINSIC_COHERENT_RADIO_BURST);
    expect((fixture.nativeElement as HTMLElement).textContent)
      .toContain('progenitor no clasificado');
  });

  it('does not promote an NS-NS merger into an FRB without a radio engine', () => {
    const fixture = TestBed.createComponent(FastRadioBurstLaboratoryPage);
    const component = fixture.componentInstance;
    component.selectCase(FastRadioBurstLaboratoryCaseId.NS_NS_ENGINE_UNRESOLVED);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(component.selectedCase().profile.outcome).toBe(FastRadioBurstOutcome.BURST_ENGINE_UNRESOLVED);
    expect(element.querySelector('[data-testid="fast-radio-burst-engine-unresolved"]')).toBeTruthy();
    expect(element.textContent).toContain('Una fusión NS–NS no implica un FRB');
    expect(element.textContent).toContain('No evaluable hasta resolver el burst FRB');
    expect(element.textContent).not.toContain('Sin resolver · un burst no demuestra no repetición');
  });

  it('keeps the single-burst repetition warning for an actually resolved intrinsic burst', () => {
    const fixture = TestBed.createComponent(FastRadioBurstLaboratoryPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.selectedCase().profile.outcome)
      .toBe(FastRadioBurstOutcome.INTRINSIC_COHERENT_RADIO_BURST);
    expect(element.textContent).toContain('Sin resolver · un burst no demuestra no repetición');
    expect(element.textContent).not.toContain('No evaluable hasta resolver el burst FRB');
  });

  it('keeps 29.8 separated from 27.6, 29.4 and 29.5', () => {
    const fixture = TestBed.createComponent(FastRadioBurstLaboratoryPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="fast-radio-burst-channel-boundary"]')?.textContent)
      .toContain('27.6, 29.4 ni 29.5');
  });
});
