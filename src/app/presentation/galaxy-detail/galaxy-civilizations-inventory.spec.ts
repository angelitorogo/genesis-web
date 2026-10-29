import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import {
  GalaxyCivilizationKnownIndex,
  type KnownGalacticCivilization,
  type KnownGalacticCivilizationCensus,
} from '../galaxy-knowledge-catalog/galaxy-civilization-known-index';
import { GalaxyCivilizationsInventoryComponent } from './galaxy-civilizations-inventory';

const galaxyKey = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),
  GeneratorVersion.V3,
);
const census: KnownGalacticCivilizationCensus = {
  entries: Array.from({length: 24}, (_, i) => ({id: String(i)}) as KnownGalacticCivilization),
  primitive: 14,
  advanced: 10,
  veryAdvanced: 0,
  complete: false,
  planetsWithBiologicalRecord: 24,
  knownPhysicalPlanets: 29341,
};

describe('Inventario galáctico de civilizaciones: diseño y recuento estable', () => {
  it('no publica contadores parciales y renderiza tres desgloses con enlaces al catálogo', async () => {
    let complete!: (result: KnownGalacticCivilizationCensus) => void;
    const read = vi.fn().mockImplementation(() => new Promise<KnownGalacticCivilizationCensus>(resolve => {
      complete = resolve;
    }));
    await TestBed.configureTestingModule({
      imports: [GalaxyCivilizationsInventoryComponent],
      providers: [provideRouter([]), {provide: GalaxyCivilizationKnownIndex, useValue: {read}}],
    }).compileComponents();
    const fixture = TestBed.createComponent(GalaxyCivilizationsInventoryComponent);
    fixture.componentRef.setInput('generationKey', galaxyKey);
    fixture.componentRef.setInput('galaxyIndex', 0n);
    fixture.componentRef.setInput('routeUniverseRef', 'universo-prueba');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(read).toHaveBeenCalledTimes(1);
    expect(read.mock.calls[0]?.[2]).toBeUndefined();
    expect(root.querySelector('[data-testid="galaxy-detail-known-civilizations"]')?.textContent).toContain('—');
    expect(root.querySelector('[data-testid="galaxy-detail-civilizations-primitive-link"]')).toBeNull();
    complete(census);
    await fixture.whenStable();
    fixture.detectChanges();
    const details = root.querySelector('[data-testid="galaxy-civilizations-breakdown"]') as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(root.querySelector('[data-testid="galaxy-detail-known-civilizations"]')?.textContent).toContain('24');
    const total = root.querySelector('[data-testid="galaxy-detail-civilizations-catalog-link"]') as HTMLAnchorElement;
    expect(total.getAttribute('href')).toContain('/galaxies/0/knowledge/civilizations');
    const links = [
      ['primitive', '14', 'PRIMITIVE'],
      ['advanced', '10', 'ADVANCED'],
      ['very-advanced', '0', 'VERY_ADVANCED'],
    ] as const;
    for (const [level, number, filter] of links) {
      const link = root.querySelector(`[data-testid="galaxy-detail-civilizations-${level}-link"]`) as HTMLAnchorElement;
      expect(link.textContent?.trim()).toBe(number);
      expect(link.getAttribute('href')).toContain(`type=${filter}`);
    }
    details.open = true;
    details.dispatchEvent(new Event('toggle'));
    fixture.detectChanges();
    expect(fixture.componentInstance.expanded).toBe(true);
    expect(root.querySelectorAll('.gci__rail-facts > div')).toHaveLength(3);
  });

  it('descarta un resultado de la galaxia anterior si cambia el foco durante la consulta', async () => {
    const resolvers: Array<(result: KnownGalacticCivilizationCensus) => void> = [];
    const read = vi.fn().mockImplementation(() => new Promise<KnownGalacticCivilizationCensus>(resolve => {
      resolvers.push(resolve);
    }));
    await TestBed.configureTestingModule({
      imports: [GalaxyCivilizationsInventoryComponent],
      providers: [provideRouter([]), {provide: GalaxyCivilizationKnownIndex, useValue: {read}}],
    }).compileComponents();
    const fixture = TestBed.createComponent(GalaxyCivilizationsInventoryComponent);
    fixture.componentRef.setInput('generationKey', galaxyKey);
    fixture.componentRef.setInput('galaxyIndex', 0n);
    fixture.detectChanges();
    fixture.componentRef.setInput('galaxyIndex', 1n);
    fixture.detectChanges();
    resolvers[0](census);
    await Promise.resolve();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="galaxy-detail-known-civilizations"]')?.textContent)
      .toContain('—');
    const emptyCensus = {...census, entries: [], primitive: 0, advanced: 0, veryAdvanced: 0, complete: true};
    resolvers[1](emptyCensus);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="galaxy-detail-known-civilizations"]')?.textContent)
      .toContain('0');
  });
});
