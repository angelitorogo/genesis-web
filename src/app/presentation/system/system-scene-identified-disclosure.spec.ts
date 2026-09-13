import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  ArchiveStellarSystemKnowledgeLevel,
  type ArchiveStellarSystemCardModel,
} from '../genesis-archive/archive-stellar-system-card';

import {
  assertSystemSceneProjectionSnapshot,
} from './system-scene-projection-contract';

import {
  SystemSceneSnapshotBuilder,
} from './system-scene-snapshot';

describe(
  'SystemScene point 26.2 identified disclosure',
  () => {
    it(
      'should keep DETECTED visually unresolved',
      () => {
        const snapshot =
          snapshotFor(
            DiscoveryState.DETECTED,
          );

        expect(snapshot.stars).toHaveLength(0);
        expect(snapshot.orbits).toHaveLength(0);
        expect(snapshot.planets).toHaveLength(0);
        expect(snapshot.moons).toHaveLength(0);
        expect(snapshot.minorBodies).toHaveLength(0);
      },
    );

    it(
      'should show only identified stars and schematic stellar orbits at DISCOVERED/VISITED without physical Ground Truth',
      () => {
        const discovered =
          snapshotFor(
            DiscoveryState.DISCOVERED,
          );

        const visited =
          snapshotFor(
            DiscoveryState.VISITED,
          );

        for (
          const snapshot
          of [
            discovered,
            visited,
          ]
        ) {
          expect(
            () =>
              assertSystemSceneProjectionSnapshot(
                snapshot,
              ),
          ).not.toThrow();

          expect(snapshot.stars).toHaveLength(2);
          expect(snapshot.orbits).toHaveLength(1);
          expect(
            snapshot.orbits.every(
              orbit =>
                orbit.kind === 'stellar' &&
                orbit.motionId === null,
            ),
          ).toBe(true);

          expect(snapshot.planets).toHaveLength(0);
          expect(snapshot.moons).toHaveLength(0);
          expect(snapshot.minorBodies).toHaveLength(0);
          expect(snapshot.asteroidBelts).toHaveLength(0);
          expect(snapshot.habitableZone).toBeNull();
          expect(snapshot.motions).toHaveLength(0);

          expect(
            snapshot.stars.every(
              star =>
                star.kind === 'star' &&
                star.sourceLuminositySolar === null &&
                star.spin.source === 'UNAVAILABLE' &&
                star.spin.rotationPeriodHours === null &&
                star.surfaceEnvironment === null &&
                star.giantAtmosphere === null &&
                star.specialPresentation === null,
            ),
          ).toBe(true);
        }

        expect(discovered.stars).toEqual(
          visited.stars,
        );
        expect(discovered.orbits).toEqual(
          visited.orbits,
        );
      },
    );
  },
);

function snapshotFor(
  state:
    DiscoveryStateValue,
) {
  return SystemSceneSnapshotBuilder
    .buildFromSource({
      universeSeed:
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      generatorVersionCode:
        1,
      locator:
        new SystemLocator(
          0n,
          38654705693n,
          5n,
        ),
      proceduralIdentity:
        'G0 / S38654705693 / O5',
      discoveryState:
        state,
      discoveryStateLabel:
        state.name,
      stellarSystemCard:
        identifiedBinaryCard(
          state.code <
            DiscoveryState.DISCOVERED.code,
        ),
    });
}

function identifiedBinaryCard(
  unresolved:
    boolean,
): ArchiveStellarSystemCardModel {
  if (
    unresolved
  ) {
    return Object.freeze({
      knowledgeLevel:
        ArchiveStellarSystemKnowledgeLevel.DETECTED,
      knowledgeLevelLabel:
        'Señal estelar detectada',
      title:
        'Sistema estelar sin resolver',
      summary:
        'Señal detectada.',
      nextScientificStep:
        'Resolver el sistema.',
      multiplicityLabel:
        null,
      componentCount:
        null,
      systemFacts:
        Object.freeze([]),
      components:
        Object.freeze([]),
      orbits:
        Object.freeze([]),
      circumbinaryFacts:
        Object.freeze([]),
      habitabilityFacts:
        Object.freeze([]),
      render:
        Object.freeze({
          accessibleLabel:
            'Señal sin resolver',
          knowledgeLevel:
            ArchiveStellarSystemKnowledgeLevel.DETECTED,
          multiplicity:
            null,
          components:
            Object.freeze([]),
          innerOrbitEccentricity:
            null,
          outerOrbitEccentricity:
            null,
          stableHabitableZoneFraction:
            null,
          hasStableHabitableZone:
            false,
        }),
    });
  }

  return Object.freeze({
    knowledgeLevel:
      ArchiveStellarSystemKnowledgeLevel.IDENTIFIED,
    knowledgeLevelLabel:
      'Arquitectura identificada',
    title:
      'Vaephara',
    summary:
      'Sistema binario identificado.',
    nextScientificStep:
      'Catalogar el sistema.',
    multiplicityLabel:
      'Binario',
    componentCount:
      2,
    systemFacts:
      Object.freeze([]),
    components:
      Object.freeze([
        Object.freeze({
          componentLabel:
            'A' as const,
          designation:
            'Vaephara A',
          proceduralCode:
            null,
          spectralType:
            null,
          evolutionStateLabel:
            null,
          colorHex:
            '#9DB9C8',
          facts:
            Object.freeze([]),
        }),
        Object.freeze({
          componentLabel:
            'B' as const,
          designation:
            'Vaephara B',
          proceduralCode:
            null,
          spectralType:
            null,
          evolutionStateLabel:
            null,
          colorHex:
            '#9DB9C8',
          facts:
            Object.freeze([]),
        }),
      ]),
    orbits:
      Object.freeze([]),
    circumbinaryFacts:
      Object.freeze([]),
    habitabilityFacts:
      Object.freeze([]),
    render:
      Object.freeze({
        accessibleLabel:
          'Sistema binario identificado',
        knowledgeLevel:
          ArchiveStellarSystemKnowledgeLevel.IDENTIFIED,
        multiplicity:
          StellarSystemMultiplicity.BINARY,
        components:
          Object.freeze([
            Object.freeze({
              label:
                'A' as const,
              colorHex:
                '#9DB9C8',
              radiusScale:
                1,
              massSolar:
                null,
            }),
            Object.freeze({
              label:
                'B' as const,
              colorHex:
                '#9DB9C8',
              radiusScale:
                1,
              massSolar:
                null,
            }),
          ]),
        innerOrbitEccentricity:
          null,
        outerOrbitEccentricity:
          null,
        stableHabitableZoneFraction:
          null,
        hasStableHabitableZone:
          false,
      }),
  });
}
