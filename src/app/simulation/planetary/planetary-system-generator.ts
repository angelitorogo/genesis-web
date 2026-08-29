import {
  BodyLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type BodySeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  PlanetaryArchitectureSlot,
} from '../../domain/planetary/planetary-architecture-slot';

import {
  type PlanetaryFormationAnchor,
} from '../../domain/planetary/planetary-formation-anchor';

import {
  ProtoplanetCompositionMixture,
} from '../../domain/planetary/protoplanet-composition-mixture';

import {
  PLANETARY_ARCHITECTURE_V1_COMPACT_SPAN_RATIO,
  PLANETARY_ARCHITECTURE_V1_ZONE_BREAK_RATIO,
  PlanetarySystemArchitecture,
} from '../../domain/planetary/planetary-system-architecture';

import {
  PlanetarySystemArchitectureRegime,
} from '../../domain/planetary/planetary-system-architecture-regime';

import {
  type PlanetarySystemFormationBlueprint,
} from '../../domain/planetary/planetary-system-formation-blueprint';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  type StellarSystem,
} from '../../domain/stellar/stellar-system';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  PlanetarySystemOrbitalLayoutGenerator,
} from './planetary-system-orbital-layout-generator';

import {
  PlanetarySystemOrbitalPeriodGenerator,
} from './planetary-system-orbital-period-generator';

import {
  PlanetarySystemHabitableZoneGenerator,
} from './planetary-system-habitable-zone-generator';

import {
  PlanetarySystemHabitableZoneClassificationGenerator,
} from './planetary-system-habitable-zone-classification-generator';

import {
  PlanetarySystemDesignationGenerator,
} from './planetary-system-designation-generator';

import {
  PlanetarySystemOrbitalStabilityGenerator,
} from './planetary-system-orbital-stability-generator';

const V1_SOLAR_MASS_IN_EARTH_MASSES =
  332_946.0487;

const V1_BASE_ARCHITECTURE_SEPARATION_HILL_RADII =
  4;

const V1_EXCITATION_MERGE_BOOST_HILL_RADII =
  4;

const V1_UNCONSOLIDATED_MERGE_BOOST_HILL_RADII =
  2;

const V1_HARD_MIN_REFERENCE_RADIUS_RATIO =
  1.04;

interface ArchitectureCluster {
  readonly anchors:
    readonly PlanetaryFormationAnchor[];
}

/**
 * Phase-18 deterministic planetary-system materializer.
 *
 * Point 18.2 converts the frozen point-17.7 anchors into the final mature
 * planet count and coarse radial architecture. Nearby anchors that cannot
 * sensibly remain distinct at the inherited core-mass scale are consolidated
 * using a deterministic mutual-Hill criterion. No source anchor is silently
 * discarded: every anchor is either assigned to one mature planet slot or is
 * explicitly excluded when a multiple stellar system has no V1 stable P-type
 * planetary annulus.
 *
 * Point 18.2 consumes zero PRNG draws and derives one canonical BodySeed per
 * final planet through the existing SystemSeed -> BodySeed hierarchy. Point
 * 18.3 then uses independent BodySeed-derived branches for orbital geometry.
 * Point 18.4 consumes no additional random draw and introduces no new seed
 * level. Point 18.5 likewise consumes no entropy: it assesses the frozen
 * architecture/orbits/periods without mutating them. Point 18.6 reuses the
 * frozen point-15.1/16.6 reference luminosity contracts to expose the system
 * habitable-zone geometry. Point 18.7 consumes no entropy either: it classifies
 * each frozen periapsis..apoapsis excursion against the radiative and
 * dynamically available point-18.6 intervals without moving any orbit. Point
 * 18.8 likewise consumes no entropy and only labels the existing Body identities.
 *
 * Point 18.3 delegates plausible geometric orbit materialization to the
 * dedicated PlanetarySystemOrbitalLayoutGenerator. Point 18.4 derives one
 * host-dominated Keplerian period from every frozen semi-major axis. Point 18.5
 * adds the basic orbital-stability assessment. Point 18.6 adds the reference
 * habitable-zone geometry, point 18.7 its orbit classification, and point 18.8
 * layers deterministic planet designations over the frozen point-18.2 Body
 * identities. Phase 19 owns final individual planet physics.
 */
