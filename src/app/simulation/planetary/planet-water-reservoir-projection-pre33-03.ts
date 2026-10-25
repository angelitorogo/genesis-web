import type { Planet } from '../../domain/planetary/planet';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import { AtmosphereGas, atmosphereGasMolarMassGramsPerMole } from '../../domain/planetary/atmosphere-gas';
import type { EnvironmentalEvidencePRE3301 as E } from '../../domain/planetary/environmental-physical-contract-pre33-01';
import {
  environmentalModelledPRE3301 as model,
  environmentalConditionalPRE3301 as conditional,
  environmentalUnknownPRE3301 as unknown,
  environmentalNotApplicablePRE3301 as na,
} from '../../domain/planetary/environmental-physical-contract-pre33-01';
import {
  PLANET_WATER_RESERVOIR_CONTRACT_PRE3303,
  type PlanetWaterReservoirContractPRE3303 as Profile,
  validatePlanetWaterReservoirPRE3303,
} from '../../domain/planetary/planet-water-reservoir-contract-pre33-03';
import { reconcilePlanetAtmosphericPressurePRE3302 } from './planet-atmospheric-pressure-coherence-pre33-02';

const EARTH_MASS_KG = 5.9722e24;
const EARTH_RADIUS_METERS = 6_371_000;
const FOUR_PI = 4 * Math.PI;

/**
 * PRE-33.03: CT-0 non-mutating projection of EXISTING 19.2/19.5/20.3/20.4/20.7.
 * It conserves the 19.5 COARSE MATERIAL mass budget and derives only an
 * explicitly conditional atmospheric H2O vapor COLUMN. No water mass is
 * fabricated from the old inventory index, phase fractions or condensation Pa.
 * Deep envelopes are NOT treated as oceans or exposed solid surfaces.
 */
export class PlanetWaterReservoirProjectionPRE3303 {
  private constructor() {}

