import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

import {
  GenesisPlaceholderScreen,
} from '../../ui/layout/genesis-placeholder-screen/genesis-placeholder-screen';

@Component({
  selector: 'app-galaxy-map',
  standalone: true,
  imports: [
    GenesisPlaceholderScreen,
  ],
  templateUrl: './galaxy-map.html',
  styleUrl: './galaxy-map.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalaxyMap {}