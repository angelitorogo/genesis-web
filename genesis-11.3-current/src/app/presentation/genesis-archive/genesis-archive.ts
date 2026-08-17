import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

import {
  GenesisSectionTitle,
} from '../../ui/components/genesis-section-title/genesis-section-title';
import {
  GenesisEmptyState,
} from '../../ui/states/genesis-empty-state/genesis-empty-state';
import {
  GenesisScreen,
} from '../../ui/layout/genesis-screen/genesis-screen';

@Component({
  selector: 'app-genesis-archive',
  standalone: true,
  imports: [
    GenesisEmptyState,
    GenesisScreen,
    GenesisSectionTitle,
  ],
  templateUrl: './genesis-archive.html',
  styleUrl: './genesis-archive.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class GenesisArchive {}