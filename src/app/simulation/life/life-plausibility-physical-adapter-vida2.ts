/** Typed adapters for VIDA.2. Never parse rounded fiche strings or mutate the physical model. */
import type { PlanetScientificResolvedTarget } from '../planetary/planet-scientific-target-resolver';
import type { MoonScientificResolvedTarget } from '../planetary/moon-scientific-target-resolver';
import {
  LifePlausibilityEngineVIDA2, type Vida2PhysicalRoute, type Vida2WorldAssessment,
  type Vida2Water, type Vida2Support,
} from './life-plausibility-engine-vida2';

const finite = (x: number | null | undefined): number | null =>
  x !== null && x !== undefined && Number.isFinite(x) ? x : null;

const common = (route: 'SURFACE' | 'SUBSURFACE', provenance: string): Vida2PhysicalRoute => ({
  route, provenance, water: 'UNKNOWN', temperatureKelvin: null,
  interiorLiquidModeled: false, interiorPotential: false, pressurePascal: null,
  hasIceOrRockCover: null, coverPotential: false, stellarInsolationEarth: null,
  internalHeatFluxWattsPerSquareMeter: null, internalEnergyPotential: null,
  solidSurface: null, surfaceProtectionPotential: false,
  interiorRockAquiferPotential: false, interiorGeothermalEvidence: false,
});

export class Vida2PhysicalInput {
  private constructor() {}

  static planet(target: PlanetScientificResolvedTarget): Vida2WorldAssessment {
    const p = target.detail;
    const gas = p.atmosphere.isDeepEnvelope;
    const liquid = p.surface.hasPersistentSurfaceLiquidWater;
    const coverage = p.surface.surfaceLiquidWaterCoverageFraction01;
    const water: Vida2Water = liquid && (coverage === null || coverage > 0) ? 'PRESENT'
      : (coverage !== null && coverage > 0 || (p.surface.waterLiquidFraction01 ?? 0) > 0)
        ? 'POTENTIAL'
        : p.surface.waterInventoryIndex01 <= 0 && (p.surface.waterLiquidFraction01 ?? null) === 0
          ? 'ABSENT' : 'UNKNOWN';
    const surface: Vida2PhysicalRoute = {
      ...common('SURFACE', 'Física planetaria 19–21; escenario de superficie y presión modelada'),
      water: gas ? 'ABSENT' : water,
      temperatureKelvin: finite(p.climate.meanSurfaceTemperatureKelvin),
      pressurePascal: finite(p.atmosphere.retainedSurfacePressurePascal),
      solidSurface: p.surface.hasDefinedSolidSurfaceBase && !gas,
      stellarInsolationEarth: finite(p.orbit.referenceMeanInsolationEarth),
      internalEnergyPotential: p.geology.isGeologicallyActive,
    };
    // Deep planetary oceans are not established by the legacy surface coverage.
    // A frozen H2O envelope plus internal activity may qualify as a *potential* niche.
    const iceRich = p.general.condensedIceMassFraction01 >= 0.1 && p.surface.waterInventoryIndex01 >= 0.5;
    const hypothesis = !gas && iceRich && p.geology.isGeologicallyActive;
    const modeledLayer = p.surface.h2oCT0Ledger?.forwardModelClosed === true &&
      (p.surface.h2oCT0Ledger.forwardLiquidLayerThicknessMeters ?? 0) > 0;
    // VIDA.3b: porewater and hydrothermal aquifers do not require a global deep ocean.
    // A favorable classification is a game hypothesis based on multiple independent
    // already-generated environmental indicators, NEVER a new water/heat measurement.
    const rock = p.surface.hasDefinedSolidSurfaceBase && !gas;
    const waterForAquifer = p.surface.hasPersistentSurfaceLiquidWater ||
      (p.surface.waterInventoryIndex01 >= 0.55 &&
        ((p.surface.waterLiquidFraction01 ?? 0) >= 0.2 || p.general.condensedIceMassFraction01 >= 0.08));
    const geoHeat = p.geology.isGeologicallyActive &&
      (p.geology.geologicalActivityIndex01 ?? 0) >= 0.35 &&
      (p.geology.internalHeatRetentionIndex01 ?? 0) >= 0.3;
    const aquiferPotential = rock && waterForAquifer && geoHeat;
    const subsurface: Vida2PhysicalRoute = {
      ...common('SUBSURFACE', 'Inventario de hielo y actividad interna; solo candidatura, no océano certificado'),
      water: gas ? 'ABSENT' : modeledLayer || hypothesis || aquiferPotential ? 'POTENTIAL' : 'UNKNOWN',
      interiorPotential: modeledLayer || hypothesis || aquiferPotential,
      hasIceOrRockCover: gas ? false : aquiferPotential ? true : null,
      coverPotential: iceRich || aquiferPotential,
      interiorRockAquiferPotential: aquiferPotential,
      interiorGeothermalEvidence: geoHeat,
      internalEnergyPotential: p.geology.isGeologicallyActive,
      solidSurface: p.surface.hasDefinedSolidSurfaceBase,
    };
    return LifePlausibilityEngineVIDA2.evaluate(surface, subsurface);
  }

