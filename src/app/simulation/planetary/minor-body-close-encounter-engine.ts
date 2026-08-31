import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';

import { MinorBodyApproachTargetKind } from '../../domain/planetary/minor-body-approach-target-kind';
import { MinorBodyCloseEncounterAssessment } from '../../domain/planetary/minor-body-close-encounter-assessment';
import { MinorBodyCloseEncounterCatalog } from '../../domain/planetary/minor-body-close-encounter-catalog';
import { MinorBodyCloseEncounterOutcomeRegime, type MinorBodyCloseEncounterOutcomeRegimeValue } from '../../domain/planetary/minor-body-close-encounter-outcome-regime';
import { type MinorBodyGiantInfluenceAssessment } from '../../domain/planetary/minor-body-giant-influence-assessment';
import { type MinorBodyGiantInfluenceCatalog } from '../../domain/planetary/minor-body-giant-influence-catalog';
import { MinorBodyGiantInfluenceRegime } from '../../domain/planetary/minor-body-giant-influence-regime';
import { MinorBodyOrbitConicRegime } from '../../domain/planetary/minor-body-orbit-conic-regime';
import { MinorBodyOrbitalElements } from '../../domain/planetary/minor-body-orbital-elements';
import { type MinorBodyOrbitalElementsCatalogEntry } from '../../domain/planetary/minor-body-orbital-elements-catalog';
import { MinorBodyOrbitalTransition } from '../../domain/planetary/minor-body-orbital-transition';
import { type MinorBodyOrbitProximityAssessment } from '../../domain/planetary/minor-body-orbit-proximity-assessment';
import { type RelevantMoon } from '../../domain/planetary/relevant-moon';

const ENCOUNTER_DOMAIN=utf8ToBytes('GENESIS-MINOR-BODY-CLOSE-ENCOUNTER-V1');
const EARTH_MASSES_PER_SOLAR_MASS=332_946.0487;
const EARTH_RADIUS_KILOMETERS=6_371;
const AU_KILOMETERS=149_597_870.7;
const AU_PER_YEAR_TO_KM_PER_SECOND=4.740470463533349;
const TWO_PI_SQUARED=4*Math.PI*Math.PI;

interface CandidateV1 {
  readonly proximity:MinorBodyOrbitProximityAssessment;
  readonly giantInfluence:MinorBodyGiantInfluenceAssessment|null;
  readonly temporalSample:number;
  readonly impactParameterSample:number;
  readonly outcomeSample:number;
  readonly kickSample:number;
  readonly orientationSample:number;
  readonly encounterLikelihood:number;
  readonly temporalCandidate:boolean;
  readonly targetInfluenceRadiusAu:number;
  readonly targetPhysicalRadiusAu:number;
}

interface MoonPhysicalV1 {
  readonly massEarth?:number;
  readonly radiusEarth?:number;
}

/**
 * Point-23.6 deterministic close-encounter resolver.
 *
 * Every point-23.3 approach corridor receives a temporal-opportunity sample.
 * At most one qualifying candidate per minor body is selected in V1, which
 * yields one unambiguous post-encounter orbit for later impact-risk stages.
 * The hash is domain-separated and consumes zero PRNG draws / hierarchical seeds.
 */
export class MinorBodyCloseEncounterEngine {
  private constructor() {}

