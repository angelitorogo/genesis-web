import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  SeedDeriver,
} from '../seed/seed-deriver';

import {
  V1_GOLDEN_VECTORS,
} from './v1-golden-vectors';

interface V1UniverseDeterminismSnapshot {
  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;

  readonly galaxySeeds:
    readonly string[];

  readonly canonicalBranch:
    Readonly<{
      galaxy:
        string;

      sector:
        string;

      galacticObject:
        string;

      system:
        string;

      body:
        string;

      history:
        string;

      evolution:
        string;

      civilization:
        string;
    }>;
}

describe(
  'GENESIS V1 determinism regression',
  () => {
    const canonicalKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          V1_GOLDEN_VECTORS
            .universeSeed,
        ),

        GeneratorVersion.V1,
      );

    it(
      'should produce the same universe snapshot for the same seed and version',
      () => {
        const first =
          createV1Snapshot(
            canonicalKey,
          );

        const second =
          createV1Snapshot(
            new UniverseGenerationKey(
              UniverseSeed.parse(
                V1_GOLDEN_VECTORS
                  .universeSeed,
              ),

              GeneratorVersion.V1,
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
      'should reproduce the same universe snapshot repeatedly',
      () => {
        const expected =
          createV1Snapshot(
            canonicalKey,
          );

        for (
          let iteration = 0;
          iteration < 100;
          iteration += 1
        ) {
          expect(
            createV1Snapshot(
              canonicalKey,
            ),
          ).toEqual(
            expected,
          );
        }
      },
    );

    it(
      'should reproduce the same universe from a copied generation key',
      () => {
        const original =
          createV1Snapshot(
            canonicalKey,
          );

        const copy =
          createV1Snapshot(
            canonicalKey.copy(),
          );

        expect(
          copy,
        ).toEqual(
          original,
        );
      },
    );

    it(
      'should reproduce the same universe after serializing its generation identity',
      () => {
        const serializedSeed =
          canonicalKey
            .universeSeed
            .serialize();

        const serializedVersionCode =
          canonicalKey
            .generatorVersionCode;

        const restoredKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              serializedSeed,
            ),

            GeneratorVersion
              .fromCode(
                serializedVersionCode,
              ),
          );

        expect(
          createV1Snapshot(
            restoredKey,
          ),
        ).toEqual(
          createV1Snapshot(
            canonicalKey,
          ),
        );
      },
    );

    it(
      'should change the deterministic universe when the root seed changes',
      () => {
        const otherKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),

            GeneratorVersion.V1,
          );

        expect(
          createV1Snapshot(
            otherKey,
          ),
        ).not.toEqual(
          createV1Snapshot(
            canonicalKey,
          ),
        );
      },
    );

    it(
      'should match the shared Android V1 galaxy seed vectors',
      () => {
        for (
          const vector
          of V1_GOLDEN_VECTORS
            .galaxies
        ) {
          expect(
            SeedDeriver
              .galaxy(
                canonicalKey
                  .universeSeed,
                vector.index,
              )
              .normalizedValue,
          ).toBe(
            vector.seed,
          );
        }
      },
    );

    it(
      'should match the shared Android V1 canonical hierarchical branch',
      () => {
        const expected =
          V1_GOLDEN_VECTORS
            .canonicalBranch;

        const galaxy =
          SeedDeriver.galaxy(
            canonicalKey
              .universeSeed,
            expected
              .galaxyIndex,
          );

        expect(
          galaxy.normalizedValue,
        ).toBe(
          expected.galaxySeed,
        );

        const sector =
          SeedDeriver.sector(
            galaxy,
            expected
              .sectorKey,
          );

        expect(
          sector.normalizedValue,
        ).toBe(
          expected.sectorSeed,
        );

        const galacticObject =
          SeedDeriver
            .galacticObject(
              sector,
              expected
                .galacticObjectIndex,
            );

        expect(
          galacticObject
            .normalizedValue,
        ).toBe(
          expected
            .galacticObjectSeed,
        );

        const system =
          SeedDeriver.system(
            galacticObject,
          );

        expect(
          system.normalizedValue,
        ).toBe(
          expected.systemSeed,
        );

        const body =
          SeedDeriver.body(
            system,
            expected.bodyIndex,
          );

        expect(
          body.normalizedValue,
        ).toBe(
          expected.bodySeed,
        );

        const history =
          SeedDeriver.history(
            body,
          );

        expect(
          history.normalizedValue,
        ).toBe(
          expected.historySeed,
        );

        const evolution =
          SeedDeriver.evolution(
            history,
          );

        expect(
          evolution
            .normalizedValue,
        ).toBe(
          expected.evolutionSeed,
        );

        const civilization =
          SeedDeriver
            .civilization(
              evolution,
              expected
                .civilizationIndex,
            );

        expect(
          civilization
            .normalizedValue,
        ).toBe(
          expected
            .civilizationSeed,
        );
      },
    );

    it(
      'should preserve the canonical universe after unrelated procedural queries',
      () => {
        const before =
          createV1Snapshot(
            canonicalKey,
          );

        for (
          let galaxyIndex = 4n;
          galaxyIndex < 100n;
          galaxyIndex += 1n
        ) {
          const galaxy =
            SeedDeriver.galaxy(
              canonicalKey
                .universeSeed,
              galaxyIndex,
            );

          SeedDeriver.sector(
            galaxy,
            galaxyIndex -
              50n,
          );
        }

        const after =
          createV1Snapshot(
            canonicalKey,
          );

        expect(
          after,
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should keep the frozen V1 universe identity unchanged',
      () => {
        const snapshot =
          createV1Snapshot(
            canonicalKey,
          );

        expect(
          snapshot
            .universeSeed,
        ).toBe(
          V1_GOLDEN_VECTORS
            .universeSeed,
        );

        expect(
          snapshot
            .generatorVersionCode,
        ).toBe(
          V1_GOLDEN_VECTORS
            .generatorVersionCode,
        );
      },
    );
  },
);

