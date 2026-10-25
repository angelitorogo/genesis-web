import {
  TestBed,
} from '@angular/core/testing';

import {
  UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';
import { GeneratorVersion } from '../../../domain/generation/generator-version';
import { UniverseSeed } from '../../../domain/universe/universe-seed';
import { GENESIS_LOCAL_REPOSITORIES } from '../../runtime/genesis-local-repositories';
import { ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY, activeUniverseRef } from '../../universe/active-universe-selection';

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
    let repositoryReadGate: Promise<void> | null;

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
        repositoryReadGate = null;
        try { localStorage.removeItem(ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY); } catch { /* blocked */ }

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
                      if (repositoryReadGate !== null) await repositoryReadGate;
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

    it('restores the confirmed V3 seed when Settings is the first route after F5', async () => {
      const key = new UniverseGenerationKey(
        UniverseSeed.parse('ABCD-0000-0000-0000-0000-0000-0000-0003'),
        GeneratorVersion.V3,
      );
      persistedKeys = [key];
      localStorage.setItem(ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY, activeUniverseRef(key));
      try {
        const fixture = TestBed.createComponent(UniverseSeedSettings);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(TestBed.inject(UniverseSeedFacade).activeGenerationKey().equals(key)).toBe(true);
        expect((fixture.nativeElement as HTMLElement).querySelector(
          '[data-testid="universe-seed-active"]',
        )?.textContent?.trim()).toBe(key.universeSeed.serialize());
        expect(bootstrappedKeys).toHaveLength(0); // Restoring never creates a save.
      } finally {
        localStorage.removeItem(ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY);
      }
    });

    it('waits for delayed persisted V3 selection before allowing B-to-A editing', async () => {
      const seedA = '1430-0000-0000-0000-0000-0000-0000-0001';
      const seedB = '1430-0000-0000-0000-0000-0000-0000-0002';
      const keyA = new UniverseGenerationKey(UniverseSeed.parse(seedA), GeneratorVersion.V3);
      const keyB = new UniverseGenerationKey(UniverseSeed.parse(seedB), GeneratorVersion.V3);
      persistedKeys = [keyA, keyB];
      localStorage.setItem(ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY, activeUniverseRef(keyB));
      let releaseRead!: () => void;
      repositoryReadGate = new Promise<void>(resolve => { releaseRead = resolve; });
      try {
        const fixture = TestBed.createComponent(UniverseSeedSettings);
        fixture.detectChanges();
        const root = fixture.nativeElement as HTMLElement;
        const input = root.querySelector<HTMLInputElement>('[data-testid="universe-seed-input"]')!;
        const apply = root.querySelector<HTMLButtonElement>('[data-testid="universe-seed-apply-button"]')!;
        expect(input.disabled).toBe(true);
        expect(apply.disabled).toBe(true);

        releaseRead();
        // Angular puede considerar estable el fixture antes de que termine una
        // promesa externa simulada (IndexedDB). Esperar el estado de restauración
        // evita una carrera del propio test sin debilitar la comprobación de UI.
        await vi.waitFor(() => {
          expect(fixture.componentInstance.restoringSelection()).toBe(false);
        }, { timeout: 5_000 });
        fixture.detectChanges();
        expect(input.disabled).toBe(false);
        expect(apply.disabled).toBe(false);
        expect(input.value).toBe(seedB);

        input.value = seedA;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        fixture.detectChanges();
        expect(input.value).toBe(seedA);
        expect(TestBed.inject(UniverseSeedFacade).draft()).toBe(seedA);
        await fixture.componentInstance.applySeed();
        fixture.detectChanges();
        expect(TestBed.inject(UniverseSeedFacade).activeGenerationKey().equals(keyA)).toBe(true);
        expect(bootstrappedKeys[0]?.equals(keyA)).toBe(true);
      } finally {
        localStorage.removeItem(ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY);
      }
    });

    it('does not override a freshly typed seed with delayed settings hydration', async () => {
      const saved = new UniverseGenerationKey(
        UniverseSeed.parse('ABCD-0000-0000-0000-0000-0000-0000-0003'),
        GeneratorVersion.V3,
      );
      persistedKeys = [saved];
      localStorage.setItem(ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY, activeUniverseRef(saved));
      try {
        const fixture = TestBed.createComponent(UniverseSeedSettings);
        fixture.detectChanges();
        fixture.componentInstance.onSeedInput({ target: { value:
          'BEEF-0000-0000-0000-0000-0000-0000-0003',
        } } as unknown as Event);
        await fixture.whenStable();
        fixture.detectChanges();
        const facade = TestBed.inject(UniverseSeedFacade);
        expect(facade.draft()).toBe('BEEF-0000-0000-0000-0000-0000-0000-0003');
        expect(facade.activeGenerationKey().equals(saved)).toBe(false);
      } finally {
        localStorage.removeItem(ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY);
      }
    });

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
        expect(bootstrappedKeys[0]?.generatorVersion).toBe(GeneratorVersion.V3);
        expect(facade.generatorVersion()).toBe(GeneratorVersion.V3);
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

    it('uses only the regular seed button to create a V3 universe', async () => {
      const fixture = TestBed.createComponent(UniverseSeedSettings);
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('[data-testid="universe-seed-create-v3-button"]')).toBeNull();
      expect(element.querySelector('[data-testid="universe-seed-apply-button"]')).not.toBeNull();
      fixture.componentInstance.seed.updateDraft('C0DE-0000-0000-0000-0000-0000-0000-0003');
      await fixture.componentInstance.applySeed();
      expect(bootstrappedKeys).toHaveLength(1);
      expect(bootstrappedKeys[0]!.generatorVersion).toBe(GeneratorVersion.V3);
    });

    it('reopens existing V1 save instead of rewriting its seed as V3', async () => {
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

    it('reopens an existing V2 seed instead of implicitly upgrading that persisted universe', async () => {
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
      expect(TestBed.inject(UniverseSeedFacade).generatorVersion()).toBe(GeneratorVersion.V3);
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

    it('does not reuse a previous success while a V3 seed switch is pending', async () => {
      const facade = TestBed.inject(UniverseSeedFacade);
      const seedA = '1430-0000-0000-0000-0000-0000-0000-0001';
      const seedB = '1430-0000-0000-0000-0000-0000-0000-0002';
      const keyA = new UniverseGenerationKey(UniverseSeed.parse(seedA), GeneratorVersion.V3);
      const keyB = new UniverseGenerationKey(UniverseSeed.parse(seedB), GeneratorVersion.V3);
      persistedKeys = [keyA, keyB];
      facade.activatePersistedUniverse(keyB);
      facade.markUniverseActivated();
      const fixture = TestBed.createComponent(UniverseSeedSettings);
      fixture.detectChanges();
      fixture.componentInstance.onSeedInput({target: {value: seedA}} as unknown as Event);
      const activation = fixture.componentInstance.applySeed();
      fixture.detectChanges();
      expect(facade.feedback()).toEqual({kind: 'idle', message: 'Activando universo…'});
      await activation;
      fixture.detectChanges();
      expect(facade.activeGenerationKey().equals(keyA)).toBe(true);
      expect(facade.feedback()).toEqual({kind: 'success', message: 'Universo creado y activado correctamente.'});
    });

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

        expect(TestBed.inject(UniverseSeedFacade).generatorVersion()).toBe(GeneratorVersion.V3);
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
