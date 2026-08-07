import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Home } from './home';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Home,
      ],
      providers: [
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture =
      TestBed.createComponent(Home);

    fixture.detectChanges();

    expect(
      fixture.componentInstance,
    ).toBeTruthy();
  });

  it('should render the GENESIS title from the facade', () => {
    const fixture =
      TestBed.createComponent(Home);

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="home-title"]',
      )?.textContent,
    ).toContain('GENESIS');
  });

  it('should render the initialized navigation status', () => {
    const fixture =
      TestBed.createComponent(Home);

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector(
        '[data-testid="navigation-status"]',
      )?.textContent,
    ).toContain(
      'Navegación Angular inicializada correctamente.',
    );
  });

  it('should expose the four main module links', () => {
    const fixture =
      TestBed.createComponent(Home);

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    const navigation =
      element.querySelector(
        '[data-testid="module-navigation"]',
      );

    expect(
      navigation?.querySelectorAll('a').length,
    ).toBe(4);

    expect(
      element.querySelector(
        '[data-testid="galaxy-map-link"]',
      ),
    ).toBeTruthy();

    expect(
      element.querySelector(
        '[data-testid="observatory-link"]',
      ),
    ).toBeTruthy();

    expect(
      element.querySelector(
        '[data-testid="archive-link"]',
      ),
    ).toBeTruthy();

    expect(
      element.querySelector(
        '[data-testid="settings-link"]',
      ),
    ).toBeTruthy();
  });
});