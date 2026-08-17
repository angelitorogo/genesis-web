import {
  GalaxyKnowledgeStatistics,
} from './galaxy-knowledge-statistics';

describe(
  'GalaxyKnowledgeStatistics',
  () => {
    it(
      'should preserve a coherent bootstrap snapshot',
      () => {
        const statistics =
          new GalaxyKnowledgeStatistics(
            0n,
            2n,
            1n,
            {
              sectors:
                0n,

              galacticObjects:
                0n,

              systems:
                0n,

              bodies:
                0n,

              civilizations:
                0n,
            },
            {
              detected:
                0n,

              discovered:
                1n,

              visited:
                0n,

              catalogued:
                0n,

              confirmed:
                0n,
            },
          );

        expect(
          statistics
            .internalKnownRecords,
        ).toBe(
          0n,
        );

        expect(
          Object.isFrozen(
            statistics
              .targetCounts,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            statistics
              .stateCounts,
          ),
        ).toBe(true);
      },
    );

    it(
      'should expose the internal record count without including the GalaxyLocator',
      () => {
        const statistics =
          new GalaxyKnowledgeStatistics(
            7n,
            17n,
            6n,
            {
              sectors:
                1n,

              galacticObjects:
                1n,

              systems:
                1n,

              bodies:
                1n,

              civilizations:
                1n,
            },
            {
              detected:
                1n,

              discovered:
                2n,

              visited:
                1n,

              catalogued:
                1n,

              confirmed:
                1n,
            },
          );

        expect(
          statistics
            .internalKnownRecords,
        ).toBe(
          5n,
        );
      },
    );

    it(
      'should reject target totals that do not classify every record',
      () => {
        expect(
          () =>
            new GalaxyKnowledgeStatistics(
              0n,
              2n,
              2n,
              {
                sectors:
                  0n,

                galacticObjects:
                  0n,

                systems:
                  0n,

                bodies:
                  0n,

                civilizations:
                  0n,
              },
              {
                detected:
                  1n,

                discovered:
                  1n,

                visited:
                  0n,

                catalogued:
                  0n,

                confirmed:
                  0n,
              },
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject state totals that do not classify every record',
      () => {
        expect(
          () =>
            new GalaxyKnowledgeStatistics(
              0n,
              2n,
              1n,
              {
                sectors:
                  0n,

                galacticObjects:
                  0n,

                systems:
                  0n,

                bodies:
                  0n,

                civilizations:
                  0n,
              },
              {
                detected:
                  0n,

                discovered:
                  0n,

                visited:
                  0n,

                catalogued:
                  0n,

                confirmed:
                  0n,
              },
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject negative and out-of-range counters',
      () => {
        const maxPlusOne =
          1n <<
          63n;

        expect(
          () =>
            new GalaxyKnowledgeStatistics(
              -1n,
              0n,
              1n,
              {
                sectors:
                  0n,

                galacticObjects:
                  0n,

                systems:
                  0n,

                bodies:
                  0n,

                civilizations:
                  0n,
              },
              {
                detected:
                  1n,

                discovered:
                  0n,

                visited:
                  0n,

                catalogued:
                  0n,

                confirmed:
                  0n,
              },
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyKnowledgeStatistics(
              0n,
              maxPlusOne,
              1n,
              {
                sectors:
                  0n,

                galacticObjects:
                  0n,

                systems:
                  0n,

                bodies:
                  0n,

                civilizations:
                  0n,
              },
              {
                detected:
                  1n,

                discovered:
                  0n,

                visited:
                  0n,

                catalogued:
                  0n,

                confirmed:
                  0n,
              },
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
