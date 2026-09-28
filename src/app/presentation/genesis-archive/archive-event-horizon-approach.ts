import {
  GalacticObjectScientificSubject,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

import {
  GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  IntermediateMassBlackHoleGenerator,
} from '../../simulation/galactic-object/intermediate-mass-black-hole-generator';

import {
  GalacticSupermassiveBlackHoleGenerator,
} from '../../simulation/nuclear/galactic-supermassive-black-hole-generator';

import {
  ArchiveGalacticObjectKnowledgeLevel,
  type ArchiveGalacticObjectCardModel,
} from './archive-galactic-object-card';

export interface ArchiveEventHorizonApproachModel {
  readonly title:
    'Aproximación externa al horizonte';

  readonly buttonLabel:
    'SIMULAR APROXIMACIÓN EXTERNA';

  readonly knowledgeLevel:
    'CATALOGUED' | 'CONFIRMED';

  readonly knowledgeDisclosure:
    string;

  readonly scientificScope:
    string;

  readonly schwarzschildRadiusKm:
    number;

  /**
   * Presentation permission only. `true` means the already-disclosed nuclear
   * classification entails an accreting active nucleus. It is NOT inferred
   * for an IMBH that has no accretion state in the current physical model.
   */
  readonly hasAccretionDisk:
    boolean;
}

/**
 * 28.2c — presentation eligibility/disclosure only.
 *
 * This projection is deliberately downstream from the archive scientific card:
 * if the public card has not disclosed a compact-object subject yet, this
 * feature cannot infer one from Ground Truth.
 *
 * Eligible public subjects:
 * - INTERMEDIATE_MASS_BLACK_HOLE
 * - ACTIVE_GALACTIC_NUCLEUS, only if its already-existing central SMBH resolves
 *
 * A supernova remnant or the reserved EXTREME_OBJECT complement is not enough
 * evidence of an event horizon.
 */
export class ArchiveEventHorizonApproachAssembler {
  private constructor() {}

  static build(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,

    card:
      ArchiveGalacticObjectCardModel | null,
  ): ArchiveEventHorizonApproachModel | null {
    if (
      card === null ||
      (
        card.knowledgeLevel !==
          ArchiveGalacticObjectKnowledgeLevel.CATALOGUED &&
        card.knowledgeLevel !==
          ArchiveGalacticObjectKnowledgeLevel.CONFIRMED
      )
    ) {
      return null;
    }

    const schwarzschildRadiusKm =
      resolveSchwarzschildRadiusKm(
        generationKey,
        locator,
        card.scientificSubject,
      );

    if (
      schwarzschildRadiusKm === null ||
      !Number.isFinite(
        schwarzschildRadiusKm,
      ) ||
      schwarzschildRadiusKm <= 0
    ) {
      return null;
    }

    const confirmed =
      card.knowledgeLevel ===
        ArchiveGalacticObjectKnowledgeLevel.CONFIRMED;

    return Object.freeze({
      title:
        'Aproximación externa al horizonte',

      buttonLabel:
        'SIMULAR APROXIMACIÓN EXTERNA',

      knowledgeLevel:
        card.knowledgeLevel,

      knowledgeDisclosure:
        confirmed
          ? 'La clasificación compacta está confirmada. La simulación reutiliza el radio de Schwarzschild de referencia del modelo científico; no representa una observación directa del horizonte.'
          : 'La caracterización catalogada permite usar el radio de Schwarzschild de referencia del modelo. La clasificación aún puede requerir confirmación independiente y la simulación no constituye una observación del horizonte.',

      scientificScope:
        'Dominio estrictamente exterior: r > Rs. Referencia Schwarzschild no rotante. No se modelan el interior, el cruce del horizonte, el giro de Kerr ni observables causalmente desconectados del exterior.',

      schwarzschildRadiusKm,

      hasAccretionDisk:
        card.scientificSubject ===
          GalacticObjectScientificSubject
            .ACTIVE_GALACTIC_NUCLEUS,
    });
  }
}

function resolveSchwarzschildRadiusKm(
  generationKey:
    UniverseGenerationKey,

  locator:
    GalacticObjectLocator,

  subject:
    GalacticObjectScientificSubject | null,
): number | null {
  if (
    subject ===
      GalacticObjectScientificSubject
        .INTERMEDIATE_MASS_BLACK_HOLE
  ) {
    return IntermediateMassBlackHoleGenerator
      .generate(
        generationKey,
        locator,
      )
      ?.physicalProperties
      .schwarzschildRadiusKm ??
      null;
  }

  if (
    subject ===
      GalacticObjectScientificSubject
        .ACTIVE_GALACTIC_NUCLEUS
  ) {
    return GalacticSupermassiveBlackHoleGenerator
      .generateForLocator(
        generationKey,
        locator,
      )
      ?.physicalProfile
      .schwarzschildRadiusKm ??
      null;
  }

  return null;
}
