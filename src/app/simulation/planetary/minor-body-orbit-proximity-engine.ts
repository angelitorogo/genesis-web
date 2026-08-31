import {
  MinorBodyApproachTargetKind,
} from '../../domain/planetary/minor-body-approach-target-kind';

import {
  type MinorBodyOrbitalElements,
} from '../../domain/planetary/minor-body-orbital-elements';

import {
  type MinorBodyOrbitalElementsCatalog,
  type MinorBodyOrbitalElementsCatalogEntry,
} from '../../domain/planetary/minor-body-orbital-elements-catalog';

import {
  MinorBodyOrbitProximityAssessment,
} from '../../domain/planetary/minor-body-orbit-proximity-assessment';

import {
  MinorBodyOrbitProximityCatalog,
} from '../../domain/planetary/minor-body-orbit-proximity-catalog';

import {
  MinorBodyOrbitProximityRegime,
} from '../../domain/planetary/minor-body-orbit-proximity-regime';

import {
  type MoonSystem,
} from '../../domain/planetary/moon-system';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  type PlanetaryOrbitalElements,
} from '../../domain/planetary/planetary-orbital-elements';

import {
  type RelevantMoon,
} from '../../domain/planetary/relevant-moon';

const EARTH_MASSES_PER_SOLAR_MASS =
  332_946.0487;

const ASTRONOMICAL_UNIT_KILOMETERS =
  149_597_870.7;

const PLANE_PARALLEL_TOLERANCE =
  1e-10;

const RADIAL_TOLERANCE_AU =
  1e-12;

const COPLANAR_SAMPLE_COUNT =
  720;

interface OrbitGeometry {
  readonly semiMajorAxisAu:
    number;

  readonly eccentricity:
    number;

  readonly inclinationDegrees:
    number;

  readonly longitudeAscendingNodeDegrees:
    number;

  readonly argumentOfPeriapsisDegrees:
    number;

  readonly periapsisAu:
    number;

  readonly apoapsisAu:
    number | null;
}

interface NodeGeometry {
  readonly mutualInclinationDegrees:
    number;

  readonly minimumNodalSeparationAu:
    number | null;
}

/**
 * Point-23.3 deterministic geometry-only orbit crossing / approach analyzer.
 *
 * This is deliberately not a propagator. It does not ask whether a minor body
 * and target arrive at the same place at the same time. Instead it establishes
 * the static geometry required by later dynamics:
 *
 * - radial stellar-distance overlap;
 * - mutual-orbit inclination;
 * - minimum radial separation at the shared-focus mutual node(s);
 * - entry into a target-specific approach corridor.
 *
 * Planet corridors use one Hill radius evaluated at planetary periapsis. Moon
 * corridors use the relevant moon's planetocentric apoapsis around the host
 * planet because point 21.3 does not freeze a complete heliocentric lunar
 * orientation. Therefore a moon result means "can enter the moon orbital
 * region", not a time-resolved moon encounter. Close encounters remain 23.6.
 */
export class MinorBodyOrbitProximityEngine {

  private constructor() {}

  static generate(
    orbitalCatalog:
      MinorBodyOrbitalElementsCatalog,

    planets:
      readonly Planet[],

    moonSystems:
      readonly MoonSystem[],
  ): MinorBodyOrbitProximityCatalog {
    const hostMassSolar =
      targetHostMassSolarV1(
        orbitalCatalog,
        planets.length,
      );

    const relevantMoons =
      moonSystems.flatMap(
        moonSystem =>
          moonSystem
            .relevantMoons,
      );

    const assessments:
      MinorBodyOrbitProximityAssessment[] =
      [];

    for (
      const minorBody
      of orbitalCatalog.entries
    ) {
      const planetGeometry =
        new Map<
          number,
          NodeGeometry
        >();

      for (
        const planet
        of planets
      ) {
        const assessment =
          planetAssessmentV1(
            minorBody,
            planet,
            hostMassSolar,
          );

        assessments.push(
          assessment,
        );

        planetGeometry.set(
          planet.planetOrdinal,
          Object.freeze({
            mutualInclinationDegrees:
              assessment
                .mutualInclinationDegrees,
            minimumNodalSeparationAu:
              assessment
                .minimumNodalSeparationAu,
          }),
        );
      }

      for (
        const moon
        of relevantMoons
      ) {
        const hostPlanet =
          planets[
            moon.hostPlanetOrdinal -
              1
          ];

        const geometry =
          planetGeometry.get(
            moon.hostPlanetOrdinal,
          );

        if (
          hostPlanet ===
            undefined ||
          geometry ===
            undefined
        ) {
          throw new RangeError(
            'Point-23.3 relevant moon target must resolve its exact host Planet geometry.',
          );
        }

        assessments.push(
          moonAssessmentV1(
            minorBody,
            hostPlanet,
            moon,
            geometry,
          ),
        );
      }
    }

    return new MinorBodyOrbitProximityCatalog(
      orbitalCatalog,
      planets,
      moonSystems,
      assessments,
    );
  }
}

