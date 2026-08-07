import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

@Component({
  selector: 'genesis-section-title',
  standalone: true,
  imports: [],
  templateUrl:
    './genesis-section-title.html',
  styleUrl:
    './genesis-section-title.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class GenesisSectionTitle {
  readonly title =
    input.required<string>();

  readonly eyebrow =
    input<string | null>(null);

  readonly description =
    input<string | null>(null);
}