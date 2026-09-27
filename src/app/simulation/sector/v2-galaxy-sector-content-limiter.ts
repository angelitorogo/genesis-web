import {
  type GalacticObjectLocator,
  type SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GalaxyRegion,
} from '../../domain/sector/galaxy-region';

export interface V2GalaxySectorContentLimitResult {
  readonly maxObjectCount:
    number;

  readonly systemLocators:
    readonly SystemLocator[];

  readonly galacticObjectLocators:
    readonly GalacticObjectLocator[];
}

/**
 * V2-only radial population cap for discoverable static sector content.
 *
 * The cap deliberately reuses GalaxyRegion, whose boundaries are exactly the
 * same 0.15 / 0.40 / 0.70 / 1.00 normalized radii drawn by the map's
 * concentric region overlay. The public V2 density policy intentionally groups
 * those five physical bands into three discovery-density tiers: CENTRAL = 3,
 * INNER/MIDDLE = 2, OUTER/OUTSIDE_NOMINAL = 1.
 * No renderer geometry or duplicate radial rule is introduced here.
 *
 * Frozen V1 physical generation remains untouched. V2 projects the frozen
 * candidate population into a smaller public Ground Truth set while keeping:
 *
 * - deterministic locator identities;
 * - sequential locator prefixes;
 * - at least one locator from each populated family whenever the cap allows;
 * - the reserved galactic-centre object at GalacticObject index 0.
 *
 * No PRNG draw is consumed by this limiter.
 */
export class V2GalaxySectorContentLimiter {

  private constructor() {}

  static limit(
    region:
      GalaxyRegion,

    systemLocators:
      readonly SystemLocator[],

    galacticObjectLocators:
      readonly GalacticObjectLocator[],
  ): V2GalaxySectorContentLimitResult {

    const maxObjectCount =
      this.maxObjectCountForRegion(
        region,
      );

    const systemCount =
      systemLocators.length;

    const galacticObjectCount =
      galacticObjectLocators.length;

    const totalCount =
      systemCount +
      galacticObjectCount;

    if (
      totalCount <=
      maxObjectCount
    ) {
      return Object.freeze({
        maxObjectCount,
        systemLocators:
          Object.freeze([
            ...systemLocators,
          ]),
        galacticObjectLocators:
          Object.freeze([
            ...galacticObjectLocators,
          ]),
      });
    }

    const allocation =
      allocateFamilyCounts(
        systemCount,
        galacticObjectCount,
        maxObjectCount,
      );

    return Object.freeze({
      maxObjectCount,
      systemLocators:
        Object.freeze(
          systemLocators.slice(
            0,
            allocation.systemCount,
          ),
        ),
      galacticObjectLocators:
        Object.freeze(
          galacticObjectLocators.slice(
            0,
            allocation.galacticObjectCount,
          ),
        ),
    });
  }

  static maxObjectCountForRegion(
    region:
      GalaxyRegion,
  ): number {

    if (
      region ===
      GalaxyRegion.CENTRAL
    ) {
      return 3;
    }

    if (
      region ===
      GalaxyRegion.INNER
    ) {
      return 2;
    }

    if (
      region ===
      GalaxyRegion.MIDDLE
    ) {
      return 2;
    }

    if (
      region ===
      GalaxyRegion.OUTER
    ) {
      return 1;
    }

    if (
      region ===
      GalaxyRegion.OUTSIDE_NOMINAL
    ) {
      return 1;
    }

    throw new RangeError(
      `Unsupported GalaxyRegion: ${region.toString()}.`,
    );
  }
}

interface FamilyAllocation {
  readonly systemCount:
    number;

  readonly galacticObjectCount:
    number;
}

function allocateFamilyCounts(
  availableSystems:
    number,

  availableGalacticObjects:
    number,

  maxObjectCount:
    number,
): FamilyAllocation {

  if (
    availableSystems <=
    0
  ) {
    return {
      systemCount:
        0,
      galacticObjectCount:
        Math.min(
          availableGalacticObjects,
          maxObjectCount,
        ),
    };
  }

  if (
    availableGalacticObjects <=
    0
  ) {
    return {
      systemCount:
        Math.min(
          availableSystems,
          maxObjectCount,
        ),
      galacticObjectCount:
        0,
    };
  }

  if (
    maxObjectCount ===
    1
  ) {
    return availableSystems >=
      availableGalacticObjects
      ? {
          systemCount:
            1,
          galacticObjectCount:
            0,
        }
      : {
          systemCount:
            0,
          galacticObjectCount:
            1,
        };
  }

  /*
   * Preserve a mixed sector when both families exist. The remaining capacity
   * is distributed proportionally to the original frozen candidate counts,
   * but only prefixes are retained so public locator indices remain compact
   * and deterministic.
   */
  const proportionalSystems =
    Math.round(
      maxObjectCount *
      availableSystems /
      (
        availableSystems +
        availableGalacticObjects
      ),
    );

  let systemCount =
    Math.min(
      availableSystems,
      Math.max(
        1,
        Math.min(
          maxObjectCount -
          1,
          proportionalSystems,
        ),
      ),
    );

  let galacticObjectCount =
    Math.min(
      availableGalacticObjects,
      maxObjectCount -
      systemCount,
    );

  if (
    galacticObjectCount ===
    0
  ) {
    galacticObjectCount =
      1;
    systemCount =
      Math.min(
        availableSystems,
        maxObjectCount -
        1,
      );
  }

  const unfilled =
    maxObjectCount -
    systemCount -
    galacticObjectCount;

  if (
    unfilled >
    0
  ) {
    const additionalSystems =
      Math.min(
        unfilled,
        availableSystems -
        systemCount,
      );

    systemCount +=
      additionalSystems;

    galacticObjectCount +=
      Math.min(
        unfilled -
        additionalSystems,
        availableGalacticObjects -
        galacticObjectCount,
      );
  }

  return {
    systemCount,
    galacticObjectCount,
  };
}
