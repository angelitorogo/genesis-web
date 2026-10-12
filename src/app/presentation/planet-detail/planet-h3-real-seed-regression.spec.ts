import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarCompactHostPlanetaryCoherence } from '../../simulation/stellar/stellar-compact-host-planetary-coherence';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { StellarMultihostScientificTargetResolver } from '../../simulation/stellar/stellar-multihost-scientific-target-resolver';
import { PlanetScientificSectionsAssembler } from './planet-scientific-sections';
import { scientificRouteUniverseRef } from '../scientific/scientific-route-identity';

/**
 * 29.1E-H3 — Regression against the user's actual V2 universe, NOT synthetic
 * substitutes or the opaque ?u= route token treated as a seed.
 *
 * The canonical planets are never modified. A WD post-AGB orbit is only a
 * conditional read-only estimate, not evidence of survival or stability.
 */
const V2_SEED = '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const EXPECTED_ROUTE_REF = '9137E39A2C0C68A6EBBDFBEE2986D96B';
const KEY = new UniverseGenerationKey(UniverseSeed.parse(V2_SEED), GeneratorVersion.V2);

const REAL_CASES = [
  {
    name: 'Musia B-2', sectorKey: 206158430195n, objectIndex: 1n,
    bodyIndex: 10n, planetCount: 20,
    massEarth: 0.749, radiusEarth: 0.948,
    formationAxisAu: 1.819, formationEccentricity: 0.029,
    remnantMassSolar: 0.554, coolingAgeGyr: 8.893,
    luminositySolar: 1.73e-5,
  },
  {
    name: 'Xiria B-4', sectorKey: 55834574858n, objectIndex: 0n,
    bodyIndex: 3n, planetCount: 19,
    massEarth: 1.876, radiusEarth: 1.273,
    formationAxisAu: 4.583, formationEccentricity: 0.025,
    remnantMassSolar: 0.580, coolingAgeGyr: 9.803,
    luminositySolar: 1.57e-5,
  },
] as const;

