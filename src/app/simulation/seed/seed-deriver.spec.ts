import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  SeedDeriver,
} from './seed-deriver';

describe(
  'SeedDeriver',
  () => {
    const root =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    it(
      'should reproduce the canonical Android hierarchy',
      () => {
        const galaxy =
          SeedDeriver.galaxy(
            root,
            0n,
          );

        expect(
          galaxy.normalizedValue,
        ).toBe(
          '8BA08585BCBD4D3041C1FD9EEBD048E4',
        );

        const sector =
          SeedDeriver.sector(
            galaxy,
            123456789n,
          );

        expect(
          sector.normalizedValue,
        ).toBe(
          '02DF63D582A1F3E9BFB71AA643FDBB92',
        );

        const galacticObject =
          SeedDeriver.galacticObject(
            sector,
            7n,
          );

        expect(
          galacticObject.normalizedValue,
        ).toBe(
          '22D2E7D76E3C1EB35611802BC34E378E',
        );

        const system =
          SeedDeriver.system(
            galacticObject,
          );

        expect(
          system.normalizedValue,
        ).toBe(
          '58691B1E4E539DBA3EB173F795FDE7E2',
        );

        const body =
          SeedDeriver.body(
            system,
            3n,
          );

        expect(
          body.normalizedValue,
        ).toBe(
          '86FE2CB4F2CC4678D23F310333F15EF7',
        );

        const history =
          SeedDeriver.history(
            body,
          );

        expect(
          history.normalizedValue,
        ).toBe(
          '2103F53D83EB40DC1381A8B8FD21DD22',
        );

        const evolution =
          SeedDeriver.evolution(
            history,
          );

        expect(
          evolution.normalizedValue,
        ).toBe(
          '4FD989860C1B323DF20342876B486958',
        );

        const civilization =
          SeedDeriver.civilization(
            evolution,
            1n,
          );

        expect(
          civilization.normalizedValue,
        ).toBe(
          'ED3EC33F28E7B841CBDE4307F71D3C64',
        );
      },
    );

    it(
      'should derive identical values repeatedly',
      () => {
        for (
          let index = 0;
          index < 100;
          index += 1
        ) {
          expect(
            SeedDeriver
              .galaxy(
                root,
                0n,
              )
              .normalizedValue,
          ).toBe(
            '8BA08585BCBD4D3041C1FD9EEBD048E4',
          );
        }
      },
    );

    it(
      'should isolate different galaxy indices',
      () => {
        expect(
          SeedDeriver
            .galaxy(
              root,
              0n,
            )
            .normalizedValue,
        ).toBe(
          '8BA08585BCBD4D3041C1FD9EEBD048E4',
        );

        expect(
          SeedDeriver
            .galaxy(
              root,
              1n,
            )
            .normalizedValue,
        ).toBe(
          'A448D6B11BAF31F30904C808DE482290',
        );
      },
    );

    it(
      'should support Long.MIN_VALUE and Long.MAX_VALUE sector keys',
      () => {
        const galaxy =
          SeedDeriver.galaxy(
            root,
            0n,
          );

        expect(
          SeedDeriver
            .sector(
              galaxy,
              -(1n << 63n),
            )
            .normalizedValue,
        ).toBe(
          '2151D19FB4DA2F2373DC6E2E1207CDFA',
        );

        expect(
          SeedDeriver
            .sector(
              galaxy,
              (1n << 63n) -
                1n,
            )
            .normalizedValue,
        ).toBe(
          '5CE38C75A393AFE25DB008FE79E3AB92',
        );
      },
    );

    it(
      'should reject negative galaxy indices',
      () => {
        expect(
          () =>
            SeedDeriver.galaxy(
              root,
              -1n,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject negative galactic object indices',
      () => {
        const galaxy =
          SeedDeriver.galaxy(
            root,
            0n,
          );

        const sector =
          SeedDeriver.sector(
            galaxy,
            0n,
          );

        expect(
          () =>
            SeedDeriver
              .galacticObject(
                sector,
                -1n,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject negative body indices',
      () => {
        const galaxy =
          SeedDeriver.galaxy(
            root,
            0n,
          );

        const sector =
          SeedDeriver.sector(
            galaxy,
            0n,
          );

        const object =
          SeedDeriver
            .galacticObject(
              sector,
              0n,
            );

        const system =
          SeedDeriver.system(
            object,
          );

        expect(
          () =>
            SeedDeriver.body(
              system,
              -1n,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject negative civilization indices',
      () => {
        const galaxy =
          SeedDeriver.galaxy(
            root,
            0n,
          );

        const sector =
          SeedDeriver.sector(
            galaxy,
            0n,
          );

        const object =
          SeedDeriver
            .galacticObject(
              sector,
              0n,
            );

        const system =
          SeedDeriver.system(
            object,
          );

        const body =
          SeedDeriver.body(
            system,
            0n,
          );

        const history =
          SeedDeriver.history(
            body,
          );

        const evolution =
          SeedDeriver.evolution(
            history,
          );

        expect(
          () =>
            SeedDeriver
              .civilization(
                evolution,
                -1n,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject galaxy indices outside Long range',
      () => {
        expect(
          () =>
            SeedDeriver.galaxy(
              root,
              1n << 63n,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject sector keys outside Long range',
      () => {
        const galaxy =
          SeedDeriver.galaxy(
            root,
            0n,
          );

        expect(
          () =>
            SeedDeriver.sector(
              galaxy,
              1n << 63n,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            SeedDeriver.sector(
              galaxy,
              -(1n << 63n) -
                1n,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should support Long.MAX_VALUE galaxy index',
      () => {
        expect(
          SeedDeriver
            .galaxy(
              root,
              (1n << 63n) -
                1n,
            )
            .normalizedValue,
        ).toBe(
          '45B3CBC9D4E352C81AE441B844FF65B5',
        );
      },
    );

    it(
      'should isolate different universe roots',
      () => {
        const otherRoot =
          UniverseSeed.parse(
            '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
          );

        expect(
          SeedDeriver
            .galaxy(
              root,
              0n,
            )
            .normalizedValue,
        ).not.toBe(
          SeedDeriver
            .galaxy(
              otherRoot,
              0n,
            )
            .normalizedValue,
        );
      },
    );
  },
);