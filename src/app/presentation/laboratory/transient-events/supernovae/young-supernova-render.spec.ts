import { TestBed } from '@angular/core/testing';
import { SUPERNOVA_LABORATORY_CASES } from './supernova-laboratory-fixtures';
import { YoungSupernovaRender } from './young-supernova-render';

describe('29.1A.4 — YoungSupernovaRender', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YoungSupernovaRender],
    }).compileComponents();
  });

  it('exposes one dedicated canvas-based young-supernova scene', () => {
    const fixture = TestBed.createComponent(YoungSupernovaRender);
    fixture.componentRef.setInput('profile', SUPERNOVA_LABORATORY_CASES[0].profile);
    fixture.componentRef.setInput('elapsedDays', 600);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="young-supernova-render"]')).toBeTruthy();
    expect(element.querySelectorAll('canvas')).toHaveLength(1);
    expect(element.querySelector('svg')).toBeNull();
  });
});
