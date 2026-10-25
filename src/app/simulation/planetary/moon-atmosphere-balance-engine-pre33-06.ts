import { atmosphereGasMolarMassGramsPerMole } from '../../domain/planetary/atmosphere-gas';
import type { MoonAtmosphereAssessment } from '../../domain/planetary/moon-atmosphere-assessment';
import type { MoonIndependentExobasePRE3306, MoonAtmosphereBalancePRE3306, MoonAtmosphereStatusPRE3306 } from '../../domain/planetary/moon-atmosphere-balance-pre33-06';

const EARTH_RADIUS_METERS = 6_371_000;
const EARTH_GRAVITY = 9.80665;
const BOLTZMANN = 1.380649e-23;
const AVOGADRO = 6.02214076e23;
const close = (a: number, b: number) => Math.abs(a-b) <= 1e-8*Math.max(1,Math.abs(a),Math.abs(b));
const finiteNonnegative = (x:number) => Number.isFinite(x) && x>=0;
export interface MoonAtmosphereGeometryPRE3306 {
  readonly hostPlanetOrdinal:number;
  readonly moonOrdinal:number;
  readonly massEarth:number;
  readonly radiusEarth:number;
  readonly surfaceGravityEarth:number;
}

/**
 * PRE-33.06 audits independently sourced rates from 32.F.1. In its absence,
 * no gas source or loss is inferred from insolation, geology, ice, formation
 * endmembers or the legacy retention index. No exobase or EUV is invented.
 */
export class MoonAtmosphereBalanceEnginePRE3306 {
  private constructor() {}