  static generate(giantInfluenceCatalog:MinorBodyGiantInfluenceCatalog):MinorBodyCloseEncounterCatalog {
    const proximityCatalog=giantInfluenceCatalog.resonanceCatalog.proximityCatalog;
    const candidateMap=new Map<MinorBodyOrbitalElementsCatalogEntry,CandidateV1[]>();

    for(const proximity of proximityCatalog.assessments) {
      if(!proximity.approachPossible) continue;
      const giantInfluence=matchingGiantInfluenceV1(giantInfluenceCatalog,proximity);
      const candidate=candidateV1(giantInfluenceCatalog,proximity,giantInfluence);
      const list=candidateMap.get(proximity.minorBody)??[];
      list.push(candidate);
      candidateMap.set(proximity.minorBody,list);
    }

    const winners=new Map<MinorBodyOrbitalElementsCatalogEntry,CandidateV1>();
    for(const [body,candidates] of candidateMap) {
      const qualified=candidates.filter(candidate=>candidate.temporalCandidate);
      if(qualified.length===0) continue;
      qualified.sort((left,right)=>
        left.temporalSample/left.encounterLikelihood-right.temporalSample/right.encounterLikelihood
      );
      winners.set(body,qualified[0]);
    }

    const assessments:MinorBodyCloseEncounterAssessment[]=[];
    const winningAssessments=new Map<MinorBodyOrbitalElementsCatalogEntry,MinorBodyCloseEncounterAssessment>();
    for(const proximity of proximityCatalog.assessments) {
      if(!proximity.approachPossible) continue;
      const candidates=candidateMap.get(proximity.minorBody)??[];
      const candidate=candidates.find(item=>item.proximity===proximity);
      if(candidate===undefined) throw new RangeError('Point-23.6 internal candidate resolution lost a point-23.3 approach reference.');
      const occurred=winners.get(proximity.minorBody)===candidate;
      const assessment=materializeAssessmentV1(candidate,occurred);
      assessments.push(assessment);
      if(occurred) winningAssessments.set(proximity.minorBody,assessment);
    }

    const transitions=giantInfluenceCatalog.resonanceCatalog.orbitalCatalog.entries.map(body=>{
      const winner=winningAssessments.get(body)??null;
      return new MinorBodyOrbitalTransition(
        body,
        body.orbitalElements,
        winner?.outgoingOrbitalElements??body.orbitalElements,
        winner,
      );
    });

    return new MinorBodyCloseEncounterCatalog(giantInfluenceCatalog,assessments,transitions);
  }
}

function candidateV1(
  giantCatalog:MinorBodyGiantInfluenceCatalog,
  proximity:MinorBodyOrbitProximityAssessment,
  giantInfluence:MinorBodyGiantInfluenceAssessment|null,
):CandidateV1 {
  const digest=sha256.create()
    .update(ENCOUNTER_DOMAIN)
    .update(utf8ToBytes(proximity.minorBodyProceduralId))
    .update(utf8ToBytes(`|K${proximity.targetKind.code}|P${proximity.targetPlanetOrdinal}|M${proximity.targetMoonOrdinal??0}`))
    .digest();
  const temporalSample=fractionAt(digest,0);
  const impactParameterSample=fractionAt(digest,4);
  const outcomeSample=fractionAt(digest,8);
  const kickSample=fractionAt(digest,12);
  const orientationSample=fractionAt(digest,16);

  const corridor=proximity.targetCorridorRadiusAu;
  const separation=proximity.minimumNodalSeparationAu??corridor;
  const depth=clamp01(1-separation/Math.max(corridor,1e-15));
  const resonance=giantCatalog.resonanceCatalog.assessments.find(item=>
    item.minorBody===proximity.minorBody&&item.targetPlanet===proximity.targetPlanet
  );
  const zoneBonus=resonance?.insideChaoticZone?0.08:0;
  const resonanceBonus=resonance?.resonanceCandidate?0.05:0;

  const targetInfluenceRadiusAu=targetInfluenceRadiusV1(proximity);
  const targetPhysicalRadiusAu=targetPhysicalRadiusV1(proximity);
  let likelihood:number;
  if(proximity.targetKind===MinorBodyApproachTargetKind.PLANET) {
    likelihood=0.07+0.43*depth+zoneBonus+resonanceBonus;
    if(giantInfluence!==null) {
      likelihood+=0.20*giantInfluence.perturbationPotentialIndex01+
        0.10*Math.max(giantInfluence.temporaryCapturePotentialIndex01,giantInfluence.ejectionPotentialIndex01);
    }
  } else {
    const occupancy=clamp01(Math.sqrt(targetInfluenceRadiusAu/Math.max(corridor,1e-15))*2.5);
    likelihood=(0.015+0.10*depth)*(0.35+0.65*occupancy);
  }
  likelihood=Math.max(0.002,Math.min(0.92,likelihood));

  return {
    proximity,
    giantInfluence,
    temporalSample,
    impactParameterSample,
    outcomeSample,
    kickSample,
    orientationSample,
    encounterLikelihood:likelihood,
    temporalCandidate:temporalSample<likelihood,
    targetInfluenceRadiusAu,
    targetPhysicalRadiusAu,
  };
}

function matchingGiantInfluenceV1(
  giantCatalog:MinorBodyGiantInfluenceCatalog,
  proximity:MinorBodyOrbitProximityAssessment,
):MinorBodyGiantInfluenceAssessment|null {
  if(proximity.targetMoon!==null) return null;
  return giantCatalog.assessments.find(item=>
    item.minorBody===proximity.minorBody&&item.targetGiantPlanet===proximity.targetPlanet
  )??null;
}

