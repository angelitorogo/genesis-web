import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  EarlyPlanetaryDynamicsOutcome,
} from '../../domain/planetary/early-planetary-dynamics-outcome';

import {
  EarlyProtoplanetBody,
} from '../../domain/planetary/early-protoplanet-body';

import {
  EarlyProtoplanetCollision,
} from '../../domain/planetary/early-protoplanet-collision';

import {
  type ProtoplanetCandidate,
} from '../../domain/planetary/protoplanet-candidate';

import {
  type ProtoplanetCandidatePopulation,
} from '../../domain/planetary/protoplanet-candidate-population';

import {
  ProtoplanetCompositionMixture,
} from '../../domain/planetary/protoplanet-composition-mixture';

import {
  type ProtoplanetaryDiskGap,
} from '../../domain/planetary/protoplanetary-disk-gap';

import {
  type ProtoplanetaryDiskProfile,
} from '../../domain/planetary/protoplanetary-disk-profile';

import {
  type ProtoplanetaryDiskStructure,
} from '../../domain/planetary/protoplanetary-disk-structure';

import {
  ProtoplanetMigrationDirection,
} from '../../domain/planetary/protoplanet-migration-direction';

import {
  type SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

const V1_DYNAMICS_BRANCH =
  utf8ToBytes(
    'GENESIS-EARLY-PLANETARY-DYNAMICS-V1',
  );

const V1_MAX_LOG_MIGRATION =
  0.62;

const V1_COLLISION_GUARANTEED_SPACING_RATIO =
  1.055;

const V1_COLLISION_ENCOUNTER_SPACING_RATIO =
  1.14;

const CONSISTENCY_TOLERANCE =
  1e-9;

interface V1MigratingBody {
  readonly sourceFormationOrdinals:
    readonly number[];

  readonly formationMassWeightedRadiusAu:
    number;

  readonly migratedRadiusAu:
    number;

  readonly solidMassEarth:
    number;

  readonly compositionMixture:
    ProtoplanetCompositionMixture;

  readonly growthPotential01:
    number;

  readonly gasAccretionPotential01:
    number;
}

/**
 * Point-17.5 deterministic simplified early-dynamics pass.
 *
 * V1 migrates point-17.4 candidates radially inside the frozen disk envelope
 * and resolves only strong convergent encounters as perfect-merger collisions.
 * It deliberately does not integrate eccentricity/inclination, resonances,
 * scattering/ejections, gas-envelope growth or mature planetary stability.
 */
export class EarlyPlanetaryDynamicsGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    systemSeed:
      SystemSeed,

    diskProfile:
      ProtoplanetaryDiskProfile,

    diskStructure:
      ProtoplanetaryDiskStructure,

    candidatePopulation:
      ProtoplanetCandidatePopulation,
  ): EarlyPlanetaryDynamicsOutcome {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        systemSeed,
        diskProfile,
        diskStructure,
        candidatePopulation,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    systemSeed:
      SystemSeed,

    diskProfile:
      ProtoplanetaryDiskProfile,

    diskStructure:
      ProtoplanetaryDiskStructure,

    candidatePopulation:
      ProtoplanetCandidatePopulation,
  ): EarlyPlanetaryDynamicsOutcome {

    assertInputConsistencyV1(
      diskProfile,
      diskStructure,
      candidatePopulation,
    );

    if (
      candidatePopulation
        .candidates.length ===
      0
    ) {
      return new EarlyPlanetaryDynamicsOutcome(
        diskProfile.innerRadiusAu,
        diskProfile.outerRadiusAu,
        0,
        0,
        0,
        [],
        [],
      );
    }

    const migrated =
      candidatePopulation
        .candidates
        .map(
          candidate =>
            migrateCandidateV1(
              systemSeed,
              diskProfile,
              diskStructure,
              candidate,
            ),
        );

    const collisions:
      EarlyProtoplanetCollision[] =
        [];

    const survivors =
      resolveCollisionsV1(
        systemSeed,
        migrated,
        collisions,
      );

    const bodies =
      survivors
        .map(
          survivor =>
            materializeBodyV1(
              survivor,
            ),
        )
        .sort(
          (
            first,
            second,
          ) =>
            first.orbitalRadiusAu -
            second.orbitalRadiusAu,
        );

    const survivingSolidMassEarth =
      sum(
        bodies.map(
          body =>
            body.solidMassEarth,
        ),
      );

    return new EarlyPlanetaryDynamicsOutcome(
      diskProfile.innerRadiusAu,
      diskProfile.outerRadiusAu,
      candidatePopulation
        .candidates.length,
      candidatePopulation
        .candidateSolidMassEarth,
      survivingSolidMassEarth,
      bodies,
      collisions,
    );
  }
}

