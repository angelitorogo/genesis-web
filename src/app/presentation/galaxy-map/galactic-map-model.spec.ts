import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ExternalGalaxyPreliminaryInformationGenerator,
} from '../../simulation/observation/galaxy/external-galaxy-preliminary-information-generator';

import {
  GalaxyGenerator,
} from '../../simulation/universe/galaxy-generator';

import {
  GalaxyVisualStructureGenerator,
} from '../../simulation/universe/galaxy-visual-structure-generator';

import {
  GalacticMapModel,
} from './galactic-map-model';

describe(
  'GalacticMapModel',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const galaxy =
      GalaxyGenerator.generate(
        generationKey,
        0n,
      );

    const discoveredInformation =
      ExternalGalaxyPreliminaryInformationGenerator
        .generate(
          generationKey,
          0n,
          DiscoveryState.DISCOVERED,
        );

    const visualStructure =
      GalaxyVisualStructureGenerator
        .generate(
          galaxy,
        );

    it(
      'should expose the safe designation, detailed-scene flag and exact type for a discovered galaxy',
      () => {
        const model =
          new GalacticMapModel(
            generationKey,
            0n,
            discoveredInformation,
            visualStructure,
            galaxy.type,
          );

        expect(
          model.knowledgeState,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          model.designationCode,
        ).toMatch(
          /^GEN-V1-G0-/,
        );

        expect(
          model.hasDetailedScene,
        ).toBe(
          true,
        );

        expect(
          model.galaxyType,
        ).toBe(
          GalaxyType.ELLIPTICAL,
        );
      },
    );

    it(
      'should allow a detected galaxy only without detailed visual or exact morphological Ground Truth',
      () => {
        const information =
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              generationKey,
              1n,
              DiscoveryState.DETECTED,
            );

        const model =
          new GalacticMapModel(
            generationKey,
            1n,
            information,
            null,
          );

        expect(
          model.hasDetailedScene,
        ).toBe(
          false,
        );

        expect(
          model.galaxyType,
        ).toBeNull();
      },
    );

    it(
      'should reject detailed visual structure before DISCOVERED',
      () => {
        const information =
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              generationKey,
              0n,
              DiscoveryState.DETECTED,
            );

        expect(
          () =>
            new GalacticMapModel(
              generationKey,
              0n,
              information,
              visualStructure,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject exact GalaxyType before DISCOVERED',
      () => {
        const information =
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              generationKey,
              0n,
              DiscoveryState.DETECTED,
            );

        expect(
          () =>
            new GalacticMapModel(
              generationKey,
              0n,
              information,
              null,
              GalaxyType.ELLIPTICAL,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a discovered galaxy without its detailed visual structure or mismatched identity',
      () => {
        expect(
          () =>
            new GalacticMapModel(
              generationKey,
              0n,
              discoveredInformation,
              null,
              galaxy.type,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalacticMapModel(
              generationKey,
              1n,
              discoveredInformation,
              visualStructure,
              galaxy.type,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
