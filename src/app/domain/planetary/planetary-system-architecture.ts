import {
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  PlanetaryArchitectureSlot,
} from './planetary-architecture-slot';

import {
  PlanetarySystemArchitectureRegime,
} from './planetary-system-architecture-regime';

import {
  PlanetarySystemOrbitTopology,
} from './planetary-system-orbit-topology';

const CONSISTENCY_TOLERANCE =
  1e-9;

export const PLANETARY_ARCHITECTURE_V1_ZONE_BREAK_RATIO =
  3;

export const PLANETARY_ARCHITECTURE_V1_COMPACT_SPAN_RATIO =
  4;

/**
 * Point-18.2 mature planet-count and architecture result.
 *
 * The architecture owns final planet identities/count and inherited radial
 * ordering, but it still contains no semi-major axes, eccentricities,
 * inclinations, periods, stability verdicts, HZ classifications or names.
 */
export class PlanetarySystemArchitecture {

  readonly planetSlots:
    readonly PlanetaryArchitectureSlot[];

  constructor(
    readonly systemLocator:
      SystemLocator,

    readonly orbitTopology:
      PlanetarySystemOrbitTopology,

    readonly regime:
      PlanetarySystemArchitectureRegime,

    readonly sourceAnchorCount:
      number,

    readonly sourceSolidCoreMassEarth:
      number,

    readonly excludedSourceAnchorCount:
      number,

    readonly excludedSolidCoreMassEarth:
      number,

    planetSlots:
      readonly PlanetaryArchitectureSlot[],
  ) {
    if (
      !Object.values(
        PlanetarySystemOrbitTopology,
      ).includes(
        orbitTopology,
      )
    ) {
      throw new RangeError(
        'orbitTopology must be a known PlanetarySystemOrbitTopology.',
      );
    }

    if (
      !Object.values(
        PlanetarySystemArchitectureRegime,
      ).includes(
        regime,
      )
    ) {
      throw new RangeError(
        'regime must be a known PlanetarySystemArchitectureRegime.',
      );
    }

    assertNonNegativeInteger(
      sourceAnchorCount,
      'sourceAnchorCount',
    );

    assertNonNegativeFinite(
      sourceSolidCoreMassEarth,
      'sourceSolidCoreMassEarth',
    );

    assertNonNegativeInteger(
      excludedSourceAnchorCount,
      'excludedSourceAnchorCount',
    );

    assertNonNegativeFinite(
      excludedSolidCoreMassEarth,
      'excludedSolidCoreMassEarth',
    );

    if (
      excludedSourceAnchorCount >
      sourceAnchorCount
    ) {
      throw new RangeError(
        'excludedSourceAnchorCount cannot exceed sourceAnchorCount.',
      );
    }

    validateSlots(
      systemLocator,
      sourceAnchorCount,
      planetSlots,
    );

    const assignedSolidCoreMassEarth =
      planetSlots.reduce(
        (
          total,
          slot,
        ) =>
          total +
          slot
            .inheritedSolidCoreMassEarth,
        0,
      );

    if (
      !approximatelyEqual(
        assignedSolidCoreMassEarth +
          excludedSolidCoreMassEarth,
        sourceSolidCoreMassEarth,
      )
    ) {
      throw new RangeError(
        'Point-18.2 must conserve inherited solid-core mass between mature planet slots and architecturally excluded material.',
      );
    }

    const assignedAnchorCount =
      planetSlots.reduce(
        (
          total,
          slot,
        ) =>
          total +
          slot.inheritedAnchorCount,
        0,
      );

    if (
      assignedAnchorCount +
        excludedSourceAnchorCount !==
      sourceAnchorCount
    ) {
      throw new RangeError(
        'Every point-17.7 formation anchor must be assigned to exactly one mature slot or explicitly excluded.',
      );
    }

    validateRegime(
      regime,
      sourceAnchorCount,
      excludedSourceAnchorCount,
      orbitTopology,
      planetSlots,
    );

    this.planetSlots =
      Object.freeze([
        ...planetSlots,
      ]);
  }

  get planetCount():
    number {

    return this
      .planetSlots
      .length;
  }

  get hasPlanets():
    boolean {

    return (
      this.planetCount >
      0
    );
  }

