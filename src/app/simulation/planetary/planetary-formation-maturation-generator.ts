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
  type EarlyPlanetaryDynamicsOutcome,
} from '../../domain/planetary/early-planetary-dynamics-outcome';

import {
  type EarlyProtoplanetBody,
} from '../../domain/planetary/early-protoplanet-body';

import {
  type PlanetFormationProfile,
} from '../../domain/planetary/planet-formation-profile';

import {
  PlanetaryFormationAnchor,
} from '../../domain/planetary/planetary-formation-anchor';

import {
  PlanetaryFormationMaturityRegime,
} from '../../domain/planetary/planetary-formation-maturity-regime';

import {
  PlanetarySystemFormationBlueprint,
} from '../../domain/planetary/planetary-system-formation-blueprint';

import {
  type ProtoplanetCandidatePopulation,
} from '../../domain/planetary/protoplanet-candidate-population';

import {
  type ProtoplanetaryDiskProfile,
} from '../../domain/planetary/protoplanetary-disk-profile';

import {
  type ProtoplanetaryDiskStructure,
} from '../../domain/planetary/protoplanetary-disk-structure';

import {
  type SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

const V1_MATURATION_BRANCH =
  utf8ToBytes(
    'GENESIS-PLANETARY-FORMATION-MATURATION-V1',
  );

const V1_SOLAR_MASS_IN_EARTH_MASSES =
  332_946.0487;

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-17.7 deterministic endpoint of the protoplanetary-formation chain.
 *
 * The generator consumes the frozen 17.2-17.5 products and turns each 17.5
 * survivor into a formation anchor for phase 18. It models disk dispersal,
 * core consolidation, volatile-retention potential, gas-envelope opportunity
 * and residual dynamical excitation.
 *
 * Crucially, V1 does NOT decide final planet count, final orbital elements,
 * periods, stability, planet types, masses/radii or designations. Those
 * contracts belong to phases 18 and 19. assemblyRadiusAu is therefore a
 * formation-history anchor, not a mature orbit.
 */
export class PlanetaryFormationMaturationGenerator {

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

    planetFormationProfile:
      PlanetFormationProfile,

    candidatePopulation:
      ProtoplanetCandidatePopulation,

    earlyDynamics:
      EarlyPlanetaryDynamicsOutcome,
  ): PlanetarySystemFormationBlueprint {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        systemSeed,
        diskProfile,
        diskStructure,
        planetFormationProfile,
        candidatePopulation,
        earlyDynamics,
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

    planetFormationProfile:
      PlanetFormationProfile,

    candidatePopulation:
      ProtoplanetCandidatePopulation,

    earlyDynamics:
      EarlyPlanetaryDynamicsOutcome,
  ): PlanetarySystemFormationBlueprint {

    assertInputConsistencyV1(
      diskProfile,
      diskStructure,
      candidatePopulation,
      earlyDynamics,
    );

    const formationAnchors =
      earlyDynamics
        .bodies
        .map(
          (
            body,
            index,
          ) =>
            formationAnchorV1(
              systemSeed,
              diskProfile,
              diskStructure,
              earlyDynamics,
              body,
              index +
                1,
            ),
        );

    const sourceGasMassEarth =
      diskStructure
        .gasMassSolar *
      V1_SOLAR_MASS_IN_EARTH_MASSES;

    const maxGasCaptureBudgetEarth =
      gasCaptureBudgetV1(
        diskProfile,
        planetFormationProfile,
        sourceGasMassEarth,
        formationAnchors,
      );

    const formationCompletionAgeMillionYears =
      formationCompletionAgeV1(
        systemSeed,
        diskProfile,
        earlyDynamics,
        formationAnchors,
      );

    const regime =
      maturityRegimeV1(
        planetFormationProfile,
        earlyDynamics,
        formationAnchors,
      );

    return new PlanetarySystemFormationBlueprint(
      diskProfile
        .ageMillionYears,
      diskProfile
        .dispersalAgeMillionYears,
      formationCompletionAgeMillionYears,
      diskProfile
        .centralMassSolar,
      diskProfile
        .innerRadiusAu,
      diskProfile
        .outerRadiusAu,
      sourceGasMassEarth,
      candidatePopulation
        .sourceDustMassEarth,
      candidatePopulation
        .candidateSolidMassEarth,
      candidatePopulation
        .residualDustMassEarth,
      maxGasCaptureBudgetEarth,
      earlyDynamics
        .sourceCandidateCount,
      earlyDynamics
        .survivorCount,
      earlyDynamics
        .migratedBodyCount,
      earlyDynamics
        .collisionCount,
      regime,
      formationAnchors,
    );
  }
}

