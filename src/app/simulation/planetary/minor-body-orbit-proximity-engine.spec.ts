import {
  BodyLocator,
  MoonLocator,
} from '../../domain/generation/procedural-locator';

import {
  MinorBodyApproachTargetKind,
} from '../../domain/planetary/minor-body-approach-target-kind';

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
  type MinorBodyOrbitalElementsCatalog,
  type MinorBodyOrbitalElementsCatalogEntry,
} from '../../domain/planetary/minor-body-orbital-elements-catalog';

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
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  type RelevantMoon,
} from '../../domain/planetary/relevant-moon';

import {
  MinorBodyDynamicsEngine,
} from './minor-body-dynamics-engine';

import {
  MinorBodyOrbitProximityEngine,
} from './minor-body-orbit-proximity-engine';

describe(
  'MinorBodyOrbitProximityEngine point 23.3',
  () => {
    it(
      'should distinguish radial crossing from Hill-corridor approach for planets and moon-orbital-corridor entry',
      () => {
        const fixture =
          targetFixture();

        const catalog =
          MinorBodyOrbitProximityEngine
            .generate(
              orbitalCatalog(
                fixture.host,
              ),
              fixture.planets,
              fixture.moonSystems,
            );

        expect(
          catalog.minorBodyCount,
        ).toBe(4);

        expect(
          catalog.planetTargetCount,
        ).toBe(2);

        expect(
          catalog.relevantMoonTargetCount,
        ).toBe(1);

        expect(
          catalog.assessmentCount,
        ).toBe(12);

        const coorbital =
          catalog.forMinorBody(
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          );

        expect(
          coorbital[0].targetKind,
        ).toBe(
          MinorBodyApproachTargetKind.PLANET,
        );

        expect(
          coorbital[0].regime,
        ).toBe(
          MinorBodyOrbitProximityRegime
            .APPROACH_CORRIDOR,
        );

        expect(
          coorbital[0].minimumNodalSeparationAu,
        ).toBeCloseTo(
          0,
          12,
        );

        expect(
          coorbital[2].targetKind,
        ).toBe(
          MinorBodyApproachTargetKind.MOON,
        );

        expect(
          coorbital[2].approachPossible,
        ).toBe(true);

        const inclinedCrossing =
          catalog.forMinorBody(
            'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
          );

        expect(
          inclinedCrossing[0].radialRangesOverlap,
        ).toBe(true);

        expect(
          inclinedCrossing[0].minimumNodalSeparationAu,
        ).toBeCloseTo(
          0.26,
          8,
        );

        expect(
          inclinedCrossing[0].approachPossible,
        ).toBe(false);

        expect(
          inclinedCrossing[0].regime,
        ).toBe(
          MinorBodyOrbitProximityRegime
            .RADIAL_CROSSING,
        );

        const far =
          catalog.forMinorBody(
            'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
          );

        expect(
          far[0].regime,
        ).toBe(
          MinorBodyOrbitProximityRegime
            .DISJOINT,
        );

        expect(
          far[0].radialGapAu,
        ).toBeGreaterThan(0);
      },
    );

    it(
      'should support a hyperbolic visitor without inventing apoapsis/period and still evaluate its finite branch geometry',
      () => {
        const fixture =
          targetFixture();

        const catalog =
          MinorBodyOrbitProximityEngine
            .generate(
              orbitalCatalog(
                fixture.host,
              ),
              fixture.planets,
              fixture.moonSystems,
            );

        const visitor =
          catalog.forMinorBody(
            'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
          );

        expect(
          visitor.length,
        ).toBe(3);

        expect(
          visitor[0].radialRangesOverlap,
        ).toBe(true);

        expect(
          visitor[0].minimumNodalSeparationAu,
        ).not.toBeNull();
      },
    );

    it(
      'should expose point-23.3 through MinorBodyDynamicsEngine without re-generating target objects',
      () => {
        const fixture =
          targetFixture();

        const source =
          orbitalCatalog(
            fixture.host,
          );

        const catalog =
          MinorBodyDynamicsEngine
            .proximities(
              source,
              fixture.planets,
              fixture.moonSystems,
            );

        expect(
          catalog.orbitalCatalog,
        ).toBe(source);

        expect(
          catalog.planets[0],
        ).toBe(
          fixture.planets[0],
        );

        expect(
          catalog.moonSystems[0],
        ).toBe(
          fixture.moonSystems[0],
        );
      },
    );

    it(
      'should allow an empty target system without inventing assessments',
      () => {
        const host =
          {
            planetCount:
              0,
            orbitalPeriodLayout: {
              gravitatingMassSolar:
                null,
            },
          } as unknown as PlanetarySystem;

        const source =
          {
            dynamicsState: {
              hostPlanetarySystem:
                host,
            },
            existingObjectCount:
              0,
            entries:
              Object.freeze([]),
          } as unknown as MinorBodyOrbitalElementsCatalog;

        const catalog =
          MinorBodyOrbitProximityEngine
            .generate(
              source,
              [],
              [],
            );

        expect(
          catalog.assessments,
        ).toEqual([]);
      },
    );
  },
);

