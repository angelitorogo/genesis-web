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
  buildAgnAccretionDiskInterpretation,
  buildQuasarAccretionDiskInterpretation,
} from './galaxy-accretion-disk-interpretation';

import {
  type GalaxyAccretionDiskVisualization,
} from './galaxy-accretion-disk-visualization.model';

@Component({
  selector:
    'app-galaxy-accretion-disk-visualization',

  standalone:
    true,

  imports: [
    AgnNucleusRender,
    QuasarNucleusRender,
  ],

  templateUrl:
    './galaxy-accretion-disk-visualization.html',

  styleUrl:
    './galaxy-accretion-disk-visualization.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class GalaxyAccretionDiskVisualizationComponent {

  readonly visual =
    input.required<GalaxyAccretionDiskVisualization>();

  readonly agnModel =
    computed(
      () => {
        const visual =
          this.visual();

        return visual.kind ===
          'AGN'
          ? visual.agnModel
          : null;
      },
    );

  readonly quasarModel =
    computed(
      () => {
        const visual =
          this.visual();

        return visual.kind ===
          'QUASAR'
          ? visual.quasarModel
          : null;
      },
    );

  readonly strictInterpretation =
    computed(
      () => {
        const agnModel =
          this.agnModel();

        if (
          agnModel !==
            null
        ) {
          return buildAgnAccretionDiskInterpretation(
            agnModel,
          );
        }

        const quasarModel =
          this.quasarModel();

        if (
          quasarModel !==
            null
        ) {
          return buildQuasarAccretionDiskInterpretation(
            quasarModel,
          );
        }

        throw new RangeError(
          '28.1c requires an AGN or QUASAR accretion disk visual model.',
        );
      },
    );
}
