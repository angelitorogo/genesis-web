import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { PlanetScientificSectionsAssembler } from './planet-scientific-sections';
import { scientificRouteUniverseRef } from '../scientific/scientific-route-identity';
import { projectPostRemnantUnresolvedLuminosityThermalState } from '../../simulation/planetary/post-remnant-unresolved-luminosity-thermal-projection';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { StellarCompactHostPlanetaryCoherence } from '../../simulation/stellar/stellar-compact-host-planetary-coherence';
import { StellarMultihostFormation, type GeneratedMultipleHost, type GeneratedPublicPlanet } from '../../simulation/stellar/stellar-multihost-formation';
import { multihostPhysicalSourceKey } from '../../simulation/stellar/stellar-multihost-physical-source-key';
import { StellarMultihostScientificTargetResolver } from '../../simulation/stellar/stellar-multihost-scientific-target-resolver';
import { StellarSystemMultiplicitySelector } from '../../simulation/stellar/stellar-system-multiplicity-selector';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';

/**
 * This is an actual canonical V2 generation seed from existing V2 regression
 * fixtures. A scientific route's `?u=` parameter is only a hashed reference
 * and MUST NOT be parsed as the universe seed.
 *
 * Musia B-2 / Xiria B-4 are user-observed addresses from a *different*
 * persisted universe. Their seed is not present in the shared URL. The two
 * physical snapshots below therefore exercise the intrinsic heating model,
 * NOT fictitious regeneration of those exact systems.
 */
const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V2,
);

type Fixture = Readonly<{ formation: GeneratedMultipleHost; entry: GeneratedPublicPlanet }>;
let cachedFixture: Fixture | null = null;

function populatedV2Fixture(): Fixture {
  if (cachedFixture !== null) return cachedFixture;
  const physical = multihostPhysicalSourceKey(key);
  for (let i = 0n; i < 128n; i += 1n) {
    const locator = new SystemLocator(0n, 0n, i);
    const systemSeed = ProceduralTargetResolver.resolveTargetSeed(physical, locator);
    const multiplicity = StellarSystemMultiplicitySelector.select(
      physical, systemSeed as Parameters<typeof StellarSystemMultiplicitySelector.select>[1],
    );
    if (multiplicity === StellarSystemMultiplicity.SINGLE) continue;
    const formation = StellarMultihostFormation.generateOrNull(key, locator);
    if (formation === null) continue;
    const coherence = new StellarCompactHostPlanetaryCoherence(formation);
    const entry = formation.publicPlanets.find(candidate =>
      candidate.host !== 'AB' &&
      coherence.planetaryDynamics(candidate).disposition === 'UNCHANGED' &&
      candidate.atmosphere.internalHeatRetentionIndex01 !== null &&
      candidate.atmosphere.internalHeatRetentionIndex01 > 0,
    );
    if (entry !== undefined) {
      cachedFixture = { formation, entry };
      return cachedFixture;
    }
  }
  throw new Error('No populated, dynamically unchanged V2 multihost fixture in the bounded search.');
}

