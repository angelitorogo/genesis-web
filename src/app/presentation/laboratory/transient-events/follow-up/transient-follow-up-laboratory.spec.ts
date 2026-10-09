import { TestBed } from '@angular/core/testing';
import { TransientFollowUpLaboratoryPage } from './transient-follow-up-laboratory';

describe('TransientFollowUpLaboratoryPage 29.10', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TransientFollowUpLaboratoryPage] }).compileComponents();
  });

  it('shows the eleven read-only source and observer boundary examples', () => {
    const fixture = TestBed.createComponent(TransientFollowUpLaboratoryPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.cases).toHaveLength(11);
    expect(element.querySelector('[data-testid="transient-follow-up-model-track"]')).toBeTruthy();
    expect(element.querySelector('[data-testid="transient-follow-up-observation-track"]')).toBeTruthy();
    expect(element.textContent).toContain('Seguimiento de eventos transitorios');
  });

  it('allows manual source-time follow-up while retaining observer track empty for modelled novae', () => {
    const fixture = TestBed.createComponent(TransientFollowUpLaboratoryPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const milestones = component.track().modelMilestones;
    expect(milestones.length).toBeGreaterThan(3);
    component.selectSourceTime(milestones[1].timeAfterOnsetSeconds);
    fixture.detectChanges();
    expect(component.activeModelMilestone()?.id).toBe(milestones[1].id);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="transient-follow-up-no-observations"]')).toBeTruthy();
  });

  it('does not invent a GW observation or calendar UTC for a canonical future merger', () => {
    const fixture = TestBed.createComponent(TransientFollowUpLaboratoryPage);
    fixture.componentInstance.selectCase('future-merger');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="transient-follow-up-no-model"]')).toBeTruthy();
    expect(element.querySelector('[data-testid="transient-follow-up-no-observations"]')).toBeTruthy();
    expect(element.querySelector('[data-testid="transient-follow-up-classification"]')?.textContent)
      .toContain('futuro');
  });

  it('keeps the statistical-only flare without source or observed timeline', () => {
    const fixture = TestBed.createComponent(TransientFollowUpLaboratoryPage);
    fixture.componentInstance.selectCase('statistics');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Sin evento individual');
    expect(fixture.componentInstance.track().observations).toHaveLength(0);
  });

  it('shows optical ambiguity and multi-messenger compatibility without a new canonical event', () => {
    const fixture = TestBed.createComponent(TransientFollowUpLaboratoryPage);
    fixture.componentInstance.selectCase('optical');
    fixture.detectChanges();
    let element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="transient-follow-up-classification"]')?.textContent)
      .toContain('ambigua');
    expect(element.querySelector('[data-testid="transient-follow-up-candidates"]')?.textContent).toContain('Supernova');
    fixture.componentInstance.selectCase('multimessenger');
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="transient-follow-up-candidates"]')?.textContent).toContain('Kilonova');
    expect(element.querySelector('[data-testid="transient-follow-up-candidates"]')?.textContent).not.toContain('GRB');
    expect(element.textContent).toContain('0 · solo lectura');
  });
});