  get consolidatedAnchorCount():
    number {

    return Math.max(
      0,
      this.sourceAnchorCount -
        this.excludedSourceAnchorCount -
        this.planetCount,
    );
  }

  get assignedSolidCoreMassEarth():
    number {

    return this
      .planetSlots
      .reduce(
        (
          total,
          slot,
        ) =>
          total +
          slot
            .inheritedSolidCoreMassEarth,
        0,
      );
  }

  get referenceInnerAssemblyRadiusAu():
    number | null {

    return this.planetSlots[0]
      ?.referenceAssemblyRadiusAu ??
      null;
  }

  get referenceOuterAssemblyRadiusAu():
    number | null {

    return this
      .planetSlots[
        this.planetSlots.length -
          1
      ]
      ?.referenceAssemblyRadiusAu ??
      null;
  }

  get referenceRadialSpanRatio():
    number | null {

    const inner =
      this.referenceInnerAssemblyRadiusAu;

    const outer =
      this.referenceOuterAssemblyRadiusAu;

    if (
      inner ===
        null ||
      outer ===
        null
    ) {
      return null;
    }

    return (
      outer /
      inner
    );
  }

  get largestReferenceGapRatio():
    number | null {

    if (
      this.planetSlots.length <
      2
    ) {
      return null;
    }

    let largest =
      1;

    for (
      let index = 1;
      index <
        this.planetSlots.length;
      index += 1
    ) {
      largest =
        Math.max(
          largest,
          this.planetSlots[index]
            .referenceAssemblyRadiusAu /
            this.planetSlots[index - 1]
              .referenceAssemblyRadiusAu,
        );
    }

    return largest;
  }

  get radialZoneCount():
    number {

    if (
      this.planetSlots.length ===
      0
    ) {
      return 0;
    }

    let zones =
      1;

    for (
      let index = 1;
      index <
        this.planetSlots.length;
      index += 1
    ) {
      const gapRatio =
        this.planetSlots[index]
          .referenceAssemblyRadiusAu /
        this.planetSlots[index - 1]
          .referenceAssemblyRadiusAu;

      if (
        gapRatio >=
        PLANETARY_ARCHITECTURE_V1_ZONE_BREAK_RATIO
      ) {
        zones +=
          1;
      }
    }

    return zones;
  }
}

function validateSlots(
  systemLocator:
    SystemLocator,

  sourceAnchorCount:
    number,

  slots:
    readonly PlanetaryArchitectureSlot[],
): void {

  let previousRadiusAu =
    -Infinity;

  const sourceAnchorOrdinals =
    new Set<number>();

  const sourceFormationOrdinals =
    new Set<number>();

  for (
    let index = 0;
    index <
      slots.length;
    index += 1
  ) {
    const slot =
      slots[index];

    if (
      slot.planetOrdinal !==
      index +
        1
    ) {
      throw new RangeError(
        'Planetary architecture ordinals must be contiguous and start at 1.',
      );
    }

    if (
      slot.bodyLocator.galaxyIndex !==
        systemLocator.galaxyIndex ||
      slot.bodyLocator.sectorKey !==
        systemLocator.sectorKey ||
      slot.bodyLocator.galacticObjectIndex !==
        systemLocator.galacticObjectIndex
    ) {
      throw new RangeError(
        'Every planetary architecture BodyLocator must belong to the host SystemLocator.',
      );
    }

    if (
      slot.referenceAssemblyRadiusAu <
      previousRadiusAu -
        CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'Planetary architecture slots must remain sorted by inherited assembly radius.',
      );
    }

    previousRadiusAu =
      slot.referenceAssemblyRadiusAu;

    for (
      const ordinal
      of slot.sourceAnchorOrdinals
    ) {
      if (
        sourceAnchorOrdinals.has(
          ordinal,
        )
      ) {
        throw new RangeError(
          'A point-17.7 formation anchor cannot feed more than one mature planet slot.',
        );
      }

      sourceAnchorOrdinals.add(
        ordinal,
      );
    }

    for (
      const ordinal
      of slot.sourceFormationOrdinals
    ) {
      if (
        sourceFormationOrdinals.has(
          ordinal,
        )
      ) {
        throw new RangeError(
          'A point-17.4 formation lineage cannot feed more than one mature planet slot.',
        );
      }

      sourceFormationOrdinals.add(
        ordinal,
      );
    }
  }

  if (
    slots.length >
      0
  ) {
    for (
      let anchorOrdinal = 1;
      anchorOrdinal <=
        sourceAnchorCount;
      anchorOrdinal += 1
    ) {
      if (
        !sourceAnchorOrdinals.has(
          anchorOrdinal,
        )
      ) {
        throw new RangeError(
          'Populated point-18.2 architecture must preserve every point-17.7 anchor ordinal exactly once.',
        );
      }
    }
  }
}

