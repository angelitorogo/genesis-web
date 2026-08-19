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
  GalacticNucleusState,
  type GalacticNucleusState as GalacticNucleusStateValue,
} from '../../../domain/universe/galactic-nucleus-state';

import {
  type Galaxy,
} from '../../../domain/universe/galaxy';

import {
  UniverseSeed,
} from '../../../domain/universe/universe-seed';

import {
  GalacticNuclearActivityProfileGenerator,
} from '../../../simulation/nuclear/galactic-nuclear-activity-profile-generator';

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

export const GalacticNucleusLaboratoryCaseId =
  Object.freeze({
    QUIESCENT:
      'NUCLEUS_QUIESCENT',

    AGN:
      'NUCLEUS_AGN',

    QUASAR:
      'NUCLEUS_QUASAR',
  } as const);

export type GalacticNucleusLaboratoryCaseId =
  typeof GalacticNucleusLaboratoryCaseId[
    keyof typeof GalacticNucleusLaboratoryCaseId
  ];

export interface GalacticNucleusLaboratoryCase {
  readonly id:
    GalacticNucleusLaboratoryCaseId;

  readonly label:
    string;

  readonly galaxyIndex:
    bigint;

  readonly expectedState:
    GalacticNucleusStateValue;

  readonly description:
    string;
}

export interface GalacticNucleusLaboratoryFrame {
  readonly caseDefinition:
    GalacticNucleusLaboratoryCase;

  readonly galaxy:
    Galaxy;

  readonly model:
    GalacticMapModel;

  readonly activity:
    ReturnType<
      typeof GalacticNuclearActivityProfileGenerator.generate
    >;
}

export const GALACTIC_NUCLEUS_LABORATORY_CASES:
  readonly GalacticNucleusLaboratoryCase[] =
  Object.freeze([
    Object.freeze({
      id:
        GalacticNucleusLaboratoryCaseId
          .QUIESCENT,
      label:
        'Núcleo quiescente',
      galaxyIndex:
        0n,
      expectedState:
        GalacticNucleusState
          .QUIESCENT,
      description:
        'Núcleo galáctico V1 sin episodio AGN/QUASAR activo.',
    }),
    Object.freeze({
      id:
        GalacticNucleusLaboratoryCaseId
          .AGN,
      label:
        'AGN',
      galaxyIndex:
        20n,
      expectedState:
        GalacticNucleusState
          .AGN,
      description:
        'Núcleo galáctico activo V1 asociado a un agujero negro supermasivo.',
    }),
    Object.freeze({
      id:
        GalacticNucleusLaboratoryCaseId
          .QUASAR,
      label:
        'QUASAR',
      galaxyIndex:
        331n,
      expectedState:
        GalacticNucleusState
          .QUASAR,
      description:
        'Episodio nuclear extremo V1 ya utilizado por la espectroscopía de Fase 13.',
    }),
  ]);

const GENERATION_KEY =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V1,
  );

export class GalacticNucleusLaboratoryFixtures {

  private constructor() {}

  static frame(
    caseId:
      GalacticNucleusLaboratoryCaseId,
  ): GalacticNucleusLaboratoryFrame {

    const caseDefinition =
      GALACTIC_NUCLEUS_LABORATORY_CASES
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
        `Unsupported galactic-nucleus laboratory case: ${String(caseId)}.`,
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
      galaxy.nucleus
        ?.state !==
      caseDefinition
        .expectedState
    ) {
      throw new RangeError(
        `Frozen galaxy ${caseDefinition.galaxyIndex} no longer exposes ${caseDefinition.expectedState}.`,
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
      activity:
        GalacticNuclearActivityProfileGenerator
          .generate(
            galaxy,
          ),
    });
  }
}
