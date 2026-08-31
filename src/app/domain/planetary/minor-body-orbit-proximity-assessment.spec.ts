import {
  BodyLocator,
  MoonLocator,
} from '../generation/procedural-locator';

import {
  MinorBodyApproachTargetKind,
} from './minor-body-approach-target-kind';

import {
  MinorBodyKind,
} from './minor-body-kind';

import {
  MinorBodyOrbitConicRegime,
} from './minor-body-orbit-conic-regime';

import {
  MinorBodyOrbitalElements,
} from './minor-body-orbital-elements';

import {
  type MinorBodyOrbitalElementsCatalogEntry,
} from './minor-body-orbital-elements-catalog';

import {
  MinorBodyOrbitProximityAssessment,
} from './minor-body-orbit-proximity-assessment';

import {
  MinorBodyOrbitProximityRegime,
} from './minor-body-orbit-proximity-regime';

import {
  type Planet,
} from './planet';

import {
  type RelevantMoon,
} from './relevant-moon';

describe(
  'MinorBodyOrbitProximityAssessment point 23.3',
  () => {
    it(
      'should distinguish radial crossing from actual entry into the target approach corridor',
      () => {
        const planet =
          planetFixture();

        const assessment =
          new MinorBodyOrbitProximityAssessment(
            minorEntry(),
            MinorBodyApproachTargetKind.PLANET,
            planet,
            null,
            true,
            0,
            35,
            0.2,
            0.01,
            0.19,
            false,
            MinorBodyOrbitProximityRegime
              .RADIAL_CROSSING,
          );

        expect(
          assessment.radialRangesOverlap,
        ).toBe(true);

        expect(
          assessment.approachPossible,
        ).toBe(false);

        expect(
          assessment.targetName,
        ).toBe('Testara b');
      },
    );

    it(
      'should preserve moon host identity and represent moon-corridor entry without claiming a timed encounter',
      () => {
        const planet =
          planetFixture();

        const moon =
          moonFixture(
            planet,
          );

        const assessment =
          new MinorBodyOrbitProximityAssessment(
            minorEntry(),
            MinorBodyApproachTargetKind.MOON,
            planet,
            moon,
            true,
            0,
            2,
            0.001,
            0.003,
            0,
            true,
            MinorBodyOrbitProximityRegime
              .APPROACH_CORRIDOR,
          );

        expect(
          assessment.isMoonTarget,
        ).toBe(true);

        expect(
          assessment.targetMoonOrdinal,
        ).toBe(1);

        expect(
          assessment.targetName,
        ).toBe('Testara b I');
      },
    );

    it(
      'should reject impossible regime/clearance combinations',
      () => {
        expect(
          () =>
            new MinorBodyOrbitProximityAssessment(
              minorEntry(),
              MinorBodyApproachTargetKind.PLANET,
              planetFixture(),
              null,
              false,
              1,
              0,
              0.001,
              0.01,
              0,
              false,
              MinorBodyOrbitProximityRegime.DISJOINT,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function minorEntry():
  MinorBodyOrbitalElementsCatalogEntry {
  const orbitalElements =
    new MinorBodyOrbitalElements(
      MinorBodyKind.ASTEROID,
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'AST-IN-001',
      MinorBodyOrbitConicRegime.ELLIPTIC,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      1,
      1,
      1,
    );

  return {
    body: {
      proceduralId:
        orbitalElements.proceduralId,
      localDesignation:
        orbitalElements.localDesignation,
    } as MinorBodyOrbitalElementsCatalogEntry['body'],
    orbitalElements,
  };
}

function planetFixture():
  Planet {
  return {
    planetOrdinal:
      1,
    locator:
      new BodyLocator(
        0n,
        0n,
        0n,
        0n,
      ),
    name:
      'Testara b',
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
      'Testara b I',
  } as unknown as RelevantMoon;
}
