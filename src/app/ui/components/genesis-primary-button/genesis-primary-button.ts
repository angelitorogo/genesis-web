import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

@Component({
  selector: 'button[genesis-primary-button]',
  standalone: true,
  imports: [],
  templateUrl:
    './genesis-primary-button.html',
  styleUrl:
    './genesis-primary-button.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class GenesisPrimaryButton {}