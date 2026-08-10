import {
  GLOBAL_PROGRESS_SCOPE_KEY,
  ProgressScopeCode,
  createGalaxyProgressEntity,
  createGlobalProgressEntity,
} from './progress.entity';

describe(
  'ProgressEntity',
  () => {
    const universeSeed =
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

    const LONG_MAX =
      (1n << 63n) - 1n;

    it(
      'should create canonical global progress',
      () => {
        expect(
          createGlobalProgressEntity({
            universeSeed,

            generatorVersionCode:
              1,

            discoveryPoints:
              250n,

            updatedAtEpochMs:
              1000,
          }),
        ).toEqual({
          universeSeed,

          generatorVersionCode:
            1,

          scopeCode:
            ProgressScopeCode.GLOBAL,

          scopeKey:
            GLOBAL_PROGRESS_SCOPE_KEY,

          galaxyIndex:
            null,

          discoveryPoints:
            '250',

          updatedAtEpochMs:
            1000,
        });
      },
    );

    it(
      'should create canonical galaxy progress',
      () => {
        expect(
          createGalaxyProgressEntity({
            universeSeed,

            generatorVersionCode:
              1,

            galaxyIndex:
              7n,

            discoveryPoints:
              120n,

            updatedAtEpochMs:
              2000,
          }),
        ).toEqual({
          universeSeed,

          generatorVersionCode:
            1,

          scopeCode:
            ProgressScopeCode.GALAXY,

          scopeKey:
            '7',

          galaxyIndex:
            '7',

          discoveryPoints:
            '120',

          updatedAtEpochMs:
            2000,
        });
      },
    );

    it(
      'should accept zero global discovery points',
      () => {
        expect(
          createGlobalProgressEntity({
            universeSeed,

            generatorVersionCode:
              1,

            discoveryPoints:
              0n,

            updatedAtEpochMs:
              1,
          })
            .discoveryPoints,
        ).toBe(
          '0',
        );
      },
    );

    it(
      'should accept zero galaxy discovery points',
      () => {
        expect(
          createGalaxyProgressEntity({
            universeSeed,

            generatorVersionCode:
              1,

            galaxyIndex:
              0n,

            discoveryPoints:
              0n,

            updatedAtEpochMs:
              1,
          }),
        ).toMatchObject({
          scopeKey:
            '0',

          galaxyIndex:
            '0',

          discoveryPoints:
            '0',
        });
      },
    );

    it(
      'should preserve Long.MAX_VALUE discovery points exactly',
      () => {
        expect(
          createGlobalProgressEntity({
            universeSeed,

            generatorVersionCode:
              1,

            discoveryPoints:
              LONG_MAX,

            updatedAtEpochMs:
              1,
          })
            .discoveryPoints,
        ).toBe(
          '9223372036854775807',
        );
      },
    );

    it(
      'should preserve Long.MAX_VALUE galaxy index exactly',
      () => {
        expect(
          createGalaxyProgressEntity({
            universeSeed,

            generatorVersionCode:
              1,

            galaxyIndex:
              LONG_MAX,

            discoveryPoints:
              1n,

            updatedAtEpochMs:
              1,
          }),
        ).toMatchObject({
          scopeKey:
            '9223372036854775807',

          galaxyIndex:
            '9223372036854775807',
        });
      },
    );

    it(
      'should reject negative global discovery points',
      () => {
        expect(
          () =>
            createGlobalProgressEntity({
              universeSeed,

              generatorVersionCode:
                1,

              discoveryPoints:
                -1n,

              updatedAtEpochMs:
                1,
            }),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject negative galaxy discovery points',
      () => {
        expect(
          () =>
            createGalaxyProgressEntity({
              universeSeed,

              generatorVersionCode:
                1,

              galaxyIndex:
                0n,

              discoveryPoints:
                -1n,

              updatedAtEpochMs:
                1,
            }),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject discovery points above Long.MAX_VALUE',
      () => {
        expect(
          () =>
            createGlobalProgressEntity({
              universeSeed,

              generatorVersionCode:
                1,

              discoveryPoints:
                LONG_MAX + 1n,

              updatedAtEpochMs:
                1,
            }),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject galaxy indices outside the non-negative Long range',
      () => {
        expect(
          () =>
            createGalaxyProgressEntity({
              universeSeed,

              generatorVersionCode:
                1,

              galaxyIndex:
                -1n,

              discoveryPoints:
                0n,

              updatedAtEpochMs:
                1,
            }),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            createGalaxyProgressEntity({
              universeSeed,

              generatorVersionCode:
                1,

              galaxyIndex:
                LONG_MAX + 1n,

              discoveryPoints:
                0n,

              updatedAtEpochMs:
                1,
            }),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);