function planetAssessmentV1(
  minorBody:
    MinorBodyOrbitalElementsCatalogEntry,

  planet:
    Planet,

  hostMassSolar:
    number,
): MinorBodyOrbitProximityAssessment {
  const minorOrbit =
    minorBody
      .orbitalElements;

  const planetOrbit =
    planetOrbitGeometryV1(
      planet.orbit,
    );

  const radialGapAu =
    radialIntervalGapAu(
      minorOrbit.periapsisAu,
      minorOrbit.apoapsisAu,
      planetOrbit.periapsisAu,
      planetOrbit.apoapsisAu,
    );

  const radialRangesOverlap =
    radialGapAu <=
    RADIAL_TOLERANCE_AU;

  const nodeGeometry =
    nodeGeometryV1(
      minorOrbit,
      planetOrbit,
    );

  const targetCorridorRadiusAu =
    planetaryHillRadiusAtPeriapsisAuV1(
      planet,
      hostMassSolar,
    );

  return proximityAssessmentV1(
    minorBody,
    MinorBodyApproachTargetKind.PLANET,
    planet,
    null,
    radialRangesOverlap,
    radialGapAu,
    nodeGeometry,
    targetCorridorRadiusAu,
  );
}

function moonAssessmentV1(
  minorBody:
    MinorBodyOrbitalElementsCatalogEntry,

  hostPlanet:
    Planet,

  moon:
    RelevantMoon,

  hostPlanetNodeGeometry:
    NodeGeometry,
): MinorBodyOrbitProximityAssessment {
  const moonCorridorRadiusAu =
    moonPlanetocentricApoapsisAuV1(
      moon,
    );

  const hostOrbit =
    planetOrbitGeometryV1(
      hostPlanet.orbit,
    );

  const corridorInnerAu =
    Math.max(
      0,
      hostOrbit.periapsisAu -
        moonCorridorRadiusAu,
    );

  const corridorOuterAu =
    (
      hostOrbit.apoapsisAu ??
      hostOrbit.periapsisAu
    ) +
    moonCorridorRadiusAu;

  const minorOrbit =
    minorBody
      .orbitalElements;

  const radialGapAu =
    radialIntervalGapAu(
      minorOrbit.periapsisAu,
      minorOrbit.apoapsisAu,
      corridorInnerAu,
      corridorOuterAu,
    );

  return proximityAssessmentV1(
    minorBody,
    MinorBodyApproachTargetKind.MOON,
    hostPlanet,
    moon,
    radialGapAu <=
      RADIAL_TOLERANCE_AU,
    radialGapAu,
    hostPlanetNodeGeometry,
    moonCorridorRadiusAu,
  );
}

