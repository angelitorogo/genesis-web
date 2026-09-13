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
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  MoonScientificTargetResolver,
  type MoonScientificResolvedTarget,
} from '../../simulation/planetary/moon-scientific-target-resolver';

import {
  ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailModel,
} from '../genesis-archive/archive-discovery-detail.facade';

import {
  MoonScientificSectionsAssembler,
  type MoonScientificSectionsModel,
} from './moon-scientific-sections';

export const MoonScientificFicheResolutionKind =
  Object.freeze({
    LOCKED:
      'LOCKED',
    AVAILABLE:
      'AVAILABLE',
    NOT_FOUND:
      'NOT_FOUND',
  } as const);

export type MoonScientificFicheResolutionKind =
  typeof MoonScientificFicheResolutionKind[
    keyof typeof MoonScientificFicheResolutionKind
  ];

export interface MoonScientificCardModel {
  readonly title:
    string;

  readonly summary:
    string;

  readonly hostPlanetTitle:
    string;

  readonly hostSystemTitle:
    string;

  readonly moonOrdinal:
    number;

  readonly hostMoonCount:
    number;

  readonly accessLabel:
    string;

  readonly knowledgeLabel:
    string;

  readonly locatorLabel:
    string;

  readonly sections:
    MoonScientificSectionsModel;
}

export type MoonScientificFicheResolution =
  | {
      readonly kind:
        typeof MoonScientificFicheResolutionKind.LOCKED;

      readonly reason:
        string;
    }
  | {
      readonly kind:
        typeof MoonScientificFicheResolutionKind.NOT_FOUND;

      readonly reason:
        string;
    }
  | {
      readonly kind:
        typeof MoonScientificFicheResolutionKind.AVAILABLE;

      readonly card:
        MoonScientificCardModel;
    };

export interface MoonScientificTargetResolutionResolver {
  resolveDetailed(
    generationKey:
      UniverseGenerationKey,

    planetLocator:
      BodyLocator,

    moonIndex:
      bigint,
  ): MoonScientificResolvedTarget | null;
}

const DEFAULT_TARGET_RESOLVER:
  MoonScientificTargetResolutionResolver =
  Object.freeze({
    resolveDetailed(
      generationKey:
        UniverseGenerationKey,

      planetLocator:
        BodyLocator,

      moonIndex:
        bigint,
    ): MoonScientificResolvedTarget | null {
      return MoonScientificTargetResolver
        .resolveDetailed(
          generationKey,
          planetLocator,
          moonIndex,
        );
    },
  });

/**
 * Point-26.5 state-safe moon fiche assembler.
 *
 * The host stellar system must be CONFIRMED before any detailed lunar target is
 * resolved. The returned card contains presentation primitives only and never
 * exposes procedural seeds, generation keys or domain aggregates.
 */
export class MoonScientificCardAssembler {

  private constructor() {}

  static build(
    systemModel:
      ArchiveDiscoveryDetailModel,

    bodyIndex:
      bigint,

    moonIndex:
      bigint,

    resolver:
      MoonScientificTargetResolutionResolver =
        DEFAULT_TARGET_RESOLVER,
  ): MoonScientificFicheResolution {

    if (
      systemModel.locatorKind !==
        ArchiveDiscoveryLocatorKind.SYSTEM ||
      systemModel.stellarSystemCard ===
        null
    ) {
      return Object.freeze({
        kind:
          MoonScientificFicheResolutionKind.NOT_FOUND,
        reason:
          'La ruta lunar requiere un sistema estelar persistido.',
      });
    }

    if (
      bodyIndex <
        0n ||
      moonIndex <
        0n
    ) {
      return Object.freeze({
        kind:
          MoonScientificFicheResolutionKind.NOT_FOUND,
        reason:
          'Los índices planetario o lunar de la ruta no son válidos.',
      });
    }

    if (
      systemModel.discoveryState.code <
        DiscoveryState.CONFIRMED.code
    ) {
      return Object.freeze({
        kind:
          MoonScientificFicheResolutionKind.LOCKED,
        reason:
          'La investigación individual de lunas requiere que el sistema anfitrión esté confirmado.',
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

    const planetLocator =
      new BodyLocator(
        systemModel.galaxyIndex,
        systemModel.sectorKey,
        systemModel.galacticObjectIndex,
        bodyIndex,
      );

    const target =
      resolver.resolveDetailed(
        generationKey,
        planetLocator,
        moonIndex,
      );

    if (
      target ===
        null
    ) {
      return Object.freeze({
        kind:
          MoonScientificFicheResolutionKind.NOT_FOUND,
        reason:
          'La luna solicitada no dispone de caracterización científica individual en este planeta.',
      });
    }

    return Object.freeze({
      kind:
        MoonScientificFicheResolutionKind.AVAILABLE,
      card:
        Object.freeze({
          title:
            target.identity.designation,
          summary:
            `${target.identity.designation} es la luna ${target.identity.moonOrdinal} de ${target.identity.hostPlanetDesignation}, en el sistema ${target.identity.hostSystemDesignation}. La ficha reúne su caracterización física, orbital, de mareas, ambiental y de habitabilidad potencial.`,
          hostPlanetTitle:
            target.identity.hostPlanetDesignation,
          hostSystemTitle:
            target.identity.hostSystemDesignation,
          moonOrdinal:
            target.identity.moonOrdinal,
          hostMoonCount:
            target.identity.hostMoonCount,
          accessLabel:
            'Consulta científica habilitada',
          knowledgeLabel:
            'Caracterización científica detallada',
          locatorLabel:
            `G${systemModel.galaxyIndex.toString()} / S${systemModel.sectorKey.toString()} / O${systemModel.galacticObjectIndex.toString()} / B${bodyIndex.toString()} / M${moonIndex.toString()}`,
          sections:
            MoonScientificSectionsAssembler
              .build(
                target,
              ),
        }),
    });
  }
}
