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
  GravitationalLensingReconstructionProfileEngine,
} from './gravitational-lensing-reconstruction-profile-engine';

import {
  IntermediateMassBlackHoleGenerator,
} from './intermediate-mass-black-hole-generator';

const key =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V2,
  );

const imbh =
  findDistributedExtreme(
    ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
  );

const stellarMassBlackHole =
  findDistributedExtreme(
    ExtremeType.STELLAR_MASS_BLACK_HOLE,
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
  '28.6 — deterministic gravitational-lensing/source reconstruction profile',
  () => {
    it(
      'stays hidden before CONFIRMED and never leaks lens reconstruction early',
      () => {
        for (
          const locator
          of [
            imbh,
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
              GravitationalLensingReconstructionProfileEngine
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
      'reuses the canonical IMBH mass and Schwarzschild radius without reading renderer geometry',
      () => {
        const canonical =
          IntermediateMassBlackHoleGenerator
            .generate(
              key,
              imbh,
            )!;

        const first =
          GravitationalLensingReconstructionProfileEngine
            .resolveConfirmed(
              key,
              imbh,
              DiscoveryState.CONFIRMED,
            );

        const second =
          GravitationalLensingReconstructionProfileEngine
            .resolveConfirmed(
              key,
              imbh,
              DiscoveryState.CONFIRMED,
            );

        expect(first).not.toBeNull();
        expect(second).toEqual(first);
        expect(first!.sourceType).toBe(
          ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
        );
        expect(first!.lensClass).toBe(
          'INTERMEDIATE_MASS_BLACK_HOLE',
        );
        expect(first!.lensMassSolarMasses).toBe(
          canonical.physicalProperties.massSolar,
        );
        expect(first!.schwarzschildRadiusKm).toBe(
          canonical.physicalProperties.schwarzschildRadiusKm,
        );
      },
    );

    it(
      'reconstructs a detected point lens with two parity images, magnification and causal differential delay',
      () => {
        const profile =
          GravitationalLensingReconstructionProfileEngine
            .resolveConfirmed(
              key,
              detectedActiveNucleus,
              DiscoveryState.CONFIRMED,
            )!;

        expect(profile.lensClass).toBe(
          'SUPERMASSIVE_BLACK_HOLE',
        );
        expect(profile.reconstructableLensingSignatureDetected).toBe(true);
        expect(profile.primaryImagePositionEinsteinRadii).toBeGreaterThan(0);
        expect(profile.secondaryImagePositionEinsteinRadii).toBeLessThan(0);
        expect(profile.imageSeparationEinsteinRadii).toBeGreaterThan(2);
        expect(profile.primaryAbsoluteMagnification).toBeGreaterThan(1);
        expect(profile.secondaryAbsoluteMagnification).toBeGreaterThan(0);
        expect(profile.totalAbsoluteMagnification).toBeGreaterThan(1);
        expect(profile.primaryToSecondaryFluxRatio).toBeGreaterThan(1);
        expect(profile.reconstructedIntrinsicFluxFractionOfObserved).toBeGreaterThan(0);
        expect(profile.reconstructedIntrinsicFluxFractionOfObserved).toBeLessThan(1);
        expect(profile.differentialTimeDelaySeconds).toBeGreaterThan(0);
        expect(profile.sourcePlaneClosureResidualEinsteinRadii).toBeLessThan(1e-9);

        const reconstructedFromImages =
          profile.primaryImagePositionEinsteinRadii! +
          profile.secondaryImagePositionEinsteinRadii!;

        const relativeClosure =
          Math.abs(
            reconstructedFromImages -
              profile.reconstructedSourceOffsetEinsteinRadii!,
          );

        expect(relativeClosure).toBeLessThan(1e-9);
      },
    );

    it(
      'allows a confirmed canonical black-hole lens to yield a genuine non-detection',
      () => {
        const profile =
          GravitationalLensingReconstructionProfileEngine
            .resolveConfirmed(
              key,
              undetectedActiveNucleus,
              DiscoveryState.CONFIRMED,
            )!;

        expect(profile.reconstructableLensingSignatureDetected).toBe(false);
        expect(profile.reconstructedSourceOffsetEinsteinRadii).toBeNull();
        expect(profile.primaryImagePositionEinsteinRadii).toBeNull();
        expect(profile.totalAbsoluteMagnification).toBeNull();
        expect(profile.differentialTimeDelaySeconds).toBeNull();
      },
    );

    it(
      'does not invent a scientific mass for the visual-only distributed stellar-mass BH taxonomy',
      () => {
        expect(
          GravitationalLensingReconstructionProfileEngine
            .resolveConfirmed(
              key,
              stellarMassBlackHole,
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
      GravitationalLensingReconstructionProfileEngine
        .resolveConfirmed(
          key,
          locator,
          DiscoveryState.CONFIRMED,
        );

    if (
      profile !==
        null &&
      profile.reconstructableLensingSignatureDetected ===
        requireDetection
    ) {
      return locator;
    }
  }

  throw new Error(
    'Missing deterministic active-nucleus 28.6 fixture.',
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
    `Missing deterministic 28.6 fixture for ${type}.`,
  );
}
