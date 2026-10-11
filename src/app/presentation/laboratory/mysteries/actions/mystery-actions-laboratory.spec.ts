import { TestBed } from '@angular/core/testing';
import { MysteryActionsLaboratoryPage } from './mystery-actions-laboratory';
import { MYSTERY_ACTION_LABORATORY_CASES } from '../../../../simulation/mystery/mystery-action-laboratory-fixtures';

describe('30.3 scientific action laboratory', () => {
  it('displays five cases and does not create evidence before explicit acquisition', async () => {
    await TestBed.configureTestingModule({ imports: [MysteryActionsLaboratoryPage] }).compileComponents();
    const fixture = TestBed.createComponent(MysteryActionsLaboratoryPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="mystery-actions-laboratory"]')).toBeTruthy();
    expect(root.querySelectorAll('.tabs button')).toHaveLength(5);
    expect(MYSTERY_ACTION_LABORATORY_CASES).toHaveLength(5);
    expect(root.querySelectorAll('[data-testid="mystery-action-evidence"]')).toHaveLength(3);
    expect(root.textContent).toContain('Sin clasificar');
  });

  it('enables supported actions, blocks offline instruments and updates only after click', async () => {
    await TestBed.configureTestingModule({ imports: [MysteryActionsLaboratoryPage] }).compileComponents();
    const fixture = TestBed.createComponent(MysteryActionsLaboratoryPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const opt = root.querySelector<HTMLButtonElement>('[data-testid="mystery-action-OPT-SPECTRUM"]')!;
    const xray = root.querySelector<HTMLButtonElement>('[data-testid="mystery-action-XRAY-OBS"]')!;
    expect(opt.disabled).toBe(false);
    expect(xray.disabled).toBe(true);
    opt.click();
    fixture.detectChanges();
    expect(root.querySelectorAll('[data-testid="mystery-action-evidence"]')).toHaveLength(5);
    expect(root.querySelectorAll('[data-testid="mystery-action-completed"]')).toHaveLength(1);
    expect(root.textContent).toContain('Sin clasificar');
    root.querySelector<HTMLButtonElement>('[data-testid="mystery-actions-reset"]')!.click();
    fixture.detectChanges();
    expect(root.querySelectorAll('[data-testid="mystery-action-evidence"]')).toHaveLength(3);
  });

  it('switches scenarios with a clean local acquisition state', async () => {
    await TestBed.configureTestingModule({ imports: [MysteryActionsLaboratoryPage] }).compileComponents();
    const fixture = TestBed.createComponent(MysteryActionsLaboratoryPage);
    fixture.componentInstance.selectCase('astrometry');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('[data-testid="mystery-action-evidence"]')).toHaveLength(1);
    fixture.componentInstance.takeObservation('LOCALIZE-RADIO');
    fixture.detectChanges();
    expect(root.querySelectorAll('[data-testid="mystery-action-evidence"]')).toHaveLength(2);
    fixture.componentInstance.selectCase('unsupported');
    fixture.detectChanges();
    expect(root.querySelectorAll('[data-testid="mystery-action-evidence"]')).toHaveLength(1);
    expect(root.querySelectorAll('[data-testid="mystery-action-blocked"]')).toHaveLength(1);
  });
});
