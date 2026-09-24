import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { BodyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { PlanetType } from '../../domain/planetary/planet-type';
import { GalaxyWaterWorldIndexFacade } from './galaxy-water-world-index.facade';
import { GalaxyWaterWorldIndexPage } from './galaxy-water-world-index';

describe('GalaxyWaterWorldIndexPage point 26.1c', () => {
  it('should render systems grouped with their known >=20 percent worlds and scientific links', async () => {
    const model = Object.freeze({
      galaxyIndex: 3n,
      galaxyName: 'Elixisis',
      galaxyDesignationCode: 'G-0003',
      routeUniverseRef: '0123456789ABCDEF0123456789ABCDEF',
      index: Object.freeze({
        galaxyIndex: 3n,
        totalWorlds: 2n,
        systems: Object.freeze([
          Object.freeze({
            locator: new SystemLocator(3n, 42n, 7n),
            designation: 'ELX-472',
            multiplicity: 'BINARY' as const,
            worlds: Object.freeze([
              Object.freeze({
                locator: new BodyLocator(3n, 42n, 7n, 1n),
                designation: 'ELX-472 A-2',
                planetType: PlanetType.SUPER_EARTH,
                surfaceLiquidWaterCoverageFraction01: 0.68,
                hostLabel: 'A' as const,
                orbitClass: 'S_TYPE' as const,
              }),
              Object.freeze({
                locator: new BodyLocator(3n, 42n, 7n, 4n),
                designation: 'ELX-472 AB-1',
                planetType: PlanetType.OCEAN,
                surfaceLiquidWaterCoverageFraction01: 0.91,
                hostLabel: 'AB' as const,
                orbitClass: 'P_TYPE' as const,
              }),
            ]),
          }),
        ]),
      }),
    });

    const state = signal({ kind: 'content' as const, model });
    const facade = {
      state: state.asReadonly(),
      model: () => model,
      errorMessage: () => '',
      load: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [GalaxyWaterWorldIndexPage],
      providers: [
        provideRouter([]),
        { provide: GalaxyWaterWorldIndexFacade, useValue: facade },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: (name: string) => name === 'galaxyIndex' ? '3' : null },
              queryParamMap: { get: (name: string) => name === 'u' ? model.routeUniverseRef : null },
            },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(GalaxyWaterWorldIndexPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="gww-system-count"]')?.textContent).toContain('1');
    expect(element.querySelector('[data-testid="gww-world-count"]')?.textContent).toContain('2');
    expect(element.querySelectorAll('[data-testid="gww-world-card"]')).toHaveLength(2);
    expect(element.textContent).toContain('S-TYPE · ESTRELLA A');
    expect(element.textContent).toContain('P-TYPE · CIRCUMBINARIO AB');
    expect(element.textContent).toContain('68 %');
    expect(element.textContent).toContain('91 %');
    expect(element.querySelectorAll('[data-testid="gww-open-planet"]')).toHaveLength(2);
    expect(facade.load).toHaveBeenCalledWith('3', model.routeUniverseRef);
  });
});
