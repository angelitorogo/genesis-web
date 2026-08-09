import {
  BodySeed,
  CivilizationSeed,
  EvolutionSeed,
  GalacticObjectSeed,
  GalaxySeed,
  HistorySeed,
  SectorSeed,
  SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  SeedDeriver,
} from './seed-deriver';

interface DerivedBranch {
  readonly galaxy:
    GalaxySeed;

  readonly sector:
    SectorSeed;

  readonly galacticObject:
    GalacticObjectSeed;

  readonly system:
    SystemSeed;

  readonly body:
    BodySeed;

  readonly history:
    HistorySeed;

  readonly evolution:
    EvolutionSeed;

  readonly civilization:
    CivilizationSeed;
}

describe(
  'SeedDeriver query order independence',
  () => {
    const root =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    it(
      'should derive galaxies independently of query order',
      () => {
        const forward = [
          0n,
          1n,
          2n,
          3n,
          10n,
          1_000_000n,
        ].map(
          (index) =>
            SeedDeriver
              .galaxy(
                root,
                index,
              )
              .normalizedValue,
        );

        const reverseIndices = [
          1_000_000n,
          10n,
          3n,
          2n,
          1n,
          0n,
        ];

        const reverse =
          new Map(
            reverseIndices.map(
              (index) => [
                index,
                SeedDeriver
                  .galaxy(
                    root,
                    index,
                  )
                  .normalizedValue,
              ],
            ),
          );

        expect(
          forward,
        ).toEqual([
          reverse.get(0n),
          reverse.get(1n),
          reverse.get(2n),
          reverse.get(3n),
          reverse.get(10n),
          reverse.get(
            1_000_000n,
          ),
        ]);
      },
    );

    it(
      'should derive sibling sectors independently of query order',
      () => {
        const galaxy =
          SeedDeriver.galaxy(
            root,
            0n,
          );

        const keys = [
          -(1n << 63n),
          -123456789n,
          -1n,
          0n,
          1n,
          123456789n,
          (1n << 63n) - 1n,
        ];

        const forward =
          new Map(
            keys.map(
              (key) => [
                key,
                SeedDeriver
                  .sector(
                    galaxy,
                    key,
                  )
                  .normalizedValue,
              ],
            ),
          );

        const reverse =
          new Map(
            [...keys]
              .reverse()
              .map(
                (key) => [
                  key,
                  SeedDeriver
                    .sector(
                      galaxy,
                      key,
                    )
                    .normalizedValue,
                ],
              ),
          );

        for (
          const key
          of keys
        ) {
          expect(
            reverse.get(key),
          ).toBe(
            forward.get(key),
          );
        }
      },
    );

    it(
      'should keep a complete branch unchanged after querying another branch',
      () => {
        const branchA1 =
          deriveBranch({
            root,
            galaxyIndex:
              0n,
            sectorKey:
              123456789n,
            objectIndex:
              7n,
            bodyIndex:
              3n,
            civilizationIndex:
              1n,
          });

        deriveBranch({
          root,
          galaxyIndex:
            42n,
          sectorKey:
            -987654321n,
          objectIndex:
            99n,
          bodyIndex:
            17n,
          civilizationIndex:
            6n,
        });

        const branchA2 =
          deriveBranch({
            root,
            galaxyIndex:
              0n,
            sectorKey:
              123456789n,
            objectIndex:
              7n,
            bodyIndex:
              3n,
            civilizationIndex:
              1n,
          });

        expect(
          normalizedBranch(
            branchA2,
          ),
        ).toEqual(
          normalizedBranch(
            branchA1,
          ),
        );
      },
    );

    it(
      'should produce identical branches when branch query order is reversed',
      () => {
        const branchAForward =
          deriveBranch({
            root,
            galaxyIndex:
              0n,
            sectorKey:
              123456789n,
            objectIndex:
              7n,
            bodyIndex:
              3n,
            civilizationIndex:
              1n,
          });

        const branchBForward =
          deriveBranch({
            root,
            galaxyIndex:
              5n,
            sectorKey:
              -500n,
            objectIndex:
              12n,
            bodyIndex:
              8n,
            civilizationIndex:
              4n,
          });

        const branchBReverse =
          deriveBranch({
            root,
            galaxyIndex:
              5n,
            sectorKey:
              -500n,
            objectIndex:
              12n,
            bodyIndex:
              8n,
            civilizationIndex:
              4n,
          });

        const branchAReverse =
          deriveBranch({
            root,
            galaxyIndex:
              0n,
            sectorKey:
              123456789n,
            objectIndex:
              7n,
            bodyIndex:
              3n,
            civilizationIndex:
              1n,
          });

        expect(
          normalizedBranch(
            branchAReverse,
          ),
        ).toEqual(
          normalizedBranch(
            branchAForward,
          ),
        );

        expect(
          normalizedBranch(
            branchBReverse,
          ),
        ).toEqual(
          normalizedBranch(
            branchBForward,
          ),
        );
      },
    );

    it(
      'should not mutate parent seeds while deriving children',
      () => {
        const galaxy =
          SeedDeriver.galaxy(
            root,
            0n,
          );

        const galaxyBefore =
          galaxy.normalizedValue;

        const sector =
          SeedDeriver.sector(
            galaxy,
            123456789n,
          );

        const sectorBefore =
          sector.normalizedValue;

        const object =
          SeedDeriver
            .galacticObject(
              sector,
              7n,
            );

        const objectBefore =
          object.normalizedValue;

        const system =
          SeedDeriver.system(
            object,
          );

        SeedDeriver.body(
          system,
          3n,
        );

        expect(
          galaxy.normalizedValue,
        ).toBe(
          galaxyBefore,
        );

        expect(
          sector.normalizedValue,
        ).toBe(
          sectorBefore,
        );

        expect(
          object.normalizedValue,
        ).toBe(
          objectBefore,
        );
      },
    );

    it(
      'should remain deterministic under repeated interleaved queries',
      () => {
        const expectedA =
          deriveBranch({
            root,
            galaxyIndex:
              2n,
            sectorKey:
              111n,
            objectIndex:
              4n,
            bodyIndex:
              6n,
            civilizationIndex:
              8n,
          });

        const expectedB =
          deriveBranch({
            root,
            galaxyIndex:
              9n,
            sectorKey:
              -222n,
            objectIndex:
              5n,
            bodyIndex:
              7n,
            civilizationIndex:
              3n,
          });

        for (
          let iteration = 0;
          iteration < 100;
          iteration += 1
        ) {
          const currentA =
            deriveBranch({
              root,
              galaxyIndex:
                2n,
              sectorKey:
                111n,
              objectIndex:
                4n,
              bodyIndex:
                6n,
              civilizationIndex:
                8n,
            });

          const currentB =
            deriveBranch({
              root,
              galaxyIndex:
                9n,
              sectorKey:
                -222n,
              objectIndex:
                5n,
              bodyIndex:
                7n,
              civilizationIndex:
                3n,
            });

          expect(
            normalizedBranch(
              currentA,
            ),
          ).toEqual(
            normalizedBranch(
              expectedA,
            ),
          );

          expect(
            normalizedBranch(
              currentB,
            ),
          ).toEqual(
            normalizedBranch(
              expectedB,
            ),
          );
        }
      },
    );

    it(
      'should isolate query order across different universe roots',
      () => {
        const secondRoot =
          UniverseSeed.parse(
            '0000-0000-0000-0000-0000-0000-0000-0001',
          );

        const firstBefore =
          deriveBranch({
            root,
            galaxyIndex:
              0n,
            sectorKey:
              0n,
            objectIndex:
              0n,
            bodyIndex:
              0n,
            civilizationIndex:
              0n,
          });

        deriveBranch({
          root:
            secondRoot,
          galaxyIndex:
            0n,
          sectorKey:
            0n,
          objectIndex:
            0n,
          bodyIndex:
            0n,
          civilizationIndex:
            0n,
        });

        const firstAfter =
          deriveBranch({
            root,
            galaxyIndex:
              0n,
            sectorKey:
              0n,
            objectIndex:
              0n,
            bodyIndex:
              0n,
            civilizationIndex:
              0n,
          });

        expect(
          normalizedBranch(
            firstAfter,
          ),
        ).toEqual(
          normalizedBranch(
            firstBefore,
          ),
        );
      },
    );

    it(
      'should preserve the canonical Android branch after arbitrary queries',
      () => {
        for (
          let index = 0n;
          index < 64n;
          index += 1n
        ) {
          const galaxy =
            SeedDeriver.galaxy(
              root,
              index,
            );

          SeedDeriver.sector(
            galaxy,
            index - 32n,
          );
        }

        const canonical =
          deriveBranch({
            root,
            galaxyIndex:
              0n,
            sectorKey:
              123456789n,
            objectIndex:
              7n,
            bodyIndex:
              3n,
            civilizationIndex:
              1n,
          });

        expect(
          canonical
            .galaxy
            .normalizedValue,
        ).toBe(
          '8BA08585BCBD4D3041C1FD9EEBD048E4',
        );

        expect(
          canonical
            .sector
            .normalizedValue,
        ).toBe(
          '02DF63D582A1F3E9BFB71AA643FDBB92',
        );

        expect(
          canonical
            .galacticObject
            .normalizedValue,
        ).toBe(
          '22D2E7D76E3C1EB35611802BC34E378E',
        );

        expect(
          canonical
            .system
            .normalizedValue,
        ).toBe(
          '58691B1E4E539DBA3EB173F795FDE7E2',
        );

        expect(
          canonical
            .body
            .normalizedValue,
        ).toBe(
          '86FE2CB4F2CC4678D23F310333F15EF7',
        );

        expect(
          canonical
            .history
            .normalizedValue,
        ).toBe(
          '2103F53D83EB40DC1381A8B8FD21DD22',
        );

        expect(
          canonical
            .evolution
            .normalizedValue,
        ).toBe(
          '4FD989860C1B323DF20342876B486958',
        );

        expect(
          canonical
            .civilization
            .normalizedValue,
        ).toBe(
          'ED3EC33F28E7B841CBDE4307F71D3C64',
        );
      },
    );
  },
);