function migrateCandidateV1(
  systemSeed:
    SystemSeed,

  diskProfile:
    ProtoplanetaryDiskProfile,

  diskStructure:
    ProtoplanetaryDiskStructure,

  candidate:
    ProtoplanetCandidate,
): V1MigratingBody {

  const localGasRetention01 =
    localGasRetentionFractionV1(
      candidate.orbitalRadiusAu,
      diskStructure.gaps,
    );

  const gasMobility01 =
    clamp01(
      diskStructure
        .gasMassFraction01 *
      (
        1 -
        diskStructure
          .gasDepletionIndex01
      ) *
      localGasRetention01 *
      (
        0.45 +
        0.55 *
          (
            1 -
            diskProfile
              .evolutionProgress01
          )
      ),
    );

  const massMobility01 =
    clamp01(
      Math.log10(
        1 +
        candidate.solidMassEarth,
      ) /
      Math.log10(
        1 +
        12.5,
      ),
    );

  const migrationPropensity01 =
    clamp01(
      (
        0.12 +
        0.88 *
          gasMobility01
      ) *
      (
        0.28 +
        0.42 *
          massMobility01 +
        0.30 *
          candidate
            .growthPotential01
      ),
    );

  const migrates =
    deterministicUnitV1(
      systemSeed,
      `migration-presence:${candidate.formationOrdinal}`,
    ) <
    migrationPropensity01;

  if (
    !migrates
  ) {
    return candidateWorkingBodyV1(
      candidate,
      candidate.orbitalRadiusAu,
    );
  }

  const outwardProbability01 =
    clamp(
      0.06 +
        (
          candidate.isIceBearing
            ? 0.14
            : 0
        ) +
        0.10 *
          (
            1 -
            massMobility01
          ),
      0.05,
      0.30,
    );

  const outward =
    deterministicUnitV1(
      systemSeed,
      `migration-direction:${candidate.formationOrdinal}`,
    ) <
    outwardProbability01;

  const migrationStrength01 =
    clamp01(
      migrationPropensity01 *
      (
        0.42 +
        0.58 *
          deterministicUnitV1(
            systemSeed,
            `migration-strength:${candidate.formationOrdinal}`,
          )
      ),
    );

  const signedLogDisplacement =
    V1_MAX_LOG_MIGRATION *
    migrationStrength01 *
    (
      outward
        ? 1
        : -1
    );

  const minimumRadiusAu =
    diskProfile.innerRadiusAu *
    1.002;

  const maximumRadiusAu =
    diskProfile.outerRadiusAu /
    1.002;

  let migratedRadiusAu =
    clamp(
      candidate.orbitalRadiusAu *
        Math.exp(
          signedLogDisplacement,
        ),
      minimumRadiusAu,
      maximumRadiusAu,
    );

  migratedRadiusAu =
    applyWaterSnowLineTrapV1(
      systemSeed,
      candidate,
      migratedRadiusAu,
      diskStructure
        .waterSnowLineRadiusAuOrNull,
      minimumRadiusAu,
      maximumRadiusAu,
    );

  if (
    Math.abs(
      migratedRadiusAu -
      candidate.orbitalRadiusAu,
    ) <=
    CONSISTENCY_TOLERANCE
  ) {
    migratedRadiusAu =
      candidate.orbitalRadiusAu;
  }

  return candidateWorkingBodyV1(
    candidate,
    migratedRadiusAu,
  );
}

