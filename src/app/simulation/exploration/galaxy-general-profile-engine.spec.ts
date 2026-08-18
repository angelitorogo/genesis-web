import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GalaxyKnowledgeState,
} from '../../domain/exploration/galaxy-knowledge-state';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ExternalGalaxyMorphologyHint,
  ExternalGalaxyNuclearActivityHint,
  ExternalGalaxyScaleHint,
  ExternalGalaxyStellarPopulationHint,
} from '../../domain/observation/galaxy/external-galaxy-preliminary-information';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalaxyGeneralProfileEngine,
} from './galaxy-general-profile-engine';

describe(
  'GalaxyGeneralProfileEngine',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should build the canonical Caeloria DISCOVERED general profile without exposing exact physical values',
      () => {
        const profile =
          GalaxyGeneralProfileEngine
            .build(
              generationKey,
              0n,
              DiscoveryState
                .DISCOVERED,
            );

        expect(
          profile.knownName,
        ).toBe(
          'Caeloria',
        );

        expect(
          profile.galaxyType,
        ).toBe(
          GalaxyType
            .ELLIPTICAL,
        );

        expect(
          profile
            .preliminaryInformation
            .morphologyHint,
        ).toBe(
          ExternalGalaxyMorphologyHint
            .SPHEROIDAL,
        );

        expect(
          profile
            .preliminaryInformation
            .scaleHint,
        ).toBe(
          ExternalGalaxyScaleHint
            .LARGE,
        );

        expect(
          profile
            .preliminaryInformation
            .stellarPopulationHint,
        ).toBe(
          ExternalGalaxyStellarPopulationHint
            .HIGH,
        );

        expect(
          profile
            .preliminaryInformation
            .nuclearActivityHint,
        ).toBe(
          ExternalGalaxyNuclearActivityHint
            .NO_CLEAR_ACTIVITY,
        );

        expect(
          Object.keys(
            profile,
          ),
        ).not.toContain(
          'physicalProperties',
        );
      },
    );

    it(
      'should keep galaxy one DETECTED with preliminary identity only',
      () => {
        const profile =
          GalaxyGeneralProfileEngine
            .build(
              generationKey,
              1n,
              DiscoveryState
                .DETECTED,
            );

        expect(
          profile.knownName,
        ).toBeNull();

        expect(
          profile.galaxyType,
        ).toBeNull();

        expect(
          profile.galaxyKnowledgeState,
        ).toBe(
          GalaxyKnowledgeState
            .DETECTED,
        );

        expect(
          profile
            .preliminaryInformation
            .morphologyHint,
        ).toBe(
          ExternalGalaxyMorphologyHint
            .DISK_LIKE,
        );

        expect(
          profile.designationCode,
        ).toBe(
          'GEN-V1-G1-A448D6B11BAF31F30904C808DE482290',
        );
      },
    );

    it(
      'should reveal the frozen galaxy-one identity and exact type at DISCOVERED',
      () => {
        const profile =
          GalaxyGeneralProfileEngine
            .build(
              generationKey,
              1n,
              DiscoveryState
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
      },
    );

    it(
      'should preserve global VISITED, CATALOGUED and CONFIRMED precision while projecting the galaxy lifecycle to VISITED',
      () => {
        for (
          const state
          of [
            DiscoveryState.VISITED,
            DiscoveryState.CATALOGUED,
            DiscoveryState.CONFIRMED,
          ]
        ) {
          const profile =
            GalaxyGeneralProfileEngine
              .build(
                generationKey,
                0n,
                state,
              );

          expect(
            profile.knowledgeState,
          ).toBe(
            state,
          );

          expect(
            profile.galaxyKnowledgeState,
          ).toBe(
            GalaxyKnowledgeState
              .VISITED,
          );

          expect(
            profile.knownName,
          ).toBe(
            'Caeloria',
          );

          expect(
            profile.galaxyType,
          ).toBe(
            GalaxyType
              .ELLIPTICAL,
          );
        }
      },
    );

    it(
      'should reject UNKNOWN instead of materializing a general profile',
      () => {
        expect(
          () =>
            GalaxyGeneralProfileEngine
              .build(
                generationKey,
                0n,
                DiscoveryState
                  .UNKNOWN,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should be deterministic for the same generation key, galaxy and knowledge state',
      () => {
        const first =
          GalaxyGeneralProfileEngine
            .build(
              generationKey,
              42n,
              DiscoveryState
                .DISCOVERED,
            );

        const second =
          GalaxyGeneralProfileEngine
            .build(
              generationKey,
              42n,
              DiscoveryState
                .DISCOVERED,
            );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should remain independent of galaxy query order',
      () => {
        const expected =
          GalaxyGeneralProfileEngine
            .build(
              generationKey,
              42n,
              DiscoveryState
                .DISCOVERED,
            );

        GalaxyGeneralProfileEngine
          .build(
            generationKey,
            1n,
            DiscoveryState
              .DETECTED,
          );

        GalaxyGeneralProfileEngine
          .build(
            generationKey,
            987654321n,
            DiscoveryState
              .DISCOVERED,
          );

        const after =
          GalaxyGeneralProfileEngine
            .build(
              generationKey,
              42n,
              DiscoveryState
                .DISCOVERED,
            );

        expect(
          after,
        ).toEqual(
          expected,
        );
      },
    );

    it(
      'should support signed Long maximum galaxy index deterministically',
      () => {
        const longMax =
          (1n << 63n) -
          1n;

        const first =
          GalaxyGeneralProfileEngine
            .build(
              generationKey,
              longMax,
              DiscoveryState
                .DETECTED,
            );

        const second =
          GalaxyGeneralProfileEngine
            .build(
              generationKey,
              longMax,
              DiscoveryState
                .DETECTED,
            );

        expect(
          first.galaxyIndex,
        ).toBe(
          longMax,
        );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
      30_000,
    );
  },
);
