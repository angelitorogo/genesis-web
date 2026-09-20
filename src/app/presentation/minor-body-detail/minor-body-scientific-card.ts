import { resolveV2MinorBodySource, type V2MinorBodySource } from './minor-body-v2-source';
import { ScientificBodyPreviewKind } from '../scientific/scientific-body-preview';
import { type RelevantCapturedExtrasolarObject } from '../../domain/planetary/relevant-captured-extrasolar-object';
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
  ScientificBodyPreviewAssembler,
  DEFAULT_SCIENTIFIC_BODY_PREVIEW_SCENE_RESOLVER,
  type ScientificBodyPreviewModel,
  type ScientificBodyPreviewSceneResolver,
} from '../scientific/scientific-body-preview';

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

  readonly preview:
    ScientificBodyPreviewModel;
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
 * Point-26.8 state-safe asteroid/comet/TNO scientific fiche assembler.
 *
 * Host-system confirmation remains the outer scientific-access boundary used by
 * the existing body fiches. The individual target itself is addressed only by
 * its frozen point-22.10 `(kind, proceduralId)` identity; point 26.8 adds only
 * knowledge-safe projections of the already-frozen phase-23 dynamics. The card
 * never returns that 128-bit id, seeds, generation keys or domain aggregates to
 * presentation.
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

    previewSceneResolver:
      ScientificBodyPreviewSceneResolver =
        DEFAULT_SCIENTIFIC_BODY_PREVIEW_SCENE_RESOLVER,
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

    // V2 public identities live in A/B/C private physical sources. Never
    // invoke a V1 generator with the public V2 key or use a V1 preview scene.
    const v2Source = systemModel.generatorVersionCode === GeneratorVersion.V2.code &&
      resolver === DEFAULT_TARGET_RESOLVER
      ? resolveV2MinorBodySource(systemModel, generationKey, systemLocator,
          targetKind, proceduralId)
      : null;
    if (systemModel.generatorVersionCode === GeneratorVersion.V2.code &&
        resolver === DEFAULT_TARGET_RESOLVER && v2Source === null) {
      return Object.freeze({
        kind: MinorBodyScientificFicheResolutionKind.NOT_FOUND,
        reason: 'El cuerpo no existe en los catálogos físicos de este sistema V2.',
      });
    }
    if (targetKind === MinorBodyScientificTargetKind.CAPTURED_EXTRASOLAR_OBJECT) {
      return v2Source?.captured !== null && v2Source?.captured !== undefined
        ? capturedCard(systemModel, v2Source, v2Source.captured, proceduralId)
        : Object.freeze({
            kind: MinorBodyScientificFicheResolutionKind.NOT_FOUND,
            reason: 'No se ha encontrado este objeto extrasolar capturado en el sistema.',
          });
    }
    const target = v2Source !== null
      ? MinorBodyScientificTargetResolver.resolveDetailed(
          v2Source.host.internalGenerationKey, systemLocator, targetKind, proceduralId,
          {
            hostSystemDesignation: `${systemModel.stellarSystemCard.title} · estrella ${v2Source.host.label}`,
            planetarySystem: v2Source.host.planetarySystem!,
            asteroidSystem: v2Source.host.asteroidBelts!,
          },
        )
      : resolver.resolveDetailed(generationKey, systemLocator, targetKind, proceduralId);

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
            : targetKind ===
              MinorBodyScientificTargetKind.COMET
              ? 'La identidad solicitada no corresponde a un cometa relevante de este sistema.'
              : 'La identidad solicitada no corresponde a un objeto transneptuniano relevante de este sistema.',
      });
    }

    const kindLabel =
      target.identity.kind ===
        MinorBodyScientificTargetKind.ASTEROID
        ? 'Asteroide'
        : target.identity.kind ===
          MinorBodyScientificTargetKind.COMET
          ? 'Cometa'
          : 'Objeto transneptuniano';

    return Object.freeze({
      kind:
        MinorBodyScientificFicheResolutionKind.AVAILABLE,
      card:
        Object.freeze({
          title:
            target.identity.designation,
          kindLabel,
          summary:
            `${target.identity.designation} es un ${kindLabel.toLowerCase()} individual del sistema ${target.identity.hostSystemDesignation}. La ficha reúne su caracterización física, orbital, dinámica y de riesgo disponible.`,
          hostSystemTitle:
            target.identity.hostSystemDesignation,
          accessLabel:
            'Caracterización detallada habilitada',
          knowledgeLabel:
            'Caracterización física y dinámica disponible',
          locatorLabel:
            `G${systemModel.galaxyIndex.toString()} / S${systemModel.sectorKey.toString()} / O${systemModel.galacticObjectIndex.toString()} / ${target.identity.designation}`,
          sections:
            MinorBodyScientificSectionsAssembler
              .build(
                target,
              ),
          preview:
            ScientificBodyPreviewAssembler
              .minorBody(
                target,
                proceduralId,
                v2Source?.scene ?? previewSceneResolver.build(systemModel),
              ),
        }),
    });
  }
}

