import { moonVida9aAudit } from '../scientific/vida9a-physical-biology-audit-adapter';
import type { Vida9aAuditResult } from '../scientific/vida9a-physical-biology-coherence';
import { Vida2PhysicalInput } from '../../simulation/life/life-plausibility-physical-adapter-vida2';
import type { Vida2WorldAssessment } from '../../simulation/life/life-plausibility-engine-vida2';
import { ProceduralMicrobialLifeVIDA3 } from '../../simulation/life/procedural-microbial-life-vida3';
import { ProceduralEcologyVIDA4 } from '../../simulation/life/procedural-ecology-vida4';
import { Vida9BiologyExploration } from '../../simulation/life/vida9-biology-exploration';
import type { Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';
import { Vida8TechnologicalColonization } from '../../simulation/life/vida8-technological-colonization';
import { Vida8LocalOriginDiscovery } from '../../simulation/life/vida8-local-origin-discovery';
import type { Vida8ColonizationSnapshot } from '../../domain/life/vida8-technological-colonization';
import { Vida6EcosystemsSpecies } from '../../simulation/life/vida6-ecosystems-species';
import { Vida7IntelligenceCivilizations } from '../../simulation/life/vida7-intelligence-civilizations';
import type { Vida7IntelligenceCivilizationSnapshot } from '../../domain/life/vida7-intelligence-civilizations';
import type { Vida6EcosystemSnapshot } from '../../domain/life/vida6-ecosystems-species';
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
  /** Ground Truth privado; ninguna de estas dos proyecciones es evidencia observada. */
  readonly vida2?: Vida2WorldAssessment;
  readonly privateEcosystemVIDA6?: Vida6EcosystemSnapshot;
  /** Ground Truth privado. En luna sera NON_PLANET, sin habitantes inteligentes. */
  readonly privateCivilizationVIDA7?: Vida7IntelligenceCivilizationSnapshot;
  /** Private technology, never indigenous lunar civilization. */
  readonly privateColonizationVIDA8?: Vida8ColonizationSnapshot;
  /** VIDA.9: fully revealed only because parent system is CONFIRMED. */
  readonly confirmedBiologyVIDA9?: Vida9BiologyRecord;
  readonly coherenceAuditVIDA9a?: Vida9aAuditResult;
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

    const vida2 = systemModel.generatorVersionCode === 3 ? Vida2PhysicalInput.moon(target) : undefined;
    const micro = vida2 ? ProceduralMicrobialLifeVIDA3.evaluate({
      universeSeed:systemModel.universeSeed,generatorVersionCode:3,kind:'MOON',
      galaxyIndex:systemModel.galaxyIndex.toString(),sectorKey:systemModel.sectorKey.toString(),
      galacticObjectIndex:systemModel.galacticObjectIndex.toString(),
      bodyIndex:bodyIndex.toString(),moonIndex:moonIndex.toString(),
    },vida2) : undefined;
    const ecology = micro ? ProceduralEcologyVIDA4.evaluate(micro) : undefined;
    const privateEcosystemVIDA6 = micro && ecology
      ? Vida6EcosystemsSpecies.evaluate(micro,ecology) : undefined;
    const privateCivilizationVIDA7 = privateEcosystemVIDA6
      ? Vida7IntelligenceCivilizations.evaluate(privateEcosystemVIDA6) : undefined;
    const privateColonizationVIDA8 = privateEcosystemVIDA6 && privateCivilizationVIDA7 && vida2
      ? Vida8TechnologicalColonization.evaluate({ecosystem:privateEcosystemVIDA6,
          nativeCivilization:privateCivilizationVIDA7,physical:vida2,
          solidSurface:true}, resolver===DEFAULT_TARGET_RESOLVER && hostPlanetTarget
          ? Vida8LocalOriginDiscovery.findInSystem({
              universeSeed:systemModel.universeSeed,generatorVersionCode:3,
              galaxyIndex:systemModel.galaxyIndex.toString(),
              sectorKey:systemModel.sectorKey.toString(),
              galacticObjectIndex:systemModel.galacticObjectIndex.toString(),
            },hostPlanetTarget.identity.hostPlanetCount,(index)=>
              PlanetScientificTargetResolver.resolveDetailed(generationKey,
                new BodyLocator(systemModel.galaxyIndex,systemModel.sectorKey,
                  systemModel.galacticObjectIndex,index)),true) : [])
      : undefined;

    const confirmedBiologyVIDA9 = privateEcosystemVIDA6 && privateCivilizationVIDA7 && privateColonizationVIDA8
      ? Vida9BiologyExploration.evaluate(privateEcosystemVIDA6,privateCivilizationVIDA7,privateColonizationVIDA8)
      : undefined;
    return Object.freeze({
      kind:
        MoonScientificFicheResolutionKind.AVAILABLE,
      card:
        Object.freeze({
          vida2,
          privateEcosystemVIDA6,
          privateCivilizationVIDA7,
          privateColonizationVIDA8,
          confirmedBiologyVIDA9,
          coherenceAuditVIDA9a: confirmedBiologyVIDA9 ? moonVida9aAudit(target,confirmedBiologyVIDA9) : undefined,
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
