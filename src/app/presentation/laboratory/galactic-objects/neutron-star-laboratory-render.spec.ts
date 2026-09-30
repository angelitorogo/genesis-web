import { TestBed } from '@angular/core/testing';
import { ExtremeType } from '../../../domain/galactic-object/extreme-object-type';
import { neutronStarLaboratoryModel } from './neutron-star-laboratory-render-model';
import { NeutronStarLaboratoryRender } from './neutron-star-laboratory-render';

describe('28.2F.2 — NeutronStarLaboratoryRender', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeutronStarLaboratoryRender] }).compileComponents();
  });

  it('renders the selected scientific classes and exposes pause control without inventing a game object', () => {
    const fixture = TestBed.createComponent(NeutronStarLaboratoryRender);
    fixture.componentRef.setInput('model', neutronStarLaboratoryModel(ExtremeType.PULSAR, 0));
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="neutron-star-laboratory-render"]')?.getAttribute('data-extreme-type')).toBe('PULSAR');
    expect(element.textContent).toContain('HAZ POLAR ESTRUCTURADO');
    expect(element.textContent).toContain('CAMPO DIPOLAR');

    fixture.componentRef.setInput('model', neutronStarLaboratoryModel(ExtremeType.MILLISECOND_PULSAR, 0));
    fixture.detectChanges();
    expect(element.querySelector('[data-testid="neutron-star-laboratory-render"]')?.getAttribute('data-extreme-type')).toBe('MILLISECOND_PULSAR');
    expect(element.textContent).toContain('HAZ POLAR COLIMADO');
    expect(element.textContent).toContain('EMISIÓN DE ALTA CADENCIA');

    fixture.componentRef.setInput('model', neutronStarLaboratoryModel(ExtremeType.MAGNETAR, 0));
    fixture.detectChanges();
    expect(element.querySelector('[data-testid="neutron-star-laboratory-render"]')?.getAttribute('data-extreme-type')).toBe('MAGNETAR');
    expect(element.textContent).toContain('MAGNETOSFERA EXTREMA');
    expect(element.textContent).toContain('ARCOS DE RECONEXIÓN ILUSTRATIVOS');

    const button = element.querySelector('[data-testid="neutron-star-animation-toggle"]') as HTMLButtonElement;
    expect(button).toBeTruthy();
    button.click();
    fixture.detectChanges();
    expect(button.textContent).toContain('REANUDAR');
  });
});
