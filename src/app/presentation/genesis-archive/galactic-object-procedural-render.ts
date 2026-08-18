import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import {
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

import {
  GalacticObjectProceduralRenderModelBuilder,
} from './galactic-object-procedural-render-model';

@Component({
  selector:
    'app-galactic-object-procedural-render',

  standalone:
    true,

  templateUrl:
    './galactic-object-procedural-render.html',

  styleUrl:
    './galactic-object-procedural-render.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class GalacticObjectProceduralRender {

  readonly descriptor =
    input.required<ArchiveGalacticObjectRenderDescriptor>();

  readonly renderModel =
    computed(
      () =>
        GalacticObjectProceduralRenderModelBuilder
          .build(
            this.descriptor(),
          ),
    );
}
