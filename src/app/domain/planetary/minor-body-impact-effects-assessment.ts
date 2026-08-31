import { MinorBodyImpactSurfaceResponseRegime, type MinorBodyImpactSurfaceResponseRegimeValue } from './minor-body-impact-surface-response-regime';
import { type MinorBodyImpactEnergyAssessment } from './minor-body-impact-energy-assessment';

const TOLERANCE=1e-10;
const ENERGY_SEVERITY_FLOOR_JOULES=1e12;
const ENERGY_SEVERITY_CEILING_JOULES=1e25;
const BINDING_SEVERITY_FLOOR=1e-14;
const BINDING_SEVERITY_CEILING=1e-2;

/**
 * Point-23.10 conditional target-response projection for one point-23.9 impact.
 *
 * This remains a consequence scenario, not a realized historical event. When the
 * point-23.8 temporal probability is zero, every target-effect quantity is null.
 * Applicable scenarios preserve the exact point-23.9 energy assessment and expose
 * normalized response proxies plus a crater estimate only when a solid surface exists.
 */
export class MinorBodyImpactEffectsAssessment {
  constructor(
    readonly energyAssessment:MinorBodyImpactEnergyAssessment,
    readonly impactScenarioApplicable:boolean,
    readonly hasSolidSurface:boolean|null,
    readonly targetRadiusKilometers:number|null,
    readonly targetSurfaceGravityEarth:number|null,
    readonly targetResponseSeverityIndex01:number|null,
    readonly craterDiameterKilometers:number|null,
    readonly craterToTargetDiameterRatio01:number|null,
    readonly atmosphericShockIndex01:number|null,
    readonly atmosphericLossPotentialIndex01:number|null,
    readonly hydrosphereShockIndex01:number|null,
    readonly surfaceWaterVaporizationPotentialIndex01:number|null,
    readonly geologicalShockIndex01:number|null,
    readonly ejectaGenerationIndex01:number|null,
    readonly bulkDisruptionPotentialIndex01:number|null,
    readonly surfaceResponseRegime:MinorBodyImpactSurfaceResponseRegimeValue,
  ) {
    if(impactScenarioApplicable!==energyAssessment.impactScenarioApplicable) {
      throw new RangeError('Point-23.10 impactScenarioApplicable must exactly preserve point-23.9 applicability.');
    }
    if(!MinorBodyImpactSurfaceResponseRegime.values.includes(surfaceResponseRegime)) {
      throw new RangeError('Unknown MinorBodyImpactSurfaceResponseRegime.');
    }

    if(!impactScenarioApplicable) {
      const values=[
        hasSolidSurface,targetRadiusKilometers,targetSurfaceGravityEarth,targetResponseSeverityIndex01,
        craterDiameterKilometers,craterToTargetDiameterRatio01,atmosphericShockIndex01,
        atmosphericLossPotentialIndex01,hydrosphereShockIndex01,surfaceWaterVaporizationPotentialIndex01,
        geologicalShockIndex01,ejectaGenerationIndex01,bulkDisruptionPotentialIndex01,
      ] as const;
      if(values.some(value=>value!==null)) throw new RangeError('Non-applicable point-23.10 scenarios must not invent target effects.');
      if(surfaceResponseRegime!==MinorBodyImpactSurfaceResponseRegime.NOT_APPLICABLE) {
        throw new RangeError('Non-applicable point-23.10 scenarios must use NOT_APPLICABLE surface response.');
      }
      return;
    }

    if(hasSolidSurface===null) throw new RangeError('Applicable point-23.10 scenarios require hasSolidSurface.');
    assertPositive(required(targetRadiusKilometers),'targetRadiusKilometers');
    assertPositive(required(targetSurfaceGravityEarth),'targetSurfaceGravityEarth');
    assertIndex(required(targetResponseSeverityIndex01),'targetResponseSeverityIndex01');
    assertIndex(required(atmosphericShockIndex01),'atmosphericShockIndex01');
    assertIndex(required(atmosphericLossPotentialIndex01),'atmosphericLossPotentialIndex01');
    assertIndex(required(bulkDisruptionPotentialIndex01),'bulkDisruptionPotentialIndex01');

    const expectedSeverity=impactTargetResponseSeverityIndexV1(
      requiredEnergy(energyAssessment.kineticEnergyJoules),
      requiredEnergy(energyAssessment.targetBindingEnergyFraction),
    );
    if(relativeError(required(targetResponseSeverityIndex01),expectedSeverity)>1e-9) {
      throw new RangeError('Point-23.10 targetResponseSeverityIndex01 must use the frozen V1 logarithmic severity mapping.');
    }
    const expectedDisruption=impactBulkDisruptionPotentialIndexV1(requiredEnergy(energyAssessment.targetBindingEnergyFraction));
    if(relativeError(required(bulkDisruptionPotentialIndex01),expectedDisruption)>1e-9) {
      throw new RangeError('Point-23.10 bulkDisruptionPotentialIndex01 must derive from the point-23.9 target binding-energy fraction.');
    }

    if(!hasSolidSurface) {
      if(craterDiameterKilometers!==null||craterToTargetDiameterRatio01!==null||hydrosphereShockIndex01!==null||surfaceWaterVaporizationPotentialIndex01!==null||geologicalShockIndex01!==null||ejectaGenerationIndex01!==null) {
        throw new RangeError('Point-23.10 deep-envelope targets must not invent crater, surface-water, geology or ejecta outputs.');
      }
      if(surfaceResponseRegime!==MinorBodyImpactSurfaceResponseRegime.NO_SOLID_SURFACE) {
        throw new RangeError('Point-23.10 deep-envelope targets must use NO_SOLID_SURFACE.');
      }
      return;
    }

    assertPositive(required(craterDiameterKilometers),'craterDiameterKilometers');
    assertIndex(required(craterToTargetDiameterRatio01),'craterToTargetDiameterRatio01');
    assertIndex(required(hydrosphereShockIndex01),'hydrosphereShockIndex01');
    assertIndex(required(surfaceWaterVaporizationPotentialIndex01),'surfaceWaterVaporizationPotentialIndex01');
    assertIndex(required(geologicalShockIndex01),'geologicalShockIndex01');
    assertIndex(required(ejectaGenerationIndex01),'ejectaGenerationIndex01');
    if(required(craterDiameterKilometers)>2*required(targetRadiusKilometers)*(1+TOLERANCE)) {
      throw new RangeError('Point-23.10 crater estimate cannot exceed the target diameter.');
    }

    const expectedSurfaceRegime=impactSurfaceResponseRegimeV1(
      true,
      required(craterToTargetDiameterRatio01),
      requiredEnergy(energyAssessment.targetBindingEnergyFraction),
    );
    if(surfaceResponseRegime!==expectedSurfaceRegime) {
      throw new RangeError('Point-23.10 surface response regime must match crater scale and target binding-energy fraction.');
    }
  }

