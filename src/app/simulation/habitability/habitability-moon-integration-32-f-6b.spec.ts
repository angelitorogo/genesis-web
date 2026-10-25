import { describe, expect, it } from 'vitest';
import type { HabitabilityMultiplicity, HabitabilityScenarioAssessment } from '../../domain/habitability/habitability-scenario';
import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import { PlanetType } from '../../domain/planetary/planet-type';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import type { MoonTidalState } from '../../domain/planetary/moon-tidal-state';
import { MoonAtmosphereEngine } from '../planetary/moon-atmosphere-engine';
import { MoonSeed } from '../../domain/seed/hierarchical-seeds';
import type { MoonOceanReality32F2c } from '../../domain/planetary/moon-ocean-reality-32-f-2c';
import { MoonWaterRegime } from '../../domain/planetary/moon-water-regime';
import type { MoonScientificResolvedTarget } from '../planetary/moon-scientific-target-resolver';
import { MoonFormationInventoryEngine32F1d } from '../planetary/moon-formation-inventory-engine-32-f-1d';
import { MoonWaterPhaseBalanceEngine32F2a } from '../planetary/moon-water-phase-balance-32-f-2a';
import { MoonInteriorStructureEngine32F2b } from '../planetary/moon-interior-structure-engine-32-f-2b';
import { MoonOceanRealityEngine32F2c } from '../planetary/moon-ocean-reality-engine-32-f-2c';
import { HabitabilityMoonIntegration32F6b } from './habitability-moon-integration-32-f-6b';
import type { HabitabilityEnvironmentContext31_2 } from './habitability-environment-resolver-31-2';

