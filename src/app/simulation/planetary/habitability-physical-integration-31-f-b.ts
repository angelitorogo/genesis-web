import type { Atmosphere } from '../../domain/planetary/atmosphere';
import type { MoonSystem } from '../../domain/planetary/moon-system';
import { PlanetarySystemStabilityRegime } from '../../domain/planetary/planetary-system-stability-regime';
import type { Planet } from '../../domain/planetary/planet';
import type { HabitabilityScenarioAssessment } from '../../domain/habitability/habitability-scenario';
import {
  HabitabilityEnvironmentResolver31_2,
  type HabitabilityEnvironmentContext31_2,
} from '../habitability/habitability-environment-resolver-31-2';
import { HabitabilityResourcesResolver31_3 } from '../habitability/habitability-resources-resolver-31-3';
import { HabitabilityRadiationResolver31_4 } from '../habitability/habitability-radiation-resolver-31-4';
import { HabitabilityStabilityResolver31_5 } from '../habitability/habitability-stability-resolver-31-5';

/**
 * 31.F.b — read-only CURRENT physical assembly at the existing 19/20/21
 * materialization boundary. Nothing here generates planets, atmospheres or
 * moons, reads persistence, creates a temporal trajectory or grants discovery.
 *
 * The product is INTERNAL ground truth. The player-facing scientific card
 * MUST NOT embed/serialize this result: observation projection belongs to
 * 31.F.e, via 31.12 and explicit discovery grants.
 */
export interface InternalPhysicalHabitability31Fb {
  readonly planet: HabitabilityScenarioAssessment;
  /** Relevant 21.x moons only; unmaterialized minor moons are never invented. */
  readonly relevantMoons: readonly Readonly<{
    moonOrdinal: number;
    assessment: HabitabilityScenarioAssessment;
  }>[];
  readonly provenance: 'MATERIALIZED_19_20_21_CURRENT_CT0';
  readonly stellarRotationCoverage: 'NOT_ATTACHED';
  /** 20.7 can modify its effective water-column pressure without mutating 20.3. */
  readonly effectiveWaterColumnAlignment: 'SAME_AS_20_3' | 'DIFFERENT_FROM_20_3';
  readonly transientCoverage: 'NOT_ASSESSED';
  readonly historicalContinuity: 'NOT_EVALUATED';
}

export class HabitabilityPhysicalIntegration31Fb {
  private constructor() {}

