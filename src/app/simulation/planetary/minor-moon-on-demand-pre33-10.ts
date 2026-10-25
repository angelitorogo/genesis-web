import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import type { MoonSystem } from '../../domain/planetary/moon-system';
import type { MinorMoonCharacterizationPRE3310 } from '../../domain/planetary/minor-moon-characterization-pre33-10';

/**
 * Identity-only moons are NOT made into fabricated phase-21 RelevantMoon bodies.
 * On demand we can bound their dynamical domain using the unchanged host
 * profile. These bounds are NOT measurements, exact orbits or proof of sterility.
 * Cache is an optional bounded optimization: a reload/restart recomputes the
 * same immutable output from canonical V3 identities, without IndexedDB writes.
 */
export class MinorMoonOnDemandPRE3310 {
  private static readonly maximumEntries = 96;
  private static readonly cache = new Map<string, MinorMoonCharacterizationPRE3310>();

  static release(): void { this.cache.clear(); }
  static get cachedCount(): number { return this.cache.size; }

  static materialize(
    system: MoonSystem, moonIndex: bigint, epochYears = 0,
  ): MinorMoonCharacterizationPRE3310 | null {
    if (moonIndex < 0n || moonIndex >= BigInt(system.moonCount) ||
        moonIndex <= BigInt(Number.MAX_SAFE_INTEGER) * -1n ||
        !Number.isSafeInteger(epochYears) || epochYears < 0) return null;
    const ordinal = Number(moonIndex) + 1;
    if (!Number.isSafeInteger(ordinal) || ordinal <= system.relevantMoonCount) return null;
    const identity = system.moonIdentities[ordinal - 1];
    if (!identity || identity.moonOrdinal !== ordinal ||
        identity.hostPlanetLocator !== system.hostPlanet.locator ||
        identity.seed.kind !== 'moon') return null;
    const seed = identity.seed.normalizedValue;
    const key = `${seed}|${system.hostPlanet.massEarth}|${system.hostPlanet.radiusEarth}|${system.hillSphereRadiusPlanetRadii}|${epochYears}`;
    const cached = this.cache.get(key);
    if (cached) { this.cache.delete(key); this.cache.set(key, cached); return cached; }
    // PRE-33.10a. Neither the parent mass nor an algorithmic cap can be
    // advertised as an upper physical bound for an unresolved satellite.
    // These are only conditional, independent estimates for a trial scenario:
    // - prograde Hill reference assumes a circular satellite orbit (no measured e/i);
    // - fluid Roche reference needs a density hypothesis for this moon;
    // - 1000 R_p is an artificial sampling ceiling, not a stability frontier;
    // - 10^-5 of the host / minor count is a chosen *prior*, not a mass budget
    //   measured from the formation disk.
    const digest = sha256(utf8ToBytes(seed));
    const sample = (at: number) => ((digest[at]! << 16) + (digest[at+1]! << 8) + digest[at+2]!) / 16777216;
    const density = 1.2 + 2.8 * sample(3); // assumed 1.2..4.0 g/cm^3
    const hostDensity = 5.514 * system.hostPlanet.massEarth /
      (system.hostPlanet.radiusEarth ** 3);
    const rocheFluidReference = 2.44 * Math.cbrt(hostDensity / density);
    const progradeHillReference = 0.49 * system.hillSphereRadiusPlanetRadii;
    const sampleOuterCeiling = Math.min(1000, progradeHillReference);
    const smallestRelevant = system.relevantMoons.reduce((min, moon) =>
      Math.min(min, moon.massEarth), Number.POSITIVE_INFINITY);
    const budgetPerMinor = system.hostPlanet.massEarth * 1e-5 /
      Math.max(1, system.unmaterializedMinorMoonCount);
    const massPriorCeiling = Math.min(budgetPerMinor, Number.isFinite(smallestRelevant)
      ? smallestRelevant * 0.2 : budgetPerMinor);
    const candidateMass = massPriorCeiling * (0.15 + 0.85 * sample(0));
    const candidateRadius = Math.cbrt(candidateMass * 5.514 / density);
    const collisionClearance = 1 + candidateRadius / system.hostPlanet.radiusEarth;
    const lastRelevantOrbit = system.relevantMoons.reduce((max, moon) =>
      Math.max(max, moon.orbit.semiMajorAxisPlanetRadii), 0);
    const sampleInnerCeiling = Math.max(rocheFluidReference, collisionClearance,
      lastRelevantOrbit * 1.015);
    const possible = [rocheFluidReference, progradeHillReference, sampleOuterCeiling,
      massPriorCeiling, candidateMass, candidateRadius, sampleInnerCeiling]
      .every(x => Number.isFinite(x) && x > 0) && sampleOuterCeiling > sampleInnerCeiling;
    const scenarioMass = possible ? candidateMass : null;
    const scenarioRadius = possible ? candidateRadius : null;
    const placed = possible ? sampleInnerCeiling + (sampleOuterCeiling - sampleInnerCeiling) *
      (ordinal - system.relevantMoonCount - 0.4 + 0.3 * sample(6)) /
      (system.unmaterializedMinorMoonCount + 0.2) : null;
    const orbitalRadiusKm = placed === null ? null : placed * system.hostPlanet.radiusEarth * 6371;
    const periodDays = orbitalRadiusKm === null || scenarioMass === null ? null :
      2 * Math.PI * Math.sqrt((orbitalRadiusKm * 1000) ** 3 /
        (6.67430e-11 * (system.hostPlanet.massEarth + scenarioMass) * 5.9722e24)) / 86400;
    const result: MinorMoonCharacterizationPRE3310 = Object.freeze({
      contract: 'PRE-33.10/V3-DEFERRED-MINOR-MOON/v1',
      identitySeed: seed,
      moonOrdinal: ordinal,
      epochYears,
      status: possible ? 'CONDITIONAL_BOUNDS' : 'OUTSIDE_ORBITAL_DOMAIN',
      scenarioMassEarth: scenarioMass,
      scenarioRadiusEarth: scenarioRadius,
      scenarioDensityGramsPerCm3: density,
      scenarioSemiMajorAxisPlanetRadii: placed,
      scenarioOrbitalPeriodDays: periodDays,
      physicalScenarioBasis: 'CONDITIONAL_SATELLITE_ACCRETION_PRIOR',
      // The previous v1 aliases remain for consumers of the original contract.
      // In v1a their semantics are documented as *scenario* rather than
      // absolute physical mass / dynamically certified stable orbit bounds.
      massUpperBoundEarth: possible ? massPriorCeiling : null,
      stableOrbitInnerPlanetRadii: possible ? sampleInnerCeiling : null,
      stableOrbitOuterPlanetRadii: possible ? sampleOuterCeiling : null,
      massPriorCeilingEarth: possible ? massPriorCeiling : null,
      rocheFluidReferenceInnerPlanetRadii: possible ? rocheFluidReference : null,
      hillProgradeReferenceOuterPlanetRadii: possible ? progradeHillReference : null,
      samplingInnerPlanetRadii: possible ? sampleInnerCeiling : null,
      samplingOuterPlanetRadii: possible ? sampleOuterCeiling : null,
      samplingCeilingIsNumerical: possible ? progradeHillReference > 1000 : null,
      bulkComposition: 'UNKNOWN', atmosphere: 'UNKNOWN', water: 'UNKNOWN',
      radiation: 'UNKNOWN', geoChemicalPower: 'UNKNOWN',
      historicalContinuity: 'UNKNOWN', life: 'NOT_EVALUATED',
      physicalModelResolved: false,
      provenance: 'CANONICAL_MOON_IDENTITY_AND_HOST_BOUNDS',
    });
    this.cache.set(key, result);
    if (this.cache.size > this.maximumEntries) this.cache.delete(this.cache.keys().next().value!);
    return result;
  }
}
