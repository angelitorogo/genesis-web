import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  GenesisUniverse,
} from '../../domain/universe/genesis-universe';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

export const GalaxyOperationalAccessMode =
  Object.freeze({
    FICHE_ONLY:
      'FICHE_ONLY',

    MAP_READ_ONLY:
      'MAP_READ_ONLY',

    FULL_EXPLORATION:
      'FULL_EXPLORATION',
  } as const);

export type GalaxyOperationalAccessMode =
  typeof GalaxyOperationalAccessMode[
    keyof typeof GalaxyOperationalAccessMode
  ];

export interface GalaxyOperationalAccess {
  readonly mode:
    GalaxyOperationalAccessMode;

  readonly isOriginGalaxy:
    boolean;

  readonly usesOriginOperationalException:
    boolean;

  readonly canOpenGalacticMap:
    boolean;

  readonly canExploreSectors:
    boolean;
}

/**
 * Canonical operational gate for the active galaxy.
 *
 * External galaxies progress through three deliberately separate capabilities:
 * VISITED and earlier expose only their scientific fiche, CATALOGUED exposes a
 * read-only galactic map, and CONFIRMED enables sector exploration. The home
 * galaxy is the sole exception: once it is known it keeps full operational
 * access so a new universe can earn the PD required by that progression.
 *
 * This policy never changes DiscoveryState and therefore remains compatible
 * with existing saves and both frozen generator versions.
 */
export class GalaxyOperationalAccessPolicy {

  private constructor() {}

  static evaluate(
    galaxyIndex:
      bigint,

    knowledgeState:
      DiscoveryStateValue,
  ): GalaxyOperationalAccess {

    assertNonNegativeSignedLong(
      galaxyIndex,
      'galaxyIndex',
    );

    const canonicalState =
      DiscoveryState
        .fromCode(
          knowledgeState.code,
        );

    const isOriginGalaxy =
      galaxyIndex ===
      GenesisUniverse
        .INITIAL_GALAXY_INDEX;

    const originOperationalAccess =
      isOriginGalaxy &&
      canonicalState.code >=
      DiscoveryState.DISCOVERED.code;

    const confirmedAccess =
      canonicalState.code >=
      DiscoveryState.CONFIRMED.code;

    if (
      originOperationalAccess ||
      confirmedAccess
    ) {
      return Object.freeze({
        mode:
          GalaxyOperationalAccessMode
            .FULL_EXPLORATION,

        isOriginGalaxy,

        usesOriginOperationalException:
          originOperationalAccess &&
          !confirmedAccess,

        canOpenGalacticMap:
          true,

        canExploreSectors:
          true,
      });
    }

    if (
      canonicalState.code >=
      DiscoveryState.CATALOGUED.code
    ) {
      return Object.freeze({
        mode:
          GalaxyOperationalAccessMode
            .MAP_READ_ONLY,

        isOriginGalaxy,

        usesOriginOperationalException:
          false,

        canOpenGalacticMap:
          true,

        canExploreSectors:
          false,
      });
    }

    return Object.freeze({
      mode:
        GalaxyOperationalAccessMode
          .FICHE_ONLY,

      isOriginGalaxy,

      usesOriginOperationalException:
        false,

      canOpenGalacticMap:
        false,

      canExploreSectors:
        false,
    });
  }

  static assertSectorExplorationAllowed(
    galaxyIndex:
      bigint,

    knowledgeState:
      DiscoveryStateValue,
  ): void {

    if (
      !this
        .evaluate(
          galaxyIndex,
          knowledgeState,
        )
        .canExploreSectors
    ) {
      throw new RangeError(
        'La exploración de sectores requiere una galaxia Confirmada. En estado Catalogada el mapa es solo de consulta.',
      );
    }
  }
}

function assertNonNegativeSignedLong(
  value:
    bigint,

  propertyName:
    string,
): void {

  if (
    typeof value !==
      'bigint' ||
    value <
      0n ||
    value >
      SIGNED_LONG_MAX
  ) {
    throw new RangeError(
      `${propertyName} must be a non-negative signed Long: ${String(value)}.`,
    );
  }
}