  static fromMaterialized(
    moon: MoonAtmosphereGeometryPRE3306,
    assessment: MoonAtmosphereAssessment | null,
    exobase: MoonIndependentExobasePRE3306 | null = null,
  ): MoonAtmosphereBalancePRE3306 {
    if (!Number.isSafeInteger(moon.moonOrdinal) || moon.moonOrdinal < 1 ||
        !Number.isSafeInteger(moon.hostPlanetOrdinal) || moon.hostPlanetOrdinal < 1 ||
        !Number.isFinite(moon.massEarth) || moon.massEarth <= 0 ||
        !Number.isFinite(moon.radiusEarth) || moon.radiusEarth <= 0 ||
        !Number.isFinite(moon.surfaceGravityEarth) || moon.surfaceGravityEarth <= 0) {
      throw new RangeError('PRE-33.06 requires finite V3 materialized moon identity and geometry.');
    }
    const radius = moon.radiusEarth*EARTH_RADIUS_METERS;
    const area = 4*Math.PI*radius**2;
    const gravity = moon.surfaceGravityEarth*EARTH_GRAVITY;
    const kgPerPa = area/gravity;
    const scenario = assessment?.pressureBasis==='CONDITIONAL_SCENARIO' &&
      assessment.estimatedSurfacePressurePascal!==null &&
      finiteNonnegative(assessment.estimatedSurfacePressurePascal)
      ? assessment.estimatedSurfacePressurePascal : null;
    const scenarioPartials = scenario===null ? [] : (assessment?.species ?? [])
      .filter(s=>finiteNonnegative(s.partialPressurePascal))
      .map(s=>Object.freeze({gas:s.gas,pressurePascal:s.partialPressurePascal}));
    const balance = assessment?.physicalBalance32F1?.sourceKind==='INDEPENDENT_MASS_AND_FLUXES'
      ? assessment.physicalBalance32F1 : null;
    if (exobase !== null && balance === null) {
      throw new RangeError('PRE-33.06 exobase cannot substitute for missing gas mass/rate forcing.');
    }
    if (balance !== null && (!balance.sourceId.trim() || !finiteNonnegative(balance.initialGasMassKilograms) ||
       !finiteNonnegative(balance.remainingGasMassKilograms) || !Number.isFinite(balance.durationSeconds) || balance.durationSeconds<=0)) {
      throw new RangeError('PRE-33.06 invalid independent mass/rate provenance.');
    }
    let status:MoonAtmosphereStatusPRE3306 = 'MISSING_INDEPENDENT_GAS_INVENTORY';
    let kn:number|null = null;
    const physicalPartials: {gas:typeof scenarioPartials[number]['gas'];pressurePascal:number}[] = [];
    let physicalPressure:number|null = null;
    if(balance!==null) {
      status='MISSING_INDEPENDENT_EXOBASE_AND_HIGH_ENERGY_FORCING';
      if(balance.gasResults.some(g=>!finiteNonnegative(g.gasMassKilograms)||!finiteNonnegative(g.partialPressurePascal)) ||
          !balance.gasResults.every(g=>close(g.gasMassKilograms/kgPerPa,g.partialPressurePascal)) ||
          !close(balance.gasResults.reduce((s,g)=>s+g.gasMassKilograms,0),balance.remainingGasMassKilograms)) {
        throw new RangeError('PRE-33.06 independent species masses do not close against physical geometry.');
      }
      const massOut=balance.thermalEscapedMassKilograms+balance.particleEscapedMassKilograms+
        balance.photolysisEscapedMassKilograms+balance.photochemicalProductMassKilograms+balance.condensedMassKilograms;
      if(![balance.replenishedMassKilograms,balance.thermalEscapedMassKilograms,
        balance.particleEscapedMassKilograms,balance.photolysisEscapedMassKilograms,
        balance.photochemicalProductMassKilograms,balance.condensedMassKilograms].every(finiteNonnegative) ||
        !close(balance.initialGasMassKilograms+balance.replenishedMassKilograms,
          balance.remainingGasMassKilograms+massOut)) {
        status='MISSING_INDEPENDENT_SOURCE_SINK_RATES';
      } else if(balance.photochemicalProductMassKilograms>1e-12*Math.max(1,balance.remainingGasMassKilograms)) {
        status='PHOTOCHEMICAL_PRODUCTS_UNIDENTIFIED';
      } else if(exobase!==null) {
        const numeric=[exobase.exobaseAltitudeMeters,exobase.exobaseTemperatureKelvin,
          exobase.exobaseNumberDensityPerCubicMeter,exobase.collisionCrossSectionSquareMeters,
          exobase.euvEnergyFluxWattsPerSquareMeter,
          exobase.incidentParticleNumberFluxPerSquareMeterPerSecond];
        if(!exobase.sourceId.trim() || numeric.some(x=>!finiteNonnegative(x)) ||
          exobase.exobaseTemperatureKelvin===0 || exobase.exobaseNumberDensityPerCubicMeter===0 ||
          exobase.collisionCrossSectionSquareMeters===0) {
          throw new RangeError('PRE-33.06 independent exobase and high-energy forcing incomplete.');
        }
        const molCount=balance.gasResults.reduce((s,g)=>s+g.gasMassKilograms/
          (atmosphereGasMolarMassGramsPerMole(g.gas)/1000)*AVOGADRO,0);
        const meanMass=molCount>0?balance.remainingGasMassKilograms/molCount:null;
        if(meanMass!==null) {
          const gExo=gravity*(radius/(radius+exobase.exobaseAltitudeMeters))**2;
          const scaleHeight=BOLTZMANN*exobase.exobaseTemperatureKelvin/(meanMass*gExo);
          kn=1/(Math.SQRT2*exobase.exobaseNumberDensityPerCubicMeter*
            exobase.collisionCrossSectionSquareMeters*scaleHeight);
        }
        if(meanMass===null || kn===null || !Number.isFinite(kn) || kn<0.01 || kn>100) {
          status='EXOBASE_OUTSIDE_COLLISIONAL_TRANSITION_DOMAIN';
        } else if(balance.surfacePressurePascal!==null &&
          close(balance.remainingGasMassKilograms/kgPerPa,balance.surfacePressurePascal)) {
          status='INDEPENDENT_INTERVAL_MODEL_NOT_OBSERVATION';
          physicalPressure=balance.surfacePressurePascal;
          physicalPartials.push(...balance.gasResults.map(g=>({gas:g.gas,pressurePascal:g.partialPressurePascal})));
        } else {
          status='PHOTOCHEMICAL_PRODUCTS_UNIDENTIFIED';
        }
      }
    }
    const limits=[
      'Los índices V1 y el escenario de presión no aportan masa gaseosa independiente ni tasas kg/s.',
      'Sin exobase, fuente EUV/partículas y balance químico trazable no se autoriza presión física PRE-33.06.',
      'Una presión de intervalo modelado no constituye observación ni demuestra estabilidad histórica.',
    ];
    return Object.freeze({
      contractVersion:'PRE-33.06/V3-INDEPENDENT-LUNAR-ATMOSPHERE/v1' as const,
      provenance:'V3_MATERIALIZED_GEOMETRY_AND_32F1_ONLY_NO_V1_GAS_INFERENCE' as const,
      hostPlanetOrdinal:moon.hostPlanetOrdinal,moonOrdinal:moon.moonOrdinal,status,
      surfaceAreaSquareMeters:area,kilogramsOfGasPerPascal:kgPerPa,
      scenarioPressurePascal:scenario,
      scenarioEquivalentGasMassKilograms:scenario===null?null:scenario*kgPerPa,
      scenarioPartialPressuresPascal:Object.freeze(scenarioPartials),
      independentSourceId:balance?.sourceId??null,
      independentExobaseSourceId:exobase?.sourceId??null,
      initialGasMassKilograms:balance?.initialGasMassKilograms??null,
      remainingGasMassKilograms:balance?.remainingGasMassKilograms??null,
      replenishedMassKilograms:balance?.replenishedMassKilograms??null,
      thermalEscapeMassKilograms:balance?.thermalEscapedMassKilograms??null,
      particleEscapeMassKilograms:balance?.particleEscapedMassKilograms??null,
      photolysisEscapedMassKilograms:balance?.photolysisEscapedMassKilograms??null,
      photochemicalProductMassKilograms:balance?.photochemicalProductMassKilograms??null,
      condensedMassKilograms:balance?.condensedMassKilograms??null,
      independentExobaseKnudsenNumber:kn,
      physicalSurfacePressurePascal:physicalPressure,
      physicalPartialPressuresPascal:Object.freeze(physicalPartials),
      physicalSurfacePressureObserved:false as const,
      actualAtmospherePresenceCertified:false as const,
      historicalPersistenceCertified:false as const,
      scientificLimitations:Object.freeze(limits),
    });
  }
}
