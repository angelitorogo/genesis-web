import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../../domain/discovery/discovery-state';

import {
  GeneratorVersion,
} from '../../../domain/generation/generator-version';

import {
  SystemLocator,
} from '../../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  type SystemSeed,
} from '../../../domain/seed/hierarchical-seeds';

import {
  StellarSystemMultiplicity,
} from '../../../domain/stellar/stellar-system-multiplicity';

import {
  UniverseSeed,
} from '../../../domain/universe/universe-seed';

import {
  ProceduralTargetResolver,
} from '../../../simulation/regeneration/procedural-target-resolver';

import {
  StellarSystemMultiplicitySelector,
} from '../../../simulation/stellar/stellar-system-multiplicity-selector';

import {
  ArchiveStellarSystemCardAssembler,
  type ArchiveStellarSystemCardModel,
} from '../../genesis-archive/archive-stellar-system-card';

export const StellarSystemLaboratoryCaseId =
  Object.freeze({
    SINGLE:
      'SINGLE',

    BINARY:
      'BINARY',

    TRIPLE:
      'TRIPLE',
  } as const);

export type StellarSystemLaboratoryCaseId =
  typeof StellarSystemLaboratoryCaseId[
    keyof typeof StellarSystemLaboratoryCaseId
  ];

export const StellarSystemLaboratoryFamilyId =
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

export type StellarSystemLaboratoryFamilyId =
  typeof StellarSystemLaboratoryFamilyId[
    keyof typeof StellarSystemLaboratoryFamilyId
  ];

export const STELLAR_SYSTEM_LABORATORY_FAMILY_IDS:
  readonly StellarSystemLaboratoryFamilyId[] =
  Object.freeze([
    StellarSystemLaboratoryFamilyId.A,
    StellarSystemLaboratoryFamilyId.B,
    StellarSystemLaboratoryFamilyId.C,
    StellarSystemLaboratoryFamilyId.D,
    StellarSystemLaboratoryFamilyId.E,
    StellarSystemLaboratoryFamilyId.F,
    StellarSystemLaboratoryFamilyId.G,
    StellarSystemLaboratoryFamilyId.H,
  ]);

export interface StellarSystemLaboratoryCase {
  readonly id:
    StellarSystemLaboratoryCaseId;

  readonly label:
    string;

  readonly multiplicity:
    StellarSystemMultiplicity;

  readonly description:
    string;
}

export interface StellarSystemLaboratoryFamily {
  readonly id:
    StellarSystemLaboratoryFamilyId;

  readonly label:
    string;

  readonly locator:
    SystemLocator;

  readonly systemSeedHex:
    string;

  readonly matchOrdinal:
    number;
}

export interface StellarSystemLaboratoryKnowledgeStage {
  readonly discoveryState:
    DiscoveryStateValue;

  readonly label:
    string;

  readonly badge:
    string;

  readonly card:
    ArchiveStellarSystemCardModel;
}

export interface StellarSystemLaboratoryFrame {
  readonly caseDefinition:
    StellarSystemLaboratoryCase;

  readonly family:
    StellarSystemLaboratoryFamily;

  readonly stages:
    readonly StellarSystemLaboratoryKnowledgeStage[];
}

export const STELLAR_SYSTEM_LABORATORY_CASES:
  readonly StellarSystemLaboratoryCase[] =
  Object.freeze([
    Object.freeze({
      id:
        StellarSystemLaboratoryCaseId.SINGLE,
      label:
        'Sistema simple',
      multiplicity:
        StellarSystemMultiplicity.SINGLE,
      description:
        'Una única primaria A. Sirve como referencia visual del contrato 16.1 y conserva íntegramente la estrella canónica de Fase 15.',
    }),
    Object.freeze({
      id:
        StellarSystemLaboratoryCaseId.BINARY,
      label:
        'Sistema binario',
      multiplicity:
        StellarSystemMultiplicity.BINARY,
      description:
        'Primaria A y compañera B con órbita relativa A–B, estabilidad circumbinaria y evaluación de zona habitable cuando el conocimiento lo permite.',
    }),
    Object.freeze({
      id:
        StellarSystemLaboratoryCaseId.TRIPLE,
      label:
        'Sistema triple',
      multiplicity:
        StellarSystemMultiplicity.TRIPLE,
      description:
        'Par interior A–B y componente C exterior en jerarquía simplificada, incluyendo la restricción dinámica de C sobre la región circumbinaria.',
    }),
  ]);

const GENERATION_KEY =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V1,
  );

/*
 * We deliberately do not use the first eight matches consecutively. These
 * ordinal positions spread A-H over a wider deterministic sample while
 * keeping fixture discovery cheap even for the rare 3% TRIPLE population.
 */
const FAMILY_MATCH_ORDINALS =
  Object.freeze([
    0,
    3,
    11,
    23,
    47,
    79,
    111,
    159,
  ]);

const MAX_SCAN_INDEX =
  32_768;

