import {
  TestBed,
} from '@angular/core/testing';

import {
  ProceduralWorkerClient,
} from '../runtime/procedural-worker/procedural-worker.client';

import {
  Settings,
} from './settings';

describe(
  'Settings',
  () => {
    let healthCheckCalls:
      number;

    beforeEach(() => {
      healthCheckCalls =
        0;

      TestBed.configureTestingModule({
        imports: [
          Settings,
        ],

        providers: [
          {
            provide:
              ProceduralWorkerClient,

            useValue: {
              healthCheck:
                async () => {
                  healthCheckCalls +=
                    1;

                  return {
                    ready:
                      true as const,

                    runtime:
                      'worker' as const,
                  };
                },
            },
          },
        ],
      });
    });

    it(
      'should create and render settings',
      () => {
        const fixture =
          TestBed.createComponent(
            Settings,
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
            '[data-testid="settings-page"]',
          ),
        ).toBeTruthy();

        expect(
          element.textContent,
        ).toContain(
          'Ajustes',
        );
      },
    );

    it(
      'should start with an unchecked worker state',
      () => {
        const fixture =
          TestBed.createComponent(
            Settings,
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="worker-diagnostic-status"]',
          )?.textContent,
        ).toContain(
          'todavía no se ha comprobado',
        );
      },
    );

    it(
      'should verify the procedural worker',
      async () => {
        const fixture =
          TestBed.createComponent(
            Settings,
          );

        fixture.detectChanges();

        const button =
          fixture.nativeElement
            .querySelector(
              '[data-testid="worker-diagnostic-button"]',
            ) as HTMLButtonElement;

        button.click();

        await fixture.whenStable();

        fixture.detectChanges();

        expect(
          healthCheckCalls,
        ).toBe(1);

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="worker-diagnostic-status"]',
          )?.textContent,
        ).toContain(
          'Web Worker activo',
        );
      },
    );
  },
);