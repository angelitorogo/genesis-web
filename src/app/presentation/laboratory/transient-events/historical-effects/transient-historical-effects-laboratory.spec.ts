import { TestBed } from '@angular/core/testing';
import { TransientHistoricalEffectsLaboratoryPage } from './transient-historical-effects-laboratory';
import { TRANSIENT_HISTORICAL_EFFECTS_CASES as cases } from './transient-historical-effects-laboratory-fixtures';

describe('29.11 historical-effects laboratory', () => {
  beforeEach(async()=>{await TestBed.configureTestingModule({imports:[TransientHistoricalEffectsLaboratoryPage]}).compileComponents();});
  const create=()=>{
    const fixture=TestBed.createComponent(TransientHistoricalEffectsLaboratoryPage);
    fixture.detectChanges();
    return {fixture, page:fixture.componentInstance, host:fixture.nativeElement as HTMLElement};
  };
  it('renderiza doce casos y permanece read only',()=>{
    const {host}=create();
    expect(cases).toHaveLength(12);
    expect(host.querySelector('[data-testid="transient-historical-effects-laboratory"]')).toBeTruthy();
    expect(host.textContent).toContain('ningún planeta o luna se modifica');
    expect(host.querySelectorAll('.historical__cases button')).toHaveLength(12);
  });
  it('conserva el flare bolométrico y no le inventa espectro UV ni dosis',()=>{
    const {host}=create();
    expect(host.textContent).toContain('Bolométrica (no espectral)');
    expect(host.textContent).toContain('No derivados · falta modelo específico');
  });
  it('mantiene un GRB con orientación desconocida sin fluencia calculada',()=>{
    const {page,fixture,host}=create();
    page.selectCase('beam');fixture.detectChanges();
    expect(host.textContent).toContain('Intersección de emisión sin resolver');
    expect(page.report().events[0].topOfAtmosphereFluenceJoulesPerSquareMeter).toBeNull();
  });
  it('no confunde historial estadístico con un evento',()=>{
    const {page,fixture,host}=create();page.selectCase('stats');fixture.detectChanges();
    expect(host.textContent).toContain('No existe evento histórico individual resuelto');
    expect(host.textContent).toContain('No aplica: sin evento pasado');
    expect(host.querySelector('[data-testid="historical-effects-no-subtotal"]')).toBeTruthy();
  });
  it('preserva biosfera sin inferir daños aunque conozca exposición y atenuación',()=>{
    const {page,fixture,host}=create();page.selectCase('biosphere');fixture.detectChanges();
    expect(page.report().events[0].state).toBe('BAND_ATTENUATION_RESOLVED');
    expect(host.querySelector('[data-testid="historical-effects-biosphere-result"]')?.textContent).toContain('No derivados');
  });
  it('FRB, TDE y kilonova sin energía integrada no inventan efectos',()=>{
    const {page,fixture}=create();
    for(const id of ['frb','tde','kilonova']){
      page.selectCase(id);fixture.detectChanges();
      expect(page.report().events[0].state).toBe('NO_RADIANT_SPECTRUM');
      expect(page.report().knownBandSubtotals).toHaveLength(0);
    }
  });
  it('suma únicamente bandas compatibles en el historial parcial',()=>{
    const {page,fixture}=create();page.selectCase('chronology');fixture.detectChanges();
    expect(page.report().knownBandSubtotals).toHaveLength(1);
    expect(page.report().unresolvedPastEventCount).toBe(1);
    expect(page.report().alteredAtmospheres).toBe(0);
  });
});
