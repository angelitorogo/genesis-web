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

  applyDraft():
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

    const currentVersion =
      this
        .activeGenerationKeyState()
        .generatorVersion;

    this
      .activeGenerationKeyState
      .set(
        new UniverseGenerationKey(
          seed,
          currentVersion,
        ),
      );

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

  markUniverseCreated():
    void {

    this.feedbackState.set({
      kind:
        'success',

      message:
        'Universo creado y activado correctamente.',
    });
  }

  markUniverseActivated():
    void {

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
