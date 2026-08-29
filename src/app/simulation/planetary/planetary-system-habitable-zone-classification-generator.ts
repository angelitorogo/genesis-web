import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  PlanetaryOrbitHabitableZoneClassification,
} from '../../domain/planetary/planetary-orbit-habitable-zone-classification';

import {
  PlanetaryOrbitHabitableZoneRelation,
} from '../../domain/planetary/planetary-orbit-habitable-zone-relation';

import {
  type PlanetarySystemHabitableZone,
} from '../../domain/planetary/planetary-system-habitable-zone';

import {
  PlanetarySystemHabitableZoneClassification,
} from '../../domain/planetary/planetary-system-habitable-zone-classification';

import {
  type PlanetarySystemOrbitalLayout,
} from '../../domain/planetary/planetary-system-orbital-layout';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  type StellarSystem,
} from '../../domain/stellar/stellar-system';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

const EDGE_TOLERANCE_AU =
  1e-9;

/**
 * Point-18.7 pure classifier for frozen point-18.3 orbits against the frozen
 * point-18.6 HZ geometry.
 *
 * The complete radial excursion (periapsis..apoapsis) is used instead of only
 * semi-major axis. Therefore an eccentric orbit may cross one edge, or even
 * span both HZ edges. No orbital element, stability verdict, HZ edge, seed or
 * PRNG state is modified/consumed.
 */
export class PlanetarySystemHabitableZoneClassificationGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    stellarSystem:
      StellarSystem,

    orbitalLayout:
      PlanetarySystemOrbitalLayout,

    habitableZone:
      PlanetarySystemHabitableZone,
  ): PlanetarySystemHabitableZoneClassification {

    if (
      generationKey
        .generatorVersion !==
      GeneratorVersion.V1
    ) {
      throw new RangeError(
        `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
      );
    }

    if (
      !generationKey.equals(
        stellarSystem.generationKey,
      )
    ) {
      throw new RangeError(
        'PlanetarySystemHabitableZoneClassificationGenerator requires the host StellarSystem to share the supplied UniverseGenerationKey.',
      );
    }

    if (
      !sameSystemLocator(
        stellarSystem.locator,
        orbitalLayout.systemLocator,
      ) ||
      !sameSystemLocator(
        stellarSystem.locator,
        habitableZone.systemLocator,
      )
    ) {
      throw new RangeError(
        'Point-18.7 orbital layout and habitable zone must belong to the host StellarSystem locator.',
      );
    }

    if (
      orbitalLayout.orbitTopology !==
      habitableZone.orbitTopology
    ) {
      throw new RangeError(
        'Point-18.7 orbital and habitable-zone topologies must match.',
      );
    }

    const expectedTopology =
      stellarSystem.multiplicity ===
        StellarSystemMultiplicity.SINGLE
        ? PlanetarySystemOrbitTopology.CIRCUMSTELLAR
        : PlanetarySystemOrbitTopology.CIRCUMBINARY;

    if (
      orbitalLayout.orbitTopology !==
      expectedTopology
    ) {
      throw new RangeError(
        'Point-18.7 orbit topology must match the host stellar multiplicity.',
      );
    }

    const hasDynamicZone =
      habitableZone
        .hasDynamicallyAvailableHabitableZone;

    const classifications =
      orbitalLayout
        .orbits
        .map(
          orbit =>
            new PlanetaryOrbitHabitableZoneClassification(
              orbit.planetOrdinal,
              orbit.bodyLocator,
              orbit.bodySeed,
              orbit.periastronAu,
              orbit.apoastronAu,
              classifyIntervalV1(
                orbit.periastronAu,
                orbit.apoastronAu,
                habitableZone.radiativeInnerEdgeAu,
                habitableZone.radiativeOuterEdgeAu,
              ),
              hasDynamicZone
                ? classifyIntervalV1(
                    orbit.periastronAu,
                    orbit.apoastronAu,
                    habitableZone.dynamicallyHabitableInnerEdgeAu!,
                    habitableZone.dynamicallyHabitableOuterEdgeAu!,
                  )
                : null,
            ),
        );

    return new PlanetarySystemHabitableZoneClassification(
      stellarSystem.locator,
      orbitalLayout.orbitTopology,
      orbitalLayout.planetCount,
      hasDynamicZone,
      classifications,
    );
  }
}

function classifyIntervalV1(
  periastronAu:
    number,

  apoastronAu:
    number,

  innerEdgeAu:
    number,

  outerEdgeAu:
    number,
): PlanetaryOrbitHabitableZoneRelation {

  if (
    apoastronAu <
    innerEdgeAu -
      EDGE_TOLERANCE_AU
  ) {
    return PlanetaryOrbitHabitableZoneRelation.WHOLLY_INTERIOR_TO_ZONE;
  }

  if (
    periastronAu >
    outerEdgeAu +
      EDGE_TOLERANCE_AU
  ) {
    return PlanetaryOrbitHabitableZoneRelation.WHOLLY_EXTERIOR_TO_ZONE;
  }

  const crossesInner =
    periastronAu <
    innerEdgeAu -
      EDGE_TOLERANCE_AU;

  const crossesOuter =
    apoastronAu >
    outerEdgeAu +
      EDGE_TOLERANCE_AU;

  if (
    crossesInner &&
    crossesOuter
  ) {
    return PlanetaryOrbitHabitableZoneRelation.SPANS_BOTH_EDGES;
  }

  if (
    crossesInner
  ) {
    return PlanetaryOrbitHabitableZoneRelation.CROSSES_INNER_EDGE;
  }

  if (
    crossesOuter
  ) {
    return PlanetaryOrbitHabitableZoneRelation.CROSSES_OUTER_EDGE;
  }

  return PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE;
}

function sameSystemLocator(
  left:
    StellarSystem['locator'],

  right:
    PlanetarySystemOrbitalLayout['systemLocator'] |
    PlanetarySystemHabitableZone['systemLocator'],
): boolean {

  return (
    left.galaxyIndex ===
      right.galaxyIndex &&
    left.sectorKey ===
      right.sectorKey &&
    left.galacticObjectIndex ===
      right.galacticObjectIndex
  );
}