/** Real generated captured object; no synthetic scientific risk or fabricated data. */
function capturedCard(
  model: ArchiveDiscoveryDetailModel,
  source: V2MinorBodySource,
  object: RelevantCapturedExtrasolarObject,
  id: string,
): MinorBodyScientificFicheResolution {
  const body = source.scene.minorBodies.find(candidate =>
    candidate.minorBodyKind.name === 'CAPTURED_EXTRASOLAR_OBJECT' &&
    candidate.id.endsWith(id));
  if (body === undefined) throw new Error('Captured scientific card lacks its real scene body.');
  const p = object.properties;
  const orbit = object.orbit;
  const format = (value: number) => new Intl.NumberFormat('es-ES',
    { maximumFractionDigits: 4 }).format(value);
  const field = (label: string, value: string) => Object.freeze({
    label, value, note: null as string | null,
  });
  const designation = object.localDesignation;
  const hostName = `${model.stellarSystemCard!.title} · estrella ${source.host.label}`;
  return Object.freeze({
    kind: MinorBodyScientificFicheResolutionKind.AVAILABLE,
    card: Object.freeze({
      title: designation,
      kindLabel: 'Objeto extrasolar capturado',
      summary: `${designation} es un cuerpo de origen extrasolar gravitacionalmente ligado a ${hostName}. La ficha presenta sus propiedades y elementos orbitales reales; no se infiere un riesgo de impacto sin cálculo científico.`,
      hostSystemTitle: hostName,
      accessLabel: 'Caracterización detallada habilitada',
      knowledgeLabel: 'Propiedades físicas y órbita generadas disponibles',
      locatorLabel: `G${model.galaxyIndex} / S${model.sectorKey} / O${model.galacticObjectIndex} / ${designation}`,
      sections: Object.freeze({
        badges: Object.freeze(['Origen extrasolar', 'Captura gravitatoria', 'Órbita ligada']),
        sections: Object.freeze([
          Object.freeze({
            id: 'physical', eyebrow: 'CARACTERIZACIÓN', title: 'Propiedades físicas',
            summary: 'Propiedades materiales calculadas por el generador de objetos capturados.',
            fields: Object.freeze([
              field('Diámetro', `${format(p.diameterKilometers)} km`),
              field('Composición', p.compositionRegime),
              field('Mecanismo de captura', p.captureRegime),
              field('Densidad', `${format(p.bulkDensityGramsPerCubicCentimeter)} g/cm³`),
              field('Fracción volátil', `${format(p.volatileFraction01 * 100)} %`),
              field('Albedo geométrico', format(p.geometricAlbedo)),
            ]),
          }),
          Object.freeze({
            id: 'orbit', eyebrow: 'DINÁMICA', title: 'Órbita ligada',
            summary: 'Elementos orbitales físicos; la cadencia de render puede acelerarse visualmente.',
            fields: Object.freeze([
              field('Semieje mayor', `${format(orbit.semiMajorAxisAu)} UA`),
              field('Excentricidad', format(orbit.eccentricity)),
              field('Inclinación', `${format(orbit.inclinationDegrees)}°`),
              field('Periastro', `${format(orbit.periapsisAu)} UA`),
              field('Apoastro', `${format(orbit.apoapsisAu)} UA`),
              field('Periodo físico', `${format(orbit.periodYears)} años`),
            ]),
          }),
        ]),
      }),
      preview: Object.freeze({
        kind: ScientificBodyPreviewKind.CAPTURED_EXTRASOLAR_OBJECT,
        accessibleLabel: `${designation}. Representación tridimensional del cuerpo capturado presente en SystemScene.`,
        title: designation,
        primary: Object.freeze({
          title: body.title,
          colorHex: body.colorHex,
          sourceRadiusScene: body.radiusScene,
        }),
      }),
    }),
  });
}
