import { MinorBodyDynamicalZoneRegime } from '../../domain/planetary/minor-body-dynamical-zone-regime';
import { type MinorBodyOrbitalElementsCatalog, type MinorBodyOrbitalElementsCatalogEntry } from '../../domain/planetary/minor-body-orbital-elements-catalog';
import { type MinorBodyOrbitProximityAssessment } from '../../domain/planetary/minor-body-orbit-proximity-assessment';
import { type MinorBodyOrbitProximityCatalog } from '../../domain/planetary/minor-body-orbit-proximity-catalog';
import { MinorBodyResonanceAssessment } from '../../domain/planetary/minor-body-resonance-assessment';
import { MinorBodyResonanceCatalog } from '../../domain/planetary/minor-body-resonance-catalog';
import { MinorBodyResonanceRegime } from '../../domain/planetary/minor-body-resonance-regime';
import { type Planet } from '../../domain/planetary/planet';

const EARTH_MASSES_PER_SOLAR_MASS=332_946.0487;
const CHAOTIC_ZONE_COEFFICIENT=1.5;
const MAX_RESONANCE_INTEGER=5;
const MAX_RESONANCE_ORDER=2;
const MIN_RESONANCE_TOLERANCE=0.002;
const MAX_RESONANCE_TOLERANCE=0.025;

interface ResonanceMatch {readonly numerator:number;readonly denominator:number;readonly order:number;readonly nominalRatio:number;readonly fractionalError:number;readonly tolerance:number;}

/**
 * Point-23.4 pure diagnostic engine.
 *
 * V1 searches low-order p:q mean-motion commensurabilities (integers <= 5,
 * order <= 2) for bound bodies. It does not integrate resonant angles, so a
 * match is deliberately only a candidate band. A local chaotic/clearing zone
 * is approximated around each planet with the classic mass-ratio scaling
 * Δa ~= 1.5 a μ^(2/7), broadened by the planet's own radial eccentric excursion.
 * No orbit is changed and no scattering/capture/ejection verdict is produced.
 */
export class MinorBodyResonanceEngine {
  private constructor(){}
  static generate(orbitalCatalog:MinorBodyOrbitalElementsCatalog,proximityCatalog:MinorBodyOrbitProximityCatalog):MinorBodyResonanceCatalog {
    if(proximityCatalog.orbitalCatalog!==orbitalCatalog) throw new RangeError('MinorBodyResonanceEngine requires point-23.3 geometry from the exact supplied point-23.2 orbital catalog.');
    const planets=proximityCatalog.planets;
    const assessments:MinorBodyResonanceAssessment[]=[];
    for(const body of orbitalCatalog.entries){
      for(const planet of planets){
        const proximity=proximityCatalog.assessments.find(candidate=>candidate.minorBody===body&&candidate.targetPlanet===planet&&candidate.targetMoon===null);
        if(proximity===undefined) throw new RangeError('Point-23.4 requires the exact point-23.3 planet proximity assessment for every matrix pair.');
        assessments.push(assessmentV1(body,planet,proximity));
      }
    }
    return new MinorBodyResonanceCatalog(orbitalCatalog,proximityCatalog,planets,assessments);
  }
}

