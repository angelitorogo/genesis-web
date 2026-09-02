import {
  MinorBodyKind,
} from '../../domain/planetary/minor-body-kind';

import {
  ArchiveStellarSystemKnowledgeLevel,
} from '../genesis-archive/archive-stellar-system-card';

import {
  buildSystemSceneBodyCard,
} from './system-scene-body-card';

import {
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

describe(
  'SystemScene body card point 24.8',
  () => {
    const snapshot =
      bodyCardSnapshot();

    it(
      'should resolve a planet sheet and reuse the already projected orbital-risk summary',
      () => {
        const card =
          buildSystemSceneBodyCard(
            snapshot,
            'planet-1',
          );

        expect(
          card,
        ).not.toBeNull();

        expect(
          card?.kindLabel,
        ).toBe(
          'PLANETA',
        );

        expect(
          card?.orbitKindLabel,
        ).toBe(
          'ÓRBITA PLANETARIA',
        );

        expect(
          card?.orbitalRisk?.severityLabel,
        ).toBe(
          'APROXIMACIÓN',
        );
      },
    );

    it(
      'should resolve a moon sheet back to its host planet without deriving new physics',
      () => {
        const card =
          buildSystemSceneBodyCard(
            snapshot,
            'moon-1',
          );

        expect(
          card?.kindLabel,
        ).toBe(
          'LUNA',
        );

        expect(
          card?.hostTitle,
        ).toBe(
          'Jotheria b',
        );

        expect(
          card?.orbitKindLabel,
        ).toBe(
          'ÓRBITA LUNAR',
        );
      },
    );

    it(
      'should preserve the concrete minor-body family in the navigation sheet',
      () => {
        const card =
          buildSystemSceneBodyCard(
            snapshot,
            'comet-1',
          );

        expect(
          card?.kindLabel,
        ).toBe(
          'CUERPO MENOR',
        );

        expect(
          card?.subtypeLabel,
        ).toBe(
          'COMETA',
        );
      },
    );

    it(
      'should return null for a body id that does not belong to the frozen scene snapshot',
      () => {
        expect(
          buildSystemSceneBodyCard(
            snapshot,
            'not-present',
          ),
        ).toBeNull();
      },
    );
  },
);

function bodyCardSnapshot():
  SystemSceneSnapshot {

  return {
    universeSeed:
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    generatorVersionCode:
      1,
    address: {
      galaxyIndex:
        '3',
      sectorKey:
        '-17',
      galacticObjectIndex:
        '8',
    },
    proceduralIdentity:
      'G3 / S-17 / O8',
    title:
      'Jotheria',
    discoveryStateCode:
      4,
    discoveryStateLabel:
      'Catalogado',
    knowledgeLevel:
      ArchiveStellarSystemKnowledgeLevel.CATALOGUED,
    multiplicityName:
      'SINGLE',
    componentCount:
      1,
    accessibleLabel:
      'Jotheria',
    stars: [
      {
        id:
          'star-a',
        kind:
          'star',
        label:
          'A',
        title:
          'Jotheria A',
        colorHex:
          '#FFDDB2',
        radiusScene:
          0.3,
        position: {
          x: 0,
          y: 0,
          z: 0,
        },
        orbitId:
          null,
        motionContributions: [],
        surfaceStyle:
          'emissive',
        lightIntensity:
          2,
        sourceLuminositySolar:
          1,
        surfaceEnvironment:
          null,
        giantAtmosphere:
          null,
        spin: {
          source:
            'UNAVAILABLE',
          rotationPeriodHours:
            null,
          axialTiltDegrees:
            null,
          isRetrograde:
            null,
          isSynchronized:
            false,
          epochPhaseDegrees:
            0,
        },
      },
    ],
    planets: [
      {
        id:
          'planet-1',
        kind:
          'planet',
        label:
          'b',
        title:
          'Jotheria b',
        colorHex:
          '#4B7FCB',
        radiusScene:
          0.07,
        position: {
          x: 2,
          y: 0,
          z: 0,
        },
        orbitId:
          'orbit-planet-1',
        motionContributions: [],
        surfaceStyle:
          'oceanic',
        lightIntensity:
          0,
        sourceLuminositySolar:
          null,
        surfaceEnvironment:
          null,
        giantAtmosphere:
          null,
        spin: {
          source:
            'PLANET_19_3',
          rotationPeriodHours:
            24,
          axialTiltDegrees:
            23.5,
          isRetrograde:
            false,
          isSynchronized:
            false,
          epochPhaseDegrees:
            0,
        },
      },
    ],
    moons: [
      {
        id:
          'moon-1',
        kind:
          'moon',
        label:
          'I',
        title:
          'Jotheria b I',
        hostPlanetId:
          'planet-1',
        hostPlanetOrdinal:
          1,
        colorHex:
          '#B9D8E8',
        radiusScene:
          0.02,
        position: {
          x: 2.1,
          y: 0,
          z: 0,
        },
        orbitId:
          'orbit-moon-1',
        motionContributions: [],
        spin: {
          source:
            'MOON_21_4',
          rotationPeriodHours:
            240,
          axialTiltDegrees:
            null,
          isRetrograde:
            null,
          isSynchronized:
            true,
          epochPhaseDegrees:
            0,
        },
      },
    ],
    minorBodies: [
      {
        id:
          'comet-1',
        kind:
          'minor-body',
        minorBodyKind:
          MinorBodyKind.COMET,
        label:
          'COM-001',
        title:
          'Cometa COM-001',
        colorHex:
          '#A8E9F3',
        radiusScene:
          0.014,
        position: {
          x: 4,
          y: 0,
          z: 0,
        },
        orbitId:
          'orbit-comet-1',
        motionContributions: [],
      },
    ],
    habitableZone:
      null,
    orbitalRiskTargets: [
      {
        id:
          'risk-planet-1',
        targetBodyId:
          'planet-1',
        targetOrbitId:
          'orbit-planet-1',
        targetKind:
          'planet',
        targetLabel:
          'Jotheria b',
        sourceMinorBodyCount:
          2,
        riskCandidateCount:
          1,
        approachCorridorCount:
          1,
        radialCrossingOnlyCount:
          0,
        directCollisionGeometryCount:
          0,
        severity:
          'APPROACH',
        highestOrbitalRiskIndex01:
          0.64,
        highestRegimeName:
          'PLANET_APPROACH_CORRIDOR',
        colorHex:
          '#FFAA52',
      },
    ],
    layers: {
      moonCount:
        1,
      minorBodyCount:
        1,
      habitableZoneAvailable:
        false,
      orbitalRiskTargetCount:
        1,
      orbitalCrossingTargetCount:
        0,
      orbitalApproachTargetCount:
        1,
      orbitalCollisionGeometryTargetCount:
        0,
    },
    orbits: [
      {
        id:
          'orbit-planet-1',
        kind:
          'planetary',
        label:
          'Jotheria b',
        colorHex:
          '#99BCCD',
        opacity:
          0.3,
        semiMajorScene:
          2,
        semiMinorScene:
          1.9,
        focusOffsetScene:
          0.1,
        rotationDegrees:
          0,
        inclinationDegrees:
          0,
        motionId:
          null,
        motionScale:
          1,
        anchorMotionContributions: [],
      },
      {
        id:
          'orbit-moon-1',
        kind:
          'moon',
        label:
          'I',
        colorHex:
          '#B9D8E8',
        opacity:
          0.3,
        semiMajorScene:
          0.12,
        semiMinorScene:
          0.12,
        focusOffsetScene:
          0,
        rotationDegrees:
          0,
        inclinationDegrees:
          0,
        motionId:
          null,
        motionScale:
          1,
        anchorMotionContributions: [],
      },
      {
        id:
          'orbit-comet-1',
        kind:
          'minor-body',
        label:
          'COM-001',
        colorHex:
          '#A8E9F3',
        opacity:
          0.3,
        semiMajorScene:
          4,
        semiMinorScene:
          2,
        focusOffsetScene:
          2,
        rotationDegrees:
          10,
        inclinationDegrees:
          15,
        motionId:
          null,
        motionScale:
          1,
        anchorMotionContributions: [],
      },
    ],
    motions: [],
    simulation: {
      epochSimulationDay:
        0,
      playbackDaysPerRealSecond:
        1,
    },
    scale:
      {} as never,
  };
}
