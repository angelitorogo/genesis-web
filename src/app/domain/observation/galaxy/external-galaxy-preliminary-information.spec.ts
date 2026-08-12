import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../discovery/discovery-state';
import { 
  ExternalGalaxyMorphologyHint, 
  ExternalGalaxyNuclearActivityHint, 
  ExternalGalaxyPreliminaryInformation, 
  ExternalGalaxyScaleHint, 
  ExternalGalaxyStellarPopulationHint 
} from './external-galaxy-preliminary-information';



describe(
  'ExternalGalaxyPreliminaryInformation',
  () => {

    function validInformation(
      knowledgeState:
        DiscoveryStateValue =
          DiscoveryState.DETECTED,
    ): ExternalGalaxyPreliminaryInformation {

      return new ExternalGalaxyPreliminaryInformation(
        1n,
        'GEN-V1-G1-A448D6B11BAF31F30904C808DE482290',
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
      'should preserve a valid preliminary detected-galaxy payload',
      () => {
        const information =
          validInformation();

        expect(
          information.galaxyIndex,
        ).toBe(
          1n,
        );

        expect(
          information.designationCode,
        ).toBe(
          'GEN-V1-G1-A448D6B11BAF31F30904C808DE482290',
        );

        expect(
          information.knowledgeState,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          information.morphologyHint,
        ).toBe(
          ExternalGalaxyMorphologyHint
            .DISK_LIKE,
        );

        expect(
          information.scaleHint,
        ).toBe(
          ExternalGalaxyScaleHint
            .MEDIUM,
        );

        expect(
          information.stellarPopulationHint,
        ).toBe(
          ExternalGalaxyStellarPopulationHint
            .HIGH,
        );

        expect(
          information.nuclearActivityHint,
        ).toBe(
          ExternalGalaxyNuclearActivityHint
            .NO_CLEAR_ACTIVITY,
        );
      },
    );

    it(
      'should accept every known DiscoveryState from DETECTED onwards',
      () => {
        for (
          const state of
          [
            DiscoveryState.DETECTED,
            DiscoveryState.DISCOVERED,
            DiscoveryState.VISITED,
            DiscoveryState.CATALOGUED,
            DiscoveryState.CONFIRMED,
          ]
        ) {
          expect(
            validInformation(
              state,
            ).knowledgeState,
          ).toBe(
            state,
          );
        }
      },
    );

    it(
      'should reject invalid galaxy indices and blank designation codes',
      () => {
        expect(
          () =>
            new ExternalGalaxyPreliminaryInformation(
              -1n,
              'GEN-V1-G1-X',
              DiscoveryState.DETECTED,
              ExternalGalaxyMorphologyHint
                .DISK_LIKE,
              ExternalGalaxyScaleHint
                .MEDIUM,
              ExternalGalaxyStellarPopulationHint
                .HIGH,
              ExternalGalaxyNuclearActivityHint
                .NO_CLEAR_ACTIVITY,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExternalGalaxyPreliminaryInformation(
              9_223_372_036_854_775_808n,
              'GEN-V1-G1-X',
              DiscoveryState.DETECTED,
              ExternalGalaxyMorphologyHint
                .DISK_LIKE,
              ExternalGalaxyScaleHint
                .MEDIUM,
              ExternalGalaxyStellarPopulationHint
                .HIGH,
              ExternalGalaxyNuclearActivityHint
                .NO_CLEAR_ACTIVITY,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExternalGalaxyPreliminaryInformation(
              1n,
              '   ',
              DiscoveryState.DETECTED,
              ExternalGalaxyMorphologyHint
                .DISK_LIKE,
              ExternalGalaxyScaleHint
                .MEDIUM,
              ExternalGalaxyStellarPopulationHint
                .HIGH,
              ExternalGalaxyNuclearActivityHint
                .NO_CLEAR_ACTIVITY,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject UNKNOWN knowledge and invalid runtime hint values',
      () => {
        expect(
          () =>
            validInformation(
              DiscoveryState.UNKNOWN,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExternalGalaxyPreliminaryInformation(
              1n,
              'GEN-V1-G1-X',
              DiscoveryState.DETECTED,
              'UNKNOWN' as
                ExternalGalaxyMorphologyHint,
              ExternalGalaxyScaleHint
                .MEDIUM,
              ExternalGalaxyStellarPopulationHint
                .HIGH,
              ExternalGalaxyNuclearActivityHint
                .NO_CLEAR_ACTIVITY,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);