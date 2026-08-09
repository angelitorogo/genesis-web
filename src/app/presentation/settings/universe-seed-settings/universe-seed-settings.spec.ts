import {
  TestBed,
} from '@angular/core/testing';

import {
  DEFAULT_UNIVERSE_SEED,
  UniverseSeedFacade,
} from '../../universe/universe-seed.facade';

import {
  UniverseSeedSettings,
} from './universe-seed-settings';

describe(
  'UniverseSeedSettings',
  () => {
    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              UniverseSeedSettings,
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should render the active seed',
      () => {
        const fixture =
          TestBed.createComponent(
            UniverseSeedSettings,
          );

        fixture.detectChanges();

        const element =
          fixture
            .nativeElement as
            HTMLElement;

        expect(
          element
            .querySelector(
              '[data-testid="universe-seed-active"]',
            )
            ?.textContent
            ?.trim(),
        ).toBe(
          DEFAULT_UNIVERSE_SEED,
        );
      },
    );

    it(
      'should apply a manual seed from the UI',
      () => {
        const fixture =
          TestBed.createComponent(
            UniverseSeedSettings,
          );

        fixture.detectChanges();

        const input =
          fixture
            .nativeElement
            .querySelector(
              '[data-testid="universe-seed-input"]',
            ) as HTMLInputElement;

        input.value =
          'abcd-0000-0000-0000-0000-0000-0000-0001';

        input.dispatchEvent(
          new Event(
            'input',
          ),
        );

        const button =
          fixture
            .nativeElement
            .querySelector(
              '[data-testid="universe-seed-apply-button"]',
            ) as HTMLButtonElement;

        button.click();

        fixture.detectChanges();

        const facade =
          TestBed.inject(
            UniverseSeedFacade,
          );

        expect(
          facade.serializedSeed(),
        ).toBe(
          'ABCD-0000-0000-0000-0000-0000-0000-0001',
        );
      },
    );

    it(
      'should reject invalid manual seed input',
      () => {
        const fixture =
          TestBed.createComponent(
            UniverseSeedSettings,
          );

        fixture.detectChanges();

        const input =
          fixture
            .nativeElement
            .querySelector(
              '[data-testid="universe-seed-input"]',
            ) as HTMLInputElement;

        input.value =
          'INVALID';

        input.dispatchEvent(
          new Event(
            'input',
          ),
        );

        const button =
          fixture
            .nativeElement
            .querySelector(
              '[data-testid="universe-seed-apply-button"]',
            ) as HTMLButtonElement;

        button.click();

        fixture.detectChanges();

        const status =
          fixture
            .nativeElement
            .querySelector(
              '[data-testid="universe-seed-status"]',
            ) as HTMLElement;

        expect(
          status.getAttribute(
            'data-status',
          ),
        ).toBe(
          'error',
        );
      },
    );

    it(
      'should copy the serialized seed',
      async () => {
        let copiedValue =
          '';

        Object.defineProperty(
          globalThis.navigator,
          'clipboard',
          {
            configurable:
              true,

            value: {
              writeText:
                async (
                  value: string,
                ) => {
                  copiedValue =
                    value;
                },
            },
          },
        );

        const fixture =
          TestBed.createComponent(
            UniverseSeedSettings,
          );

        fixture.detectChanges();

        await fixture
          .componentInstance
          .copySeed();

        fixture.detectChanges();

        expect(
          copiedValue,
        ).toBe(
          DEFAULT_UNIVERSE_SEED,
        );

        expect(
          TestBed
            .inject(
              UniverseSeedFacade,
            )
            .feedback()
            .kind,
        ).toBe(
          'success',
        );
      },
    );

    it(
      'should expose a copy error when clipboard write fails',
      async () => {
        Object.defineProperty(
          globalThis.navigator,
          'clipboard',
          {
            configurable:
              true,

            value: {
              writeText:
                async () => {
                  throw new Error(
                    'Clipboard blocked',
                  );
                },
            },
          },
        );

        const fixture =
          TestBed.createComponent(
            UniverseSeedSettings,
          );

        fixture.detectChanges();

        await fixture
          .componentInstance
          .copySeed();

        expect(
          TestBed
            .inject(
              UniverseSeedFacade,
            )
            .feedback()
            .kind,
        ).toBe(
          'error',
        );
      },
    );
  },
);