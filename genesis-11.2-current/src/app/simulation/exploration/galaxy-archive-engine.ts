import {
  type KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GalaxyArchiveEntry,
  GalaxyArchiveSnapshot,
} from '../../domain/exploration/galaxy-archive';

import {
  GalaxyLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ExternalGalaxyPreliminaryInformationGenerator,
} from '../observation/galaxy/external-galaxy-preliminary-information-generator';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * Builds the point-7.8 galaxy archive/list as a pure derived snapshot.
 *
 * Source of truth:
 * - persistent known discoveries supplied by DiscoveryRepository;
 * - current focus supplied by navigation state.
 *
 * V1 membership:
 * - only GalaxyLocator discoveries;
 * - state >= DETECTED;
 * - strictly sorted by galaxyIndex.
 *
 * Focus never changes membership. It only sets GalaxyArchiveEntry.isCurrentFocus.
 *
 * No archive-specific persistence, flags, timestamps, favorites, pagination,
 * navigation writes, DiscoveryState writes, PD changes or random entropy are
 * introduced here.
 */
export class GalaxyArchiveEngine {

  private constructor() {}

  static buildArchive(
    generationKey:
      UniverseGenerationKey,

    currentFocusGalaxyIndex:
      bigint,

    knownDiscoveries:
      readonly KnownDiscovery[],
  ): GalaxyArchiveSnapshot {

    assertNonNegativeSignedLong(
      currentFocusGalaxyIndex,
      'currentFocusGalaxyIndex',
    );

    for (
      const discovery
      of knownDiscoveries
    ) {
      const stateCode:
        number =
        discovery
          .state
          .code;

      if (
        stateCode ===
        DiscoveryState.UNKNOWN.code
      ) {
        throw new RangeError(
          'knownDiscoveries cannot contain DiscoveryState.UNKNOWN.',
        );
      }
    }

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.buildV1(
        generationKey,
        currentFocusGalaxyIndex,
        knownDiscoveries,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static buildV1(
    generationKey:
      UniverseGenerationKey,

    currentFocusGalaxyIndex:
      bigint,

    knownDiscoveries:
      readonly KnownDiscovery[],
  ): GalaxyArchiveSnapshot {

    const entries:
      GalaxyArchiveEntry[] =
      [];

    for (
      const discovery
      of knownDiscoveries
    ) {
      if (
        !(
          discovery.locator instanceof
          GalaxyLocator
        )
      ) {
        continue;
      }

      const preliminaryInformation =
        ExternalGalaxyPreliminaryInformationGenerator
          .generate(
            generationKey,
            discovery
              .locator
              .galaxyIndex,
            discovery.state,
          );

      entries.push(
        new GalaxyArchiveEntry(
          preliminaryInformation,
          discovery
            .locator
            .galaxyIndex ===
            currentFocusGalaxyIndex,
        ),
      );
    }

    entries.sort(
      (
        left,
        right,
      ) =>
        left.galaxyIndex <
          right.galaxyIndex
          ? -1
          : left.galaxyIndex >
              right.galaxyIndex
            ? 1
            : 0,
    );

    return new GalaxyArchiveSnapshot(
      currentFocusGalaxyIndex,
      entries,
    );
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
