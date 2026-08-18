import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import {
  GalaxyFocusTransitionRuntime,
} from '../runtime/galaxy-focus-transition.runtime';

@Component({
  selector:
    'app-galaxy-focus-transition',

  standalone:
    true,

  templateUrl:
    './galaxy-focus-transition.html',

  styleUrl:
    './galaxy-focus-transition.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class GalaxyFocusTransition {

  readonly runtime =
    inject(
      GalaxyFocusTransitionRuntime,
    );
}
