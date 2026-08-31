import { MinorBodyImpactSurfaceResponseRegime } from './minor-body-impact-surface-response-regime';
import { type MinorBodyImpactEffectsAssessment } from './minor-body-impact-effects-assessment';
import { type MinorBodyImpactEnergyCatalog } from './minor-body-impact-energy-catalog';

/** Point-23.10 one-to-one conditional target-effects projection over point 23.9. */
export class MinorBodyImpactEffectsCatalog {
  readonly assessments:readonly MinorBodyImpactEffectsAssessment[];

  constructor(
    readonly impactEnergyCatalog:MinorBodyImpactEnergyCatalog,
    assessments:readonly MinorBodyImpactEffectsAssessment[],
  ) {
    this.assessments=Object.freeze([...assessments]);
    const source=impactEnergyCatalog.assessments;
    if(this.assessments.length!==source.length) throw new RangeError('Point-23.10 requires exactly one effects assessment for every point-23.9 energy assessment.');
    for(let index=0;index<this.assessments.length;index+=1) {
      if(this.assessments[index].energyAssessment!==source[index]) {
        throw new RangeError('Point-23.10 must preserve exact point-23.9 assessment order/references.');
      }
    }
  }

  get assessmentCount(){return this.assessments.length;}
  get applicableImpactScenarioCount(){return this.assessments.filter(item=>item.impactScenarioApplicable).length;}
  get solidSurfaceImpactCount(){return this.assessments.filter(item=>item.hasSolidSurface===true).length;}
  get deepEnvelopeImpactCount(){return this.assessments.filter(item=>item.surfaceResponseRegime===MinorBodyImpactSurfaceResponseRegime.NO_SOLID_SURFACE).length;}
  get largeCraterOrGreaterCount(){return this.assessments.filter(item=>
    item.surfaceResponseRegime===MinorBodyImpactSurfaceResponseRegime.LARGE_CRATER_BASIN||
    item.surfaceResponseRegime===MinorBodyImpactSurfaceResponseRegime.GLOBAL_RESHAPING||
    item.surfaceResponseRegime===MinorBodyImpactSurfaceResponseRegime.BULK_DISRUPTION
  ).length;}
  get maximumTargetResponseSeverityIndex01(){return this.assessments.reduce((maximum,item)=>Math.max(maximum,item.targetResponseSeverityIndex01??0),0);}
  get maximumCraterDiameterKilometers(){return this.assessments.reduce((maximum,item)=>Math.max(maximum,item.craterDiameterKilometers??0),0);}
  get consequenceRelevantAssessments(){return Object.freeze(this.assessments.filter(item=>item.impactScenarioApplicable));}
  forMinorBody(proceduralId:string){return Object.freeze(this.assessments.filter(item=>item.minorBodyProceduralId===proceduralId));}
}
