import { type Atmosphere } from '../../domain/planetary/atmosphere';
import { MinorBodyApproachTargetKind } from '../../domain/planetary/minor-body-approach-target-kind';
import {
  impactBulkDisruptionPotentialIndexV1,
  impactSurfaceResponseRegimeV1,
  impactTargetResponseSeverityIndexV1,
  MinorBodyImpactEffectsAssessment,
} from '../../domain/planetary/minor-body-impact-effects-assessment';
import { MinorBodyImpactEffectsCatalog } from '../../domain/planetary/minor-body-impact-effects-catalog';
import { type MinorBodyImpactEnergyAssessment } from '../../domain/planetary/minor-body-impact-energy-assessment';
import { type MinorBodyImpactEnergyCatalog } from '../../domain/planetary/minor-body-impact-energy-catalog';
import { MinorBodyImpactSurfaceResponseRegime } from '../../domain/planetary/minor-body-impact-surface-response-regime';
import { type RelevantMoon } from '../../domain/planetary/relevant-moon';

const AU_KILOMETERS=149_597_870.7;
const EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED=9.80665;
const ATMOSPHERIC_IMPACT_COUPLING_FRACTION=0.01;

interface TargetEnvironmentV1 {
  readonly hasSolidSurface:boolean;
  readonly hasAtmosphere:boolean;
  readonly atmosphereRetentionIndex01:number|null;
  readonly retainedSurfacePressurePascal:number|null;
  readonly waterInventoryIndex01:number|null;
}

/**
 * Point-23.10 deterministic conditional target-effects engine.
 *
 * The engine consumes the exact point-23.9 catalog and the already-materialized
 * phase-20 Atmosphere aggregates for planetary targets. Lunar targets consume the
 * frozen point-21.5 environment embedded in RelevantMoon. It does not roll the
 * point-23.8 probability, alter phase-20/21 source states, or create a historical
 * event; point 23.13 remains responsible for realized traceable impacts.
 *
 * V1 uses zero new seeds, hashes and PRNG draws. Solid targets receive a capped
 * first-order crater scaling plus normalized atmosphere/water/geology/ejecta
 * response proxies. Deep-envelope planets deliberately receive no invented solid
 * surface, crater, hydrosphere or geology outputs.
 */
export class ImpactEffectsEngine {
  private constructor() {}

  static generate(
    impactEnergyCatalog:MinorBodyImpactEnergyCatalog,
    atmospheres:readonly Atmosphere[],
  ):MinorBodyImpactEffectsCatalog {
    assertUniqueAtmospheresV1(atmospheres);
    return new MinorBodyImpactEffectsCatalog(
      impactEnergyCatalog,
      impactEnergyCatalog.assessments.map(item=>assessmentV1(item,atmospheres)),
    );
  }
}

function assessmentV1(source:MinorBodyImpactEnergyAssessment,atmospheres:readonly Atmosphere[]):MinorBodyImpactEffectsAssessment {
  if(!source.impactScenarioApplicable) {
    return new MinorBodyImpactEffectsAssessment(
      source,false,null,null,null,null,null,null,null,null,null,null,null,null,null,
      MinorBodyImpactSurfaceResponseRegime.NOT_APPLICABLE,
    );
  }

  const energy=required(source.kineticEnergyJoules);
  const bindingFraction=required(source.targetBindingEnergyFraction);
  const impactSpeed=required(source.impactSpeedKmPerSecond);
  const impactorDiameter=required(source.impactorDiameterKilometers);
  const impactorDensity=required(source.impactorBulkDensityGramsPerCubicCentimeter);
  const targetRadiusKilometers=source.impactRiskAssessment.targetPhysicalRadiusAu*AU_KILOMETERS;
  const escapeSpeedMetersPerSecond=source.impactRiskAssessment.targetEscapeVelocityKmPerSecond*1000;
  const targetRadiusMeters=targetRadiusKilometers*1000;
  const targetSurfaceGravityEarth=(escapeSpeedMetersPerSecond**2/(2*targetRadiusMeters))/EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED;
  const severity=impactTargetResponseSeverityIndexV1(energy,bindingFraction);
  const disruption=impactBulkDisruptionPotentialIndexV1(bindingFraction);
  const environment=targetEnvironmentV1(source,atmospheres);

  const atmosphericShock=environment.hasAtmosphere?severity:0;
  const atmosphericLoss=atmosphericLossPotentialIndexV1(
    source,environment,targetRadiusMeters,targetSurfaceGravityEarth,energy,bindingFraction,severity,
  );

  if(!environment.hasSolidSurface) {
    return new MinorBodyImpactEffectsAssessment(
      source,true,false,targetRadiusKilometers,targetSurfaceGravityEarth,severity,
      null,null,atmosphericShock,atmosphericLoss,null,null,null,null,disruption,
      MinorBodyImpactSurfaceResponseRegime.NO_SOLID_SURFACE,
    );
  }

  const targetDiameterKilometers=2*targetRadiusKilometers;
  const rawCraterDiameter=impactCraterDiameterKilometersV1(
    impactorDiameter,impactorDensity,impactSpeed,targetSurfaceGravityEarth,
  );
  const craterDiameter=Math.min(targetDiameterKilometers,rawCraterDiameter);
  const craterRatio=clamp01(craterDiameter/targetDiameterKilometers);
  const waterIndex=clamp01(environment.waterInventoryIndex01??0);
  const hydrosphereShock=clamp01(severity*Math.sqrt(waterIndex));
  const waterVaporization=clamp01(hydrosphereShock*(0.35+0.65*severity));
  const geologicalShock=severity;
  const ejecta=clamp01(0.65*severity+0.35*Math.sqrt(craterRatio));
  const responseRegime=impactSurfaceResponseRegimeV1(true,craterRatio,bindingFraction);

  return new MinorBodyImpactEffectsAssessment(
    source,true,true,targetRadiusKilometers,targetSurfaceGravityEarth,severity,
    craterDiameter,craterRatio,atmosphericShock,atmosphericLoss,hydrosphereShock,
    waterVaporization,geologicalShock,ejecta,disruption,responseRegime,
  );
}

