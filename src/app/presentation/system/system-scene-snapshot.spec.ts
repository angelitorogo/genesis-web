import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailModel,
} from '../genesis-archive/archive-discovery-detail.facade';

import {
  ArchiveStellarSystemKnowledgeLevel,
} from '../genesis-archive/archive-stellar-system-card';

import {
  SystemSceneSnapshotBuilder,
} from './system-scene-snapshot';

import {
  assertSystemSceneProjectionSnapshot,
} from './system-scene-projection-contract';

describe(
  'SystemSceneSnapshotBuilder through point 25.3',
  () => {

    it(
      'should project resolved system metadata plus frozen stars, planets and orbital guides into the Three.js boundary',
      () => {

        const model =
          systemModel();

        const snapshot =
          SystemSceneSnapshotBuilder
            .build(
              model,
            );

        expect(
          snapshot.address,
        ).toEqual({
          galaxyIndex:
            '3',
          sectorKey:
            '-17',
          galacticObjectIndex:
            '8',
        });

        expect(
          snapshot.title,
        ).toBe(
          'Jotheria',
        );

        expect(
          snapshot.multiplicityName,
        ).toBe(
          'BINARY',
        );

        expect(
          snapshot.componentCount,
        ).toBe(
          2,
        );

        expect(
          snapshot.discoveryStateCode,
        ).toBe(
          DiscoveryState
            .CATALOGUED
            .code,
        );

        expect(
          Object.isFrozen(
            snapshot,
          ),
        ).toBe(true);

        expect(
          () =>
            assertSystemSceneProjectionSnapshot(
              snapshot,
            ),
        ).not.toThrow();

        expect(
          Object.isFrozen(
            snapshot.address,
          ),
        ).toBe(true);

        expect(
          Array.isArray(
            snapshot.stars,
          ),
        ).toBe(true);

        expect(
          Array.isArray(
            snapshot.planets,
          ),
        ).toBe(true);

        expect(
          Array.isArray(
            snapshot.moons,
          ),
        ).toBe(true);

        expect(
          Array.isArray(
            snapshot.minorBodies,
          ),
        ).toBe(true);

        expect(
          snapshot.layers.moonCount,
        ).toBe(
          snapshot.moons.length,
        );

        expect(
          snapshot.minorBodies,
        ).toHaveLength(
          0,
        );

        expect(
          snapshot.habitableZone,
        ).not.toBeNull();

        expect(
          snapshot.layers.habitableZoneAvailable,
        ).toBe(true);

        expect(
          snapshot.habitableZone!.radiativeOuterEdgeAu,
        ).toBeGreaterThan(
          snapshot.habitableZone!.radiativeInnerEdgeAu,
        );

        expect(
          snapshot.habitableZone!.radiativeOuterRadiusScene -
            snapshot.habitableZone!.radiativeInnerRadiusScene,
        ).toBeGreaterThanOrEqual(
          0.42,
        );

        expect(
          snapshot.orbitalRiskTargets,
        ).toHaveLength(
          0,
        );

        expect(
          snapshot.layers.orbitalRiskTargetCount,
        ).toBe(
          0,
        );

        expect(
          snapshot.layers.orbitalCrossingTargetCount,
        ).toBe(
          0,
        );

        expect(
          snapshot.layers.orbitalApproachTargetCount,
        ).toBe(
          0,
        );

        expect(
          snapshot.layers.orbitalCollisionGeometryTargetCount,
        ).toBe(
          0,
        );

        expect(
          Array.isArray(
            snapshot.orbits,
          ),
        ).toBe(true);

        expect(
          snapshot.stars.length,
        ).toBeGreaterThan(
          0,
        );

        expect(
          Object.isFrozen(
            snapshot.stars,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            snapshot.planets,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            snapshot.moons,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            snapshot.minorBodies,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            snapshot.orbits,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            snapshot.motions,
          ),
        ).toBe(true);

        expect(
          snapshot.motions.length,
        ).toBeGreaterThan(
          0,
        );

        expect(
          snapshot.motions.every(
            motion =>
              motion.periodDays >
              0,
          ),
        ).toBe(true);

        expect(
          snapshot.simulation
            .playbackDaysPerRealSecond,
        ).toBeGreaterThan(
          0,
        );

        expect(
          snapshot.stars.every(
            body =>
              Object.isFrozen(
                body.motionContributions,
              ),
          ),
        ).toBe(true);

        expect(
          snapshot.stars.every(
            star =>
              star.sourceLuminositySolar !== null &&
              star.sourceLuminositySolar > 0 &&
              star.lightIntensity > 0 &&
              star.spin.source === 'UNAVAILABLE' &&
              Object.isFrozen(star.spin),
          ),
        ).toBe(true);

        expect(
          snapshot.planets.every(
            planet =>
              planet.sourceLuminositySolar === null &&
              planet.spin.source === 'PLANET_19_3' &&
              planet.spin.rotationPeriodHours !== null &&
              planet.spin.rotationPeriodHours > 0 &&
              planet.spin.axialTiltDegrees !== null &&
              Object.isFrozen(planet.spin) &&
              planet.surfaceEnvironment !== null &&
              planet.surfaceEnvironment.source === 'PHASE_20_SURFACE_ENVIRONMENT' &&
              Object.isFrozen(planet.surfaceEnvironment),
          ),
        ).toBe(true);

        expect(
          snapshot.planets.some(
            planet =>
              planet.surfaceEnvironment?.solidSurfaceAvailable === true,
          ),
        ).toBe(true);

        expect(
          snapshot.moons.every(
            moon =>
              moon.spin.source === 'MOON_21_4' &&
              moon.spin.rotationPeriodHours !== null &&
              moon.spin.rotationPeriodHours > 0 &&
              Object.isFrozen(moon.spin),
          ),
        ).toBe(true);

        expect(
          snapshot.planets.every(
            body =>
              body.motionContributions.length >
              0,
          ),
        ).toBe(true);

        expect(
          snapshot.scale
            .targetOuterRadiusScene,
        ).toBeGreaterThan(
          0,
        );

        expect(
          snapshot.accessibleLabel,
        ).toContain(
          'estrella',
        );

        expect(
          snapshot.accessibleLabel,
        ).toContain(
          'Zona habitable',
        );
      },
    );

    it(
      'should reject non-system or unresolved Archive models',
      () => {

        const model =
          systemModel();

        expect(
          () =>
            SystemSceneSnapshotBuilder
              .build({
                ...model,
                locatorKind:
                  ArchiveDiscoveryLocatorKind
                    .GALACTIC_OBJECT,
              } as unknown as ArchiveDiscoveryDetailModel),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            SystemSceneSnapshotBuilder
              .build({
                ...model,
                stellarSystemCard:
                  null,
              } as unknown as ArchiveDiscoveryDetailModel),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function systemModel():
  ArchiveDiscoveryDetailModel {

  return {
    universeSeed:
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',

    generatorVersionCode:
      1,

    locatorKind:
      ArchiveDiscoveryLocatorKind.SYSTEM,

    resultKind:
      ExplorationResultKind.SYSTEM,

    discoveryState:
      DiscoveryState.CATALOGUED,

    discoveryStateLabel:
      'Catalogado',

    galaxyIndex:
      3n,

    sectorKey:
      -17n,

    galacticObjectIndex:
      8n,

    proceduralIdentity:
      'G3 / S-17 / O8',

    stellarSystemCard: {
      knowledgeLevel:
        ArchiveStellarSystemKnowledgeLevel
          .CATALOGUED,

      title:
        'Jotheria',

      multiplicityLabel:
        'Binario',

      componentCount:
        2,

      render: {
        multiplicity: {
          name:
            'BINARY',
        },
      },
    },
  } as unknown as ArchiveDiscoveryDetailModel;
}
