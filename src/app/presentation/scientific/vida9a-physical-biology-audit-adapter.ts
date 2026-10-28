/** Read-only adapter: uses exactly the same snapshots displayed in the scientific fiche.
 * Deliberately does not call simulation engines or repositories. */
import type { PlanetScientificResolvedTarget } from '../../simulation/planetary/planet-scientific-target-resolver';
import type { MoonScientificResolvedTarget } from '../../simulation/planetary/moon-scientific-target-resolver';
import type { Vida5AtmosphericFeedback } from '../../domain/life/vida5-biogenic-atmosphere';
import type { Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';
import { Vida9aPhysicalBiologyCoherence, type Vida9aAuditResult, type Vida9aBiologySummary } from './vida9a-physical-biology-coherence';

function biology(record: Vida9BiologyRecord): Vida9aBiologySummary {
  return {
    nativeLife: record.nativeLifePresent,
    nativeIntelligence: record.nativeIntelligencePresent,
    nativeCivilization: record.nativeCivilizationPresent,
    introducedLife: record.introducedLifePresent,
    colonialPopulation: record.colonialPopulationPresent,
    speciesIds: record.ecosystem.species.map(species => species.id),
    relationCount: record.ecosystem.relations.length,
    relationEndpoints: record.ecosystem.relations.map(r => ({
      sourceSpeciesId: r.sourceSpeciesId, targetSpeciesId: r.targetSpeciesId,
    })),
    intelligenceSpeciesId: record.intelligence.intelligentSpecies?.speciesId ?? null,
    civilizationFounderSpeciesId: record.intelligence.civilization?.founderSpeciesId ?? null,
    colonyCount: record.colonization.colonies.length,
  };
}
export function planetVida9aAudit(
  physical: PlanetScientificResolvedTarget,
  effective: PlanetScientificResolvedTarget,
  feedback: Vida5AtmosphericFeedback | undefined,
  record: Vida9BiologyRecord,
): Vida9aAuditResult {
  const geo = physical.detail.geochemistryPRE3307 ?? null;
  return Vida9aPhysicalBiologyCoherence.planet({
    kind:'PLANET',
    baseline: {
      temperatureKelvin: physical.detail.climate.meanSurfaceTemperatureKelvin,
      pressurePascal: physical.detail.atmosphere.retainedSurfacePressurePascal,
    },
    effective: {
      temperatureKelvin: effective.detail.climate.meanSurfaceTemperatureKelvin,
      pressurePascal: effective.detail.atmosphere.retainedSurfacePressurePascal,
    },
    feedback: feedback ?? null,
    surfaceDiverseEcosystem:record.ecosystem.regime === 'SURFACE_DIVERSE',
    surface: {
      hasDefinedSolidSurface:physical.detail.surface.hasDefinedSolidSurfaceBase,
      hasPersistentLiquidWater:physical.detail.surface.hasPersistentSurfaceLiquidWater,
      coverage01: physical.detail.surface.surfaceLiquidWaterCoverageFraction01,
    },
    geochemistry: geo ? {
      niche:geo.niche.niche, solventState:geo.niche.solventState,
      liquidWaterKilograms:geo.formationSensitivityPRE3307?.liquidWaterKilograms ?? null,
      hasPositiveResolvedPower:geo.hasPositiveResolvedPower,
    } : null,
    biology:biology(record),
  });
}
export function moonVida9aAudit(
  physical: MoonScientificResolvedTarget,
  record: Vida9BiologyRecord,
): Vida9aAuditResult {
  const geo = physical.detail.environment.geochemistryPRE3307 ?? null;
  return Vida9aPhysicalBiologyCoherence.moon({
    kind:'MOON',
    oceanState:physical.detail.environment.oceanReality32F2c?.state ?? null,
    geochemistry: geo ? {niche:geo.niche.niche,solventState:geo.niche.solventState} : null,
    biology:biology(record),
  });
}
