import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import {
  UniverseBootstrapService,
} from '../../universe/universe-bootstrap.service';

import {
  UniverseSeedFacade,
} from '../../universe/universe-seed.facade';
import { GeneratorVersion } from '../../../domain/generation/generator-version';
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
export class UniverseSeedSettings {
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

  onSeedInput(
    event: Event,
  ): void {
    const input =
      event.target as
        HTMLInputElement;

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
    const previous = this.seed.activeGenerationKey();
    try {
      const desired = UniverseSeed.parse(candidate);
      const persisted = await this.repositories.universeRepository.getAll();
      // Never reinterpret an existing V1 save as V2. A genuinely NEW seed
      // creates V2, while an existing seed reuses its exact stored version.
      const matching = persisted.filter(key => key.universeSeed.equals(desired));
      const selected = matching.find(key => key.equals(previous)) ??
        matching.find(key => key.generatorVersion === GeneratorVersion.V2) ??
        matching.find(key => key.generatorVersion === GeneratorVersion.V1);
      const version = selected?.generatorVersion ?? GeneratorVersion.V2;
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
