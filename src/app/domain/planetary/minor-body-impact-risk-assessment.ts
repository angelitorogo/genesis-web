import { MinorBodyApproachTargetKind, type MinorBodyApproachTargetKindValue } from './minor-body-approach-target-kind';
import { MinorBodyImpactRiskRegime, type MinorBodyImpactRiskRegimeValue } from './minor-body-impact-risk-regime';
import { type MinorBodyOrbitalElements } from './minor-body-orbital-elements';
import { type MinorBodyOrbitalTransition } from './minor-body-orbital-transition';
import { type Planet } from './planet';
import { type RelevantMoon } from './relevant-moon';

const TOLERANCE=1e-12;

/**
 * Point-23.7 post-encounter orbital-risk assessment for one minor-body/target pair.
 *
 * This object deliberately separates orbital geometry from point-23.8 temporal
 * impact probability. A risk candidate says that the current outgoing orbit can
 * enter the target's dynamically relevant region; it does not say that an impact
 * occurs in any particular interval.
 */
export class MinorBodyImpactRiskAssessment {
  constructor(
    readonly transition:MinorBodyOrbitalTransition,
    readonly targetKind:MinorBodyApproachTargetKindValue,
    readonly targetPlanet:Planet,
    readonly targetMoon:RelevantMoon|null,
    readonly radialRangesOverlap:boolean,
    readonly radialGapAu:number,
    readonly mutualInclinationDegrees:number,
    readonly minimumNodalSeparationAu:number|null,
    readonly targetCorridorRadiusAu:number,
    readonly targetCorridorClearanceAu:number|null,
    readonly targetCorridorEntered:boolean,
    readonly targetPhysicalRadiusAu:number,
    readonly targetEscapeVelocityKmPerSecond:number,
    readonly characteristicRelativeSpeedKmPerSecond:number,
    readonly gravitationalFocusingFactor:number,
    readonly effectiveImpactRadiusAu:number,
    readonly collisionCrossSectionFraction01:number,
    readonly collisionCorridorClearanceAu:number|null,
    readonly directCollisionGeometryCandidate:boolean,
    readonly orbitalExposureIndex01:number,
    readonly orbitalRiskIndex01:number,
    readonly riskCandidate:boolean,
    readonly regime:MinorBodyImpactRiskRegimeValue,
  ) {
    if(!MinorBodyApproachTargetKind.values.includes(targetKind)) throw new RangeError('Unknown point-23.7 impact target kind.');
    if(targetKind===MinorBodyApproachTargetKind.PLANET&&targetMoon!==null) throw new RangeError('Planet impact-risk assessments must not carry a targetMoon.');
    if(targetKind===MinorBodyApproachTargetKind.MOON) {
      if(targetMoon===null||targetMoon.hostPlanetOrdinal!==targetPlanet.planetOrdinal||targetMoon.hostPlanetLocator!==targetPlanet.locator) {
        throw new RangeError('Moon impact-risk assessments must preserve the exact relevant-moon -> host-planet identity.');
      }
    }
    if(this.evaluatedOrbitalElements!==transition.outgoingOrbitalElements) throw new RangeError('Point-23.7 must evaluate the exact point-23.6 outgoing orbital-elements reference.');
    assertNonNegative(radialGapAu,'radialGapAu');
    if(radialRangesOverlap!==(radialGapAu<=TOLERANCE)) throw new RangeError('radialRangesOverlap must reflect radialGapAu = 0.');
    if(!Number.isFinite(mutualInclinationDegrees)||mutualInclinationDegrees<0||mutualInclinationDegrees>180) throw new RangeError('mutualInclinationDegrees must be finite in [0, 180].');
    if(minimumNodalSeparationAu!==null) assertNonNegative(minimumNodalSeparationAu,'minimumNodalSeparationAu');
    assertPositive(targetCorridorRadiusAu,'targetCorridorRadiusAu');
    if(targetCorridorClearanceAu!==null) assertNonNegative(targetCorridorClearanceAu,'targetCorridorClearanceAu');
    const expectedClearance=minimumNodalSeparationAu===null?null:Math.max(0,minimumNodalSeparationAu-targetCorridorRadiusAu);
    if(!sameNullable(targetCorridorClearanceAu,expectedClearance)) throw new RangeError('targetCorridorClearanceAu must equal max(0, nodal separation - target corridor).');
    const expectedEntered=expectedClearance!==null&&expectedClearance<=TOLERANCE;
    if(targetCorridorEntered!==expectedEntered) throw new RangeError('targetCorridorEntered must exactly reflect the post-23.6 target corridor geometry.');

    assertPositive(targetPhysicalRadiusAu,'targetPhysicalRadiusAu');
    assertPositive(targetEscapeVelocityKmPerSecond,'targetEscapeVelocityKmPerSecond');
    assertPositive(characteristicRelativeSpeedKmPerSecond,'characteristicRelativeSpeedKmPerSecond');
    if(!Number.isFinite(gravitationalFocusingFactor)||gravitationalFocusingFactor<1) throw new RangeError('gravitationalFocusingFactor must be finite and >= 1.');
    assertPositive(effectiveImpactRadiusAu,'effectiveImpactRadiusAu');
    if(effectiveImpactRadiusAu+TOLERANCE<targetPhysicalRadiusAu) throw new RangeError('effectiveImpactRadiusAu cannot be smaller than the physical target radius.');
    assertIndex(collisionCrossSectionFraction01,'collisionCrossSectionFraction01');
    if(collisionCorridorClearanceAu!==null) assertNonNegative(collisionCorridorClearanceAu,'collisionCorridorClearanceAu');
    assertIndex(orbitalExposureIndex01,'orbitalExposureIndex01');
    assertIndex(orbitalRiskIndex01,'orbitalRiskIndex01');

    if(targetKind===MinorBodyApproachTargetKind.MOON) {
      if(collisionCorridorClearanceAu!==null||directCollisionGeometryCandidate) {
        throw new RangeError('Point-23.7 cannot claim an exact lunar physical collision corridor without a frozen heliocentric lunar orientation/phase.');
      }
    } else {
      const expectedCollisionClearance=minimumNodalSeparationAu===null?null:Math.max(0,minimumNodalSeparationAu-effectiveImpactRadiusAu);
      if(!sameNullable(collisionCorridorClearanceAu,expectedCollisionClearance)) throw new RangeError('Planet collisionCorridorClearanceAu must use the gravitationally-focused effective impact radius.');
      const expectedDirect=expectedCollisionClearance!==null&&expectedCollisionClearance<=TOLERANCE;
      if(directCollisionGeometryCandidate!==expectedDirect) throw new RangeError('directCollisionGeometryCandidate must reflect entry into the planet effective impact radius.');
    }

    if(riskCandidate!==targetCorridorEntered) throw new RangeError('Point-23.7 riskCandidate must mean entry into the target dynamical corridor, not temporal impact probability.');
    if(!MinorBodyImpactRiskRegime.values.includes(regime)) throw new RangeError('Unknown MinorBodyImpactRiskRegime.');
    const expectedRegime=directCollisionGeometryCandidate
      ? MinorBodyImpactRiskRegime.PLANET_COLLISION_CORRIDOR
      : targetCorridorEntered
        ? targetKind===MinorBodyApproachTargetKind.MOON
          ? MinorBodyImpactRiskRegime.MOON_ORBITAL_REGION
          : MinorBodyImpactRiskRegime.PLANET_APPROACH_CORRIDOR
        : radialRangesOverlap
          ? MinorBodyImpactRiskRegime.RADIAL_CROSSING_ONLY
          : MinorBodyImpactRiskRegime.NONE;
    if(regime!==expectedRegime) throw new RangeError('Point-23.7 risk regime must match the frozen geometry flags.');
  }