function materializeAssessmentV1(candidate:CandidateV1,occurred:boolean):MinorBodyCloseEncounterAssessment {
  const incoming=candidate.proximity.minorBody.orbitalElements;
  if(!occurred) {
    return new MinorBodyCloseEncounterAssessment(
      candidate.proximity,
      candidate.giantInfluence,
      candidate.temporalSample,
      candidate.encounterLikelihood,
      candidate.temporalCandidate,
      false,
      candidate.targetInfluenceRadiusAu,
      null,
      null,
      0,
      0,
      MinorBodyCloseEncounterOutcomeRegime.NO_ENCOUNTER,
      incoming,
    );
  }

  const minimumSafeDistance=Math.max(candidate.targetPhysicalRadiusAu*3,candidate.targetInfluenceRadiusAu*0.015);
  const maximumDistance=Math.max(minimumSafeDistance*1.001,candidate.targetInfluenceRadiusAu*0.95);
  const closestApproach=minimumSafeDistance+
    (maximumDistance-minimumSafeDistance)*candidate.impactParameterSample**1.6;
  const relativeSpeed=relativeSpeedV1(candidate.proximity);
  const targetMassEarth=targetMassEarthV1(candidate.proximity);
  const targetMassSolar=targetMassEarth/EARTH_MASSES_PER_SOLAR_MASS;
  const escapeAtClosest=Math.sqrt(2*TWO_PI_SQUARED*targetMassSolar/closestApproach)*AU_PER_YEAR_TO_KM_PER_SECOND;
  const focusing=(escapeAtClosest/Math.max(relativeSpeed,1e-9))**2;
  const corridorDepth=clamp01(1-(candidate.proximity.minimumNodalSeparationAu??candidate.proximity.targetCorridorRadiusAu)/candidate.proximity.targetCorridorRadiusAu);
  const strength=clamp01(0.82*(focusing/(1+focusing))+0.18*corridorDepth);
  const outcome=outcomeV1(candidate,strength);
  const outgoing=outgoingOrbitV1(candidate,outcome,strength,relativeSpeed);
  const deltaEnergy=outgoing.specificOrbitalEnergyAu2PerYear2-incoming.specificOrbitalEnergyAu2PerYear2;

  return new MinorBodyCloseEncounterAssessment(
    candidate.proximity,
    candidate.giantInfluence,
    candidate.temporalSample,
    candidate.encounterLikelihood,
    candidate.temporalCandidate,
    true,
    candidate.targetInfluenceRadiusAu,
    closestApproach,
    relativeSpeed,
    strength,
    deltaEnergy,
    outcome,
    outgoing,
  );
}

function outcomeV1(candidate:CandidateV1,strength:number):MinorBodyCloseEncounterOutcomeRegimeValue {
  const incoming=candidate.proximity.minorBody.orbitalElements;
  const giant=candidate.giantInfluence;
  if(!incoming.isBound) {
    if(giant?.regime===MinorBodyGiantInfluenceRegime.TEMPORARY_CAPTURE_CANDIDATE &&
      strength>=0.22 && candidate.outcomeSample<0.28+0.55*giant.temporaryCapturePotentialIndex01) {
      return MinorBodyCloseEncounterOutcomeRegime.TEMPORARY_CAPTURE;
    }
    return MinorBodyCloseEncounterOutcomeRegime.UNBOUND_DEFLECTION;
  }
  if(giant?.regime===MinorBodyGiantInfluenceRegime.EJECTION_CANDIDATE &&
    strength>=0.34 && candidate.outcomeSample<0.24+0.62*giant.ejectionPotentialIndex01) {
    return MinorBodyCloseEncounterOutcomeRegime.EJECTION;
  }
  if(giant?.regime===MinorBodyGiantInfluenceRegime.TEMPORARY_CAPTURE_CANDIDATE &&
    strength>=0.22 && candidate.outcomeSample<0.25+0.55*giant.temporaryCapturePotentialIndex01) {
    return MinorBodyCloseEncounterOutcomeRegime.TEMPORARY_CAPTURE;
  }
  return MinorBodyCloseEncounterOutcomeRegime.BOUND_PERTURBATION;
}