export class PlanetarySystemGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    stellarSystem:
      StellarSystem,

    formationBlueprint:
      PlanetarySystemFormationBlueprint,
  ): PlanetarySystem {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        generationKey,
        stellarSystem,
        formationBlueprint,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    generationKey:
      UniverseGenerationKey,

    stellarSystem:
      StellarSystem,

    formationBlueprint:
      PlanetarySystemFormationBlueprint,
  ): PlanetarySystem {

    if (
      !generationKey.equals(
        stellarSystem.generationKey,
      )
    ) {
      throw new RangeError(
        'PlanetarySystemGenerator requires the host StellarSystem to share the supplied UniverseGenerationKey.',
      );
    }

    const architecture =
      generateArchitectureV1(
        generationKey,
        stellarSystem,
        formationBlueprint,
      );

    const orbitalLayout =
      PlanetarySystemOrbitalLayoutGenerator
        .generate(
          generationKey,
          stellarSystem,
          formationBlueprint,
          architecture,
        );

    const orbitalPeriodLayout =
      PlanetarySystemOrbitalPeriodGenerator
        .generate(
          generationKey,
          stellarSystem,
          formationBlueprint,
          orbitalLayout,
        );

    const stabilityAssessment =
      PlanetarySystemOrbitalStabilityGenerator
        .generate(
          generationKey,
          stellarSystem,
          architecture,
          orbitalLayout,
          orbitalPeriodLayout,
        );

    const habitableZone =
      PlanetarySystemHabitableZoneGenerator
        .generate(
          generationKey,
          stellarSystem,
        );

    const habitableZoneClassification =
      PlanetarySystemHabitableZoneClassificationGenerator
        .generate(
          generationKey,
          stellarSystem,
          orbitalLayout,
          habitableZone,
        );

    const designationCatalog =
      PlanetarySystemDesignationGenerator
        .generate(
          generationKey,
          stellarSystem,
          architecture,
        );

    return new PlanetarySystem(
      stellarSystem,
      formationBlueprint,
      architecture,
      orbitalLayout,
      orbitalPeriodLayout,
      stabilityAssessment,
      habitableZone,
      habitableZoneClassification,
      designationCatalog,
    );
  }
}

function generateArchitectureV1(
  generationKey:
    UniverseGenerationKey,

  stellarSystem:
    StellarSystem,

  formationBlueprint:
    PlanetarySystemFormationBlueprint,
): PlanetarySystemArchitecture {

  const orbitTopology =
    stellarSystem.multiplicity ===
      StellarSystemMultiplicity.SINGLE
      ? PlanetarySystemOrbitTopology.CIRCUMSTELLAR
      : PlanetarySystemOrbitTopology.CIRCUMBINARY;

  const sourceSolidCoreMassEarth =
    formationBlueprint
      .formationAnchors
      .reduce(
        (
          total,
          anchor,
        ) =>
          total +
          anchor.solidCoreMassEarth,
        0,
      );

  if (
    formationBlueprint.anchorCount ===
    0
  ) {
    return new PlanetarySystemArchitecture(
      stellarSystem.locator,
      orbitTopology,
      PlanetarySystemArchitectureRegime.EMPTY,
      0,
      0,
      0,
      0,
      [],
    );
  }

  if (
    stellarSystem.isMultiple &&
    !stellarSystem.supportsCircumbinaryPlanets
  ) {
    return new PlanetarySystemArchitecture(
      stellarSystem.locator,
      PlanetarySystemOrbitTopology.CIRCUMBINARY,
      PlanetarySystemArchitectureRegime.DYNAMICALLY_EXCLUDED,
      formationBlueprint.anchorCount,
      sourceSolidCoreMassEarth,
      formationBlueprint.anchorCount,
      sourceSolidCoreMassEarth,
      [],
    );
  }

  const clusters =
    clusterFormationAnchorsV1(
      formationBlueprint
        .formationAnchors,
      formationBlueprint
        .centralMassSolar,
    );

  const slots =
    clusters.map(
      (
        cluster,
        index,
      ) =>
        materializeSlotV1(
          generationKey,
          stellarSystem,
          cluster,
          index +
            1,
        ),
    );

  return new PlanetarySystemArchitecture(
    stellarSystem.locator,
    orbitTopology,
    classifyArchitectureV1(
      slots,
    ),
    formationBlueprint.anchorCount,
    sourceSolidCoreMassEarth,
    0,
    0,
    slots,
  );
}