function proximityAssessmentV1(
  minorBody:
    MinorBodyOrbitalElementsCatalogEntry,

  targetKind:
    typeof MinorBodyApproachTargetKind.PLANET |
    typeof MinorBodyApproachTargetKind.MOON,

  targetPlanet:
    Planet,

  targetMoon:
    RelevantMoon | null,

  radialRangesOverlap:
    boolean,

  radialGapAu:
    number,

  nodeGeometry:
    NodeGeometry,

  targetCorridorRadiusAu:
    number,
): MinorBodyOrbitProximityAssessment {
  const minimumNodalSeparationAu =
    nodeGeometry
      .minimumNodalSeparationAu;

  const corridorClearanceAu =
    minimumNodalSeparationAu ===
      null
      ? null
      : Math.max(
          0,
          minimumNodalSeparationAu -
            targetCorridorRadiusAu,
        );

  const approachPossible =
    corridorClearanceAu !==
      null &&
    corridorClearanceAu <=
      RADIAL_TOLERANCE_AU;

  const regime =
    approachPossible
      ? MinorBodyOrbitProximityRegime
          .APPROACH_CORRIDOR
      : radialRangesOverlap
        ? MinorBodyOrbitProximityRegime
            .RADIAL_CROSSING
        : MinorBodyOrbitProximityRegime
            .DISJOINT;

  return new MinorBodyOrbitProximityAssessment(
    minorBody,
    targetKind,
    targetPlanet,
    targetMoon,
    radialRangesOverlap,
    radialGapAu,
    nodeGeometry
      .mutualInclinationDegrees,
    minimumNodalSeparationAu,
    targetCorridorRadiusAu,
    corridorClearanceAu,
    approachPossible,
    regime,
  );
}

function targetHostMassSolarV1(
  orbitalCatalog:
    MinorBodyOrbitalElementsCatalog,

  planetCount:
    number,
): number {
  if (
    planetCount ===
    0
  ) {
    return 1;
  }

  const cached =
    orbitalCatalog
      .dynamicsState
      .hostPlanetarySystem
      .orbitalPeriodLayout
      .gravitatingMassSolar;

  if (
    cached ===
      null ||
    !Number.isFinite(
      cached,
    ) ||
    cached <=
      0
  ) {
    throw new RangeError(
      'Point-23.3 planet targets require the frozen positive point-18.4 gravitating host mass.',
    );
  }

  return cached;
}

function planetaryHillRadiusAtPeriapsisAuV1(
  planet:
    Planet,

  hostMassSolar:
    number,
): number {
  if (
    !Number.isFinite(
      planet.massEarth,
    ) ||
    planet.massEarth <=
      0
  ) {
    throw new RangeError(
      'Point-23.3 planet targets require a positive finite point-19 massEarth.',
    );
  }

  const hostMassEarth =
    hostMassSolar *
    EARTH_MASSES_PER_SOLAR_MASS;

  return planet.orbit.periastronAu *
    Math.cbrt(
      planet.massEarth /
      (
        3 *
        hostMassEarth
      ),
    );
}

function moonPlanetocentricApoapsisAuV1(
  moon:
    RelevantMoon,
): number {
  const apoapsisKilometers =
    moon.orbit
      .semiMajorAxisKilometers *
    (
      1 +
      moon.orbit.eccentricity
    );

  return apoapsisKilometers /
    ASTRONOMICAL_UNIT_KILOMETERS;
}

function planetOrbitGeometryV1(
  orbit:
    PlanetaryOrbitalElements,
): OrbitGeometry {
  return Object.freeze({
    semiMajorAxisAu:
      orbit.semiMajorAxisAu,
    eccentricity:
      orbit.eccentricity,
    inclinationDegrees:
      orbit.inclinationDegrees,
    longitudeAscendingNodeDegrees:
      orbit.longitudeOfAscendingNodeDegrees,
    argumentOfPeriapsisDegrees:
      orbit.argumentOfPeriapsisDegrees,
    periapsisAu:
      orbit.periastronAu,
    apoapsisAu:
      orbit.apoastronAu,
  });
}

function radialIntervalGapAu(
  firstPeriapsisAu:
    number,

  firstApoapsisAu:
    number | null,

  secondPeriapsisAu:
    number,

  secondApoapsisAu:
    number | null,
): number {
  const firstOuter =
    firstApoapsisAu ??
    Number.POSITIVE_INFINITY;

  const secondOuter =
    secondApoapsisAu ??
    Number.POSITIVE_INFINITY;

  if (
    firstOuter <
    secondPeriapsisAu
  ) {
    return secondPeriapsisAu -
      firstOuter;
  }

  if (
    secondOuter <
    firstPeriapsisAu
  ) {
    return firstPeriapsisAu -
      secondOuter;
  }

  return 0;
}

