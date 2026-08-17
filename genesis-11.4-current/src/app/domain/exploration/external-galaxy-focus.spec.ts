import {
  DiscoveryState,
} from '../discovery/discovery-state';

import {
  ExternalGalaxyFocusChoice,
  ExternalGalaxyFocusDecision,
  ExternalGalaxyFocusOffer,
} from './external-galaxy-focus';

describe(
  'ExternalGalaxyFocus',
  () => {

    function canonicalOffer():
      ExternalGalaxyFocusOffer {

      return new ExternalGalaxyFocusOffer(
        0n,
        1n,
        DiscoveryState.DETECTED,
      );
    }

    it(
      'should preserve the canonical focus offer and expose both explicit choices',
      () => {
        const offer =
          canonicalOffer();

        expect(
          offer.currentGalaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          offer.detectedGalaxyIndex,
        ).toBe(
          1n,
        );

        expect(
          offer.detectedGalaxyKnowledgeState,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          offer.availableChoices,
        ).toEqual([
          ExternalGalaxyFocusChoice
            .REMAIN_CURRENT,

          ExternalGalaxyFocusChoice
            .FOCUS_DETECTED,
        ]);
      },
    );

    it(
      'should enforce offer index and knowledge-state invariants',
      () => {
        expect(
          () =>
            new ExternalGalaxyFocusOffer(
              -1n,
              1n,
              DiscoveryState.DETECTED,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExternalGalaxyFocusOffer(
              0n,
              9_223_372_036_854_775_808n,
              DiscoveryState.DETECTED,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExternalGalaxyFocusOffer(
              1n,
              1n,
              DiscoveryState.DETECTED,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExternalGalaxyFocusOffer(
              0n,
              1n,
              DiscoveryState.UNKNOWN,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should expose derived decision values for both valid explicit choices',
      () => {
        const offer =
          canonicalOffer();

        const remain =
          new ExternalGalaxyFocusDecision(
            offer,
            ExternalGalaxyFocusChoice
              .REMAIN_CURRENT,
            0n,
          );

        expect(
          remain.previousFocusGalaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          remain.detectedGalaxyIndex,
        ).toBe(
          1n,
        );

        expect(
          remain.didChangeFocus,
        ).toBe(
          false,
        );

        expect(
          remain.remainedOnCurrentGalaxy,
        ).toBe(
          true,
        );

        expect(
          remain.focusedDetectedGalaxy,
        ).toBe(
          false,
        );

        const focus =
          new ExternalGalaxyFocusDecision(
            offer,
            ExternalGalaxyFocusChoice
              .FOCUS_DETECTED,
            1n,
          );

        expect(
          focus.didChangeFocus,
        ).toBe(
          true,
        );

        expect(
          focus.remainedOnCurrentGalaxy,
        ).toBe(
          false,
        );

        expect(
          focus.focusedDetectedGalaxy,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should enforce decision-choice coherence and reject invalid runtime choices',
      () => {
        const offer =
          canonicalOffer();

        expect(
          () =>
            new ExternalGalaxyFocusDecision(
              offer,
              ExternalGalaxyFocusChoice
                .REMAIN_CURRENT,
              1n,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExternalGalaxyFocusDecision(
              offer,
              ExternalGalaxyFocusChoice
                .FOCUS_DETECTED,
              0n,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExternalGalaxyFocusDecision(
              offer,
              'UNKNOWN' as
                ExternalGalaxyFocusChoice,
              0n,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
