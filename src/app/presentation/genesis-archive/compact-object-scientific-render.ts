import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { type CompactObjectScientificVisual } from './compact-object-scientific-visual';

/** Lightweight vector science illustration; no Three.js and no new physics. */
@Component({
  selector: 'app-compact-object-scientific-render',
  standalone: true,
  templateUrl: './compact-object-scientific-render.html',
  styleUrl: './compact-object-scientific-render.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompactObjectScientificRender {
  readonly visual = input.required<CompactObjectScientificVisual>();
}
