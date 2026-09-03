import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

export const GALAXY_CATALOGUE_DISCOVERY_POINT_COST =
  250n;

export const GALAXY_CONFIRM_DISCOVERY_POINT_COST =
  500n;

export const GalaxyScientificStateTransitionAction =
  Object.freeze({
    CATALOGUE:
      'CATALOGUE',

    CONFIRM:
      'CONFIRM',
  } as const);

export type GalaxyScientificStateTransitionActionValue =
  typeof GalaxyScientificStateTransitionAction[
    keyof typeof GalaxyScientificStateTransitionAction
  ];

export interface GalaxyScientificStateTransitionResult {
  readonly action:
    GalaxyScientificStateTransitionActionValue;

  readonly stateBefore:
    DiscoveryStateValue;

  readonly stateAfter:
    DiscoveryStateValue;

  readonly discoveryPointCost:
    bigint;
}

/**
 * Point-26.1 pure galaxy scientific-knowledge transition policy.
 *
 * These are explicit disclosure milestones over one already-known GalaxyLocator:
 *
 * - VISITED -> CATALOGUED costs 250 global PD and unlocks the frozen baseline
 *   physical projection;
 * - CATALOGUED -> CONFIRMED costs 500 global PD and unlocks frozen
 *   structure/nucleus detail.
 *
 * The cost scale is intentionally frozen for galaxies only. It does not imply
 * costs for stars, planets, moons or any later phase-26 scientific card.
 *
 * The engine owns no persistence, PD balance, observation instruments, seeds,
 * hashes, PRNG draws or procedural generation. It never skips a milestone and
 * never downgrades an existing state.
 */
export class GalaxyScientificStateTransitionEngine {
  private constructor() {}

  static evaluate(
    currentState:
      DiscoveryStateValue,

    action:
      GalaxyScientificStateTransitionActionValue,
  ): GalaxyScientificStateTransitionResult {

    const canonical =
      DiscoveryState
        .fromCode(
          currentState.code,
        );

    if (
      action ===
      GalaxyScientificStateTransitionAction
        .CATALOGUE
    ) {
      if (
        canonical !==
        DiscoveryState.VISITED
      ) {
        throw new RangeError(
          `Catalogar una galaxia requiere exactamente VISITED; estado actual: ${canonical.name}.`,
        );
      }

      return Object.freeze({
        action,
        stateBefore:
          canonical,
        stateAfter:
          DiscoveryState
            .CATALOGUED,
        discoveryPointCost:
          GALAXY_CATALOGUE_DISCOVERY_POINT_COST,
      });
    }

    if (
      action ===
      GalaxyScientificStateTransitionAction
        .CONFIRM
    ) {
      if (
        canonical !==
        DiscoveryState.CATALOGUED
      ) {
        throw new RangeError(
          `Confirmar una galaxia requiere exactamente CATALOGUED; estado actual: ${canonical.name}.`,
        );
      }

      return Object.freeze({
        action,
        stateBefore:
          canonical,
        stateAfter:
          DiscoveryState
            .CONFIRMED,
        discoveryPointCost:
          GALAXY_CONFIRM_DISCOVERY_POINT_COST,
      });
    }

    throw new RangeError(
      `Acción científica de galaxia no soportada: ${String(action)}.`,
    );
  }
}
