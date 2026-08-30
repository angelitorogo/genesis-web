/**
 * Point-21.7 giant-host orbital family for one relevant moon.
 *
 * Relevant moons generated in 21.3 are the low-eccentricity/low-inclination
 * regular population. Point 21.7 therefore classifies their radial role only;
 * individually materialized irregular/captured moons are deliberately not
 * invented because the minor population is still summarized at system level.
 */
export enum GiantMoonOrbitalFamily {
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  INNER_REGULAR = 'INNER_REGULAR',
  MAJOR_REGULAR = 'MAJOR_REGULAR',
  OUTER_REGULAR = 'OUTER_REGULAR',
}

export function giantMoonOrbitalFamilyV1(
  isGiantHost:
    boolean,

  semiMajorAxisPlanetRadii:
    number,
): GiantMoonOrbitalFamily {
  if (
    !Number.isFinite(
      semiMajorAxisPlanetRadii,
    ) ||
    semiMajorAxisPlanetRadii <=
      0
  ) {
    throw new RangeError(
      'semiMajorAxisPlanetRadii must be positive and finite.',
    );
  }

  if (
    !isGiantHost
  ) {
    return GiantMoonOrbitalFamily.NOT_APPLICABLE;
  }

  if (
    semiMajorAxisPlanetRadii <=
    12
  ) {
    return GiantMoonOrbitalFamily.INNER_REGULAR;
  }

  if (
    semiMajorAxisPlanetRadii <=
    35
  ) {
    return GiantMoonOrbitalFamily.MAJOR_REGULAR;
  }

  return GiantMoonOrbitalFamily.OUTER_REGULAR;
}
