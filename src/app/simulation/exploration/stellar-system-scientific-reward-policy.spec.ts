import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  StellarSystemScientificRewardPolicyV1,
} from './stellar-system-scientific-reward-policy';

const generationKey =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V1,
  );

describe(
  'StellarSystemScientificRewardPolicyV1 point 26.A.8',
  () => {
    it(
      'should delegate the four scientific milestones to the existing PD economy',
      () => {
        expect(
          StellarSystemScientificRewardPolicyV1
            .evaluate(
              generationKey,
              DiscoveryState.DETECTED,
              DiscoveryState.DISCOVERED,
            )
            .totalAwardedDiscoveryPoints,
        ).toBe(24);

        expect(
          StellarSystemScientificRewardPolicyV1
            .evaluate(
              generationKey,
              DiscoveryState.DISCOVERED,
              DiscoveryState.VISITED,
            )
            .totalAwardedDiscoveryPoints,
        ).toBe(18);

        expect(
          StellarSystemScientificRewardPolicyV1
            .evaluate(
              generationKey,
              DiscoveryState.VISITED,
              DiscoveryState.CATALOGUED,
            )
            .totalAwardedDiscoveryPoints,
        ).toBe(30);

        expect(
          StellarSystemScientificRewardPolicyV1
            .evaluate(
              generationKey,
              DiscoveryState.CATALOGUED,
              DiscoveryState.CONFIRMED,
            )
            .totalAwardedDiscoveryPoints,
        ).toBe(48);
      },
    );

    it(
      'should make replay idempotent and reject skipped or out-of-scope transitions',
      () => {
        expect(
          StellarSystemScientificRewardPolicyV1
            .evaluate(
              generationKey,
              DiscoveryState.CATALOGUED,
              DiscoveryState.CATALOGUED,
            )
            .totalAwardedDiscoveryPoints,
        ).toBe(0);

        expect(
          () =>
            StellarSystemScientificRewardPolicyV1
              .evaluate(
                generationKey,
                DiscoveryState.DETECTED,
                DiscoveryState.CATALOGUED,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            StellarSystemScientificRewardPolicyV1
              .evaluate(
                generationKey,
                DiscoveryState.UNKNOWN,
                DiscoveryState.DETECTED,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
