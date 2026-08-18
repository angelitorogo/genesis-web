import {
  NebulaType,
} from '../../domain/galactic-object/nebula-type';

import {
  Nebula,
} from '../../domain/galactic-object/nebula';

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
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ExplorationSectorResultEngine,
} from '../exploration/exploration-sector-result-engine';

import {
  NebulaGenerator,
} from './nebula-generator';

describe(
  'NebulaGenerator',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const canonicalSectorKey =
      123456789n;

    function locator(
      galacticObjectIndex:
        bigint,
    ): GalacticObjectLocator {

      return new GalacticObjectLocator(
        0n,
        canonicalSectorKey,
        galacticObjectIndex,
      );
    }

    it(
      'should materialize a physical Nebula only for the frozen point-9.4 coarse NEBULA family',
      () => {
        const nebulaLocator =
          locator(
            3n,
          );

        expect(
          ExplorationSectorResultEngine
            .resolveGalacticObjectKind(
              generationKey,
              nebulaLocator,
            ),
        ).toBe(
          ExplorationResultKind.NEBULA,
        );

        expect(
          NebulaGenerator
            .isNebulaLocator(
              generationKey,
              nebulaLocator,
            ),
        ).toBe(
          true,
        );

        expect(
          NebulaGenerator
            .generate(
              generationKey,
              nebulaLocator,
            ),
        ).toBeInstanceOf(
          Nebula,
        );
      },
    );

    it(
      'should reject a locator canonically belonging to another point-9.4 family',
      () => {
        const nonNebulaLocator =
          locator(
            7n,
          );

        expect(
          ExplorationSectorResultEngine
            .resolveGalacticObjectKind(
              generationKey,
              nonNebulaLocator,
            ),
        ).not.toBe(
          ExplorationResultKind.NEBULA,
        );

        expect(
          NebulaGenerator
            .isNebulaLocator(
              generationKey,
              nonNebulaLocator,
            ),
        ).toBe(
          false,
        );

        expect(
          () =>
            NebulaGenerator
              .generate(
                generationKey,
                nonNebulaLocator,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should regenerate exactly the same subtype and physical profile for the same locator',
      () => {
        const target =
          locator(
            3n,
          );

        const first =
          NebulaGenerator
            .generate(
              generationKey,
              target,
            );

        const second =
          NebulaGenerator
            .generate(
              generationKey,
              target,
            );

        expect(
          second.nebulaType,
        ).toBe(
          first.nebulaType,
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
      'should preserve the frozen V1 subtype vectors for all four point-12.2 families',
      () => {
        const vectors = [
          [
            3n,
            NebulaType.EMISSION,
          ],
          [
            8n,
            NebulaType.REFLECTION,
          ],
          [
            16n,
            NebulaType.DARK,
          ],
          [
            10n,
            NebulaType.PLANETARY,
          ],
        ] as const;

        for (
          const [
            index,
            expectedType,
          ]
          of vectors
        ) {
          const generated =
            NebulaGenerator
              .generate(
                generationKey,
                locator(
                  index,
                ),
              );

          expect(
            generated.nebulaType,
          ).toBe(
            expectedType,
          );
        }
      },
    );

    it(
      'should preserve the frozen V1 emission-nebula physical vector',
      () => {
        const nebula =
          NebulaGenerator
            .generate(
              generationKey,
              locator(
                3n,
              ),
            );

        expect(
          nebula.nebulaType,
        ).toBe(
          NebulaType.EMISSION,
        );

        expect(
          nebula
            .physicalProperties
            .radiusParsecs,
        ).toBeCloseTo(
          38.727597435821,
          10,
        );

        expect(
          nebula
            .physicalProperties
            .massSolarMasses,
        ).toBeCloseTo(
          472.867834880914,
          10,
        );

        expect(
          nebula
            .physicalProperties
            .gasTemperatureKelvin,
        ).toBeCloseTo(
          7180.300390347838,
          10,
        );

        expect(
          nebula
            .physicalProperties
            .hydrogenNumberDensityPerCm3,
        ).toBeCloseTo(
          14.668014127953,
          10,
        );

        expect(
          nebula
            .physicalProperties
            .ionizationFraction,
        ).toBeCloseTo(
          0.966854551143,
          10,
        );

        expect(
          nebula
            .physicalProperties
            .dustToGasMassRatio,
        ).toBeCloseTo(
          0.019498701111,
          10,
        );
      },
    );

    it(
      'should keep type-specific V1 physical ranges valid across a deterministic nebula sample',
      () => {
        let checked =
          0;

        for (
          let index = 0n;
          index < 256n;
          index += 1n
        ) {
          const target =
            locator(
              index,
            );

          if (
            !NebulaGenerator
              .isNebulaLocator(
                generationKey,
                target,
              )
          ) {
            continue;
          }

          const nebula =
            NebulaGenerator
              .generate(
                generationKey,
                target,
              );

          const properties =
            nebula
              .physicalProperties;

          expect(
            properties.radiusParsecs,
          ).toBeGreaterThan(
            0,
          );

          expect(
            properties.massSolarMasses,
          ).toBeGreaterThan(
            0,
          );

          expect(
            properties.gasTemperatureKelvin,
          ).toBeGreaterThan(
            0,
          );

          expect(
            properties.hydrogenNumberDensityPerCm3,
          ).toBeGreaterThan(
            0,
          );

          expect(
            properties.ionizationFraction,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            properties.ionizationFraction,
          ).toBeLessThanOrEqual(
            1,
          );

          expect(
            properties.dustToGasMassRatio,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            properties.dustToGasMassRatio,
          ).toBeLessThanOrEqual(
            1,
          );

          checked +=
            1;
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
      'should keep the four subtypes reachable without consuming sector PRNG draws',
      () => {
        const reached =
          new Set<
            string
          >();

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
            !NebulaGenerator
              .isNebulaLocator(
                generationKey,
                target,
              )
          ) {
            continue;
          }

          reached.add(
            NebulaGenerator
              .generate(
                generationKey,
                target,
              )
              .nebulaType,
          );
        }

        expect(
          reached,
        ).toEqual(
          new Set([
            NebulaType.EMISSION,
            NebulaType.REFLECTION,
            NebulaType.DARK,
            NebulaType.PLANETARY,
          ]),
        );
      },
      30_000,
    );
  },
);
