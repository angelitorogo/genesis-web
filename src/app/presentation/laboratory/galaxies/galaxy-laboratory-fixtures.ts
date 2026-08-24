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

export const GalaxyLaboratoryFamilyId =
  Object.freeze({
    A:
      'A',
    B:
      'B',
    C:
      'C',
    D:
      'D',
    E:
      'E',
    F:
      'F',
    G:
      'G',
    H:
      'H',
  } as const);

export type GalaxyLaboratoryFamilyId =
  typeof GalaxyLaboratoryFamilyId[
    keyof typeof GalaxyLaboratoryFamilyId
  ];

export const GALAXY_LABORATORY_FAMILY_IDS:
  readonly GalaxyLaboratoryFamilyId[] =
  Object.freeze([
    GalaxyLaboratoryFamilyId.A,
    GalaxyLaboratoryFamilyId.B,
    GalaxyLaboratoryFamilyId.C,
    GalaxyLaboratoryFamilyId.D,
    GalaxyLaboratoryFamilyId.E,
    GalaxyLaboratoryFamilyId.F,
    GalaxyLaboratoryFamilyId.G,
    GalaxyLaboratoryFamilyId.H,
  ]);

export interface GalaxyLaboratoryCase {
  readonly id:
    GalaxyLaboratoryCaseId;

  readonly label:
    string;

  /**
   * Historical V1 validation vector. It remains family A whenever it still
   * belongs to the expected morphology.
   */
  readonly galaxyIndex:
    bigint;

  readonly expectedType:
    GalaxyType;

  readonly description:
    string;
}

export interface GalaxyLaboratoryFamily {
  readonly id:
    GalaxyLaboratoryFamilyId;

  readonly label:
    string;

  readonly galaxyIndex:
    bigint;
}

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
        'Disco espiral procedural con 3–8 brazos, bulbo cálido, poblaciones estelares y gas 3D.',
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

  readonly family:
    GalaxyLaboratoryFamily;

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

const familyCache =
  new Map<
    GalaxyLaboratoryCaseId,
    readonly GalaxyLaboratoryFamily[]
  >();

export class GalaxyLaboratoryFixtures {

  private constructor() {}

  static families(
    caseId:
      GalaxyLaboratoryCaseId,
  ): readonly GalaxyLaboratoryFamily[] {

    const cached =
      familyCache.get(
        caseId,
      );

    if (
      cached !==
      undefined
    ) {
      return cached;
    }

    const caseDefinition =
      caseById(
        caseId,
      );

    const indices =
      discoverFamilyIndices(
        caseDefinition,
      );

    const families =
      Object.freeze(
        GALAXY_LABORATORY_FAMILY_IDS
          .map(
            (
              familyId,
              index,
            ) =>
              Object.freeze({
                id:
                  familyId,
                label:
                  `Familia ${familyId}`,
                galaxyIndex:
                  indices[
                    index
                  ],
              }),
          ),
      );

    familyCache.set(
      caseId,
      families,
    );

    return families;
  }

  static frame(
    caseId:
      GalaxyLaboratoryCaseId,

    familyId:
      GalaxyLaboratoryFamilyId =
        GalaxyLaboratoryFamilyId.A,
  ): GalaxyLaboratoryFrame {

    const caseDefinition =
      caseById(
        caseId,
      );

    const family =
      this.families(
        caseId,
      )
      .find(
        candidate =>
          candidate.id ===
          familyId,
      );

    if (
      family ===
      undefined
    ) {
      throw new RangeError(
        `Unsupported galaxy laboratory family: ${String(familyId)}.`,
      );
    }

    const galaxy =
      GalaxyGenerator
        .generate(
          GENERATION_KEY,
          family.galaxyIndex,
        );

    if (
      galaxy.type !==
        caseDefinition
          .expectedType
    ) {
      throw new RangeError(
        `Galaxy laboratory family ${family.id} vector ${family.galaxyIndex} changed morphology from ${caseDefinition.expectedType.name} to ${galaxy.type.name}.`,
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
      family,
      galaxy,
      model,
    });
  }
}

function caseById(
  caseId:
    GalaxyLaboratoryCaseId,
): GalaxyLaboratoryCase {

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

  return caseDefinition;
}

function discoverFamilyIndices(
  caseDefinition:
    GalaxyLaboratoryCase,
): readonly bigint[] {

  const selected:
    bigint[] = [];

  const selectedKeys =
    new Set<string>();

  const add =
    (
      index:
        bigint,
    ): void => {
      const key =
        index.toString();

      if (
        selectedKeys.has(
          key,
        )
      ) {
        return;
      }

      selected.push(
        index,
      );
      selectedKeys.add(
        key,
      );
    };

  const preferredGalaxy =
    GalaxyGenerator.generate(
      GENERATION_KEY,
      caseDefinition.galaxyIndex,
    );

  if (
    preferredGalaxy.type ===
    caseDefinition.expectedType
  ) {
    add(
      caseDefinition.galaxyIndex,
    );
  }

  if (
    caseDefinition.id ===
    GalaxyLaboratoryCaseId.SPIRAL
  ) {
    const representedArmCounts =
      new Set<number>();

    for (
      const index of
      selected
    ) {
      representedArmCounts.add(
        GalaxyVisualStructureGenerator
          .generate(
            GalaxyGenerator.generate(
              GENERATION_KEY,
              index,
            ),
          )
          .arms
          .length,
      );
    }

    for (
      let index =
        0n;
      index <
        4_096n &&
      representedArmCounts.size <
        6;
      index +=
        1n
    ) {
      const galaxy =
        GalaxyGenerator.generate(
          GENERATION_KEY,
          index,
        );

      if (
        galaxy.type !==
        GalaxyType.SPIRAL
      ) {
        continue;
      }

      const armCount =
        GalaxyVisualStructureGenerator
          .generate(
            galaxy,
          )
          .arms
          .length;

      if (
        representedArmCounts.has(
          armCount,
        )
      ) {
        continue;
      }

      add(
        index,
      );

      representedArmCounts.add(
        armCount,
      );
    }
  }

  for (
    let index =
      0n;
    index <
      4_096n &&
    selected.length <
      GALAXY_LABORATORY_FAMILY_IDS.length;
    index +=
      1n
  ) {
    const galaxy =
      GalaxyGenerator.generate(
        GENERATION_KEY,
        index,
      );

    if (
      galaxy.type !==
      caseDefinition.expectedType
    ) {
      continue;
    }

    add(
      index,
    );
  }

  if (
    selected.length <
    GALAXY_LABORATORY_FAMILY_IDS.length
  ) {
    throw new RangeError(
      `Could not discover eight deterministic laboratory families for ${caseDefinition.expectedType.name}.`,
    );
  }

  return Object.freeze(
    selected.slice(
      0,
      GALAXY_LABORATORY_FAMILY_IDS.length,
    ),
  );
}
