import {
  type RelevantAsteroid,
} from '../../domain/planetary/relevant-asteroid';

import {
  type RelevantCapturedExtrasolarObject,
} from '../../domain/planetary/relevant-captured-extrasolar-object';

import {
  type RelevantComet,
} from '../../domain/planetary/relevant-comet';

import {
  type RelevantInterstellarObject,
} from '../../domain/planetary/relevant-interstellar-object';

import {
  type RelevantTransNeptunianObject,
} from '../../domain/planetary/relevant-trans-neptunian-object';

import {
  type MinorBodyDynamicsState,
} from '../../domain/planetary/minor-body-dynamics-state';

import {
  MinorBodyKind,
} from '../../domain/planetary/minor-body-kind';

import {
  MinorBodyOrbitConicRegime,
} from '../../domain/planetary/minor-body-orbit-conic-regime';

import {
  MinorBodyOrbitalElements,
} from '../../domain/planetary/minor-body-orbital-elements';

import {
  MinorBodyOrbitalElementsCatalog,
  type MinorBodyOrbitalElementsCatalogEntry,
} from '../../domain/planetary/minor-body-orbital-elements-catalog';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

/**
 * Point-23.2 phase-22 -> phase-23 orbital normalizer.
 *
 * This engine consumes no entropy and never mutates/re-generates a minor body.
 * It only projects the already-frozen family-specific orbital contracts into a
 * common representation suitable for crossings/resonances/encounters in
 * points 23.3+.
 */
export class MinorBodyOrbitalElementsEngine {

  private constructor() {}

  static generate(
    dynamicsState:
      MinorBodyDynamicsState,
  ): MinorBodyOrbitalElementsCatalog {
    const entries:
      MinorBodyOrbitalElementsCatalogEntry[] =
      [];

    const asteroidMassSolar =
      asteroidReferenceHostMassSolarV1(
        dynamicsState,
      );

    for (
      const body
      of dynamicsState
        .groundTruthInventory
        .asteroids
    ) {
      entries.push(
        Object.freeze({
          body,
          orbitalElements:
            asteroidOrbitalElementsV1(
              body,
              asteroidMassSolar,
            ),
        }),
      );
    }

    for (
      const body
      of dynamicsState
        .groundTruthInventory
        .comets
    ) {
      entries.push(
        Object.freeze({
          body,
          orbitalElements:
            cometOrbitalElementsV1(
              body,
            ),
        }),
      );
    }

    for (
      const body
      of dynamicsState
        .groundTruthInventory
        .transNeptunianObjects
    ) {
      entries.push(
        Object.freeze({
          body,
          orbitalElements:
            transNeptunianOrbitalElementsV1(
              body,
            ),
        }),
      );
    }

    for (
      const body
      of dynamicsState
        .groundTruthInventory
        .interstellarObjects
    ) {
      entries.push(
        Object.freeze({
          body,
          orbitalElements:
            interstellarOrbitalElementsV1(
              body,
            ),
        }),
      );
    }

    for (
      const body
      of dynamicsState
        .groundTruthInventory
        .capturedExtrasolarObjects
    ) {
      entries.push(
        Object.freeze({
          body,
          orbitalElements:
            capturedExtrasolarOrbitalElementsV1(
              body,
            ),
        }),
      );
    }

    return new MinorBodyOrbitalElementsCatalog(
      dynamicsState,
      entries,
    );
  }
}

function asteroidOrbitalElementsV1(
  body:
    RelevantAsteroid,

  gravitatingMassSolar:
    number,
): MinorBodyOrbitalElements {
  const source =
    body.orbit;

  const orbitalPeriodYears =
    Math.sqrt(
      source.semiMajorAxisAu **
        3 /
      gravitatingMassSolar,
    );

  return new MinorBodyOrbitalElements(
    MinorBodyKind.ASTEROID,
    body.proceduralId,
    body.localDesignation,
    MinorBodyOrbitConicRegime.ELLIPTIC,
    gravitatingMassSolar,
    source.semiMajorAxisAu,
    source.eccentricity,
    source.inclinationDegrees,
    source.longitudeAscendingNodeDegrees,
    source.argumentOfPeriapsisDegrees,
    source.meanAnomalyDegrees,
    source.periapsisAu,
    source.apoapsisAu,
    orbitalPeriodYears,
  );
}

