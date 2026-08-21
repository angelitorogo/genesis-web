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

import {
  createQuiescentNucleusRenderModel,
  QUIESCENT_NUCLEUS_VISUAL_FAMILIES,
  resolveQuiescentNucleusVisualFamily,
  type QuiescentNucleusRenderModel,
  type QuiescentNucleusVisualFamily,
} from './quiescent-nucleus-render-model';

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

export interface GalacticNucleusLaboratorySample {
  readonly index:
    number;

  readonly label:
    string;

  readonly galaxyIndex:
    bigint;

  readonly family:
    QuiescentNucleusVisualFamily;
}

export interface GalacticNucleusLaboratoryFrame {
  readonly caseDefinition:
    GalacticNucleusLaboratoryCase;

  readonly galaxy:
    Galaxy;

  readonly model:
    GalacticMapModel;

  readonly quiescentRenderModel:
    QuiescentNucleusRenderModel | null;

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

const QUIESCENT_SAMPLE_LABELS =
  Object.freeze([
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
  ] as const);

const QUIESCENT_SAMPLE_SCAN_LIMIT =
  4096n;

let cachedQuiescentSamples:
  readonly GalacticNucleusLaboratorySample[] | null =
  null;

export class GalacticNucleusLaboratoryFixtures {

  private constructor() {}

  static quiescentSamples():
    readonly GalacticNucleusLaboratorySample[] {

    if (
      cachedQuiescentSamples !==
        null
    ) {
      return cachedQuiescentSamples;
    }

    const samples:
      GalacticNucleusLaboratorySample[] =
      [];

    const seenFamilies =
      new Set<
        QuiescentNucleusVisualFamily
      >();

    for (
      let galaxyIndex =
        0n;
      galaxyIndex <
        QUIESCENT_SAMPLE_SCAN_LIMIT &&
      samples.length <
        QUIESCENT_NUCLEUS_VISUAL_FAMILIES
          .length;
      galaxyIndex +=
        1n
    ) {
      const galaxy =
        GalaxyGenerator
          .generate(
            GENERATION_KEY,
            galaxyIndex,
          );

      if (
        galaxy.nucleus
          ?.state !==
        GalacticNucleusState
          .QUIESCENT
      ) {
        continue;
      }

      const family =
        resolveQuiescentNucleusVisualFamily(
          galaxy,
        );

      if (
        seenFamilies
          .has(
            family,
          )
      ) {
        continue;
      }

      const index =
        samples.length;

      samples.push(
        Object.freeze({
          index,
          label:
            QUIESCENT_SAMPLE_LABELS[
              index
            ],
          galaxyIndex,
          family,
        }),
      );

      seenFamilies.add(
        family,
      );
    }

    if (
      samples.length !==
        QUIESCENT_NUCLEUS_VISUAL_FAMILIES
          .length
    ) {
      throw new RangeError(
        `Could not resolve ${QUIESCENT_NUCLEUS_VISUAL_FAMILIES.length} distinct quiescent nucleus visual families before G${QUIESCENT_SAMPLE_SCAN_LIMIT}.`,
      );
    }

    cachedQuiescentSamples =
      Object.freeze(
        samples,
      );

    return cachedQuiescentSamples;
  }

  static frame(
    caseId:
      GalacticNucleusLaboratoryCaseId,

    quiescentSampleIndex =
      0,
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

    const galaxyIndex =
      caseId ===
        GalacticNucleusLaboratoryCaseId
          .QUIESCENT
        ? this
            .quiescentSamples()[
              validateSampleIndex(
                quiescentSampleIndex,
              )
            ]
            .galaxyIndex
        : caseDefinition
            .galaxyIndex;

    const galaxy =
      GalaxyGenerator
        .generate(
          GENERATION_KEY,
          galaxyIndex,
        );

    if (
      galaxy.nucleus
        ?.state !==
      caseDefinition
        .expectedState
    ) {
      throw new RangeError(
        `Frozen galaxy ${galaxyIndex} no longer exposes ${caseDefinition.expectedState}.`,
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
      quiescentRenderModel:
        galaxy.nucleus
          ?.state ===
        GalacticNucleusState
          .QUIESCENT
          ? createQuiescentNucleusRenderModel(
              galaxy,
            )
          : null,
      activity:
        GalacticNuclearActivityProfileGenerator
          .generate(
            galaxy,
          ),
    });
  }
}

function validateSampleIndex(
  sampleIndex:
    number,
): number {
  if (
    !Number.isInteger(
      sampleIndex,
    ) ||
    sampleIndex <
      0 ||
    sampleIndex >=
      QUIESCENT_NUCLEUS_VISUAL_FAMILIES
        .length
  ) {
    throw new RangeError(
      `Unsupported quiescent nucleus sample index: ${sampleIndex}.`,
    );
  }

  return sampleIndex;
}
