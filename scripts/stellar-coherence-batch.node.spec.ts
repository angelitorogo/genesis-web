import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  StellarCoherenceBatchRunner,
  type StellarCoherenceBatchReport,
} from '../src/app/simulation/stellar/stellar-coherence-batch-runner';

const UNIVERSE_SEED_COUNT =
  64;

const SYSTEMS_PER_SEED =
  512;

const UINT64_MASK =
  (1n << 64n) - 1n;

const BASE_HIGH =
  0x7F21A9D418CE4B70n;

const BASE_LOW =
  0x92F16A0C6E35D8B1n;

const HIGH_STEP =
  0x9E3779B97F4A7C15n;

const LOW_STEP =
  0xD1B54A32D192ED03n;

describe(
  'GENESIS point 15.7 massive StellarGenerator coherence batch in Node',
  () => {
    it(
      'should validate 32768 systems across 64 deterministic UniverseSeeds without a physical-coherence violation',
      () => {
        const report =
          StellarCoherenceBatchRunner
            .run({
              universeSeeds:
                deterministicUniverseSeeds(
                  UNIVERSE_SEED_COUNT,
                ),
              systemsPerSeed:
                SYSTEMS_PER_SEED,
              maxRecordedViolations:
                32,
            });

        expect(
          report.complete,
          failureMessage(
            report,
          ),
        ).toBe(
          true,
        );

        expect(
          report.totalSystems,
        ).toBe(
          UNIVERSE_SEED_COUNT *
          SYSTEMS_PER_SEED,
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

        const repeatedReport =
          StellarCoherenceBatchRunner
            .run({
              universeSeeds:
                deterministicUniverseSeeds(
                  UNIVERSE_SEED_COUNT,
                ),
              systemsPerSeed:
                SYSTEMS_PER_SEED,
              maxRecordedViolations:
                32,
            });

        expect(
          repeatedReport,
        ).toEqual(
          report,
        );

        expect(
          report.evolutionStateCounts.BROWN_DWARF,
        ).toBeGreaterThan(
          0,
        );

        expect(
          report.evolutionStateCounts.MAIN_SEQUENCE,
        ).toBeGreaterThan(
          0,
        );

        const compactRemnants =
          report.evolutionStateCounts.WHITE_DWARF +
          report.evolutionStateCounts.NEUTRON_STAR +
          report.evolutionStateCounts.STELLAR_BLACK_HOLE;

        expect(
          compactRemnants,
        ).toBeGreaterThan(
          0,
        );
      },
      120_000,
    );
  },
);

function deterministicUniverseSeeds(
  count:
    number,
): readonly string[] {
  const result:
    string[] =
      [];

  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const ordinal =
      BigInt(
        index,
      );

    const high =
      (
        BASE_HIGH +
        HIGH_STEP *
          ordinal
      ) &
      UINT64_MASK;

    const low =
      (
        BASE_LOW ^
        (
          LOW_STEP *
          (
            ordinal +
            1n
          )
        )
      ) &
      UINT64_MASK;

    const raw =
      high
        .toString(16)
        .padStart(
          16,
          '0',
        ) +
      low
        .toString(16)
        .padStart(
          16,
          '0',
        );

    result.push(
      raw
        .toUpperCase()
        .match(/.{4}/g)!
        .join('-'),
    );
  }

  return result;
}

function failureMessage(
  report:
    StellarCoherenceBatchReport,
): string {
  if (
    report.complete
  ) {
    return '';
  }

  return [
    'Point-15.7 massive stellar coherence regression failed.',
    `processed=${report.processedSystems}/${report.totalSystems}`,
    `failedSystems=${report.failedSystems}`,
    `totalViolations=${report.totalViolations}`,
    `checksum64=${report.checksum64}`,
    'First recorded violations:',
    JSON.stringify(
      report.violations,
      null,
      2,
    ),
  ].join('\n');
}
