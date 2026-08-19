import {
  DiscoveryState,
} from '../../../domain/discovery/discovery-state';

import {
  GeneratorVersion,
} from '../../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  type Galaxy,
} from '../../../domain/universe/galaxy';

import {
  GalaxyType,
} from '../../../domain/universe/galaxy-type';

import {
  UniverseSeed,
} from '../../../domain/universe/universe-seed';

import {
  ExternalGalaxyPreliminaryInformationGenerator,
} from '../../../simulation/observation/galaxy/external-galaxy-preliminary-information-generator';

import {
  GalaxyGenerator,
} from '../../../simulation/universe/galaxy-generator';

import {
  GalaxyVisualStructureGenerator,
} from '../../../simulation/universe/galaxy-visual-structure-generator';

import {
  GalacticMapModel,
} from '../../galaxy-map/galactic-map-model';

export const GalaxyLaboratoryCaseId =
  Object.freeze({
    SPIRAL:
      'SPIRAL',

    BARRED_SPIRAL:
      'BARRED_SPIRAL',

    ELLIPTICAL:
      'ELLIPTICAL',

    DWARF:
      'DWARF',

    IRREGULAR:
      'IRREGULAR',
  } as const);

export type GalaxyLaboratoryCaseId =
  typeof GalaxyLaboratoryCaseId[
    keyof typeof GalaxyLaboratoryCaseId
  ];

export interface GalaxyLaboratoryCase {
  readonly id:
    GalaxyLaboratoryCaseId;

  readonly label:
    string;

  readonly galaxyIndex:
    bigint;

  readonly expectedType:
    GalaxyType;

  readonly description:
    string;
}

/**
 * Frozen V1 representatives already exercised by the galactic-map visual
 * regression suite for the canonical GENESIS validation seed.
 *
 * The laboratory never forces a morphology. It generates each real galaxy by
 * index and asserts that the frozen representative still belongs to the
 * expected canonical GalaxyType before exposing the production map renderer.
 */
export const GALAXY_LABORATORY_CASES:
  readonly GalaxyLaboratoryCase[] =
  Object.freeze([
    Object.freeze({
      id:
        GalaxyLaboratoryCaseId
          .SPIRAL,
      label:
        'Espiral',
      galaxyIndex:
        3n,
      expectedType:
        GalaxyType.SPIRAL,
      description:
        'Disco espiral V1 con estructura de brazos coherente.',
    }),
    Object.freeze({
      id:
        GalaxyLaboratoryCaseId
          .BARRED_SPIRAL,
      label:
        'Espiral barrada',
      galaxyIndex:
        1n,
      expectedType:
        GalaxyType.BARRED_SPIRAL,
      description:
        'Disco espiral V1 con barra central y brazos asociados.',
    }),
    Object.freeze({
      id:
        GalaxyLaboratoryCaseId
          .ELLIPTICAL,
      label:
        'Elíptica',
      galaxyIndex:
        0n,
      expectedType:
        GalaxyType.ELLIPTICAL,
      description:
        'Distribución esferoidal V1 sin estructura espiral.',
    }),
    Object.freeze({
      id:
        GalaxyLaboratoryCaseId
          .DWARF,
      label:
        'Enana',
      galaxyIndex:
        4n,
      expectedType:
        GalaxyType.DWARF,
      description:
        'Morfología V1 de menor escala con cuerpo estelar continuo.',
    }),
    Object.freeze({
      id:
        GalaxyLaboratoryCaseId
          .IRREGULAR,
      label:
        'Irregular',
      galaxyIndex:
        10n,
      expectedType:
        GalaxyType.IRREGULAR,
      description:
        'Cuerpo estelar V1 asimétrico y sin simetría espiral regular.',
    }),
  ]);

export interface GalaxyLaboratoryFrame {
  readonly caseDefinition:
    GalaxyLaboratoryCase;

  readonly galaxy:
    Galaxy;

  readonly model:
    GalacticMapModel;
}

const GENERATION_KEY =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V1,
  );

export class GalaxyLaboratoryFixtures {

  private constructor() {}

  static frame(
    caseId:
      GalaxyLaboratoryCaseId,
  ): GalaxyLaboratoryFrame {

    const caseDefinition =
      GALAXY_LABORATORY_CASES
        .find(
          candidate =>
            candidate.id ===
            caseId,
        );

    if (
      caseDefinition ===
        undefined
    ) {
      throw new RangeError(
        `Unsupported galaxy laboratory case: ${String(caseId)}.`,
      );
    }

    const galaxy =
      GalaxyGenerator
        .generate(
          GENERATION_KEY,
          caseDefinition
            .galaxyIndex,
        );

    if (
      galaxy.type !==
        caseDefinition
          .expectedType
    ) {
      throw new RangeError(
        `Frozen galaxy laboratory vector ${caseDefinition.galaxyIndex} changed morphology from ${caseDefinition.expectedType.name} to ${galaxy.type.name}.`,
      );
    }

    const model =
      new GalacticMapModel(
        GENERATION_KEY,
        galaxy.index,
        ExternalGalaxyPreliminaryInformationGenerator
          .generate(
            GENERATION_KEY,
            galaxy.index,
            DiscoveryState
              .DISCOVERED,
          ),
        GalaxyVisualStructureGenerator
          .generate(
            galaxy,
          ),
        galaxy.type,
      );

    return Object.freeze({
      caseDefinition,
      galaxy,
      model,
    });
  }
}