const KEY = 'G0/S-103079215091/O1/B8/M2';
const tidal = {
  basis: 'ECCENTRICITY_TIDES_BOUNDED_SCENARIO',
  tidalHeatFluxMinimumWattsPerSquareMeter: 0.001,
  tidalHeatFluxMaximumWattsPerSquareMeter: 0.001,
  conductiveShellThicknessMinimumKilometers: 2,
  conductiveShellThicknessMaximumKilometers: 90,
  iceShellThermalRegime: 'CONDITIONAL_ICE_OCEAN',
  cryovolcanism: 'CONDITIONAL', radiogenicHeatResolved: false, oceanConfirmed: false,
} as const;
const seed = new MoonSeed('00000000000000000000000000000019');
function oceanForFlux(flux: number): MoonOceanReality32F2c {
  const physical = new MoonPhysicalProperties(8, 3, .00016, .078, 1.85, .05);
  const formation = MoonFormationInventoryEngine32F1d.fromMaterialized(
    physical, seed, PlanetType.GAS_GIANT);
  const water = MoonWaterPhaseBalanceEngine32F2a.fromMaterialized(
    physical, formation, 235.7);
  const forcing = {...tidal, tidalHeatFluxMinimumWattsPerSquareMeter: flux,
    tidalHeatFluxMaximumWattsPerSquareMeter: flux};
  const interior = MoonInteriorStructureEngine32F2b.fromMaterialized(
    physical, formation, water, forcing, 235.7);
  return MoonOceanRealityEngine32F2c.fromMaterialized(
    physical, seed, formation, water, interior, forcing, 235.7);
}
function target(model: MoonOceanReality32F2c | null, opts: {
  radiation?: boolean; chemistry?: boolean; history?: boolean; full?: boolean;
} = {}): MoonScientificResolvedTarget {
  const oceanState = model?.state === 'PRESENT_IN_SIMULATED_MODEL' ? 'PRESENT'
    : model?.state === 'ABSENT_IN_SIMULATED_MODEL' ? 'ABSENT' : 'UNRESOLVED';
  return {
    identity: { hostPlanetOrdinal: 8, moonOrdinal: 3, designation: 'INTERNAL_SECRET' },
    detail: {
      general: opts.full === false ? null : {radiusEarth: .078},
      tides: opts.full === false ? null : {tidalHeatingIndex01: .5},
      habitability: {overallHabitabilityIndex01: .536, surfaceHabitabilityIndex01: 0},
      environment: {
        estimatedSurfaceTemperatureKelvin: 235.7,
        waterRegime: MoonWaterRegime.ICE_AND_SUBSURFACE_OCEAN,
        waterInventoryIndex01: .87,
        inferredIceRichnessIndex01: .85,
        subsurfaceOceanPotentialIndex01: 1,
        atmosphereAssessment: null,
        internalWaterAssessment: tidal,
        oceanReality32F2c: model,
        radiationProtection32F3: opts.radiation ? {
          contractVersion:'32.F.3-source-separated-photon-transfer-v1',
          provenance:'V2_BOLOMETRIC_AND_CT0_GEOMETRY_WITH_NIST_PHOTON_REFERENCE',
          hostPlanetOrdinal: 8, moonOrdinal: 3,
          surfaceIonisingDoseGrayPerYear: null,
          subsurfaceIonisingDoseGrayPerYear: null,
          referenceOneMeVGammaDirectTransmissionToOcean01: 0,
          scientificLimits: ['INTERNAL_PRIVATE_RADIATION_DETAILS'],
        } : null,
        geochemicalEnergy32F4: opts.chemistry ? {
          contractVersion:'32.F.4-chemical-constraints-and-thermal-gradients-v1',
          provenance:'CT0_PHASE_AND_THERMAL_MODEL_WITH_UNIDENTIFIED_REACTANTS',
          hostPlanetOrdinal:8,moonOrdinal:3,
          solventState: oceanState === 'PRESENT' ? 'MODELLED_LIQUID_H2O_CT0'
            : 'UNRESOLVED_H2O_STATE',
          actualChemicalPowerWatts:null,
          actualChemicalDisequilibriumJoulesPerMole:null,
          generatedHeatFluxWattsPerSquareMeter:.1144,
        } : null,
        environmentalHistory32F5: opts.history ? {
          contractVersion:'32.F.5-dated-lunar-environment-v1',
          provenance:'RETAINED_V2_DATED_IRRADIANCE_AND_INDEPENDENT_LUNAR_SOURCES',
          hostPlanetOrdinal:8,moonOrdinal:3,bodyKey:KEY,
          datedIrradianceIntervalCount:3,
          currentOceanStateCT0:oceanState,
          historicalOceanContinuity:'UNKNOWN',
          intervals: [{startYear:100,endYear:1000,
            irradianceWattsPerSquareMeter:{min: 800, max: 1000},oceanState:'UNKNOWN'}],
          events:[{episodeKey:'PRIVATE_HISTORIC_EVENT_DO_NOT_LEAK'}],
        } : null,
      },
    },
  } as unknown as MoonScientificResolvedTarget;
}
function context(multiplicity: HabitabilityMultiplicity = 'SINGLE',
  perspective: HabitabilityEnvironmentContext31_2['perspective'] = 'SIMULATED_REALITY',
  grants: HabitabilityEnvironmentContext31_2['observerAccessibleEvidence'] = []):
  HabitabilityEnvironmentContext31_2 {
  return {bodyKey:KEY,multiplicity,perspective,
    time:{kind:'CURRENT_SNAPSHOT',systemAgeBillionYears:11.590601773},
    observerAccessibleEvidence:grants};
}
function criterion(s: HabitabilityScenarioAssessment, constraint:string,
  route = 'SUBSURFACE_AQUEOUS') {
  return s.routes.find(r=>r.route===route)!.constraints.find(c=>c.constraint===constraint)!;
}