describe('29.1E - compact-host partial thermal regression (correctly seeded)', () => {
  it('never interprets the opaque scientific URL reference as a generation seed', () => {
    const serialized = key.universeSeed.serialize();
    const ref = scientificRouteUniverseRef(serialized, key.generatorVersionCode);
    expect(ref).toMatch(/^[0-9A-F]{32}$/);
    expect(ref).not.toBe(serialized.replaceAll('-', ''));
    // A route parameter is a lookup token, not enough to reconstruct a system.
    expect(scientificRouteUniverseRef(serialized, GeneratorVersion.V1.code)).not.toBe(ref);
  });

  it.each([
    { label: 'Musia B-2: intrinsic input snapshot', mass: 0.749, radius: 0.948, albedo: 0.138, retention: 0.653 },
    { label: 'Xiria B-4: intrinsic input snapshot', mass: 1.876, radius: 1.273, albedo: 0.207, retention: 0.792 },
  ])('$label stays calculable without guessing the compact host luminosity', sample => {
    const input = Object.freeze({
      massEarth: sample.mass, radiusEarth: sample.radius,
      referenceBondAlbedo01: sample.albedo,
      internalHeatRetentionIndex01: sample.retention,
      tidalHeatingIndex01: null,
    });
    const first = projectPostRemnantUnresolvedLuminosityThermalState(input);
    const replay = projectPostRemnantUnresolvedLuminosityThermalState(input);
    expect(first).toEqual(replay);
    expect(first?.geothermalFluxWattsPerSquareMeter).toBeGreaterThan(0);
    expect(first?.intrinsicBlackbodyEquivalentKelvin).toBeGreaterThan(0);
    expect(Object.isFrozen(first)).toBe(true);
  });

  it('projects unknown WD-like luminosity into a genuine V2 planet fiche without rewriting the progenitor', () => {
    const { formation, entry } = populatedV2Fixture();
    const original = entry.planet;
    const originalAtmosphere = entry.atmosphere;
    const resolver = new StellarMultihostScientificTargetResolver(formation);
    // Controlled WD state injection exercises the compact-host branch without
    // pretending the selected V2 fixture is Musia, Xiria or a real white dwarf.
    const spy = vi.spyOn(StellarCompactHostPlanetaryCoherence.prototype, 'stateFor')
      .mockImplementation(hostLabel => Object.freeze({
        hostLabel,
        componentEvolutionStates: Object.freeze(['WHITE_DWARF']),
        containsCompactRemnant: true,
        requiresPostStellarEvolutionReassessment: true,
        currentGravitatingMassSolar: 0.55,
        currentLuminositySolar: null,
        radiativeRegime: 'COMPACT_LUMINOSITY_UNMODELED' as const,
      }));
    try {
      const target = resolver.resolveDetailed(key, entry.publicLocator);
      expect(target).not.toBeNull();
      expect(target?.identity.locator).toEqual(entry.publicLocator);
      const state = target!.hostEvolution!;
      expect(state.currentMeanInsolationEarth).toBeNull();
      expect(state.conditionalEnvironmentReassessmentApplied).toBe(false);
      expect(state.intrinsicOnlyThermalProjectionApplied).toBe(true);
      expect(state.conditionalGeothermalHeatFluxWattsPerSquareMeter).toBeGreaterThan(0);
      const sections = PlanetScientificSectionsAssembler.build(target!);
      const climate = sections.sections.find(s => s.id === 'climate')!;
      const atmosphere = sections.sections.find(s => s.id === 'atmosphere')!;
      expect(climate.fields.some(f => f.label === 'Flujo geotérmico condicionado')).toBe(true);
      expect(climate.fields.some(f => f.label === 'Temperatura superficial actual' && f.value === 'No resuelta')).toBe(true);
      expect(atmosphere.fields.some(f => f.label === 'Estado atmosférico post-remanente' && f.value === 'No resuelto')).toBe(true);
      expect(entry.planet).toBe(original);
      expect(entry.atmosphere).toBe(originalAtmosphere);
    } finally {
      spy.mockRestore();
    }
  }, 120_000);

  it('H3 projects an explicitly conditional WD post-AGB orbit without changing a real V2 planet', () => {
    const {formation, entry} = populatedV2Fixture();
    const host = formation.components.find(c => c.label === entry.host)!;
    const canonicalOrbit = entry.planet.orbit;
    const canonicalPlanet = entry.planet;
    const canonicalAtmosphere = entry.atmosphere;
    const initialMass = host.physical.initialMassSolar;
    const currentMass = initialMass * 0.5;
    const luminosity = 1.73e-5;
    const spy = vi.spyOn(StellarCompactHostPlanetaryCoherence.prototype, 'stateFor')
      .mockImplementation(hostLabel => Object.freeze({
        hostLabel, componentEvolutionStates: Object.freeze(['WHITE_DWARF']),
        containsCompactRemnant: true, requiresPostStellarEvolutionReassessment: true,
        currentGravitatingMassSolar: currentMass,
        currentLuminositySolar: luminosity, radiativeRegime: 'WHITE_DWARF_COOLING_ESTIMATE' as const,
      }));
    try {
      const resolver = new StellarMultihostScientificTargetResolver(formation);
      const projected = resolver.resolveDetailed(key, entry.publicLocator);
      expect(projected).not.toBeNull();
      const evolution = projected!.hostEvolution!;
      expect(evolution.whiteDwarfPostAgbOrbitalHypothesisApplied).toBe(true);
      expect(evolution.whiteDwarfPostAgbSemiMajorAxisAu)
        .toBeCloseTo(canonicalOrbit.semiMajorAxisAu * 2, 8);
      expect(evolution.currentOrbitalPeriodYears).toBeNull();
      expect(evolution.currentMeanInsolationEarth).toBeNull();
      expect(evolution.whiteDwarfExternalFluxUpperEarth).toBeNull();
      expect(evolution.whiteDwarfEquilibriumUpperKelvin).toBeNull();
      expect(evolution.conditionalEnvironmentReassessmentApplied).toBe(false);
      const sections = PlanetScientificSectionsAssembler.build(projected!);
      const orbit = sections.sections.find(section => section.id === 'orbit')!;
      const climate = sections.sections.find(section => section.id === 'climate')!;
      const atmosphere = sections.sections.find(section => section.id === 'atmosphere')!;
      expect(orbit.fields.some(field => field.label === 'Semieje mayor hipotético post-AGB')).toBe(true);
      expect(orbit.fields.some(field => field.label === 'Periodo hipotético post-AGB')).toBe(true);
      expect(orbit.fields.some(field => field.label === 'Periodo orbital actual · no validado' &&
        field.value.includes('No determinado'))).toBe(true);
      expect(climate.fields.some(field => field.label === 'Temperatura superficial actual' &&
        field.value === 'No resuelta')).toBe(true);
      expect(atmosphere.fields.some(field => field.label === 'Estado atmosférico post-remanente' &&
        field.value === 'No resuelto')).toBe(true);
      expect(entry.planet).toBe(canonicalPlanet);
      expect(entry.planet.orbit).toBe(canonicalOrbit);
      expect(entry.atmosphere).toBe(canonicalAtmosphere);
    } finally {
      spy.mockRestore();
    }
  }, 120_000);


  it.each([
    {name:'estrella normal', state:'MAIN_SEQUENCE', compact:false, luminosity:1, regime:'CURRENT_STELLAR_SOURCE'},
    {name:'estrella de neutrones', state:'NEUTRON_STAR', compact:true, luminosity:null, regime:'COMPACT_LUMINOSITY_UNMODELED'},
    {name:'agujero negro', state:'STELLAR_BLACK_HOLE', compact:true, luminosity:0, regime:'QUIESCENT_BLACK_HOLE'},
  ])('H3 does not synthesize an adiabatic WD orbit for $name', sample => {
    const {formation, entry} = populatedV2Fixture();
    const unchangedPlanet = entry.planet;
    const unchangedOrbit = entry.planet.orbit;
    const spy = vi.spyOn(StellarCompactHostPlanetaryCoherence.prototype, 'stateFor')
      .mockImplementation(hostLabel => Object.freeze({
        hostLabel, componentEvolutionStates: Object.freeze([sample.state]),
        containsCompactRemnant: sample.compact,
        requiresPostStellarEvolutionReassessment: sample.compact,
        currentGravitatingMassSolar: 1,
        currentLuminositySolar: sample.luminosity,
        radiativeRegime: sample.regime as 'CURRENT_STELLAR_SOURCE' |
          'COMPACT_LUMINOSITY_UNMODELED' | 'QUIESCENT_BLACK_HOLE',
      }));
    try {
      const target = new StellarMultihostScientificTargetResolver(formation)
        .resolveDetailed(key, entry.publicLocator)!;
      expect(target.hostEvolution?.whiteDwarfPostAgbOrbitalHypothesisApplied ?? false).toBe(false);
      expect(entry.planet).toBe(unchangedPlanet);
      expect(entry.planet.orbit).toBe(unchangedOrbit);
    } finally {
      spy.mockRestore();
    }
  }, 120_000);

});
