import {
  MinorBodyApproachTargetKind,
  type MinorBodyApproachTargetKindValue,
} from './minor-body-approach-target-kind';

import {
  type MinorBodyOrbitalElementsCatalog,
} from './minor-body-orbital-elements-catalog';

import {
  type MinorBodyOrbitProximityAssessment,
} from './minor-body-orbit-proximity-assessment';

import {
  type MoonSystem,
} from './moon-system';

import {
  type Planet,
} from './planet';

/**
 * Point-23.3 full geometry matrix between every existing point-23.2 minor body
 * and every assessable mature planet / relevant moon.
 *
 * Only point-21.3 relevant moons have individually materialized orbital
 * geometry. The catalog therefore reports the number of unmaterialized minor
 * moons separately instead of pretending that their paths were assessed.
 */
export class MinorBodyOrbitProximityCatalog {

  readonly planets:
    readonly Planet[];

  readonly moonSystems:
    readonly MoonSystem[];

  readonly assessments:
    readonly MinorBodyOrbitProximityAssessment[];

  constructor(
    readonly orbitalCatalog:
      MinorBodyOrbitalElementsCatalog,

    planets:
      readonly Planet[],

    moonSystems:
      readonly MoonSystem[],

    assessments:
      readonly MinorBodyOrbitProximityAssessment[],
  ) {
    validateTargetContext(
      orbitalCatalog,
      planets,
      moonSystems,
    );

    this.planets =
      Object.freeze([
        ...planets,
      ]);

    this.moonSystems =
      Object.freeze([
        ...moonSystems,
      ]);

    this.assessments =
      Object.freeze([
        ...assessments,
      ]);

    validateAssessmentMatrix(
      this.orbitalCatalog,
      this.planets,
      this.moonSystems,
      this.assessments,
    );
  }

  get minorBodyCount():
    number {
    return this
      .orbitalCatalog
      .existingObjectCount;
  }

  get planetTargetCount():
    number {
    return this.planets.length;
  }

  get relevantMoonTargetCount():
    number {
    return this.moonSystems.reduce(
      (
        total,
        moonSystem,
      ) =>
        total +
        moonSystem
          .relevantMoonCount,
      0,
    );
  }

  get unmaterializedMinorMoonCount():
    number {
    return this.moonSystems.reduce(
      (
        total,
        moonSystem,
      ) =>
        total +
        moonSystem
          .unmaterializedMinorMoonCount,
      0,
    );
  }

  get assessableTargetCount():
    number {
    return (
      this.planetTargetCount +
      this.relevantMoonTargetCount
    );
  }

  get assessmentCount():
    number {
    return this.assessments.length;
  }

  get radialCrossingCount():
    number {
    return this.assessments.filter(
      assessment =>
        assessment
          .radialRangesOverlap,
    ).length;
  }

  get approachPossibleCount():
    number {
    return this.assessments.filter(
      assessment =>
        assessment
          .approachPossible,
    ).length;
  }

  get relevantAssessments():
    readonly MinorBodyOrbitProximityAssessment[] {
    return Object.freeze(
      this.assessments.filter(
        assessment =>
          assessment
            .radialRangesOverlap ||
          assessment
            .approachPossible,
      ),
    );
  }

  forMinorBody(
    proceduralId:
      string,
  ):
    readonly MinorBodyOrbitProximityAssessment[] {
    return Object.freeze(
      this.assessments.filter(
        assessment =>
          assessment
            .minorBodyProceduralId ===
          proceduralId,
      ),
    );
  }

  forTargetKind(
    targetKind:
      MinorBodyApproachTargetKindValue,
  ):
    readonly MinorBodyOrbitProximityAssessment[] {
    if (
      !MinorBodyApproachTargetKind
        .values
        .includes(
          targetKind,
        )
    ) {
      throw new RangeError(
        'targetKind must be a known MinorBodyApproachTargetKind.',
      );
    }

    return Object.freeze(
      this.assessments.filter(
        assessment =>
          assessment.targetKind ===
          targetKind,
      ),
    );
  }
}

function validateTargetContext(
  orbitalCatalog:
    MinorBodyOrbitalElementsCatalog,

  planets:
    readonly Planet[],

  moonSystems:
    readonly MoonSystem[],
): void {
  const planetarySystem =
    orbitalCatalog
      .dynamicsState
      .hostPlanetarySystem;

  if (
    planets.length !==
    planetarySystem.planetCount
  ) {
    throw new RangeError(
      'Point-23.3 requires exactly one materialized Planet for every mature planet in the host PlanetarySystem.',
    );
  }

  if (
    moonSystems.length !==
    planets.length
  ) {
    throw new RangeError(
      'Point-23.3 requires exactly one MoonSystem for every materialized Planet.',
    );
  }

  for (
    let index = 0;
    index <
      planets.length;
    index += 1
  ) {
    const planet =
      planets[index];

    const moonSystem =
      moonSystems[index];

    if (
      planet.hostPlanetarySystem !==
        planetarySystem ||
      planet.planetOrdinal !==
        index +
          1
    ) {
      throw new RangeError(
        'Point-23.3 Planet targets must preserve the exact host PlanetarySystem and contiguous planetOrdinal order.',
      );
    }

    if (
      moonSystem.hostPlanet !==
      planet
    ) {
      throw new RangeError(
        'Point-23.3 MoonSystem targets must reference the exact materialized Planet instance at the same ordinal.',
      );
    }
  }
}

function validateAssessmentMatrix(
  orbitalCatalog:
    MinorBodyOrbitalElementsCatalog,

  planets:
    readonly Planet[],

  moonSystems:
    readonly MoonSystem[],

  assessments:
    readonly MinorBodyOrbitProximityAssessment[],
): void {
  const relevantMoons =
    moonSystems.flatMap(
      moonSystem =>
        moonSystem
          .relevantMoons,
    );

  const expectedTargetCount =
    planets.length +
    relevantMoons.length;

  const expectedAssessmentCount =
    orbitalCatalog
      .existingObjectCount *
    expectedTargetCount;

  if (
    assessments.length !==
    expectedAssessmentCount
  ) {
    throw new RangeError(
      'MinorBodyOrbitProximityCatalog requires one point-23.3 assessment for every minor-body x assessable-target pair.',
    );
  }

  let cursor =
    0;

  for (
    const minorBody
    of orbitalCatalog.entries
  ) {
    for (
      const planet
      of planets
    ) {
      const assessment =
        assessments[cursor];

      if (
        assessment.minorBody !==
          minorBody ||
        assessment.targetKind !==
          MinorBodyApproachTargetKind.PLANET ||
        assessment.targetPlanet !==
          planet ||
        assessment.targetMoon !==
          null
      ) {
        throw new RangeError(
          'Point-23.3 planet assessments must preserve deterministic minor-body/planet matrix order and exact object references.',
        );
      }

      cursor +=
        1;
    }

    for (
      const moon
      of relevantMoons
    ) {
      const assessment =
        assessments[cursor];

      const hostPlanet =
        planets[
          moon.hostPlanetOrdinal -
            1
        ];

      if (
        assessment.minorBody !==
          minorBody ||
        assessment.targetKind !==
          MinorBodyApproachTargetKind.MOON ||
        assessment.targetPlanet !==
          hostPlanet ||
        assessment.targetMoon !==
          moon
      ) {
        throw new RangeError(
          'Point-23.3 moon assessments must preserve deterministic minor-body/relevant-moon matrix order and exact object references.',
        );
      }

      cursor +=
        1;
    }
  }
}
