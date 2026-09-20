import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  BodyLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  PlanetScientificTargetResolver,
  type PlanetScientificResolvedTarget,
} from '../../simulation/planetary/planet-scientific-target-resolver';

import {
  PlanetScientificSectionsAssembler,
  type PlanetScientificSectionsModel,
} from './planet-scientific-sections';

import {
  ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailModel,
} from '../genesis-archive/archive-discovery-detail.facade';


import {
  ScientificBodyPreviewAssembler,
  DEFAULT_SCIENTIFIC_BODY_PREVIEW_SCENE_RESOLVER,
  type ScientificBodyPreviewModel,
  type ScientificBodyPreviewSceneResolver,
} from '../scientific/scientific-body-preview';

export const PlanetScientificFicheResolutionKind =
  Object.freeze({
    LOCKED:
      'LOCKED',
    AVAILABLE:
      'AVAILABLE',
    NOT_FOUND:
      'NOT_FOUND',
  } as const);

export type PlanetScientificFicheResolutionKind =
  typeof PlanetScientificFicheResolutionKind[
    keyof typeof PlanetScientificFicheResolutionKind
  ];

export interface PlanetScientificCardModel {
  readonly title:
    string;

  readonly summary:
    string;

  readonly hostSystemTitle:
    string;

  readonly planetOrdinal:
    number;

  readonly bodyIndex:
    bigint;

  readonly orbitTopologyLabel:
    string;

  readonly hostPlanetCount:
    number;

  readonly accessLabel:
    string;

  readonly planetaryKnowledgeLabel:
    string;

  readonly locatorLabel:
    string;

  readonly sections:
    PlanetScientificSectionsModel;

  readonly preview:
    ScientificBodyPreviewModel;
}

export type PlanetScientificFicheResolution =
  | {
      readonly kind:
        typeof PlanetScientificFicheResolutionKind.LOCKED;

      readonly reason:
        string;
    }
  | {
      readonly kind:
        typeof PlanetScientificFicheResolutionKind.NOT_FOUND;

      readonly reason:
        string;
    }
  | {
      readonly kind:
        typeof PlanetScientificFicheResolutionKind.AVAILABLE;

      readonly card:
        PlanetScientificCardModel;
    };

export interface PlanetScientificTargetResolutionResolver {
  resolveDetailed(
    generationKey:
      UniverseGenerationKey,

    locator:
      BodyLocator,
  ): PlanetScientificResolvedTarget | null;
}

const DEFAULT_TARGET_RESOLVER:
  PlanetScientificTargetResolutionResolver =
  Object.freeze({
    resolveDetailed(
      generationKey:
        UniverseGenerationKey,

      locator:
        BodyLocator,
    ): PlanetScientificResolvedTarget | null {
      return PlanetScientificTargetResolver
        .resolveDetailed(
          generationKey,
          locator,
        );
    },
  });

/**
 * Point-26.4 state-safe detailed planet fiche assembler.
 *
 * The host system must already be CONFIRMED before the detailed target is
 * materialized. Point 26.4 projects the already-frozen phase-19/20/21 science
 * into explicit UI sections. It does not create a separate planetary
 * DiscoveryState and never exposes generation keys, procedural seeds or domain
 * aggregates to the presentation model.
 */
export class PlanetScientificCardAssembler {

  private constructor() {}

  static build(
    systemModel:
      ArchiveDiscoveryDetailModel,

    bodyIndex:
      bigint,

    resolver:
      PlanetScientificTargetResolutionResolver =
        DEFAULT_TARGET_RESOLVER,

    previewSceneResolver:
      ScientificBodyPreviewSceneResolver =
        DEFAULT_SCIENTIFIC_BODY_PREVIEW_SCENE_RESOLVER,
  ): PlanetScientificFicheResolution {

    if (
      systemModel.locatorKind !==
        ArchiveDiscoveryLocatorKind.SYSTEM ||
      systemModel.stellarSystemCard ===
        null
    ) {
      return Object.freeze({
        kind:
          PlanetScientificFicheResolutionKind.NOT_FOUND,
        reason:
          'La ruta planetaria requiere un sistema estelar persistido.',
      });
    }

    if (
      bodyIndex <
        0n
    ) {
      return Object.freeze({
        kind:
          PlanetScientificFicheResolutionKind.NOT_FOUND,
        reason:
          'El índice planetario de la ruta no es válido.',
      });
    }

    if (
      systemModel.discoveryState.code <
        DiscoveryState.CONFIRMED.code
    ) {
      return Object.freeze({
        kind:
          PlanetScientificFicheResolutionKind.LOCKED,
        reason:
          'La investigación individual de cuerpos requiere que el sistema anfitrión esté confirmado.',
      });
    }

    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          systemModel.universeSeed,
        ),
        GeneratorVersion.fromCode(
          systemModel.generatorVersionCode,
        ),
      );

    const locator =
      new BodyLocator(
        systemModel.galaxyIndex,
        systemModel.sectorKey,
        systemModel.galacticObjectIndex,
        bodyIndex,
      );

    const target =
      resolver.resolveDetailed(
        generationKey,
        locator,
      );

    if (
      target ===
        null
    ) {
      return Object.freeze({
        kind:
          PlanetScientificFicheResolutionKind.NOT_FOUND,
        reason:
          'El índice solicitado no corresponde a un planeta de este sistema.',
      });
    }

    const identity =
      target.identity;

    return Object.freeze({
      kind:
        PlanetScientificFicheResolutionKind.AVAILABLE,
      card:
        Object.freeze({
          title:
            identity.designation,
          summary:
            `${identity.designation} es el planeta ${identity.planetOrdinal} del sistema ${identity.hostSystemDesignation}. Su sistema anfitrión está confirmado y permite consultar esta caracterización científica detallada.`,
          hostSystemTitle:
            identity.hostSystemDesignation,
          planetOrdinal:
            identity.planetOrdinal,
          bodyIndex,
          orbitTopologyLabel:
            orbitTopologyLabel(
              identity.orbitTopology,
            ),
          hostPlanetCount:
            identity.hostPlanetCount,
          accessLabel:
            'Consulta científica habilitada',
          planetaryKnowledgeLabel:
            'Caracterización científica detallada',
          locatorLabel:
            `G${systemModel.galaxyIndex.toString()} / S${systemModel.sectorKey.toString()} / O${systemModel.galacticObjectIndex.toString()} / B${bodyIndex.toString()}`,
          sections:
            PlanetScientificSectionsAssembler
              .build(
                target,
              ),
          preview:
            ScientificBodyPreviewAssembler
              .planet(
                target,
                previewSceneResolver.build(systemModel),
                previewSceneResolver.planetBodyId?.(systemModel, bodyIndex),
              ),
        }),
    });
  }
}

function orbitTopologyLabel(
  topology:
    PlanetarySystemOrbitTopology,
): string {

  switch (
    topology
  ) {
    case PlanetarySystemOrbitTopology.CIRCUMSTELLAR:
      return 'Circumestelar';
    case PlanetarySystemOrbitTopology.CIRCUMBINARY:
      return 'Circumbinaria';
  }
}
