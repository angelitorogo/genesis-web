import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  SupernovaRemnantMorphology,
} from '../../domain/galactic-object/supernova-remnant-morphology';

import {
  SupernovaRemnant,
} from '../../domain/galactic-object/supernova-remnant';

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
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  SupernovaRemnantGenerator,
} from './supernova-remnant-generator';

const SWEPT_MASS_COEFFICIENT =
  0.144926239165513;

describe(
  'SupernovaRemnantGenerator',
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
      'should materialize a persistent supernova remnant only inside canonical EXTREME_OBJECT',
      () => {
        const target =
          locator(
            0n,
          );

        expect(
          ExplorationSectorResultEngine
            .resolveGalacticObjectKind(
              generationKey,
              target,
            ),
        ).toBe(
          ExplorationResultKind
            .EXTREME_OBJECT,
        );

        expect(
          SupernovaRemnantGenerator
            .isSupernovaRemnantLocator(
              generationKey,
              target,
            ),
        ).toBe(true);

        expect(
          SupernovaRemnantGenerator
            .generate(
              generationKey,
              target,
            ),
        ).toBeInstanceOf(
          SupernovaRemnant,
        );
      },
    );

    it(
      'should preserve a reserved EXTREME_OBJECT complement for later physical specializations',
      () => {
        const target =
          locator(
            18n,
          );

        expect(
          ExplorationSectorResultEngine
            .resolveGalacticObjectKind(
              generationKey,
              target,
            ),
        ).toBe(
          ExplorationResultKind
            .EXTREME_OBJECT,
        );

        expect(
          SupernovaRemnantGenerator
            .isSupernovaRemnantLocator(
              generationKey,
              target,
            ),
        ).toBe(false);

        expect(
          () =>
            SupernovaRemnantGenerator
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
      'should reject locators outside canonical EXTREME_OBJECT without changing point-9.4 families',
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
            .EXTREME_OBJECT,
        );

        expect(
          SupernovaRemnantGenerator
            .isSupernovaRemnantLocator(
              generationKey,
              target,
            ),
        ).toBe(false);
      },
    );

    it(
      'should regenerate exactly the same Ground Truth for the same locator',
      () => {
        const target =
          locator(
            0n,
          );

        const first =
          SupernovaRemnantGenerator
            .generate(
              generationKey,
              target,
            );

        const second =
          SupernovaRemnantGenerator
            .generate(
              generationKey,
              target,
            );

        expect(
          second.morphology,
        ).toBe(
          first.morphology,
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
      'should resolve morphology deterministically without requiring full physical materialization',
      () => {
        const target =
          locator(
            0n,
          );

        expect(
          SupernovaRemnantGenerator
            .resolveMorphology(
              generationKey,
              target,
            ),
        ).toBe(
          SupernovaRemnantGenerator
            .generate(
              generationKey,
              target,
            )
            .morphology,
        );
      },
    );

    it(
      'should keep all generated physical quantities finite and inside V1 bounds',
      () => {
        let checked =
          0;

        for (
          let index = 0n;
          index < 1_024n;
          index += 1n
        ) {
          const target =
            locator(
              index,
            );

          if (
            !SupernovaRemnantGenerator
              .isSupernovaRemnantLocator(
                generationKey,
                target,
              )
          ) {
            continue;
          }

          const properties =
            SupernovaRemnantGenerator
              .generate(
                generationKey,
                target,
              )
              .physicalProperties;

          checked +=
            1;

          expect(
            properties.ageYears,
          ).toBeGreaterThanOrEqual(
            300,
          );

          expect(
            properties.ageYears,
          ).toBeLessThanOrEqual(
            120_000,
          );

          expect(
            properties.radiusParsecs,
          ).toBeGreaterThanOrEqual(
            0.6,
          );

          expect(
            properties.radiusParsecs,
          ).toBeLessThanOrEqual(
            85,
          );

          expect(
            properties.expansionVelocityKmPerSecond,
          ).toBeGreaterThanOrEqual(
            40,
          );

          expect(
            properties.expansionVelocityKmPerSecond,
          ).toBeLessThanOrEqual(
            12_000,
          );

          expect(
            properties.explosionEnergyErgs,
          ).toBeGreaterThanOrEqual(
            5e50,
          );

          expect(
            properties.explosionEnergyErgs,
          ).toBeLessThanOrEqual(
            2e51,
          );

          expect(
            properties.ambientHydrogenNumberDensityPerCm3,
          ).toBeGreaterThanOrEqual(
            0.005,
          );

          expect(
            properties.ambientHydrogenNumberDensityPerCm3,
          ).toBeLessThanOrEqual(
            10,
          );

          expect(
            properties.ejectaMassSolarMasses,
          ).toBeGreaterThanOrEqual(
            0.8,
          );

          expect(
            properties.ejectaMassSolarMasses,
          ).toBeLessThanOrEqual(
            20,
          );
        }

        expect(
          checked,
        ).toBeGreaterThan(
          50,
        );
      },
      30_000,
    );

    it(
      'should keep derived shock and swept-mass quantities coherent with the same Ground Truth profile',
      () => {
        const properties =
          SupernovaRemnantGenerator
            .generate(
              generationKey,
              locator(
                0n,
              ),
            )
            .physicalProperties;

        expect(
          properties.sweptUpMassSolarMasses,
        ).toBeCloseTo(
          SWEPT_MASS_COEFFICIENT *
            properties.ambientHydrogenNumberDensityPerCm3 *
            properties.radiusParsecs **
              3,
          10,
        );

        expect(
          properties.shockTemperatureKelvin,
        ).toBeGreaterThanOrEqual(
          10_000,
        );
      },
    );

    it(
      'should keep all three V1 remnant morphologies reachable',
      () => {
        const morphologies =
          new Set<string>();

        for (
          let index = 0n;
          index < 2_048n;
          index += 1n
        ) {
          const target =
            locator(
              index,
            );

          if (
            SupernovaRemnantGenerator
              .isSupernovaRemnantLocator(
                generationKey,
                target,
              )
          ) {
            morphologies.add(
              SupernovaRemnantGenerator
                .generate(
                  generationKey,
                  target,
                )
                .morphology,
            );
          }
        }

        expect(
          morphologies,
        ).toEqual(
          new Set([
            SupernovaRemnantMorphology.SHELL,
            SupernovaRemnantMorphology.PLERION,
            SupernovaRemnantMorphology.COMPOSITE,
          ]),
        );
      },
      30_000,
    );

    it(
      'should keep both supernova-remnant and reserved EXTREME_OBJECT branches reachable',
      () => {
        let remnants =
          0;

        let reserved =
          0;

        for (
          let index = 0n;
          index < 1_024n;
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
              .EXTREME_OBJECT
          ) {
            continue;
          }

          if (
            SupernovaRemnantGenerator
              .isSupernovaRemnantLocator(
                generationKey,
                target,
              )
          ) {
            remnants +=
              1;
          } else {
            reserved +=
              1;
          }
        }

        expect(
          remnants,
        ).toBeGreaterThan(
          50,
        );

        expect(
          reserved,
        ).toBeGreaterThan(
          50,
        );
      },
      30_000,
    );

    it(
      'should reject unsupported generator versions without perturbing the V1 locator contract',
      () => {
        const unsupportedGenerationKey =
          new UniverseGenerationKey(
            generationKey
              .universeSeed,
            Object.freeze({
              name:
                'V2',
              code:
                2,
            }) as unknown as
              typeof GeneratorVersion.V1,
          );

        expect(
          () =>
            SupernovaRemnantGenerator
              .isSupernovaRemnantLocator(
                unsupportedGenerationKey,
                locator(
                  0n,
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