describe('29.1E-H3 — exact real-universe WD post-AGB regression', () => {
  it('authenticates the seed against the actual route reference used by both fiches', () => {
    expect(KEY.universeSeed.serialize()).toBe(V2_SEED);
    expect(KEY.generatorVersion).toBe(GeneratorVersion.V2);
    expect(scientificRouteUniverseRef(V2_SEED, GeneratorVersion.V2.code))
      .toBe(EXPECTED_ROUTE_REF);
    expect(EXPECTED_ROUTE_REF).not.toBe(KEY.universeSeed.normalizedValue);
  });

  it.each(REAL_CASES)('regenerates $name and never promotes a conditional orbit to Ground Truth', sample => {
    const locator = new SystemLocator(0n, sample.sectorKey, sample.objectIndex);
    const formation = StellarMultihostFormation.generateOrNull(KEY, locator);
    expect(formation, `${sample.name}: actual V2 formation must exist`).not.toBeNull();
    if (formation === null) throw new Error(`${sample.name}: actual V2 formation missing`);

    expect(formation.parentGenerationKey.equals(KEY)).toBe(true);
    expect(formation.publicPlanets).toHaveLength(sample.planetCount);
    const entry = formation.publicPlanets.find(candidate =>
      candidate.publicLocator.galaxyIndex === 0n &&
      candidate.publicLocator.sectorKey === sample.sectorKey &&
      candidate.publicLocator.galacticObjectIndex === sample.objectIndex &&
      candidate.publicLocator.bodyIndex === sample.bodyIndex,
    );
    expect(entry, `${sample.name}: exact canonical public body must exist`).toBeDefined();
    if (entry === undefined) throw new Error(`${sample.name}: canonical body missing`);
    expect(entry.host).toBe('B');
    expect(entry.planet.massEarth).toBeCloseTo(sample.massEarth, 2);
    expect(entry.planet.radiusEarth).toBeCloseTo(sample.radiusEarth, 2);
    expect(entry.planet.orbit.semiMajorAxisAu).toBeCloseTo(sample.formationAxisAu, 2);
    expect(entry.planet.orbit.eccentricity).toBeCloseTo(sample.formationEccentricity, 2);

    const originalPlanet = entry.planet;
    const originalOrbit = entry.planet.orbit;
    const originalAtmosphere = entry.atmosphere;
    const originalMoons = entry.moonSystem;
    const originalComponent = formation.components.find(component => component.label === 'B');
    expect(originalComponent).toBeDefined();
    if (originalComponent === undefined) throw new Error(`${sample.name}: B host missing`);

    const coherence = new StellarCompactHostPlanetaryCoherence(formation);
    const host = coherence.stateFor('B');
    expect(host.componentEvolutionStates).toContain('WHITE_DWARF');
    expect(host.radiativeRegime).toBe('WHITE_DWARF_COOLING_ESTIMATE');
    expect(host.currentGravitatingMassSolar).not.toBeNull();
    expect(host.currentGravitatingMassSolar!).toBeCloseTo(sample.remnantMassSolar, 2);
    expect(host.whiteDwarfCoolingAgeBillionYears!).toBeCloseTo(sample.coolingAgeGyr, 2);
    expect(host.currentLuminositySolar!).toBeCloseTo(sample.luminositySolar, 6);
    expect(coherence.planetaryDynamics(entry).disposition).toBe('UNCHANGED');

    const resolver = new StellarMultihostScientificTargetResolver(formation);
    const target = resolver.resolveDetailed(KEY, entry.publicLocator);
    expect(target, `${sample.name}: genuine V2 fiche must resolve`).not.toBeNull();
    if (target === null) throw new Error(`${sample.name}: scientific fiche missing`);
    expect(target.identity.designation).toBe(sample.name);
    const evolution = target.hostEvolution!;
    expect(evolution.whiteDwarfPostAgbOrbitalHypothesisApplied).toBe(true);
    const initialMass = originalComponent.physical.initialMassSolar;
    const finalMass = host.currentGravitatingMassSolar!;
    const expectedAxis = originalOrbit.semiMajorAxisAu * initialMass / finalMass;
    expect(evolution.whiteDwarfPostAgbMassExpansionFactor).toBeCloseTo(initialMass / finalMass, 8);
    expect(evolution.whiteDwarfPostAgbSemiMajorAxisAu).toBeCloseTo(expectedAxis, 8);
    expect(evolution.whiteDwarfPostAgbPeriodYears).toBeCloseTo(
      Math.sqrt(expectedAxis ** 3 / finalMass), 8,
    );
    expect(evolution.whiteDwarfPostAgbHostInsolationEarth).toBeCloseTo(
      host.currentLuminositySolar! / (expectedAxis ** 2 *
        Math.sqrt(1 - originalOrbit.eccentricity ** 2)), 10,
    );
    // No claim of actual orbit, irradiance, atmospheric survival or full climate.
    expect(evolution.currentOrbitalPeriodYears).toBeNull();
    expect(evolution.currentMeanInsolationEarth).toBeNull();
    expect(evolution.whiteDwarfExternalFluxUpperEarth).toBeNull();
    expect(evolution.whiteDwarfEquilibriumUpperKelvin).toBeNull();
    expect(evolution.conditionalEnvironmentReassessmentApplied).toBe(false);

    const sections = PlanetScientificSectionsAssembler.build(target);
    const orbitFields = sections.sections.find(s => s.id === 'orbit')?.fields ?? [];
    const atmosphereFields = sections.sections.find(s => s.id === 'atmosphere')?.fields ?? [];
    const climateFields = sections.sections.find(s => s.id === 'climate')?.fields ?? [];
    expect(orbitFields.some(f => f.label === 'Semieje mayor hipotético post-AGB')).toBe(true);
    expect(orbitFields.some(f => f.label === 'Periodo orbital actual · no validado' &&
      f.value.includes('No determinado'))).toBe(true);
    expect(climateFields.some(f => f.label === 'Temperatura superficial actual' &&
      f.value.includes('SIMULADA'))).toBe(true);
    // H4: historical phase-20 inventory supports a conditional WD-only
    // cryogenic scenario, not a claim of present-day atmospheric survival.
    const scenario = evolution.whiteDwarfPostAgbAtmosphereScenario;
    expect(scenario, `${sample.name}: H4 scenario must derive from real V2 data`).not.toBeNull();
    if (scenario === null || scenario === undefined) throw new Error(`${sample.name}: H4 data missing`);
    expect(scenario.currentPressureUnresolved).toBe(true);
    expect(scenario.survivalUnresolved).toBe(true);
    expect(scenario.currentWaterUnresolved).toBe(true);
    expect(scenario.scenarioGasPressureCeilingPascal).toBeGreaterThanOrEqual(0);
    expect(scenario.scenarioGasPressureCeilingPascal)
      .toBeLessThanOrEqual(scenario.progenitorReferencePressurePascal);
    expect(atmosphereFields.some(f => f.label === 'Presión gaseosa posible · escenario WD-only')).toBe(true);
    // H4b uses the SAME real regenerated star/planet and atmospheric inventory.
    // Its parametric history is a sensitivity test, never a claim of actual gas.
    const history = evolution.whiteDwarfPostAgbAtmosphereHistory;
    expect(history, `${sample.name}: H4b real-seed history must exist`).not.toBeNull();
    if (history === null || history === undefined) throw new Error(`${sample.name}: H4b data missing`);
    expect(history.initialStellarMassSolar).toBeCloseTo(initialMass, 8);
    expect(history.whiteDwarfMassSolar).toBeCloseTo(finalMass, 8);
    expect(history.postMainSequenceDurationBillionYears).toBeCloseTo(
      originalComponent.lifetime.evolutionAssessment.postMainSequenceDurationBillionYears!, 8);
    expect(history.formationSemiMajorAxisAu).toBeCloseTo(originalOrbit.semiMajorAxisAu, 8);
    expect(history.hypotheticalPostAgbSemiMajorAxisAu).toBeCloseTo(expectedAxis, 8);
    expect(history.presentAtmosphereUnresolved).toBe(true);
    // H4d: the canonical planet already exists. Unknown RGB/AGB chronology
    // must not be presented as doubt about that existence or as present gases.
    const resolution = evolution.whiteDwarfPostAgbEnvironmentalResolution;
    expect(resolution, `${sample.name}: integrated H4d decision`).not.toBeNull();
    if (resolution === null || resolution === undefined) throw new Error(`${sample.name}: H4d missing`);
    expect(resolution.planetCanonicalStatus).toBe('PRESENT_IN_GENERATED_GROUND_TRUTH');
    expect(resolution.evolutionarySurvivalExplanation).toBe('NOT_RECONSTRUCTED');
    expect(resolution.presentAtmosphereStatus).toBe('UNRESOLVED_CONDITIONAL_SCENARIOS_ONLY');
    expect(resolution.atmosphericFieldsMayBePromotedToCurrent).toBe(false);
    expect(resolution.pressureByEscapeHypothesis.length).toBeGreaterThan(1);
    expect(atmosphereFields.some(f => f.label === 'Diagnóstico ambiental integrado · H4d')).toBe(true);
    expect(atmosphereFields.some(f => f.label === 'Presiones de escenarios conjuntos H4b + H4 · H4d')).toBe(true);
    expect(orbitFields.some(f => f.label === 'Presencia del planeta en Ground Truth' &&
      f.value.includes('canónico'))).toBe(true);
    expect(orbitFields.some(f => f.label === 'Supervivencia planetaria actual')).toBe(false);
    const survival = evolution.whiteDwarfPostAgbSurvivalAssessment;
    expect(survival, `${sample.name}: H4c real-seed survival scenario must exist`).not.toBeNull();
    if (survival === null || survival === undefined) throw new Error(`${sample.name}: H4c missing`);
    expect(survival.planetSurvivalConfirmed).toBe(false);
    expect(survival.atmosphericCompositionCurrentUnresolved).toBe(true);
    expect(survival.formationPeriastronAu).toBeCloseTo(
      originalOrbit.semiMajorAxisAu * (1 - originalOrbit.eccentricity), 8);
    expect(survival.hypotheticalPostAgbPeriastronAu).toBeCloseTo(
      expectedAxis * (1 - originalOrbit.eccentricity), 8);
    expect(survival.envelopeRadiusHypothesisAu[1]).toBeGreaterThan(
      survival.envelopeRadiusHypothesisAu[0]);
    expect(survival.meanSupplyToRebuildPriorInventoryKilogramsPerYear).toBeGreaterThan(0);
    expect(atmosphereFields.some(f =>
      f.label === 'Escape térmico por especies · H4c')).toBe(true);
    expect(orbitFields.some(f =>
      f.label === 'Intersección con envoltura · escenario H4c')).toBe(true);
    expect(history.companionIrradiationUnresolved).toBe(true);
    expect(history.stages.map(stage => stage.stage))
      .toEqual(['RGB', 'AGB', 'WD_COOLING_RESOLVED_WINDOW']);
    expect(atmosphereFields.some(f => f.label === 'Historia RGB/AGB · referencia H4b')).toBe(true);
    expect(atmosphereFields.some(f =>
      f.label === 'Acoplamiento necesario para perder el inventario inicial · H4b')).toBe(true);
    expect(atmosphereFields.some(f => f.label === 'Presión y composición actuales' &&
      f.value.includes('simulación H5 disponible'))).toBe(true);

    // H5 reconstructs a CURRENT SIMULATED atmosphere, independent of the
    // unresolved observational inference in H4d. No per-seed exceptions.
    const evolved = evolution.whiteDwarfPostAgbEvolvedEnvironment;
    expect(evolved, `${sample.name}: H5 model missing`).not.toBeNull();
    if (!evolved) throw new Error(`${sample.name}: H5 unavailable`);
    expect(evolved.kind).toBe('POST_AGB_WD_EVOLVED_ENVIRONMENT_MODEL_V1');
    expect(evolved.reference.pressurePascal).toBeGreaterThanOrEqual(0);
    expect(evolved.reference.climateTemperatureKelvin).toBeGreaterThan(0);
    expect(evolved.reference.atmosphericMassBudgetErrorPascal).toBeLessThan(0.01);
    expect(evolved.alternatives).toHaveLength(3);
    expect(evolved.multiHostRadiationUnresolved)
      .toBe(evolved.modeledCompanionIrradiationEarth === null);
    expect(evolution.whiteDwarfPostAgbModeledCompanionFluxEarth ?? null)
      .toBe(evolved.modeledCompanionIrradiationEarth);
    expect(evolved.canonicalPlanetModified).toBe(false);
    expect(atmosphereFields.some(f => f.label === 'Presión actual simulada · H5')).toBe(true);
    expect(atmosphereFields.some(f => f.label === 'Composición actual simulada · H5')).toBe(true);
    expect(climateFields.some(f => f.label === 'Temperatura superficial actual SIMULADA · H5')).toBe(true);
    // H5-A.1: surface labels must distinguish host-only calculations from
    // the explicitly simulated companion irradiance, even when tiny.
    const surfaceFields = sections.sections.find(s => s.id === 'surface')?.fields ?? [];
    const modeledCompanions = evolved.modeledCompanionIrradiationEarth !== null;
    expect(surfaceFields.some(f => f.label === 'Estado térmico superficial actual' &&
      f.value.includes(modeledCompanions ? 'WD + acompañantes modeladas' : 'solo WD'))).toBe(true);
    expect(climateFields.some(f => f.label === 'Temperatura superficial actual' &&
      f.value.includes(modeledCompanions ? 'WD + acompañantes' : 'WD-only'))).toBe(true);
    for (const candidate of evolved.alternatives) {
      const partialSum = candidate.gases.reduce((total, g) => total + g.gasPartialPressurePascal, 0);
      const massColumnSum = candidate.gases.reduce((total, g) => total + g.gasPressurePascal, 0);
      expect(partialSum).toBeCloseTo(candidate.pressurePascal, 5);
      expect(massColumnSum).toBeCloseTo(candidate.pressurePascal, 5);
      for (const gas of candidate.gases) {
        expect(gas.gasPartialPressurePascal).toBeCloseTo(
          candidate.pressurePascal * gas.gasMoleFraction01, 5);
      }
    }

    // H4d's non-identifiability from observational evidence is still true;
    // H5 explicitly SELECTS a model closure, not an observational inference.
    expect(resolution.presentAtmosphereStatus).toBe('UNRESOLVED_CONDITIONAL_SCENARIOS_ONLY');

    // No write-back: canonical objects, generation seed, orbital elements,
    // atmosphere and moon system have retained their exact identity.
    expect(formation.parentGenerationKey.equals(KEY)).toBe(true);
    expect(entry.planet).toBe(originalPlanet);
    expect(entry.planet.orbit).toBe(originalOrbit);
    expect(entry.atmosphere).toBe(originalAtmosphere);
    expect(entry.moonSystem).toBe(originalMoons);
    expect(entry.planet.orbit.semiMajorAxisAu).toBeCloseTo(sample.formationAxisAu, 2);
    expect(resolver.resolveDetailed(KEY, entry.publicLocator)?.hostEvolution).toEqual(evolution);
  }, 120_000);
});
