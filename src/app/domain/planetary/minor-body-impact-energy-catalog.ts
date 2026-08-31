import { MinorBodyImpactConsequenceRegime } from './minor-body-impact-consequence-regime';
import { type MinorBodyImpactEnergyAssessment } from './minor-body-impact-energy-assessment';
import { type MinorBodyTemporalImpactProbabilityCatalog } from './minor-body-temporal-impact-probability-catalog';

/** Point-23.9 one-to-one conditional energy/consequence projection over point 23.8. */
export class MinorBodyImpactEnergyCatalog {
  readonly assessments:readonly MinorBodyImpactEnergyAssessment[];

  constructor(
    readonly temporalImpactProbabilityCatalog:MinorBodyTemporalImpactProbabilityCatalog,
    assessments:readonly MinorBodyImpactEnergyAssessment[],
  ) {
    this.assessments=Object.freeze([...assessments]);
    const source=temporalImpactProbabilityCatalog.assessments;
    if(this.assessments.length!==source.length) throw new RangeError('Point-23.9 requires exactly one energy assessment for every point-23.8 temporal assessment.');
    for(let index=0;index<this.assessments.length;index+=1) {
      if(this.assessments[index].temporalAssessment!==source[index]) {
        throw new RangeError('Point-23.9 must preserve exact point-23.8 assessment order/references.');
      }
    }
  }

  get assessmentCount(){return this.assessments.length;}
  get applicableImpactScenarioCount(){return this.assessments.filter(item=>item.impactScenarioApplicable).length;}
  get localCount(){return this.assessments.filter(item=>item.consequenceRegime===MinorBodyImpactConsequenceRegime.LOCAL).length;}
  get regionalCount(){return this.assessments.filter(item=>item.consequenceRegime===MinorBodyImpactConsequenceRegime.REGIONAL).length;}
  get globalCount(){return this.assessments.filter(item=>item.consequenceRegime===MinorBodyImpactConsequenceRegime.GLOBAL).length;}
  get catastrophicCount(){return this.assessments.filter(item=>item.consequenceRegime===MinorBodyImpactConsequenceRegime.CATASTROPHIC).length;}
  get maximumKineticEnergyJoules(){return this.assessments.reduce((maximum,item)=>Math.max(maximum,item.kineticEnergyJoules??0),0);}
  get maximumTntEquivalentMegatons(){return this.assessments.reduce((maximum,item)=>Math.max(maximum,item.tntEquivalentMegatons??0),0);}
  get consequenceRelevantAssessments(){return Object.freeze(this.assessments.filter(item=>item.impactScenarioApplicable));}
  forMinorBody(proceduralId:string){return Object.freeze(this.assessments.filter(item=>item.minorBodyProceduralId===proceduralId));}
}
