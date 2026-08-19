import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import {
  EmissionNebulaRender,
} from './emission-nebula-render';

import {
  ReflectionNebulaRender,
} from './reflection-nebula-render';

import {
  ArchiveGalacticObjectRenderKind,
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

  imports: [
    EmissionNebulaRender,
    ReflectionNebulaRender,
  ],

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


  /**
   * The new high-fidelity renderer is used for:
   * - generic NEBULA SIGNAL/IDENTIFIED, where the subtype must stay hidden;
   * - already-authorized EMISSION nebulae.
   *
   * REFLECTION, DARK and PLANETARY keep the frozen 12.8 SVG renderer until
   * their own visual pass is implemented.
   */
  readonly usesEmissionNebulaRenderer =
    computed(
      () => {
        const descriptor =
          this.descriptor();

        return (
          descriptor.kind ===
            ArchiveGalacticObjectRenderKind
              .NEBULA &&
          (
            descriptor.variant ===
              null ||
            descriptor.variant ===
              'EMISSION'
          )
        );
      },
    );

  readonly usesReflectionNebulaRenderer =
    computed(
      () => {
        const descriptor =
          this.descriptor();

        return (
          descriptor.kind ===
            ArchiveGalacticObjectRenderKind
              .NEBULA &&
          descriptor.variant ===
            'REFLECTION'
        );
      },
    );

  readonly svgIds =
    computed(
      () => {
        const descriptor =
          this.descriptor();

        const namespace =
          stableSvgNamespace(
            [
              descriptor.seed,
              descriptor.kind,
              descriptor.knowledgeLevel,
            ].join(
              '/',
            ),
          );

        return Object.freeze({
          core:
            `${namespace}-core`,
          filament:
            `${namespace}-filament`,
          glow:
            `${namespace}-glow`,
          cloud:
            `${namespace}-cloud`,
        });
      },
    );
}


function stableSvgNamespace(
  value:
    string,
): string {

  let hash =
    2166136261;

  for (
    let index =
      0;
    index <
    value.length;
    index +=
      1
  ) {
    hash ^=
      value.charCodeAt(
        index,
      );

    hash =
      Math.imul(
        hash,
        16777619,
      );
  }

  return `archive-object-${(
    hash >>>
      0
  ).toString(
    16,
  )}`;
}
