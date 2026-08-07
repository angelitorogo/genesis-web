import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

@Component({
  selector: 'genesis-error-state',
  standalone: true,
  imports: [],
  templateUrl:
    './genesis-error-state.html',
  styleUrl:
    './genesis-error-state.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class GenesisErrorState {
  readonly title =
    input('No se ha podido completar la operación');

  readonly message =
    input(
      'GENESIS ha encontrado un problema al procesar la información.',
    );
}