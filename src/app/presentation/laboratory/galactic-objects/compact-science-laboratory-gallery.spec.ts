import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GalacticObjectLaboratoryPage } from './galactic-object-laboratory';

describe('27.10 — accessible laboratory-only compact visual check', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalacticObjectLaboratoryPage], providers: [provideRouter([])],
    }).compileComponents();
  });

  it('exposes four labelled diagrams while preserving the original 17 laboratory cases', () => {
    const fixture = TestBed.createComponent(GalacticObjectLaboratoryPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const gallery = root.querySelector('[data-testid="compact-science-laboratory-gallery"]');
    expect(gallery).toBeTruthy();
    expect(gallery?.querySelectorAll('[data-testid="compact-object-scientific-render"]')).toHaveLength(4);
    expect(gallery?.querySelector('[data-testid="compact-science-disk"]')).toBeNull();
    expect(gallery?.querySelector('[data-testid="compact-science-jets"]')).toBeNull();
    expect(root.querySelectorAll('[data-testid="galactic-object-laboratory-case-button"]')).toHaveLength(14);
    expect(root.querySelectorAll('[data-testid="galactic-nucleus-laboratory-case-button"]')).toHaveLength(3);
    expect(gallery?.textContent).toContain('No son objetos descubiertos');
  });
});