  get temporalAssessment(){return this.energyAssessment.temporalAssessment;}
  get impactRiskAssessment(){return this.energyAssessment.impactRiskAssessment;}
  get minorBody(){return this.energyAssessment.minorBody;}
  get minorBodyProceduralId(){return this.energyAssessment.minorBodyProceduralId;}
  get minorBodyDesignation(){return this.energyAssessment.minorBodyDesignation;}
  get targetKind(){return this.energyAssessment.targetKind;}
  get targetPlanet(){return this.energyAssessment.targetPlanet;}
  get targetMoon(){return this.energyAssessment.targetMoon;}
  get targetName(){return this.energyAssessment.targetName;}
  get temporalImpactProbability01(){return this.energyAssessment.temporalImpactProbability01;}
  get kineticEnergyJoules(){return this.energyAssessment.kineticEnergyJoules;}
  get consequenceRegime(){return this.energyAssessment.consequenceRegime;}
}

export function impactTargetResponseSeverityIndexV1(energyJoules:number,targetBindingEnergyFraction:number):number {
  assertPositive(energyJoules,'energyJoules');
  assertPositive(targetBindingEnergyFraction,'targetBindingEnergyFraction');
  return Math.max(
    logarithmicIndex(energyJoules,ENERGY_SEVERITY_FLOOR_JOULES,ENERGY_SEVERITY_CEILING_JOULES),
    logarithmicIndex(targetBindingEnergyFraction,BINDING_SEVERITY_FLOOR,BINDING_SEVERITY_CEILING),
  );
}

export function impactBulkDisruptionPotentialIndexV1(targetBindingEnergyFraction:number):number {
  assertPositive(targetBindingEnergyFraction,'targetBindingEnergyFraction');
  return Math.sqrt(clamp01(targetBindingEnergyFraction/BINDING_SEVERITY_CEILING));
}

export function impactSurfaceResponseRegimeV1(
  hasSolidSurface:boolean,
  craterToTargetDiameterRatio01:number|null,
  targetBindingEnergyFraction:number,
):MinorBodyImpactSurfaceResponseRegimeValue {
  assertPositive(targetBindingEnergyFraction,'targetBindingEnergyFraction');
  if(!hasSolidSurface) {
    if(craterToTargetDiameterRatio01!==null) throw new RangeError('A target without a solid surface cannot have a crater ratio.');
    return MinorBodyImpactSurfaceResponseRegime.NO_SOLID_SURFACE;
  }
  if(craterToTargetDiameterRatio01===null) throw new RangeError('A solid target requires a crater ratio.');
  assertIndex(craterToTargetDiameterRatio01,'craterToTargetDiameterRatio01');
  if(targetBindingEnergyFraction>=1e-2) return MinorBodyImpactSurfaceResponseRegime.BULK_DISRUPTION;
  if(craterToTargetDiameterRatio01>=0.10) return MinorBodyImpactSurfaceResponseRegime.GLOBAL_RESHAPING;
  if(craterToTargetDiameterRatio01>=0.01) return MinorBodyImpactSurfaceResponseRegime.LARGE_CRATER_BASIN;
  return MinorBodyImpactSurfaceResponseRegime.CRATERING;
}

function logarithmicIndex(value:number,floor:number,ceiling:number):number {
  if(value<=floor) return 0;
  if(value>=ceiling) return 1;
  return clamp01(Math.log10(value/floor)/Math.log10(ceiling/floor));
}
function clamp01(value:number):number{return Math.max(0,Math.min(1,value));}
function required(value:number|null):number {if(value===null) throw new RangeError('Required point-23.10 value is null.');return value;}
function requiredEnergy(value:number|null):number {if(value===null) throw new RangeError('Required point-23.9 energy value is null.');return value;}
function assertPositive(value:number,name:string):void {if(!Number.isFinite(value)||value<=0) throw new RangeError(`${name} must be finite and > 0.`);}
function assertIndex(value:number,name:string):void {if(!Number.isFinite(value)||value<0||value>1) throw new RangeError(`${name} must be finite in [0, 1].`);}
function relativeError(actual:number,expected:number):number{return Math.abs(actual-expected)/Math.max(1,Math.abs(expected));}
