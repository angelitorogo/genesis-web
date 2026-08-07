import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

import {
  GenesisPlaceholderScreen,
} from '../../ui/layout/genesis-placeholder-screen/genesis-placeholder-screen';

@Component({
  selector: 'app-observatory',
  standalone: true,
  imports: [
    GenesisPlaceholderScreen,
  ],
  templateUrl: './observatory.html',
  styleUrl: './observatory.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Observatory {}