function clusterFormationAnchorsV1(
  anchors:
    readonly PlanetaryFormationAnchor[],

  centralMassSolar:
    number,
): readonly ArchitectureCluster[] {

  if (
    anchors.length ===
    0
  ) {
    return Object.freeze([]);
  }

  const clusters:
    PlanetaryFormationAnchor[][] = [
      [
        anchors[0],
      ],
    ];

  for (
    let index = 1;
    index <
      anchors.length;
    index += 1
  ) {
    const anchor =
      anchors[index];

    const activeCluster =
      clusters[
        clusters.length -
          1
      ];

    if (
      shouldConsolidateV1(
        activeCluster,
        anchor,
        centralMassSolar,
      )
    ) {
      activeCluster.push(
        anchor,
      );
    } else {
      clusters.push([
        anchor,
      ]);
    }
  }

  return Object.freeze(
    clusters.map(
      cluster =>
        Object.freeze({
          anchors:
            Object.freeze([
              ...cluster,
            ]),
        }),
    ),
  );
}

function shouldConsolidateV1(
  leftAnchors:
    readonly PlanetaryFormationAnchor[],

  rightAnchor:
    PlanetaryFormationAnchor,

  centralMassSolar:
    number,
): boolean {

  const leftMassEarth =
    sumAnchorMassEarth(
      leftAnchors,
    );

  const leftRadiusAu =
    massWeightedAnchorMean(
      leftAnchors,
      anchor =>
        anchor.assemblyRadiusAu,
    );

  const radiusRatio =
    rightAnchor.assemblyRadiusAu /
    leftRadiusAu;

  if (
    radiusRatio <=
    V1_HARD_MIN_REFERENCE_RADIUS_RATIO
  ) {
    return true;
  }

  const centralMassEarth =
    centralMassSolar *
    V1_SOLAR_MASS_IN_EARTH_MASSES;

  const mutualHillRadiusAu =
    Math.cbrt(
      (
        leftMassEarth +
        rightAnchor.solidCoreMassEarth
      ) /
      (
        3 *
        centralMassEarth
      ),
    ) *
    (
      leftRadiusAu +
      rightAnchor.assemblyRadiusAu
    ) /
    2;

  const separationHillRadii =
    (
      rightAnchor.assemblyRadiusAu -
      leftRadiusAu
    ) /
    mutualHillRadiusAu;

  const leftExcitation =
    massWeightedAnchorMean(
      leftAnchors,
      anchor =>
        anchor.dynamicalExcitationIndex01,
    );

  const leftConsolidation =
    massWeightedAnchorMean(
      leftAnchors,
      anchor =>
        anchor.consolidationIndex01,
    );

  const excitation =
    Math.max(
      leftExcitation,
      rightAnchor.dynamicalExcitationIndex01,
    );

  const consolidation =
    Math.min(
      leftConsolidation,
      rightAnchor.consolidationIndex01,
    );

  const requiredSeparationHillRadii =
    V1_BASE_ARCHITECTURE_SEPARATION_HILL_RADII +
    V1_EXCITATION_MERGE_BOOST_HILL_RADII *
      excitation +
    V1_UNCONSOLIDATED_MERGE_BOOST_HILL_RADII *
      (
        1 -
        consolidation
      );

  return (
    separationHillRadii <
    requiredSeparationHillRadii
  );
}

