import {
  OpenCluster,
} from '../../domain/galactic-object/open-cluster';

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
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ExplorationSectorResultEngine,
} from '../exploration/exploration-sector-result-engine';

import {
  OpenClusterGenerator,
} from './open-cluster-generator';

describe(
  'OpenClusterGenerator',
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
      'should exclude the reserved QUIESCENT galactic-centre locator from the open-cluster subset',
      () => {
        const centre =
          locator(
            0n,
          );

        expect(
          ExplorationSectorResultEngine
            .resolveGalacticObjectKind(
              generationKey,
              centre,
            ),
        ).toBe(
          ExplorationResultKind.STAR_CLUSTER,
        );

        expect(
          OpenClusterGenerator
            .isOpenClusterLocator(
              generationKey,
              centre,
            ),
        ).toBe(
          false,
        );
      },
    );

    it(
      'should materialize only the point-12.4 open subset of the frozen point-9.4 STAR_CLUSTER family',
      () => {
        const target =
          locator(
            2n,
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
          true,
        );

        expect(
          OpenClusterGenerator
            .generate(
              generationKey,
              target,
            ),
        ).toBeInstanceOf(
          OpenCluster,
        );
      },
    );

    it(
      'should reject a locator belonging to another point-9.4 coarse family',
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
          OpenClusterGenerator
            .isOpenClusterLocator(
              generationKey,
              target,
            ),
        ).toBe(
          false,
        );

        expect(
          () =>
            OpenClusterGenerator
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
      'should preserve STAR_CLUSTER locators not assigned to open clusters for later specialization',
      () => {
        const reserved =
          locator(
            7n,
          );

        expect(
          ExplorationSectorResultEngine
            .resolveGalacticObjectKind(
              generationKey,
              reserved,
            ),
        ).toBe(
          ExplorationResultKind
            .STAR_CLUSTER,
        );

        expect(
          OpenClusterGenerator
            .isOpenClusterLocator(
              generationKey,
              reserved,
            ),
        ).toBe(
          false,
        );

        expect(
          () =>
            OpenClusterGenerator
              .generate(
                generationKey,
                reserved,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should regenerate exactly the same aggregate Ground Truth for the same locator',
      () => {
        const target =
          locator(
            2n,
          );

        const first =
          OpenClusterGenerator
            .generate(
              generationKey,
              target,
            );

        const second =
          OpenClusterGenerator
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
      'should preserve the frozen V1 central open-cluster vector',
      () => {
        const cluster =
          OpenClusterGenerator
            .generate(
              generationKey,
              locator(
                2n,
              ),
            );

        expect(
          cluster
            .physicalProperties
            .stellarCount,
        ).toBe(
          539,
        );

        expect(
          cluster
            .physicalProperties
            .massSolarMasses,
        ).toBeCloseTo(
          219.84804932252035,
          10,
        );

        expect(
          cluster
            .physicalProperties
            .ageMillionYears,
        ).toBeCloseTo(
          4974.60394661959,
          10,
        );

        expect(
          cluster
            .physicalProperties
            .metallicitySolarRatio,
        ).toBeCloseTo(
          1.424916109906893,
          10,
        );

        expect(
          cluster
            .physicalProperties
            .halfMassRadiusParsecs,
        ).toBeCloseTo(
          7.065567770142512,
          10,
        );

        expect(
          cluster
            .physicalProperties
            .tidalRadiusParsecs,
        ).toBeCloseTo(
          44.09126104299223,
          10,
        );

        expect(
          cluster
            .physicalProperties
            .binaryFraction,
        ).toBeCloseTo(
          0.601076248777099,
          10,
        );

        expect(
          cluster
            .physicalProperties
            .boundFraction,
        ).toBeCloseTo(
          0.4988430505852058,
          10,
        );
      },
    );

    it(
      'should keep age and metallicity conditioned by the existing sector stellar environment',
      () => {
        const target =
          locator(
            2n,
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
          OpenClusterGenerator
            .generate(
              generationKey,
              target,
            )
            .physicalProperties;

        expect(
          properties.ageMillionYears,
        ).toBeLessThanOrEqual(
          Math.min(
            6_000,
            environment
              .characteristicStellarAgeBillionYears *
              1_000,
          ),
        );

        expect(
          properties.metallicitySolarRatio,
        ).toBeGreaterThanOrEqual(
          environment
            .characteristicMetallicitySolarRatio *
            0.85,
        );

        expect(
          properties.metallicitySolarRatio,
        ).toBeLessThanOrEqual(
          environment
            .characteristicMetallicitySolarRatio *
            1.15,
        );
      },
    );

    it(
      'should keep aggregate physical ranges valid across a deterministic open-cluster sample',
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
            !OpenClusterGenerator
              .isOpenClusterLocator(
                generationKey,
                target,
              )
          ) {
            continue;
          }

          const properties =
            OpenClusterGenerator
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
            30,
          );

          expect(
            properties.stellarCount,
          ).toBeLessThanOrEqual(
            10_000,
          );

          expect(
            properties.massSolarMasses,
          ).toBeGreaterThan(
            0,
          );

          expect(
            properties.ageMillionYears,
          ).toBeGreaterThanOrEqual(
            3,
          );

          expect(
            properties.ageMillionYears,
          ).toBeLessThanOrEqual(
            6_000,
          );

          expect(
            properties.metallicitySolarRatio,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            properties.halfMassRadiusParsecs,
          ).toBeGreaterThan(
            0,
          );

          expect(
            properties.tidalRadiusParsecs,
          ).toBeGreaterThan(
            properties.halfMassRadiusParsecs,
          );

          expect(
            properties.binaryFraction,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            properties.binaryFraction,
          ).toBeLessThanOrEqual(
            1,
          );

          expect(
            properties.boundFraction,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            properties.boundFraction,
          ).toBeLessThanOrEqual(
            1,
          );
        }

        expect(
          checked,
        ).toBeGreaterThan(
          100,
        );
      },
      30_000,
    );

    it(
      'should keep both open and reserved STAR_CLUSTER branches reachable in V1',
      () => {
        let openCount =
          0;

        let reservedCount =
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

          if (
            OpenClusterGenerator
              .isOpenClusterLocator(
                generationKey,
                target,
              )
          ) {
            openCount +=
              1;
          } else {
            reservedCount +=
              1;
          }
        }

        expect(
          openCount,
        ).toBeGreaterThan(
          100,
        );

        expect(
          reservedCount,
        ).toBeGreaterThan(
          10,
        );
      },
      30_000,
    );

    it(
      'should reject a locator whose sector key resolves outside the galaxy grid',
      () => {
        let target:
          GalacticObjectLocator | null =
          null;

        for (
          let index = 0n;
          index < 1_024n;
          index += 1n
        ) {
          const candidate =
            locator(
              index,
              2_147_483_647n <<
                32n,
            );

          if (
            OpenClusterGenerator
              .isOpenClusterLocator(
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
            OpenClusterGenerator
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
