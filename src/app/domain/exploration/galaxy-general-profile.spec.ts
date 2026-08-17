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
  GalaxyType,
} from '../universe/galaxy-type';

import {
  GalaxyGeneralProfile,
} from './galaxy-general-profile';

import {
  GalaxyKnowledgeState,
} from './galaxy-knowledge-state';

describe(
  'GalaxyGeneralProfile',
  () => {
    function preliminary(
      state:
        DiscoveryStateValue,
    ): ExternalGalaxyPreliminaryInformation {

      return new ExternalGalaxyPreliminaryInformation(
        1n,
        'GEN-V1-G1-A448D6B11BAF31F30904C808DE482290',
        state,
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
      'should keep a DETECTED galaxy restricted to preliminary information',
      () => {
        const profile =
          new GalaxyGeneralProfile(
            preliminary(
              DiscoveryState.DETECTED,
            ),
            null,
            null,
          );

        expect(
          profile.galaxyIndex,
        ).toBe(
          1n,
        );

        expect(
          profile.galaxyKnowledgeState,
        ).toBe(
          GalaxyKnowledgeState
            .DETECTED,
        );

        expect(
          profile.knownName,
        ).toBeNull();

        expect(
          profile.galaxyType,
        ).toBeNull();

        expect(
          profile.hasKnownIdentity,
        ).toBe(false);
      },
    );

    it(
      'should expose proper name and exact GalaxyType from DISCOVERED',
      () => {
        const profile =
          new GalaxyGeneralProfile(
            preliminary(
              DiscoveryState.DISCOVERED,
            ),
            'Kelphiis',
            GalaxyType
              .BARRED_SPIRAL,
          );

        expect(
          profile.knowledgeState,
        ).toBe(
          DiscoveryState
            .DISCOVERED,
        );

        expect(
          profile.galaxyKnowledgeState,
        ).toBe(
          GalaxyKnowledgeState
            .DISCOVERED,
        );

        expect(
          profile.knownName,
        ).toBe(
          'Kelphiis',
        );

        expect(
          profile.galaxyType,
        ).toBe(
          GalaxyType
            .BARRED_SPIRAL,
        );

        expect(
          profile.hasKnownIdentity,
        ).toBe(true);
      },
    );

    it(
      'should reject proper name or exact GalaxyType leakage while DETECTED',
      () => {
        expect(
          () =>
            new GalaxyGeneralProfile(
              preliminary(
                DiscoveryState.DETECTED,
              ),
              'Kelphiis',
              null,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyGeneralProfile(
              preliminary(
                DiscoveryState.DETECTED,
              ),
              null,
              GalaxyType
                .BARRED_SPIRAL,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should require both known identity fields from DISCOVERED onward',
      () => {
        expect(
          () =>
            new GalaxyGeneralProfile(
              preliminary(
                DiscoveryState.DISCOVERED,
              ),
              null,
              GalaxyType
                .BARRED_SPIRAL,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyGeneralProfile(
              preliminary(
                DiscoveryState.VISITED,
              ),
              'Kelphiis',
              null,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyGeneralProfile(
              preliminary(
                DiscoveryState.CONFIRMED,
              ),
              '   ',
              GalaxyType
                .BARRED_SPIRAL,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
