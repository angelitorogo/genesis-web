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
  AGN_NUCLEUS_VISUAL_FAMILIES,
  createAgnNucleusRenderModel,
  resolveAgnNucleusVisualFamily,
  type AgnNucleusRenderModel,
  type AgnNucleusVisualFamily,
} from './agn-nucleus-render-model';

import {
  createQuiescentNucleusRenderModel,
  QUIESCENT_NUCLEUS_VISUAL_FAMILIES,
  resolveQuiescentNucleusVisualFamily,
  type QuiescentNucleusRenderModel,
  type QuiescentNucleusVisualFamily,
} from './quiescent-nucleus-render-model';

import {
  createQuasarNucleusRenderModel,
  QUASAR_NUCLEUS_VISUAL_FAMILIES,
  resolveQuasarNucleusVisualFamily,
  type QuasarNucleusRenderModel,
  type QuasarNucleusVisualFamily,
} from './quasar-nucleus-render-model';

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

export interface AgnNucleusLaboratorySample {
  readonly index:
    number;

  readonly label:
    string;

  readonly galaxyIndex:
    bigint;

  readonly family:
    AgnNucleusVisualFamily;
}

export interface QuasarNucleusLaboratorySample {
  readonly index:
    number;

  readonly label:
    string;

  readonly galaxyIndex:
    bigint;

  readonly family:
    QuasarNucleusVisualFamily;
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

  readonly agnRenderModel:
    AgnNucleusRenderModel | null;

  readonly quasarRenderModel:
    QuasarNucleusRenderModel | null;

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

const AGN_SAMPLE_LABELS =
  QUIESCENT_SAMPLE_LABELS;

const AGN_SAMPLE_SCAN_LIMIT =
  8192n;

const QUASAR_SAMPLE_LABELS =
  QUIESCENT_SAMPLE_LABELS;

const QUASAR_SAMPLE_SCAN_LIMIT =
  32768n;

let cachedQuiescentSamples:
  readonly GalacticNucleusLaboratorySample[] | null =
  null;

let cachedAgnSamples:
  readonly AgnNucleusLaboratorySample[] | null =
  null;

let cachedQuasarSamples:
  readonly QuasarNucleusLaboratorySample[] | null =
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

  static agnSamples():
    readonly AgnNucleusLaboratorySample[] {

    if (
      cachedAgnSamples !==
        null
    ) {
      return cachedAgnSamples;
    }

    const samples:
      AgnNucleusLaboratorySample[] =
      [];

    const seenFamilies =
      new Set<
        AgnNucleusVisualFamily
      >();

    const canonicalGalaxy =
      GalaxyGenerator.generate(
        GENERATION_KEY,
        20n,
      );

    const canonicalFamily =
      resolveAgnNucleusVisualFamily(
        canonicalGalaxy,
      );

    samples.push(
      Object.freeze({
        index:
          0,
        label:
          AGN_SAMPLE_LABELS[0],
        galaxyIndex:
          20n,
        family:
          canonicalFamily,
      }),
    );

    seenFamilies.add(
      canonicalFamily,
    );

    for (
      let galaxyIndex =
        0n;
      galaxyIndex <
        AGN_SAMPLE_SCAN_LIMIT &&
      samples.length <
        AGN_NUCLEUS_VISUAL_FAMILIES
          .length;
      galaxyIndex +=
        1n
    ) {
      if (
        galaxyIndex ===
          20n
      ) {
        continue;
      }

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
          .AGN
      ) {
        continue;
      }

      const family =
        resolveAgnNucleusVisualFamily(
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
            AGN_SAMPLE_LABELS[
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
        AGN_NUCLEUS_VISUAL_FAMILIES
          .length
    ) {
      throw new RangeError(
        `Could not resolve ${AGN_NUCLEUS_VISUAL_FAMILIES.length} distinct AGN nucleus visual families before G${AGN_SAMPLE_SCAN_LIMIT}.`,
      );
    }

    cachedAgnSamples =
      Object.freeze(
        samples,
      );

    return cachedAgnSamples;
  }

  static quasarSamples():
    readonly QuasarNucleusLaboratorySample[] {

    if (
      cachedQuasarSamples !==
        null
    ) {
      return cachedQuasarSamples;
    }

    const samples:
      QuasarNucleusLaboratorySample[] =
      [];

    const seenFamilies =
      new Set<
        QuasarNucleusVisualFamily
      >();

    const canonicalGalaxy =
      GalaxyGenerator.generate(
        GENERATION_KEY,
        331n,
      );

    const canonicalFamily =
      resolveQuasarNucleusVisualFamily(
        canonicalGalaxy,
      );

    samples.push(
      Object.freeze({
        index:
          0,
        label:
          QUASAR_SAMPLE_LABELS[0],
        galaxyIndex:
          331n,
        family:
          canonicalFamily,
      }),
    );

    seenFamilies.add(
      canonicalFamily,
    );

    for (
      let galaxyIndex =
        0n;
      galaxyIndex <
        QUASAR_SAMPLE_SCAN_LIMIT &&
      samples.length <
        QUASAR_NUCLEUS_VISUAL_FAMILIES
          .length;
      galaxyIndex +=
        1n
    ) {
      if (
        galaxyIndex ===
          331n
      ) {
        continue;
      }

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
          .QUASAR
      ) {
        continue;
      }

      const family =
        resolveQuasarNucleusVisualFamily(
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
            QUASAR_SAMPLE_LABELS[
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
        QUASAR_NUCLEUS_VISUAL_FAMILIES
          .length
    ) {
      throw new RangeError(
        `Could not resolve ${QUASAR_NUCLEUS_VISUAL_FAMILIES.length} distinct QUASAR nucleus visual families before G${QUASAR_SAMPLE_SCAN_LIMIT}.`,
      );
    }

    cachedQuasarSamples =
      Object.freeze(
        samples,
      );

    return cachedQuasarSamples;
  }

  static frame(
    caseId:
      GalacticNucleusLaboratoryCaseId,

    quiescentSampleIndex =
      0,

    agnSampleIndex =
      0,

    quasarSampleIndex =
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
              validateQuiescentSampleIndex(
                quiescentSampleIndex,
              )
            ]
            .galaxyIndex
        : caseId ===
            GalacticNucleusLaboratoryCaseId
              .AGN
          ? this
              .agnSamples()[
                validateAgnSampleIndex(
                  agnSampleIndex,
                )
              ]
              .galaxyIndex
          : caseId ===
              GalacticNucleusLaboratoryCaseId
                .QUASAR
            ? this
                .quasarSamples()[
                  validateQuasarSampleIndex(
                    quasarSampleIndex,
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
      agnRenderModel:
        galaxy.nucleus
          ?.state ===
        GalacticNucleusState
          .AGN
          ? createAgnNucleusRenderModel(
              galaxy,
            )
          : null,
      quasarRenderModel:
        galaxy.nucleus
          ?.state ===
        GalacticNucleusState
          .QUASAR
          ? createQuasarNucleusRenderModel(
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

function validateQuiescentSampleIndex(
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


function validateAgnSampleIndex(
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
      AGN_NUCLEUS_VISUAL_FAMILIES
        .length
  ) {
    throw new RangeError(
      `Unsupported AGN nucleus sample index: ${sampleIndex}.`,
    );
  }

  return sampleIndex;
}

function validateQuasarSampleIndex(
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
      QUASAR_NUCLEUS_VISUAL_FAMILIES
        .length
  ) {
    throw new RangeError(
      `Unsupported QUASAR nucleus sample index: ${sampleIndex}.`,
    );
  }

  return sampleIndex;
}