function deriveBranch(
  input: {
    readonly root:
      UniverseSeed;

    readonly galaxyIndex:
      bigint;

    readonly sectorKey:
      bigint;

    readonly objectIndex:
      bigint;

    readonly bodyIndex:
      bigint;

    readonly civilizationIndex:
      bigint;
  },
): DerivedBranch {
  const galaxy =
    SeedDeriver.galaxy(
      input.root,
      input.galaxyIndex,
    );

  const sector =
    SeedDeriver.sector(
      galaxy,
      input.sectorKey,
    );

  const galacticObject =
    SeedDeriver
      .galacticObject(
        sector,
        input.objectIndex,
      );

  const system =
    SeedDeriver.system(
      galacticObject,
    );

  const body =
    SeedDeriver.body(
      system,
      input.bodyIndex,
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
        input.civilizationIndex,
      );

  return {
    galaxy,
    sector,
    galacticObject,
    system,
    body,
    history,
    evolution,
    civilization,
  };
}

function normalizedBranch(
  branch: DerivedBranch,
): readonly string[] {
  return [
    branch
      .galaxy
      .normalizedValue,

    branch
      .sector
      .normalizedValue,

    branch
      .galacticObject
      .normalizedValue,

    branch
      .system
      .normalizedValue,

    branch
      .body
      .normalizedValue,

    branch
      .history
      .normalizedValue,

    branch
      .evolution
      .normalizedValue,

    branch
      .civilization
      .normalizedValue,
  ];
}