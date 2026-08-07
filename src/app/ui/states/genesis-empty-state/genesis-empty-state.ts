import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

@Component({
  selector: 'genesis-empty-state',
  standalone: true,
  imports: [],
  templateUrl:
    './genesis-empty-state.html',
  styleUrl:
    './genesis-empty-state.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class GenesisEmptyState {
  readonly title =
    input('Sin datos disponibles');

  readonly message =
    input(
      'Todavía no existe información que mostrar.',
    );
}