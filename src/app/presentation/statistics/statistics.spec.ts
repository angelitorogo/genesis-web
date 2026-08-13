import {
  TestBed,
} from '@angular/core/testing';

import {
  provideRouter,
} from '@angular/router';

import {
  Statistics,
} from './statistics';

describe(
  'Statistics',
  () => {
    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              Statistics,
            ],

            providers: [
              provideRouter(
                [],
              ),
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should render the real point-9.6 Statistics navigation destination',
      () => {
        const fixture =
          TestBed.createComponent(
            Statistics,
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          fixture.componentInstance,
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="statistics-page"]',
          ),
        ).toBeTruthy();

        expect(
          element.textContent,
        ).toContain(
          'Estadísticas',
        );
      },
    );

    it(
      'should expose a real route back to Home without materializing future statistics',
      () => {
        const fixture =
          TestBed.createComponent(
            Statistics,
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        const homeLink =
          element.querySelector(
            '[data-testid="statistics-home-link"]',
          ) as HTMLAnchorElement | null;

        expect(
          homeLink?.getAttribute(
            'href',
          ),
        ).toBe(
          '/',
        );

        expect(
          element.querySelector(
            '[data-testid="statistics-module-state"]',
          )?.textContent,
        ).toContain(
          'ACCESO HABILITADO',
        );
      },
    );
  },
);