function applyWaterSnowLineTrapV1(
  systemSeed:
    SystemSeed,

  candidate:
    ProtoplanetCandidate,

  migratedRadiusAu:
    number,

  snowLineRadiusAu:
    number | null,

  minimumRadiusAu:
    number,

  maximumRadiusAu:
    number,
): number {

  if (
    snowLineRadiusAu ===
      null ||
    candidate.orbitalRadiusAu <=
      snowLineRadiusAu ||
    migratedRadiusAu >=
      snowLineRadiusAu
  ) {
    return migratedRadiusAu;
  }

  const trapProbability01 =
    0.30 +
    0.35 *
      candidate
        .localDustRetentionFraction01;

  if (
    deterministicUnitV1(
      systemSeed,
      `snow-line-trap:${candidate.formationOrdinal}`,
    ) >=
    trapProbability01
  ) {
    return migratedRadiusAu;
  }

  const offset =
    0.97 +
    0.06 *
      deterministicUnitV1(
        systemSeed,
        `snow-line-trap-offset:${candidate.formationOrdinal}`,
      );

  return clamp(
    snowLineRadiusAu *
      offset,
    minimumRadiusAu,
    maximumRadiusAu,
  );
}

function candidateWorkingBodyV1(
  candidate:
    ProtoplanetCandidate,

  migratedRadiusAu:
    number,
): V1MigratingBody {

  return {
    sourceFormationOrdinals:
      Object.freeze([
        candidate.formationOrdinal,
      ]),
    formationMassWeightedRadiusAu:
      candidate.orbitalRadiusAu,
    migratedRadiusAu,
    solidMassEarth:
      candidate.solidMassEarth,
    compositionMixture:
      ProtoplanetCompositionMixture
        .fromCandidateComposition(
          candidate.composition,
        ),
    growthPotential01:
      candidate.growthPotential01,
    gasAccretionPotential01:
      candidate.gasAccretionPotential01,
  };
}

function resolveCollisionsV1(
  systemSeed:
    SystemSeed,

  migratedBodies:
    readonly V1MigratingBody[],

  collisions:
    EarlyProtoplanetCollision[],
): readonly V1MigratingBody[] {

  const stack:
    V1MigratingBody[] =
      [];

  for (
    const incoming
    of migratedBodies
  ) {
    stack.push(
      incoming,
    );

    while (
      stack.length >=
      2
    ) {
      const right =
        stack[
          stack.length -
          1
        ];

      const left =
        stack[
          stack.length -
          2
        ];

      const encounter =
        collisionEncounterV1(
          systemSeed,
          left,
          right,
        );

      if (
        !encounter.collides
      ) {
        break;
      }

      stack.pop();
      stack.pop();

      const merged =
        mergeBodiesV1(
          left,
          right,
        );

      collisions.push(
        new EarlyProtoplanetCollision(
          collisions.length +
            1,
          merged
            .sourceFormationOrdinals,
          merged
            .migratedRadiusAu,
          merged
            .solidMassEarth,
          encounter
            .impactSeverity01,
        ),
      );

      stack.push(
        merged,
      );
    }
  }

  return stack;
}

function collisionEncounterV1(
  systemSeed:
    SystemSeed,

  left:
    V1MigratingBody,

  right:
    V1MigratingBody,
): {
  readonly collides:
    boolean;

  readonly impactSeverity01:
    number;
} {

  const largerRadiusAu =
    Math.max(
      left.migratedRadiusAu,
      right.migratedRadiusAu,
    );

  const smallerRadiusAu =
    Math.min(
      left.migratedRadiusAu,
      right.migratedRadiusAu,
    );

  const spacingRatio =
    largerRadiusAu /
    smallerRadiusAu;

  const pathCrossing =
    left.migratedRadiusAu >=
    right.migratedRadiusAu;

  const convergence01 =
    pathCrossing
      ? 1
      : clamp01(
        (
          V1_COLLISION_ENCOUNTER_SPACING_RATIO -
          spacingRatio
        ) /
        (
          V1_COLLISION_ENCOUNTER_SPACING_RATIO -
          1
        ),
      );

  const massIndex01 =
    clamp01(
      Math.log10(
        1 +
        left.solidMassEarth +
        right.solidMassEarth,
      ) /
      Math.log10(
        1 +
        20,
      ),
    );

  const label =
    collisionLabelV1(
      left,
      right,
    );

  const impactSeverity01 =
    clamp01(
      0.26 +
      0.46 *
        convergence01 +
      0.18 *
        massIndex01 +
      0.10 *
        deterministicUnitV1(
          systemSeed,
          `impact-severity:${label}`,
        ),
    );

  if (
    pathCrossing ||
    spacingRatio <=
      V1_COLLISION_GUARANTEED_SPACING_RATIO
  ) {
    return {
      collides:
        true,
      impactSeverity01,
    };
  }

  if (
    spacingRatio >=
    V1_COLLISION_ENCOUNTER_SPACING_RATIO
  ) {
    return {
      collides:
        false,
      impactSeverity01,
    };
  }

  const encounterProbability01 =
    clamp01(
      0.10 +
      0.62 *
        convergence01 +
      0.18 *
        massIndex01 +
      0.10 *
        Math.max(
          left.growthPotential01,
          right.growthPotential01,
        ),
    );

  return {
    collides:
      deterministicUnitV1(
        systemSeed,
        `collision:${label}`,
      ) <
      encounterProbability01,
    impactSeverity01,
  };
}

