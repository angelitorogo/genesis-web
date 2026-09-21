import { sha256 } from '@noble/hashes/sha2.js';
import { hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

import { ExplorationResultKind } from '../../domain/exploration/exploration-sector-result';
import { IntermediateMassBlackHole } from '../../domain/galactic-object/intermediate-mass-black-hole';
import { IntermediateMassBlackHolePhysicalProperties } from '../../domain/galactic-object/intermediate-mass-black-hole-physical-properties';
import { frozenPhysicalSourceKey } from '../../domain/generation/frozen-physical-source-key';
import { GalacticObjectLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { isGalacticNucleusLocator } from '../../domain/universe/galactic-center';
import { StellarBlackHole } from '../../domain/stellar/stellar-black-hole';
import { ExplorationSectorResultEngine } from '../exploration/exploration-sector-result-engine';
import { ProceduralTargetResolver } from '../regeneration/procedural-target-resolver';
import { GalaxySectorObjectLocationResolver } from '../sector/galaxy-sector-object-location-resolver';
import { GalaxySectorContentGenerator } from '../sector/galaxy-sector-content-generator';
import { GalaxySectorGridGenerator } from '../sector/galaxy-sector-grid-generator';
import { GalaxyGenerator } from '../universe/galaxy-generator';
import { SupernovaRemnantGenerator } from './supernova-remnant-generator';

const DOMAIN = utf8ToBytes('GENESIS-INTERMEDIATE-MASS-BLACK-HOLE-V1');
const MEMBERSHIP_LABEL = utf8ToBytes('rare-membership');
const MASS_LABEL = utf8ToBytes('mass-solar');
const UINT32_SCALE = 4_294_967_296;

/**
 * Explicit gameplay rarity, NOT a measured astrophysical occurrence rate.
 * Only 1.2% of the unused (non-SNR), non-nuclear EXTREME_OBJECT complement
 * qualifies. Existing point-12.6 supernova remnant assignments never move.
 */
const RARE_COMPLEMENT_FRACTION = 0.012;

/**
 * 27.2 — lazy, deterministic rare IMBH specialization.
 * - No additional object, locator or seed is created; the existing sector
 *   generator is consulted only for rare hits (using its unchanged PRNG).
 * - V2 uses the frozen V1 GALACTIC entropy only as a private physical input;
 *   the returned object retains the PUBLIC V2 UniverseGenerationKey.
 * - A null return means this existing locator has no IMBH, not that the object
 *   is observationally ruled out. Ground Truth is never shown directly.
 */
export class IntermediateMassBlackHoleGenerator {
  private constructor() {}

  static isIntermediateMassBlackHoleLocator(
    generationKey: UniverseGenerationKey,
    locator: GalacticObjectLocator,
  ): boolean {
    if (!(locator instanceof GalacticObjectLocator)) {
      throw new TypeError('27.2 requires an existing GalacticObjectLocator.');
    }
    const physicalKey = frozenPhysicalSourceKey(generationKey);
    if (isGalacticNucleusLocator(locator) ||
        ExplorationSectorResultEngine.resolveGalacticObjectKind(physicalKey, locator) !==
          ExplorationResultKind.EXTREME_OBJECT ||
        SupernovaRemnantGenerator.isSupernovaRemnantLocator(physicalKey, locator)) {
      return false;
    }

    const targetSeed = ProceduralTargetResolver.resolveTargetSeed(physicalKey, locator);
    if (unit(targetSeed.normalizedValue, MEMBERSHIP_LABEL) >= RARE_COMPLEMENT_FRACTION) {
      return false;
    }

    // The entropy branch alone is not enough: reject imaginary ordinals in
    // unoccupied sectors. Materialize only THIS sector, and only on a rare hit.
    const galaxy = GalaxyGenerator.generate(generationKey, locator.galaxyIndex);
    const grid = GalaxySectorGridGenerator.generate(galaxy);
    const coordinates = grid.coordinatesFor(locator.sectorKey);
    return GalaxySectorContentGenerator.generate(galaxy, coordinates)
      .galacticObjectLocators.some(candidate =>
        candidate.galacticObjectIndex === locator.galacticObjectIndex);

  }

  static generate(
    generationKey: UniverseGenerationKey,
    locator: GalacticObjectLocator,
  ): IntermediateMassBlackHole | null {
    if (!this.isIntermediateMassBlackHoleLocator(generationKey, locator)) return null;

    const physicalKey = frozenPhysicalSourceKey(generationKey);
    const targetSeed = ProceduralTargetResolver.resolveTargetSeed(physicalKey, locator);
    const massDraw = unit(targetSeed.normalizedValue, MASS_LABEL);
    // Illustrative log-mass prior, biased toward lower masses. This is not
    // a derived merger history or an empirical IMBH mass function.
    const massSolar = 100 * Math.exp(Math.log(500) * massDraw ** 2.2);
    const physicalProperties = new IntermediateMassBlackHolePhysicalProperties(
      massSolar,
      // A Schwarzschild reference is valid for any mass; the existing 27.1
      // helper uses the same SI constants (2GM/c²), without inferring spin.
      StellarBlackHole.schwarzschildRadiusFor(massSolar),
    );

    return new IntermediateMassBlackHole(
      generationKey,
      locator,
      GalaxySectorObjectLocationResolver.resolve(generationKey, locator),
      physicalProperties,
    );
  }
}

/** Independent SHA-256-labelled uint32; no draws on the global PRNG. */
function unit(targetSeedHex: string, label: Uint8Array): number {
  const digest = sha256.create()
    .update(DOMAIN)
    .update(hexToBytes(targetSeedHex))
    .update(label)
    .digest();
  return (digest[0] * 0x01000000 + digest[1] * 0x00010000 +
    digest[2] * 0x00000100 + digest[3]) / UINT32_SCALE;
}
