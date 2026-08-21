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
  DarkNebulaRender,
} from './dark-nebula-render';

import {
  PlanetaryNebulaRender,
} from './planetary-nebula-render';

import {
  HiiRegionLowRender,
} from './hii-region-low-render';

import {
  HiiRegionModerateRender,
} from './hii-region-moderate-render';

import {
  HiiRegionHighRender,
} from './hii-region-high-render';

import {
  HiiRegionIntenseRender,
} from './hii-region-intense-render';

import {
  OpenClusterRender,
} from './open-cluster-render';

import {
  GlobularClusterRender,
} from './globular-cluster-render';


import {
  SupernovaRemnantRender,
} from './supernova-remnant-render';

import {
  ArchiveGalacticObjectRenderKind,
  ArchiveGalacticObjectRenderProfile,
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
    DarkNebulaRender,
    PlanetaryNebulaRender,
    HiiRegionLowRender,
    HiiRegionModerateRender,
    HiiRegionHighRender,
    HiiRegionIntenseRender,
    OpenClusterRender,
    GlobularClusterRender,
    SupernovaRemnantRender,
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
   * Generic nebulae remain on the frozen diffuse renderer, except when an
   * opaque renderer-only profile says that the already-observed morphology is
   * the compact planetary volume. Scientific `variant` still stays null before
   * CATALOGUED.
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
            (
              descriptor.variant ===
                null &&
              descriptor.renderProfile !==
                ArchiveGalacticObjectRenderProfile
                  .PLANETARY_VOLUME &&
              descriptor.renderProfile !==
                ArchiveGalacticObjectRenderProfile
                  .HII_LOW_VOLUME &&
              descriptor.renderProfile !==
                ArchiveGalacticObjectRenderProfile
                  .HII_MODERATE_VOLUME
              &&
              descriptor.renderProfile !==
                ArchiveGalacticObjectRenderProfile
                  .HII_HIGH_VOLUME &&
              descriptor.renderProfile !==
                ArchiveGalacticObjectRenderProfile
                  .HII_INTENSE_VOLUME
            ) ||
            descriptor.variant ===
              'EMISSION'
          )
        );
      },
    );

  readonly usesHiiRegionLowRenderer =
    computed(
      () => {
        const descriptor =
          this.descriptor();

        return (
          descriptor.renderProfile ===
            ArchiveGalacticObjectRenderProfile
              .HII_LOW_VOLUME ||
          (
            descriptor.kind ===
              ArchiveGalacticObjectRenderKind
                .HII_REGION &&
            descriptor.variant ===
              'LOW'
          )
        );
      },
    );

  readonly usesHiiRegionModerateRenderer =
    computed(
      () => {
        const descriptor =
          this.descriptor();

        return (
          descriptor.renderProfile ===
            ArchiveGalacticObjectRenderProfile
              .HII_MODERATE_VOLUME ||
          (
            descriptor.kind ===
              ArchiveGalacticObjectRenderKind
                .HII_REGION &&
            descriptor.variant ===
              'MODERATE'
          )
        );
      },
    );

  readonly usesHiiRegionHighRenderer =
    computed(
      () => {
        const descriptor =
          this.descriptor();

        return (
          descriptor.renderProfile ===
            ArchiveGalacticObjectRenderProfile
              .HII_HIGH_VOLUME ||
          (
            descriptor.kind ===
              ArchiveGalacticObjectRenderKind
                .HII_REGION &&
            descriptor.variant ===
              'HIGH'
          )
        );
      },
    );

  readonly usesHiiRegionIntenseRenderer =
    computed(
      () => {
        const descriptor =
          this.descriptor();

        return (
          descriptor.renderProfile ===
            ArchiveGalacticObjectRenderProfile
              .HII_INTENSE_VOLUME ||
          (
            descriptor.kind ===
              ArchiveGalacticObjectRenderKind
                .HII_REGION &&
            descriptor.variant ===
              'INTENSE'
          )
        );
      },
    );

  readonly usesOpenClusterRenderer =
    computed(
      () => {
        const descriptor =
          this.descriptor();

        return (
          descriptor.renderProfile ===
            ArchiveGalacticObjectRenderProfile
              .OPEN_CLUSTER_FIELD ||
          descriptor.kind ===
            ArchiveGalacticObjectRenderKind
              .OPEN_CLUSTER
        );
      },
    );

  readonly usesGlobularClusterRenderer =
    computed(
      () => {
        const descriptor =
          this.descriptor();

        return (
          descriptor.renderProfile ===
            ArchiveGalacticObjectRenderProfile
              .GLOBULAR_CLUSTER_FIELD ||
          descriptor.kind ===
            ArchiveGalacticObjectRenderKind
              .GLOBULAR_CLUSTER
        );
      },
    );


  readonly usesSupernovaRemnantRenderer =
    computed(
      () => {
        const descriptor =
          this.descriptor();

        return (
          descriptor.renderProfile ===
            ArchiveGalacticObjectRenderProfile
              .SUPERNOVA_REMNANT_SHELL ||
          descriptor.renderProfile ===
            ArchiveGalacticObjectRenderProfile
              .SUPERNOVA_REMNANT_PLERION ||
          descriptor.renderProfile ===
            ArchiveGalacticObjectRenderProfile
              .SUPERNOVA_REMNANT_COMPOSITE ||
          descriptor.kind ===
            ArchiveGalacticObjectRenderKind
              .SUPERNOVA_REMNANT
        );
      },
    );

  readonly usesPlanetaryNebulaRenderer =
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
              'PLANETARY' ||
            descriptor.renderProfile ===
              ArchiveGalacticObjectRenderProfile
                .PLANETARY_VOLUME
          )
        );
      },
    );

  readonly usesDarkNebulaRenderer =
    computed(
      () => {
        const descriptor =
          this.descriptor();

        return (
          descriptor.kind ===
            ArchiveGalacticObjectRenderKind
              .NEBULA &&
          descriptor.variant ===
            'DARK'
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