function collisionLabelV1(
  left:
    V1MigratingBody,

  right:
    V1MigratingBody,
): string {

  return `${left.sourceFormationOrdinals.join('.')}:${right.sourceFormationOrdinals.join('.')}`;
}

function mergeBodiesV1(
  first:
    V1MigratingBody,

  second:
    V1MigratingBody,
): V1MigratingBody {

  const totalMassEarth =
    first.solidMassEarth +
    second.solidMassEarth;

  const sourceFormationOrdinals =
    [
      ...first
        .sourceFormationOrdinals,
      ...second
        .sourceFormationOrdinals,
    ]
      .sort(
        (
          firstOrdinal,
          secondOrdinal,
        ) =>
          firstOrdinal -
          secondOrdinal,
      );

  return {
    sourceFormationOrdinals:
      Object.freeze(
        sourceFormationOrdinals,
      ),
    formationMassWeightedRadiusAu:
      angularMomentumWeightedRadiusV1(
        first
          .formationMassWeightedRadiusAu,
        first.solidMassEarth,
        second
          .formationMassWeightedRadiusAu,
        second.solidMassEarth,
      ),
    migratedRadiusAu:
      angularMomentumWeightedRadiusV1(
        first.migratedRadiusAu,
        first.solidMassEarth,
        second.migratedRadiusAu,
        second.solidMassEarth,
      ),
    solidMassEarth:
      totalMassEarth,
    compositionMixture:
      ProtoplanetCompositionMixture
        .mergeWeighted([
          {
            mixture:
              first
                .compositionMixture,
            solidMassEarth:
              first
                .solidMassEarth,
          },
          {
            mixture:
              second
                .compositionMixture,
            solidMassEarth:
              second
                .solidMassEarth,
          },
        ]),
    growthPotential01:
      massWeightedAverageV1(
        first.growthPotential01,
        first.solidMassEarth,
        second.growthPotential01,
        second.solidMassEarth,
      ),
    gasAccretionPotential01:
      massWeightedAverageV1(
        first.gasAccretionPotential01,
        first.solidMassEarth,
        second.gasAccretionPotential01,
        second.solidMassEarth,
      ),
  };
}

function materializeBodyV1(
  survivor:
    V1MigratingBody,
): EarlyProtoplanetBody {

  const descriptor =
    migrationDescriptorV1(
      survivor
        .formationMassWeightedRadiusAu,
      survivor
        .migratedRadiusAu,
    );

  return new EarlyProtoplanetBody(
    survivor
      .sourceFormationOrdinals,
    survivor
      .formationMassWeightedRadiusAu,
    survivor
      .migratedRadiusAu,
    survivor
      .solidMassEarth,
    survivor
      .compositionMixture,
    survivor
      .growthPotential01,
    survivor
      .gasAccretionPotential01,
    descriptor.direction,
    descriptor.strength01,
    survivor
      .sourceFormationOrdinals
      .length -
      1,
  );
}

function migrationDescriptorV1(
  formationRadiusAu:
    number,

  orbitalRadiusAu:
    number,
): {
  readonly direction:
    ProtoplanetMigrationDirection;

  readonly strength01:
    number;
} {

  const displacement =
    orbitalRadiusAu -
    formationRadiusAu;

  if (
    Math.abs(
      displacement,
    ) <=
    CONSISTENCY_TOLERANCE
  ) {
    return {
      direction:
        ProtoplanetMigrationDirection.NONE,
      strength01:
        0,
    };
  }

  return {
    direction:
      displacement <
        0
        ? ProtoplanetMigrationDirection.INWARD
        : ProtoplanetMigrationDirection.OUTWARD,
    strength01:
      clamp01(
        Math.abs(
          Math.log(
            orbitalRadiusAu /
            formationRadiusAu,
          ),
        ) /
        V1_MAX_LOG_MIGRATION,
      ),
  };
}

