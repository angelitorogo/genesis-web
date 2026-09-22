import { TestBed } from '@angular/core/testing';
import { CompactObjectScientificRender } from './compact-object-scientific-render';
import { compactObjectScientificVisual } from './compact-object-scientific-visual';

describe('27.10 — accessible compact diagram', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CompactObjectScientificRender] }).compileComponents();
  });

  it('renders a black-hole shadow without an invented disk or jets', () => {
    const fixture = TestBed.createComponent(CompactObjectScientificRender);
    fixture.componentRef.setInput('visual', compactObjectScientificVisual('BLACK_HOLE'));
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="compact-science-shadow"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="compact-science-disk"]')).toBeNull();
    expect(root.querySelector('[data-testid="compact-science-jets"]')).toBeNull();
    expect(root.querySelector('svg')?.getAttribute('aria-label')).toContain('no imagen observada');
  });

  it('draws the disk only for a supported accreting hole', () => {
    const fixture = TestBed.createComponent(CompactObjectScientificRender);
    fixture.componentRef.setInput('visual', compactObjectScientificVisual('BLACK_HOLE', true));
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="compact-science-disk"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="compact-science-jets"]')).toBeNull();
  });

  it('distinguishes compact magnetic variants visually', () => {
    const fixture = TestBed.createComponent(CompactObjectScientificRender);
    fixture.componentRef.setInput('visual', compactObjectScientificVisual('PULSAR'));
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="compact-science-pulsar-beams"]')).toBeTruthy();
    fixture.componentRef.setInput('visual', compactObjectScientificVisual('MAGNETAR'));
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="compact-science-magnetic-field"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="compact-science-pulsar-beams"]')).toBeNull();
  });
});
