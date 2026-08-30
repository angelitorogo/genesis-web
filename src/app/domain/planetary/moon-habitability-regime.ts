/**
 * Point-21.6 potential-habitability route for one relevant moon.
 *
 * These values are candidate classifications only. They do not assert life,
 * biosignatures or biological compatibility.
 */
export enum MoonHabitabilityRegime {
  NONE = 'NONE',
  SUBSURFACE_CANDIDATE = 'SUBSURFACE_CANDIDATE',
  SURFACE_CANDIDATE = 'SURFACE_CANDIDATE',
  SURFACE_AND_SUBSURFACE_CANDIDATE = 'SURFACE_AND_SUBSURFACE_CANDIDATE',
}

export function moonHabitabilityRegimeV1(
  surfaceCandidate:
    boolean,

  subsurfaceCandidate:
    boolean,
): MoonHabitabilityRegime {
  if (
    surfaceCandidate &&
    subsurfaceCandidate
  ) {
    return MoonHabitabilityRegime.SURFACE_AND_SUBSURFACE_CANDIDATE;
  }

  if (
    surfaceCandidate
  ) {
    return MoonHabitabilityRegime.SURFACE_CANDIDATE;
  }

  if (
    subsurfaceCandidate
  ) {
    return MoonHabitabilityRegime.SUBSURFACE_CANDIDATE;
  }

  return MoonHabitabilityRegime.NONE;
}
