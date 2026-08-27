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
  GalaxySectorStellarPopulationProperties,
} from '../../domain/sector/galaxy-sector-stellar-population-properties';

import {
  StellarPopulationProfile,
  StellarPopulationRegime,
} from '../../domain/stellar/stellar-population-profile';

import {
  STELLAR_TRIPLE_V1_MIN_HIERARCHY_SEPARATION_RATIO,
} from '../../domain/stellar/stellar-orbit-hierarchy';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  StellarSystemGenerator,
} from './stellar-system-generator';

describe(
  'StellarOrbitHierarchyGenerator point 16.4',
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
        1.0,
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
      'should freeze the canonical Jotheria A-B reference orbit without changing stellar identities',
      () => {
        const binary =
          StellarSystemGenerator
            .generateBinary(
              generationKey,
              new SystemLocator(
                0n,
                0n,
                0n,
              ),
              sector,
              population,
            );

        const inner =
          binary
            .orbitHierarchy
            .innerOrbit!;

        expect(inner.semiMajorAxisAu).toBeCloseTo(
          0.48736021222543574,
          12,
        );

        expect(inner.eccentricity).toBeCloseTo(
          0.5597974640676237,
          12,
        );

        expect(inner.periodYears).toBeCloseTo(
          1.1392754611906324,
          12,
        );

        expect(inner.periastronAu).toBeCloseTo(
          0.21453720133417795,
          12,
        );

        expect(inner.apoastronAu).toBeCloseTo(
          0.7601832231166935,
          12,
        );

        expect(
          binary.secondaryCompanion?.componentSeedHex,
        ).toBe(
          'A923624CF3ECDC5ED386CC9414F16BF2',
        );
      },
    );

    it(
      'should preserve the exact binary A-B orbit as the triple inner pair and place C on a stable outer orbit',
      () => {
        const locator =
          new SystemLocator(
            0n,
            0n,
            0n,
          );

        const binary =
          StellarSystemGenerator
            .generateBinary(
              generationKey,
              locator,
              sector,
              population,
            );

        const triple =
          StellarSystemGenerator
            .generateTriple(
              generationKey,
              locator,
              sector,
              population,
            );

        expect(
          triple.orbitHierarchy.innerOrbit,
        ).toEqual(
          binary.orbitHierarchy.innerOrbit,
        );

        expect(
          triple.secondaryCompanion,
        ).toEqual(
          binary.secondaryCompanion,
        );

        expect(
          triple.tertiaryCompanion?.componentSeedHex,
        ).toBe(
          '75A7DEA10ADE3DDA8751B531D3C6FF81',
        );

        const outer =
          triple
            .orbitHierarchy
            .outerOrbit!;

        expect(outer.semiMajorAxisAu).toBeCloseTo(
          14.286786441017645,
          11,
        );

        expect(outer.eccentricity).toBeCloseTo(
          0.5959942991339598,
          12,
        );

        expect(outer.periodYears).toBeCloseTo(
          165.51087306402385,
          10,
        );

        expect(
          triple.orbitHierarchy.hierarchySeparationRatio,
        ).toBeCloseTo(
          7.592831561794069,
          11,
        );

        expect(
          triple.orbitHierarchy.hierarchySeparationRatio!,
        ).toBeGreaterThanOrEqual(
          STELLAR_TRIPLE_V1_MIN_HIERARCHY_SEPARATION_RATIO,
        );
      },
    );

    it(
      'should remain exactly deterministic and independent from unrelated query order',
      () => {
        const locator =
          new SystemLocator(
            3n,
            27n,
            42n,
          );

        const before =
          StellarSystemGenerator
            .generateTriple(
              generationKey,
              locator,
              sector,
              population,
            );

        StellarSystemGenerator
          .generateTriple(
            generationKey,
            new SystemLocator(
              42n,
              123456789n,
              99n,
            ),
            sector,
            population,
          );

        const after =
          StellarSystemGenerator
            .generateTriple(
              generationKey,
              locator,
              sector,
              population,
            );

        expect(after.orbitHierarchy).toEqual(before.orbitHierarchy);
        expect(after.primaryStar).toEqual(before.primaryStar);
        expect(after.secondaryCompanion).toEqual(before.secondaryCompanion);
        expect(after.tertiaryCompanion).toEqual(before.tertiaryCompanion);
      },
    );

    it(
      'should reject an unsupported GeneratorVersion without touching any stellar branch',
      () => {
        const unsupportedVersion =
          ({
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
            StellarSystemGenerator
              .generateSingle(
                fakeV2,
                new SystemLocator(
                  0n,
                  0n,
                  0n,
                ),
                sector,
                population,
              ),
        ).toThrow(RangeError);
      },
    );

    it(
      'should keep 1024 generated triple hierarchies separated and physically finite',
      () => {
        for (
          let index = 0;
          index < 1_024;
          index += 1
        ) {
          const triple =
            StellarSystemGenerator
              .generateTriple(
                generationKey,
                new SystemLocator(
                  BigInt(
                    index % 7,
                  ),
                  BigInt(
                    index -
                    512,
                  ),
                  BigInt(
                    index,
                  ),
                ),
                sector,
                population,
              );

          const inner =
            triple
              .orbitHierarchy
              .innerOrbit!;

          const outer =
            triple
              .orbitHierarchy
              .outerOrbit!;

          expect(Number.isFinite(inner.semiMajorAxisAu)).toBe(true);
          expect(Number.isFinite(inner.periodYears)).toBe(true);
          expect(Number.isFinite(outer.semiMajorAxisAu)).toBe(true);
          expect(Number.isFinite(outer.periodYears)).toBe(true);
          expect(inner.periastronAu).toBeGreaterThan(0);
          expect(outer.periastronAu).toBeGreaterThan(
            inner.apoastronAu *
            (
              STELLAR_TRIPLE_V1_MIN_HIERARCHY_SEPARATION_RATIO -
              1e-12
            ),
          );
          expect(outer.periodYears).toBeGreaterThan(inner.periodYears);
        }
      },
      15_000,
    );
  },
);
