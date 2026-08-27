import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import {
  type ArchiveStellarSystemRenderDescriptor,
} from './archive-stellar-system-card';

import {
  StellarSystemProceduralRenderModelBuilder,
} from './stellar-system-procedural-render-model';

@Component({
  selector:
    'app-stellar-system-procedural-render',

  standalone:
    true,

  templateUrl:
    './stellar-system-procedural-render.html',

  styleUrl:
    './stellar-system-procedural-render.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class StellarSystemProceduralRender {

  readonly descriptor =
    input.required<ArchiveStellarSystemRenderDescriptor>();

  readonly renderModel =
    computed(
      () =>
        StellarSystemProceduralRenderModelBuilder
          .build(
            this.descriptor(),
          ),
    );
}
