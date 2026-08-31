import { type MinorBodyOrbitalElementsCatalogEntry } from './minor-body-orbital-elements-catalog';
import { type MinorBodyOrbitProximityAssessment } from './minor-body-orbit-proximity-assessment';
import { MinorBodyApproachTargetKind } from './minor-body-approach-target-kind';
import { MinorBodyResonanceRegime, type MinorBodyResonanceRegimeValue } from './minor-body-resonance-regime';
import { MinorBodyDynamicalZoneRegime, type MinorBodyDynamicalZoneRegimeValue } from './minor-body-dynamical-zone-regime';
import { type Planet } from './planet';

const TOLERANCE=1e-10;

/**
 * Point-23.4 immutable resonance / local-chaotic-zone diagnosis for one
 * existing minor body against one mature planet.
 *
 * Resonance is a near-commensurability candidate only; libration is not
 * integrated. `insideChaoticZone` is a simplified local instability marker,
 * not a prediction that the body will be scattered. Point 23.5 owns outcomes.
 */
export class MinorBodyResonanceAssessment {
  constructor(
    readonly minorBody:MinorBodyOrbitalElementsCatalogEntry,
    readonly targetPlanet:Planet,
    readonly proximityAssessment:MinorBodyOrbitProximityAssessment,
    readonly planetOrbitalPeriodYears:number,
    readonly periodRatioMinorToPlanet:number|null,
    readonly resonanceRegime:MinorBodyResonanceRegimeValue,
    readonly resonanceNumerator:number|null,
    readonly resonanceDenominator:number|null,
    readonly resonanceOrder:number|null,
    readonly resonanceNominalPeriodRatio:number|null,
    readonly resonanceFractionalError:number|null,
    readonly resonanceToleranceFraction:number,
    readonly resonanceCandidate:boolean,
    readonly planetToHostMassRatio:number,
    readonly chaoticZoneInnerAu:number,
    readonly chaoticZoneOuterAu:number,
    readonly insideChaoticZone:boolean,
    readonly zoneRegime:MinorBodyDynamicalZoneRegimeValue,
  ) {
    if(proximityAssessment.minorBody!==minorBody || proximityAssessment.targetKind!==MinorBodyApproachTargetKind.PLANET || proximityAssessment.targetPlanet!==targetPlanet || proximityAssessment.targetMoon!==null) {
      throw new RangeError('Point-23.4 assessment must retain the exact point-23.3 minor-body/planet proximity pair.');
    }
    assertPositive(planetOrbitalPeriodYears,'planetOrbitalPeriodYears');
    assertPositive(planetToHostMassRatio,'planetToHostMassRatio');
    assertPositive(resonanceToleranceFraction,'resonanceToleranceFraction');
    assertNonNegative(chaoticZoneInnerAu,'chaoticZoneInnerAu');
    assertPositive(chaoticZoneOuterAu,'chaoticZoneOuterAu');
    if(chaoticZoneOuterAu<=chaoticZoneInnerAu) throw new RangeError('chaoticZoneOuterAu must exceed chaoticZoneInnerAu.');
    if(!MinorBodyResonanceRegime.values.includes(resonanceRegime)) throw new RangeError('Unknown resonanceRegime.');
    if(!MinorBodyDynamicalZoneRegime.values.includes(zoneRegime)) throw new RangeError('Unknown zoneRegime.');

    const bound=minorBody.orbitalElements.isBound;
    if(!bound) {
      if(periodRatioMinorToPlanet!==null || resonanceNumerator!==null || resonanceDenominator!==null || resonanceOrder!==null || resonanceNominalPeriodRatio!==null || resonanceFractionalError!==null || resonanceCandidate || resonanceRegime!==MinorBodyResonanceRegime.NOT_APPLICABLE_UNBOUND || insideChaoticZone || zoneRegime!==MinorBodyDynamicalZoneRegime.UNBOUND_PASSAGE) {
        throw new RangeError('Unbound point-23.4 bodies cannot carry mean-motion resonance or bound chaotic-zone membership.');
      }
      return;
    }

    assertPositive(periodRatioMinorToPlanet as number,'periodRatioMinorToPlanet');
    if(resonanceCandidate) {
      if(resonanceNumerator===null || resonanceDenominator===null || resonanceOrder===null || resonanceNominalPeriodRatio===null || resonanceFractionalError===null) throw new RangeError('Resonance candidates require a complete integer commensurability description.');
      if(!Number.isInteger(resonanceNumerator)||resonanceNumerator<=0||!Number.isInteger(resonanceDenominator)||resonanceDenominator<=0||!Number.isInteger(resonanceOrder)||resonanceOrder<0) throw new RangeError('Resonance integers/order must be valid non-negative integers.');
      assertPositive(resonanceNominalPeriodRatio,'resonanceNominalPeriodRatio');
      assertNonNegative(resonanceFractionalError,'resonanceFractionalError');
      if(Math.abs(resonanceNominalPeriodRatio-resonanceNumerator/resonanceDenominator)>TOLERANCE || Math.abs(resonanceOrder-Math.abs(resonanceNumerator-resonanceDenominator))>TOLERANCE || resonanceFractionalError>resonanceToleranceFraction+TOLERANCE) throw new RangeError('Resonance candidate fields must match the integer period ratio and tolerance.');
      const expected=resonanceNumerator===resonanceDenominator ? MinorBodyResonanceRegime.CO_ORBITAL : (periodRatioMinorToPlanet as number)<1 ? MinorBodyResonanceRegime.INTERIOR : MinorBodyResonanceRegime.EXTERIOR;
      if(resonanceRegime!==expected) throw new RangeError('resonanceRegime must match the candidate period-ratio geometry.');
    } else if(resonanceRegime!==MinorBodyResonanceRegime.NONE || resonanceNumerator!==null || resonanceDenominator!==null || resonanceOrder!==null || resonanceNominalPeriodRatio!==null || resonanceFractionalError!==null) {
      throw new RangeError('Non-resonant bound assessments must not carry commensurability fields.');
    }

    const a=minorBody.orbitalElements.semiMajorAxisAu;
    const expectedInside=a>=chaoticZoneInnerAu-TOLERANCE && a<=chaoticZoneOuterAu+TOLERANCE;
    if(insideChaoticZone!==expectedInside) throw new RangeError('insideChaoticZone must reflect the minor-body semi-major axis against the simplified planet zone.');
    const expectedZone=insideChaoticZone
      ? resonanceCandidate ? MinorBodyDynamicalZoneRegime.CHAOTIC_RESONANT_OVERLAP : MinorBodyDynamicalZoneRegime.CHAOTIC_ZONE
      : resonanceCandidate ? MinorBodyDynamicalZoneRegime.RESONANT_BAND : MinorBodyDynamicalZoneRegime.BACKGROUND;
    if(zoneRegime!==expectedZone) throw new RangeError('zoneRegime must match resonance/chaotic-zone flags.');
  }
  get minorBodyKind(){return this.minorBody.orbitalElements.kind;}
  get minorBodyProceduralId(){return this.minorBody.orbitalElements.proceduralId;}
  get targetPlanetOrdinal(){return this.targetPlanet.planetOrdinal;}
  get isDynamicallyFlagged(){return this.resonanceCandidate||this.insideChaoticZone;}
}
function assertPositive(value:number|null,name:string):void {if(value===null||!Number.isFinite(value)||value<=0) throw new RangeError(`${name} must be finite and > 0.`);}
function assertNonNegative(value:number,name:string):void {if(!Number.isFinite(value)||value<0) throw new RangeError(`${name} must be finite and >= 0.`);}
