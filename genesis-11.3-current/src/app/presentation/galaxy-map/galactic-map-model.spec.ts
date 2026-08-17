import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorCoordinates,
} from '../../domain/sector/galaxy-sector-coordinates';

import {
  GalaxySectorGrid,
} from '../../domain/sector/galaxy-sector-grid';

import {
  GalaxySectorKeyCodec,
} from '../../domain/sector/galaxy-sector-key-codec';

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
  GalacticMapDiscoveryMarker,
  GalacticMapDiscoveryMarkers,
} from './galactic-map-discovery-markers';

import {
  buildGalacticMapEnvironmentalLayers,
} from './galactic-map-environmental-layers';

import {
  GalacticMapExplorationCoverage,
} from './galactic-map-exploration-coverage';

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

    function coverageAndMarkers() {
      const grid =
        new GalaxySectorGrid(
          generationKey,
          0n,
          1000,
          2,
        );

      const coordinates =
        new GalaxySectorCoordinates(
          0,
          0,
        );

      const coverage =
        new GalacticMapExplorationCoverage(
          generationKey,
          0n,
          grid,
          [
            coordinates,
          ],
        );

      const markers =
        new GalacticMapDiscoveryMarkers(
          generationKey,
          0n,
          grid,
          [
            new GalacticMapDiscoveryMarker(
              new SystemLocator(
                0n,
                GalaxySectorKeyCodec
                  .encode(
                    coordinates,
                  ),
                0n,
              ),
              ExplorationResultKind.SYSTEM,
              DiscoveryState.DETECTED,
              coordinates,
              0.25,
              0.75,
            ),
          ],
        );

      return {
        coverage,
        markers,
      };
    }

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
            null,
            null,
            null,
            'Caeloria',
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

        expect(
          model.knownName,
        ).toBe(
          'Caeloria',
        );
      },
    );

    it(
      'should allow a detected galaxy only without detailed visual, coverage, markers or exact morphological Ground Truth',
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

        expect(
          model.explorationCoverage,
        ).toBeNull();

        expect(
          model.discoveryMarkers,
        ).toBeNull();

        expect(
          model.environmentalLayers,
        ).toBeNull();
      },
    );

    it(
      'should reject a proper name before DISCOVERED',
      () => {
        const information =
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              generationKey,
              1n,
              DiscoveryState.DETECTED,
            );

        expect(
          () =>
            new GalacticMapModel(
              generationKey,
              1n,
              information,
              null,
              null,
              null,
              null,
              null,
              'Hidden-name',
            ),
        ).toThrow(
          RangeError,
        );
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

    it(
      'should expose matching point-10.3 coverage and point-10.4 persistent markers together',
      () => {
        const {
          coverage,
          markers,
        } =
          coverageAndMarkers();

        const environmentalLayers =
          buildGalacticMapEnvironmentalLayers(
            galaxy,
            coverage.grid,
            visualStructure,
          );

        const model =
          new GalacticMapModel(
            generationKey,
            0n,
            discoveredInformation,
            visualStructure,
            galaxy.type,
            coverage,
            markers,
            environmentalLayers,
          );

        expect(
          model.explorationCoverage,
        ).toBe(
          coverage,
        );

        expect(
          model.discoveryMarkers,
        ).toBe(
          markers,
        );

        expect(
          model.discoveryMarkers?.markerCount,
        ).toBe(
          1,
        );

        expect(
          model.environmentalLayers,
        ).toBe(
          environmentalLayers,
        );

        expect(
          model.environmentalLayers?.habitabilityModelStatus,
        ).toBeTruthy();
      },
    );

    it(
      'should reject exploration coverage before DISCOVERED or from another galaxy',
      () => {
        const detectedInformation =
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              generationKey,
              1n,
              DiscoveryState.DETECTED,
            );

        const detectedGrid =
          new GalaxySectorGrid(
            generationKey,
            1n,
            1000,
            2,
          );

        const detectedCoverage =
          new GalacticMapExplorationCoverage(
            generationKey,
            1n,
            detectedGrid,
            [],
          );

        expect(
          () =>
            new GalacticMapModel(
              generationKey,
              1n,
              detectedInformation,
              null,
              null,
              detectedCoverage,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalacticMapModel(
              generationKey,
              0n,
              discoveredInformation,
              visualStructure,
              galaxy.type,
              detectedCoverage,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject persistent markers before DISCOVERED or without the matching point-10.3 coverage grid',
      () => {
        const {
          coverage,
          markers,
        } =
          coverageAndMarkers();

        expect(
          () =>
            new GalacticMapModel(
              generationKey,
              0n,
              discoveredInformation,
              visualStructure,
              galaxy.type,
              null,
              markers,
            ),
        ).toThrow(
          RangeError,
        );

        const detectedInformation =
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
              detectedInformation,
              null,
              null,
              coverage,
              markers,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );


    it(
      'should reject point-10.5 environmental layers without the matching coverage grid',
      () => {
        const {
          coverage,
        } =
          coverageAndMarkers();

        const environmentalLayers =
          buildGalacticMapEnvironmentalLayers(
            galaxy,
            coverage.grid,
            visualStructure,
          );

        expect(
          () =>
            new GalacticMapModel(
              generationKey,
              0n,
              discoveredInformation,
              visualStructure,
              galaxy.type,
              null,
              null,
              environmentalLayers,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
