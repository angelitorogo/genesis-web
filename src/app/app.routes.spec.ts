import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
} from '@angular/router';
import {
  RouterTestingHarness,
} from '@angular/router/testing';

import { genesisRoutes } from './app.routes';

describe('GENESIS routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(genesisRoutes),
      ],
    });
  });

  it('should navigate to Home from the root route', async () => {
    const harness =
      await RouterTestingHarness.create('/');

    expect(
      harness.routeNativeElement?.querySelector(
        '[data-testid="home-page"]',
      ),
    ).toBeTruthy();

    expect(
      harness.routeNativeElement?.textContent,
    ).toContain('GENESIS');
  }, 30_000);

  it('should use the root URL for Home', async () => {
    await RouterTestingHarness.create('/');

    const router =
      TestBed.inject(Router);

    expect(router.url).toBe('/');
  });

  it('should navigate to Exploration', async () => {
    const harness =
      await RouterTestingHarness.create(
        '/exploration',
      );

    expect(
      harness.routeNativeElement?.querySelector(
        '[data-testid="exploration-page"]',
      ),
    ).toBeTruthy();
  }, 30_000);

  it('should navigate to Galaxy Map', async () => {
    const harness =
      await RouterTestingHarness.create(
        '/galaxy-map',
      );

    expect(
      harness.routeNativeElement?.querySelector(
        '[data-testid="galaxy-map-page"]',
      ),
    ).toBeTruthy();
  });

  it('should navigate to Discovered Galaxies', async () => {
    const harness =
      await RouterTestingHarness.create(
        '/galaxies',
      );

    expect(
      harness.routeNativeElement?.querySelector(
        '[data-testid="discovered-galaxies-page"]',
      ),
    ).toBeTruthy();
  }, 30_000);

  it('should navigate to the point-11.3 Galaxy general detail route', async () => {
    const harness =
      await RouterTestingHarness.create(
        '/galaxies/0',
      );

    expect(
      harness.routeNativeElement?.querySelector(
        '[data-testid="galaxy-detail-page"]',
      ),
    ).toBeTruthy();
  }, 30_000);

  it('should expose the point-11.3 Galaxy detail route before the catalogue route', () => {
    const detailIndex =
      genesisRoutes.findIndex(
        (route) =>
          route.path ===
          'galaxies/:galaxyIndex',
      );

    const catalogueIndex =
      genesisRoutes.findIndex(
        (route) =>
          route.path ===
          'galaxies',
      );

    expect(
      detailIndex,
    ).toBeGreaterThanOrEqual(
      0,
    );

    expect(
      detailIndex,
    ).toBeLessThan(
      catalogueIndex,
    );
  });

  it('should navigate to Observatory', async () => {
    const harness =
      await RouterTestingHarness.create(
        '/observatory',
      );

    expect(
      harness.routeNativeElement?.querySelector(
        '[data-testid="observatory-page"]',
      ),
    ).toBeTruthy();
  });

  it('should navigate to Genesis Archive', async () => {
    const harness =
      await RouterTestingHarness.create(
        '/archive',
      );

    expect(
      harness.routeNativeElement?.querySelector(
        '[data-testid="genesis-archive-page"]',
      ),
    ).toBeTruthy();
  });


  it('should expose the point-10.6 SystemLocator Archive detail route before the base Archive route', () => {
    const detailIndex =
      genesisRoutes.findIndex(
        (route) =>
          route.path ===
          'archive/system/:galaxyIndex/:sectorKey/:galacticObjectIndex',
      );

    const archiveIndex =
      genesisRoutes.findIndex(
        (route) =>
          route.path ===
          'archive',
      );

    expect(
      detailIndex,
    ).toBeGreaterThanOrEqual(
      0,
    );

    expect(
      detailIndex,
    ).toBeLessThan(
      archiveIndex,
    );

    expect(
      genesisRoutes[
        detailIndex
      ]?.data?.[
        'archiveDiscoveryLocatorKind'
      ],
    ).toBe(
      'system',
    );
  });

  it('should expose the point-10.6 GalacticObjectLocator Archive detail route before the base Archive route', () => {
    const detailIndex =
      genesisRoutes.findIndex(
        (route) =>
          route.path ===
          'archive/galactic-object/:galaxyIndex/:sectorKey/:galacticObjectIndex',
      );

    const archiveIndex =
      genesisRoutes.findIndex(
        (route) =>
          route.path ===
          'archive',
      );

    expect(
      detailIndex,
    ).toBeGreaterThanOrEqual(
      0,
    );

    expect(
      detailIndex,
    ).toBeLessThan(
      archiveIndex,
    );

    expect(
      genesisRoutes[
        detailIndex
      ]?.data?.[
        'archiveDiscoveryLocatorKind'
      ],
    ).toBe(
      'galactic-object',
    );
  });


  it('should navigate to the permanent GENESIS Visual Laboratory index', async () => {
    const harness =
      await RouterTestingHarness.create(
        '/laboratory',
      );

    expect(
      harness.routeNativeElement?.querySelector(
        '[data-testid="laboratory-page"]',
      ),
    ).toBeTruthy();
  });

  it('should navigate to the real five-morphology galaxy laboratory', async () => {
    const harness =
      await RouterTestingHarness.create(
        '/laboratory/galaxies',
      );

    expect(
      harness.routeNativeElement?.querySelector(
        '[data-testid="galaxy-laboratory-page"]',
      ),
    ).toBeTruthy();
  }, 30_000);

  it('should navigate to the GalacticObject knowledge-progression laboratory', async () => {
    const harness =
      await RouterTestingHarness.create(
        '/laboratory/galactic-objects',
      );

    expect(
      harness.routeNativeElement?.querySelector(
        '[data-testid="galactic-object-laboratory-page"]',
      ),
    ).toBeTruthy();
  }, 30_000);

  it('should navigate to the canonical spectroscopy laboratory route', async () => {
    const harness =
      await RouterTestingHarness.create(
        '/laboratory/spectroscopy',
      );

    expect(
      harness.routeNativeElement?.querySelector(
        '[data-testid="spectroscopy-validation-page"]',
      ),
    ).toBeTruthy();
  }, 30_000);

  it('should navigate to the phase-16 stellar-system A-H knowledge-progression laboratory', async () => {
    const harness =
      await RouterTestingHarness.create(
        '/laboratory/stellar-systems',
      );

    expect(
      harness.routeNativeElement?.querySelector(
        '[data-testid="stellar-system-laboratory-page"]',
      ),
    ).toBeTruthy();
  }, 30_000);

  it('should keep the legacy spectroscopy-validation URL as a compatible redirect', async () => {
    const harness =
      await RouterTestingHarness.create(
        '/spectroscopy-validation',
      );

    const router =
      TestBed.inject(Router);

    expect(
      router.url,
    ).toBe(
      '/laboratory/spectroscopy',
    );

    expect(
      harness.routeNativeElement?.querySelector(
        '[data-testid="spectroscopy-validation-page"]',
      ),
    ).toBeTruthy();
  }, 30_000);

  it('should navigate to Statistics', async () => {
    const harness =
      await RouterTestingHarness.create(
        '/statistics',
      );

    expect(
      harness.routeNativeElement?.querySelector(
        '[data-testid="statistics-page"]',
      ),
    ).toBeTruthy();
  });

  it('should navigate to Settings', async () => {
    const harness =
      await RouterTestingHarness.create(
        '/settings',
      );

    expect(
      harness.routeNativeElement?.querySelector(
        '[data-testid="settings-page"]',
      ),
    ).toBeTruthy();
  });

  it('should redirect unknown routes to Home', async () => {
    const harness =
      await RouterTestingHarness.create(
        '/ruta-inexistente',
      );

    const router =
      TestBed.inject(Router);

    expect(router.url).toBe('/');

    expect(
      harness.routeNativeElement?.querySelector(
        '[data-testid="home-page"]',
      ),
    ).toBeTruthy();
  });
});
