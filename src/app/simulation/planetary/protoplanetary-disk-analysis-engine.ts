import {
  type SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ProtoplanetaryDiskAnalysis,
} from '../../domain/planetary/protoplanetary-disk-analysis';

import {
  type ProtoplanetaryFormationSnapshot,
  ProtoplanetaryFormationSnapshotGenerator,
} from './protoplanetary-formation-snapshot-generator';

/**
 * Point-17.6 pure analysis engine.
 *
 * It does not alter the frozen 17.1-17.5 Ground Truth. It only projects that
 * deterministic formation snapshot into the compact scientific readout that
 * ANALYZE DISK is allowed to reveal after the action succeeds.
 */
export class ProtoplanetaryDiskAnalysisEngine {

  private constructor() {}

  static analyzeOrNull(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,
  ): ProtoplanetaryDiskAnalysis | null {

    requireV1(
      generationKey,
    );

    const snapshot =
      ProtoplanetaryFormationSnapshotGenerator
        .generateOrNull(
          generationKey,
          locator,
        );

    return snapshot ===
      null
      ? null
      : this.fromSnapshot(
          snapshot,
        );
  }

  static fromSnapshot(
    snapshot:
      ProtoplanetaryFormationSnapshot,
  ): ProtoplanetaryDiskAnalysis {

    return new ProtoplanetaryDiskAnalysis(
      snapshot
        .stellarYouthProfile
        .stage,
      snapshot
        .diskProfile
        .stage,
      snapshot
        .diskProfile
        .ageMillionYears,
      snapshot
        .diskProfile
        .diskMassSolar,
      snapshot
        .diskProfile
        .innerRadiusAu,
      snapshot
        .diskProfile
        .characteristicRadiusAu,
      snapshot
        .diskProfile
        .outerRadiusAu,
      snapshot
        .diskStructure
        .gasMassFraction01,
      snapshot
        .diskStructure
        .dustMassFraction01,
      snapshot
        .diskStructure
        .gaps
        .length,
      snapshot
        .diskStructure
        .condensationRegions
        .length,
      snapshot
        .diskStructure
        .waterSnowLineRadiusAuOrNull,
      snapshot
        .candidatePopulation
        .candidates
        .length,
      snapshot
        .candidatePopulation
        .candidateSolidMassEarth,
      snapshot
        .earlyDynamics
        .survivorCount,
      snapshot
        .earlyDynamics
        .migratedBodyCount,
      snapshot
        .earlyDynamics
        .collisionCount,
    );
  }
}

function requireV1(
  generationKey:
    UniverseGenerationKey,
): void {

  if (
    generationKey.generatorVersion !==
      GeneratorVersion.V1
  ) {
    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }
}
