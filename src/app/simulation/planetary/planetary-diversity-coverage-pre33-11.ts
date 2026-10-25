import type { Planet } from '../../domain/planetary/planet';
import type { MoonSystem } from '../../domain/planetary/moon-system';
import { PlanetType } from '../../domain/planetary/planet-type';
import type { CompactHostPlanetarySystem } from '../../domain/planetary/compact-host-planetary-system';

/** PRE-33.11: non-generating, non-observational, read-only coverage assessment.
 * A coarse phenotype is NEVER sufficient to establish an ocean, dry climate,
 * active volcanism, a stable habitat or biology. This contract is an audit,
 * not a source of habitability or a replacement for 31/32/PRE-33 physics.
 */
export type PRE3311Family =
  'ROCKY' | 'SUPER_EARTH' | 'DESERT' | 'OCEAN' | 'ICE' | 'VOLCANIC' |
  'MINI_NEPTUNE' | 'GAS_GIANT' | 'ICE_GIANT' | 'COMPACT_ROCKY' | 'COMPACT_SUPER_EARTH';
export type PRE3311Architecture = 'SINGLE' | 'BINARY' | 'TRIPLE' | 'COMPACT_SINGLE';
export type PRE3311Niche = 'SOLID_BASE' | 'DEEP_ENVELOPE' | 'COMPACT_SNAPSHOT';
export interface PRE3311WorldCoverage {
  readonly contract: 'PRE-33.11/V3-DIVERSITY-COVERAGE/v1';
  readonly architecture: PRE3311Architecture;
  readonly host: 'A' | 'B' | 'C' | 'AB' | 'COMPACT';
  readonly topology: string;
  readonly family: PRE3311Family;
  readonly niche: PRE3311Niche;
  readonly ordinal: number;
  readonly moonCount: number;
  readonly detailedMoonCount: number;
  readonly identityOnlyMoonCount: number;
  readonly physicallyCoherent: boolean;
  /** No biology can be inferred from a phenotype or missing lunar fiche. */
  readonly biology: 'NOT_EVALUATED';
  readonly phenotypeClaim: 'CLASSIFICATION_NOT_ENVIRONMENTAL_PROOF';
  readonly issues: readonly string[];
}
const FULL_TYPES: readonly PlanetType[] = Object.freeze(Object.values(PlanetType));
const ENVELOPES: ReadonlySet<PlanetType> = new Set([
  PlanetType.MINI_NEPTUNE, PlanetType.GAS_GIANT, PlanetType.ICE_GIANT,
]);
const contract = 'PRE-33.11/V3-DIVERSITY-COVERAGE/v1' as const;
export class PlanetaryDiversityCoveragePRE3311 {
  private constructor() {}

  /** Deterministic classification for every frozen point-19.4 phenotype. */
  static familyDomain(family: PlanetType): PRE3311Niche {
    if (!FULL_TYPES.includes(family)) throw new RangeError('Unknown planet family');
    return ENVELOPES.has(family) ? 'DEEP_ENVELOPE' : 'SOLID_BASE';
  }