  get minorBody(){return this.transition.minorBody;}
  get minorBodyKind(){return this.evaluatedOrbitalElements.kind;}
  get minorBodyProceduralId(){return this.evaluatedOrbitalElements.proceduralId;}
  get minorBodyDesignation(){return this.evaluatedOrbitalElements.localDesignation;}
  get evaluatedOrbitalElements():MinorBodyOrbitalElements{return this.transition.outgoingOrbitalElements;}
  get targetName(){return this.targetMoon?.name??this.targetPlanet.name;}
  get targetPlanetOrdinal(){return this.targetPlanet.planetOrdinal;}
  get targetMoonOrdinal(){return this.targetMoon?.moonOrdinal??null;}
  get isPlanetTarget(){return this.targetKind===MinorBodyApproachTargetKind.PLANET;}
  get isMoonTarget(){return this.targetKind===MinorBodyApproachTargetKind.MOON;}
}

function assertPositive(value:number,name:string):void {if(!Number.isFinite(value)||value<=0) throw new RangeError(`${name} must be finite and > 0.`);}
function assertNonNegative(value:number,name:string):void {if(!Number.isFinite(value)||value<0) throw new RangeError(`${name} must be finite and >= 0.`);}
function assertIndex(value:number,name:string):void {if(!Number.isFinite(value)||value<0||value>1) throw new RangeError(`${name} must be finite in [0, 1].`);}
function sameNullable(left:number|null,right:number|null):boolean {
  if(left===null||right===null) return left===right;
  return Math.abs(left-right)<=TOLERANCE*Math.max(1,Math.abs(left),Math.abs(right));
}