function createV1Snapshot(
  generationKey:
    UniverseGenerationKey,
): V1UniverseDeterminismSnapshot {
  if (
    generationKey
      .generatorVersion !==
    GeneratorVersion.V1
  ) {
    throw new RangeError(
      'Unsupported GeneratorVersion for V1 regression snapshot.',
    );
  }

  const galaxySeeds =
    V1_GOLDEN_VECTORS
      .galaxies
      .map(
        (vector) =>
          SeedDeriver
            .galaxy(
              generationKey
                .universeSeed,

              vector.index,
            )
            .normalizedValue,
      );

  const branch =
    V1_GOLDEN_VECTORS
      .canonicalBranch;

  const galaxy =
    SeedDeriver.galaxy(
      generationKey
        .universeSeed,

      branch.galaxyIndex,
    );

  const sector =
    SeedDeriver.sector(
      galaxy,
      branch.sectorKey,
    );

  const galacticObject =
    SeedDeriver
      .galacticObject(
        sector,
        branch
          .galacticObjectIndex,
      );

  const system =
    SeedDeriver.system(
      galacticObject,
    );

  const body =
    SeedDeriver.body(
      system,
      branch.bodyIndex,
    );

  const history =
    SeedDeriver.history(
      body,
    );

  const evolution =
    SeedDeriver.evolution(
      history,
    );

  const civilization =
    SeedDeriver
      .civilization(
        evolution,
        branch
          .civilizationIndex,
      );

  return {
    universeSeed:
      generationKey
        .universeSeed
        .serialize(),

    generatorVersionCode:
      generationKey
        .generatorVersionCode,

    galaxySeeds,

    canonicalBranch: {
      galaxy:
        galaxy.normalizedValue,

      sector:
        sector.normalizedValue,

      galacticObject:
        galacticObject
          .normalizedValue,

      system:
        system.normalizedValue,

      body:
        body.normalizedValue,

      history:
        history.normalizedValue,

      evolution:
        evolution
          .normalizedValue,

      civilization:
        civilization
          .normalizedValue,
    },
  };
}