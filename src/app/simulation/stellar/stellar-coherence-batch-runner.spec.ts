import {
  StellarCoherenceBatchRunner,
  type StellarCoherenceBatchRequest,
} from './stellar-coherence-batch-runner';

const SEED_A =
  '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

const SEED_B =
  '1357-9BDF-2468-ACE0-0F1E-2D3C-4B5A-6978';

const SMALL_REQUEST:
  StellarCoherenceBatchRequest = {
    universeSeeds: [
      SEED_A,
      SEED_B,
    ],
    systemsPerSeed:
      128,
    maxRecordedViolations:
      16,
  };

describe(
  'StellarCoherenceBatchRunner',
  () => {
    it(
      'should validate the frozen point-15.1..15.6 contracts across representative seeded environments',
      () => {
        const report =
          StellarCoherenceBatchRunner
            .run(
              SMALL_REQUEST,
            );

        expect(
          report.complete,
        ).toBe(
          true,
        );

        expect(
          report.totalSystems,
        ).toBe(
          256,
        );

        expect(
          report.processedSystems,
        ).toBe(
          report.totalSystems,
        );

        expect(
          report.coherentSystems,
        ).toBe(
          report.totalSystems,
        );

        expect(
          report.failedSystems,
        ).toBe(
          0,
        );

        expect(
          report.totalViolations,
        ).toBe(
          0,
        );

        expect(
          report.violations,
        ).toEqual(
          [],
        );

        expect(
          report.checksum64,
        ).toMatch(
          /^[0-9A-F]{16}$/,
        );

        expect(
          sumCounts(
            report.scenarioCounts,
          ),
        ).toBe(
          report.totalSystems,
        );

        expect(
          sumCounts(
            report.evolutionStateCounts,
          ),
        ).toBe(
          report.totalSystems,
        );

        expect(
          sumCounts(
            report.spectralFamilyCounts,
          ),
        ).toBe(
          report.totalSystems,
        );
      },
    );

    it(
      'should be exactly deterministic for the same batch request',
      () => {
        const first =
          StellarCoherenceBatchRunner
            .run(
              SMALL_REQUEST,
            );

        const second =
          StellarCoherenceBatchRunner
            .run(
              SMALL_REQUEST,
            );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should accept a zero-sized diagnostic sample while still counting all violations',
      () => {
        const report =
          StellarCoherenceBatchRunner
            .run({
              universeSeeds: [
                SEED_A,
              ],
              systemsPerSeed:
                32,
              maxRecordedViolations:
                0,
            });

        expect(
          report.complete,
        ).toBe(
          true,
        );

        expect(
          report.violations,
        ).toEqual(
          [],
        );
      },
    );

    it(
      'should reject invalid, duplicate or unbounded batch requests before generation',
      () => {
        expect(
          () =>
            StellarCoherenceBatchRunner
              .run({
                universeSeeds: [],
                systemsPerSeed:
                  1,
              }),
        ).toThrowError(
          /at least one UniverseSeed/i,
        );

        expect(
          () =>
            StellarCoherenceBatchRunner
              .run({
                universeSeeds: [
                  SEED_A,
                  SEED_A,
                ],
                systemsPerSeed:
                  1,
              }),
        ).toThrowError(
          /Duplicate UniverseSeed/i,
        );

        expect(
          () =>
            StellarCoherenceBatchRunner
              .run({
                universeSeeds: [
                  SEED_A,
                ],
                systemsPerSeed:
                  1_000_001,
              }),
        ).toThrowError(
          /at most 1000000 systems/i,
        );
      },
    );
  },
);

function sumCounts(
  counts:
    Readonly<Record<string, number>>,
): number {
  return Object.values(
    counts,
  ).reduce(
    (
      total,
      value,
    ) =>
      total +
      value,
    0,
  );
}