export function impactCraterDiameterKilometersV1(
  impactorDiameterKilometers:number,
  impactorBulkDensityGramsPerCubicCentimeter:number,
  impactSpeedKmPerSecond:number,
  targetSurfaceGravityEarth:number,
):number {
  for(const [name,value] of [
    ['impactorDiameterKilometers',impactorDiameterKilometers],
    ['impactorBulkDensityGramsPerCubicCentimeter',impactorBulkDensityGramsPerCubicCentimeter],
    ['impactSpeedKmPerSecond',impactSpeedKmPerSecond],
    ['targetSurfaceGravityEarth',targetSurfaceGravityEarth],
  ] as const) {
    if(!Number.isFinite(value)||value<=0) throw new RangeError(`${name} must be finite and > 0.`);
  }
  return impactorDiameterKilometers*18*
    (impactSpeedKmPerSecond/20)**0.44*
    (impactorBulkDensityGramsPerCubicCentimeter/3)**(1/3)*
    Math.max(0.02,targetSurfaceGravityEarth)**-0.22;
}

function targetEnvironmentV1(source:MinorBodyImpactEnergyAssessment,atmospheres:readonly Atmosphere[]):TargetEnvironmentV1 {
  if(source.targetKind===MinorBodyApproachTargetKind.MOON) {
    const moon=requiredMoon(source.targetMoon);
    const environment=moon.environmentState;
    return Object.freeze({
      hasSolidSurface:true,
      hasAtmosphere:environment.hasAtmosphere,
      atmosphereRetentionIndex01:environment.atmosphereRetentionIndex01,
      retainedSurfacePressurePascal:null,
      waterInventoryIndex01:environment.waterInventoryIndex01,
    });
  }

  const matches=atmospheres.filter(item=>item.hostPlanet===source.targetPlanet);
  if(matches.length!==1) {
    throw new RangeError('Point-23.10 requires exactly one phase-20 Atmosphere aggregate for every applicable planetary target.');
  }
  const atmosphere=matches[0];
  const deepEnvelope=atmosphere.retentionState.isDeepEnvelope;
  return Object.freeze({
    hasSolidSurface:!deepEnvelope,
    hasAtmosphere:atmosphere.retentionState.hasRetainedGasInventory,
    atmosphereRetentionIndex01:atmosphere.retentionState.retainedMoleInventoryFraction01,
    retainedSurfacePressurePascal:atmosphere.retentionState.retainedSurfacePressurePascal,
    waterInventoryIndex01:deepEnvelope?null:atmosphere.waterInventory.waterInventoryIndex01,
  });
}

function atmosphericLossPotentialIndexV1(
  source:MinorBodyImpactEnergyAssessment,
  environment:TargetEnvironmentV1,
  targetRadiusMeters:number,
  targetSurfaceGravityEarth:number,
  energyJoules:number,
  targetBindingEnergyFraction:number,
  severity:number,
):number {
  if(!environment.hasAtmosphere) return 0;

  if(source.targetKind===MinorBodyApproachTargetKind.MOON) {
    const retention=clamp01(environment.atmosphereRetentionIndex01??0);
    return clamp01(severity*(1-0.5*retention));
  }

  if(!environment.hasSolidSurface) {
    return 0.25*impactBulkDisruptionPotentialIndexV1(targetBindingEnergyFraction);
  }

  const pressure=environment.retainedSurfacePressurePascal;
  if(pressure===null||pressure<=0) return 0;
  const gravityMetersPerSecondSquared=targetSurfaceGravityEarth*EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED;
  const atmosphericMassKilograms=4*Math.PI*targetRadiusMeters**2*pressure/gravityMetersPerSecondSquared;
  const escapeMetersPerSecond=source.impactRiskAssessment.targetEscapeVelocityKmPerSecond*1000;
  const atmosphericBindingEnergyJoules=0.5*atmosphericMassKilograms*escapeMetersPerSecond**2;
  if(!Number.isFinite(atmosphericBindingEnergyJoules)||atmosphericBindingEnergyJoules<=0) return 0;
  const coupledRatio=energyJoules*ATMOSPHERIC_IMPACT_COUPLING_FRACTION/atmosphericBindingEnergyJoules;
  return Math.sqrt(clamp01(coupledRatio));
}

function assertUniqueAtmospheresV1(atmospheres:readonly Atmosphere[]):void {
  const seen=new Set<unknown>();
  for(const atmosphere of atmospheres) {
    if(seen.has(atmosphere.hostPlanet)) throw new RangeError('Point-23.10 atmospheres must contain at most one aggregate per exact host Planet reference.');
    seen.add(atmosphere.hostPlanet);
  }
}
function requiredMoon(moon:RelevantMoon|null):RelevantMoon {if(moon===null) throw new RangeError('Point-23.10 moon target is missing.');return moon;}
function required(value:number|null):number {if(value===null) throw new RangeError('Required point-23.9 impact-energy value is null.');return value;}
function clamp01(value:number):number{return Math.max(0,Math.min(1,value));}
