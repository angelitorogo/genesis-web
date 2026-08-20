import {
  afterEach,
  vi,
} from 'vitest';

import {
  HiiRegion,
} from '../../domain/galactic-object/hii-region';

import {
  NebulaType,
} from '../../domain/galactic-object/nebula-type';

import {
  StarFormationActivity,
} from '../../domain/galactic-object/star-formation-activity';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  NebulaGenerator,
} from './nebula-generator';

import {
  HiiRegionGenerator,
} from './hii-region-generator';

describe(
  'HiiRegionGenerator',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const canonicalSectorKey =
      123456789n;

    afterEach(
      () => {
        vi.restoreAllMocks();
      },
    );

    function locator(
      galacticObjectIndex:
        bigint,
    ): GalacticObjectLocator {

      return new GalacticObjectLocator(
        0n,
        canonicalSectorKey,
        galacticObjectIndex,
      );
    }

    it(
      'should resolve H II candidacy from the nebular subtype discriminator without materializing parent physical properties',
      () => {
        const generateSpy =
          vi.spyOn(
            NebulaGenerator,
            'generate',
          );

        const resolveTypeSpy =
          vi.spyOn(
            NebulaGenerator,
            'resolveType',
          );

        expect(
          HiiRegionGenerator
            .isHiiRegionLocator(
              generationKey,
              locator(
                3n,
              ),
            ),
        ).toBe(
          true,
        );

        expect(
          HiiRegionGenerator
            .isHiiRegionLocator(
              generationKey,
              locator(
                10n,
              ),
            ),
        ).toBe(
          false,
        );

        expect(
          resolveTypeSpy,
        ).toHaveBeenCalledTimes(
          2,
        );

        expect(
          generateSpy,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'should resolve LOW activity without materializing parent or H II physical properties',
      () => {
        const generateSpy =
          vi.spyOn(
            NebulaGenerator,
            'generate',
          );

        expect(
          HiiRegionGenerator
            .resolveActivity(
              generationKey,
              locator(
                11n,
              ),
            ),
        ).toBe(
          StarFormationActivity
            .LOW,
        );

        expect(
          HiiRegionGenerator
            .resolveActivity(
              generationKey,
              locator(
                10n,
              ),
            ),
        ).toBeNull();

        expect(
          generateSpy,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'should materialize an H II region only from a qualifying emission nebula',
      () => {
        const target =
          locator(
            3n,
          );

        expect(
          NebulaGenerator
            .generate(
              generationKey,
              target,
            )
            .nebulaType,
        ).toBe(
          NebulaType.EMISSION,
        );

        expect(
          HiiRegionGenerator
            .isHiiRegionLocator(
              generationKey,
              target,
            ),
        ).toBe(
          true,
        );

        expect(
          HiiRegionGenerator
            .generate(
              generationKey,
              target,
            ),
        ).toBeInstanceOf(
          HiiRegion,
        );
      },
    );

    it(
      'should reject reflection, dark and planetary nebulae as H II regions',
      () => {
        const nonEmission = [
          8n,
          16n,
          10n,
        ] as const;

        for (
          const index
          of nonEmission
        ) {
          const target =
            locator(
              index,
            );

          expect(
            NebulaGenerator
              .generate(
                generationKey,
                target,
              )
              .nebulaType,
          ).not.toBe(
            NebulaType.EMISSION,
          );

          expect(
            HiiRegionGenerator
              .isHiiRegionLocator(
                generationKey,
                target,
              ),
          ).toBe(
            false,
          );

          expect(
            () =>
              HiiRegionGenerator
                .generate(
                  generationKey,
                  target,
                ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should preserve emission nebulae that do not qualify as H II regions',
      () => {
        const target =
          locator(
            17n,
          );

        expect(
          NebulaGenerator
            .generate(
              generationKey,
              target,
            )
            .nebulaType,
        ).toBe(
          NebulaType.EMISSION,
        );

        expect(
          HiiRegionGenerator
            .isHiiRegionLocator(
              generationKey,
              target,
            ),
        ).toBe(
          false,
        );

        expect(
          () =>
            HiiRegionGenerator
              .generate(
                generationKey,
                target,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a GalacticObjectLocator outside the canonical point-9.4 NEBULA family',
      () => {
        const target =
          locator(
            7n,
          );

        expect(
          NebulaGenerator
            .isNebulaLocator(
              generationKey,
              target,
            ),
        ).toBe(
          false,
        );

        expect(
          HiiRegionGenerator
            .isHiiRegionLocator(
              generationKey,
              target,
            ),
        ).toBe(
          false,
        );

        expect(
          () =>
            HiiRegionGenerator
              .generate(
                generationKey,
                target,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should regenerate exactly the same H II and star-formation Ground Truth for the same locator',
      () => {
        const target =
          locator(
            3n,
          );

        const first =
          HiiRegionGenerator
            .generate(
              generationKey,
              target,
            );

        const second =
          HiiRegionGenerator
            .generate(
              generationKey,
              target,
            );

        expect(
          second.hiiPhysicalProperties,
        ).toEqual(
          first.hiiPhysicalProperties,
        );

        expect(
          second.starFormationProfile,
        ).toEqual(
          first.starFormationProfile,
        );

        expect(
          second.location,
        ).toEqual(
          first.location,
        );
      },
    );

    it(
      'should preserve the frozen V1 H II and star-formation vector',
      () => {
        const region =
          HiiRegionGenerator
            .generate(
              generationKey,
              locator(
                3n,
              ),
            );

        expect(
          region.nebulaType,
        ).toBe(
          NebulaType.EMISSION,
        );

        expect(
          region
            .hiiPhysicalProperties
            .radiusParsecs,
        ).toBeCloseTo(
          20.474723323466,
          10,
        );

        expect(
          region
            .hiiPhysicalProperties
            .electronTemperatureKelvin,
        ).toBeCloseTo(
          11330.769160296768,
          10,
        );

        expect(
          region
            .hiiPhysicalProperties
            .electronDensityPerCm3,
        ).toBeCloseTo(
          364.356938703346,
          10,
        );

        expect(
          region
            .starFormationProfile
            .activity,
        ).toBe(
          StarFormationActivity.MODERATE,
        );

        expect(
          region
            .starFormationProfile
            .starFormationRateSolarMassesPerMillionYears,
        ).toBeCloseTo(
          1435.678065192311,
          10,
        );

        expect(
          region
            .starFormationProfile
            .youngStellarAgeMillionYears,
        ).toBeCloseTo(
          3.521472142776,
          10,
        );

        expect(
          region
            .starFormationProfile
            .ionizingStarCount,
        ).toBe(
          17,
        );

        expect(
          region
            .starFormationProfile
            .ionizingPhotonRatePerSecond,
        ).toBeCloseTo(
          1.0638528447247268e49,
          10,
        );
      },
    );

    it(
      'should keep all generated H II regions physically bounded inside their emission nebulae',
      () => {
        let checked =
          0;

        for (
          let index = 0n;
          index < 512n;
          index += 1n
        ) {
          const target =
            locator(
              index,
            );

          if (
            !HiiRegionGenerator
              .isHiiRegionLocator(
                generationKey,
                target,
              )
          ) {
            continue;
          }

          const region =
            HiiRegionGenerator
              .generate(
                generationKey,
                target,
              );

          checked +=
            1;

          expect(
            region
              .hiiPhysicalProperties
              .radiusParsecs,
          ).toBeGreaterThan(
            0,
          );

          expect(
            region
              .hiiPhysicalProperties
              .radiusParsecs,
          ).toBeLessThanOrEqual(
            region
              .physicalProperties
              .radiusParsecs,
          );

          expect(
            region
              .hiiPhysicalProperties
              .electronTemperatureKelvin,
          ).toBeGreaterThanOrEqual(
            7_000,
          );

          expect(
            region
              .hiiPhysicalProperties
              .electronTemperatureKelvin,
          ).toBeLessThan(
            12_000,
          );

          expect(
            region
              .hiiPhysicalProperties
              .electronDensityPerCm3,
          ).toBeGreaterThanOrEqual(
            10,
          );

          expect(
            region
              .hiiPhysicalProperties
              .electronDensityPerCm3,
          ).toBeLessThan(
            10_000,
          );

          expect(
            region
              .starFormationProfile
              .youngStellarAgeMillionYears,
          ).toBeGreaterThanOrEqual(
            0.2,
          );

          expect(
            region
              .starFormationProfile
              .youngStellarAgeMillionYears,
          ).toBeLessThan(
            8,
          );

          expect(
            region
              .starFormationProfile
              .ionizingStarCount,
          ).toBeGreaterThan(
            0,
          );

          expect(
            region
              .starFormationProfile
              .ionizingPhotonRatePerSecond,
          ).toBeGreaterThan(
            0,
          );
        }

        expect(
          checked,
        ).toBeGreaterThan(
          10,
        );
      },
      30_000,
    );

    it(
      'should keep all four V1 star-formation activity levels reachable without changing parent nebula identity',
      () => {
        const reached =
          new Set<string>();

        for (
          let index = 0n;
          index < 2_048n;
          index += 1n
        ) {
          const target =
            locator(
              index,
            );

          if (
            !HiiRegionGenerator
              .isHiiRegionLocator(
                generationKey,
                target,
              )
          ) {
            continue;
          }

          const region =
            HiiRegionGenerator
              .generate(
                generationKey,
                target,
              );

          reached.add(
            region
              .starFormationProfile
              .activity,
          );

          expect(
            region.locator,
          ).toBe(
            target,
          );

          if (
            reached.size ===
            Object.values(
              StarFormationActivity,
            ).length
          ) {
            break;
          }
        }

        expect(
          reached,
        ).toEqual(
          new Set(
            Object.values(
              StarFormationActivity,
            ),
          ),
        );
      },
      30_000,
    );
  },
);
