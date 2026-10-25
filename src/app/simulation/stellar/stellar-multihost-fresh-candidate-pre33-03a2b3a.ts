import { GeneratorVersion } from '../../domain/generation/generator-version';
import type { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import type { SystemLocator } from '../../domain/generation/procedural-locator';
import {
  MULTIHOST_FRESH_COEVAL_CANDIDATE_PRE3303A2B3A as CONTRACT,
  type FreshMultihostDependencyStatusPRE3303A2B3A as Dependency,
  type FreshMultihostManifestPRE3303A2B3A as Manifest,
} from '../../domain/stellar/stellar-multihost-fresh-candidate-pre33-03a2b3a';
import { StellarMultihostFormation } from './stellar-multihost-formation';
import { StellarMultihostFreshFormationPRE3303A2B3A } from './stellar-multihost-fresh-formation-pre33-03a2b3a';
import type { GeneratedMultipleHost } from './stellar-multihost-formation';
import { frozenMultihostDigestPRE3303A2B3 } from './stellar-multihost-activation-pre33-03a2b3';

const error = (message: string): never => { throw new RangeError(`PRE33A2B3A_${message}`); };

/** Only a STAGED, nonpersistable fresh physical graph. The new public
 * GeneratorVersion, regenerated 29/31/32 histories, and game cutover are not
 * silently simulated here. A fresh game must never bootstrap with V2 data
 * combined with these revised stars. */
export class StellarMultihostFreshCandidatePRE3303A2B3A {
  private constructor() {}

  static materializeOrNull(key: UniverseGenerationKey, locator: SystemLocator,
    requestedRevision: typeof CONTRACT): {readonly manifest: Manifest;
      readonly experimentalGraph: GeneratedMultipleHost} | null {
    if (key.generatorVersion !== GeneratorVersion.V2 || requestedRevision !== CONTRACT) {
      return error('EXPLICIT_LEGACY_SOURCE_AND_REVISION_REQUIRED');
    }
    const frozen = StellarMultihostFormation.generateOrNull(key, locator);
    if (frozen === null) return null;
    const oldDigest = frozenMultihostDigestPRE3303A2B3(frozen);
    const candidate = StellarMultihostFreshFormationPRE3303A2B3A.generateFreshCoevalCandidateOrNull(key, locator, CONTRACT);
    if (!candidate) return error('FRESH_GRAPH_NOT_GENERATED');
    const newDigest = frozenMultihostDigestPRE3303A2B3(candidate);
    const stars = candidate.components;
    if (stars.length !== frozen.components.length || stars.map(c => c.label).join('') !==
      frozen.components.map(c => c.label).join('') ||
      candidate.parentSystemSeedHex !== frozen.parentSystemSeedHex ||
      candidate.multiplicity !== frozen.multiplicity) return error('COMPONENT_IDENTITY_CHANGED');
    const age = stars[0]!.lifetime.ageBillionYears;
    if (!Number.isFinite(age) || age < 0 || age > 13.8) return error('INVALID_SHARED_AGE');
    for (let i = 0; i < stars.length; i++) {
      const current = stars[i]!;
      const previous = frozen.components[i]!;
      if (Math.abs(current.lifetime.ageBillionYears - age) > 1e-9 ||
          Math.abs(current.lifetime.evolutionAssessment.input.ageBillionYears - age) > 1e-9 ||
          current.physical.initialMassSolar !== previous.physical.initialMassSolar ||
          current.internalGenerationKey.universeSeed.normalizedValue !==
          previous.internalGenerationKey.universeSeed.normalizedValue ||
          current.stellarSystem.primaryStar.evolutionState.name !==
          current.lifetime.evolutionAssessment.evolutionState.name ||
          current.stellarSystem === previous.stellarSystem ||
          (current.planetarySystem === previous.planetarySystem && current.planets.length > 0)) {
        return error('MIXED_SOURCE_OR_NONCOEVAL_COMPONENT');
      }
    }
    if (candidate.innerOrbit === frozen.innerOrbit ||
        (candidate.outerOrbit !== null && candidate.outerOrbit === frozen.outerOrbit) ||
        candidate.publicPlanets === frozen.publicPlanets) {
      return error('REUSED_LEGACY_AGGREGATE_OBJECT');
    }
    if (frozenMultihostDigestPRE3303A2B3(frozen) !== oldDigest) return error('MUTATED_LEGACY_GRAPH');
    let checkedMass = 0;
    let checkedMoonCount = 0;
    const oldObjects = new Set(frozen.publicPlanets.map(e => e.planet));
    for (const entry of candidate.publicPlanets) {
      if (oldObjects.has(entry.planet) || entry.atmosphere.hostPlanet !== entry.planet ||
          entry.moonSystem.hostPlanet !== entry.planet ||
          entry.planet.generationKey.generatorVersion !== GeneratorVersion.V1) {
        return error('STALE_PLANET_ATMOSPHERE_MOON_OR_WRONG_PRIVATE_VERSION');
      }
      const comp = entry.planet.internalComposition;
      const mass = comp.metallicCoreMassEarth + comp.silicateInteriorMassEarth +
        comp.condensedIceMassEarth + comp.volatileRichInteriorMassEarth + comp.gaseousEnvelopeMassEarth;
      const expected = entry.planet.physicalProperties.massEarth;
      if (!Number.isFinite(mass) || !Number.isFinite(expected) || expected <= 0 ||
          Math.abs(mass - expected) > Math.max(1e-9, expected * 1e-7)) {
        return error('FRESH_MATERIAL_BUDGET_NOT_CONSERVED');
      }
      checkedMass++;
      if (entry.moonSystem.moonIdentities.length !== entry.moonSystem.populationProfile.moonCount) {
        return error('FRESH_MOON_POPULATION_INCONSISTENT');
      }
      checkedMoonCount++;
    }
    const phasesChanged = stars.filter((c, i) =>
      c.lifetime.evolutionAssessment.evolutionState.name !==
        frozen.components[i]!.lifetime.evolutionAssessment.evolutionState.name).map(c => c.label);
    const depend: Dependency[] = [
      {dependency: 'STELLAR_EVOLUTION_14_15', status: 'REGENERATED_IN_FRESH_CANDIDATE',
        detail: 'B/C reevaluated from primary age and actual Star and lifetime regenerated before 18.x.'},
      {dependency: 'STELLAR_EVOLVED_CURRENT_PROPERTIES_15', status: 'NOT_REGENERATED_RELEASE_BLOCKER',
        detail: 'Frozen 15.1 progenitor reference luminosity/mass is not a revised current evolved-star spectrum.'},
      {dependency: 'ORBITAL_ARCHITECTURE_16', status: 'REGENERATED_IN_FRESH_CANDIDATE',
        detail: 'New Keplerian aggregate and S/P stability; historical mass-loss orbit still unresolved.'},
      {dependency: 'ORBITAL_HISTORY_MASS_LOSS_16', status: 'NOT_REGENERATED_RELEASE_BLOCKER',
        detail: 'Initial-mass Kepler references do not provide time-resolved mass-loss/recoil orbital evolution.'},
      {dependency: 'PLANETS_18_19', status: 'REGENERATED_IN_FRESH_CANDIDATE',
        detail: 'Fresh stage 18/19 generation with revised Star, not reusing old Planet objects.'},
      {dependency: 'ATMOSPHERES_20', status: 'REGENERATED_IN_FRESH_CANDIDATE',
        detail: 'New stage 20 objects with planet identity and mass checks.'},
      {dependency: 'MOONS_21', status: 'REGENERATED_IN_FRESH_CANDIDATE',
        detail: 'New stage 21 satellite populations and moon identity checks.'},
      {dependency: 'REMNANT_TRANSIENT_HISTORY_29_31', status: 'NOT_REGENERATED_RELEASE_BLOCKER',
        detail: '29/31 remnant progenitor events and compact irradiation require a historical rebuilt source.'},
      {dependency: 'INTERVAL_RECONSTRUCTION_32_7_32_12', status: 'NOT_REGENERATED_RELEASE_BLOCKER',
        detail: '32.7/32.12 episodes must be rebuilt from revised source before game publication.'},
      {dependency: 'PUBLIC_VERSION_AND_PERSISTENCE', status: 'NOT_REGENERATED_RELEASE_BLOCKER',
        detail: 'Candidate is NOT public V3 and shares legacy public indices: cannot persist or open as a new game.'},
    ];
    const parentSystemKey = `G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}`;
    const manifest: Manifest = Object.freeze({
      contractVersion: CONTRACT, sourceGeneratorVersion: 'V2' as const,
      candidateNamespace: `${CONTRACT}/${key.universeSeed.normalizedValue}/${parentSystemKey}`,
      parentSystemKey, primaryFormationAgeBillionYears: age,
      revisedAgesBillionYears: Object.freeze(stars.map(c => c.lifetime.ageBillionYears)),
      originalAgesBillionYears: Object.freeze(frozen.components.map(c => c.lifetime.ageBillionYears)),
      stellarPhasesChanged: Object.freeze(phasesChanged),
      oldSnapshotDigest: oldDigest, candidateSnapshotDigest: newDigest,
      originalPlanetCount: frozen.publicPlanets.length,
      regeneratedPlanetCount: candidate.publicPlanets.length,
      regeneratedAtmospheres: candidate.publicPlanets.length,
      regeneratedMoonSystems: candidate.publicPlanets.length,
      regeneratedOrbitHierarchy: true,
      planetaryMaterialMassValidated: checkedMass,
      moonPopulationValidated: checkedMoonCount,
      privateObjectReferenceReuse: false as const,
      dependencies: Object.freeze(depend.map(d => Object.freeze(d))),
      newlyGeneratedGameIsPublic: false as const, persistable: false as const,
      savedUniverseMutated: false as const, ct0WaterCertified: false as const,
      readiness: 'FRESH_PHYSICS_STAGED_CANONICAL_RELEASE_BLOCKED' as const,
    });
    return Object.freeze({manifest, experimentalGraph: candidate});
  }

  /** Must be impossible to turn a V2-scoped experimental graph into a saved new game. */
  static publishToNewGame(): never {
    return error('PUBLIC_VERSION_AND_FULL_29_31_32_REGENERATION_NOT_RELEASED');
  }
}