function validateRegime(
  regime:
    PlanetarySystemArchitectureRegime,

  sourceAnchorCount:
    number,

  excludedSourceAnchorCount:
    number,

  orbitTopology:
    PlanetarySystemOrbitTopology,

  slots:
    readonly PlanetaryArchitectureSlot[],
): void {

  if (
    regime ===
    PlanetarySystemArchitectureRegime.EMPTY
  ) {
    if (
      sourceAnchorCount !==
        0 ||
      excludedSourceAnchorCount !==
        0 ||
      slots.length !==
        0
    ) {
      throw new RangeError(
        'EMPTY architecture requires zero source anchors and zero planet slots.',
      );
    }

    return;
  }

  if (
    regime ===
    PlanetarySystemArchitectureRegime.DYNAMICALLY_EXCLUDED
  ) {
    if (
      sourceAnchorCount ===
        0 ||
      excludedSourceAnchorCount !==
        sourceAnchorCount ||
      slots.length !==
        0 ||
      orbitTopology !==
        PlanetarySystemOrbitTopology.CIRCUMBINARY
    ) {
      throw new RangeError(
        'DYNAMICALLY_EXCLUDED architecture requires a non-empty fully excluded circumbinary source population.',
      );
    }

    return;
  }

  if (
    excludedSourceAnchorCount !==
      0 ||
    slots.length ===
      0
  ) {
    throw new RangeError(
      'A populated architecture cannot contain excluded source anchors in point 18.2 V1.',
    );
  }

  if (
    slots.length ===
      1 &&
    regime !==
      PlanetarySystemArchitectureRegime.SINGLE_PLANET
  ) {
    throw new RangeError(
      'Exactly one mature planet slot requires SINGLE_PLANET architecture.',
    );
  }

  if (
    slots.length >
      1 &&
    regime ===
      PlanetarySystemArchitectureRegime.SINGLE_PLANET
  ) {
    throw new RangeError(
      'SINGLE_PLANET architecture cannot contain multiple slots.',
    );
  }

  if (
    slots.length >
      1
  ) {
    const expectedRegime =
      classifyPopulatedRegime(
        slots,
      );

    if (
      regime !==
      expectedRegime
    ) {
      throw new RangeError(
        `Architecture regime ${regime} does not match the inherited radial layout (${expectedRegime}).`,
      );
    }
  }
}

function classifyPopulatedRegime(
  slots:
    readonly PlanetaryArchitectureSlot[],
): PlanetarySystemArchitectureRegime {

  let zoneCount =
    1;

  for (
    let index = 1;
    index <
      slots.length;
    index += 1
  ) {
    if (
      slots[index]
        .referenceAssemblyRadiusAu /
        slots[index - 1]
          .referenceAssemblyRadiusAu >=
      PLANETARY_ARCHITECTURE_V1_ZONE_BREAK_RATIO
    ) {
      zoneCount +=
        1;
    }
  }

  if (
    zoneCount >
      1
  ) {
    return PlanetarySystemArchitectureRegime.MULTI_ZONE_MULTIPLANET;
  }

  const spanRatio =
    slots[
      slots.length -
        1
    ].referenceAssemblyRadiusAu /
    slots[0]
      .referenceAssemblyRadiusAu;

  return spanRatio <=
    PLANETARY_ARCHITECTURE_V1_COMPACT_SPAN_RATIO
    ? PlanetarySystemArchitectureRegime.COMPACT_MULTIPLANET
    : PlanetarySystemArchitectureRegime.DISTRIBUTED_MULTIPLANET;
}

function assertNonNegativeFinite(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and non-negative: ${value}.`,
    );
  }
}

function assertNonNegativeInteger(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isInteger(
      value,
    ) ||
    value <
      0
  ) {
    throw new RangeError(
      `${propertyName} must be a non-negative integer.`,
    );
  }
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
