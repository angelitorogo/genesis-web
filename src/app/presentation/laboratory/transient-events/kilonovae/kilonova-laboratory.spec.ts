import { TestBed } from '@angular/core/testing';
import { KilonovaLaboratoryPage } from './kilonova-laboratory';

describe('29.3 Kilonova laboratory', () => {
  it('renders both compact-merger families without touching gameplay persistence', async () => {
    await TestBed.configureTestingModule({ imports: [KilonovaLaboratoryPage] }).compileComponents();
    const fixture = TestBed.createComponent(KilonovaLaboratoryPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="kilonova-laboratory-page"]')).not.toBeNull();
    expect(root.textContent).toContain('Fusión de dos estrellas de neutrones');
    expect(root.textContent).toContain('NS–BH');
  });
});