  static planet(planet: Planet, atmosphere: Atmosphere): Profile {
    const p = reconcilePlanetAtmosphericPressurePRE3302(planet, atmosphere);
    if (p.status === 'INCONSISTENT') {
      throw new RangeError(`PRE-33.03 requires PRE-33.02 coherent pressure/host: ${p.issues.join(',')}`);
    }
    const bulk = planet.physicalProperties;
    const interior = planet.internalComposition;
    const water = atmosphere.waterInventory;
    const deep = p.status === 'CONSISTENT_DEEP_ENVELOPE';
    const massGroups = [interior.metallicCoreMassEarth,
      interior.silicateInteriorMassEarth, interior.condensedIceMassEarth,
      interior.volatileRichInteriorMassEarth, interior.gaseousEnvelopeMassEarth];
    for (const value of [...massGroups, bulk.massEarth, bulk.accretedEnvelopeMassEarth,
      bulk.surfaceGravityMetersPerSecondSquared, bulk.radiusEarth]) {
      if (!Number.isFinite(value) || value < 0)
        throw new RangeError('PRE-33.03 invalid physical mass/radius/gravity');
    }
    if (bulk.massEarth <= 0 || bulk.radiusEarth <= 0 ||
        bulk.surfaceGravityMetersPerSecondSquared <= 0 ||
        Math.abs(massGroups.reduce((a, b) => a + b, 0) - bulk.massEarth) >
          Math.max(1e-9, bulk.massEarth * 1e-6) ||
        Math.abs(interior.gaseousEnvelopeMassEarth - bulk.accretedEnvelopeMassEarth) >
          Math.max(1e-9, bulk.massEarth * 1e-6)) {
      throw new RangeError('PRE-33.03 point-19.2/19.5 material mass budget is inconsistent');
    }
    const bodyKey = `G${planet.locator.galaxyIndex}/S${planet.locator.sectorKey}/` +
      `O${planet.locator.galacticObjectIndex}/B${planet.locator.bodyIndex}`;
    const material = (value: number, label: string) => model(value * EARTH_MASS_KG,
      'BULK_19_21', 'BULK_PHYSICAL', `19.5 CT-0 ${label}: coarse MATERIAL mass, NOT water`);
    const conditionalFraction = (v: number | null, note: string): E<number> =>
      v === null ? unknown(note, 'WATER_20_7')
      : Number.isFinite(v) && v >= 0 && v <= 1
        ? conditional(v, 'WATER_20_7', 'LEGACY_ESTIMATE', note)
        : invalid('PRE-33.03 invalid phase-20.7 fraction');
    const absentSurface = 'No exposed solid surface in the phase-20 deep-envelope model';
    const unresolvedMass = (kind: string): E<number> => unknown(
      `${kind}: 19.5 carrier buckets are not species-resolved H2O; 20.7 index is not a kilogram inventory`,
      'NO_QUANTIFIED_SOURCE');
    const waterIndex = water.waterInventoryIndex01;
    const phase = atmosphere.greenhouseEffect.condensableEquilibriumState;
    const effectivePressure = p.effectiveGasPressure20_4Pascal;
    // Only a converged, explicit 20.4 mixture can supply the conditional H2O column.
    // 0.0 pressure is a conditional zero-gas COLUMN, not proof of no other H2O.
    let vaporP: E<number> = unknown('No converged H2O species equilibrium at CT-0', 'ATMOSPHERE_20_3');
    let vaporColumn: E<number> = unknown('Effective gas mixture or vertical column unresolved', 'ATMOSPHERE_20_3');
    let vaporGlobal: E<number> = unknown('Effective gas mixture or vertical column unresolved', 'ATMOSPHERE_20_3');
    let condensedH2O: E<number> = unknown('H2O phase-change diagnostic unresolved', 'ATMOSPHERE_20_3');
    if (deep) {
      vaporP = na(absentSurface);
      vaporColumn = na(absentSurface);
      vaporGlobal = na(absentSurface);
      condensedH2O = na(absentSurface);
    } else if (phase?.converged && effectivePressure !== null) {
      const gases = phase.effectiveGasComponents;
      const sumMoles = gases.reduce((a, g) => a + g.moleFraction01, 0);
      const sumMolarMass = gases.reduce((a, g) =>
        a + g.moleFraction01 * atmosphereGasMolarMassGramsPerMole(g.gas), 0);
      if (new Set(gases.map(g => g.gas)).size !== gases.length ||
          gases.some(g => !Number.isFinite(g.moleFraction01) || g.moleFraction01 < 0 ||
          !Number.isFinite(atmosphereGasMolarMassGramsPerMole(g.gas))) ||
          gases.length && Math.abs(sumMoles - 1) > 1e-6) {
        throw new RangeError('PRE-33.03 invalid 20.4 effective gas composition');
      }
      if (effectivePressure === 0 || gases.length && sumMolarMass > 0) {
        const waterFraction = gases.find(g => g.gas === AtmosphereGas.WATER_VAPOR)?.moleFraction01 ?? 0;
        const partial = effectivePressure * waterFraction;
        const vaporEquilibrium = atmosphere.greenhouseEffect.waterVaporEquilibriumState;
        if (vaporEquilibrium && typeof vaporEquilibrium.effectiveWaterVaporPartialPressurePascal === 'number' &&
          (!Number.isFinite(vaporEquilibrium.effectiveWaterVaporPartialPressurePascal) ||
           Math.abs(vaporEquilibrium.effectiveWaterVaporPartialPressurePascal - partial) >
             1e-6 * Math.max(1, partial)))
          throw new RangeError('PRE-33.03 H2O partial-pressure mismatch between 20.4 diagnostics');
        const column = effectivePressure === 0 ? 0 :
          effectivePressure / bulk.surfaceGravityMetersPerSecondSquared *
          waterFraction * atmosphereGasMolarMassGramsPerMole(AtmosphereGas.WATER_VAPOR) / sumMolarMass;
        const global = FOUR_PI * Math.pow(bulk.radiusEarth * EARTH_RADIUS_METERS, 2) * column;
        if (![partial, column, global].every(x => Number.isFinite(x) && x >= 0))
          throw new RangeError('PRE-33.03 H2O hydrostatic estimate exceeds finite domain');
        vaporP = conditional(partial, 'ATMOSPHERE_20_3', 'HYPOTHETICAL_COLUMN',
          '20.4 effective H2O partial pressure; thermodynamic snapshot, not an independent atmosphere');
        vaporColumn = conditional(column, 'ATMOSPHERE_20_3', 'HYPOTHETICAL_COLUMN',
          'Approx. well-mixed hydrostatic column P/g × H2O mass fraction; NOT a conserved water reservoir');
        vaporGlobal = conditional(global, 'ATMOSPHERE_20_3', 'HYPOTHETICAL_COLUMN',
          'Spherical radius-scaled atmospheric vapor estimate; NOT measured/retained water mass');
      }
      const speciesWater = phase.speciesEquilibria.find(s => s.gas === AtmosphereGas.WATER_VAPOR);
      if (speciesWater) {
        const diff = speciesWater.condensedPartialPressurePascal;
        if (!Number.isFinite(diff) || diff < 0)
          throw new RangeError('PRE-33.03 invalid 20.4 H2O condensation');
        condensedH2O = conditional(diff, 'ATMOSPHERE_20_3', 'HYPOTHETICAL_COLUMN',
          'Equivalent H2O partial-pressure change; NOT liquid-ocean pressure or water mass');
      } else if (p.phaseBasis === 'MULTISPECIES_20_4') {
        condensedH2O = conditional(0, 'ATMOSPHERE_20_3', 'HYPOTHETICAL_COLUMN',
          'No H2O change in modeled condensables; NOT proof of absent liquid water');
      }
    }
    const profile: Profile = {
      contractVersion: PLANET_WATER_RESERVOIR_CONTRACT_PRE3303,
      perspective: 'INTERNAL_SIMULATED_REALITY', epoch: 'CT0', bodyKey,
      surfaceDomain: deep ? 'DEEP_ENVELOPE_NO_SOLID_SURFACE' : 'SOLID_SURFACE_MODEL',
      sourcePressureStatus: p.status,
      constituents: Object.freeze({
        condensedIceBearingMaterialKilograms: material(interior.condensedIceMassEarth, 'ice-bearing material'),
        volatileRichInteriorMaterialKilograms: material(interior.volatileRichInteriorMassEarth, 'volatile-rich material'),
        gaseousEnvelopeMaterialKilograms: material(interior.gaseousEnvelopeMassEarth, 'gaseous envelope material'),
      }),
      water: Object.freeze({
        inheritedWaterInventoryIndex01: conditionalFraction(waterIndex,
          '20.7 dimensionless water proxy; no conversion to ocean mass'),
        estimatedSurfaceLiquidCoverage01: deep ? na<number>(absentSurface) : conditionalFraction(
          water.surfaceLiquidWaterCoverageFraction01, '20.7 estimated representative surface liquid coverage'),
        estimatedSurfaceIceCoverage01: deep ? na<number>(absentSurface) : conditionalFraction(
          water.surfaceIceCoverageFraction01, '20.7 estimated representative surface ice coverage'),
        totalH2OMassKilograms: unresolvedMass('Global H2O mass'),
        surfaceLiquidMassKilograms: unresolvedMass('Liquid surface reservoir mass'),
        subsurfaceLiquidMassKilograms: unresolvedMass('Subsurface liquid reservoir mass'),
        interiorBoundWaterMassKilograms: unresolvedMass('Chemically bound interior H2O mass'),
        deepEnvelopeLiquidLayerMassKilograms: unresolvedMass('High-pressure liquid layer mass'),
      }),
      atmosphere: Object.freeze({
        effectiveWaterVaporPartialPressurePascal: vaporP,
        approximateWaterVaporColumnKilogramsPerSquareMeter: vaporColumn,
        approximateGlobalWaterVaporMassKilograms: vaporGlobal,
        condensedH2OEquivalentPressurePascal: condensedH2O,
        independentMassFluxAtmosphereCertified: false,
      }),
      deepEnvelope: Object.freeze({
        physicalTotalEnvelopeMassKilograms: material(interior.gaseousEnvelopeMassEarth,
          'actual accreted gaseous envelope'),
        pressureTemperatureProfile: deep ? unknown<number>(
          'No resolved vertical P-T profile, EOS, opacity or composition in phase 20', 'NO_QUANTIFIED_SOURCE')
          : na<number>('No phase-20 deep gaseous envelope pressure profile'),
        waterPhaseBoundaryDepthMeters: deep ? unknown<number>(
          'Pressure/temperature crossing requires EOS, composition and vertical structure', 'NO_QUANTIFIED_SOURCE')
          : na<number>('No deep gaseous envelope interface'),
        waterChemicalSpeciation: 'UNRESOLVED',
      }),
      physicalWaterMassConserved: false,
      habitableEnvironmentCertified: false,
      lifeEvaluated: false,
    };
    const issues = validatePlanetWaterReservoirPRE3303(profile);
    if (issues.length) throw new RangeError(`PRE-33.03 invalid reservoir contract: ${issues.join(',')}`);
    return Object.freeze(profile);
  }
}

function invalid(message: string): never { throw new RangeError(message); }
