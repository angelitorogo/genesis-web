import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

@Component({
  selector: 'genesis-loading-state',
  standalone: true,
  imports: [],
  templateUrl:
    './genesis-loading-state.html',
  styleUrl:
    './genesis-loading-state.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class GenesisLoadingState {
  readonly title =
    input('Cargando información');

  readonly message =
    input(
      'GENESIS está preparando los datos solicitados.',
    );
}