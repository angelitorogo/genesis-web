import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  PlanetaryOrbitHabitableZoneRelation,
} from '../../domain/planetary/planetary-orbit-habitable-zone-relation';

import {
  PlanetaryHabitableZonePopulationAuditEngine,
} from './planetary-habitable-zone-population-audit';

describe(
  'PlanetaryHabitableZonePopulationAuditEngine',
  () => {
    it(
      'should measure interior, intersecting, contained and exterior architecture without feeding anything back into generation',
      () => {
        const audit =
          PlanetaryHabitableZonePopulationAuditEngine
            .analyze(
              fixtureSystem(),
            );

        expect(
          audit.planetCount,
        ).toBe(4);

        expect(
          audit.innermostSemiMajorAxisAu,
        ).toBe(0.4);

        expect(
          audit.outermostSemiMajorAxisAu,
        ).toBe(2);

        expect(
          audit.radiative.whollyInterior,
        ).toBe(1);

        expect(
          audit.radiative.crossesInnerEdge,
        ).toBe(1);

        expect(
          audit.radiative.whollyWithin,
        ).toBe(1);

        expect(
          audit.radiative.whollyExterior,
        ).toBe(1);

        expect(
          audit.radiative.intersecting,
        ).toBe(2);

        expect(
          audit.dynamicallyAvailable?.intersecting,
        ).toBe(2);

        expect(
          audit.innermostOrbitToRadiativeZoneCenterRatio,
        ).toBeCloseTo(
          0.4 /
            Math.sqrt(
              0.8 *
              1.2,
            ),
          12,
        );
      },
    );

    it(
      'should aggregate population-level HZ occupancy metrics for regression batches',
      () => {
        const first =
          PlanetaryHabitableZonePopulationAuditEngine
            .analyze(
              fixtureSystem(),
            );

        const second =
          PlanetaryHabitableZonePopulationAuditEngine
            .analyze(
              fixtureSystem(
                true,
              ),
            );

        const summary =
          PlanetaryHabitableZonePopulationAuditEngine
            .summarize([
              first,
              second,
            ]);

        expect(
          summary.systemCount,
        ).toBe(2);

        expect(
          summary.systemWithPlanetsCount,
        ).toBe(2);

        expect(
          summary.radiativeIntersectingSystemCount,
        ).toBe(2);

        expect(
          summary.radiativeWhollyWithinSystemCount,
        ).toBe(2);

        expect(
          summary.dynamicallyIntersectingSystemCount,
        ).toBe(1);

        expect(
          summary.systemsWithInnermostOrbitInsideRadiativeCenterCount,
        ).toBe(2);
      },
    );
  },
);

function fixtureSystem(
  withoutDynamicZone =
    false,
): PlanetarySystem {

  const relations = [
    PlanetaryOrbitHabitableZoneRelation.WHOLLY_INTERIOR_TO_ZONE,
    PlanetaryOrbitHabitableZoneRelation.CROSSES_INNER_EDGE,
    PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
    PlanetaryOrbitHabitableZoneRelation.WHOLLY_EXTERIOR_TO_ZONE,
  ];

  const axes = [
    0.4,
    0.8,
    1,
    2,
  ];

  return {
    planetCount:
      axes.length,
    orbits:
      axes.map(
        semiMajorAxisAu => ({
          semiMajorAxisAu,
        }),
      ),
    habitableZone: {
      radiativeInnerEdgeAu:
        0.8,
      radiativeOuterEdgeAu:
        1.2,
    },
    hasDynamicallyAvailableHabitableZone:
      !withoutDynamicZone,
    orbitHabitableZoneClassifications:
      relations.map(
        relation => ({
          radiativeRelation:
            relation,
          dynamicallyAvailableRelation:
            withoutDynamicZone
              ? null
              : relation,
        }),
      ),
  } as unknown as PlanetarySystem;
}
