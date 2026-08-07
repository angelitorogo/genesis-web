import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

@Component({
  selector: 'genesis-card',
  standalone: true,
  imports: [],
  templateUrl: './genesis-card.html',
  styleUrl: './genesis-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenesisCard {}