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
  type PlanetarySystemFormationBlueprint,
} from '../../../domain/planetary/planetary-system-formation-blueprint';

import {
  type ProtoplanetaryDiskAnalysis,
} from '../../../domain/planetary/protoplanetary-disk-analysis';

import {
  UniverseSeed,
} from '../../../domain/universe/universe-seed';

import {
  PlanetaryFormationMaturationGenerator,
} from '../../../simulation/planetary/planetary-formation-maturation-generator';

import {
  ProtoplanetaryDiskAnalysisEngine,
} from '../../../simulation/planetary/protoplanetary-disk-analysis-engine';

import {
  type ProtoplanetaryFormationSnapshot,
  ProtoplanetaryFormationSnapshotGenerator,
} from '../../../simulation/planetary/protoplanetary-formation-snapshot-generator';

export const PlanetaryFormationLaboratoryFamilyId =
  Object.freeze({
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
    E: 'E',
    F: 'F',
    G: 'G',
    H: 'H',
  } as const);

export type PlanetaryFormationLaboratoryFamilyId =
  typeof PlanetaryFormationLaboratoryFamilyId[
    keyof typeof PlanetaryFormationLaboratoryFamilyId
  ];

export interface PlanetaryFormationLaboratoryFamily {
  readonly id:
    PlanetaryFormationLaboratoryFamilyId;

  readonly label:
    string;

  /**
   * Zero-based ordinal among SystemLocators that really materialize the full
   * point-17.1 -> point-17.5 snapshot. It is not the galacticObjectIndex.
   */
  readonly formationMatchOrdinal:
    number;
}

export interface PlanetaryFormationLaboratoryFrame {
  readonly family:
    PlanetaryFormationLaboratoryFamily;

  readonly locator:
    SystemLocator;

  readonly snapshot:
    ProtoplanetaryFormationSnapshot;

  readonly analysis:
    ProtoplanetaryDiskAnalysis;

  readonly blueprint:
    PlanetarySystemFormationBlueprint;
}

export const PLANETARY_FORMATION_LABORATORY_FAMILIES:
  readonly PlanetaryFormationLaboratoryFamily[] =
  Object.freeze([
    family('A', 0),
    family('B', 1),
    family('C', 2),
    family('D', 3),
    family('E', 4),
    family('F', 5),
    family('G', 6),
    family('H', 7),
  ]);

const GENERATION_KEY =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V1,
  );

const MAX_SCAN_INDEX =
  131_072;

const frameCache =
  new Map<
    PlanetaryFormationLaboratoryFamilyId,
    PlanetaryFormationLaboratoryFrame
  >();

const resolvedSnapshotCache:
  Array<{
    readonly locator:
      SystemLocator;

    readonly snapshot:
      ProtoplanetaryFormationSnapshot;
  }> =
  [];

let nextScanIndex =
  0;

/**
 * Phase-17 visual QA fixtures.
 *
 * Unlike a presentation mock, each family is resolved from a real
 * SystemLocator and then regenerated through the canonical 17.6 snapshot
 * generator. Families A-H are the first eight real planet-forming snapshots in
 * a deterministic scan of G0/S0. The scan is cached and happens only inside
 * this permanent read-only laboratory.
 */
export class PlanetaryFormationLaboratoryFixtures {

  private constructor() {}

  static generationKey():
    UniverseGenerationKey {

    return GENERATION_KEY;
  }

  static families():
    readonly PlanetaryFormationLaboratoryFamily[] {

    return PLANETARY_FORMATION_LABORATORY_FAMILIES;
  }

  static frame(
    familyId:
      PlanetaryFormationLaboratoryFamilyId,
  ):
    PlanetaryFormationLaboratoryFrame {

    const cached =
      frameCache.get(
        familyId,
      );

    if (
      cached !==
      undefined
    ) {
      return cached;
    }

    const familyDefinition =
      requireFamily(
        familyId,
      );

    const resolved =
      resolveFormationSnapshot(
        familyDefinition
          .formationMatchOrdinal,
      );

    const analysis =
      ProtoplanetaryDiskAnalysisEngine
        .fromSnapshot(
          resolved.snapshot,
        );

    const blueprint =
      PlanetaryFormationMaturationGenerator
        .generate(
          GENERATION_KEY,
          resolved.snapshot.systemSeed,
          resolved.snapshot.diskProfile,
          resolved.snapshot.diskStructure,
          resolved.snapshot.planetFormationProfile,
          resolved.snapshot.candidatePopulation,
          resolved.snapshot.earlyDynamics,
        );

    const frame =
      Object.freeze({
        family:
          familyDefinition,
        locator:
          resolved.locator,
        snapshot:
          resolved.snapshot,
        analysis,
        blueprint,
      });

    frameCache.set(
      familyId,
      frame,
    );

    return frame;
  }
}

function family(
  id:
    PlanetaryFormationLaboratoryFamilyId,

  formationMatchOrdinal:
    number,
): PlanetaryFormationLaboratoryFamily {

  return Object.freeze({
    id,
    label:
      `Familia ${id}`,
    formationMatchOrdinal,
  });
}

function requireFamily(
  familyId:
    PlanetaryFormationLaboratoryFamilyId,
): PlanetaryFormationLaboratoryFamily {

  const result =
    PLANETARY_FORMATION_LABORATORY_FAMILIES
      .find(
        familyValue =>
          familyValue.id ===
          familyId,
      );

  if (
    result ===
    undefined
  ) {
    throw new RangeError(
      `Unknown planetary-formation laboratory family: ${familyId}.`,
    );
  }

  return result;
}

function resolveFormationSnapshot(
  targetMatchOrdinal:
    number,
): {
  readonly locator:
    SystemLocator;

  readonly snapshot:
    ProtoplanetaryFormationSnapshot;
} {

  while (
    resolvedSnapshotCache.length <=
      targetMatchOrdinal &&
    nextScanIndex <
      MAX_SCAN_INDEX
  ) {
    const locator =
      new SystemLocator(
        0n,
        0n,
        BigInt(
          nextScanIndex,
        ),
      );

    nextScanIndex +=
      1;

    const snapshot =
      ProtoplanetaryFormationSnapshotGenerator
        .generateOrNull(
          GENERATION_KEY,
          locator,
        );

    if (
      snapshot ===
      null
    ) {
      continue;
    }

    resolvedSnapshotCache.push({
      locator,
      snapshot,
    });
  }

  const resolved =
    resolvedSnapshotCache[
      targetMatchOrdinal
    ];

  if (
    resolved ===
    undefined
  ) {
    throw new Error(
      `Unable to resolve phase-17 laboratory fixture ordinal ${targetMatchOrdinal} within ${MAX_SCAN_INDEX} SystemLocators.`,
    );
  }

  return resolved;
}
