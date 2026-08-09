import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

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

  applySeed():
    void {
    this.seed.applyDraft();
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