function assessmentV1(body:MinorBodyOrbitalElementsCatalogEntry,planet:Planet,proximity:MinorBodyOrbitProximityAssessment):MinorBodyResonanceAssessment {
  const orbit=body.orbitalElements;
  const hostMassSolar=orbit.gravitatingMassSolar;
  const planetPeriod=Math.sqrt(planet.orbit.semiMajorAxisAu**3/hostMassSolar);
  const massRatio=planet.massEarth/(EARTH_MASSES_PER_SOLAR_MASS*hostMassSolar);
  const eccentricExcursion=planet.orbit.semiMajorAxisAu*planet.orbit.eccentricity;
  const chaoticHalfWidth=CHAOTIC_ZONE_COEFFICIENT*planet.orbit.semiMajorAxisAu*massRatio**(2/7)+eccentricExcursion;
  const chaoticInner=Math.max(0,planet.orbit.semiMajorAxisAu-chaoticHalfWidth);
  const chaoticOuter=planet.orbit.semiMajorAxisAu+chaoticHalfWidth;

  if(!orbit.isBound){
    return new MinorBodyResonanceAssessment(body,planet,proximity,planetPeriod,null,MinorBodyResonanceRegime.NOT_APPLICABLE_UNBOUND,null,null,null,null,null,resonanceToleranceV1(massRatio,1,false),false,massRatio,chaoticInner,chaoticOuter,false,MinorBodyDynamicalZoneRegime.UNBOUND_PASSAGE);
  }
  const periodRatio=(orbit.orbitalPeriodYears as number)/planetPeriod;
  const match=nearestResonanceV1(periodRatio,massRatio);
  const inside=orbit.semiMajorAxisAu>=chaoticInner&&orbit.semiMajorAxisAu<=chaoticOuter;
  const candidate=match!==null;
  const resonanceRegime=!candidate?MinorBodyResonanceRegime.NONE:match.numerator===match.denominator?MinorBodyResonanceRegime.CO_ORBITAL:periodRatio<1?MinorBodyResonanceRegime.INTERIOR:MinorBodyResonanceRegime.EXTERIOR;
  const zone=inside?(candidate?MinorBodyDynamicalZoneRegime.CHAOTIC_RESONANT_OVERLAP:MinorBodyDynamicalZoneRegime.CHAOTIC_ZONE):(candidate?MinorBodyDynamicalZoneRegime.RESONANT_BAND:MinorBodyDynamicalZoneRegime.BACKGROUND);
  return new MinorBodyResonanceAssessment(body,planet,proximity,planetPeriod,periodRatio,resonanceRegime,match?.numerator??null,match?.denominator??null,match?.order??null,match?.nominalRatio??null,match?.fractionalError??null,match?.tolerance??resonanceToleranceV1(massRatio,1,false),candidate,massRatio,chaoticInner,chaoticOuter,inside,zone);
}

function nearestResonanceV1(periodRatio:number,massRatio:number):ResonanceMatch|null {
  let best:ResonanceMatch|null=null;
  for(let numerator=1;numerator<=MAX_RESONANCE_INTEGER;numerator+=1){
    for(let denominator=1;denominator<=MAX_RESONANCE_INTEGER;denominator+=1){
      if(gcd(numerator,denominator)!==1) continue;
      const order=Math.abs(numerator-denominator);
      if(order>MAX_RESONANCE_ORDER) continue;
      const nominal=numerator/denominator;
      const error=Math.abs(periodRatio-nominal)/nominal;
      const tolerance=resonanceToleranceV1(massRatio,order,numerator===denominator);
      if(error<=tolerance && (best===null||error<best.fractionalError-1e-15||(Math.abs(error-best.fractionalError)<=1e-15&&order<best.order))){
        best=Object.freeze({numerator,denominator,order,nominalRatio:nominal,fractionalError:error,tolerance});
      }
    }
  }
  return best;
}
function resonanceToleranceV1(massRatio:number,order:number,coOrbital:boolean):number {
  const massScale=Math.min(1.5,Math.sqrt(Math.max(0,massRatio)/0.001));
  const orderPenalty=1/(1+0.5*order);
  const coOrbitalFactor=coOrbital?1.35:1;
  return clamp((0.003+0.012*massScale)*orderPenalty*coOrbitalFactor,MIN_RESONANCE_TOLERANCE,MAX_RESONANCE_TOLERANCE);
}
function gcd(a:number,b:number):number{let x=a,y=b;while(y!==0){const next=x%y;x=y;y=next;}return x;}
function clamp(value:number,min:number,max:number):number{return Math.max(min,Math.min(max,value));}
