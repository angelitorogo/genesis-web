/**
 * Point-18.7 geometric relation between one complete planetary radial excursion
 * (periapsis..apoapsis) and one habitable-zone interval.
 *
 * These values classify orbit geometry only. They do not imply that the planet
 * itself is habitable, stable over Gyr timescales, atmospheric, wet or alive.
 */
export enum PlanetaryOrbitHabitableZoneRelation {
  WHOLLY_INTERIOR_TO_ZONE =
    'WHOLLY_INTERIOR_TO_ZONE',

  CROSSES_INNER_EDGE =
    'CROSSES_INNER_EDGE',

  WHOLLY_WITHIN_ZONE =
    'WHOLLY_WITHIN_ZONE',

  CROSSES_OUTER_EDGE =
    'CROSSES_OUTER_EDGE',

  SPANS_BOTH_EDGES =
    'SPANS_BOTH_EDGES',

  WHOLLY_EXTERIOR_TO_ZONE =
    'WHOLLY_EXTERIOR_TO_ZONE',
}
