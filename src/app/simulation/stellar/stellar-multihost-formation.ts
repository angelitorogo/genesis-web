import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

import { BodyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { type SystemSeed } from '../../domain/seed/hierarchical-seeds';
import { multihostPhysicalSourceKey } from './stellar-multihost-physical-source-key';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import { StellarSystem } from '../../domain/stellar/stellar-system';
import { Star } from '../../domain/stellar/star';
import { StellarCompanion } from '../../domain/stellar/stellar-companion';
import { StellarComponentDesignation } from '../../domain/stellar/stellar-component-designation';
import { StellarRelativeOrbit } from '../../domain/stellar/stellar-relative-orbit';
import { StellarOrbitHierarchy } from '../../domain/stellar/stellar-orbit-hierarchy';
import { PlanetarySystemFormationBlueprint } from '../../domain/planetary/planetary-system-formation-blueprint';
import { type Planet } from '../../domain/planetary/planet';
import { type PulsarSecondGenerationPopulation } from '../../domain/planetary/pulsar-second-generation-planet';
import { PulsarSecondGenerationGenerator } from '../planetary/pulsar-second-generation-generator';
import { StellarNeutronStarEngine } from './stellar-neutron-star-engine';
import { StellarPulsarEngine } from './stellar-pulsar-engine';
import { type CircumbinaryHabitabilityAssessment } from '../../domain/habitability/circumbinary-habitability-assessment';
import { type CircumbinaryPlanetCompatibility } from '../../domain/planetary/circumbinary-planet-compatibility';

import { ProceduralTargetResolver } from '../regeneration/procedural-target-resolver';
import { StellarSystemMultiplicitySelector } from './stellar-system-multiplicity-selector';
import { StellarSystemGenerator } from './stellar-system-generator';
import { StellarGenerator } from './stellar-generator';
import { StellarDesignationGenerator } from './stellar-designation-generator';
import { StellarPopulationProfileGenerator } from './stellar-population-profile-generator';
import { multipleBinarySemiMajorAxisAu, multipleTripleOuterSemiMajorAxisAu, circumstellarCriticalFraction } from './stellar-multiple-orbital-spacing';
import { GalaxyGenerator } from '../universe/galaxy-generator';
import { GalaxySectorGridGenerator } from '../sector/galaxy-sector-grid-generator';
import { GalaxySectorStellarDensityGenerator } from '../sector/galaxy-sector-stellar-density-generator';
import { GalaxySectorStellarPopulationPropertiesGenerator } from '../sector/galaxy-sector-stellar-population-properties-generator';
import { GalaxySectorKeyCodec } from '../../domain/sector/galaxy-sector-key-codec';
import { ProtoplanetaryFormationSnapshotGenerator } from '../planetary/protoplanetary-formation-snapshot-generator';
import { PlanetaryFormationMaturationGenerator } from '../planetary/planetary-formation-maturation-generator';
import { PlanetarySystemGenerator } from '../planetary/planetary-system-generator';
import { PlanetGenerator } from '../planetary/planet-generator';
import { AtmosphereGenerator } from '../planetary/atmosphere-generator';
import { MoonGenerator } from '../planetary/moon-generator';
import { AsteroidBeltGenerator } from '../planetary/asteroid-belt-generator';
import { CircumbinaryPlanetCompatibilityGenerator, CIRCUMBINARY_V1_OUTER_STABILITY_BUFFER } from '../planetary/circumbinary-planet-compatibility-generator';
import { CircumbinaryHabitabilityAssessmentGenerator } from '../habitability/circumbinary-habitability-assessment-generator';

/**
 * Production-layer physical assembly boundary for a FRESH multiple system.
 * The child keys are private, domain-separated generation scopes, NOT universe
 * records, selectable universes or public scientific routes. A keeps the exact
 * historical primary seed. B/C/P use independent, parent-derived scopes; this
 * preserves the existing V1 generators without borrowing planets from other
 * real galactic objects. The public parent-body identity mapping remains a
 * separate required step before activating this aggregate in game routes.
 * V2 uses these SAME frozen V1 private physical sources, while the returned
 * aggregate retains its V2 parent identity. This is NOT a V2 universe release.
 */
export type MultihostLabel = 'A' | 'B' | 'C';
export interface GeneratedSingleHost {
  readonly label: MultihostLabel;
  readonly internalGenerationKey: UniverseGenerationKey;
  readonly stellarSystem: ReturnType<typeof StellarSystemGenerator.generateSingle>;
  readonly physical: ReturnType<typeof StellarGenerator.generatePhysicalProperties>;
  readonly spectral: ReturnType<typeof StellarGenerator.generateSpectralAppearance>;
  readonly lifetime: ReturnType<typeof StellarGenerator.generateLifetimeProfile>;
  readonly planetarySystem: ReturnType<typeof PlanetarySystemGenerator.generate> | null;
  readonly planets: readonly Planet[];
  /** V2 SINGLE extension with distinct second-generation identity; never a phase-18 ordinal. */
  readonly pulsarPlanetPopulation?: PulsarSecondGenerationPopulation | null;
  readonly atmospheres: ReturnType<typeof AtmosphereGenerator.generateAll>;
  readonly moonSystems: ReturnType<typeof MoonGenerator.generateAll>;
  readonly asteroidBelts: ReturnType<typeof AsteroidBeltGenerator.generate> | null;
  readonly protectedExtentAu: number;
}
export interface GeneratedCircumbinaryPopulation {
  /** Already computed stage-16 science; never recompute from renderer state. */
  readonly compatibility: CircumbinaryPlanetCompatibility | null;
  readonly habitability: CircumbinaryHabitabilityAssessment | null;
  readonly planets: readonly Planet[];
  readonly atmospheres: ReturnType<typeof AtmosphereGenerator.generateAll>;
  readonly moonSystems: ReturnType<typeof MoonGenerator.generateAll>;
  readonly candidateCount: number;
  readonly stableInnerAu: number | null;
  readonly stableOuterAu: number | null;
  readonly status: 'NO_DISK' | 'NO_STABLE_REGION' | 'EMPTY' | 'GENERATED';
}
/** Public parent address is distinct from the internal B/C/P generation scope. */
export interface GeneratedPublicPlanet {
  readonly publicLocator: BodyLocator;
  readonly host: MultihostLabel | 'AB';
  readonly sourcePlanetOrdinal: number;
  readonly planet: Planet;
  readonly atmosphere: ReturnType<typeof AtmosphereGenerator.generateAll>[number];
  readonly moonSystem: ReturnType<typeof MoonGenerator.generateAll>[number];
}
export interface GeneratedMultipleHost {
  readonly parentGenerationKey: UniverseGenerationKey;
  readonly parentLocator: SystemLocator;
  readonly parentSystemSeedHex: string;
  readonly multiplicity: typeof StellarSystemMultiplicity.BINARY | typeof StellarSystemMultiplicity.TRIPLE;
  readonly components: readonly GeneratedSingleHost[];
  readonly innerOrbit: StellarRelativeOrbit;
  readonly outerOrbit: StellarRelativeOrbit | null;
  readonly circumbinary: GeneratedCircumbinaryPopulation;
  readonly publicPlanets: readonly GeneratedPublicPlanet[];
}

const CHILD_DOMAIN = utf8ToBytes('GENESIS-MULTIHOST-CHILD-SCOPE-EXPERIMENTAL-V1');
// V2 only: a private B/C/P seed is a synthetic universe and can describe a
// narrower galaxy than the real parent. Keep its old seed when the addressed
// sector fits; otherwise choose another deterministic private scope.
const MAX_V2_CHILD_SCOPE_ATTEMPTS = 256;
const INNER_ECCENTRICITY = 0.12;
const OUTER_ECCENTRICITY = 0.18;
const SURVIVAL_OUTER_AXES = 4;
const FACTORS = Object.freeze([1.12, 1.18, 1.43, 1.57, 1.92, 2.14, 2.72, 3.05]);
const NO_P = (status: GeneratedCircumbinaryPopulation['status'], inner: number | null = null,
  outer: number | null = null): GeneratedCircumbinaryPopulation => Object.freeze({
    planets: Object.freeze([]), atmospheres: Object.freeze([]), moonSystems: Object.freeze([]),
    candidateCount: 0, stableInnerAu: inner, stableOuterAu: outer, status,
    compatibility: null, habitability: null,
  });

/**
 * Optional, separate 27.9 V2 physical extension of an ALREADY GENERATED SINGLE.
 * This does not mutate old planets, consume their PRNG stream or assign a
 * legacy BodyLocator. It only runs in the public V2 SINGLE generation path.
 */
export function withSecondGenerationPulsarPlanets(host: GeneratedSingleHost): GeneratedSingleHost {
  // The old phase-18 planets have no proven post-collapse orbits. Mixing them
  // with a fallback population would invent stable, non-intersecting histories.
  if (host.planets.length !== 0) return host;
  const neutron = StellarNeutronStarEngine.fromExistingStar(
    host.stellarSystem.primaryStar, host.physical, host.lifetime,
  );
  const pulsar = neutron === null ? null : StellarPulsarEngine.fromExistingNeutronStar(neutron);
  const population = PulsarSecondGenerationGenerator.generate(
    pulsar, host.stellarSystem.seed.normalizedValue,
  );
  return population === null ? host : Object.freeze({ ...host, pulsarPlanetPopulation: population });
}

/** Produces no writes and never changes the persisted V1 seed resolver. */
export class StellarMultihostFormation {
  private constructor() {}

  /**
   * Read-only SINGLE counterpart through the EXACT same frozen-A pipeline that
   * multiple systems use. V1 returns the frozen physical source unchanged; V2
   * keeps the already-established additive post-collapse pulsar extension.
   * This does not create a public body index or persistence cutover.
   */
  static generateSingleOrNull(key: UniverseGenerationKey, locator: SystemLocator): GeneratedSingleHost | null {
    const physicalKey = multihostPhysicalSourceKey(key);
    const parentSeed = ProceduralTargetResolver.resolveTargetSeed(physicalKey, locator) as SystemSeed;
    if (StellarSystemMultiplicitySelector.select(physicalKey, parentSeed) !== StellarSystemMultiplicity.SINGLE) {
      return null;
    }
    const host = generateSingleHost('A', physicalKey, locator);
    return key.generatorVersion === GeneratorVersion.V2
      ? withSecondGenerationPulsarPlanets(host)
      : host;
  }

  static generateV2SingleOrNull(key: UniverseGenerationKey, locator: SystemLocator): GeneratedSingleHost | null {
    if (key.generatorVersion !== GeneratorVersion.V2) {
      throw new RangeError('V2 single-source generation requires a canonical V2 generation key.');
    }
    return this.generateSingleOrNull(key, locator);
  }

  static generateOrNull(key: UniverseGenerationKey, locator: SystemLocator): GeneratedMultipleHost | null {
    // Only the private physical lineage is V1-compatible. The returned
    // aggregate retains the original V1/V2 parent key for public identity.
    const physicalKey = multihostPhysicalSourceKey(key);
    const parentSeed = ProceduralTargetResolver.resolveTargetSeed(physicalKey, locator);
    const multiplicity = StellarSystemMultiplicitySelector.select(physicalKey, parentSeed as SystemSeed);
    if (multiplicity === StellarSystemMultiplicity.SINGLE) return null;

    const requireV2Coverage = key.generatorVersion === GeneratorVersion.V2;
    const components = Object.freeze((multiplicity === StellarSystemMultiplicity.BINARY
      ? (['A', 'B'] as const) : (['A', 'B', 'C'] as const))
      .map(label => generateSingleHost(label, label === 'A' ? physicalKey :
        childKey(physicalKey, parentSeed.normalizedValue, label, locator, requireV2Coverage), locator)));
    const [a, b] = components;
    if (a === undefined || b === undefined) throw new Error('Missing A/B sources.');
    const profileIndex = Number.parseInt(parentSeed.normalizedValue.slice(0, 2), 16) % FACTORS.length;
    const factor = FACTORS[profileIndex]!;
    const massA = a.physical.initialMassSolar;
    const massB = b.physical.initialMassSolar;
    const innerAxis = multipleBinarySemiMajorAxisAu(a.protectedExtentAu, b.protectedExtentAu,
      massA, massB, INNER_ECCENTRICITY, factor);
    const innerOrbit = new StellarRelativeOrbit(innerAxis, INNER_ECCENTRICITY,
      Math.sqrt(innerAxis ** 3 / (massA + massB)));
    const c = components[2];
    const outerOrbit = c === undefined ? null : (() => {
      const massC = c.physical.initialMassSolar;
      const outerAxis = Math.max(
        multipleTripleOuterSemiMajorAxisAu(innerAxis, INNER_ECCENTRICITY,
          a.protectedExtentAu, b.protectedExtentAu, c.protectedExtentAu,
          massA, massB, massC, OUTER_ECCENTRICITY, factor),
        5.05 * innerOrbit.apoastronAu / (1 - OUTER_ECCENTRICITY),
      );
      return new StellarRelativeOrbit(outerAxis, OUTER_ECCENTRICITY,
        Math.sqrt(outerAxis ** 3 / (massA + massB + massC)));
    })();
    const circumbinary = generateP(physicalKey, locator, parentSeed.normalizedValue, a, b, c,
      innerOrbit, outerOrbit, requireV2Coverage);
    const publicPlanets = buildPublicPlanetCatalog(locator, components, circumbinary);
    return Object.freeze({
      parentGenerationKey: key, parentLocator: locator,
      parentSystemSeedHex: parentSeed.normalizedValue,
      multiplicity, components, innerOrbit, outerOrbit, circumbinary, publicPlanets,
    });
  }
}

function childKey(parent: UniverseGenerationKey, parentSystemSeedHex: string, label: 'B' | 'C' | 'P',
  locator: SystemLocator, requireV2Coverage: boolean): UniverseGenerationKey {
  // A retains its exact frozen physical seed. B/C/P remain isolated from the
  // public universe, but their independent synthetic galaxies do not always
  // cover a sector that is valid in the parent's larger grid. This happens at
  // the outer reaches of the galaxy and used to break confirmed V2 fiches.
  // Attempt zero is BIT-FOR-BIT the old private key. Never perturb working
  // systems, and never apply the change to legacy V1 gameplay.
  const coordinates = requireV2Coverage ? GalaxySectorKeyCodec.decode(locator.sectorKey) : null;
  for (let attempt = 0; attempt < (requireV2Coverage ? MAX_V2_CHILD_SCOPE_ATTEMPTS : 1); attempt += 1) {
    const hash = sha256.create().update(CHILD_DOMAIN)
      .update(hexToBytes(parent.universeSeed.normalizedValue))
      .update(hexToBytes(parentSystemSeedHex)).update(utf8ToBytes(label));
    if (attempt > 0) hash.update(utf8ToBytes(`:SECTOR-COVERAGE-V2:${attempt}`));
    const raw = bytesToHex(hash.digest().slice(0, 16)).toUpperCase();
    const candidate = new UniverseGenerationKey(
      UniverseSeed.parse(raw.match(/.{4}/g)!.join('-')), parent.generatorVersion,
    );
    if (coordinates === null || GalaxySectorGridGenerator.generate(
      GalaxyGenerator.generate(candidate, locator.galaxyIndex),
    ).contains(coordinates)) return candidate;
  }
  throw new RangeError('No deterministic V2 private stellar source covers the valid parent sector.');
}

function generateSingleHost(label: MultihostLabel, key: UniverseGenerationKey, locator: SystemLocator): GeneratedSingleHost {
  const galaxy = GalaxyGenerator.generate(key, locator.galaxyIndex);
  const grid = GalaxySectorGridGenerator.generate(galaxy);
  const density = GalaxySectorStellarDensityGenerator.generate(galaxy, grid,
    GalaxySectorKeyCodec.decode(locator.sectorKey));
  const population = GalaxySectorStellarPopulationPropertiesGenerator.generate(galaxy, density);
  const profile = StellarPopulationProfileGenerator.generate(key, galaxy.physicalProperties, population);
  const stellarSystem = StellarSystemGenerator.generateSingle(key, locator, population, profile);
  const physical = StellarGenerator.generatePhysicalProperties(key, locator, population, profile);
  const spectral = StellarGenerator.generateSpectralAppearance(key, physical, population);
  const lifetime = StellarGenerator.generateLifetimeProfile(key, locator, physical, population, profile);
  const reference = ProtoplanetaryFormationSnapshotGenerator.generateMaturationReferenceOrNull(key, locator);
  const blueprint = reference === null ? null : PlanetaryFormationMaturationGenerator.generate(key,
    reference.systemSeed, reference.diskProfile, reference.diskStructure, reference.planetFormationProfile,
    reference.candidatePopulation, reference.earlyDynamics);
  const planetarySystem = blueprint === null ? null : PlanetarySystemGenerator.generate(key, stellarSystem, blueprint);
  const planets = Object.freeze(planetarySystem === null ? [] : PlanetGenerator.generateAll(key, planetarySystem));
  const atmospheres = Object.freeze(planetarySystem === null ? [] : AtmosphereGenerator.generateAll(key, planetarySystem, planets));
  const moonSystems = Object.freeze(planetarySystem === null ? [] : MoonGenerator.generateAll(key, planetarySystem, planets));
  const asteroidBelts = planetarySystem === null ? null : AsteroidBeltGenerator.generate(key, planetarySystem);
  const beltEdges = asteroidBelts?.populationProfiles.filter(belt => belt.exists)
    .map(belt => belt.outerEdgeAu ?? 0) ?? [];
  const occupied = planets.length > 0 || beltEdges.length > 0;
  const protectedExtentAu = Math.max(0.2,
    occupied ? planetarySystem?.habitableZone.radiativeOuterEdgeAu ?? 0 : 0,
    ...planets.map(planet => planet.orbit.apoastronAu), ...beltEdges);
  return Object.freeze({ label, internalGenerationKey: key, stellarSystem,
    physical, spectral, lifetime, planetarySystem, planets, atmospheres, moonSystems,
    asteroidBelts, protectedExtentAu });
}

function companion(source: GeneratedSingleHost, primary: GeneratedSingleHost,
  label: StellarSystemComponentLabel, designation: StellarSystem['designation']): StellarCompanion {
  return new StellarCompanion(label, source.stellarSystem.seed.normalizedValue,
    new StellarComponentDesignation(designation, label), primary.physical.initialMassSolar,
    source.physical.initialMassSolar / primary.physical.initialMassSolar,
    source.physical, source.spectral, source.lifetime);
}

function pBlueprint(key: UniverseGenerationKey, locator: SystemLocator, combinedMassSolar: number) {
  const ref = ProtoplanetaryFormationSnapshotGenerator.generateMaturationReferenceOrNull(key, locator);
  if (ref === null) return null;
  const source = PlanetaryFormationMaturationGenerator.generate(key, ref.systemSeed, ref.diskProfile,
    ref.diskStructure, ref.planetFormationProfile, ref.candidatePopulation, ref.earlyDynamics);
  return new PlanetarySystemFormationBlueprint(source.sourceDiskAgeMillionYears,
    source.sourceDiskDispersalAgeMillionYears, source.formationCompletionAgeMillionYears,
    combinedMassSolar, source.sourceInnerRadiusAu, source.sourceOuterRadiusAu,
    source.sourceGasMassEarth, source.sourceDustMassEarth, source.sourceCandidateSolidMassEarth,
    source.residualDustMassEarth, source.maxGasCaptureBudgetEarth,
    source.sourceCandidateCount, source.sourceSurvivorCount, source.sourceMigratedBodyCount,
    source.sourceCollisionCount, source.regime, source.formationAnchors);
}

function generateP(parentKey: UniverseGenerationKey, locator: SystemLocator, seed: string,
  a: GeneratedSingleHost, b: GeneratedSingleHost, c: GeneratedSingleHost | undefined,
  innerOrbit: StellarRelativeOrbit, outerOrbit: StellarRelativeOrbit | null,
  requireV2Coverage: boolean): GeneratedCircumbinaryPopulation {
  const key = childKey(parentKey, seed, 'P', locator, requireV2Coverage);
  const primary = a.physical.initialMassSolar >= b.physical.initialMassSolar ? a : b;
  const secondary = primary === a ? b : a;
  const massAB = a.physical.initialMassSolar + b.physical.initialMassSolar;
  const fullTriple = c !== undefined && c.physical.initialMassSolar <= secondary.physical.initialMassSolar;
  const multiplicity = fullTriple ? StellarSystemMultiplicity.TRIPLE : StellarSystemMultiplicity.BINARY;
  const hierarchy = new StellarOrbitHierarchy(multiplicity, innerOrbit, fullTriple ? outerOrbit : null);
  const designation = StellarDesignationGenerator.generate(key, locator);
  const original = primary.stellarSystem.primaryStar;
  const pStar = new Star(key, locator, original.evolutionState, original.mainSequenceClass,
    original.brownDwarfClass, original.postMainSequenceStage, original.whiteDwarfComposition,
    original.neutronStarFormationChannel, original.blackHoleFormationChannel);
  const companionB = companion(secondary, primary, StellarSystemComponentLabel.B, designation);
  const companionC = fullTriple && c !== undefined
    ? companion(c, primary, StellarSystemComponentLabel.C, designation) : null;
  const compatibility = fullTriple
    ? CircumbinaryPlanetCompatibilityGenerator.generateTriple(key, hierarchy, primary.physical, companionB, companionC!)
    : CircumbinaryPlanetCompatibilityGenerator.generateBinary(key, hierarchy, primary.physical, companionB);
  const cLimit = c === undefined || outerOrbit === null ? null : fullTriple
    ? compatibility.maximumStableSemiMajorAxisAu
    : outerOrbit.semiMajorAxisAu * circumstellarCriticalFraction(
        c.physical.initialMassSolar / (massAB + c.physical.initialMassSolar), outerOrbit.eccentricity,
      ) * CIRCUMBINARY_V1_OUTER_STABILITY_BUFFER;
  const minimum = compatibility.minimumStableSemiMajorAxisAu;
  if (!compatibility.isCompatible || (cLimit !== null && cLimit <= minimum)) {
    return NO_P('NO_STABLE_REGION', minimum, cLimit);
  }
  const outer = Math.min(innerOrbit.semiMajorAxisAu * SURVIVAL_OUTER_AXES, cLimit ?? Infinity);
  if (outer <= minimum) return NO_P('NO_STABLE_REGION', minimum, outer);
  const blueprint = pBlueprint(key, locator, massAB);
  if (blueprint === null || blueprint.anchorCount === 0) return NO_P('NO_DISK', minimum, outer);
  const habitability = CircumbinaryHabitabilityAssessmentGenerator.generate(key, compatibility,
    primary.physical, pStar, companionB, hierarchy, companionC);
  const system = new StellarSystem(key, locator,
    ProceduralTargetResolver.resolveTargetSeed(key, locator) as StellarSystem['seed'],
    designation, multiplicity, pStar, hierarchy, companionB, companionC,
    compatibility, habitability, primary.physical.luminositySolar);
  const planetarySystem = PlanetarySystemGenerator.generate(key, system, blueprint);
  const candidates = PlanetGenerator.generateAll(key, planetarySystem);
  const survivors = Object.freeze(candidates.filter(planet => planet.orbit.semiMajorAxisAu >= minimum &&
    planet.orbit.apoastronAu <= outer));
  // The frozen phase-20/21 generators require the ENTIRE candidate population.
  // Materialize it consistently, then preserve only survivors and their own
  // atmospheres/moons. Never call generateAll with a truncated planet list.
  const allAtmospheres = AtmosphereGenerator.generateAll(key, planetarySystem, candidates);
  const allMoons = MoonGenerator.generateAll(key, planetarySystem, candidates);
  const surviving = new Set(survivors);
  const atmospheres = Object.freeze(allAtmospheres.filter(atmosphere => surviving.has(atmosphere.hostPlanet)));
  const moonSystems = Object.freeze(allMoons.filter(moons => surviving.has(moons.hostPlanet)));
  return Object.freeze({ planets: survivors, atmospheres, moonSystems, candidateCount: candidates.length,
    compatibility, habitability, stableInnerAu: minimum, stableOuterAu: outer,
    status: survivors.length ? 'GENERATED' as const : 'EMPTY' as const });
}


/** One deterministic public BodyLocator per exposed planet, in A/B/C/P order.
 * This is a lookup contract for a future atomic routing cutover. The contained
 * Planet entities still carry private scope identities; callers must not pass
 * those internal locators to the browser URL or persistence.
 */
function buildPublicPlanetCatalog(locator: SystemLocator, components: readonly GeneratedSingleHost[],
  p: GeneratedCircumbinaryPopulation): readonly GeneratedPublicPlanet[] {
  const catalog: GeneratedPublicPlanet[] = [];
  const append = (label: MultihostLabel | 'AB', planets: readonly Planet[],
    atmospheres: ReturnType<typeof AtmosphereGenerator.generateAll>,
    moonSystems: ReturnType<typeof MoonGenerator.generateAll>): void => {
    if (planets.length !== atmospheres.length || planets.length !== moonSystems.length) {
      throw new Error(`Incomplete ${label} planet/atmosphere/moon generation.`);
    }
    for (let i = 0; i < planets.length; i += 1) {
      const planet = planets[i]!;
      const atmosphere = atmospheres[i]!;
      const moonSystem = moonSystems[i]!;
      if (atmosphere.hostPlanet !== planet || moonSystem.hostPlanet !== planet) {
        throw new Error(`Planetary generation ordering mismatch for host ${label}.`);
      }
      catalog.push(Object.freeze({
        publicLocator: new BodyLocator(locator.galaxyIndex, locator.sectorKey,
          locator.galacticObjectIndex, BigInt(catalog.length)),
        host: label,
        sourcePlanetOrdinal: planet.planetOrdinal,
        planet, atmosphere, moonSystem,
      }));
    }
  };
  for (const source of components) {
    append(source.label, source.planets, source.atmospheres, source.moonSystems);
  }
  append('AB', p.planets, p.atmospheres, p.moonSystems);
  return Object.freeze(catalog);
}