  static standard(planet: Planet, moons: MoonSystem,
      architecture: Exclude<PRE3311Architecture, 'COMPACT_SINGLE'>,
      host: 'A' | 'B' | 'C' | 'AB'): PRE3311WorldCoverage {
    const issues: string[] = [];
    const family = planet.planetType;
    if (!FULL_TYPES.includes(family)) issues.push('UNKNOWN_PLANET_FAMILY');
    if (moons.hostPlanet !== planet ||
        moons.hostPlanet.planetOrdinal !== planet.planetOrdinal) issues.push('MOON_HOST_MISMATCH');
    if (moons.moonCount !== moons.relevantMoonCount + moons.unmaterializedMinorMoonCount ||
        moons.moonIdentities.length !== moons.moonCount ||
        moons.relevantMoons.length !== moons.relevantMoonCount) issues.push('MOON_POPULATION_INCONSISTENT');
    if (moons.moonIdentities.some((identity, i) =>
        identity.moonOrdinal !== i + 1 ||
        identity.hostPlanetOrdinal !== planet.planetOrdinal) ||
        moons.relevantMoons.some((moon, i) =>
          moon.moonOrdinal !== i + 1 ||
          moon.identity.seed.normalizedValue !== moons.moonIdentities[i]?.seed.normalizedValue))
      issues.push('MOON_IDENTITY_INCONSISTENT');
    if (!planet.isTypePhysicallyCoherent || planet.typePhysicalCoherenceIssues.length > 0)
      issues.push('PLANET_TYPE_PHYSICAL_INCOHERENCE');
    if (!(planet.massEarth > 0 && planet.radiusEarth > 0 && planet.orbit.periastronAu > 0 &&
        planet.orbit.apoastronAu >= planet.orbit.periastronAu &&
        planet.orbit.eccentricity >= 0 && planet.orbit.eccentricity < 1))
      issues.push('PLANET_BULK_OR_ORBIT_INVALID');
    const topology = planet.orbitTopology as string;
    if ((host === 'AB' && topology !== 'CIRCUMBINARY') ||
        (host !== 'AB' && topology !== 'CIRCUMSTELLAR'))
      issues.push('PUBLIC_HOST_TOPOLOGY_MISMATCH');
    if (host === 'C' && architecture !== 'TRIPLE') issues.push('COMPONENT_C_OUTSIDE_TRIPLE');
    if (host === 'AB' && architecture === 'SINGLE') issues.push('P_TYPE_OUTSIDE_MULTIPLE');
    const niche = this.familyDomain(family);
    if (planet.hasDefinedSolidSurfaceBase === (niche === 'DEEP_ENVELOPE'))
      issues.push('SURFACE_DOMAIN_MISMATCH');
    return Object.freeze({contract, architecture, host, topology,
      family, niche, ordinal:planet.planetOrdinal, moonCount:moons.moonCount,
      detailedMoonCount:moons.relevantMoonCount,
      identityOnlyMoonCount:moons.unmaterializedMinorMoonCount,
      physicallyCoherent:issues.length === 0, biology:'NOT_EVALUATED',
      phenotypeClaim:'CLASSIFICATION_NOT_ENVIRONMENTAL_PROOF',
      issues:Object.freeze(issues)});
  }

  static compact(system: CompactHostPlanetarySystem): readonly PRE3311WorldCoverage[] {
    const outputs: PRE3311WorldCoverage[] = [];
    for (const planet of system.planets) {
      const issues: string[] = [];
      if (system.architecture !== 'SINGLE' ||
          system.status !== 'SNAPSHOT_MODEL_UNVALIDATED_N_BODY') issues.push('COMPACT_SNAPSHOT_CONTRACT');
      if (!(planet.massEarth > 0 && planet.radiusEarth > 0 &&
          planet.periastronAu > planet.rocheLimitAu &&
          planet.periastronAu <= planet.semiMajorAxisAu &&
          planet.semiMajorAxisAu <= planet.apoastronAu &&
          planet.eccentricity >= 0 && planet.eccentricity < 1))
        issues.push('COMPACT_ORBIT_ROCHE_SCREEN');
      if (planet.bulkKind !== 'ROCKY' && planet.bulkKind !== 'SUPER_EARTH')
        issues.push('UNKNOWN_COMPACT_BULK_KIND');
      outputs.push(Object.freeze({contract, architecture:'COMPACT_SINGLE', host:'COMPACT',
        topology:'INTRINSIC_COMPACT_SNAPSHOT',
        family:planet.bulkKind === 'ROCKY' ? 'COMPACT_ROCKY' : 'COMPACT_SUPER_EARTH',
        niche:'COMPACT_SNAPSHOT', ordinal:planet.ordinal,
        moonCount:0, detailedMoonCount:0, identityOnlyMoonCount:0,
        physicallyCoherent:issues.length===0, biology:'NOT_EVALUATED',
        phenotypeClaim:'CLASSIFICATION_NOT_ENVIRONMENTAL_PROOF',
        issues:Object.freeze(issues)}));
    }
    return Object.freeze(outputs);
  }
}
