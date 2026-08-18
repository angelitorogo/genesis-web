import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

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
export class App {}