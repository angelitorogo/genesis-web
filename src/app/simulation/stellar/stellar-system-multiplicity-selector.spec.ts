import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  StellarSystemMultiplicitySelector,
} from './stellar-system-multiplicity-selector';

describe(
  'StellarSystemMultiplicitySelector point 16.3',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should select exactly deterministically from SystemSeed without query-order coupling',
      () => {
        const target =
          new SystemSeed(
            'DC2EACC73FFB3E9388F8BEB9FEBE1F2E',
          );

        const before =
          StellarSystemMultiplicitySelector
            .select(
              generationKey,
              target,
            );

        StellarSystemMultiplicitySelector
          .select(
            generationKey,
            new SystemSeed(
              '0123456789ABCDEFFEDCBA9876543210',
            ),
          );

        const after =
          StellarSystemMultiplicitySelector
            .select(
              generationKey,
              target,
            );

        expect(before).toBe(
          StellarSystemMultiplicity.SINGLE,
        );

        expect(after).toBe(before);
      },
    );

    it(
      'should keep TRIPLE rare across a deterministic 10000-seed regression population',
      () => {
        let singles = 0;
        let binaries = 0;
        let triples = 0;

        for (
          let index = 0;
          index < 10_000;
          index += 1
        ) {
          const systemSeed =
            new SystemSeed(
              BigInt(index)
                .toString(16)
                .toUpperCase()
                .padStart(32, '0'),
            );

          const multiplicity =
            StellarSystemMultiplicitySelector
              .select(
                generationKey,
                systemSeed,
              );

          if (
            multiplicity ===
            StellarSystemMultiplicity.SINGLE
          ) {
            singles += 1;
          }
          else if (
            multiplicity ===
            StellarSystemMultiplicity.BINARY
          ) {
            binaries += 1;
          }
          else {
            triples += 1;
          }
        }

        expect(singles).toBe(7_024);
        expect(binaries).toBe(2_680);
        expect(triples).toBe(296);
        expect(triples).toBeLessThan(binaries / 5);
        expect(singles + binaries + triples).toBe(10_000);
      },
      15_000,
    );

    it(
      'should reject an unsupported future GeneratorVersion',
      () => {
        const unsupportedVersion =
          Object.freeze({
            name: 'V2',
            code: 2,
          }) as unknown as GeneratorVersion;

        const fakeV2 =
          new UniverseGenerationKey(
            generationKey.universeSeed,
            unsupportedVersion,
          );

        expect(
          () =>
            StellarSystemMultiplicitySelector
              .select(
                fakeV2,
                new SystemSeed(
                  'DC2EACC73FFB3E9388F8BEB9FEBE1F2E',
                ),
              ),
        ).toThrow(RangeError);
      },
    );
  },
);
