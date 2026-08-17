import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../discovery/discovery-state';

import {
  ExternalGalaxyMorphologyHint,
  ExternalGalaxyNuclearActivityHint,
  ExternalGalaxyPreliminaryInformation,
  ExternalGalaxyScaleHint,
  ExternalGalaxyStellarPopulationHint,
} from '../observation/galaxy/external-galaxy-preliminary-information';

import {
  GalaxyArchiveEntry,
  GalaxyArchiveSnapshot,
} from './galaxy-archive';

describe(
  'GalaxyArchive',
  () => {

    function preliminary(
      galaxyIndex:
        bigint,

      knowledgeState:
        DiscoveryStateValue =
          DiscoveryState.DETECTED,
    ): ExternalGalaxyPreliminaryInformation {

      return new ExternalGalaxyPreliminaryInformation(
        galaxyIndex,
        `GEN-V1-G${galaxyIndex}-TEST`,
        knowledgeState,
        ExternalGalaxyMorphologyHint
          .DISK_LIKE,
        ExternalGalaxyScaleHint
          .MEDIUM,
        ExternalGalaxyStellarPopulationHint
          .HIGH,
        ExternalGalaxyNuclearActivityHint
          .NO_CLEAR_ACTIVITY,
      );
    }

    it(
      'should expose archive-entry fields only through preliminary information plus focus',
      () => {
        const entry =
          new GalaxyArchiveEntry(
            preliminary(
              7n,
              DiscoveryState.CATALOGUED,
            ),
            true,
          );

        expect(
          entry.galaxyIndex,
        ).toBe(
          7n,
        );

        expect(
          entry.designationCode,
        ).toBe(
          'GEN-V1-G7-TEST',
        );

        expect(
          entry.knowledgeState,
        ).toBe(
          DiscoveryState.CATALOGUED,
        );

        expect(
          entry.isCurrentFocus,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should expose a valid sorted snapshot with count focus and lookup helpers',
      () => {
        const snapshot =
          new GalaxyArchiveSnapshot(
            1n,
            [
              new GalaxyArchiveEntry(
                preliminary(
                  0n,
                  DiscoveryState.DISCOVERED,
                ),
                false,
              ),

              new GalaxyArchiveEntry(
                preliminary(
                  1n,
                  DiscoveryState.DETECTED,
                ),
                true,
              ),
            ],
          );

        expect(
          snapshot.knownGalaxyCount,
        ).toBe(
          2n,
        );

        expect(
          snapshot.focusedEntry
            .galaxyIndex,
        ).toBe(
          1n,
        );

        expect(
          snapshot
            .entryForGalaxy(
              0n,
            )
            ?.knowledgeState,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          snapshot
            .entryForGalaxy(
              99n,
            ),
        ).toBeUndefined();
      },
    );

    it(
      'should enforce non-empty unique sorted entries and exactly one matching focus',
      () => {
        expect(
          () =>
            new GalaxyArchiveSnapshot(
              -1n,
              [
                new GalaxyArchiveEntry(
                  preliminary(
                    0n,
                  ),
                  true,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyArchiveSnapshot(
              0n,
              [],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyArchiveSnapshot(
              0n,
              [
                new GalaxyArchiveEntry(
                  preliminary(
                    0n,
                  ),
                  true,
                ),

                new GalaxyArchiveEntry(
                  preliminary(
                    0n,
                  ),
                  false,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyArchiveSnapshot(
              1n,
              [
                new GalaxyArchiveEntry(
                  preliminary(
                    1n,
                  ),
                  true,
                ),

                new GalaxyArchiveEntry(
                  preliminary(
                    0n,
                  ),
                  false,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyArchiveSnapshot(
              0n,
              [
                new GalaxyArchiveEntry(
                  preliminary(
                    0n,
                  ),
                  false,
                ),

                new GalaxyArchiveEntry(
                  preliminary(
                    1n,
                  ),
                  false,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyArchiveSnapshot(
              0n,
              [
                new GalaxyArchiveEntry(
                  preliminary(
                    0n,
                  ),
                  true,
                ),

                new GalaxyArchiveEntry(
                  preliminary(
                    1n,
                  ),
                  true,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyArchiveSnapshot(
              1n,
              [
                new GalaxyArchiveEntry(
                  preliminary(
                    0n,
                  ),
                  true,
                ),

                new GalaxyArchiveEntry(
                  preliminary(
                    1n,
                  ),
                  false,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should preserve signed Long boundaries in snapshot lookup',
      () => {
        const max =
          9_223_372_036_854_775_807n;

        const snapshot =
          new GalaxyArchiveSnapshot(
            max,
            [
              new GalaxyArchiveEntry(
                preliminary(
                  max,
                ),
                true,
              ),
            ],
          );

        expect(
          snapshot
            .entryForGalaxy(
              max,
            )
            ?.galaxyIndex,
        ).toBe(
          max,
        );

        expect(
          () =>
            snapshot
              .entryForGalaxy(
                -1n,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            snapshot
              .entryForGalaxy(
                max +
                  1n,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
