import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  PlanetFormationRegime,
} from '../../domain/planetary/planet-formation-profile';

import {
  GalaxySectorStellarPopulationProperties,
} from '../../domain/sector/galaxy-sector-stellar-population-properties';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  PlanetFormationProfileGenerator,
} from './planet-formation-profile-generator';

describe(
  'PlanetFormationProfileGenerator',
  () => {
    const canonicalSeed =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    const canonicalGenerationKey =
      new UniverseGenerationKey(
        canonicalSeed,
        GeneratorVersion.V1,
      );

    function environment(
      metallicitySolarRatio:
        number,

      ageBillionYears =
        8.0,
    ): GalaxySectorStellarPopulationProperties {

      return new GalaxySectorStellarPopulationProperties(
        metallicitySolarRatio,
        ageBillionYears,
      );
    }

    it(
      'should reproduce the frozen V1 central Caeloria planetary formation vector',
      () => {
        const profile =
          PlanetFormationProfileGenerator
            .generate(
              canonicalGenerationKey,
              environment(
                1.5250202653290195,
                9.298532891895936,
              ),
            );

        expect(
          profile
            .metallicitySolarRatio,
        ).toBe(
          1.5250202653290195,
        );

        expect(
          profile
            .solidMaterialIndex,
        ).toBe(
          0.9653228951781195,
        );

        expect(
          profile
            .overallPlanetFormationProbability,
        ).toBe(
          0.9581534239622153,
        );

        expect(
          profile
            .rockyPlanetFormationPropensity,
        ).toBe(
          0.9430033883168174,
        );

        expect(
          profile
            .iceRichPlanetFormationPropensity,
        ).toBe(
          0.8627777320642518,
        );

        expect(
          profile
            .giantPlanetFormationPropensity,
        ).toBe(
          0.8805233978599342,
        );

        expect(
          profile.regime,
        ).toBe(
          PlanetFormationRegime
            .GIANT_ENHANCED,
        );
      },
    );

    it(
      'should be deterministic for the same generation key and environment',
      () => {
        const stellarPopulation =
          environment(
            0.8,
          );

        const first =
          PlanetFormationProfileGenerator
            .generate(
              canonicalGenerationKey,
              stellarPopulation,
            );

        const second =
          PlanetFormationProfileGenerator
            .generate(
              canonicalGenerationKey,
              stellarPopulation,
            );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should clamp metallicity below the V1 floor for formation calculations',
      () => {
        const below =
          PlanetFormationProfileGenerator
            .generate(
              canonicalGenerationKey,
              environment(
                0.0,
              ),
            );

        const floor =
          PlanetFormationProfileGenerator
            .generate(
              canonicalGenerationKey,
              environment(
                0.03,
              ),
            );

        expect(
          below.solidMaterialIndex,
        ).toBe(
          floor.solidMaterialIndex,
        );

        expect(
          below
            .overallPlanetFormationProbability,
        ).toBe(
          floor
            .overallPlanetFormationProbability,
        );

        expect(
          below.regime,
        ).toBe(
          PlanetFormationRegime
            .SOLID_LIMITED,
        );
      },
    );

    it(
      'should clamp metallicity above the V1 ceiling for formation calculations',
      () => {
        const ceiling =
          PlanetFormationProfileGenerator
            .generate(
              canonicalGenerationKey,
              environment(
                2.50,
              ),
            );

        const above =
          PlanetFormationProfileGenerator
            .generate(
              canonicalGenerationKey,
              environment(
                25.0,
              ),
            );

        expect(
          above.solidMaterialIndex,
        ).toBe(
          ceiling.solidMaterialIndex,
        );

        expect(
          above
            .giantPlanetFormationPropensity,
        ).toBe(
          ceiling
            .giantPlanetFormationPropensity,
        );
      },
    );

    it(
      'should classify a low-metallicity environment as solid limited',
      () => {
        const profile =
          PlanetFormationProfileGenerator
            .generate(
              canonicalGenerationKey,
              environment(
                0.10,
              ),
            );

        expect(
          profile.regime,
        ).toBe(
          PlanetFormationRegime
            .SOLID_LIMITED,
        );
      },
    );

    it(
      'should classify a modest-metallicity environment as rocky favored',
      () => {
        const profile =
          PlanetFormationProfileGenerator
            .generate(
              canonicalGenerationKey,
              environment(
                0.20,
              ),
            );

        expect(
          profile.regime,
        ).toBe(
          PlanetFormationRegime
            .ROCKY_FAVORED,
        );
      },
    );

    it(
      'should classify an intermediate-metallicity environment as mixed',
      () => {
        const profile =
          PlanetFormationProfileGenerator
            .generate(
              canonicalGenerationKey,
              environment(
                0.50,
              ),
            );

        expect(
          profile.regime,
        ).toBe(
          PlanetFormationRegime
            .MIXED,
        );
      },
    );

    it(
      'should classify a high-metallicity environment as giant enhanced',
      () => {
        const profile =
          PlanetFormationProfileGenerator
            .generate(
              canonicalGenerationKey,
              environment(
                1.0,
              ),
            );

        expect(
          profile.regime,
        ).toBe(
          PlanetFormationRegime
            .GIANT_ENHANCED,
        );
      },
    );

    it(
      'should increase all V1 formation propensities as metallicity increases',
      () => {
        const low =
          PlanetFormationProfileGenerator
            .generate(
              canonicalGenerationKey,
              environment(
                0.10,
              ),
            );

        const high =
          PlanetFormationProfileGenerator
            .generate(
              canonicalGenerationKey,
              environment(
                1.0,
              ),
            );

        expect(
          high.solidMaterialIndex,
        ).toBeGreaterThan(
          low.solidMaterialIndex,
        );

        expect(
          high
            .overallPlanetFormationProbability,
        ).toBeGreaterThan(
          low
            .overallPlanetFormationProbability,
        );

        expect(
          high
            .rockyPlanetFormationPropensity,
        ).toBeGreaterThan(
          low
            .rockyPlanetFormationPropensity,
        );

        expect(
          high
            .iceRichPlanetFormationPropensity,
        ).toBeGreaterThan(
          low
            .iceRichPlanetFormationPropensity,
        );

        expect(
          high
            .giantPlanetFormationPropensity,
        ).toBeGreaterThan(
          low
            .giantPlanetFormationPropensity,
        );
      },
    );

    it(
      'should depend on metallicity rather than stellar age or universe seed in V1',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const first =
          PlanetFormationProfileGenerator
            .generate(
              canonicalGenerationKey,
              environment(
                0.75,
                2.0,
              ),
            );

        const second =
          PlanetFormationProfileGenerator
            .generate(
              otherGenerationKey,
              environment(
                0.75,
                12.0,
              ),
            );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should reject unsupported generator versions',
      () => {
        const unsupportedGenerationKey =
          {
            universeSeed:
              canonicalSeed,

            generatorVersion: {
              code:
                999,
            },
          } as unknown as
            UniverseGenerationKey;

        expect(
          () =>
            PlanetFormationProfileGenerator
              .generate(
                unsupportedGenerationKey,
                environment(
                  1.0,
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
