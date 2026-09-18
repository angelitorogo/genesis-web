import { type Planet } from '../../../domain/planetary/planet';
import { type CircumbinaryPlanetCompatibility } from '../../../domain/planetary/circumbinary-planet-compatibility';
import { type CircumbinaryHabitabilityAssessment } from '../../../domain/habitability/circumbinary-habitability-assessment';
import { PlanetarySystemFormationBlueprint } from '../../../domain/planetary/planetary-system-formation-blueprint';
import { Star } from '../../../domain/stellar/star';
import { StellarCompanion } from '../../../domain/stellar/stellar-companion';
import { StellarComponentDesignation } from '../../../domain/stellar/stellar-component-designation';
import { StellarRelativeOrbit } from '../../../domain/stellar/stellar-relative-orbit';
import { StellarOrbitHierarchy } from '../../../domain/stellar/stellar-orbit-hierarchy';
import { StellarSystem } from '../../../domain/stellar/stellar-system';
import { StellarSystemComponentLabel } from '../../../domain/stellar/stellar-system-component-label';
import { StellarSystemMultiplicity } from '../../../domain/stellar/stellar-system-multiplicity';
import { GalaxySectorKeyCodec } from '../../../domain/sector/galaxy-sector-key-codec';
import { CircumbinaryPlanetCompatibilityGenerator, CIRCUMBINARY_V1_OUTER_STABILITY_BUFFER } from '../../../simulation/planetary/circumbinary-planet-compatibility-generator';
import { CircumbinaryHabitabilityAssessmentGenerator } from '../../../simulation/habitability/circumbinary-habitability-assessment-generator';
import { GalaxyGenerator } from '../../../simulation/universe/galaxy-generator';
import { GalaxySectorGridGenerator } from '../../../simulation/sector/galaxy-sector-grid-generator';
import { GalaxySectorStellarDensityGenerator } from '../../../simulation/sector/galaxy-sector-stellar-density-generator';
import { GalaxySectorStellarPopulationPropertiesGenerator } from '../../../simulation/sector/galaxy-sector-stellar-population-properties-generator';
import { StellarPopulationProfileGenerator } from '../../../simulation/stellar/stellar-population-profile-generator';
import { StellarSystemGenerator } from '../../../simulation/stellar/stellar-system-generator';
import { StellarGenerator } from '../../../simulation/stellar/stellar-generator';
import { StellarDesignationGenerator } from '../../../simulation/stellar/stellar-designation-generator';
import { ProceduralTargetResolver } from '../../../simulation/regeneration/procedural-target-resolver';
import { ProtoplanetaryFormationSnapshotGenerator } from '../../../simulation/planetary/protoplanetary-formation-snapshot-generator';
import { PlanetaryFormationMaturationGenerator } from '../../../simulation/planetary/planetary-formation-maturation-generator';
import { PlanetarySystemGenerator } from '../../../simulation/planetary/planetary-system-generator';
import { PlanetGenerator } from '../../../simulation/planetary/planet-generator';
import type { StellarSystemLaboratoryFamily, StellarSystemLaboratoryFrame } from './stellar-system-laboratory-fixtures';
import { StellarSystemLaboratoryFixtures } from './stellar-system-laboratory-fixtures';
import { laboratoryCircumstellarCriticalFraction } from './stellar-system-laboratory-orbital-spacing';
import type { SystemSceneOrbitalMotionSnapshot } from '../../system/system-scene-snapshot';

/** Dedicated LAB formation branch: sampled system seed is distinct from all SINGLE sources.
 * The existing 16.5/16.6, 17.7, 18 and 19 generators produce the P planets;
 * nothing is copied from A/B/C's planets or redistributed after generation.
 * The independent disk reservoir is a laboratory experiment, not a claim that
 * three disks coexist or that the resulting system survived an N-body evolution.
 */