function materializeSlotV1(
  generationKey:
    UniverseGenerationKey,

  stellarSystem:
    StellarSystem,

  cluster:
    ArchitectureCluster,

  planetOrdinal:
    number,
): PlanetaryArchitectureSlot {

  const bodyLocator =
    new BodyLocator(
      stellarSystem.locator.galaxyIndex,
      stellarSystem.locator.sectorKey,
      stellarSystem.locator.galacticObjectIndex,
      BigInt(
        planetOrdinal -
          1,
      ),
    );

  const bodySeed =
    ProceduralTargetResolver
      .resolveTargetSeed(
        generationKey,
        bodyLocator,
      ) as BodySeed;

  const anchors =
    cluster.anchors;

  const sourceAnchorOrdinals =
    anchors.map(
      anchor =>
        anchor.anchorOrdinal,
    );

  const sourceFormationOrdinals =
    Array.from(
      new Set(
        anchors.flatMap(
          anchor =>
            anchor
              .sourceFormationOrdinals,
        ),
      ),
    ).sort(
      (
        left,
        right,
      ) =>
        left -
        right,
    );

  const solidCoreMassEarth =
    sumAnchorMassEarth(
      anchors,
    );

  return new PlanetaryArchitectureSlot(
    planetOrdinal,
    bodyLocator,
    bodySeed,
    sourceAnchorOrdinals,
    sourceFormationOrdinals,
    massWeightedAnchorMean(
      anchors,
      anchor =>
        anchor.assemblyRadiusAu,
    ),
    solidCoreMassEarth,
    ProtoplanetCompositionMixture
      .mergeWeighted(
        anchors.map(
          anchor => ({
            mixture:
              anchor.compositionMixture,
            solidMassEarth:
              anchor.solidCoreMassEarth,
          }),
        ),
      ),
    massWeightedAnchorMean(
      anchors,
      anchor =>
        anchor.consolidationIndex01,
    ),
    massWeightedAnchorMean(
      anchors,
      anchor =>
        anchor.envelopeAcquisitionPotential01,
    ),
    massWeightedAnchorMean(
      anchors,
      anchor =>
        anchor.volatileRetentionPotential01,
    ),
    massWeightedAnchorMean(
      anchors,
      anchor =>
        anchor.dynamicalExcitationIndex01,
    ),
    anchors.reduce(
      (
        total,
        anchor,
      ) =>
        total +
        anchor.collisionCount,
      0,
    ),
    anchors.length -
      1,
  );
}

function classifyArchitectureV1(
  slots:
    readonly PlanetaryArchitectureSlot[],
): PlanetarySystemArchitectureRegime {

  if (
    slots.length ===
    0
  ) {
    return PlanetarySystemArchitectureRegime.EMPTY;
  }

  if (
    slots.length ===
    1
  ) {
    return PlanetarySystemArchitectureRegime.SINGLE_PLANET;
  }

  let zoneCount =
    1;

  for (
    let index = 1;
    index <
      slots.length;
    index += 1
  ) {
    const gapRatio =
      slots[index]
        .referenceAssemblyRadiusAu /
      slots[index - 1]
        .referenceAssemblyRadiusAu;

    if (
      gapRatio >=
      PLANETARY_ARCHITECTURE_V1_ZONE_BREAK_RATIO
    ) {
      zoneCount +=
        1;
    }
  }

  if (
    zoneCount >
    1
  ) {
    return PlanetarySystemArchitectureRegime.MULTI_ZONE_MULTIPLANET;
  }

  const spanRatio =
    slots[
      slots.length -
        1
    ].referenceAssemblyRadiusAu /
    slots[0]
      .referenceAssemblyRadiusAu;

  if (
    spanRatio <=
    PLANETARY_ARCHITECTURE_V1_COMPACT_SPAN_RATIO
  ) {
    return PlanetarySystemArchitectureRegime.COMPACT_MULTIPLANET;
  }

  return PlanetarySystemArchitectureRegime.DISTRIBUTED_MULTIPLANET;
}

function sumAnchorMassEarth(
  anchors:
    readonly PlanetaryFormationAnchor[],
): number {

  return anchors.reduce(
    (
      total,
      anchor,
    ) =>
      total +
      anchor.solidCoreMassEarth,
    0,
  );
}

function massWeightedAnchorMean(
  anchors:
    readonly PlanetaryFormationAnchor[],

  selector:
    (
      anchor:
        PlanetaryFormationAnchor,
    ) => number,
): number {

  const totalMassEarth =
    sumAnchorMassEarth(
      anchors,
    );

  return anchors.reduce(
    (
      total,
      anchor,
    ) =>
      total +
      selector(
        anchor,
      ) *
      anchor.solidCoreMassEarth,
    0,
  ) /
    totalMassEarth;
}
