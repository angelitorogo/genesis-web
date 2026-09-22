import { IntermediateMassBlackHole } from '../../domain/galactic-object/intermediate-mass-black-hole';
import { StellarBlackHole } from '../../domain/stellar/stellar-black-hole';
import { CompactAccretionDisk, type BlackHoleAccretionHost } from '../../domain/stellar/compact-accretion-disk';
import { CompactAccretionSystem } from '../../domain/stellar/compact-accretion-system';
import { RelativisticJet, type RelativisticJetLaunchParameters } from '../../domain/stellar/relativistic-jet';
import { GalacticNucleusState } from '../../domain/universe/galactic-nucleus-state';
import { GalacticSupermassiveBlackHole } from '../../domain/universe/galactic-supermassive-black-hole';
import { Galaxy } from '../../domain/universe/galaxy';
import { GalacticSupermassiveBlackHoleGenerator } from '../nuclear/galactic-supermassive-black-hole-generator';

/** Explicit supply from a future physically justified companion/gas model. */
export interface CompactAccretionSupply {
  readonly sourceIdentity: string;
  readonly eddingtonRatio: number;
}

/**
 * 27.7 — no changes to seeds, PRNG, existing Ground Truth or observation gates.
 * AGN/QUASAR are established active states and receive clearly labelled
 * representative Eddington-ratio templates (not measured rates). Non-nuclear
 * black holes require an explicitly supplied gas/accretion context; no bare
 * black hole is assumed to be accreting. Jets ALWAYS need separate evidence.
 */
export class CompactAccretionEngine {
  private constructor() {}

  static fromExistingGalaxy(
    galaxy: Galaxy,
    jetParameters: RelativisticJetLaunchParameters | null = null,
  ): CompactAccretionSystem | null {
    if (!(galaxy instanceof Galaxy)) throw new TypeError('27.7 requires a canonical Galaxy.');
    const hole = GalacticSupermassiveBlackHoleGenerator.fromGalaxy(galaxy);
    if (!hole || hole.nucleusState === GalacticNucleusState.QUIESCENT) {
      if (jetParameters !== null) {
        throw new RangeError('A jet cannot be assigned to a nucleus without existing active accretion.');
      }
      return null;
    }
    if (hole.nucleusState !== GalacticNucleusState.AGN &&
        hole.nucleusState !== GalacticNucleusState.QUASAR) {
      throw new RangeError('Unsupported nuclear activity state.');
    }
    // Fixed, state-dependent educational proxies: no additional physical roll,
    // measured luminosity, temporal variability, or modification of nucleus.
    const representativeRatio = hole.nucleusState === GalacticNucleusState.QUASAR ? 0.3 : 0.04;
    return this.fromExistingBlackHole(hole,
      { sourceIdentity: `galaxy:${galaxy.index}`, eddingtonRatio: representativeRatio }, jetParameters);
  }

  static fromExistingBlackHole(
    host: BlackHoleAccretionHost,
    supply: CompactAccretionSupply | null,
    jetParameters: RelativisticJetLaunchParameters | null = null,
  ): CompactAccretionSystem | null {
    // Validate the host before treating missing supply as absence of a disk.
    if (!isBlackHole(host)) throw new TypeError('27.7 requires an existing black-hole profile.');
    if (host instanceof GalacticSupermassiveBlackHole &&
      host.nucleusState === GalacticNucleusState.QUIESCENT) {
      if (supply !== null || jetParameters !== null) {
        throw new RangeError('The canonical QUIESCENT nucleus cannot be reclassified by a disk helper.');
      }
      return null;
    }
    if (supply === null) {
      if (jetParameters !== null) throw new RangeError('Jet input alone cannot invent an accretion disk.');
      return null;
    }
    if (!/^[A-Za-z0-9:_-]{1,128}$/.test(supply.sourceIdentity)) {
      throw new RangeError('Accretion supply needs an explicit stable source identity.');
    }
    const disk = new CompactAccretionDisk(host, supply.eddingtonRatio);
    const jet = jetParameters === null ? null : new RelativisticJet(disk, jetParameters);
    return new CompactAccretionSystem(disk, jet);
  }
}

function isBlackHole(value: unknown): value is BlackHoleAccretionHost {
  return value instanceof GalacticSupermassiveBlackHole ||
    value instanceof StellarBlackHole || value instanceof IntermediateMassBlackHole;
}
