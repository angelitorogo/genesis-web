import {
  GlobularCluster,
} from '../../domain/galactic-object/globular-cluster';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ExplorationSectorResultEngine,
} from '../exploration/exploration-sector-result-engine';

import {
  GalaxySectorGridGenerator,
} from '../sector/galaxy-sector-grid-generator';

import {
  GalaxySectorStellarDensityGenerator,
} from '../sector/galaxy-sector-stellar-density-generator';

import {
  GalaxySectorStellarPopulationPropertiesGenerator,
} from '../sector/galaxy-sector-stellar-population-properties-generator';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  GlobularClusterGenerator,
} from './globular-cluster-generator';

import {
  OpenClusterGenerator,
} from './open-cluster-generator';

describe(
  'GlobularClusterGenerator',
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

    const grid =
      GalaxySectorGridGenerator
        .generate(
          galaxy,
        );

    const centralSectorKey =
      grid.sectorKeyFor({
        x:
          0,
        y:
          0,
      });

    function locator(
      galacticObjectIndex:
        bigint,

      sectorKey =
        centralSectorKey,
    ): GalacticObjectLocator {

      return new GalacticObjectLocator(
        0n,
        sectorKey,
        galacticObjectIndex,
      );
    }

    it(
      'should materialize the point-12.5 complement reserved by point 12.4 inside STAR_CLUSTER',
      () => {
        const target =
          locator(
            7n,
          );

        expect(
          ExplorationSectorResultEngine
            .resolveGalacticObjectKind(
              generationKey,
              target,
            ),
        ).toBe(
          ExplorationResultKind
            .STAR_CLUSTER,
        );

        expect(
          OpenClusterGenerator
            .isOpenClusterLocator(
              generationKey,
              target,
            ),
        ).toBe(
          false,
        );

        expect(
          GlobularClusterGenerator
            .isGlobularClusterLocator(
              generationKey,
              target,
            ),
        ).toBe(
          true,
        );

        expect(
          GlobularClusterGenerator
            .generate(
              generationKey,
              target,
            ),
        ).toBeInstanceOf(
          GlobularCluster,
        );
      },
    );

    it(
      'should reject locators outside the canonical point-9.4 STAR_CLUSTER family',
      () => {
        const target =
          locator(
            1n,
          );

        expect(
          ExplorationSectorResultEngine
            .resolveGalacticObjectKind(
              generationKey,
              target,
            ),
        ).not.toBe(
          ExplorationResultKind
            .STAR_CLUSTER,
        );

        expect(
          GlobularClusterGenerator
            .isGlobularClusterLocator(
              generationKey,
              target,
            ),
        ).toBe(
          false,
        );

        expect(
          () =>
            GlobularClusterGenerator
              .generate(
                generationKey,
                target,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should complete STAR_CLUSTER as an exact non-overlapping open/globular partition',
      () => {
        let starClusterCount =
          0;

        let openCount =
          0;

        let globularCount =
          0;

        for (
          let index = 0n;
          index < 512n;
          index += 1n
        ) {
          const target =
            locator(
              index,
            );

          if (
            ExplorationSectorResultEngine
              .resolveGalacticObjectKind(
                generationKey,
                target,
              ) !==
            ExplorationResultKind
              .STAR_CLUSTER
          ) {
            continue;
          }

          starClusterCount +=
            1;

          const isOpen =
            OpenClusterGenerator
              .isOpenClusterLocator(
                generationKey,
                target,
              );

          const isGlobular =
            GlobularClusterGenerator
              .isGlobularClusterLocator(
                generationKey,
                target,
              );

          expect(
            Number(
              isOpen,
            ) +
            Number(
              isGlobular,
            ),
          ).toBe(
            1,
          );

          if (
            isOpen
          ) {
            openCount +=
              1;
          }

          if (
            isGlobular
          ) {
            globularCount +=
              1;
          }
        }

        expect(
          starClusterCount,
        ).toBeGreaterThan(
          100,
        );

        expect(
          openCount,
        ).toBeGreaterThan(
          100,
        );

        expect(
          globularCount,
        ).toBeGreaterThan(
          10,
        );

        expect(
          openCount +
          globularCount,
        ).toBe(
          starClusterCount,
        );
      },
      30_000,
    );

    it(
      'should regenerate exactly the same aggregate Ground Truth for the same locator',
      () => {
        const target =
          locator(
            7n,
          );

        const first =
          GlobularClusterGenerator
            .generate(
              generationKey,
              target,
            );

        const second =
          GlobularClusterGenerator
            .generate(
              generationKey,
              target,
            );

        expect(
          second.physicalProperties,
        ).toEqual(
          first.physicalProperties,
        );

        expect(
          second.location,
        ).toEqual(
          first.location,
        );
      },
    );

    it(
      'should keep age bounded by the host and metallicity below the local sector baseline',
      () => {
        const target =
          locator(
            7n,
          );

        const density =
          GalaxySectorStellarDensityGenerator
            .generate(
              galaxy,
              grid,
              {
                x:
                  0,
                y:
                  0,
              },
            );

        const environment =
          GalaxySectorStellarPopulationPropertiesGenerator
            .generate(
              galaxy,
              density,
            );

        const properties =
          GlobularClusterGenerator
            .generate(
              generationKey,
              target,
            )
            .physicalProperties;

        expect(
          properties.ageBillionYears,
        ).toBeGreaterThanOrEqual(
          Math.max(
            0.5,
            galaxy
              .physicalProperties
              .ageBillionYears *
              0.65,
          ),
        );

        expect(
          properties.ageBillionYears,
        ).toBeLessThan(
          galaxy
            .physicalProperties
            .ageBillionYears,
        );

        expect(
          properties.metallicitySolarRatio,
        ).toBeGreaterThanOrEqual(
          environment
            .characteristicMetallicitySolarRatio *
            0.04,
        );

        expect(
          properties.metallicitySolarRatio,
        ).toBeLessThanOrEqual(
          environment
            .characteristicMetallicitySolarRatio *
            0.45,
        );
      },
    );

    it(
      'should keep aggregate globular-cluster ranges valid across a deterministic sample',
      () => {
        let checked =
          0;

        for (
          let index = 0n;
          index < 512n;
          index += 1n
        ) {
          const target =
            locator(
              index,
            );

          if (
            !GlobularClusterGenerator
              .isGlobularClusterLocator(
                generationKey,
                target,
              )
          ) {
            continue;
          }

          const properties =
            GlobularClusterGenerator
              .generate(
                generationKey,
                target,
              )
              .physicalProperties;

          checked +=
            1;

          expect(
            properties.stellarCount,
          ).toBeGreaterThanOrEqual(
            20_000,
          );

          expect(
            properties.stellarCount,
          ).toBeLessThanOrEqual(
            2_000_000,
          );

          expect(
            properties.massSolarMasses,
          ).toBeGreaterThan(
            0,
          );

          expect(
            properties.ageBillionYears,
          ).toBeGreaterThan(
            0,
          );

          expect(
            properties.ageBillionYears,
          ).toBeLessThan(
            galaxy
              .physicalProperties
              .ageBillionYears,
          );

          expect(
            properties.metallicitySolarRatio,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            properties.coreRadiusParsecs,
          ).toBeGreaterThan(
            0,
          );

          expect(
            properties.halfLightRadiusParsecs,
          ).toBeGreaterThan(
            properties.coreRadiusParsecs,
          );

          expect(
            properties.tidalRadiusParsecs,
          ).toBeGreaterThan(
            properties.halfLightRadiusParsecs,
          );

          expect(
            properties.centralConcentration,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            properties.centralConcentration,
          ).toBeLessThanOrEqual(
            1,
          );

          expect(
            properties.stellarRemnantFraction,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            properties.stellarRemnantFraction,
          ).toBeLessThanOrEqual(
            1,
          );
        }

        expect(
          checked,
        ).toBeGreaterThan(
          10,
        );
      },
      30_000,
    );

    it(
      'should preserve the open-cluster branch frozen by point 12.4',
      () => {
        const target =
          locator(
            2n,
          );

        expect(
          OpenClusterGenerator
            .isOpenClusterLocator(
              generationKey,
              target,
            ),
        ).toBe(
          true,
        );

        expect(
          GlobularClusterGenerator
            .isGlobularClusterLocator(
              generationKey,
              target,
            ),
        ).toBe(
          false,
        );
      },
    );

    it(
      'should reject a locator whose sector key resolves outside the galaxy grid',
      () => {
        let target:
          GalacticObjectLocator | null =
          null;

        for (
          let index = 0n;
          index < 2_048n;
          index += 1n
        ) {
          const candidate =
            locator(
              index,
              2_147_483_647n <<
                32n,
            );

          if (
            GlobularClusterGenerator
              .isGlobularClusterLocator(
                generationKey,
                candidate,
              )
          ) {
            target =
              candidate;
            break;
          }
        }

        expect(
          target,
        ).not.toBeNull();

        expect(
          () =>
            GlobularClusterGenerator
              .generate(
                generationKey,
                target!,
              ),
        ).toThrow(
          RangeError,
        );
      },
      30_000,
    );
  },
);
