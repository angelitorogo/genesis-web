import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

@Component({
  selector: 'genesis-screen',
  standalone: true,
  imports: [],
  templateUrl: './genesis-screen.html',
  styleUrl: './genesis-screen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenesisScreen {}