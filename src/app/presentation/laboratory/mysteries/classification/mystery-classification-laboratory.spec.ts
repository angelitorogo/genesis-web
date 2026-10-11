import { TestBed } from '@angular/core/testing';
import { MysteryClassificationLaboratoryPage } from './mystery-classification-laboratory';

describe('30.4 classification laboratory', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MysteryClassificationLaboratoryPage] }).compileComponents();
  });

  it('shows six explicit classifications scenarios and the review audit', () => {
    const fixture = TestBed.createComponent(MysteryClassificationLaboratoryPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="mystery-classification-laboratory"]')).toBeTruthy();
    expect(root.querySelectorAll('.tabs button')).toHaveLength(6);
    expect(root.querySelectorAll('[data-testid="mystery-classification-rule"]')).toHaveLength(2);
    expect(root.querySelectorAll('[data-testid="mystery-classification-revision"]')).toHaveLength(1);
    expect(root.textContent).toContain('Sin clasificar');
  });

  it('promotes on explicit new evidence and can reopen without removing prior revisions', () => {
    const fixture = TestBed.createComponent(MysteryClassificationLaboratoryPage);
    const page = fixture.componentInstance;
    page.selectCase('reopen');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="mystery-classification-status"]')?.textContent).toContain('Provisional');
    root.querySelector<HTMLButtonElement>('[data-testid="mystery-classification-next"]')!.click();
    fixture.detectChanges();
    expect(root.querySelector('[data-testid="mystery-classification-status"]')?.textContent).toContain('Respaldada');
    root.querySelector<HTMLButtonElement>('[data-testid="mystery-classification-next"]')!.click();
    fixture.detectChanges();
    expect(root.querySelector('[data-testid="mystery-classification-status"]')?.textContent).toContain('En revisión');
    expect(root.querySelectorAll('[data-testid="mystery-classification-revision"]')).toHaveLength(3);
    root.querySelector<HTMLButtonElement>('[data-testid="mystery-classification-reset"]')!.click();
    fixture.detectChanges();
    expect(root.querySelectorAll('[data-testid="mystery-classification-revision"]')).toHaveLength(1);
  });
});