function outgoingOrbitV1(
  candidate:CandidateV1,
  outcome:MinorBodyCloseEncounterOutcomeRegimeValue,
  strength:number,
  relativeSpeedKmPerSecond:number,
):MinorBodyOrbitalElements {
  const incoming=candidate.proximity.minorBody.orbitalElements;
  if(outcome===MinorBodyCloseEncounterOutcomeRegime.EJECTION) {
    return ejectedOrbitV1(candidate,strength,relativeSpeedKmPerSecond);
  }
  if(!incoming.isBound) {
    return deflectedHyperbolaV1(candidate,strength);
  }
  return perturbedEllipseV1(candidate,strength,outcome===MinorBodyCloseEncounterOutcomeRegime.TEMPORARY_CAPTURE?1.22:1);
}

function perturbedEllipseV1(candidate:CandidateV1,strength:number,multiplier:number):MinorBodyOrbitalElements {
  const input=candidate.proximity.minorBody.orbitalElements;
  const sign=candidate.kickSample<0.5?-1:1;
  const secondarySign=candidate.orientationSample<0.5?-1:1;
  const aFactor=Math.exp(sign*(0.025+0.42*strength*multiplier)*(0.45+0.55*candidate.kickSample));
  const a=Math.max(1e-5,input.semiMajorAxisAu*aFactor);
  const e=clamp(
    input.eccentricity+secondarySign*(0.008+0.24*strength*multiplier)*(0.35+0.65*candidate.orientationSample),
    0,
    0.94,
  );
  const inclination=clamp(input.inclinationDegrees+sign*(1+22*strength*multiplier)*(0.3+0.7*candidate.orientationSample),0,180);
  const node=wrapDegrees(input.longitudeAscendingNodeDegrees+secondarySign*(3+55*strength)*candidate.orientationSample);
  const argument=wrapDegrees(input.argumentOfPeriapsisDegrees+sign*(4+70*strength)*candidate.kickSample);
  const mean=wrapDegrees((input.meanAnomalyDegrees??0)+180*candidate.temporalSample+25*strength);
  return new MinorBodyOrbitalElements(
    input.kind,input.proceduralId,input.localDesignation,MinorBodyOrbitConicRegime.ELLIPTIC,input.gravitatingMassSolar,
    a,e,inclination,node,argument,mean,a*(1-e),a*(1+e),Math.sqrt(a**3/input.gravitatingMassSolar),
  );
}

function ejectedOrbitV1(candidate:CandidateV1,strength:number,relativeSpeedKmPerSecond:number):MinorBodyOrbitalElements {
  const input=candidate.proximity.minorBody.orbitalElements;
  const excessSpeed=Math.max(0.15,relativeSpeedKmPerSecond*(0.05+0.30*strength)*(0.55+0.45*candidate.kickSample));
  const excessAuYear=excessSpeed/AU_PER_YEAR_TO_KM_PER_SECOND;
  const energy=0.5*excessAuYear**2;
  const mu=TWO_PI_SQUARED*input.gravitatingMassSolar;
  const absA=mu/(2*energy);
  const targetA=candidate.proximity.targetPlanet.orbit.semiMajorAxisAu;
  const q=Math.max(1e-5,Math.min(input.periapsisAu,targetA)*(0.88+0.24*candidate.orientationSample));
  const e=1+q/absA;
  return new MinorBodyOrbitalElements(
    input.kind,input.proceduralId,input.localDesignation,MinorBodyOrbitConicRegime.HYPERBOLIC,input.gravitatingMassSolar,
    -absA,e,
    clamp(input.inclinationDegrees+(candidate.kickSample<0.5?-1:1)*(5+35*strength)*candidate.orientationSample,0,180),
    wrapDegrees(input.longitudeAscendingNodeDegrees+90*candidate.orientationSample),
    wrapDegrees(input.argumentOfPeriapsisDegrees+110*candidate.kickSample),
    null,q,null,null,
  );
}

function deflectedHyperbolaV1(candidate:CandidateV1,strength:number):MinorBodyOrbitalElements {
  const input=candidate.proximity.minorBody.orbitalElements;
  const sign=candidate.kickSample<0.5?-1:1;
  const absA=Math.max(1e-5,Math.abs(input.semiMajorAxisAu)*Math.exp(sign*(0.03+0.36*strength)*(0.4+0.6*candidate.kickSample)));
  const q=Math.max(1e-5,input.periapsisAu*Math.exp(-sign*(0.02+0.20*strength)*(0.4+0.6*candidate.orientationSample)));
  const e=1+q/absA;
  return new MinorBodyOrbitalElements(
    input.kind,input.proceduralId,input.localDesignation,MinorBodyOrbitConicRegime.HYPERBOLIC,input.gravitatingMassSolar,
    -absA,e,
    clamp(input.inclinationDegrees+sign*(3+28*strength)*candidate.orientationSample,0,180),
    wrapDegrees(input.longitudeAscendingNodeDegrees+sign*(8+80*strength)*candidate.orientationSample),
    wrapDegrees(input.argumentOfPeriapsisDegrees-sign*(6+95*strength)*candidate.kickSample),
    null,q,null,null,
  );
}

