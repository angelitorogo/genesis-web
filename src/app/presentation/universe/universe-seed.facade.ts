import { resolveSavedUniverse, readSavedUniverseRef, saveUniverseRef } from './active-universe-selection';
import {
  computed,
  Injectable,
  signal,
} from '@angular/core';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

export const DEFAULT_UNIVERSE_SEED =
  '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';

export type UniverseSeedFeedbackKind =
  | 'idle'
  | 'success'
  | 'error';

export interface UniverseSeedFeedback {
  readonly kind:
    UniverseSeedFeedbackKind;

  readonly message:
    string;
}

@Injectable({
  providedIn:
    'root',
})
export class UniverseSeedFacade {
  private explicitlySelected = false;

  private readonly activeGenerationKeyState =
    signal(
      new UniverseGenerationKey(
        UniverseSeed.parse(
          DEFAULT_UNIVERSE_SEED,
        ),
        GeneratorVersion.V1,
      ),
    );

  private readonly draftState =
    signal(
      DEFAULT_UNIVERSE_SEED,
    );

  private readonly feedbackState =
    signal<UniverseSeedFeedback>({
      kind:
        'idle',

      message:
        'Seed lista.',
    });

  readonly activeGenerationKey =
    this
      .activeGenerationKeyState
      .asReadonly();

  readonly activeSeed =
    computed(
      () =>
        this
          .activeGenerationKeyState()
          .universeSeed,
    );

  readonly generatorVersion =
    computed(
      () =>
        this
          .activeGenerationKeyState()
          .generatorVersion,
    );

  readonly generatorVersionCode =
    computed(
      () =>
        this
          .activeGenerationKeyState()
          .generatorVersionCode,
    );

  readonly draft =
    this
      .draftState
      .asReadonly();

  readonly feedback =
    this
      .feedbackState
      .asReadonly();

  readonly serializedSeed =
    computed(
      () =>
        this
          .activeSeed()
          .serialize(),
    );

  readonly normalizedSeed =
    computed(
      () =>
        this
          .activeSeed()
          .normalizedValue,
    );

  readonly draftIsValid =
    computed(
      () =>
        UniverseSeed.isValid(
          this
            .draftState()
            .trim(),
        ),
    );

  updateDraft(
    value: string,
  ): void {
    this.draftState.set(
      value,
    );

    this.feedbackState.set({
      kind:
        'idle',

      message:
        'Seed pendiente de aplicar.',
    });
  }

  applyDraft(version: GeneratorVersion = this.activeGenerationKeyState().generatorVersion):
    boolean {

    const candidate =
      this
        .draftState()
        .trim();

    if (
      !UniverseSeed.isValid(
        candidate,
      )
    ) {
      this.feedbackState.set({
        kind:
          'error',

        message:
          'La seed no tiene un formato válido.',
      });

      return false;
    }

    const seed =
      UniverseSeed.parse(
        candidate,
      );

    if (!GeneratorVersion.isReleasedForNewUniverses(version)) {
      throw new RangeError(`Unsupported GeneratorVersion: ${version.code}.`);
    }

    this.activeGenerationKeyState.set(new UniverseGenerationKey(seed, version));
    this.explicitlySelected = true;

    this.draftState.set(
      seed.serialize(),
    );

    this.feedbackState.set({
      kind:
        'success',

      message:
        'Seed aplicada correctamente.',
    });

    return true;
  }

  /** Resolve only a key actually present in IndexedDB; never bootstrap from a saved ref. */
  resolvePersistedUniverse(universes: readonly UniverseGenerationKey[]): UniverseGenerationKey | null {
    return resolveSavedUniverse(
      universes,
      this.activeGenerationKeyState(),
      this.explicitlySelected,
      this.explicitlySelected ? null : readSavedUniverseRef(),
    );
  }

  /** Write the selection only AFTER bootstrap has completed successfully. */
  private rememberSuccessfulSelection(): void {
    this.explicitlySelected = true;
    saveUniverseRef(this.activeGenerationKeyState());
  }

  /** Only call with an already persisted key (or to roll back a failed bootstrap). */
  activatePersistedUniverse(key: UniverseGenerationKey): void {
    this.activeGenerationKeyState.set(key);
    this.draftState.set(key.universeSeed.serialize());
    this.explicitlySelected = true;
  }

  markUniverseCreated():
    void {
    this.rememberSuccessfulSelection();

    this.feedbackState.set({
      kind:
        'success',

      message:
        'Universo creado y activado correctamente.',
    });
  }

  markUniverseActivated():
    void {
    this.rememberSuccessfulSelection();

    this.feedbackState.set({
      kind:
        'success',

      message:
        'Universo activado correctamente.',
    });
  }

  markUniverseActivationFailed():
    void {

    this.feedbackState.set({
      kind:
        'error',

      message:
        'No se pudo crear o activar el universo local.',
    });
  }

  restoreActiveSeed():
    void {

    this.draftState.set(
      this.serializedSeed(),
    );

    this.feedbackState.set({
      kind:
        'idle',

      message:
        'Seed activa restaurada en el campo.',
    });
  }

  markCopied():
    void {

    this.feedbackState.set({
      kind:
        'success',

      message:
        'Seed copiada al portapapeles.',
    });
  }

  markCopyFailed():
    void {

    this.feedbackState.set({
      kind:
        'error',

      message:
        'No se pudo copiar la seed.',
    });
  }
}
