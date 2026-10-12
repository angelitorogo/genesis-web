import { TestBed } from '@angular/core/testing';
import { MysteryUnresolvedLaboratoryPage } from './mystery-unresolved-laboratory';

describe('30.5 unresolved mystery laboratory', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MysteryUnresolvedLaboratoryPage] }).compileComponents();
  });
  it('offers six cases without a forced classification or Ground Truth', () => {
    const fixture = TestBed.createComponent(MysteryUnresolvedLaboratoryPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="mystery-unresolved-laboratory"]')).toBeTruthy();
    expect(root.querySelectorAll('.tabs button')).toHaveLength(6);
    expect(root.textContent).toContain('Abierto · sin clasificar');
    expect(root.textContent).toContain('No identificado');
  });
  it('closes a bounded campaign and reopens when fresh evidence arrives', () => {
    const fixture = TestBed.createComponent(MysteryUnresolvedLaboratoryPage);
    const page = fixture.componentInstance;
    page.selectCase('reopened'); fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid="mystery-unresolved-close"]')!.click();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cerrado sin resolver');
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid="mystery-unresolved-followup"]')!.click();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Reabierto por nueva evidencia');
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="mystery-unresolved-closure"]')).toBeTruthy();
  });
});
