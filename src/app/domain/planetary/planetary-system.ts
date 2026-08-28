import {
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  type SystemSeed,
} from '../seed/hierarchical-seeds';

import {
  type StellarSystem,
} from '../stellar/stellar-system';

import {
  StellarSystemMultiplicity,
} from '../stellar/stellar-system-multiplicity';

import {
  type PlanetaryArchitectureSlot,
} from './planetary-architecture-slot';

import {
  type PlanetaryOrbitalElements,
} from './planetary-orbital-elements';

import {
  type PlanetarySystemArchitecture,
} from './planetary-system-architecture';

import {
  type PlanetarySystemFormationBlueprint,
} from './planetary-system-formation-blueprint';

import {
  type PlanetarySystemOrbitalLayout,
} from './planetary-system-orbital-layout';

import {
  PlanetarySystemOrbitTopology,
} from './planetary-system-orbit-topology';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Phase-18 root aggregate for one planetary system.
 *
 * Point 18.1 established stable SystemLocator/SystemSeed identity and the frozen
 * 17.7 formation handoff. Point 18.2 added mature planet identities/count and
 * coarse architecture. Point 18.3 now attaches one plausible geometric orbit
 * to every mature architecture slot without yet computing periods or issuing a
 * long-term orbital-stability verdict.
 *
 * Periods, stability, HZ relations and planet designations remain 18.4..18.8.
 * Individual planet physics remains phase 19.
 */
export class PlanetarySystem {

  constructor(
    readonly hostStellarSystem:
      StellarSystem,

    readonly formationBlueprint:
      PlanetarySystemFormationBlueprint,

    readonly architecture:
      PlanetarySystemArchitecture,

    readonly orbitalLayout:
      PlanetarySystemOrbitalLayout,
  ) {
    if (
      !sameSystemLocator(
        hostStellarSystem.locator,
        architecture.systemLocator,
      )
    ) {
      throw new RangeError(
        'PlanetarySystem architecture must belong to the host StellarSystem locator.',
      );
    }

    if (
      architecture.sourceAnchorCount !==
      formationBlueprint.anchorCount
    ) {
      throw new RangeError(
        'PlanetarySystem architecture must consume the complete point-17.7 formation-anchor population.',
      );
    }

    if (
      !approximatelyEqual(
        architecture.sourceSolidCoreMassEarth,
        formationBlueprint.sourceCandidateSolidMassEarth,
      )
    ) {
      throw new RangeError(
        'PlanetarySystem architecture must conserve the complete point-17.7 inherited solid-core reservoir.',
      );
    }

    const expectedTopology =
      hostStellarSystem.multiplicity ===
        StellarSystemMultiplicity.SINGLE
        ? PlanetarySystemOrbitTopology.CIRCUMSTELLAR
        : PlanetarySystemOrbitTopology.CIRCUMBINARY;

    if (
      architecture.orbitTopology !==
      expectedTopology
    ) {
      throw new RangeError(
        'PlanetarySystem architecture topology must match the host stellar multiplicity.',
      );
    }

    if (
      !sameSystemLocator(
        hostStellarSystem.locator,
        orbitalLayout.systemLocator,
      )
    ) {
      throw new RangeError(
        'PlanetarySystem orbital layout must belong to the host StellarSystem locator.',
      );
    }

    if (
      orbitalLayout.orbitTopology !==
      architecture.orbitTopology
    ) {
      throw new RangeError(
        'PlanetarySystem orbital-layout topology must match the point-18.2 architecture.',
      );
    }

    if (
      orbitalLayout.planetCount !==
      architecture.planetCount
    ) {
      throw new RangeError(
        'PlanetarySystem requires exactly one point-18.3 orbit for every mature planet slot.',
      );
    }

    for (
      let index = 0;
      index <
        architecture.planetSlots.length;
      index += 1
    ) {
      const slot =
        architecture.planetSlots[index];

      const orbit =
        orbitalLayout.orbits[index];

      if (
        orbit.planetOrdinal !==
          slot.planetOrdinal ||
        !sameBodyLocator(
          orbit.bodyLocator,
          slot.bodyLocator,
        ) ||
        orbit.bodySeed.normalizedValue !==
          slot.bodySeed.normalizedValue
      ) {
        throw new RangeError(
          'Every point-18.3 orbit must preserve the exact point-18.2 planet identity and BodySeed.',
        );
      }
    }
  }

  get generationKey():
    UniverseGenerationKey {

    return this
      .hostStellarSystem
      .generationKey;
  }

  get locator():
    SystemLocator {

    return this
      .hostStellarSystem
      .locator;
  }

  get seed():
    SystemSeed {

    return this
      .hostStellarSystem
      .seed;
  }

  get formationAnchorCount():
    number {

    return this
      .formationBlueprint
      .anchorCount;
  }

  get hasFormationAnchors():
    boolean {

    return this
      .formationBlueprint
      .hasFormationAnchors;
  }

  get planetCount():
    number {

    return this
      .architecture
      .planetCount;
  }

  get hasPlanets():
    boolean {

    return this
      .architecture
      .hasPlanets;
  }

  get planetSlots():
    readonly PlanetaryArchitectureSlot[] {

    return this
      .architecture
      .planetSlots;
  }

  get orbits():
    readonly PlanetaryOrbitalElements[] {

    return this
      .orbitalLayout
      .orbits;
  }
}

function sameSystemLocator(
  left:
    SystemLocator,

  right:
    SystemLocator,
): boolean {

  return (
    left.galaxyIndex ===
      right.galaxyIndex &&
    left.sectorKey ===
      right.sectorKey &&
    left.galacticObjectIndex ===
      right.galacticObjectIndex
  );
}

function sameBodyLocator(
  left:
    PlanetaryOrbitalElements['bodyLocator'],

  right:
    PlanetaryArchitectureSlot['bodyLocator'],
): boolean {

  return (
    left.galaxyIndex ===
      right.galaxyIndex &&
    left.sectorKey ===
      right.sectorKey &&
    left.galacticObjectIndex ===
      right.galacticObjectIndex &&
    left.bodyIndex ===
      right.bodyIndex
  );
}

function approximatelyEqual(
  first:
    number,

  second:
    number,
): boolean {

  return (
    Math.abs(
      first -
      second,
    ) <=
    CONSISTENCY_TOLERANCE *
      Math.max(
        1,
        Math.abs(
          first,
        ),
        Math.abs(
          second,
        ),
      )
  );
}
