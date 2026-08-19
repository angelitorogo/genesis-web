import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

import {
  RouterLink,
} from '@angular/router';

@Component({
  selector:
    'app-laboratory',

  standalone:
    true,

  imports: [
    RouterLink,
  ],

  templateUrl:
    './laboratory.html',

  styleUrl:
    './laboratory.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class LaboratoryPage {}
