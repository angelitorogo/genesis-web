import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { MoonLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { MoonWaterRegime } from '../../domain/planetary/moon-water-regime';
import { GalaxyWaterMoonIndexFacade } from './galaxy-water-moon-index.facade';
import { GalaxyWaterMoonIndexPage } from './galaxy-water-moon-index';

describe('GalaxyWaterMoonIndexPage point 26.1c lunar extension', () => {
  it('should render surface-potential and subsurface-ocean lunar catalogues with scientific links', async () => {
    const model = Object.freeze({
      galaxyIndex: 3n,
      galaxyName: 'Elixisis',
      galaxyDesignationCode: 'G-0003',
      routeUniverseRef: '0123456789ABCDEF0123456789ABCDEF',
      index: Object.freeze({
        galaxyIndex: 3n,
        totalUniqueMoons: 2n,
        surfaceLiquidPotentialMoonCount: 2n,
        subsurfaceOceanEvidenceMoonCount: 1n,
        systems: Object.freeze([
          Object.freeze({
            locator: new SystemLocator(3n, 42n, 7n),
            designation: 'ELX-472',
            multiplicity: 'BINARY' as const,
            moons: Object.freeze([
              Object.freeze({
                locator: new MoonLocator(3n, 42n, 7n, 1n, 0n),
                designation: 'ELX-472 A-2 I',
                hostPlanetDesignation: 'ELX-472 A-2',
                hostLabel: 'A' as const,
                orbitClass: 'S_TYPE' as const,
                surfaceLiquidWaterPotentialIndex01: 0.68,
                subsurfaceOceanPotentialIndex01: 0.25,
                waterRegime: MoonWaterRegime.SURFACE_LIQUID,
                surfaceLiquidPotentialAtLeast40Percent: true,
                subsurfaceOceanEvidence: false,
              }),
              Object.freeze({
                locator: new MoonLocator(3n, 42n, 7n, 4n, 1n),
                designation: 'ELX-472 AB-1 II',
                hostPlanetDesignation: 'ELX-472 AB-1',
                hostLabel: 'AB' as const,
                orbitClass: 'P_TYPE' as const,
                surfaceLiquidWaterPotentialIndex01: 0.52,
                subsurfaceOceanPotentialIndex01: 0.84,
                waterRegime: MoonWaterRegime.MIXED,
                surfaceLiquidPotentialAtLeast40Percent: true,
                subsurfaceOceanEvidence: true,
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
      imports: [GalaxyWaterMoonIndexPage],
      providers: [
        provideRouter([]),
        { provide: GalaxyWaterMoonIndexFacade, useValue: facade },
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

    const fixture = TestBed.createComponent(GalaxyWaterMoonIndexPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="gwm-system-count"]')?.textContent).toContain('1');
    expect(element.querySelector('[data-testid="gwm-unique-count"]')?.textContent).toContain('2');
    expect(element.querySelector('[data-testid="gwm-surface-count"]')?.textContent).toContain('2');
    expect(element.querySelector('[data-testid="gwm-subsurface-count"]')?.textContent).toContain('1');

    const surfaceCatalog = element.querySelector<HTMLDetailsElement>('[data-testid="gwm-surface-catalog"]');
    const subsurfaceCatalog = element.querySelector<HTMLDetailsElement>('[data-testid="gwm-subsurface-catalog"]');
    expect(surfaceCatalog?.open).toBe(false);
    expect(subsurfaceCatalog?.open).toBe(false);
    expect(element.querySelector<HTMLDetailsElement>('[data-testid="gwm-surface-system-card"]')?.open).toBe(false);
    expect(element.querySelector<HTMLDetailsElement>('[data-testid="gwm-subsurface-system-card"]')?.open).toBe(false);

    expect(element.querySelectorAll('[data-testid="gwm-surface-moon-card"]')).toHaveLength(2);
    expect(element.querySelectorAll('[data-testid="gwm-subsurface-moon-card"]')).toHaveLength(1);
    expect(element.textContent).toContain('S-TYPE · ESTRELLA A');
    expect(element.textContent).toContain('P-TYPE · CIRCUMBINARIO AB');
    expect(element.textContent).toContain('68 %');
    expect(element.textContent).toContain('84 %');
    expect(element.querySelectorAll('[data-testid="gwm-open-surface-moon"]')).toHaveLength(2);
    expect(element.querySelectorAll('[data-testid="gwm-open-subsurface-moon"]')).toHaveLength(1);
    expect(facade.load).toHaveBeenCalledWith('3', model.routeUniverseRef);
  });
});
