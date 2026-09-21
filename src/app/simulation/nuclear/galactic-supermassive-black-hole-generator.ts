import { GalacticObjectLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { isGalacticNucleusLocator } from '../../domain/universe/galactic-center';
import { GalacticSupermassiveBlackHole } from '../../domain/universe/galactic-supermassive-black-hole';
import { Galaxy } from '../../domain/universe/galaxy';
import { SupermassiveBlackHolePhysicalProfile } from '../../domain/universe/supermassive-black-hole-physical-profile';
import { GalaxyGenerator } from '../universe/galaxy-generator';
import { GalacticCenterNucleusResolver } from './galactic-center-nucleus-resolver';

/**
 * 27.3 — a zero-new-draw projection of existing V1/V2 galactic Ground Truth.
 * The GalaxyGenerator is authoritative for presence, mass and nuclear state.
 * Never generate an alternative SMBH, relocate it to an unused extreme-object
 * slot or silently turn an undifferentiated/quiescent centre into an SMBH.
 * Consumers MUST apply their existing scientific disclosure rules separately.
 */
export class GalacticSupermassiveBlackHoleGenerator {
  private constructor() {}

  static fromGalaxy(galaxy: Galaxy): GalacticSupermassiveBlackHole | null {
    if (!(galaxy instanceof Galaxy)) {
      throw new TypeError('27.3 requires a canonical Galaxy.');
    }
    // Preserve V1's existing nucleus-state invariants, including the absence
    // of QUASAR states for dwarf/irregular hosts. No seed or entropy is drawn.
    GalacticCenterNucleusResolver.resolveState(galaxy);
    const source = galaxy.nucleus?.supermassiveBlackHole;
    if (!source) return null;
    return new GalacticSupermassiveBlackHole(
      galaxy,
      new SupermassiveBlackHolePhysicalProfile(
        source.massSolarMasses,
        galaxy.physicalProperties.totalMassSolarMasses,
      ),
    );
  }

  static generate(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
  ): GalacticSupermassiveBlackHole | null {
    return this.fromGalaxy(GalaxyGenerator.generate(generationKey, galaxyIndex));
  }

  /** Non-nuclear addresses must return null without generating a galaxy. */
  static generateForLocator(
    generationKey: UniverseGenerationKey,
    locator: GalacticObjectLocator,
  ): GalacticSupermassiveBlackHole | null {
    if (!(locator instanceof GalacticObjectLocator)) {
      throw new TypeError('27.3 requires an existing GalacticObjectLocator.');
    }
    if (!isGalacticNucleusLocator(locator)) return null;
    return this.generate(generationKey, locator.galaxyIndex);
  }
}
