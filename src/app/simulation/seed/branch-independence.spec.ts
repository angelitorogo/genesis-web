import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  SeedDeriver,
} from './seed-deriver';

interface CanonicalBranch {
  readonly galaxy:
    string;

  readonly sector:
    string;

  readonly galacticObject:
    string;

  readonly system:
    string;

  readonly body:
    string;

  readonly history:
    string;

  readonly evolution:
    string;

  readonly civilization:
    string;
}

describe(
  'SeedDeriver branch independence',
  () => {
    const root =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    it(
      'should keep one galaxy branch unchanged when another galaxy branch is derived',
      () => {
        const before =
          deriveCanonicalBranch();

        deriveAlternativeBranch({
          galaxyIndex:
            1n,

          sectorKey:
            100n,

          objectIndex:
            2n,

          bodyIndex:
            5n,

          civilizationIndex:
            7n,
        });

        const after =
          deriveCanonicalBranch();

        expect(
          after,
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should keep a sector branch independent from sibling sectors',
      () => {
        const galaxy =
          SeedDeriver.galaxy(
            root,
            0n,
          );

        const sectorA1 =
          SeedDeriver
            .sector(
              galaxy,
              123456789n,
            )
            .normalizedValue;

        const sectorB =
          SeedDeriver
            .sector(
              galaxy,
              -987654321n,
            )
            .normalizedValue;

        const sectorA2 =
          SeedDeriver
            .sector(
              galaxy,
              123456789n,
            )
            .normalizedValue;

        expect(
          sectorA2,
        ).toBe(
          sectorA1,
        );

        expect(
          sectorB,
        ).not.toBe(
          sectorA1,
        );
      },
    );

    it(
      'should keep a galactic object branch independent from sibling objects',
      () => {
        const galaxy =
          SeedDeriver.galaxy(
            root,
            0n,
          );

        const sector =
          SeedDeriver.sector(
            galaxy,
            123456789n,
          );

        const objectA1 =
          SeedDeriver
            .galacticObject(
              sector,
              7n,
            )
            .normalizedValue;

        const objectB =
          SeedDeriver
            .galacticObject(
              sector,
              8n,
            )
            .normalizedValue;

        const objectA2 =
          SeedDeriver
            .galacticObject(
              sector,
              7n,
            )
            .normalizedValue;

        expect(
          objectA2,
        ).toBe(
          objectA1,
        );

        expect(
          objectB,
        ).not.toBe(
          objectA1,
        );
      },
    );

    it(
      'should keep a body branch independent from sibling bodies',
      () => {
        const system =
          deriveCanonicalSystem();

        const bodyA1 =
          SeedDeriver
            .body(
              system,
              3n,
            )
            .normalizedValue;

        const bodyB =
          SeedDeriver
            .body(
              system,
              4n,
            )
            .normalizedValue;

        const bodyA2 =
          SeedDeriver
            .body(
              system,
              3n,
            )
            .normalizedValue;

        expect(
          bodyA2,
        ).toBe(
          bodyA1,
        );

        expect(
          bodyB,
        ).not.toBe(
          bodyA1,
        );
      },
    );

    it(
      'should keep civilization branches independent under the same evolution seed',
      () => {
        const system =
          deriveCanonicalSystem();

        const body =
          SeedDeriver.body(
            system,
            3n,
          );

        const history =
          SeedDeriver.history(
            body,
          );

        const evolution =
          SeedDeriver.evolution(
            history,
          );

        const civilizationA1 =
          SeedDeriver
            .civilization(
              evolution,
              1n,
            )
            .normalizedValue;

        const civilizationB =
          SeedDeriver
            .civilization(
              evolution,
              2n,
            )
            .normalizedValue;

        const civilizationA2 =
          SeedDeriver
            .civilization(
              evolution,
              1n,
            )
            .normalizedValue;

        expect(
          civilizationA2,
        ).toBe(
          civilizationA1,
        );

        expect(
          civilizationB,
        ).not.toBe(
          civilizationA1,
        );
      },
    );

    it(
      'should not perturb a branch when another universe is queried',
      () => {
        const before =
          deriveCanonicalBranch();

        const otherRoot =
          UniverseSeed.parse(
            '0000-0000-0000-0000-0000-0000-0000-0001',
          );

        const otherGalaxy =
          SeedDeriver.galaxy(
            otherRoot,
            0n,
          );

        const otherSector =
          SeedDeriver.sector(
            otherGalaxy,
            123456789n,
          );

        const otherObject =
          SeedDeriver
            .galacticObject(
              otherSector,
              7n,
            );

        const otherSystem =
          SeedDeriver.system(
            otherObject,
          );

        const otherBody =
          SeedDeriver.body(
            otherSystem,
            3n,
          );

        const otherHistory =
          SeedDeriver.history(
            otherBody,
          );

        const otherEvolution =
          SeedDeriver.evolution(
            otherHistory,
          );

        SeedDeriver.civilization(
          otherEvolution,
          1n,
        );

        const after =
          deriveCanonicalBranch();

        expect(
          after,
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should preserve every branch under intensive interleaved derivation',
      () => {
        const expected =
          deriveCanonicalBranch();

        for (
          let index = 0n;
          index < 128n;
          index += 1n
        ) {
          deriveAlternativeBranch({
            galaxyIndex:
              index + 1n,

            sectorKey:
              index - 64n,

            objectIndex:
              index,

            bodyIndex:
              index,

            civilizationIndex:
              index,
          });

          expect(
            deriveCanonicalBranch(),
          ).toEqual(
            expected,
          );
        }
      },
    );

    it(
      'should preserve the frozen Android V1 canonical branch',
      () => {
        expect(
          deriveCanonicalBranch(),
        ).toEqual({
          galaxy:
            '8BA08585BCBD4D3041C1FD9EEBD048E4',

          sector:
            '02DF63D582A1F3E9BFB71AA643FDBB92',

          galacticObject:
            '22D2E7D76E3C1EB35611802BC34E378E',

          system:
            '58691B1E4E539DBA3EB173F795FDE7E2',

          body:
            '86FE2CB4F2CC4678D23F310333F15EF7',

          history:
            '2103F53D83EB40DC1381A8B8FD21DD22',

          evolution:
            '4FD989860C1B323DF20342876B486958',

          civilization:
            'ED3EC33F28E7B841CBDE4307F71D3C64',
        });
      },
    );

    function deriveCanonicalSystem() {
      const galaxy =
        SeedDeriver.galaxy(
          root,
          0n,
        );

      const sector =
        SeedDeriver.sector(
          galaxy,
          123456789n,
        );

      const galacticObject =
        SeedDeriver
          .galacticObject(
            sector,
            7n,
          );

      return SeedDeriver.system(
        galacticObject,
      );
    }

    function deriveCanonicalBranch():
      CanonicalBranch {

      const galaxy =
        SeedDeriver.galaxy(
          root,
          0n,
        );

      const sector =
        SeedDeriver.sector(
          galaxy,
          123456789n,
        );

      const galacticObject =
        SeedDeriver
          .galacticObject(
            sector,
            7n,
          );

      const system =
        SeedDeriver.system(
          galacticObject,
        );

      const body =
        SeedDeriver.body(
          system,
          3n,
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
            1n,
          );

      return {
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
      };
    }

    function deriveAlternativeBranch(
      input: {
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
    ): CanonicalBranch {

      const galaxy =
        SeedDeriver.galaxy(
          root,
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
      };
    }
  },
);