export interface LaboratoryCircumbinaryPopulation {
  readonly planets: readonly Planet[];
  readonly compatibility: CircumbinaryPlanetCompatibility | null;
  readonly habitability: CircumbinaryHabitabilityAssessment | null;
  /** Physical C-imposed outer edge, if this is an inner pair of a triple. */
  readonly stableOuterLimitAu: number | null;
  readonly status: string;
}

const cached = new Map<string, LaboratoryCircumbinaryPopulation>();

/** Experimental LAB survival band measured from the actual AB stellar orbit.
 * Avoids stretching the independent SINGLE formation disk by six orders of
 * magnitude when the phase-18 BINARY model admits an unbounded outer region.
 * Only fully generated Planet entities inside this band survive to the P
 * catalogue; original A/B/C populations are never truncated or altered. */
export const LAB_P_MAX_APOASTRON_BINARY_AXES = 4;
const NONE = (status: string, compatibility: CircumbinaryPlanetCompatibility | null = null,
  habitability: CircumbinaryHabitabilityAssessment | null = null, stableOuterLimitAu: number | null = null): LaboratoryCircumbinaryPopulation =>
  Object.freeze({ planets: Object.freeze([]), compatibility, habitability, stableOuterLimitAu, status });

type SingleSource = StellarSystemLaboratoryFrame;

function resolveSingle(source: SingleSource) {
  const key = StellarSystemLaboratoryFixtures.generationKey();
  const locator = source.family.locator;
  const galaxy = GalaxyGenerator.generate(key, locator.galaxyIndex);
  const grid = GalaxySectorGridGenerator.generate(galaxy);
  const density = GalaxySectorStellarDensityGenerator.generate(galaxy, grid,
    GalaxySectorKeyCodec.decode(locator.sectorKey));
  const population = GalaxySectorStellarPopulationPropertiesGenerator.generate(galaxy, density);
  const profile = StellarPopulationProfileGenerator.generate(key, galaxy.physicalProperties, population);
  const system = StellarSystemGenerator.generateSingle(key, locator, population, profile);
  const physical = StellarGenerator.generatePhysicalProperties(key, locator, population, profile);
  const spectral = StellarGenerator.generateSpectralAppearance(key, physical, population);
  const lifetime = StellarGenerator.generateLifetimeProfile(key, locator, physical, population, profile);
  return { system, physical, spectral, lifetime, source };
}

type ResolvedSingle = ReturnType<typeof resolveSingle>;

function companion(source: ResolvedSingle, label: StellarSystemComponentLabel,
  primary: ResolvedSingle, designation: StellarSystem['designation']): StellarCompanion {
  const primaryMass = primary.physical.initialMassSolar;
  return new StellarCompanion(label, source.source.family.systemSeedHex,
    new StellarComponentDesignation(designation, label), primaryMass,
    source.physical.initialMassSolar / primaryMass, source.physical,
    source.spectral, source.lifetime);
}

function independentBlueprint(family: StellarSystemLaboratoryFamily, combinedMassSolar: number) {
  const key = StellarSystemLaboratoryFixtures.generationKey();
  const reference = ProtoplanetaryFormationSnapshotGenerator.generateMaturationReferenceOrNull(key, family.locator);
  if (reference === null) return null;
  const source = PlanetaryFormationMaturationGenerator.generate(key, reference.systemSeed,
    reference.diskProfile, reference.diskStructure, reference.planetFormationProfile,
    reference.candidatePopulation, reference.earlyDynamics);
  // Keep the independent sampled anchors and mass budget, but resolve the host
  // gravitational mass from the actual composed stellar pair, never the sample star.
  return new PlanetarySystemFormationBlueprint(
    source.sourceDiskAgeMillionYears, source.sourceDiskDispersalAgeMillionYears,
    source.formationCompletionAgeMillionYears, combinedMassSolar,
    source.sourceInnerRadiusAu, source.sourceOuterRadiusAu,
    source.sourceGasMassEarth, source.sourceDustMassEarth,
    source.sourceCandidateSolidMassEarth, source.residualDustMassEarth,
    source.maxGasCaptureBudgetEarth, source.sourceCandidateCount,
    source.sourceSurvivorCount, source.sourceMigratedBodyCount,
    source.sourceCollisionCount, source.regime, source.formationAnchors,
  );
}