function nodeGeometryV1(
  minorOrbit:
    MinorBodyOrbitalElements,

  targetOrbit:
    OrbitGeometry,
): NodeGeometry {
  const first =
    orbitalFrameV1(
      minorOrbit,
    );

  const second =
    orbitalFrameV1(
      targetOrbit,
    );

  const normalDot =
    clamp(
      dot(
        first.normal,
        second.normal,
      ),
      -1,
      1,
    );

  const mutualInclinationDegrees =
    Math.acos(
      normalDot,
    ) *
    180 /
    Math.PI;

  const nodeLine =
    cross(
      first.normal,
      second.normal,
    );

  const nodeMagnitude =
    magnitude(
      nodeLine,
    );

  const minimumNodalSeparationAu =
    nodeMagnitude <=
      PLANE_PARALLEL_TOLERANCE
      ? coplanarMinimumRadialSeparationAuV1(
          minorOrbit,
          targetOrbit,
          first,
        )
      : mutualNodeRadialSeparationAuV1(
          minorOrbit,
          targetOrbit,
          first,
          second,
          scale(
            nodeLine,
            1 /
              nodeMagnitude,
          ),
        );

  return Object.freeze({
    mutualInclinationDegrees,
    minimumNodalSeparationAu,
  });
}

interface Vector3 {
  readonly x:
    number;
  readonly y:
    number;
  readonly z:
    number;
}

interface OrbitalFrame {
  readonly periapsisDirection:
    Vector3;
  readonly transverseDirection:
    Vector3;
  readonly normal:
    Vector3;
}

function orbitalFrameV1(
  orbit:
    Pick<
      OrbitGeometry,
      | 'inclinationDegrees'
      | 'longitudeAscendingNodeDegrees'
      | 'argumentOfPeriapsisDegrees'
    >,
): OrbitalFrame {
  const inclination =
    radians(
      orbit.inclinationDegrees,
    );

  const node =
    radians(
      orbit.longitudeAscendingNodeDegrees,
    );

  const periapsis =
    radians(
      orbit.argumentOfPeriapsisDegrees,
    );

  const cosNode =
    Math.cos(node);
  const sinNode =
    Math.sin(node);
  const cosPeriapsis =
    Math.cos(periapsis);
  const sinPeriapsis =
    Math.sin(periapsis);
  const cosInclination =
    Math.cos(inclination);
  const sinInclination =
    Math.sin(inclination);

  const periapsisDirection =
    Object.freeze({
      x:
        cosNode *
          cosPeriapsis -
        sinNode *
          sinPeriapsis *
          cosInclination,
      y:
        sinNode *
          cosPeriapsis +
        cosNode *
          sinPeriapsis *
          cosInclination,
      z:
        sinPeriapsis *
        sinInclination,
    });

  const transverseDirection =
    Object.freeze({
      x:
        -cosNode *
          sinPeriapsis -
        sinNode *
          cosPeriapsis *
          cosInclination,
      y:
        -sinNode *
          sinPeriapsis +
        cosNode *
          cosPeriapsis *
          cosInclination,
      z:
        cosPeriapsis *
        sinInclination,
    });

  return Object.freeze({
    periapsisDirection,
    transverseDirection,
    normal:
      normalize(
        cross(
          periapsisDirection,
          transverseDirection,
        ),
      ),
  });
}

function mutualNodeRadialSeparationAuV1(
  firstOrbit:
    OrbitGeometry,

  secondOrbit:
    OrbitGeometry,

  firstFrame:
    OrbitalFrame,

  secondFrame:
    OrbitalFrame,

  nodeDirection:
    Vector3,
): number | null {
  const candidates:
    number[] =
    [];

  for (
    const direction
    of [
      nodeDirection,
      scale(
        nodeDirection,
        -1,
      ),
    ]
  ) {
    const firstRadius =
      radiusAtDirectionAuV1(
        firstOrbit,
        firstFrame,
        direction,
      );

    const secondRadius =
      radiusAtDirectionAuV1(
        secondOrbit,
        secondFrame,
        direction,
      );

    if (
      firstRadius !==
        null &&
      secondRadius !==
        null
    ) {
      candidates.push(
        Math.abs(
          firstRadius -
          secondRadius,
        ),
      );
    }
  }

  if (
    candidates.length ===
    0
  ) {
    return null;
  }

  return Math.min(
    ...candidates,
  );
}

