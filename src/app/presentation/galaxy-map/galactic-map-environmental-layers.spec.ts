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
  GalaxySectorGridGenerator,
} from '../../simulation/sector/galaxy-sector-grid-generator';

import {
  GalaxyGenerator,
} from '../../simulation/universe/galaxy-generator';

import {
  GalaxyVisualStructureGenerator,
} from '../../simulation/universe/galaxy-visual-structure-generator';

import {
  buildGalacticMapEnvironmentalLayers,
  GalacticMapEnvironmentalLayers,
  GalacticMapHabitabilityRing,
} from './galactic-map-environmental-layers';

describe(
  'GalacticMapEnvironmentalLayers',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should reuse the frozen visual-region boundaries and build a radial speculative GHZ without enumerating the 2D grid',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            generationKey,
            0n,
          );

        const grid =
          GalaxySectorGridGenerator
            .generate(
              galaxy,
            );

        const visual =
          GalaxyVisualStructureGenerator
            .generate(
              galaxy,
            );

        const layers =
          buildGalacticMapEnvironmentalLayers(
            galaxy,
            grid,
            visual,
          );

        expect(
          layers.regionRadii,
        ).toEqual({
          centralOuterRadiusNormalized:
            0.15,
          innerOuterRadiusNormalized:
            0.40,
          middleOuterRadiusNormalized:
            0.70,
          nominalOuterRadiusNormalized:
            1.00,
        });

        expect(
          layers.radialSampleCount,
        ).toBe(
          grid.halfExtentInSectors +
          1,
        );

        expect(
          layers.radialSampleCount,
        ).toBeLessThan(
          Number(
            grid.sideLengthInSectors *
            grid.sideLengthInSectors,
          ),
        );

        expect(
          layers.habitabilityModelStatus,
        ).toBe(
          GalacticHabitabilityModelStatus
            .SPECULATIVE_SIMPLIFIED,
        );

        expect(
          layers.hasHabitableZone,
        ).toBe(
          true,
        );

        expect(
          layers.habitabilityRings.some(
            (
              ring,
            ) =>
              ring.innerRadiusNormalized <=
                0.5 &&
              ring.outerRadiusNormalized >=
                0.5,
          ),
        ).toBe(
          true,
        );

        expect(
          layers.habitabilityRings.every(
            (
              ring,
            ) =>
              ring.band ===
                GalacticHabitabilityBand
                  .FAVORED ||
              ring.band ===
                GalacticHabitabilityBand
                  .HIGH_POTENTIAL,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      'should render a new V2 galaxy using frozen galactic physics without leaking a V1 map identity',
      () => {
        const v2Key = new UniverseGenerationKey(
          generationKey.universeSeed,
          GeneratorVersion.V2,
        );
        const galaxyV1 = GalaxyGenerator.generate(generationKey, 0n);
        const galaxyV2 = GalaxyGenerator.generate(v2Key, 0n);
        const gridV1 = GalaxySectorGridGenerator.generate(galaxyV1);
        const gridV2 = GalaxySectorGridGenerator.generate(galaxyV2);
        const v1 = buildGalacticMapEnvironmentalLayers(
          galaxyV1,
          gridV1,
          GalaxyVisualStructureGenerator.generate(galaxyV1),
        );
        const v2 = buildGalacticMapEnvironmentalLayers(
          galaxyV2,
          gridV2,
          GalaxyVisualStructureGenerator.generate(galaxyV2),
        );

        expect(v2.generationKey).toBe(v2Key);
        expect(v2.grid.generationKey).toBe(v2Key);
        expect(v2.galaxyIndex).toBe(0n);
        expect(v2.regionRadii).toEqual(v1.regionRadii);
        expect(v2.habitabilityRings).toEqual(v1.habitabilityRings);
        // This independently verified seed DOES contain a speculative GHZ.
        // Empty rings in a different seed must not disable GHZ rendering globally.
        expect(v1.hasHabitableZone).toBe(true);
        expect(v2.hasHabitableZone).toBe(true);
        expect(v2.habitabilityRings.length).toBeGreaterThan(0);
        expect(v2.habitabilityModelStatus).toBe(v1.habitabilityModelStatus);
        expect(v2.radialSampleCount).toBe(v1.radialSampleCount);
        expect(() => buildGalacticMapEnvironmentalLayers(
          galaxyV2,
          gridV1,
          GalaxyVisualStructureGenerator.generate(galaxyV2),
        )).toThrow('canonical grid');
      },
    );

    it(
      'should be deterministic and query-order independent for the same galaxy',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            generationKey,
            0n,
          );

        const grid =
          GalaxySectorGridGenerator
            .generate(
              galaxy,
            );

        const visual =
          GalaxyVisualStructureGenerator
            .generate(
              galaxy,
            );

        const expected =
          buildGalacticMapEnvironmentalLayers(
            galaxy,
            grid,
            visual,
          );

        for (
          const galaxyIndex
          of [
            1n,
            3n,
            10n,
          ]
        ) {
          const otherGalaxy =
            GalaxyGenerator.generate(
              generationKey,
              galaxyIndex,
            );

          buildGalacticMapEnvironmentalLayers(
            otherGalaxy,
            GalaxySectorGridGenerator
              .generate(
                otherGalaxy,
              ),
            GalaxyVisualStructureGenerator
              .generate(
                otherGalaxy,
              ),
          );
        }

        expect(
          buildGalacticMapEnvironmentalLayers(
            galaxy,
            grid,
            visual,
          ),
        ).toEqual(
          expected,
        );
      },
    );

    it(
      'should validate environmental snapshot identity and non-overlapping normalized rings',
      () => {
        const grid =
          new GalaxySectorGrid(
            generationKey,
            0n,
            1000,
            2,
          );

        expect(
          () =>
            new GalacticMapEnvironmentalLayers(
              generationKey,
              0n,
              grid,
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
                  0.3,
                  0.6,
                  GalacticHabitabilityBand
                    .FAVORED,
                ),
                new GalacticMapHabitabilityRing(
                  0.5,
                  0.7,
                  GalacticHabitabilityBand
                    .HIGH_POTENTIAL,
                ),
              ],
              3,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalacticMapHabitabilityRing(
              0.7,
              0.6,
              GalacticHabitabilityBand
                .FAVORED,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
