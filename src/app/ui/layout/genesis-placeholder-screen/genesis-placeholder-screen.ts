import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import {
  GenesisCard,
} from '../../components/genesis-card/genesis-card';
import {
  GenesisSectionTitle,
} from '../../components/genesis-section-title/genesis-section-title';
import {
  GenesisScreen,
} from '../genesis-screen/genesis-screen';

@Component({
  selector: 'genesis-placeholder-screen',
  standalone: true,
  imports: [
    GenesisCard,
    GenesisScreen,
    GenesisSectionTitle,
  ],
  templateUrl: './genesis-placeholder-screen.html',
  styleUrl: './genesis-placeholder-screen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenesisPlaceholderScreen {
  readonly testId =
    input.required<string>();

  readonly eyebrow =
    input.required<string>();

  readonly title =
    input.required<string>();

  readonly description =
    input.required<string>();

  readonly status =
    input.required<string>();
}