const familyCache =
  new Map<
    StellarSystemLaboratoryCaseId,
    readonly StellarSystemLaboratoryFamily[]
  >();

const frameCache =
  new Map<
    string,
    StellarSystemLaboratoryFrame
  >();

export class StellarSystemLaboratoryFixtures {

  private constructor() {}

  static generationKey():
    UniverseGenerationKey {

    return GENERATION_KEY;
  }

  static cases():
    readonly StellarSystemLaboratoryCase[] {

    return STELLAR_SYSTEM_LABORATORY_CASES;
  }

  static families(
    caseId:
      StellarSystemLaboratoryCaseId,
  ):
    readonly StellarSystemLaboratoryFamily[] {

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
      requireCase(
        caseId,
      );

    const families =
      discoverFamilies(
        caseDefinition,
      );

    familyCache.set(
      caseId,
      families,
    );

    return families;
  }

  static frame(
    caseId:
      StellarSystemLaboratoryCaseId,

    familyId:
      StellarSystemLaboratoryFamilyId,
  ):
    StellarSystemLaboratoryFrame {

    const cacheKey =
      `${caseId}:${familyId}`;

    const cached =
      frameCache.get(
        cacheKey,
      );

    if (
      cached !==
      undefined
    ) {
      return cached;
    }

    const caseDefinition =
      requireCase(
        caseId,
      );

    const family =
      this
        .families(
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
        `Unknown stellar-system laboratory family ${familyId} for ${caseId}.`,
      );
    }

    const stages =
      Object.freeze([
        stage(
          family.locator,
          DiscoveryState.DETECTED,
          'Detectado',
          'SIGNAL',
        ),
        stage(
          family.locator,
          DiscoveryState.DISCOVERED,
          'Descubierto',
          'IDENTIFIED',
        ),
        stage(
          family.locator,
          DiscoveryState.CATALOGUED,
          'Catalogado',
          'CATALOGUED',
        ),
        stage(
          family.locator,
          DiscoveryState.CONFIRMED,
          'Confirmado',
          'CONFIRMED',
        ),
      ]);

    const frame =
      Object.freeze({
        caseDefinition,
        family,
        stages,
      });

    frameCache.set(
      cacheKey,
      frame,
    );

    return frame;
  }
}

function discoverFamilies(
  caseDefinition:
    StellarSystemLaboratoryCase,
): readonly StellarSystemLaboratoryFamily[] {

  const families:
    StellarSystemLaboratoryFamily[] =
    [];

  let matchingOrdinal =
    -1;

  let targetFamilyIndex =
    0;

  for (
    let index = 0;
    index < MAX_SCAN_INDEX &&
      targetFamilyIndex <
        STELLAR_SYSTEM_LABORATORY_FAMILY_IDS.length;
    index += 1
  ) {
    const locator =
      new SystemLocator(
        0n,
        0n,
        BigInt(
          index,
        ),
      );

    const systemSeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          GENERATION_KEY,
          locator,
        ) as SystemSeed;

    if (
      StellarSystemMultiplicitySelector
        .select(
          GENERATION_KEY,
          systemSeed,
        ) !==
      caseDefinition.multiplicity
    ) {
      continue;
    }

    matchingOrdinal +=
      1;

    if (
      matchingOrdinal !==
      FAMILY_MATCH_ORDINALS[
        targetFamilyIndex
      ]
    ) {
      continue;
    }

    const familyId =
      STELLAR_SYSTEM_LABORATORY_FAMILY_IDS[
        targetFamilyIndex
      ]!;

    families.push(
      Object.freeze({
        id:
          familyId,
        label:
          `Familia ${familyId}`,
        locator,
        systemSeedHex:
          systemSeed.normalizedValue,
        matchOrdinal:
          matchingOrdinal,
      }),
    );

    targetFamilyIndex +=
      1;
  }

  if (
    families.length !==
    STELLAR_SYSTEM_LABORATORY_FAMILY_IDS.length
  ) {
    throw new Error(
      `Unable to discover eight deterministic ${caseDefinition.id} stellar-system fixtures within ${MAX_SCAN_INDEX} SystemLocators.`,
    );
  }

  return Object.freeze(
    families,
  );
}

function stage(
  locator:
    SystemLocator,

  discoveryState:
    DiscoveryStateValue,

  label:
    string,

  badge:
    string,
): StellarSystemLaboratoryKnowledgeStage {

  return Object.freeze({
    discoveryState,
    label,
    badge,
    card:
      ArchiveStellarSystemCardAssembler
        .build(
          GENERATION_KEY,
          locator,
          discoveryState,
        ),
  });
}

function requireCase(
  caseId:
    StellarSystemLaboratoryCaseId,
): StellarSystemLaboratoryCase {

  const caseDefinition =
    STELLAR_SYSTEM_LABORATORY_CASES
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
      `Unknown stellar-system laboratory case: ${caseId}.`,
    );
  }

  return caseDefinition;
}
