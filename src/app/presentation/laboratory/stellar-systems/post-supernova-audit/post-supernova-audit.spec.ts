import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PostSupernovaAuditPage } from './post-supernova-audit';

describe('PostSupernovaAuditPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostSupernovaAuditPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the four deterministic 29.1E-g.1 before/after cases', () => {
    const fixture = TestBed.createComponent(PostSupernovaAuditPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="post-supernova-audit-page"]')).toBeTruthy();
    expect(element.querySelectorAll('.post-sn-case')).toHaveLength(4);
    expect(element.querySelector('[data-testid="post-supernova-audit-case-A"]')?.textContent)
      .toContain('BOUND_RECONFIGURED');
    expect(element.querySelector('[data-testid="post-supernova-audit-case-B"]')?.textContent)
      .toContain('EJECTED');
    expect(element.querySelector('[data-testid="post-supernova-audit-case-C"]')?.textContent)
      .toContain('DISRUPTED_HIERARCHY');
    expect(element.querySelector('[data-testid="post-supernova-audit-case-D"]')?.textContent)
      .toContain('BINARY_UNCHANGED');
  }, 120_000);

  it('makes the visual contract self-explanatory without requiring galaxy hunting', () => {
    const fixture = TestBed.createComponent(PostSupernovaAuditPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent ?? '';

    expect(text).toContain('ANTES');
    expect(text).toContain('DESPUÉS');
    expect(text).toContain('Límite lunar prógrado');
    expect(text).toContain('Sin órbita kepleriana cerrada');
    expect(text).toContain('HIERARCHY_DISRUPTED');
    expect(text).toContain('Criterio de cierre visual');
  }, 120_000);
});
