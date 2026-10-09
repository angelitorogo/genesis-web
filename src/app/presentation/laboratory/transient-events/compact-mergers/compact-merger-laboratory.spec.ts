import { TestBed } from '@angular/core/testing';
import { CompactMergerType } from '../../../../domain/transient/compact-merger-type';
import { CompactMergerLaboratoryPage } from './compact-merger-laboratory';

describe('29.4 compact-merger laboratory', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [CompactMergerLaboratoryPage] }).compileComponents();
    const fixture = TestBed.createComponent(CompactMergerLaboratoryPage);
    fixture.detectChanges();
    return {
      fixture,
      component: fixture.componentInstance,
      root: fixture.nativeElement as HTMLElement,
    };
  }

  it('renders NS-NS, NS-BH and BH-BH without exposing 29.5 waveform observables', async () => {
    const { root } = await setup();
    expect(root.querySelector('[data-testid="compact-merger-laboratory-page"]')).not.toBeNull();
    expect(root.textContent).toContain('NS–NS');
    expect(root.textContent).toContain('NS–BH');
    expect(root.textContent).toContain('BH–BH');
    expect(root.textContent).toContain('29.5');
    expect(root.textContent).not.toContain('strain =');
  });

  it('presents progenitors before the remnant instead of drawing three coexisting bodies', async () => {
    const { root } = await setup();
    expect(root.querySelector('[data-testid="compact-merger-progenitors"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="compact-merger-transition"]')?.textContent).toContain('→');
    expect(root.querySelector('[data-testid="compact-merger-remnant-stage"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="compact-merger-progenitors"]')?.textContent).toContain('NS');
    expect(root.querySelector('[data-testid="compact-merger-remnant-stage"]')?.textContent).toContain('Estrella de neutrones hipermasiva');
  });

  it('translates compact-merger domain enums for all three laboratory channels', async () => {
    const { fixture, component, root } = await setup();

    expect(root.textContent).toContain('Estrella de neutrones hipermasiva');
    expect(root.textContent).toContain('Kilonova esperada');
    expect(root.textContent).toContain('Restringido por kilonova NS–NS');
    expect(root.textContent).not.toContain('HYPERMASSIVE_NEUTRON_STAR');
    expect(root.textContent).not.toContain('KILONOVA_EXPECTED');
    expect(root.textContent).not.toContain('NS_NS_KILONOVA_CONSTRAINED');

    component.selectType(CompactMergerType.NEUTRON_STAR_BLACK_HOLE);
    fixture.detectChanges();
    expect(root.textContent).toContain('Agujero negro estelar');
    expect(root.textContent).toContain('Kilonova / disrupción tidal sin resolver');
    expect(root.textContent).toContain('Sin resolver: spin / orientación Kerr');
    expect(root.textContent).not.toContain('KILONOVA_TIDAL_DISRUPTION_UNRESOLVED');
    expect(root.textContent).not.toContain('BH_SPIN_UNRESOLVED');

    component.selectType(CompactMergerType.BLACK_HOLE_BLACK_HOLE);
    fixture.detectChanges();
    expect(root.textContent).toContain('No se espera contraparte electromagnética inmediata');
    expect(root.textContent).toContain('Sin resolver: spin / orientación Kerr');
    expect(root.textContent).not.toContain('NO_PROMPT_ELECTROMAGNETIC_COUNTERPART_EXPECTED');
    expect(root.textContent).not.toContain('BH_SPIN_UNRESOLVED');
  });
});
