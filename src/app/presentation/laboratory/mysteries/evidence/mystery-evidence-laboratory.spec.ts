import { TestBed } from '@angular/core/testing';
import { MysteryEvidenceLaboratoryPage } from './mystery-evidence-laboratory';
import { MYSTERY_EVIDENCE_LABORATORY_CASES } from './mystery-evidence-laboratory-fixtures';

describe('30.2 mystery evidence read-only laboratory', () => {
  it('shows all four scenarios without revealing any canonical source', async () => {
    await TestBed.configureTestingModule({ imports: [MysteryEvidenceLaboratoryPage] }).compileComponents();
    const fixture = TestBed.createComponent(MysteryEvidenceLaboratoryPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="mystery-evidence-laboratory"]')).toBeTruthy();
    expect(root.querySelectorAll('.mystery__tabs button')).toHaveLength(4);
    expect(MYSTERY_EVIDENCE_LABORATORY_CASES).toHaveLength(4);
    expect(root.textContent).toContain('Sin clasificar');
    expect(root.textContent).not.toContain('Ground Truth canónico:');
  });

  it('renders an apparent contradiction only for the same-epoch discrepant case', async () => {
    await TestBed.configureTestingModule({ imports: [MysteryEvidenceLaboratoryPage] }).compileComponents();
    const fixture = TestBed.createComponent(MysteryEvidenceLaboratoryPage);
    fixture.componentInstance.selectCase('tension');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('[data-testid="mystery-apparent-tension"]')).toHaveLength(1);
    fixture.componentInstance.selectCase('variability');
    fixture.detectChanges();
    expect(root.querySelectorAll('[data-testid="mystery-apparent-tension"]')).toHaveLength(0);
    expect(root.textContent).toContain('no confirma');
  });

  it('does not classify phenomena without a source and does not create observations from gaps', () => {
    const r = MYSTERY_EVIDENCE_LABORATORY_CASES.find(c => c.id === 'phenomenon')!.assessment;
    expect(r.summary.missing).toBe(1);
    expect(r.summary.detections).toBe(0);
    expect(r.subject.classification).toBe('UNKNOWN_PHENOMENON');
  });
});
