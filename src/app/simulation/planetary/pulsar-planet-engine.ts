import { Planet } from '../../domain/planetary/planet';
import { PulsarPlanet, type PulsarPlanetSurvivalEvidence } from '../../domain/planetary/pulsar-planet';
import { StellarPulsar } from '../../domain/stellar/stellar-pulsar';

export interface ExistingPulsarPlanetCandidate {
  readonly planet: Planet;
  readonly survivalEvidence: PulsarPlanetSurvivalEvidence;
}

/**
 * 27.9 — evidence-gated, zero-PRNG projection of already generated bodies.
 * No evidence => NO pulsar planets. It never mutates a Planet, adds BodySeeds,
 * declares a new discovery, or treats an ordinary pre-collapse phase-18 orbit
 * as if its stability after a supernova had already been demonstrated.
 * Additional origins require a separately versioned 17/18 formation contract.
 */
export class PulsarPlanetEngine {
  private constructor() {}

  static fromExistingPlanets(
    pulsar: StellarPulsar | null,
    candidates: readonly ExistingPulsarPlanetCandidate[] = [],
  ): readonly PulsarPlanet[] {
    if (pulsar === null) {
      if (candidates.length !== 0) throw new RangeError('Planets cannot be bound to a missing pulsar.');
      return Object.freeze([]);
    }
    if (!(pulsar instanceof StellarPulsar) || !Array.isArray(candidates)) {
      throw new TypeError('27.9 requires a real pulsar and a list of existing-planet candidates.');
    }
    if (candidates.length > 8) {
      throw new RangeError('27.9 bounds a rare, independently evidenced pulsar-planet sample to eight bodies.');
    }
    const resolved = candidates.map(candidate => {
      if (!candidate || !(candidate.planet instanceof Planet)) {
        throw new TypeError('Every 27.9 candidate must reference an existing Planet.');
      }
      return new PulsarPlanet(pulsar, candidate.planet, candidate.survivalEvidence);
    }).sort((a, b) => a.semiMajorAxisAu - b.semiMajorAxisAu ||
      a.planet.seed.normalizedValue.localeCompare(b.planet.seed.normalizedValue));
    const seen = new Set<string>();
    for (let index = 0; index < resolved.length; index += 1) {
      const current = resolved[index]!;
      const id = current.planet.seed.normalizedValue;
      if (seen.has(id)) throw new RangeError('A canonical planet cannot be counted twice around its pulsar.');
      seen.add(id);
      if (index === 0) continue;
      const inner = resolved[index - 1]!;
      // This is a conservative preliminary check, not an N-body stability proof.
      if (inner.apoastronAu >= current.periastronAu) {
        throw new RangeError('Proposed current pulsar-planet orbits intersect.');
      }
      const massSumSolar = (inner.planet.massEarth + current.planet.massEarth) *
        PulsarPlanet.EARTH_MASS_KG / PulsarPlanet.SOLAR_MASS_KG;
      const mutualHillAu = (inner.semiMajorAxisAu + current.semiMajorAxisAu) / 2 *
        (massSumSolar / (3 * pulsar.neutronStar.massSolar)) ** (1 / 3);
      if (current.semiMajorAxisAu - inner.semiMajorAxisAu <= 3.5 * mutualHillAu) {
        throw new RangeError('Pulsar planet pair fails the minimum reference mutual-Hill spacing.');
      }
    }
    return Object.freeze(resolved);
  }
}