function formationAnchorV1(
  systemSeed:
    SystemSeed,

  diskProfile:
    ProtoplanetaryDiskProfile,

  diskStructure:
    ProtoplanetaryDiskStructure,

  earlyDynamics:
    EarlyPlanetaryDynamicsOutcome,

  body:
    EarlyProtoplanetBody,

  anchorOrdinal:
    number,
): PlanetaryFormationAnchor {

  const massIndex01 =
    clamp01(
      Math.log10(
        1 +
        body.solidMassEarth,
      ) /
      Math.log10(
        1 +
        25,
      ),
    );

  const impactSeverity01 =
    maximumImpactSeverityV1(
      body,
      earlyDynamics,
    );

  const collisionIndex01 =
    clamp01(
      body.collisionCount /
      3,
    );

  const dynamicalExcitationIndex01 =
    clamp01(
      0.55 *
        body.migrationStrength01 +
      0.25 *
        collisionIndex01 +
      0.20 *
        impactSeverity01,
    );

  const consolidationJitter =
    deterministicUnitV1(
      systemSeed,
      `anchor-consolidation:${lineageLabelV1(body)}`,
    );

  const consolidationIndex01 =
    clamp01(
      0.36 +
      0.27 *
        body.growthPotential01 +
      0.20 *
        massIndex01 +
      0.10 *
        (
          1 -
          dynamicalExcitationIndex01
        ) +
      0.07 *
        consolidationJitter,
    );

  const remainingDiskFraction01 =
    1 -
    diskProfile
      .evolutionProgress01;

  const gasAvailability01 =
    clamp01(
      diskStructure
        .gasMassFraction01 *
      (
        1 -
        diskStructure
          .gasDepletionIndex01
      ) *
      (
        0.55 +
        0.45 *
          remainingDiskFraction01
      ),
    );

  const envelopeJitter =
    0.90 +
    0.20 *
      deterministicUnitV1(
        systemSeed,
        `anchor-envelope:${lineageLabelV1(body)}`,
      );

  const envelopeAcquisitionPotential01 =
    clamp01(
      body
        .gasAccretionPotential01 *
      (
        0.50 +
        0.50 *
          gasAvailability01
      ) *
      (
        0.65 +
        0.35 *
          massIndex01
      ) *
      envelopeJitter,
    );

  const localTemperatureKelvin =
    diskProfile
      .referenceTemperatureAt1AuKelvin *
    body
      .orbitalRadiusAu **
      -diskStructure
        .temperaturePowerLawExponent;

  const thermalRetention01 =
    clamp01(
      (
        650 -
        localTemperatureKelvin
      ) /
      550,
    );

  const volatileJitter =
    deterministicUnitV1(
      systemSeed,
      `anchor-volatiles:${lineageLabelV1(body)}`,
    );

  const volatileRetentionPotential01 =
    clamp01(
      (
        0.10 +
        0.52 *
          body
            .compositionMixture
            .iceBearingFraction01 +
        0.33 *
          thermalRetention01 +
        0.05 *
          volatileJitter
      ) *
      (
        1 -
        0.35 *
          impactSeverity01
      ),
    );

  return new PlanetaryFormationAnchor(
    anchorOrdinal,
    body
      .sourceFormationOrdinals,
    body
      .orbitalRadiusAu,
    body
      .solidMassEarth,
    body
      .compositionMixture,
    consolidationIndex01,
    envelopeAcquisitionPotential01,
    volatileRetentionPotential01,
    dynamicalExcitationIndex01,
    body
      .collisionCount,
  );
}

function gasCaptureBudgetV1(
  diskProfile:
    ProtoplanetaryDiskProfile,

  planetFormationProfile:
    PlanetFormationProfile,

  sourceGasMassEarth:
    number,

  anchors:
    readonly PlanetaryFormationAnchor[],
): number {

  if (
    anchors.length ===
    0 ||
    sourceGasMassEarth <=
      0
  ) {
    return 0;
  }

  const meanEnvelopePotential01 =
    mean(
      anchors.map(
        anchor =>
          anchor
            .envelopeAcquisitionPotential01,
      ),
    );

  const remainingDiskFraction01 =
    1 -
    diskProfile
      .evolutionProgress01;

  const diskCaptureFraction01 =
    clamp(
      0.0002 +
      0.030 *
        planetFormationProfile
          .giantPlanetFormationPropensity *
        meanEnvelopePotential01 *
        (
          0.40 +
          0.60 *
            remainingDiskFraction01
        ),
      0,
      0.03,
    );

  const diskLimitedBudgetEarth =
    sourceGasMassEarth *
    diskCaptureFraction01;

  const coreLimitedBudgetEarth =
    sum(
      anchors.map(
        anchor => {
          const potential =
            anchor
              .envelopeAcquisitionPotential01;

          return (
            anchor
              .solidCoreMassEarth *
            potential *
            (
              4 +
              45 *
                potential
            )
          );
        },
      ),
    );

  return Math.min(
    sourceGasMassEarth,
    diskLimitedBudgetEarth,
    coreLimitedBudgetEarth,
  );
}

