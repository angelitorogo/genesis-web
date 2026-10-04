import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import {
  AgnNucleusRender,
} from '../laboratory/galactic-objects/agn-nucleus-render';

import {
  QuasarNucleusRender,
} from '../laboratory/galactic-objects/quasar-nucleus-render';

import {
  QuiescentNucleusRender,
} from '../laboratory/galactic-objects/quiescent-nucleus-render';

import {
  type GalaxyNucleusVisualization,
} from './galaxy-nucleus-visualization.model';

@Component({
  selector:
    'app-galaxy-nucleus-visualization',

  standalone:
    true,

  imports: [
    QuiescentNucleusRender,
    AgnNucleusRender,
    QuasarNucleusRender,
  ],

  templateUrl:
    './galaxy-nucleus-visualization.html',

  styleUrl:
    './galaxy-nucleus-visualization.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class GalaxyNucleusVisualizationComponent {

  readonly visual =
    input.required<GalaxyNucleusVisualization>();

  readonly quiescentVisual =
    computed(
      () => {
        const visual =
          this.visual();

        return visual.kind ===
          'QUIESCENT'
          ? visual
          : null;
      },
    );

  readonly agnVisual =
    computed(
      () => {
        const visual =
          this.visual();

        return visual.kind ===
          'AGN'
          ? visual
          : null;
      },
    );

  readonly quasarVisual =
    computed(
      () => {
        const visual =
          this.visual();

        return visual.kind ===
          'QUASAR'
          ? visual
          : null;
      },
    );
}
