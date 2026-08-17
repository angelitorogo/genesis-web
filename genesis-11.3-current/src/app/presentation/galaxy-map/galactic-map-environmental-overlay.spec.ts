import * as THREE from 'three';

import {
  GalacticHabitabilityBand,
  GalacticHabitabilityModelStatus,
} from '../../domain/habitability/galactic-habitability-profile';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorGrid,
} from '../../domain/sector/galaxy-sector-grid';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  createGalacticMapEnvironmentalOverlay,
} from './galactic-map-environmental-overlay';

import {
  GalacticMapEnvironmentalLayers,
  GalacticMapHabitabilityRing,
} from './galactic-map-environmental-layers';

describe(
  'GalacticMapEnvironmentalOverlay',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const layers =
      new GalacticMapEnvironmentalLayers(
        generationKey,
        0n,
        new GalaxySectorGrid(
          generationKey,
          0n,
          1000,
          4,
        ),
        {
          centralOuterRadiusNormalized:
            0.15,
          innerOuterRadiusNormalized:
            0.40,
          middleOuterRadiusNormalized:
            0.70,
          nominalOuterRadiusNormalized:
            1.00,
        },
        GalacticHabitabilityModelStatus
          .SPECULATIVE_SIMPLIFIED,
        [
          new GalacticMapHabitabilityRing(
            0.28,
            0.62,
            GalacticHabitabilityBand
              .FAVORED,
          ),
          new GalacticMapHabitabilityRing(
            0.62,
            0.74,
            GalacticHabitabilityBand
              .HIGH_POTENTIAL,
          ),
        ],
        5,
      );

    it(
      'should render four exact region boundaries and one mesh per speculative GHZ ring',
      () => {
        const overlay =
          createGalacticMapEnvironmentalOverlay(
            layers,
          );

        const regions =
          overlay
            .object3d
            .getObjectByName(
              'galactic-map-regions-layer',
            );

        const habitability =
          overlay
            .object3d
            .getObjectByName(
              'galactic-map-habitable-zone-layer',
            );

        expect(
          regions,
        ).toBeInstanceOf(
          THREE.Group,
        );

        expect(
          regions
            ?.children
            .filter(
              (
                child,
              ) =>
                child instanceof
                  THREE.LineLoop,
            ),
        ).toHaveLength(
          4,
        );

        expect(
          habitability,
        ).toBeInstanceOf(
          THREE.Group,
        );

        expect(
          habitability
            ?.children
            .filter(
              (
                child,
              ) =>
                child instanceof
                  THREE.Mesh,
            ),
        ).toHaveLength(
          2,
        );

        overlay.dispose();
      },
    );

    it(
      'should toggle regions and habitable zone independently without affecting the other layer',
      () => {
        const overlay =
          createGalacticMapEnvironmentalOverlay(
            layers,
          );

        const regions =
          overlay
            .object3d
            .getObjectByName(
              'galactic-map-regions-layer',
            );

        const habitability =
          overlay
            .object3d
            .getObjectByName(
              'galactic-map-habitable-zone-layer',
            );

        overlay.setRegionsVisible(
          false,
        );

        expect(
          regions?.visible,
        ).toBe(
          false,
        );

        expect(
          habitability?.visible,
        ).toBe(
          true,
        );

        overlay.setHabitabilityVisible(
          false,
        );

        expect(
          habitability?.visible,
        ).toBe(
          false,
        );

        overlay.setRegionsVisible(
          true,
        );

        expect(
          regions?.visible,
        ).toBe(
          true,
        );

        overlay.dispose();
      },
    );

    it(
      'should dispose all renderer resources and clear the root group',
      () => {
        const overlay =
          createGalacticMapEnvironmentalOverlay(
            layers,
          );

        overlay.dispose();

        expect(
          overlay.object3d.children,
        ).toHaveLength(
          0,
        );
      },
    );
  },
);
