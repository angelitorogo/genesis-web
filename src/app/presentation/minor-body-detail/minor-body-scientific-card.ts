import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  MinorBodyScientificTargetKind,
  MinorBodyScientificTargetResolver,
  type MinorBodyScientificResolvedTarget,
} from '../../simulation/planetary/minor-body-scientific-target-resolver';

import {
  ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailModel,
} from '../genesis-archive/archive-discovery-detail.facade';

import {
  MinorBodyScientificSectionsAssembler,
  type MinorBodyScientificSectionsModel,
} from './minor-body-scientific-sections';

export const MinorBodyScientificFicheResolutionKind =
  Object.freeze({
    LOCKED:
      'LOCKED',
    AVAILABLE:
      'AVAILABLE',
    NOT_FOUND:
      'NOT_FOUND',
  } as const);

export type MinorBodyScientificFicheResolutionKind =
  typeof MinorBodyScientificFicheResolutionKind[
    keyof typeof MinorBodyScientificFicheResolutionKind
  ];

export interface MinorBodyScientificCardModel {
  readonly title:
    string;

  readonly kindLabel:
    string;

  readonly summary:
    string;

  readonly hostSystemTitle:
    string;

  readonly accessLabel:
    string;

  readonly knowledgeLabel:
    string;

  readonly locatorLabel:
    string;

  readonly sections:
    MinorBodyScientificSectionsModel;
}

export type MinorBodyScientificFicheResolution =
  | {
      readonly kind:
        typeof MinorBodyScientificFicheResolutionKind.LOCKED;

      readonly reason:
        string;
    }
  | {
      readonly kind:
        typeof MinorBodyScientificFicheResolutionKind.NOT_FOUND;

      readonly reason:
        string;
    }
  | {
      readonly kind:
        typeof MinorBodyScientificFicheResolutionKind.AVAILABLE;

      readonly card:
        MinorBodyScientificCardModel;
    };

export interface MinorBodyScientificTargetResolutionResolver {
  resolveDetailed(
    generationKey:
      UniverseGenerationKey,

    systemLocator:
      SystemLocator,

    kind:
      MinorBodyScientificTargetKind,

    proceduralId:
      string,
  ): MinorBodyScientificResolvedTarget | null;
}

const DEFAULT_TARGET_RESOLVER:
  MinorBodyScientificTargetResolutionResolver =
  Object.freeze({
    resolveDetailed(
      generationKey:
        UniverseGenerationKey,

      systemLocator:
        SystemLocator,

      kind:
        MinorBodyScientificTargetKind,

      proceduralId:
        string,
    ): MinorBodyScientificResolvedTarget | null {
      return MinorBodyScientificTargetResolver
        .resolveDetailed(
          generationKey,
          systemLocator,
          kind,
          proceduralId,
        );
    },
  });

/**
 * Point-26.6 state-safe asteroid/comet fiche assembler.
 *
 * Host-system confirmation remains the outer scientific-access boundary used by
 * the existing body fiches. The individual target itself is addressed only by
 * its frozen point-22.10 `(kind, proceduralId)` identity; the card never returns
 * that 128-bit id, seeds, generation keys or domain aggregates to presentation.
 */
export class MinorBodyScientificCardAssembler {

  private constructor() {}

  static build(
    systemModel:
      ArchiveDiscoveryDetailModel,

    targetKind:
      MinorBodyScientificTargetKind,

    proceduralId:
      string,

    resolver:
      MinorBodyScientificTargetResolutionResolver =
        DEFAULT_TARGET_RESOLVER,
  ): MinorBodyScientificFicheResolution {

    if (
      systemModel.locatorKind !==
        ArchiveDiscoveryLocatorKind.SYSTEM ||
      systemModel.stellarSystemCard ===
        null
    ) {
      return Object.freeze({
        kind:
          MinorBodyScientificFicheResolutionKind.NOT_FOUND,
        reason:
          'La ruta del cuerpo menor requiere un sistema estelar persistido.',
      });
    }

    if (
      systemModel.discoveryState.code <
        DiscoveryState.CONFIRMED.code
    ) {
      return Object.freeze({
        kind:
          MinorBodyScientificFicheResolutionKind.LOCKED,
        reason:
          'La caracterización individual de cuerpos requiere que el sistema anfitrión esté CONFIRMED.',
      });
    }

    if (
      !/^[0-9A-F]{32}$/.test(
        proceduralId,
      )
    ) {
      return Object.freeze({
        kind:
          MinorBodyScientificFicheResolutionKind.NOT_FOUND,
        reason:
          'La identidad individual del cuerpo menor no es válida.',
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

    const systemLocator =
      new SystemLocator(
        systemModel.galaxyIndex,
        systemModel.sectorKey,
        systemModel.galacticObjectIndex,
      );

    const target =
      resolver.resolveDetailed(
        generationKey,
        systemLocator,
        targetKind,
        proceduralId,
      );

    if (
      target ===
        null
    ) {
      return Object.freeze({
        kind:
          MinorBodyScientificFicheResolutionKind.NOT_FOUND,
        reason:
          targetKind ===
            MinorBodyScientificTargetKind.ASTEROID
            ? 'La identidad solicitada no corresponde a un asteroide relevante de este sistema.'
            : 'La identidad solicitada no corresponde a un cometa relevante de este sistema.',
      });
    }

    const kindLabel =
      target.identity.kind ===
        MinorBodyScientificTargetKind.ASTEROID
        ? 'Asteroide'
        : 'Cometa';

    return Object.freeze({
      kind:
        MinorBodyScientificFicheResolutionKind.AVAILABLE,
      card:
        Object.freeze({
          title:
            target.identity.designation,
          kindLabel,
          summary:
            `${target.identity.designation} es un ${kindLabel.toLowerCase()} individual del sistema ${target.identity.hostSystemDesignation}. La ficha reúne su caracterización física y orbital disponible.`,
          hostSystemTitle:
            target.identity.hostSystemDesignation,
          accessLabel:
            'Caracterización detallada habilitada',
          knowledgeLabel:
            'Cuerpo menor individual caracterizado',
          locatorLabel:
            `G${systemModel.galaxyIndex.toString()} / S${systemModel.sectorKey.toString()} / O${systemModel.galacticObjectIndex.toString()} / ${target.identity.designation}`,
          sections:
            MinorBodyScientificSectionsAssembler
              .build(
                target,
              ),
        }),
    });
  }
}
