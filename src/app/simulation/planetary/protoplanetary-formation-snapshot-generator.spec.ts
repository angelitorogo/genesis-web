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
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  PROTOPLANETARY_DISK_V1_MATURATION_REFERENCE_PROGRESS,
} from './protoplanetary-disk-profile-generator';

import {
  ProtoplanetaryFormationSnapshotGenerator,
} from './protoplanetary-formation-snapshot-generator';

describe(
  'ProtoplanetaryFormationSnapshotGenerator mature-history replay for point 24.2',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const locator =
      new SystemLocator(
        0n,
        0n,
        0n,
      );

    it(
      'should replay a deterministic historical formation reference even after the current primordial disk is gone',
      () => {
        const first =
          ProtoplanetaryFormationSnapshotGenerator
            .generateMaturationReferenceOrNull(
              generationKey,
              locator,
            );

        const second =
          ProtoplanetaryFormationSnapshotGenerator
            .generateMaturationReferenceOrNull(
              generationKey,
              locator,
            );

        expect(
          first,
        ).not.toBeNull();

        expect(
          second,
        ).toEqual(
          first,
        );

        expect(
          first
            ?.diskProfile
            .evolutionProgress01,
        ).toBeCloseTo(
          PROTOPLANETARY_DISK_V1_MATURATION_REFERENCE_PROGRESS,
          12,
        );

        expect(
          first
            ?.stellarLifetimeProfile
            .ageBillionYears,
        ).toBeCloseTo(
          (
            first
              ?.diskProfile
              .dispersalAgeMillionYears ??
            0
          ) *
            PROTOPLANETARY_DISK_V1_MATURATION_REFERENCE_PROGRESS /
            1_000,
          12,
        );
      },
      30_000,
    );
  },
);