  static assessMaterialized(
    planet: Planet,
    atmosphere: Atmosphere,
    moonSystem: MoonSystem,
  ): InternalPhysicalHabitability31Fb {
    if (atmosphere.hostPlanet !== planet || moonSystem.hostPlanet !== planet ||
        planet.hostPlanetarySystem !== atmosphere.hostPlanet.hostPlanetarySystem ||
        planet.planetOrdinal !== atmosphere.waterInventory.planetOrdinal ||
        planet.planetOrdinal !== atmosphere.retentionState.planetOrdinal ||
        planet.planetOrdinal !== atmosphere.climateState.planetOrdinal) {
      throw new RangeError('31.F.b requires already-materialized states for the same physical planet.');
    }
    const { locator, hostPlanetarySystem } = planet;
    const multiplicityName = hostPlanetarySystem.hostStellarSystem.multiplicity.name;
    const multiplicity: HabitabilityEnvironmentContext31_2['multiplicity'] =
      multiplicityName === 'SINGLE' || multiplicityName === 'BINARY' || multiplicityName === 'TRIPLE'
        ? multiplicityName : 'UNKNOWN';
    // Point-16 does not hand off a dated stellar/rotation profile here.
    // Age is deliberately unknown: a present-day climate cannot date history.
    const context: HabitabilityEnvironmentContext31_2 = Object.freeze({
      bodyKey: bodyKey(locator), multiplicity, perspective: 'SIMULATED_REALITY',
      time: Object.freeze({ kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: null }),
      observerAccessibleEvidence: Object.freeze([]),
    });

    // 20.7 may use a water-vapor/effective column that differs from the
    // frozen 20.3 gas column; this is a documented legacy handoff, not a
    // license to overwrite either source. Preserve 20.7 for the aqueous
    // environment and avoid declaring contradictory 20.3 gas evidence as
    // a single coherent column when those pressure baselines differ.
    const waterPressure = atmosphere.waterInventory.sourceRetainedSurfacePressurePascal;
    const retainedPressure = atmosphere.retentionState.retainedSurfacePressurePascal;
    const sameColumn = waterPressure === null && retainedPressure === null ||
      waterPressure !== null && retainedPressure !== null &&
      Math.abs(waterPressure - retainedPressure) <=
        1e-6 * Math.max(1, Math.abs(waterPressure), Math.abs(retainedPressure));
    const coherentRetention = sameColumn ? atmosphere.retentionState : null;

    const environment = HabitabilityEnvironmentResolver31_2.assessPlanet(context, {
      water: atmosphere.waterInventory,
      atmosphere: coherentRetention,
      climate: atmosphere.climateState,
    });
    const resources = HabitabilityResourcesResolver31_3.assessPlanet(context, environment, {
      physical: planet.physicalProperties,
      atmosphere: coherentRetention,
      climate: atmosphere.climateState,
      variability: atmosphere.climateVariabilityState,
      geology: atmosphere.geologyState,
      // 31.3 enumerates the supplied composition's numeric mass budget.
      // Pass a narrow projection, never a domain entity with locator/seed fields.
      composition: {
        planetOrdinal: planet.planetOrdinal,
        metallicCoreMassEarth: planet.internalComposition.metallicCoreMassEarth,
        silicateInteriorMassEarth: planet.internalComposition.silicateInteriorMassEarth,
        condensedIceMassEarth: planet.internalComposition.condensedIceMassEarth,
        volatileRichInteriorMassEarth: planet.internalComposition.volatileRichInteriorMassEarth,
      },
    });
    const radiation = HabitabilityRadiationResolver31_4.assessPlanet(context, resources.assessment, {
      planetOrdinal: planet.planetOrdinal,
      radiation: atmosphere.surfaceRadiationState,
      magnetosphere: atmosphere.magnetosphereState,
      retainedPressurePascal: atmosphere.retentionState.retainedSurfacePressurePascal,
      // No actual direct magnetic observation has been supplied.
      measurement: null,
    });
    const stability = HabitabilityStabilityResolver31_5.assessPlanet(context, radiation.assessment, {
      planetOrdinal: planet.planetOrdinal,
      orbital: [PlanetarySystemStabilityRegime.EMPTY,
        PlanetarySystemStabilityRegime.DYNAMICALLY_EXCLUDED].includes(
          hostPlanetarySystem.stabilityAssessment.regime)
        ? null : hostPlanetarySystem.stabilityAssessment,
      climate: atmosphere.climateVariabilityState,
      // The 15.5 rotation profile and phase-29 per-body impact/effect mapping
      // are not attached to this frozen 19/20/21 aggregate.
      stellarHosts: null,
      transients: null,
    });

    const relevantMoons = moonSystem.relevantMoons.map(moon => {
      if (moon.hostPlanetOrdinal !== planet.planetOrdinal ||
          moon.environmentState.hostPlanetOrdinal !== planet.planetOrdinal ||
          moon.environmentState.moonOrdinal !== moon.moonOrdinal) {
        throw new RangeError('31.F.b refuses a moon environment from a different host or ordinal.');
      }
      const moonContext: HabitabilityEnvironmentContext31_2 = Object.freeze({
        ...context,
        bodyKey: `${context.bodyKey}/M${moon.moonOrdinal - 1}`,
      });
      const moonEnvironment = HabitabilityEnvironmentResolver31_2.assessMoon(
        moonContext, moon.environmentState);
      const moonResources = HabitabilityResourcesResolver31_3.assessMoon(
        moonContext, moonEnvironment, moon.environmentState);
      const moonRadiation = HabitabilityRadiationResolver31_4.assessMoon(
        moonContext, moonResources.assessment,
        { moon: moon.environmentState, measurement: null });
      const moonStability = HabitabilityStabilityResolver31_5.assessMoon(
        moonContext, moonRadiation.assessment,
        { hostPlanetOrdinal: planet.planetOrdinal, moonOrdinal: moon.moonOrdinal,
          stellarHosts: null, transients: null });
      return Object.freeze({ moonOrdinal: moon.moonOrdinal, assessment: moonStability.assessment });
    });

    return Object.freeze({
      planet: stability.assessment,
      relevantMoons: Object.freeze(relevantMoons),
      provenance: 'MATERIALIZED_19_20_21_CURRENT_CT0',
      stellarRotationCoverage: 'NOT_ATTACHED',
      effectiveWaterColumnAlignment: sameColumn ? 'SAME_AS_20_3' : 'DIFFERENT_FROM_20_3',
      transientCoverage: 'NOT_ASSESSED',
      historicalContinuity: 'NOT_EVALUATED',
    });
  }
}

function bodyKey(locator: Planet['locator']): string {
  return `G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}/B${locator.bodyIndex}`;
}
