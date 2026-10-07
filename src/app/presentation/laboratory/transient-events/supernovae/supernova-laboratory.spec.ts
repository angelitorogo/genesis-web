import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SupernovaLaboratoryPage } from './supernova-laboratory';

describe('29.1A — SupernovaLaboratoryPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupernovaLaboratoryPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the four canonical Ia/II/Ib/Ic laboratory families', () => {
    const fixture = TestBed.createComponent(SupernovaLaboratoryPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="supernova-laboratory-page"]')).toBeTruthy();
    expect(element.querySelectorAll('[data-testid="supernova-laboratory-type-button"]')).toHaveLength(4);
    expect(element.textContent).toContain('Supernovas');
    expect(element.textContent).toContain('no usa el reloj real');
    expect(element.querySelector('[data-testid="supernova-laboratory-young-render"]')).toBeTruthy();
    expect(element.querySelector('[data-testid="supernova-laboratory-procedural-scene"]')).toBeNull();
    expect(element.querySelector('app-supernova-remnant-render')).toBeNull();
  });

  it('switches family without advancing time implicitly', () => {
    const fixture = TestBed.createComponent(SupernovaLaboratoryPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const typeII = element.querySelector<HTMLButtonElement>(
      '[data-testid="supernova-laboratory-type-button"][data-type="TYPE_II"]',
    );
    typeII?.click();
    fixture.detectChanges();

    const active = element.querySelector('[data-testid="supernova-laboratory-active-case"]');
    expect(active?.getAttribute('data-supernova-type')).toBe('TYPE_II');
    expect(active?.getAttribute('data-phase')).toBe('EXPLOSION');
  });

  it('moves through relative phases only when the manual laboratory time changes', () => {
    const fixture = TestBed.createComponent(SupernovaLaboratoryPage);
    fixture.detectChanges();

    fixture.componentInstance.jumpToPeak();
    fixture.detectChanges();

    const active = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="supernova-laboratory-active-case"]',
    );
    expect(active?.getAttribute('data-phase')).toBe('PEAK');
  });
});
