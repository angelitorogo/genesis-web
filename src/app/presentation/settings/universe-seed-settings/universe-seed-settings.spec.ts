import {
  TestBed,
} from '@angular/core/testing';

import {
  type UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  UniverseBootstrapService,
} from '../../universe/universe-bootstrap.service';

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
    let bootstrapCreated:
      boolean;

    let bootstrapFailure:
      Error | null;

    let bootstrappedKeys:
      UniverseGenerationKey[];

    beforeEach(
      async () => {
        bootstrapCreated =
          true;

        bootstrapFailure =
          null;

        bootstrappedKeys =
          [];

        await TestBed
          .configureTestingModule({
            imports: [
              UniverseSeedSettings,
            ],

            providers: [
              {
                provide:
                  UniverseBootstrapService,

                useValue: {
                  ensureInitialized:
                    async (
                      generationKey:
                        UniverseGenerationKey,
                    ) => {
                      bootstrappedKeys.push(
                        generationKey,
                      );

                      if (
                        bootstrapFailure !==
                          null
                      ) {
                        throw bootstrapFailure;
                      }

                      return {
                        generationKey,
                        created:
                          bootstrapCreated,
                      };
                    },
                },
              },
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
      'should apply bootstrap and persist a new universe before reporting success',
      async () => {
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

        await fixture
          .componentInstance
          .applySeed();

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

        expect(
          bootstrappedKeys,
        ).toHaveLength(
          1,
        );

        expect(
          bootstrappedKeys[
            0
          ]
          ?.universeSeed
          .serialize(),
        ).toBe(
          'ABCD-0000-0000-0000-0000-0000-0000-0001',
        );

        expect(
          facade.feedback(),
        ).toEqual({
          kind:
            'success',

          message:
            'Universo creado y activado correctamente.',
        });
      },
    );

    it(
      'should report activation without resetting an already persisted universe',
      async () => {
        bootstrapCreated =
          false;

        const fixture =
          TestBed.createComponent(
            UniverseSeedSettings,
          );

        fixture.detectChanges();

        await fixture
          .componentInstance
          .applySeed();

        expect(
          TestBed
            .inject(
              UniverseSeedFacade,
            )
            .feedback(),
        ).toEqual({
          kind:
            'success',

          message:
            'Universo activado correctamente.',
        });
      },
    );

    it(
      'should reject invalid manual seed input without invoking bootstrap',
      async () => {
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

        await fixture
          .componentInstance
          .applySeed();

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

        expect(
          bootstrappedKeys,
        ).toEqual(
          [],
        );
      },
    );

    it(
      'should expose a bootstrap error when local universe initialization fails',
      async () => {
        bootstrapFailure =
          new Error(
            'IndexedDB unavailable.',
          );

        const fixture =
          TestBed.createComponent(
            UniverseSeedSettings,
          );

        fixture.detectChanges();

        await fixture
          .componentInstance
          .applySeed();

        expect(
          TestBed
            .inject(
              UniverseSeedFacade,
            )
            .feedback(),
        ).toEqual({
          kind:
            'error',

          message:
            'No se pudo crear o activar el universo local.',
        });
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
