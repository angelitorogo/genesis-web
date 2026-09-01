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

describe(
  'SystemSceneSnapshotBuilder point 24.6',
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
