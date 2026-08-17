import {
  type DiscoveryStateValue,
} from '../discovery/discovery-state';

import {
  type ExternalGalaxyPreliminaryInformation,
} from '../observation/galaxy/external-galaxy-preliminary-information';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * One galaxy entry exposed through the point-7.8 archive/list projection.
 *
 * Membership is derived from persistent DiscoveryState knowledge. The archive
 * itself has no independent archived/unarchived flag.
 */
export class GalaxyArchiveEntry {

  constructor(
    readonly preliminaryInformation:
      ExternalGalaxyPreliminaryInformation,

    readonly isCurrentFocus:
      boolean,
  ) {}

  get galaxyIndex():
    bigint {

    return this
      .preliminaryInformation
      .galaxyIndex;
  }

  get designationCode():
    string {

    return this
      .preliminaryInformation
      .designationCode;
  }

  get knowledgeState():
    DiscoveryStateValue {

    return this
      .preliminaryInformation
      .knowledgeState;
  }
}

/**
 * Immutable, deterministic archive/list snapshot for all known galaxies.
 *
 * The archive is derived data:
 *
 * - membership comes from known GalaxyLocator discoveries;
 * - current focus only marks one entry;
 * - entries are unique and strictly sorted by galaxyIndex;
 * - no archive-specific persistence exists.
 */
export class GalaxyArchiveSnapshot {

  readonly currentFocusGalaxyIndex:
    bigint;

  readonly entries:
    readonly GalaxyArchiveEntry[];

  constructor(
    currentFocusGalaxyIndex:
      bigint,

    entries:
      readonly GalaxyArchiveEntry[],
  ) {
    assertNonNegativeSignedLong(
      currentFocusGalaxyIndex,
      'currentFocusGalaxyIndex',
    );

    if (
      entries.length ===
      0
    ) {
      throw new RangeError(
        'GalaxyArchiveSnapshot entries cannot be empty.',
      );
    }

    const copiedEntries =
      [
        ...entries,
      ];

    for (
      let index =
        0;
      index <
        copiedEntries.length;
      index +=
        1
    ) {
      const entry =
        copiedEntries[index];

      assertNonNegativeSignedLong(
        entry.galaxyIndex,
        'entry.galaxyIndex',
      );

      if (
        index >
          0 &&
        copiedEntries[
          index -
            1
        ].galaxyIndex >=
          entry.galaxyIndex
      ) {
        throw new RangeError(
          'GalaxyArchiveSnapshot entries must be unique and strictly sorted by galaxyIndex ascending.',
        );
      }
    }

    const focusedEntries =
      copiedEntries.filter(
        (
          entry,
        ) =>
          entry.isCurrentFocus,
      );

    if (
      focusedEntries.length !==
      1
    ) {
      throw new RangeError(
        `GalaxyArchiveSnapshot must contain exactly one focused entry, found ${focusedEntries.length}.`,
      );
    }

    if (
      focusedEntries[0]
        .galaxyIndex !==
      currentFocusGalaxyIndex
    ) {
      throw new RangeError(
        'Focused entry galaxyIndex must match currentFocusGalaxyIndex.',
      );
    }

    this.currentFocusGalaxyIndex =
      currentFocusGalaxyIndex;

    this.entries =
      Object.freeze(
        copiedEntries,
      );
  }

  get knownGalaxyCount():
    bigint {

    return BigInt(
      this
        .entries
        .length,
    );
  }

  get focusedEntry():
    GalaxyArchiveEntry {

    const focused =
      this
        .entries
        .find(
          (
            entry,
          ) =>
            entry.isCurrentFocus,
        );

    if (
      focused ===
      undefined
    ) {
      throw new Error(
        'GalaxyArchiveSnapshot invariant broken: focused entry is missing.',
      );
    }

    return focused;
  }

  entryForGalaxy(
    galaxyIndex:
      bigint,
  ): GalaxyArchiveEntry | undefined {

    assertNonNegativeSignedLong(
      galaxyIndex,
      'galaxyIndex',
    );

    return this
      .entries
      .find(
        (
          entry,
        ) =>
          entry.galaxyIndex ===
          galaxyIndex,
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
