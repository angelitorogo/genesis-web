import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  UniverseBootstrapService,
} from '../../universe/universe-bootstrap.service';

import {
  UniverseSeedFacade,
} from '../../universe/universe-seed.facade';
import { GeneratorVersion } from '../../../domain/generation/generator-version';
import { readSavedUniverseRef } from '../../universe/active-universe-selection';
import { UniverseSeed } from '../../../domain/universe/universe-seed';
import { GENESIS_LOCAL_REPOSITORIES } from '../../runtime/genesis-local-repositories';

@Component({
  selector:
    'app-universe-seed-settings',

  standalone:
    true,

  templateUrl:
    './universe-seed-settings.html',

  styleUrl:
    './universe-seed-settings.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class UniverseSeedSettings implements OnInit {
  readonly seed =
    inject(
      UniverseSeedFacade,
    );

  private readonly bootstrap =
    inject(
      UniverseBootstrapService,
    );

  private readonly repositories = inject(GENESIS_LOCAL_REPOSITORIES);
  private applying = false;
  private draftTouched = false;
  // /settings puede hidratar la selección persistida de forma asíncrona.
  // No exponer un editor aún inestable durante la lectura de IndexedDB:
  // Playwright y el usuario podrían editar el borrador que va a reemplazarse.
  readonly restoringSelection = signal(false);

  ngOnInit(): void {
    // /settings can be the first route after a hard reload. Unlike Home and
    // Galaxy Map, it previously never resolved the saved active universe.
    // Read only when a confirmed selection reference exists; never create a
    // universe, overwrite progress or interpret the default seed as a save.
    if (readSavedUniverseRef() !== null) {
      this.restoringSelection.set(true);
      void this.restoreConfirmedSelection();
    }
  }

  private async restoreConfirmedSelection(): Promise<void> {
    try {
      const universes = await this.repositories.universeRepository.getAll();
      // A user may type or click Usar seed while IndexedDB is being read.
      // In that case the user's explicit choice must always win.
      if (this.applying || this.draftTouched) return;
      const stored = this.seed.resolvePersistedUniverse(universes);
      if (stored !== null) this.seed.activatePersistedUniverse(stored);
    } catch {
      // Do not replace the current selection with an unverified fallback.
    } finally {
      // Incluso con IndexedDB bloqueado, se puede intentar una nueva seed.
      this.restoringSelection.set(false);
    }
  }

  onSeedInput(
    event: Event,
  ): void {
    const input =
      event.target as
        HTMLInputElement;

    this.draftTouched = true;
    this.seed.updateDraft(
      input.value,
    );
  }

  async applySeed(): Promise<void> {
    if (this.applying) return;
    // A bad draft must not access storage or change the active universe.
    const candidate = this.seed.draft().trim();
    if (!UniverseSeed.isValid(candidate)) {
      this.seed.applyDraft(); // Existing validation and feedback contract.
      return;
    }

    this.applying = true;
    // A previous successful activation must not be mistaken for the result
    // of this still-pending operation (notably when switching B -> A).
    this.seed.markUniverseActivationPending();
    const previous = this.seed.activeGenerationKey();
    try {
      const desired = UniverseSeed.parse(candidate);
      const persisted = await this.repositories.universeRepository.getAll();
      // A NEW seed always creates V3. Reopening a persisted seed retains its
      // original version; never reinterpret an existing universe silently.
      const matching = persisted.filter(key => key.universeSeed.equals(desired));
      const selected = matching.find(key => key.equals(previous)) ??
        matching.find(key => key.generatorVersion === GeneratorVersion.V3) ??
        matching.find(key => key.generatorVersion === GeneratorVersion.V2) ??
        matching.find(key => key.generatorVersion === GeneratorVersion.V1);
      const version = selected?.generatorVersion ?? GeneratorVersion.V3;
      if (!this.seed.applyDraft(version)) return;
      const result = await this.bootstrap.ensureInitialized(this.seed.activeGenerationKey());
      if (result.created) this.seed.markUniverseCreated();
      else this.seed.markUniverseActivated();
    } catch {
      this.seed.activatePersistedUniverse(previous);
      this.seed.markUniverseActivationFailed();
    } finally {
      this.applying = false;
    }
  }


  restoreSeed():
    void {
    this.seed.restoreActiveSeed();
  }

  async copySeed():
    Promise<void> {

    const clipboard =
      globalThis
        .navigator
        ?.clipboard;

    if (
      !clipboard ||
      typeof clipboard.writeText !==
        'function'
    ) {
      this.seed.markCopyFailed();

      return;
    }

    try {
      await clipboard.writeText(
        this.seed.serializedSeed(),
      );

      this.seed.markCopied();
    } catch {
      this.seed.markCopyFailed();
    }
  }
}
