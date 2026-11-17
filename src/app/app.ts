import {
  ChangeDetectionStrategy,
  Component,
  inject,
  DestroyRef,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {GenesisUniversalArchiveAutoIndex38BisB6} from './presentation/genesis-archive/38-bis/genesis-universal-archive-autoindex-38-bis-b6';

import {
  GalaxyFocusTransition,
} from './presentation/galaxy-focus-transition/galaxy-focus-transition';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    GalaxyFocusTransition,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly archiveUpdater=inject(GenesisUniversalArchiveAutoIndex38BisB6);
  private readonly destroyRef=inject(DestroyRef);
  constructor(){
    this.archiveUpdater.start();
    this.destroyRef.onDestroy(()=>this.archiveUpdater.stop());
  }
}