/** Uses the EXACT stellar semimajor axes already frozen by the scene composers. */
export function generateLaboratoryCircumbinaryPopulation(
  family: StellarSystemLaboratoryFamily,
  sourceSystems: readonly [SingleSource, SingleSource] | readonly [SingleSource, SingleSource, SingleSource],
  inner: SystemSceneOrbitalMotionSnapshot,
  outer?: SystemSceneOrbitalMotionSnapshot,
): LaboratoryCircumbinaryPopulation {
  const key = `${sourceSystems.length}:${family.id}:${inner.semiMajorAxisAu}:${outer?.semiMajorAxisAu ?? 'OPEN'}`;
  const previous = cached.get(key);
  if (previous !== undefined) return previous;
  const result = generate(family, sourceSystems, inner, outer);
  cached.set(key, result);
  return result;
}

function generate(
  family: StellarSystemLaboratoryFamily,
  sources: readonly [SingleSource, SingleSource] | readonly [SingleSource, SingleSource, SingleSource],
  inner: SystemSceneOrbitalMotionSnapshot,
  outer?: SystemSceneOrbitalMotionSnapshot,
): LaboratoryCircumbinaryPopulation {
  if ((sources.length === 3) !== (outer !== undefined)) {
    throw new RangeError('P-type host must match the composed binary/triple hierarchy.');
  }
  const key = StellarSystemLaboratoryFixtures.generationKey();
  const a = resolveSingle(sources[0]);
  const b = resolveSingle(sources[1]);
  // Phase-16 StellarCompanion requires M_B <= M_primary. This ordering affects
  // ONLY the independent P-type domain host, never the rendered A/B identities.
  const primary = a.physical.initialMassSolar >= b.physical.initialMassSolar ? a : b;
  const secondary = primary === a ? b : a;
  const c = sources.length === 3 ? resolveSingle(sources[2]) : null;
  // The frozen triple domain requires M_C <= M_B. When actual laboratory C
  // exceeds B, generate an honest BINARY A-B P host and apply C's empirical
  // exterior stability cutoff separately. Do not relabel/move the real stars.
  const fullTripleHost = c !== null && c.physical.initialMassSolar <= secondary.physical.initialMassSolar;
  const multiplicity = fullTripleHost ? StellarSystemMultiplicity.TRIPLE : StellarSystemMultiplicity.BINARY;
  const designation = StellarDesignationGenerator.generate(key, family.locator);
  const seed = ProceduralTargetResolver.resolveTargetSeed(key, family.locator) as StellarSystem['seed'];
  const originalStar = primary.system.primaryStar;
  const labPrimary = new Star(key, family.locator, originalStar.evolutionState,
    originalStar.mainSequenceClass, originalStar.brownDwarfClass,
    originalStar.postMainSequenceStage, originalStar.whiteDwarfComposition,
    originalStar.neutronStarFormationChannel, originalStar.blackHoleFormationChannel);
  const companionB = companion(secondary, StellarSystemComponentLabel.B, primary, designation);
  const companionC = fullTripleHost && c !== null
    ? companion(c, StellarSystemComponentLabel.C, primary, designation) : null;
  const massAB = a.physical.initialMassSolar + b.physical.initialMassSolar;
  const innerOrbit = new StellarRelativeOrbit(inner.semiMajorAxisAu, inner.eccentricity,
    Math.sqrt(inner.semiMajorAxisAu ** 3 / massAB));
  const outerOrbit = outer === undefined || c === null ? null : new StellarRelativeOrbit(
    outer.semiMajorAxisAu, outer.eccentricity,
    Math.sqrt(outer.semiMajorAxisAu ** 3 / (massAB + c.physical.initialMassSolar)));
  // Do not invent or enlarge C's real orbit merely to satisfy phase-16's
  // conservative hierarchy precondition. Ineligible cases have zero P planets.
  if (outerOrbit !== null && outerOrbit.periastronAu < 5 * innerOrbit.apoastronAu) {
    return NONE('Sin población P: órbita exterior demasiado próxima para el contrato jerárquico V1.');
  }
  const hierarchy = new StellarOrbitHierarchy(multiplicity, innerOrbit, fullTripleHost ? outerOrbit : null);
  const compatibility = !fullTripleHost
    ? CircumbinaryPlanetCompatibilityGenerator.generateBinary(key, hierarchy, primary.physical, companionB)
    : CircumbinaryPlanetCompatibilityGenerator.generateTriple(key, hierarchy, primary.physical, companionB, companionC!);
  // For mass-order fallback, C is still a real perturbing star in the scene.
  // Its outer S-type limit is applied to every P orbit (not silently ignored).
  const cLimit = c === null || outerOrbit === null ? null :
    fullTripleHost ? compatibility.maximumStableSemiMajorAxisAu :
    outerOrbit.semiMajorAxisAu * laboratoryCircumstellarCriticalFraction(
      c.physical.initialMassSolar / (massAB + c.physical.initialMassSolar),
      outerOrbit.eccentricity,
    ) * CIRCUMBINARY_V1_OUTER_STABILITY_BUFFER;
  const habitability = CircumbinaryHabitabilityAssessmentGenerator.generate(key, compatibility,
    primary.physical, labPrimary, companionB, hierarchy, companionC);
  if (!compatibility.isCompatible || (cLimit !== null && cLimit <= compatibility.minimumStableSemiMajorAxisAu)) {
    return NONE('Sin población P: la estrella C cierra el intervalo estable del binario interior.',
      compatibility, habitability, cLimit);
  }
  const survivalOuterAu = Math.min(inner.semiMajorAxisAu * LAB_P_MAX_APOASTRON_BINARY_AXES, cLimit ?? Infinity);
  if (survivalOuterAu < compatibility.minimumStableSemiMajorAxisAu) {
    return NONE('Sin población P: no queda espacio en el anillo de supervivencia experimental A–B.',
      compatibility, habitability, cLimit);
  }
  const blueprint = independentBlueprint(family, massAB);
  if (blueprint === null || blueprint.anchorCount === 0) {
    return NONE('Sin población P: el disco independiente de esta familia no produjo núcleos planetarios maduros.', compatibility, habitability, cLimit);
  }
  const system = new StellarSystem(key, family.locator, seed, designation, multiplicity,
    labPrimary, hierarchy, companionB, companionC, compatibility, habitability,
    primary.physical.luminositySolar);
  const planetarySystem = PlanetarySystemGenerator.generate(key, system, blueprint);
  const candidates = PlanetGenerator.generateAll(key, planetarySystem);
  // Survival selection is a generation-time LAB filter over REAL Planet objects:
  // no post-hoc relocation, no cosmetic bodies, no changes to A/B/C. The base
  // phase-18 envelope checks semimajor axes; we additionally bound apastra.
  const planets = Object.freeze(candidates.filter(planet =>
    planet.orbit.semiMajorAxisAu >= compatibility.minimumStableSemiMajorAxisAu &&
    planet.orbit.apoastronAu <= survivalOuterAu));
  const excluded = candidates.length - planets.length;
  const status = planets.length === 0
    ? `Sin planetas P supervivientes en el anillo experimental A–B (descartados: ${excluded}).`
    : `${planets.length} planeta${planets.length === 1 ? '' : 's'} P real${planets.length === 1 ? '' : 'es'} generado${planets.length === 1 ? '' : 's'}; ${excluded} fuera del anillo de supervivencia experimental.`;
  return Object.freeze({ planets, compatibility, habitability, stableOuterLimitAu: cLimit, status });
}