describe('32.F.6b — puente físico 31.10 / CT-0 sin indices V1 ni vida', () => {
  it('la luna CT-0 presente alimenta tres criterios físicos y conserva masa', () => {
    const ocean = oceanForFlux(.001);
    expect(ocean.state).toBe('PRESENT_IN_SIMULATED_MODEL');
    const t = target(ocean);
    const r = HabitabilityMoonIntegration32F6b.assess(context(), t);
    expect(r.usedMoonResolver31_10).toBe(true);
    expect(r.ct0OceanState).toBe('PRESENT_IN_SIMULATED_MODEL');
    for(const key of ['LIQUID_RESERVOIR','PRESSURE_OR_CONFINEMENT','RESERVOIR_GEOMETRY']) {
      expect(criterion(r.assessment,key).verdict).toBe('SUPPORTS');
      expect(criterion(r.assessment,key).basis).toBe('PHYSICAL_MODEL');
    }
    expect(ocean.simulatedLiquidWaterMassKilograms! +
      ocean.simulatedSolidWaterMassKilograms!).toBeCloseTo(ocean.waterInventoryKilograms,-5);
    expect(t.detail.habitability.overallHabitabilityIndex01).toBe(.536);
    expect(r.assessment.routes[1].status).toBe('INSUFFICIENT_EVIDENCE');
  });
  it('océano CT-0 ausente contradice solo el reservorio H2O, no toda posible química', () => {
    const o = oceanForFlux(0);
    expect(o.state).toBe('ABSENT_IN_SIMULATED_MODEL');
    const r = HabitabilityMoonIntegration32F6b.assess(context(),target(o));
    expect(criterion(r.assessment,'LIQUID_RESERVOIR').verdict).toBe('CONTRADICTS');
    expect(criterion(r.assessment,'RESERVOIR_GEOMETRY').verdict).toBe('UNRESOLVED');
    expect(r.assessment.routes.find(x=>x.route==='ALTERNATIVE_CHEMISTRY')?.status)
      .toBe('MODEL_NOT_IMPLEMENTED');
  });
  it('un dominio oceánico no resuelto no se convierte en presencia ni ausencia', () => {
    const o = {...oceanForFlux(0),state:'UNRESOLVED_IN_SIMULATED_MODEL' as const};
    const r = HabitabilityMoonIntegration32F6b.assess(context(),target(o));
    expect(criterion(r.assessment,'LIQUID_RESERVOIR').verdict).toBe('UNRESOLVED');
  });
  it('un índice lunar legado alto sin océano físico no se considera reservorio', () => {
    const r = HabitabilityMoonIntegration32F6b.assess(context(),target(null));
    expect(r.ct0OceanState).toBe('NOT_AVAILABLE');
    expect(criterion(r.assessment,'LIQUID_RESERVOIR').verdict).toBe('UNRESOLVED');
  });
  it('atenuación gamma, calor y radiación estelar histórica no certifican biología', () => {
    const r = HabitabilityMoonIntegration32F6b.assess(context(),
      target(oceanForFlux(.001),{radiation:true,chemistry:true,history:true}));
    expect(r.physicalCoverage!.photonProtection).toBe('REFERENCE_PRIMARY_GAMMA_NOT_DOSE');
    expect(r.physicalCoverage!.chemicalEnergy).toBe('THERMAL_ONLY_REACTANTS_UNRESOLVED');
    expect(r.physicalCoverage!.historicalIrradianceIntervals).toBe(3);
    expect(r.physicalCoverage!.historicalOceanContinuityResolved).toBe(false);
    for(const key of ['CHEMICAL_FEASIBILITY','ENERGY_GRADIENT','RADIATION_EXPOSURE',
      'DYNAMICAL_STABILITY'])expect(criterion(r.assessment,key).verdict).toBe('UNRESOLVED');
  });
  it.each(['SINGLE','BINARY','TRIPLE'] as const)(
    'conserva la multiplicidad %s sin cambiar océano o producir falsos positivos', multiplicity => {
      const r = HabitabilityMoonIntegration32F6b.assess(context(multiplicity),
        target(oceanForFlux(.001)));
      expect(r.assessment.multiplicity).toBe(multiplicity);
      expect(criterion(r.assessment,'LIQUID_RESERVOIR').verdict).toBe('SUPPORTS');
      expect(criterion(r.assessment,'CHEMICAL_FEASIBILITY').verdict).toBe('UNRESOLVED');
    });
  it('conecta una atmósfera 32.F.1 de masa independiente sin convertir presión condicional en física', () => {
    const p = new MoonPhysicalProperties(8, 3, .00016, .078, 1.85, .05);
    const atmosphere = MoonAtmosphereEngine.assess(p, {
      hostPlanetOrdinal: 8, moonOrdinal: 3, tidalHeatingIndex01: .5,
    } as MoonTidalState, 235.7, .85, .04, {
      sourceKind:'INDEPENDENT_MASS_AND_FLUXES',sourceId:'PRIVATE_ATMOSPHERE_SOURCE',
      durationSeconds:86400,collisionCrossSectionSquareMeters:1e-19,
      gasForcings:[{gas:AtmosphereGas.NITROGEN,initialGasMassKilograms:1e18,
        replenishmentKilogramsPerSecond:0,thermalEscapeKilogramsPerSecond:0,
        particleEscapeKilogramsPerSecond:0,photolysisRatePerSecond:0,
        photolysisEscapingFraction01:1}],
    });
    const base=target(oceanForFlux(.001));
    const moon={...base,detail:{...base.detail,environment:{...base.detail.environment,
      atmosphereAssessment:atmosphere}}};
    const r=HabitabilityMoonIntegration32F6b.assess(context('SINGLE'),moon);
    expect(r.physicalCoverage?.atmosphericColumn).toBe('INDEPENDENT_PHYSICAL_BALANCE');
    expect(criterion(r.assessment,'PRESSURE_OR_CONFINEMENT','SURFACE_AQUEOUS').basis)
      .toBe('PHYSICAL_MODEL');
    expect(criterion(r.assessment,'ENERGY_GRADIENT').verdict).toBe('UNRESOLVED');
    const observed=HabitabilityMoonIntegration32F6b.assess(context('SINGLE',
      'OBSERVED_KNOWLEDGE',[{route:'SURFACE_AQUEOUS',constraint:'PRESSURE_OR_CONFINEMENT'}]),moon);
    expect(observed.physicalCoverage).toBeNull();
    expect(JSON.stringify(observed)).not.toContain('PRIVATE_ATMOSPHERE_SOURCE');
  });
  it('rechaza identidades oceánicas cruzadas sin mezclar mundos', () => {
    expect(() => HabitabilityMoonIntegration32F6b.assess(context(),target({
      ...oceanForFlux(.001),moonOrdinal:9}))).toThrow('identities differ');
  });
  it('rechaza conservación de masa físicamente incompatible', () => {
    const o = oceanForFlux(.001);
    expect(() => HabitabilityMoonIntegration32F6b.assess(context(),target({
      ...o,simulatedLiquidWaterMassKilograms:o.simulatedLiquidWaterMassKilograms! * 2,
    }))).toThrow('non-conserved');
  });
  it('rechaza química/geometría CT-0 incompatibles', () => {
    const o = oceanForFlux(.001);
    const t = target(o,{chemistry:true});
    const bad = {...t,detail:{...t.detail,environment:{...t.detail.environment,
      geochemicalEnergy32F4:{...t.detail.environment.geochemicalEnergy32F4!,
        solventState:'NO_FORMATION_H2O' as const}}}};
    expect(() => HabitabilityMoonIntegration32F6b.assess(context(),bad))
      .toThrow('geochemical solvent disagree');
  });
  it('31.12: no publica criterios CT-0 no autorizados, ni diagnósticos internos', () => {
    const t = target(oceanForFlux(.001),{radiation:true,history:true,chemistry:true});
    const closed = HabitabilityMoonIntegration32F6b.assess(
      context('TRIPLE','OBSERVED_KNOWLEDGE'),t);
    expect(criterion(closed.assessment,'LIQUID_RESERVOIR').verdict).toBe('UNRESOLVED');
    expect(criterion(closed.assessment,'PRESSURE_OR_CONFINEMENT').verdict).toBe('UNRESOLVED');
    const open = HabitabilityMoonIntegration32F6b.assess(
      context('TRIPLE','OBSERVED_KNOWLEDGE',
        HabitabilityMoonIntegration32F6b.ct0ObserverGrants(t)),t);
    expect(criterion(open.assessment,'LIQUID_RESERVOIR').verdict).toBe('SUPPORTS');
    expect(criterion(open.assessment,'ENERGY_GRADIENT').verdict).toBe('UNRESOLVED');
    expect(Object.isFrozen(open.assessment)).toBe(true);
  });
  it('no infiere radio ni ordinal en un DTO parcial: mantiene la compatibilidad 31.2', () => {
    const result = HabitabilityMoonIntegration32F6b.assess(context(),
      target(oceanForFlux(.001),{full:false}));
    expect(result.usedMoonResolver31_10).toBe(false);
    expect(criterion(result.assessment,'LIQUID_RESERVOIR').verdict).toBe('SUPPORTS');
  });
  it('el alias BINARY/TRIPLE conserva el ordinal físico del anfitrión y la identidad pública', () => {
    const original = target(oceanForFlux(.001), {radiation: true, chemistry: true, history: true});
    // Source physical planet 8 is shown as public parent-system planet 14.
    // All 32.F contracts still belong to source planet 8 and moon 3.
    const alias: MoonScientificResolvedTarget = {
      ...original,
      physicalHostPlanetOrdinal: 8,
      identity: {...original.identity, hostPlanetOrdinal: 14,
        hostPlanetDesignation: 'Parent AB-14'},
    };
    expect(alias.identity.hostPlanetOrdinal).toBe(14);
    expect(alias.detail.environment.oceanReality32F2c?.hostPlanetOrdinal).toBe(8);
    const grants = HabitabilityMoonIntegration32F6b.ct0ObserverGrants(alias);
    expect(grants.some(g => g.constraint === 'LIQUID_RESERVOIR')).toBe(true);
    const observed = HabitabilityMoonIntegration32F6b.assess(
      context('TRIPLE', 'OBSERVED_KNOWLEDGE', grants), alias);
    expect(criterion(observed.assessment,'LIQUID_RESERVOIR').verdict).toBe('SUPPORTS');
    expect(observed.physicalCoverage).toBeNull();
    const simulated = HabitabilityMoonIntegration32F6b.assess(context('BINARY'), alias);
    expect(simulated.physicalCoverage?.historicalIrradianceIntervals).toBe(3);
    expect(simulated.physicalCoverage?.chemicalEnergy).toBe('THERMAL_ONLY_REACTANTS_UNRESOLVED');
  });
  it('rechaza una procedencia lunar falsa en vez de ignorar el guard 32.F.6b', () => {
    const original = target(oceanForFlux(.001), {radiation: true});
    const alias = {...original, physicalHostPlanetOrdinal: 9,
      identity: {...original.identity, hostPlanetOrdinal: 14}};
    expect(() => HabitabilityMoonIntegration32F6b.ct0ObserverGrants(alias))
      .toThrow(/moon\/ocean identities differ/);
    const noCrosswalk = {...original, identity: {...original.identity, hostPlanetOrdinal: 14}};
    expect(() => HabitabilityMoonIntegration32F6b.ct0ObserverGrants(noCrosswalk))
      .toThrow(/moon\/ocean identities differ/);
    const wrongRadiation = {...original, physicalHostPlanetOrdinal: 8,
      identity: {...original.identity, hostPlanetOrdinal: 14},
      detail: {...original.detail, environment: {...original.detail.environment,
        radiationProtection32F3: {...original.detail.environment.radiationProtection32F3!,
          hostPlanetOrdinal: 9}}}} as MoonScientificResolvedTarget;
    expect(() => HabitabilityMoonIntegration32F6b.assess(context(), wrongRadiation))
      .toThrow(/radiation model and lunar identity differ/);
  });
  it('es determinista con los mismos modelos, sin tocar el estado del objetivo', () => {
    const t=target(oceanForFlux(.001),{radiation:true,chemistry:true,history:true});
    const original=JSON.stringify(t);
    const r=HabitabilityMoonIntegration32F6b.assess(context('BINARY'),t);
    expect(r).toEqual(HabitabilityMoonIntegration32F6b.assess(context('BINARY'),t));
    expect(JSON.stringify(t)).toBe(original);
    expect(Object.isFrozen(r.assessment)).toBe(true);
  });
});
