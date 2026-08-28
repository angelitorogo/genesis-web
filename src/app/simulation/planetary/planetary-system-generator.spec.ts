import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  PlanetaryFormationAnchor,
} from '../../domain/planetary/planetary-formation-anchor';

import {
  PlanetaryFormationMaturityRegime,
} from '../../domain/planetary/planetary-formation-maturity-regime';

import {
  ProtoplanetCompositionMixture,
} from '../../domain/planetary/protoplanet-composition-mixture';

import {
  PlanetarySystemFormationBlueprint,
} from '../../domain/planetary/planetary-system-formation-blueprint';

import {
  GalaxySectorStellarPopulationProperties,
} from '../../domain/sector/galaxy-sector-stellar-population-properties';

import {
  StellarPopulationProfile,
  StellarPopulationRegime,
} from '../../domain/stellar/stellar-population-profile';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  StellarSystemGenerator,
} from '../stellar/stellar-system-generator';

import {
  PlanetarySystemGenerator,
} from './planetary-system-generator';

describe(
  'PlanetarySystemGenerator point 18.1',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const sector =
      new GalaxySectorStellarPopulationProperties(
        1,
        4.6,
      );

    const population =
      new StellarPopulationProfile(
        4.6,
        0.45,
        0.20,
        0.55,
        0.25,
        0.82,
        0.72,
        0.30,
        0.22,
        StellarPopulationRegime.MIXED,
      );

    it(
      'should materialize the phase-18 root without deriving a new planetary-system seed',
      () => {
        const locator =
          new SystemLocator(
            4n,
            -12n,
            7n,
          );

        const stellarSystem =
          StellarSystemGenerator
            .generate(
              generationKey,
              locator,
              sector,
              population,
            );

        const blueprint =
          emptyBlueprint();

        const system =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              stellarSystem,
              blueprint,
            );

        const canonicalSystemSeed =
          ProceduralTargetResolver
            .resolveTargetSeed(
              generationKey,
              locator,
            );

        expect(
          system.seed.normalizedValue,
        ).toBe(
          canonicalSystemSeed.normalizedValue,
        );

        expect(
          system.seed,
        ).toBe(
          stellarSystem.seed,
        );

        expect(
          system.hostStellarSystem,
        ).toBe(
          stellarSystem,
        );

        expect(
          system.formationBlueprint,
        ).toBe(
          blueprint,
        );
      },
    );

    it(
      'should be exactly deterministic and independent from unrelated materialization order',
      () => {
        const locator =
          new SystemLocator(
            8n,
            21n,
            3n,
          );

        const stellarSystem =
          StellarSystemGenerator
            .generate(
              generationKey,
              locator,
              sector,
              population,
            );

        const blueprint =
          emptyBlueprint();

        const before =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              stellarSystem,
              blueprint,
            );

        const unrelatedLocator =
          new SystemLocator(
            1n,
            -99n,
            42n,
          );

        const unrelatedStellarSystem =
          StellarSystemGenerator
            .generate(
              generationKey,
              unrelatedLocator,
              sector,
              population,
            );

        PlanetarySystemGenerator
          .generate(
            generationKey,
            unrelatedStellarSystem,
            emptyBlueprint(),
          );

        const after =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              stellarSystem,
              blueprint,
            );

        expect(
          after.seed.normalizedValue,
        ).toBe(
          before.seed.normalizedValue,
        );

        expect(
          after.locator,
        ).toBe(
          before.locator,
        );

        expect(
          after.formationBlueprint,
        ).toBe(
          before.formationBlueprint,
        );
      },
    );

    it(
      'should carry non-empty formation lineage into phase 18 without promoting anchors to planets',
      () => {
        const stellarSystem =
          StellarSystemGenerator
            .generateSingle(
              generationKey,
              new SystemLocator(
                2n,
                15n,
                9n,
              ),
              sector,
              population,
            );

        const blueprint =
          blueprintWithAnchor();

        const system =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              stellarSystem,
              blueprint,
            );

        expect(
          system.formationAnchorCount,
        ).toBe(1);

        expect(
          system.hasFormationAnchors,
        ).toBe(true);

        expect(
          system.formationBlueprint
            .formationAnchors[0]
            .sourceFormationOrdinals,
        ).toEqual([
          1,
        ]);

        expect(
          'planetCount' in system,
        ).toBe(false);

        expect(
          'planets' in system,
        ).toBe(false);
      },
    );

    it(
      'should preserve an empty point-17.7 handoff instead of inventing a planet',
      () => {
        const stellarSystem =
          StellarSystemGenerator
            .generateSingle(
              generationKey,
              new SystemLocator(
                0n,
                0n,
                0n,
              ),
              sector,
              population,
            );

        const system =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              stellarSystem,
              emptyBlueprint(),
            );

        expect(
          system.hasFormationAnchors,
        ).toBe(false);

        expect(
          system.formationAnchorCount,
        ).toBe(0);

        expect(
          'planetCount' in system,
        ).toBe(false);

        expect(
          'architecture' in system,
        ).toBe(false);
      },
    );

    it(
      'should reject a stellar system that belongs to another universe generation key',
      () => {
        const locator =
          new SystemLocator(
            0n,
            0n,
            0n,
          );

        const foreignKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '1122-3344-5566-7788-99AA-BBCC-DDEE-FF00',
            ),
            GeneratorVersion.V1,
          );

        const foreignSystem =
          StellarSystemGenerator
            .generateSingle(
              foreignKey,
              locator,
              sector,
              population,
            );

        expect(
          () =>
            PlanetarySystemGenerator
              .generate(
                generationKey,
                foreignSystem,
                emptyBlueprint(),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function emptyBlueprint():
  PlanetarySystemFormationBlueprint {

  return new PlanetarySystemFormationBlueprint(
    1,
    6,
    20,
    1,
    0.05,
    100,
    4_000,
    10,
    0,
    10,
    0,
    0,
    0,
    0,
    0,
    PlanetaryFormationMaturityRegime.NO_PLANET_FORMING_CORES,
    [],
  );
}

function blueprintWithAnchor():
  PlanetarySystemFormationBlueprint {

  const anchor =
    new PlanetaryFormationAnchor(
      1,
      [
        1,
      ],
      1.5,
      1,
      new ProtoplanetCompositionMixture(
        0.2,
        0.5,
        0.3,
        0,
      ),
      0.75,
      0.25,
      0.70,
      0.10,
      0,
    );

  return new PlanetarySystemFormationBlueprint(
    1,
    6,
    20,
    1,
    0.05,
    100,
    4_000,
    10,
    1,
    9,
    0.2,
    1,
    1,
    0,
    0,
    PlanetaryFormationMaturityRegime.SOLID_CORE_SYSTEM,
    [
      anchor,
    ],
  );
}