function angularMomentumWeightedRadiusV1(
  firstRadiusAu:
    number,

  firstMassEarth:
    number,

  secondRadiusAu:
    number,

  secondMassEarth:
    number,
): number {

  const totalMassEarth =
    firstMassEarth +
    secondMassEarth;

  const weightedSqrtRadius =
    (
      firstMassEarth *
        Math.sqrt(
          firstRadiusAu,
        ) +
      secondMassEarth *
        Math.sqrt(
          secondRadiusAu,
        )
    ) /
    totalMassEarth;

  return weightedSqrtRadius **
    2;
}

function massWeightedAverageV1(
  firstValue:
    number,

  firstMassEarth:
    number,

  secondValue:
    number,

  secondMassEarth:
    number,
): number {

  return (
    firstValue *
      firstMassEarth +
    secondValue *
      secondMassEarth
  ) /
  (
    firstMassEarth +
    secondMassEarth
  );
}

function localGasRetentionFractionV1(
  radiusAu:
    number,

  gaps:
    readonly ProtoplanetaryDiskGap[],
): number {

  const gap =
    gaps.find(
      candidate =>
        radiusAu >=
          candidate.innerRadiusAu &&
        radiusAu <=
          candidate.outerRadiusAu,
    );

  return (
    gap ===
      undefined
      ? 1
      : 1 -
        gap.gasDepletionFraction01
  );
}

function assertInputConsistencyV1(
  diskProfile:
    ProtoplanetaryDiskProfile,

  diskStructure:
    ProtoplanetaryDiskStructure,

  candidatePopulation:
    ProtoplanetCandidatePopulation,
): void {

  if (
    !approximatelyEqual(
      diskProfile.diskMassSolar,
      diskStructure.sourceDiskMassSolar,
    ) ||
    !approximatelyEqual(
      diskProfile.innerRadiusAu,
      diskStructure.sourceInnerRadiusAu,
    ) ||
    !approximatelyEqual(
      diskProfile.outerRadiusAu,
      diskStructure.sourceOuterRadiusAu,
    ) ||
    !approximatelyEqual(
      candidatePopulation
        .sourceInnerRadiusAu,
      diskStructure
        .sourceInnerRadiusAu,
    ) ||
    !approximatelyEqual(
      candidatePopulation
        .sourceOuterRadiusAu,
      diskStructure
        .sourceOuterRadiusAu,
    )
  ) {
    throw new RangeError(
      'Point-17.5 inputs must describe the same frozen point-17.2/17.3 disk envelope.',
    );
  }

  const candidateMassEarth =
    sum(
      candidatePopulation
        .candidates
        .map(
          candidate =>
            candidate.solidMassEarth,
        ),
    );

  if (
    !approximatelyEqual(
      candidateMassEarth,
      candidatePopulation
        .candidateSolidMassEarth,
    )
  ) {
    throw new RangeError(
      'Point-17.5 source candidate mass must match the frozen point-17.4 population.',
    );
  }
}

function deterministicUnitV1(
  systemSeed:
    SystemSeed,

  label:
    string,
): number {

  const digest =
    sha256
      .create()
      .update(
        V1_DYNAMICS_BRANCH,
      )
      .update(
        hexToBytes(
          systemSeed
            .normalizedValue,
        ),
      )
      .update(
        utf8ToBytes(
          label,
        ),
      )
      .digest();

  let value =
    0;

  for (
    let index = 0;
    index <
      6;
    index += 1
  ) {
    value =
      value *
        256 +
      digest[
        index
      ];
  }

  return value /
    281_474_976_710_656;
}

function sum(
  values:
    readonly number[],
): number {

  return values.reduce(
    (
      accumulator,
      value,
    ) =>
      accumulator +
      value,
    0,
  );
}

function approximatelyEqual(
  first:
    number,

  second:
    number,
): boolean {

  return (
    Math.abs(
      first -
      second,
    ) <=
    CONSISTENCY_TOLERANCE *
      Math.max(
        1,
        Math.abs(
          first,
        ),
        Math.abs(
          second,
        ),
      )
  );
}

function clamp01(
  value:
    number,
): number {

  return clamp(
    value,
    0,
    1,
  );
}

function clamp(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {

  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}
