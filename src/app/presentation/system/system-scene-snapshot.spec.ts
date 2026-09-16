import {
  vi,
} from 'vitest';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  AsteroidBeltGenerator,
} from '../../simulation/planetary/asteroid-belt-generator';

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
  SystemSceneProjectionSpace,
  SystemSceneScaleProjectionMode,
  systemSceneProjectedOverlayRadiusAuInSpace,
} from './system-scene-scale-projection';

import {
  assertSystemSceneProjectionSnapshot,
} from './system-scene-projection-contract';

describe(
  'SystemSceneSnapshotBuilder through point 25.4',
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
          snapshot.habitableZone!.radiativeInnerRadiusScene,
        ).toBeCloseTo(
          systemSceneProjectedOverlayRadiusAuInSpace(
            snapshot.habitableZone!.radiativeInnerEdgeAu,
            snapshot.scale,
            SystemSceneProjectionSpace.GLOBAL,
          ),
          12,
        );

        expect(
          snapshot.habitableZone!.radiativeOuterRadiusScene,
        ).toBeCloseTo(
          systemSceneProjectedOverlayRadiusAuInSpace(
            snapshot.habitableZone!.radiativeOuterEdgeAu,
            snapshot.scale,
            SystemSceneProjectionSpace.GLOBAL,
          ),
          12,
        );

        expect(
          snapshot.habitableZone!.presentationAdjusted,
        ).toBe(false);

        const expectedProjectionMode =
          snapshot.stars.length === 1
            ? SystemSceneScaleProjectionMode
                .SINGLE_PRESENTATION_V3
            : snapshot.stars.length === 2
              ? SystemSceneScaleProjectionMode
                  .BINARY_PRESENTATION_V3
              : SystemSceneScaleProjectionMode
                  .TRIPLE_PRESENTATION_V3;

        expect(
          snapshot.scale.projectionMode,
        ).toBe(
          expectedProjectionMode,
        );

        expect(
          snapshot.hostVisualEnvelope,
        ).not.toBeNull();

        expect(
          Object.isFrozen(
            snapshot.hostVisualEnvelope,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            snapshot.hostVisualEnvelope!.stars,
          ),
        ).toBe(true);

        expect(
          snapshot.hostVisualEnvelope!
            .hostVisualEnvelopeRadiusScene,
        ).toBeLessThan(
          snapshot.habitableZone!
            .radiativeInnerRadiusScene,
        );

        expect(
          snapshot.stars.every(
            star =>
              (
                star.opticalRadiusScene ??
                star.radiusScene
              ) >=
              star.radiusScene,
          ),
        ).toBe(true);

        if (
          snapshot.stars.length ===
          1
        ) {
          expect(
            snapshot.multistellarPresentation,
          ).toBeNull();
        } else {
          expect(
            snapshot.multistellarPresentation,
          ).not.toBeNull();

          expect(
            snapshot.multistellarPresentation?.version,
          ).toBe(4);
        }

        expect(
          snapshot.stellarOrbitClearance,
        ).not.toBeNull();

        expect(
          snapshot.stellarOrbitClearance?.version,
        ).toBe(5);

        if (
          snapshot.stellarOrbitClearance!
            .nearestPlanetPeriapsisRadiusScene !==
            null
        ) {
          expect(
            snapshot.stellarOrbitClearance!
              .hostOpticalEnvelopeRadiusScene +
            snapshot.stellarOrbitClearance!
              .requestedMinimumClearanceScene!,
          ).toBeLessThanOrEqual(
            snapshot.stellarOrbitClearance!
              .nearestPlanetPeriapsisRadiusScene! +
              1e-9,
          );
        }

        const multistellarPresentation =
          snapshot.multistellarPresentation;

        if (multistellarPresentation != null) {
          const primary =
            multistellarPresentation.stars.find(
              star => star.label === 'A',
            )!;
          const secondary =
            multistellarPresentation.stars.find(
              star => star.label === 'B',
            )!;

          expect(
            primary.radiusScene +
            secondary.radiusScene,
          ).toBeLessThan(
            multistellarPresentation
              .innerPairMinimumCenterSeparationScene,
          );
        }

        expect(
          snapshot.habitableZone!.visualRegime,
        ).toBeDefined();

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
          snapshot.planets.every(
            planet =>
              planet.giantAtmosphere === null ||
              (
                planet.surfaceEnvironment?.solidSurfaceAvailable === false &&
                planet.giantAtmosphere.source === 'PHASE_19_20_DEEP_ENVELOPE' &&
                Object.isFrozen(planet.giantAtmosphere)
              ),
          ),
        ).toBe(true);

        expect(
          snapshot.planets.every(
            planet =>
              planet.surfaceEnvironment?.solidSurfaceAvailable !== true ||
              planet.giantAtmosphere === null,
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
      'should automatically materialize phase-22 minor bodies for a CONFIRMED production system',
      () => {
        const asteroidGenerator =
          vi.spyOn(
            AsteroidBeltGenerator,
            'generate',
          );

        const catalogued =
          systemModel();

        SystemSceneSnapshotBuilder
          .build(
            catalogued,
          );

        expect(
          asteroidGenerator,
        ).not.toHaveBeenCalled();

        const confirmed =
          {
            ...catalogued,
            discoveryState:
              DiscoveryState.CONFIRMED,
            discoveryStateLabel:
              'Confirmado',
            stellarSystemCard: {
              ...catalogued.stellarSystemCard!,
              knowledgeLevel:
                ArchiveStellarSystemKnowledgeLevel.CONFIRMED,
            },
          } as ArchiveDiscoveryDetailModel;

        const snapshot =
          SystemSceneSnapshotBuilder
            .build(
              confirmed,
            );

        expect(
          asteroidGenerator,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          snapshot.layers.minorBodyCount,
        ).toBe(
          snapshot.minorBodies.length,
        );

        asteroidGenerator
          .mockRestore();
      },
      30_000,
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