function cometOrbitalElementsV1(
  body:
    RelevantComet,
): MinorBodyOrbitalElements {
  const source =
    body.orbit;

  return new MinorBodyOrbitalElements(
    MinorBodyKind.COMET,
    body.proceduralId,
    body.localDesignation,
    MinorBodyOrbitConicRegime.ELLIPTIC,
    source.gravitatingMassSolar,
    source.semiMajorAxisAu,
    source.eccentricity,
    source.inclinationDegrees,
    source.longitudeAscendingNodeDegrees,
    source.argumentOfPeriapsisDegrees,
    source.meanAnomalyDegrees,
    source.periapsisAu,
    source.apoapsisAu,
    source.orbitalPeriodYears,
  );
}

function transNeptunianOrbitalElementsV1(
  body:
    RelevantTransNeptunianObject,
): MinorBodyOrbitalElements {
  const source =
    body.properties;

  return new MinorBodyOrbitalElements(
    MinorBodyKind.TRANS_NEPTUNIAN_OBJECT,
    body.proceduralId,
    body.localDesignation,
    MinorBodyOrbitConicRegime.ELLIPTIC,
    source.gravitatingMassSolar,
    source.semiMajorAxisAu,
    source.eccentricity,
    source.inclinationDegrees,
    source.longitudeOfAscendingNodeDegrees,
    source.argumentOfPeriapsisDegrees,
    source.meanAnomalyDegrees,
    source.periapsisAu,
    source.apoapsisAu,
    source.orbitalPeriodYears,
  );
}

function interstellarOrbitalElementsV1(
  body:
    RelevantInterstellarObject,
): MinorBodyOrbitalElements {
  const source =
    body.trajectory;

  return new MinorBodyOrbitalElements(
    MinorBodyKind.INTERSTELLAR_OBJECT,
    body.proceduralId,
    body.localDesignation,
    MinorBodyOrbitConicRegime.HYPERBOLIC,
    source.gravitatingMassSolar,
    source.semiMajorAxisAu,
    source.eccentricity,
    source.inclinationDegrees,
    source.longitudeOfAscendingNodeDegrees,
    source.argumentOfPeriapsisDegrees,
    null,
    source.periapsisAu,
    null,
    null,
  );
}

function capturedExtrasolarOrbitalElementsV1(
  body:
    RelevantCapturedExtrasolarObject,
): MinorBodyOrbitalElements {
  const source =
    body.orbit;

  return new MinorBodyOrbitalElements(
    MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT,
    body.proceduralId,
    body.localDesignation,
    MinorBodyOrbitConicRegime.ELLIPTIC,
    source.gravitatingMassSolar,
    source.semiMajorAxisAu,
    source.eccentricity,
    source.inclinationDegrees,
    source.longitudeOfAscendingNodeDegrees,
    source.argumentOfPeriapsisDegrees,
    source.meanAnomalyDegrees,
    source.periapsisAu,
    source.apoapsisAu,
    source.periodYears,
  );
}

/**
 * Asteroid point-22.3 orbits predate a frozen per-object host-mass field. Reuse
 * the mature point-18.4 mass whenever available; otherwise reconstruct only the
 * same host-dominated reference needed to derive a period for the common 23.2
 * view. No phase-22 asteroid geometry is changed.
 */
function asteroidReferenceHostMassSolarV1(
  dynamicsState:
    MinorBodyDynamicsState,
): number {
  const planetarySystem =
    dynamicsState
      .hostPlanetarySystem;

  const cached =
    planetarySystem
      .orbitalPeriodLayout
      .gravitatingMassSolar;

  if (
    cached !==
      null &&
    Number.isFinite(
      cached,
    ) &&
    cached >
      0
  ) {
    return cached;
  }

  const primaryMassSolar =
    planetarySystem
      .formationBlueprint
      .centralMassSolar;

  assertPositiveFiniteMass(
    primaryMassSolar,
  );

  if (
    planetarySystem
      .orbitalLayout
      .orbitTopology !==
    PlanetarySystemOrbitTopology.CIRCUMBINARY
  ) {
    return primaryMassSolar;
  }

  const secondaryMassSolar =
    planetarySystem
      .hostStellarSystem
      .secondaryCompanion
      ?.physicalProperties
      .initialMassSolar ??
    null;

  if (
    secondaryMassSolar ===
      null ||
    !Number.isFinite(
      secondaryMassSolar,
    ) ||
    secondaryMassSolar <=
      0
  ) {
    throw new RangeError(
      'Point-23.2 circumbinary asteroid normalization requires a positive secondary companion mass when point-18.4 carries no cached gravitating mass.',
    );
  }

  return (
    primaryMassSolar +
    secondaryMassSolar
  );
}

function assertPositiveFiniteMass(
  value:
    number,
): void {
  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      'Point-23.2 asteroid normalization requires a positive finite gravitating host mass.',
    );
  }
}