function orbitalCatalog(
  host:
    PlanetarySystem,
): MinorBodyOrbitalElementsCatalog {
  const entries =
    Object.freeze([
      entry(
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        'AST-A',
        MinorBodyOrbitConicRegime.ELLIPTIC,
        1,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
      ),
      entry(
        'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
        'AST-B',
        MinorBodyOrbitConicRegime.ELLIPTIC,
        1.5,
        0.4,
        60,
        0,
        90,
        0.9,
        2.1,
        Math.sqrt(
          1.5 **
            3,
        ),
      ),
      entry(
        'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
        'AST-C',
        MinorBodyOrbitConicRegime.ELLIPTIC,
        10,
        0,
        0,
        0,
        0,
        10,
        10,
        Math.sqrt(1000),
      ),
      entry(
        'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
        'ISO-A',
        MinorBodyOrbitConicRegime.HYPERBOLIC,
        -10,
        1.1,
        0,
        0,
        0,
        1,
        null,
        null,
      ),
    ]);

  return {
    dynamicsState: {
      hostPlanetarySystem:
        host,
    },
    existingObjectCount:
      entries.length,
    entries,
  } as unknown as MinorBodyOrbitalElementsCatalog;
}

function entry(
  proceduralId:
    string,

  designation:
    string,

  conicRegime:
    typeof MinorBodyOrbitConicRegime.ELLIPTIC |
    typeof MinorBodyOrbitConicRegime.HYPERBOLIC,

  semiMajorAxisAu:
    number,

  eccentricity:
    number,

  inclinationDegrees:
    number,

  nodeDegrees:
    number,

  periapsisArgumentDegrees:
    number,

  periapsisAu:
    number,

  apoapsisAu:
    number | null,

  orbitalPeriodYears:
    number | null,
): MinorBodyOrbitalElementsCatalogEntry {
  const orbitalElements =
    new MinorBodyOrbitalElements(
      conicRegime ===
        MinorBodyOrbitConicRegime.HYPERBOLIC
        ? MinorBodyKind.INTERSTELLAR_OBJECT
        : MinorBodyKind.ASTEROID,
      proceduralId,
      designation,
      conicRegime,
      1,
      semiMajorAxisAu,
      eccentricity,
      inclinationDegrees,
      nodeDegrees,
      periapsisArgumentDegrees,
      conicRegime ===
        MinorBodyOrbitConicRegime.ELLIPTIC
        ? 0
        : null,
      periapsisAu,
      apoapsisAu,
      orbitalPeriodYears,
    );

  return Object.freeze({
    body: {
      proceduralId,
      localDesignation:
        designation,
    } as MinorBodyOrbitalElementsCatalogEntry['body'],
    orbitalElements,
  });
}

function targetFixture(): {
  readonly host:
    PlanetarySystem;
  readonly planets:
    readonly Planet[];
  readonly moonSystems:
    readonly MoonSystem[];
} {
  const host =
    {
      planetCount:
        2,
      orbitalPeriodLayout: {
        gravitatingMassSolar:
          1,
      },
    } as unknown as PlanetarySystem;

  const planet1 =
    planetFixture(
      host,
      1,
      'Testara b',
      1,
      1,
    );

  const planet2 =
    planetFixture(
      host,
      2,
      'Testara c',
      5,
      318,
    );

  const moon =
    moonFixture(
      planet1,
    );

  const moonSystem1 =
    {
      hostPlanet:
        planet1,
      relevantMoons:
        Object.freeze([
          moon,
        ]),
      relevantMoonCount:
        1,
      unmaterializedMinorMoonCount:
        2,
    } as unknown as MoonSystem;

  const moonSystem2 =
    {
      hostPlanet:
        planet2,
      relevantMoons:
        Object.freeze([]),
      relevantMoonCount:
        0,
      unmaterializedMinorMoonCount:
        4,
    } as unknown as MoonSystem;

  return {
    host,
    planets:
      Object.freeze([
        planet1,
        planet2,
      ]),
    moonSystems:
      Object.freeze([
        moonSystem1,
        moonSystem2,
      ]),
  };
}

function planetFixture(
  host:
    PlanetarySystem,

  planetOrdinal:
    number,

  name:
    string,

  semiMajorAxisAu:
    number,

  massEarth:
    number,
): Planet {
  const locator =
    new BodyLocator(
      0n,
      0n,
      0n,
      BigInt(
        planetOrdinal -
          1,
      ),
    );

  const orbit =
    {
      planetOrdinal,
      bodyLocator:
        locator,
      semiMajorAxisAu,
      eccentricity:
        0,
      inclinationDegrees:
        0,
      longitudeOfAscendingNodeDegrees:
        0,
      argumentOfPeriapsisDegrees:
        0,
      periastronAu:
        semiMajorAxisAu,
      apoastronAu:
        semiMajorAxisAu,
    } as PlanetaryOrbitalElements;

  return {
    hostPlanetarySystem:
      host,
    planetOrdinal,
    locator,
    name,
    massEarth,
    radiusEarth:
      1,
    orbit,
  } as unknown as Planet;
}

function moonFixture(
  planet:
    Planet,
): RelevantMoon {
  return {
    hostPlanetOrdinal:
      planet.planetOrdinal,
    hostPlanetLocator:
      planet.locator,
    moonOrdinal:
      1,
    locator:
      new MoonLocator(
        planet.locator.galaxyIndex,
        planet.locator.sectorKey,
        planet.locator.galacticObjectIndex,
        planet.locator.bodyIndex,
        0n,
      ),
    name:
      `${planet.name} I`,
    orbit: {
      semiMajorAxisKilometers:
        384_400,
      eccentricity:
        0.055,
    },
  } as unknown as RelevantMoon;
}