  static moon(target: MoonScientificResolvedTarget): Vida2WorldAssessment {
    const m = target.detail;
    const e = m.environment;
    const ocean = e.oceanReality32F2c ?? null;
    const state = ocean?.state;
    const waterPotential = e.waterInventoryIndex01 >= 0.5 &&
      e.subsurfaceOceanPotentialIndex01 >= 0.6;
    const energyPotential = e.geologicalActivityIndex01 >= 0.25 ||
      m.tides.tidalHeatingIndex01 >= 0.15 || e.isGeologicallyActive;
    const icePotential = e.inferredIceRichnessIndex01 >= 0.5;
    // VIDA.3b: modest surface habitability on some moons is permitted from the
    // *joint* modeled water/temperature + atmospheric-retention indicators.
    // A pressure scenario/retention index is never silently treated as Pa.
    const atmosphere = e.atmosphereAssessment ?? null;
    const independentBalance = atmosphere?.physicalBalance32F1;
    const physicalPressure = atmosphere?.pressureBasis === 'PHYSICAL_BALANCE' &&
      independentBalance?.sourceKind === 'INDEPENDENT_MASS_AND_FLUXES'
        ? finite(independentBalance.surfacePressurePascal) : null;
    const contradictoryVacuum = physicalPressure !== null && physicalPressure < 611;
    const atmospherePotential = !contradictoryVacuum && e.hasAtmosphere === true &&
      e.atmosphereRetentionIndex01 >= 0.5 &&
      (m.habitability?.surfaceAtmosphereSupportIndex01 ?? 0.5) >= 0.4;
    // Scarce temperate moons can host *near-surface* seepage/brines inside
    // sheltered cracks. This is never an exposed global ocean or an atmosphere.
    // Joint independent game indicators: water inventory, modeled potential,
    // tidal activity and geology. No one index is enough by itself.
    const temperate = e.estimatedSurfaceTemperatureKelvin >= 260 &&
      e.estimatedSurfaceTemperatureKelvin <= 335;
    const shelteredSeep = temperate && e.waterInventoryIndex01 >= 0.3 &&
      e.surfaceLiquidWaterPotentialIndex01 >= 0.1 &&
      e.isGeologicallyActive === true && e.geologicalActivityIndex01 >= 0.35 &&
      m.tides.tidalHeatingIndex01 >= 0.35;
    const shelteredProtection = shelteredSeep && !contradictoryVacuum &&
      e.hasAtmosphere === true && e.atmosphereRetentionIndex01 >= 0.2;
    const surfaceWaterPotential = (e.hasSurfaceLiquidWater === true &&
      e.waterInventoryIndex01 >= 0.45 && e.surfaceLiquidWaterPotentialIndex01 >= 0.45)
      || shelteredSeep;
    const surface: Vida2PhysicalRoute = {
      ...common('SURFACE', shelteredSeep
        ? 'VIDA.3b: microhábitat cercano a superficie (fracturas/salmueras), supuesto procedural protegido, no mar expuesto'
        : 'VIDA.3b: agua superficial lunar candidata; retención gaseosa condicional, no presión física'),
      water: surfaceWaterPotential ? 'POTENTIAL' : 'UNKNOWN',
      temperatureKelvin: finite(e.estimatedSurfaceTemperatureKelvin),
      pressurePascal: physicalPressure,
      surfaceProtectionPotential: atmospherePotential || shelteredProtection,
      surfaceMicrohabitatKind: shelteredSeep ? 'PROTECTED_SEEP' : 'OPEN_SURFACE',
      solidSurface: true,
      stellarInsolationEarth: finite(e.referenceMeanInsolationEarth),
    };
    const water: Vida2Water = state === 'PRESENT_IN_SIMULATED_MODEL' ? 'PRESENT'
      : state === 'ABSENT_IN_SIMULATED_MODEL' ? 'ABSENT'
        : waterPotential ? 'POTENTIAL' : 'UNKNOWN';
    const cover = finite(ocean?.iceCoverThicknessKilometers);
    const subsurface: Vida2PhysicalRoute = {
      ...common('SUBSURFACE', 'Modelo oceánico lunar 32.F.2c y potencial térmico/mareal'),
      water,
      // Surface temperature, even < 100 K, is not the interior temperature.
      interiorLiquidModeled: state === 'PRESENT_IN_SIMULATED_MODEL',
      interiorPotential: state !== 'ABSENT_IN_SIMULATED_MODEL' && waterPotential,
      hasIceOrRockCover: cover === null ? null : cover > 0,
      coverPotential: icePotential && state !== 'ABSENT_IN_SIMULATED_MODEL',
      internalHeatFluxWattsPerSquareMeter: finite(ocean?.generatedTotalSurfaceHeatFluxWattsPerSquareMeter),
      internalEnergyPotential: energyPotential,
      solidSurface: true,
    };
    return LifePlausibilityEngineVIDA2.evaluate(surface, subsurface);
  }
}

export const vida2SupportLabel = (status: Vida2Support): string => ({
  FAVORABLE: 'Favorable', MARGINAL: 'Condicional',
  UNFAVORABLE: 'Desfavorable', UNKNOWN: 'Desconocido',
})[status];
