import {
  DiscoveredToVisitedEntry,
  DiscoveredToVisitedEntryKind,
} from './discovered-to-visited-entry';

describe(
  'DiscoveredToVisitedEntry point 26.A.4',
  () => {
    it(
      'should freeze exactly scene and detailed-card as visit-recording interaction surfaces',
      () => {
        expect(
          Object.values(
            DiscoveredToVisitedEntryKind,
          ),
        ).toEqual([
          'SCENE',
          'DETAILED_CARD',
        ]);

        for (
          const kind
          of Object.values(
            DiscoveredToVisitedEntryKind,
          )
        ) {
          const entry =
            new DiscoveredToVisitedEntry(
              kind,
            );

          expect(
            entry.kind,
          ).toBe(
            kind,
          );

          expect(
            Object.isFrozen(
              entry,
            ),
          ).toBe(true);
        }
      },
    );

    it(
      'should reject synthetic interaction kinds so navigation cannot invent another VISITED trigger',
      () => {
        expect(
          () =>
            new DiscoveredToVisitedEntry(
              'PREVIEW' as never,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should carry interaction identity only and no Ground Truth or scientific evidence payload',
      () => {
        const entry =
          new DiscoveredToVisitedEntry(
            DiscoveredToVisitedEntryKind
              .SCENE,
          );

        expect(
          Object.keys(
            entry,
          ),
        ).toEqual([
          'kind',
        ]);
      },
    );
  },
);