function formationCompletionAgeV1(
  systemSeed:
    SystemSeed,

  diskProfile:
    ProtoplanetaryDiskProfile,

  earlyDynamics:
    EarlyPlanetaryDynamicsOutcome,

  anchors:
    readonly PlanetaryFormationAnchor[],
): number {

  if (
    anchors.length ===
    0
  ) {
    return diskProfile
      .dispersalAgeMillionYears;
  }

  const migratedFraction01 =
    earlyDynamics
      .survivorCount ===
        0
      ? 0
      : earlyDynamics
          .migratedBodyCount /
        earlyDynamics
          .survivorCount;

  const collisionFraction01 =
    earlyDynamics
      .sourceCandidateCount ===
        0
      ? 0
      : earlyDynamics
          .collisionCount /
        earlyDynamics
          .sourceCandidateCount;

  const meanExcitation01 =
    mean(
      anchors.map(
        anchor =>
          anchor
            .dynamicalExcitationIndex01,
      ),
    );

  const dynamicalAssemblyIndex01 =
    clamp01(
      0.42 *
        migratedFraction01 +
      0.33 *
        collisionFraction01 +
      0.25 *
        meanExcitation01,
    );

  const deterministicTail01 =
    deterministicUnitV1(
      systemSeed,
      'formation-completion-tail',
    );

  const postDiskAssemblyTailMillionYears =
    8 +
    52 *
      dynamicalAssemblyIndex01 +
    30 *
      deterministicTail01;

  return (
    diskProfile
      .dispersalAgeMillionYears +
    postDiskAssemblyTailMillionYears
  );
}

function maturityRegimeV1(
  planetFormationProfile:
    PlanetFormationProfile,

  earlyDynamics:
    EarlyPlanetaryDynamicsOutcome,

  anchors:
    readonly PlanetaryFormationAnchor[],
): PlanetaryFormationMaturityRegime {

  if (
    anchors.length ===
    0
  ) {
    return PlanetaryFormationMaturityRegime
      .NO_PLANET_FORMING_CORES;
  }

  const meanExcitation01 =
    mean(
      anchors.map(
        anchor =>
          anchor
            .dynamicalExcitationIndex01,
      ),
    );

  const collisionFraction01 =
    earlyDynamics
      .sourceCandidateCount ===
        0
      ? 0
      : earlyDynamics
          .collisionCount /
        earlyDynamics
          .sourceCandidateCount;

  if (
    collisionFraction01 >=
      0.30 ||
    meanExcitation01 >=
      0.58
  ) {
    return PlanetaryFormationMaturityRegime
      .DYNAMICALLY_REWORKED;
  }

  const maxEnvelopePotential01 =
    Math.max(
      ...anchors.map(
        anchor =>
          anchor
            .envelopeAcquisitionPotential01,
      ),
    );

  if (
    maxEnvelopePotential01 >=
      0.55 &&
    planetFormationProfile
      .giantPlanetFormationPropensity >=
      0.35
  ) {
    return PlanetaryFormationMaturityRegime
      .GAS_ENVELOPE_FAVORED;
  }

  const totalSolidMassEarth =
    sum(
      anchors.map(
        anchor =>
          anchor
            .solidCoreMassEarth,
      ),
    );

  const iceBearingSolidFraction01 =
    totalSolidMassEarth <=
      0
      ? 0
      : sum(
        anchors.map(
          anchor =>
            anchor
              .solidCoreMassEarth *
            anchor
              .compositionMixture
              .iceBearingFraction01,
        ),
      ) /
        totalSolidMassEarth;

  const meanVolatileRetention01 =
    mean(
      anchors.map(
        anchor =>
          anchor
            .volatileRetentionPotential01,
      ),
    );

  if (
    iceBearingSolidFraction01 >=
      0.50 ||
    meanVolatileRetention01 >=
      0.65
  ) {
    return PlanetaryFormationMaturityRegime
      .VOLATILE_RICH_CORE_SYSTEM;
  }

  return PlanetaryFormationMaturityRegime
    .SOLID_CORE_SYSTEM;
}

