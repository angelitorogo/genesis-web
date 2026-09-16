import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  PlanetaryOrbitHabitableZoneRelation,
} from '../../domain/planetary/planetary-orbit-habitable-zone-relation';

export interface HabitableZoneRelationPopulationCounts {
  readonly whollyInterior:
    number;

  readonly crossesInnerEdge:
    number;

  readonly whollyWithin:
    number;

  readonly crossesOuterEdge:
    number;

  readonly spansBothEdges:
    number;

  readonly whollyExterior:
    number;

  readonly intersecting:
    number;
}

export interface PlanetaryHabitableZonePopulationAudit {
  readonly planetCount:
    number;

  readonly innermostSemiMajorAxisAu:
    number | null;

  readonly outermostSemiMajorAxisAu:
    number | null;

  readonly radiativeZoneCenterAu:
    number;

  readonly innermostOrbitToRadiativeZoneCenterRatio:
    number | null;

  readonly radiative:
    HabitableZoneRelationPopulationCounts;

  readonly dynamicallyAvailable:
    HabitableZoneRelationPopulationCounts | null;
}

export interface PlanetaryHabitableZonePopulationSummary {
  readonly systemCount:
    number;

  readonly systemWithPlanetsCount:
    number;

  readonly radiativeIntersectingSystemCount:
    number;

  readonly radiativeWhollyWithinSystemCount:
    number;

  readonly dynamicallyIntersectingSystemCount:
    number;

  readonly systemsWithInnermostOrbitInsideRadiativeCenterCount:
    number;
}

/**
 * QA-only scientific population projection for the phase-18 output.
 *
 * It never participates in generation and therefore cannot bias an orbit toward
 * the habitable zone. The audit exists so population regressions can ask whether
 * a generator produces a healthy mixture of interior/intersecting/exterior
 * architectures rather than relying on screenshots or one frozen seed.
 */
export class PlanetaryHabitableZonePopulationAuditEngine {

  private constructor() {}

  static analyze(
    system:
      PlanetarySystem,
  ): PlanetaryHabitableZonePopulationAudit {

    const orderedSemiMajorAxes =
      system
        .orbits
        .map(
          orbit =>
            orbit.semiMajorAxisAu,
        )
        .sort(
          (
            first,
            second,
          ) =>
            first -
            second,
        );

    const innermostSemiMajorAxisAu =
      orderedSemiMajorAxes[0] ??
      null;

    const outermostSemiMajorAxisAu =
      orderedSemiMajorAxes[
        orderedSemiMajorAxes.length -
          1
      ] ??
      null;

    const radiativeZoneCenterAu =
      Math.sqrt(
        system
          .habitableZone
          .radiativeInnerEdgeAu *
        system
          .habitableZone
          .radiativeOuterEdgeAu,
      );

    const classifications =
      system
        .orbitHabitableZoneClassifications;

    const radiative =
      relationPopulationCounts(
        classifications.map(
          classification =>
            classification.radiativeRelation,
        ),
      );

    const dynamicallyAvailable =
      system
        .hasDynamicallyAvailableHabitableZone
        ? relationPopulationCounts(
            classifications.map(
              classification => {
                const relation =
                  classification
                    .dynamicallyAvailableRelation;

                if (
                  relation ===
                  null
                ) {
                  throw new RangeError(
                    'A dynamically available habitable zone requires one dynamic relation per orbit.',
                  );
                }

                return relation;
              },
            ),
          )
        : null;

    return Object.freeze({
      planetCount:
        system.planetCount,
      innermostSemiMajorAxisAu,
      outermostSemiMajorAxisAu,
      radiativeZoneCenterAu,
      innermostOrbitToRadiativeZoneCenterRatio:
        innermostSemiMajorAxisAu ===
          null
          ? null
          : innermostSemiMajorAxisAu /
            radiativeZoneCenterAu,
      radiative,
      dynamicallyAvailable,
    });
  }

  static summarize(
    audits:
      readonly PlanetaryHabitableZonePopulationAudit[],
  ): PlanetaryHabitableZonePopulationSummary {

    return Object.freeze({
      systemCount:
        audits.length,
      systemWithPlanetsCount:
        audits.filter(
          audit =>
            audit.planetCount >
            0,
        ).length,
      radiativeIntersectingSystemCount:
        audits.filter(
          audit =>
            audit.radiative.intersecting >
            0,
        ).length,
      radiativeWhollyWithinSystemCount:
        audits.filter(
          audit =>
            audit.radiative.whollyWithin >
            0,
        ).length,
      dynamicallyIntersectingSystemCount:
        audits.filter(
          audit =>
            (
              audit
                .dynamicallyAvailable
                ?.intersecting ??
              0
            ) >
            0,
        ).length,
      systemsWithInnermostOrbitInsideRadiativeCenterCount:
        audits.filter(
          audit =>
            audit
              .innermostOrbitToRadiativeZoneCenterRatio !==
              null &&
            audit
              .innermostOrbitToRadiativeZoneCenterRatio <
              1,
        ).length,
    });
  }
}

function relationPopulationCounts(
  relations:
    readonly PlanetaryOrbitHabitableZoneRelation[],
): HabitableZoneRelationPopulationCounts {

  const whollyInterior =
    countRelation(
      relations,
      PlanetaryOrbitHabitableZoneRelation.WHOLLY_INTERIOR_TO_ZONE,
    );

  const crossesInnerEdge =
    countRelation(
      relations,
      PlanetaryOrbitHabitableZoneRelation.CROSSES_INNER_EDGE,
    );

  const whollyWithin =
    countRelation(
      relations,
      PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
    );

  const crossesOuterEdge =
    countRelation(
      relations,
      PlanetaryOrbitHabitableZoneRelation.CROSSES_OUTER_EDGE,
    );

  const spansBothEdges =
    countRelation(
      relations,
      PlanetaryOrbitHabitableZoneRelation.SPANS_BOTH_EDGES,
    );

  const whollyExterior =
    countRelation(
      relations,
      PlanetaryOrbitHabitableZoneRelation.WHOLLY_EXTERIOR_TO_ZONE,
    );

  return Object.freeze({
    whollyInterior,
    crossesInnerEdge,
    whollyWithin,
    crossesOuterEdge,
    spansBothEdges,
    whollyExterior,
    intersecting:
      crossesInnerEdge +
      whollyWithin +
      crossesOuterEdge +
      spansBothEdges,
  });
}

function countRelation(
  relations:
    readonly PlanetaryOrbitHabitableZoneRelation[],

  relation:
    PlanetaryOrbitHabitableZoneRelation,
): number {

  return relations.filter(
    candidate =>
      candidate ===
      relation,
  ).length;
}
