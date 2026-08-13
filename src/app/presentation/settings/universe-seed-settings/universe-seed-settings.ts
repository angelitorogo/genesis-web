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

  async applySeed():
    Promise<void> {

    if (
      !this.seed.applyDraft()
    ) {
      return;
    }

    try {
      const result =
        await this
          .bootstrap
          .ensureInitialized(
            this
              .seed
              .activeGenerationKey(),
          );

      if (
        result.created
      ) {
        this.seed
          .markUniverseCreated();
      } else {
        this.seed
          .markUniverseActivated();
      }
    } catch {
      this.seed
        .markUniverseActivationFailed();
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