function maximumImpactSeverityV1(
  body:
    EarlyProtoplanetBody,

  earlyDynamics:
    EarlyPlanetaryDynamicsOutcome,
): number {

  if (
    body.collisionCount ===
    0
  ) {
    return 0;
  }

  const lineage =
    new Set(
      body
        .sourceFormationOrdinals,
    );

  const relevantSeverities =
    earlyDynamics
      .collisions
      .filter(
        collision =>
          collision
            .participantSourceFormationOrdinals
            .every(
              ordinal =>
                lineage.has(
                  ordinal,
                ),
            ),
      )
      .map(
        collision =>
          collision
            .impactSeverity01,
      );

  return relevantSeverities.length ===
    0
    ? 0
    : Math.max(
      ...relevantSeverities,
    );
}

function assertInputConsistencyV1(
  diskProfile:
    ProtoplanetaryDiskProfile,

  diskStructure:
    ProtoplanetaryDiskStructure,

  candidatePopulation:
    ProtoplanetCandidatePopulation,

  earlyDynamics:
    EarlyPlanetaryDynamicsOutcome,
): void {

  if (
    !approximatelyEqual(
      diskProfile
        .diskMassSolar,
      diskStructure
        .sourceDiskMassSolar,
    ) ||
    !approximatelyEqual(
      diskProfile
        .innerRadiusAu,
      diskStructure
        .sourceInnerRadiusAu,
    ) ||
    !approximatelyEqual(
      diskProfile
        .outerRadiusAu,
      diskStructure
        .sourceOuterRadiusAu,
    )
  ) {
    throw new RangeError(
      'Point-17.7 requires the point-17.3 structure to belong to the supplied point-17.2 disk.',
    );
  }

  const expectedDustMassEarth =
    diskStructure
      .dustMassSolar *
    V1_SOLAR_MASS_IN_EARTH_MASSES;

  if (
    !approximatelyEqual(
      candidatePopulation
        .sourceDustMassEarth,
      expectedDustMassEarth,
    ) ||
    !approximatelyEqual(
      candidatePopulation
        .sourceInnerRadiusAu,
      diskProfile
        .innerRadiusAu,
    ) ||
    !approximatelyEqual(
      candidatePopulation
        .sourceOuterRadiusAu,
      diskProfile
        .outerRadiusAu,
    )
  ) {
    throw new RangeError(
      'Point-17.7 requires the point-17.4 population to belong to the supplied point-17.3 disk structure.',
    );
  }

  if (
    earlyDynamics
      .sourceCandidateCount !==
      candidatePopulation
        .candidates.length ||
    !approximatelyEqual(
      earlyDynamics
        .sourceCandidateSolidMassEarth,
      candidatePopulation
        .candidateSolidMassEarth,
    ) ||
    !approximatelyEqual(
      earlyDynamics
        .sourceInnerRadiusAu,
      diskProfile
        .innerRadiusAu,
    ) ||
    !approximatelyEqual(
      earlyDynamics
        .sourceOuterRadiusAu,
      diskProfile
        .outerRadiusAu,
    )
  ) {
    throw new RangeError(
      'Point-17.7 requires the point-17.5 outcome to belong to the supplied point-17.4 population.',
    );
  }

  const sourceCandidateOrdinals =
    new Set(
      candidatePopulation
        .candidates
        .map(
          candidate =>
            candidate
              .formationOrdinal,
        ),
    );

  for (
    const body
    of earlyDynamics
      .bodies
  ) {
    for (
      const sourceOrdinal
      of body
        .sourceFormationOrdinals
    ) {
      if (
        !sourceCandidateOrdinals.has(
          sourceOrdinal,
        )
      ) {
        throw new RangeError(
          'Point-17.5 survivor lineage must reference only point-17.4 candidate ordinals.',
        );
      }
    }
  }
}

function lineageLabelV1(
  body:
    EarlyProtoplanetBody,
): string {

  return body
    .sourceFormationOrdinals
    .join('.');
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
        V1_MATURATION_BRANCH,
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

function mean(
  values:
    readonly number[],
): number {

  return values.length ===
    0
    ? 0
    : sum(
      values,
    ) /
      values.length;
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

  min:
    number,

  max:
    number,
): number {

  return Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );
}