function coplanarMinimumRadialSeparationAuV1(
  firstOrbit:
    OrbitGeometry,

  secondOrbit:
    OrbitGeometry,

  firstFrame:
    OrbitalFrame,
): number | null {
  let minimum =
    Number.POSITIVE_INFINITY;

  const secondFrame =
    orbitalFrameV1(
      secondOrbit,
    );

  for (
    let index = 0;
    index <
      COPLANAR_SAMPLE_COUNT;
    index += 1
  ) {
    const angle =
      2 *
      Math.PI *
      index /
      COPLANAR_SAMPLE_COUNT;

    const direction =
      add(
        scale(
          firstFrame
            .periapsisDirection,
          Math.cos(angle),
        ),
        scale(
          firstFrame
            .transverseDirection,
          Math.sin(angle),
        ),
      );

    const firstRadius =
      radiusAtDirectionAuV1(
        firstOrbit,
        firstFrame,
        direction,
      );

    if (
      firstRadius ===
      null
    ) {
      continue;
    }

    const secondRadius =
      radiusAtDirectionAuV1(
        secondOrbit,
        secondFrame,
        direction,
      );

    if (
      secondRadius ===
      null
    ) {
      continue;
    }

    minimum =
      Math.min(
        minimum,
        Math.abs(
          firstRadius -
          secondRadius,
        ),
      );
  }

  return Number.isFinite(
    minimum,
  )
    ? minimum
    : null;
}

function radiusAtDirectionAuV1(
  orbit:
    OrbitGeometry,

  frame:
    OrbitalFrame,

  direction:
    Vector3,
): number | null {
  const cosTrueAnomaly =
    clamp(
      dot(
        direction,
        frame.periapsisDirection,
      ),
      -1,
      1,
    );

  const denominator =
    1 +
    orbit.eccentricity *
      cosTrueAnomaly;

  if (
    denominator <=
    0
  ) {
    return null;
  }

  const semiLatusRectumAu =
    orbit.semiMajorAxisAu *
    (
      1 -
      orbit.eccentricity **
        2
    );

  const radiusAu =
    semiLatusRectumAu /
    denominator;

  return Number.isFinite(
    radiusAu,
  ) &&
    radiusAu >
      0
    ? radiusAu
    : null;
}

function radians(
  degrees:
    number,
): number {
  return degrees *
    Math.PI /
    180;
}

function dot(
  first:
    Vector3,

  second:
    Vector3,
): number {
  return (
    first.x *
      second.x +
    first.y *
      second.y +
    first.z *
      second.z
  );
}

function cross(
  first:
    Vector3,

  second:
    Vector3,
): Vector3 {
  return Object.freeze({
    x:
      first.y *
        second.z -
      first.z *
        second.y,
    y:
      first.z *
        second.x -
      first.x *
        second.z,
    z:
      first.x *
        second.y -
      first.y *
        second.x,
  });
}

function magnitude(
  vector:
    Vector3,
): number {
  return Math.sqrt(
    dot(
      vector,
      vector,
    ),
  );
}

function normalize(
  vector:
    Vector3,
): Vector3 {
  const length =
    magnitude(
      vector,
    );

  if (
    !Number.isFinite(
      length,
    ) ||
    length <=
      0
  ) {
    throw new RangeError(
      'Cannot normalize a zero/non-finite orbital vector.',
    );
  }

  return scale(
    vector,
    1 /
      length,
  );
}

function scale(
  vector:
    Vector3,

  scalar:
    number,
): Vector3 {
  return Object.freeze({
    x:
      vector.x *
      scalar,
    y:
      vector.y *
      scalar,
    z:
      vector.z *
      scalar,
  });
}

function add(
  first:
    Vector3,

  second:
    Vector3,
): Vector3 {
  return Object.freeze({
    x:
      first.x +
      second.x,
    y:
      first.y +
      second.y,
    z:
      first.z +
      second.z,
  });
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