function targetInfluenceRadiusV1(proximity:MinorBodyOrbitProximityAssessment):number {
  if(proximity.targetKind===MinorBodyApproachTargetKind.PLANET) return proximity.targetCorridorRadiusAu;
  const moon=proximity.targetMoon;
  if(moon===null) throw new RangeError('Moon approach missing targetMoon.');
  const mass=moonMassEarthV1(moon);
  const a=moon.orbit.semiMajorAxisKilometers/AU_KILOMETERS;
  const hill=a*Math.cbrt(mass/(3*proximity.targetPlanet.massEarth));
  return Math.max(targetPhysicalRadiusV1(proximity)*8,hill);
}

function targetPhysicalRadiusV1(proximity:MinorBodyOrbitProximityAssessment):number {
  if(proximity.targetKind===MinorBodyApproachTargetKind.PLANET) {
    return proximity.targetPlanet.radiusEarth*EARTH_RADIUS_KILOMETERS/AU_KILOMETERS;
  }
  const moon=proximity.targetMoon;
  if(moon===null) throw new RangeError('Moon approach missing targetMoon.');
  return moonRadiusEarthV1(moon)*EARTH_RADIUS_KILOMETERS/AU_KILOMETERS;
}

function targetMassEarthV1(proximity:MinorBodyOrbitProximityAssessment):number {
  if(proximity.targetKind===MinorBodyApproachTargetKind.PLANET) return proximity.targetPlanet.massEarth;
  if(proximity.targetMoon===null) throw new RangeError('Moon approach missing targetMoon.');
  return moonMassEarthV1(proximity.targetMoon);
}

function moonMassEarthV1(moon:RelevantMoon):number {
  const value=(moon as RelevantMoon&MoonPhysicalV1).massEarth;
  if(value===undefined||!Number.isFinite(value)||value<=0) return 1e-4;
  return value;
}
function moonRadiusEarthV1(moon:RelevantMoon):number {
  const value=(moon as RelevantMoon&MoonPhysicalV1).radiusEarth;
  if(value===undefined||!Number.isFinite(value)||value<=0) return 0.1;
  return value;
}

function relativeSpeedV1(proximity:MinorBodyOrbitProximityAssessment):number {
  const orbit=proximity.minorBody.orbitalElements;
  const r=proximity.targetPlanet.orbit.semiMajorAxisAu;
  const mu=TWO_PI_SQUARED*orbit.gravitatingMassSolar;
  const visViva=mu*(2/r-1/orbit.semiMajorAxisAu);
  const bodySpeed=Math.sqrt(Math.max(mu/Math.max(r,Math.abs(orbit.semiMajorAxisAu)),visViva));
  const planetSpeed=Math.sqrt(mu/r);
  const angle=proximity.mutualInclinationDegrees*Math.PI/180;
  let relative=Math.sqrt(Math.max(0,bodySpeed**2+planetSpeed**2-2*bodySpeed*planetSpeed*Math.cos(angle)))*AU_PER_YEAR_TO_KM_PER_SECOND;
  if(proximity.targetMoon!==null) {
    const moonA=proximity.targetMoon.orbit.semiMajorAxisKilometers/AU_KILOMETERS;
    const planetMassSolar=proximity.targetPlanet.massEarth/EARTH_MASSES_PER_SOLAR_MASS;
    const moonSpeed=Math.sqrt(TWO_PI_SQUARED*planetMassSolar/moonA)*AU_PER_YEAR_TO_KM_PER_SECOND;
    relative=Math.sqrt(relative**2+moonSpeed**2);
  }
  return Math.max(0.05,relative);
}

function fractionAt(digest:Uint8Array,offset:number):number {
  return (digest[offset]*0x1000000+digest[offset+1]*0x10000+digest[offset+2]*0x100+digest[offset+3])/0x100000000;
}
function clamp01(value:number):number{return clamp(value,0,1);}
function clamp(value:number,min:number,max:number):number{return Math.max(min,Math.min(max,value));}
function wrapDegrees(value:number):number{return ((value%360)+360)%360;}
