import type { MinorMoonCharacterizationPRE3310 } from '../../domain/planetary/minor-moon-characterization-pre33-10';
import { ObservedHabitabilityFiche31Fe, type ObservedHabitabilityFiche31Fe as ObservedHabitabilityFiche31FeModel } from '../scientific/observed-habitability-fiche-31-f-e';
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
  PlanetScientificTargetResolver,
  type PlanetScientificResolvedTarget,
} from '../../simulation/planetary/planet-scientific-target-resolver';

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
    IDENTITY_ONLY: 'IDENTITY_ONLY',
  } as const);

export type MoonScientificFicheResolutionKind =
  typeof MoonScientificFicheResolutionKind[
    keyof typeof MoonScientificFicheResolutionKind
  ];

export interface MoonScientificCardModel {
  readonly observedHabitability?: ObservedHabitabilityFiche31FeModel;
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

  readonly preview:
    ScientificBodyPreviewModel;
}

export type MoonScientificFicheResolution =
  | { readonly kind: typeof MoonScientificFicheResolutionKind.IDENTITY_ONLY;
      readonly name: string; readonly host: string; readonly characterization: MinorMoonCharacterizationPRE3310; }
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

  resolveMinor?(key: UniverseGenerationKey, locator: BodyLocator, moonIndex: bigint):
    { readonly designation: string; readonly host: string; readonly characterization: MinorMoonCharacterizationPRE3310 } | null;

  resolveHostPlanetDetailed?(
    generationKey:
      UniverseGenerationKey,

    planetLocator:
      BodyLocator,
  ): PlanetScientificResolvedTarget | null;
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

    resolveHostPlanetDetailed(
      generationKey:
        UniverseGenerationKey,

      planetLocator:
        BodyLocator,
    ): PlanetScientificResolvedTarget | null {
      return PlanetScientificTargetResolver
        .resolveDetailed(
          generationKey,
          planetLocator,
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

    previewSceneResolver:
      ScientificBodyPreviewSceneResolver =
        DEFAULT_SCIENTIFIC_BODY_PREVIEW_SCENE_RESOLVER,
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

    // PRE-33.10: a CONFIRMED V3 system exposes the canonical identity of
    // every generated moon, even if its detailed physical model is absent.
    // Keep V1/V2 unchanged and ask for conditional minor characterization
    // only when the detailed resolver has found no physical moon.
    if (
      target === null &&
      generationKey.generatorVersion === GeneratorVersion.V3
    ) {
      const minor = resolver.resolveMinor?.(
        generationKey,
        planetLocator,
        moonIndex,
      ) ?? null;

      if (minor !== null) {
        return Object.freeze({
          kind: MoonScientificFicheResolutionKind.IDENTITY_ONLY,
          name: minor.designation,
          host: minor.host,
          characterization: minor.characterization,
        });
      }
    }

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

    const hostPlanetTarget =
      resolver
        .resolveHostPlanetDetailed
        ?.call(
          resolver,
          generationKey,
          planetLocator,
        ) ??
      null;

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
          observedHabitability: ObservedHabitabilityFiche31Fe.moon(
            target, systemModel.discoveryState, true,
            `G${systemModel.galaxyIndex}/S${systemModel.sectorKey}/O${systemModel.galacticObjectIndex}/B${bodyIndex}/M${moonIndex}`,
            observedMultiplicity(systemModel),
          ) ?? undefined,
          sections:
            MoonScientificSectionsAssembler
              .build(
                target,
              ),
          preview:
            ScientificBodyPreviewAssembler
              .moon(
                target,
                hostPlanetTarget,
                previewSceneResolver.build(systemModel),
                previewSceneResolver.planetBodyId?.(systemModel, bodyIndex),
              ),
        }),
    });
  }
}

function observedMultiplicity(model: ArchiveDiscoveryDetailModel): 'SINGLE' | 'BINARY' | 'TRIPLE' | 'UNKNOWN' {
  const name = model.stellarSystemCard?.render?.multiplicity?.name;
  return name === 'SINGLE' || name === 'BINARY' || name === 'TRIPLE' ? name : 'UNKNOWN';
}
