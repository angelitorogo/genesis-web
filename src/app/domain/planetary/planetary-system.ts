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
  type PlanetaryOrbitalPeriod,
} from './planetary-orbital-period';

import {
  type PlanetarySystemArchitecture,
} from './planetary-system-architecture';

import {
  PlanetarySystemArchitectureRegime,
} from './planetary-system-architecture-regime';

import {
  type PlanetarySystemFormationBlueprint,
} from './planetary-system-formation-blueprint';

import {
  type PlanetarySystemOrbitalLayout,
} from './planetary-system-orbital-layout';

import {
  type PlanetarySystemOrbitalPeriodLayout,
} from './planetary-system-orbital-period-layout';

import {
  PlanetarySystemOrbitTopology,
} from './planetary-system-orbit-topology';

import {
  type PlanetarySystemStabilityAssessment,
} from './planetary-system-stability-assessment';

import {
  PlanetarySystemStabilityRegime,
} from './planetary-system-stability-regime';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Phase-18 root aggregate for one planetary system.
 *
 * Point 18.1 established stable SystemLocator/SystemSeed identity and the frozen
 * 17.7 formation handoff. Point 18.2 added mature planet identities/count and
 * coarse architecture. Point 18.3 attaches one plausible geometric orbit to
 * every mature architecture slot. Point 18.4 attaches one Keplerian period to
 * every frozen orbit. Point 18.5 now attaches the basic orbital-stability
 * assessment without modifying any point-18.2..18.4 value.
 *
 * HZ relations and planet designations remain 18.6..18.8. Individual planet
 * physics remains phase 19.
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

    readonly orbitalPeriodLayout:
      PlanetarySystemOrbitalPeriodLayout,

    readonly stabilityAssessment:
      PlanetarySystemStabilityAssessment,
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

    if (
      !sameSystemLocator(
        hostStellarSystem.locator,
        orbitalPeriodLayout.systemLocator,
      )
    ) {
      throw new RangeError(
        'PlanetarySystem orbital-period layout must belong to the host StellarSystem locator.',
      );
    }

    if (
      orbitalPeriodLayout.orbitTopology !==
      orbitalLayout.orbitTopology
    ) {
      throw new RangeError(
        'PlanetarySystem orbital-period topology must match the point-18.3 orbital layout.',
      );
    }

    if (
      orbitalPeriodLayout.planetCount !==
      orbitalLayout.planetCount
    ) {
      throw new RangeError(
        'PlanetarySystem requires exactly one point-18.4 period for every point-18.3 orbit.',
      );
    }

    for (
      let index = 0;
      index <
        orbitalLayout.orbits.length;
      index += 1
    ) {
      const orbit =
        orbitalLayout.orbits[index];

      const period =
        orbitalPeriodLayout.periods[index];

      if (
        period.planetOrdinal !==
          orbit.planetOrdinal ||
        !sameBodyLocator(
          period.bodyLocator,
          orbit.bodyLocator,
        ) ||
        period.bodySeed.normalizedValue !==
          orbit.bodySeed.normalizedValue ||
        !approximatelyEqual(
          period.sourceSemiMajorAxisAu,
          orbit.semiMajorAxisAu,
        )
      ) {
        throw new RangeError(
          'Every point-18.4 period must preserve the exact point-18.3 planet identity, BodySeed and semi-major axis.',
        );
      }
    }

    if (
      !sameSystemLocator(
        hostStellarSystem.locator,
        stabilityAssessment.systemLocator,
      )
    ) {
      throw new RangeError(
        'PlanetarySystem stability assessment must belong to the host StellarSystem locator.',
      );
    }

    if (
      stabilityAssessment.orbitTopology !==
      orbitalLayout.orbitTopology
    ) {
      throw new RangeError(
        'PlanetarySystem stability topology must match the point-18.3 orbital layout.',
      );
    }

    if (
      stabilityAssessment.planetCount !==
      orbitalLayout.planetCount
    ) {
      throw new RangeError(
        'PlanetarySystem point-18.5 stability assessment must cover the complete mature planet population.',
      );
    }

    const expectedPlanetFreeStabilityRegime =
      architecture.regime ===
        PlanetarySystemArchitectureRegime.DYNAMICALLY_EXCLUDED
        ? PlanetarySystemStabilityRegime.DYNAMICALLY_EXCLUDED
        : architecture.planetCount ===
            0
          ? PlanetarySystemStabilityRegime.EMPTY
          : null;

    if (
      expectedPlanetFreeStabilityRegime !==
        null &&
      stabilityAssessment.regime !==
        expectedPlanetFreeStabilityRegime
    ) {
      throw new RangeError(
        'PlanetarySystem point-18.5 planet-free stability regime must preserve the point-18.2 architecture outcome.',
      );
    }

    if (
      !sameNullableNumber(
        stabilityAssessment.gravitatingMassSolar,
        orbitalPeriodLayout.gravitatingMassSolar,
      )
    ) {
      throw new RangeError(
        'PlanetarySystem point-18.5 stability assessment must reuse the point-18.4 gravitating host mass.',
      );
    }

    for (
      let index = 0;
      index <
        stabilityAssessment.pairAssessments.length;
      index += 1
    ) {
      const pair =
        stabilityAssessment
          .pairAssessments[index];

      const innerOrbit =
        orbitalLayout.orbits[index];

      const outerOrbit =
        orbitalLayout.orbits[index +
          1];

      const innerSlot =
        architecture.planetSlots[index];

      const outerSlot =
        architecture.planetSlots[index +
          1];

      if (
        pair.innerPlanetOrdinal !==
          innerOrbit.planetOrdinal ||
        pair.outerPlanetOrdinal !==
          outerOrbit.planetOrdinal ||
        !approximatelyEqual(
          pair.innerSemiMajorAxisAu,
          innerOrbit.semiMajorAxisAu,
        ) ||
        !approximatelyEqual(
          pair.outerSemiMajorAxisAu,
          outerOrbit.semiMajorAxisAu,
        ) ||
        !approximatelyEqual(
          pair.innerReferenceMassEarth,
          innerSlot.inheritedSolidCoreMassEarth,
        ) ||
        !approximatelyEqual(
          pair.outerReferenceMassEarth,
          outerSlot.inheritedSolidCoreMassEarth,
        )
      ) {
        throw new RangeError(
          'Every point-18.5 pair assessment must preserve its adjacent point-18.2 identities/masses and point-18.3 semi-major axes.',
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

  get orbitalPeriods():
    readonly PlanetaryOrbitalPeriod[] {

    return this
      .orbitalPeriodLayout
      .periods;
  }

  get hasBasicOrbitalStability():
    boolean {

    return this
      .stabilityAssessment
      .isStable;
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
    PlanetaryOrbitalElements['bodyLocator'] |
    PlanetaryOrbitalPeriod['bodyLocator'],

  right:
    PlanetaryArchitectureSlot['bodyLocator'] |
    PlanetaryOrbitalElements['bodyLocator'],
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

function sameNullableNumber(
  first:
    number | null,

  second:
    number | null,
): boolean {

  if (
    first ===
      null ||
    second ===
      null
  ) {
    return first ===
      second;
  }

  return approximatelyEqual(
    first,
    second,
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
