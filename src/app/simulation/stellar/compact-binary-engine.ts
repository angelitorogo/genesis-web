import { CompactBinaryMember, CompactBinarySystem } from '../../domain/stellar/compact-binary-system';
import { Star } from '../../domain/stellar/star';
import { StellarLifetimeProfile } from '../../domain/stellar/stellar-lifetime-profile';
import { StellarPhysicalProperties } from '../../domain/stellar/stellar-physical-properties';
import { StellarSystem } from '../../domain/stellar/stellar-system';
import { type GeneratedMultipleHost } from './stellar-multihost-formation';
import { StellarBlackHoleEngine } from './stellar-black-hole-engine';
import { StellarNeutronStarEngine } from './stellar-neutron-star-engine';

/** 27.8: non-authoritative mass model only when the legacy B has no Star entity. */
function legacyCompanionMass(physical: StellarPhysicalProperties, lifetime: StellarLifetimeProfile): number {
  const assessment = lifetime.evolutionAssessment;
  const initialMass = physical.initialMassSolar;
  const metallicity = Math.max(0.01, Math.min(3, assessment.input.metallicitySolarRatio));
  switch (assessment.evolutionState.name) {
    case 'NEUTRON_STAR':
      return assessment.neutronStarFormationChannel?.name === 'ELECTRON_CAPTURE_COLLAPSE'
        ? Math.max(1.2, Math.min(1.37, 1.25 + 0.022 * (initialMass - 8)))
        : Math.max(1.32, Math.min(2.1, 1.36 + 0.034 * (initialMass - 9) + 0.025 * (1 - metallicity / 3)));
    case 'STELLAR_BLACK_HOLE': {
      if (assessment.blackHoleFormationChannel === null) throw new RangeError('Missing BH formation channel.');
      const wind = Math.max(0.84, Math.min(1, 1 - 0.20 * Math.log10(1 + metallicity)));
      const retention = assessment.blackHoleFormationChannel.name === 'DIRECT_COLLAPSE' ? 0.62 : 0.29;
      return Math.max(3.05, Math.min(initialMass * 0.95, initialMass * wind * retention));
    }
    case 'WHITE_DWARF':
      return Math.max(0.46, Math.min(1.35, 0.109 * initialMass + 0.394));
    default:
      throw new RangeError('A non-compact component cannot be assigned compact remnant mass.');
  }
}

function member(
  label: 'A' | 'B', seedHex: string, physical: StellarPhysicalProperties,
  lifetime: StellarLifetimeProfile, star: Star | null,
): CompactBinaryMember | null {
  if (!(physical instanceof StellarPhysicalProperties) || !(lifetime instanceof StellarLifetimeProfile)) {
    throw new TypeError('27.8 requires existing, canonical component physics and age.');
  }
  const assessment = lifetime.evolutionAssessment;
  const kind = assessment.evolutionState.name;
  if (star !== null && (star.evolutionState.name !== kind ||
      star.locator === undefined || star.generationKey === undefined)) {
    throw new RangeError('Component Star and its existing lifetime disagree.');
  }
  if (!['WHITE_DWARF', 'NEUTRON_STAR', 'STELLAR_BLACK_HOLE'].includes(kind)) return null;
  if (lifetime.terminalAgeBillionYears === null || lifetime.remainingLifeBillionYears !== 0 ||
      lifetime.terminalAgeBillionYears > lifetime.ageBillionYears + 1e-9 ||
      Math.abs(physical.initialMassSolar - assessment.input.initialMassSolar) >
        1e-12 * Math.max(1, physical.initialMassSolar)) {
    throw new RangeError('Compact pair cannot contain a progenitor or incompatible evolution source.');
  }
  let massSolar: number;
  let referenceRadiusKm: number;
  if (kind === 'NEUTRON_STAR' && star !== null) {
    const neutron = StellarNeutronStarEngine.fromExistingStar(star, physical, lifetime);
    if (neutron === null) throw new RangeError('Expected an existing neutron-star remnant.');
    massSolar = neutron.massSolar;
    referenceRadiusKm = neutron.radiusKm;
  } else if (kind === 'STELLAR_BLACK_HOLE' && star !== null) {
    const blackHole = StellarBlackHoleEngine.fromExistingStar(star, physical, lifetime);
    if (blackHole === null) throw new RangeError('Expected an existing black-hole remnant.');
    massSolar = blackHole.massSolar;
    referenceRadiusKm = blackHole.schwarzschildRadiusKm;
  } else {
    massSolar = legacyCompanionMass(physical, lifetime);
    // Approximate WD radius; BH and NS agree with their 27.1/27.4 formulas.
    referenceRadiusKm = kind === 'WHITE_DWARF' ? 7_000 * (0.6 / massSolar) ** (1 / 3) :
      kind === 'NEUTRON_STAR' ? Math.max(10.5, Math.min(13.2, 12.65 - 1.25 * (massSolar - 1.4))) :
      2 * 6.67430e-11 * 1.98847e30 * massSolar / (299_792_458 ** 2) / 1_000;
  }
  return Object.freeze({
    label, componentSeedHex: seedHex, remnantKind: kind as CompactBinaryMember['remnantKind'],
    massSolar, referenceRadiusKm,
    formationAgeBillionYears: lifetime.terminalAgeBillionYears,
    currentAgeBillionYears: lifetime.ageBillionYears,
  });
}

/**
 * Read-only derivative of existing MULTIPLE architecture: A-B only. For TRIPLE,
 * C follows the AB barycentre, and cannot be mistaken for an A-C binary.
 * V2 uses original private A/B hosts; never regenerate them from public locator.
 */
export class CompactBinaryEngine {
  private constructor() {}

  static fromExistingSystem(
    system: StellarSystem, primaryPhysical: StellarPhysicalProperties,
    primaryLifetime: StellarLifetimeProfile,
  ): CompactBinarySystem | null {
    if (!(system instanceof StellarSystem)) throw new TypeError('27.8 requires an existing stellar system.');
    const secondary = system.secondaryCompanion;
    const orbit = system.orbitHierarchy.innerOrbit;
    if (secondary === null || orbit === null) return null;
    const a = member('A', system.seed.normalizedValue, primaryPhysical, primaryLifetime, system.primaryStar);
    const b = member('B', secondary.componentSeedHex, secondary.physicalProperties, secondary.lifetimeProfile, null);
    return a === null || b === null ? null : new CompactBinarySystem(system.seed.normalizedValue, a, b, orbit);
  }

  static fromExistingMultihost(source: GeneratedMultipleHost): CompactBinarySystem | null {
    const [hostA, hostB] = source.components;
    if (!hostA || !hostB || hostA.label !== 'A' || hostB.label !== 'B' ||
        source.multiplicity.stellarComponentCount !== source.components.length ||
        source.parentSystemSeedHex !== hostA.stellarSystem.seed.normalizedValue) {
      throw new RangeError('27.8 requires a canonical, ordered existing multihost A/B pair.');
    }
    const a = member('A', hostA.stellarSystem.seed.normalizedValue,
      hostA.physical, hostA.lifetime, hostA.stellarSystem.primaryStar);
    const b = member('B', hostB.stellarSystem.seed.normalizedValue,
      hostB.physical, hostB.lifetime, hostB.stellarSystem.primaryStar);
    return a === null || b === null ? null :
      new CompactBinarySystem(source.parentSystemSeedHex, a, b, source.innerOrbit);
  }
}
