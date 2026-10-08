import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NovaLaboratoryPage } from './nova-laboratory';

describe('NovaLaboratoryPage 29.2', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NovaLaboratoryPage], providers: [provideRouter([])] }).compileComponents();
  });

  it('renders classical and recurrent nova cases without mutating a game', () => {
    const fixture = TestBed.createComponent(NovaLaboratoryPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="nova-laboratory-page"]')).toBeTruthy();
    expect(element.querySelectorAll('[data-testid="nova-laboratory-type-button"]')).toHaveLength(2);
    expect(element.textContent).toContain('La enana blanca sobrevive');
  });
});
