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
  });

  it('should use the root URL for Home', async () => {
    await RouterTestingHarness.create('/');

    const router =
      TestBed.inject(Router);

    expect(router.url).toBe('/');
  });

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