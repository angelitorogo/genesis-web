import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  ExtremeType,
} from '../../domain/galactic-object/extreme-object-type';

import {
  frozenPhysicalSourceKey,
} from '../../domain/generation/frozen-physical-source-key';

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
  ExplorationSectorResultEngine,
} from '../exploration/exploration-sector-result-engine';

import {
  GalaxySectorContentGenerator,
} from '../sector/galaxy-sector-content-generator';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  ExtremeObjectTypeResolver,
} from './extreme-object-type-resolver';

import {
  GalacticRelativisticJetAnalysisProfileEngine,
} from './relativistic-jet-analysis-profile-engine';

const key =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V2,
  );

const microquasar =
  findDistributedExtreme(
    ExtremeType.MICROQUASAR,
  );

const detectedActiveNucleus =
  findActiveNucleus(
    true,
  );

const undetectedActiveNucleus =
  findActiveNucleus(
    false,
  );

describe(
  '28.5 — deterministic relativistic-jet analysis profile',
  () => {
    it(
      'stays hidden before CONFIRMED for both nuclear and distributed jet contexts',
      () => {
        for (
          const locator
          of [
            microquasar,
            detectedActiveNucleus,
          ]
        ) {
          for (
            const state
            of [
              DiscoveryState.DETECTED,
              DiscoveryState.DISCOVERED,
              DiscoveryState.CATALOGUED,
            ]
          ) {
            expect(
              GalacticRelativisticJetAnalysisProfileEngine
                .resolveConfirmed(
                  key,
                  locator,
                  state,
                ),
            ).toBeNull();
          }
        }
      },
    );

    it(
      'treats MICROQUASAR as an established distributed jet regime without inventing an accretion power',
      () => {
        const first =
          GalacticRelativisticJetAnalysisProfileEngine
            .resolveConfirmed(
              key,
              microquasar,
              DiscoveryState.CONFIRMED,
            );

        const second =
          GalacticRelativisticJetAnalysisProfileEngine
            .resolveConfirmed(
              key,
              microquasar,
              DiscoveryState.CONFIRMED,
            );

        expect(first).not.toBeNull();
        expect(second).toEqual(first);
        expect(first!.sourceType).toBe(
          ExtremeType.MICROQUASAR,
        );
        expect(first!.jetSignatureDetected).toBe(
          true,
        );
        expect(first!.bulkLorentzFactor).toBeGreaterThanOrEqual(
          1.4,
        );
        expect(first!.bulkLorentzFactor).toBeLessThanOrEqual(
          6,
        );
        expect(first!.bulkVelocityFractionC).toBeGreaterThan(
          0,
        );
        expect(first!.bulkVelocityFractionC).toBeLessThan(
          1,
        );
        expect(first!.totalBipolarKineticPowerWatts).toBeNull();
        expect(first!.powerPerJetWatts).toBeNull();
      },
    );

    it(
      'derives a subluminal active-nucleus flow and reuses 27.7 only where the canonical disk exists',
      () => {
        const profile =
          GalacticRelativisticJetAnalysisProfileEngine
            .resolveConfirmed(
              key,
              detectedActiveNucleus,
              DiscoveryState.CONFIRMED,
            )!;

        expect([
          ExtremeType.AGN,
          ExtremeType.QUASAR,
        ]).toContain(
          profile.sourceType,
        );
        expect(profile.jetSignatureDetected).toBe(true);
        expect(profile.bulkVelocityFractionC).toBeGreaterThan(0);
        expect(profile.bulkVelocityFractionC).toBeLessThan(1);
        expect(profile.apparentApproachingSpeedC).toBeGreaterThan(0);
        expect(profile.approachingDopplerFactor).toBeGreaterThan(0);
        expect(profile.recedingDopplerFactor).toBeGreaterThan(0);
        expect(profile.dopplerAsymmetryRatio).toBeGreaterThanOrEqual(1);
        expect(profile.totalBipolarKineticPowerWatts).toBeGreaterThan(0);

        const expectedPowerPerJet =
          profile.totalBipolarKineticPowerWatts! / 2;

        const relativePowerSplitError =
          Math.abs(
            profile.powerPerJetWatts! -
              expectedPowerPerJet,
          ) /
          expectedPowerPerJet;

        // Both powers are independently normalized to 12 significant digits.
        // Validate the physical 50/50 bipolar split with a relative tolerance
        // rather than an absolute decimal epsilon at ~1e37 W.
        expect(relativePowerSplitError).toBeLessThan(1e-10);
      },
    );

    it(
      'allows a genuine active nucleus to yield a non-detection instead of inventing a universal jet',
      () => {
        const profile =
          GalacticRelativisticJetAnalysisProfileEngine
            .resolveConfirmed(
              key,
              undetectedActiveNucleus,
              DiscoveryState.CONFIRMED,
            )!;

        expect(profile.jetSignatureDetected).toBe(false);
        expect(profile.bulkLorentzFactor).toBeNull();
        expect(profile.bulkVelocityFractionC).toBeNull();
        expect(profile.totalBipolarKineticPowerWatts).toBeNull();
      },
    );

    it(
      'does not promote a bare IMBH into an accreting jet source',
      () => {
        const imbh =
          findDistributedExtreme(
            ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
          );

        expect(
          GalacticRelativisticJetAnalysisProfileEngine
            .resolveConfirmed(
              key,
              imbh,
              DiscoveryState.CONFIRMED,
            ),
        ).toBeNull();
      },
    );
  },
);

function findActiveNucleus(
  requireDetection:
    boolean,
): GalacticObjectLocator {

  for (
    let galaxyIndex =
      0n;
    galaxyIndex <
      512n;
    galaxyIndex +=
      1n
  ) {
    const locator =
      new GalacticObjectLocator(
        galaxyIndex,
        0n,
        0n,
      );

    const profile =
      GalacticRelativisticJetAnalysisProfileEngine
        .resolveConfirmed(
          key,
          locator,
          DiscoveryState.CONFIRMED,
        );

    if (
      profile !==
        null &&
      profile.jetSignatureDetected ===
        requireDetection
    ) {
      return locator;
    }
  }

  throw new Error(
    'Missing deterministic active-nucleus 28.5 fixture.',
  );
}

function findDistributedExtreme(
  type:
    typeof ExtremeType[keyof typeof ExtremeType],
): GalacticObjectLocator {

  const galaxy =
    GalaxyGenerator.generate(
      key,
      0n,
    );

  const physicalKey =
    frozenPhysicalSourceKey(
      key,
    );

  for (
    let x =
      -48;
    x <=
      48;
    x +=
      1
  ) {
    for (
      let y =
        -48;
      y <=
        48;
      y +=
        1
    ) {
      if (
        x ===
          0 &&
        y ===
          0
      ) {
        continue;
      }

      const content =
        GalaxySectorContentGenerator
          .generate(
            galaxy,
            {
              x,
              y,
            },
          );

      for (
        const locator
        of content.galacticObjectLocators
      ) {
        if (
          ExplorationSectorResultEngine
            .resolveGalacticObjectKind(
              physicalKey,
              locator,
            ) !==
          ExplorationResultKind.EXTREME_OBJECT
        ) {
          continue;
        }

        if (
          ExtremeObjectTypeResolver
            .resolve(
              key,
              locator,
            ) ===
          type
        ) {
          return locator;
        }
      }
    }
  }

  throw new Error(
    `Missing deterministic 28.5 fixture for ${type}.`,
  );
}
