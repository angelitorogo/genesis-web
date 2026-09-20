import {
  TestBed,
} from '@angular/core/testing';

import {
  UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';
import { GeneratorVersion } from '../../../domain/generation/generator-version';
import { UniverseSeed } from '../../../domain/universe/universe-seed';
import { GENESIS_LOCAL_REPOSITORIES } from '../../runtime/genesis-local-repositories';

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
    let persistedKeys: UniverseGenerationKey[];
    let repositoryReads: number;
    let repositoryFailure: Error | null;

    beforeEach(
      async () => {
        bootstrapCreated =
          true;

        bootstrapFailure =
          null;

        bootstrappedKeys =
          [];
        persistedKeys = [];
        repositoryReads = 0;
        repositoryFailure = null;

        await TestBed
          .configureTestingModule({
            imports: [
              UniverseSeedSettings,
            ],

            providers: [
              {
                provide: GENESIS_LOCAL_REPOSITORIES,
                useValue: {
                  universeRepository: {
                    getAll: async () => {
                      repositoryReads += 1;
                      if (repositoryFailure !== null) {
                        throw repositoryFailure;
                      }
                      return persistedKeys;
                    },
                  },
                },
              },
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

        expect(repositoryReads).toBe(1);
        expect(bootstrappedKeys[0]?.generatorVersion).toBe(GeneratorVersion.V2);
        expect(facade.generatorVersion()).toBe(GeneratorVersion.V2);
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

    it('reopens existing V1 save instead of rewriting its seed as V2', async () => {
      const seed = UniverseSeed.parse('ABCD-0000-0000-0000-0000-0000-0000-0001');
      const savedV1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
      persistedKeys = [savedV1];
      bootstrapCreated = false;
      const fixture = TestBed.createComponent(UniverseSeedSettings);
      fixture.detectChanges();
      fixture.componentInstance.seed.updateDraft(seed.serialize());
      await fixture.componentInstance.applySeed();
      expect(bootstrappedKeys).toHaveLength(1);
      expect(bootstrappedKeys[0]?.equals(savedV1)).toBe(true);
      expect(TestBed.inject(UniverseSeedFacade).generatorVersion()).toBe(GeneratorVersion.V1);
    });

    it('selects the existing V2 save and does not collide with an existing V1 of the same seed', async () => {
      const seed = UniverseSeed.parse('ABCD-0000-0000-0000-0000-0000-0000-0001');
      const savedV1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
      const savedV2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);
      persistedKeys = [savedV1, savedV2];
      bootstrapCreated = false;
      const fixture = TestBed.createComponent(UniverseSeedSettings);
      fixture.detectChanges();
      fixture.componentInstance.seed.updateDraft(seed.serialize());
      await fixture.componentInstance.applySeed();
      expect(bootstrappedKeys[0]?.equals(savedV2)).toBe(true);
      expect(TestBed.inject(UniverseSeedFacade).generatorVersion()).toBe(GeneratorVersion.V2);
    });

    it('rejects invalid draft before reading persistence and retains the current version', async () => {
      const fixture = TestBed.createComponent(UniverseSeedSettings);
      fixture.detectChanges();
      fixture.componentInstance.seed.updateDraft('INVALID');
      await fixture.componentInstance.applySeed();
      expect(repositoryReads).toBe(0);
      expect(bootstrappedKeys).toHaveLength(0);
      expect(TestBed.inject(UniverseSeedFacade).generatorVersion()).toBe(GeneratorVersion.V1);
    });

    it(
      'should report activation without resetting an already persisted universe',
      async () => {
        bootstrapCreated =
          false;
        const existing = new UniverseGenerationKey(
          UniverseSeed.parse(DEFAULT_UNIVERSE_SEED), GeneratorVersion.V1,
        );
        persistedKeys = [existing];

        const fixture =
          TestBed.createComponent(
            UniverseSeedSettings,
          );

        fixture.detectChanges();

        await fixture
          .componentInstance
          .applySeed();

        expect(repositoryReads).toBe(1);
        expect(bootstrappedKeys).toHaveLength(1);
        expect(bootstrappedKeys[0]?.equals(existing)).toBe(true);
        const active = TestBed.inject(UniverseSeedFacade);
        expect(active.activeGenerationKey().equals(existing)).toBe(true);
        expect(active.feedback()).toEqual({
          kind: 'success',
          message: 'Universo activado correctamente.',
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

        expect(TestBed.inject(UniverseSeedFacade).generatorVersion()).toBe(GeneratorVersion.V1);
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

    it('does not bootstrap or alter the active seed when reading persistence fails', async () => {
      repositoryFailure = new Error('IndexedDB read failed.');
      const fixture = TestBed.createComponent(UniverseSeedSettings);
      fixture.detectChanges();
      const before = TestBed.inject(UniverseSeedFacade).activeGenerationKey();
      fixture.componentInstance.seed.updateDraft('ABCD-0000-0000-0000-0000-0000-0000-0001');
      await fixture.componentInstance.applySeed();
      expect(repositoryReads).toBe(1);
      expect(bootstrappedKeys).toHaveLength(0);
      const facade = TestBed.inject(UniverseSeedFacade);
      expect(facade.activeGenerationKey().equals(before)).toBe(true);
      expect(facade.feedback()).toEqual({
        kind: 'error',
        message: 'No se pudo crear o activar el universo local.',
      });
    });

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
