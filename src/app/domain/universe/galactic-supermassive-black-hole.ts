import { GalacticObjectLocator } from '../generation/procedural-locator';
import { type UniverseGenerationKey } from '../generation/universe-generation-key';
import { type GalacticNucleusState } from './galactic-nucleus-state';
import { Galaxy } from './galaxy';
import { SupermassiveBlackHolePhysicalProfile } from './supermassive-black-hole-physical-profile';

/**
 * 27.3 — one galaxy's existing central SMBH, addressed by the SAME reserved
 * (sectorKey 0, galacticObjectIndex 0) nucleus locator used by exploration.
 * This is Ground Truth only. Neither the locator nor the existence of this
 * object may bypass Observed Knowledge / the galaxy scientific-card gate.
 */
export class GalacticSupermassiveBlackHole {
  readonly generationKey: UniverseGenerationKey;
  readonly galaxyIndex: bigint;
  readonly nucleusLocator: GalacticObjectLocator;
  readonly nucleusState: GalacticNucleusState;

  constructor(
    galaxy: Galaxy,
    readonly physicalProfile: SupermassiveBlackHolePhysicalProfile,
  ) {
    if (!(galaxy instanceof Galaxy)) {
      throw new TypeError('27.3 requires a canonical Galaxy.');
    }
    const nucleus = galaxy.nucleus;
    const source = nucleus?.supermassiveBlackHole;
    if (!source) {
      throw new RangeError('Cannot materialize an SMBH where the canonical nucleus has none.');
    }
    if (!(physicalProfile instanceof SupermassiveBlackHolePhysicalProfile) ||
        physicalProfile.massSolarMasses !== source.massSolarMasses ||
        physicalProfile.hostTotalMassSolarMasses !== galaxy.physicalProperties.totalMassSolarMasses) {
      throw new RangeError('The derived SMBH must match the existing galactic nucleus and host exactly.');
    }

    this.generationKey = galaxy.generationKey;
    this.galaxyIndex = galaxy.index;
    this.nucleusLocator = new GalacticObjectLocator(galaxy.index, 0n, 0n);
    this.nucleusState = nucleus.state;
    Object.freeze(this.nucleusLocator);
    Object.freeze(this);
  }
}
