import { type MinorBodyResonanceAssessment } from '../../domain/planetary/minor-body-resonance-assessment';
import { type MinorBodyResonanceCatalog } from '../../domain/planetary/minor-body-resonance-catalog';
import {
  MinorBodyGiantInfluenceAssessment,
  MINOR_BODY_V1_GIANT_PERTURBER_MIN_MASS_EARTH,
  minorBodyGiantInfluenceRegimeV1,
} from '../../domain/planetary/minor-body-giant-influence-assessment';
import { MinorBodyGiantInfluenceCatalog } from '../../domain/planetary/minor-body-giant-influence-catalog';
import { type Planet } from '../../domain/planetary/planet';

const EARTH_MASSES_PER_SOLAR_MASS=332_946.0487;
const EARTH_ESCAPE_VELOCITY_KM_PER_SECOND=11.186;
const EARTH_ORBITAL_VELOCITY_KM_PER_SECOND=29.78469183;
const AU_PER_YEAR_TO_KM_PER_SECOND=4.740470463533349;
const TWO_PI_SQUARED=4*Math.PI*Math.PI;

/**
 * Point-23.5 pure giant-planet influence classifier.
 *
 * V1 selects planets >= 10 Mearth and combines their Safronov-like scattering
 * power with the frozen point-23.3 approach geometry and point-23.4
 * resonance/chaotic-zone diagnosis. It returns capture/ejection/perturbation
 * potentials only; no orbit is mutated before the concrete point-23.6 encounter.
 */
export class MinorBodyGiantInfluenceEngine {
  private constructor(){}

  static generate(resonanceCatalog:MinorBodyResonanceCatalog):MinorBodyGiantInfluenceCatalog {
    const giants=resonanceCatalog.planets.filter(planet=>planet.massEarth>=MINOR_BODY_V1_GIANT_PERTURBER_MIN_MASS_EARTH);
    const assessments:MinorBodyGiantInfluenceAssessment[]=[];
    for(const body of resonanceCatalog.orbitalCatalog.entries) {
      for(const giant of giants) {
        const resonance=resonanceCatalog.assessments.find(candidate=>candidate.minorBody===body&&candidate.targetPlanet===giant);
        if(resonance===undefined) throw new RangeError('Point-23.5 requires the exact point-23.4 body/giant assessment for every matrix pair.');
        assessments.push(assessmentV1(resonance,giant));
      }
    }
    return new MinorBodyGiantInfluenceCatalog(resonanceCatalog,giants,assessments);
  }
}

function assessmentV1(resonance:MinorBodyResonanceAssessment,planet:Planet):MinorBodyGiantInfluenceAssessment {
  const orbit=resonance.minorBody.orbitalElements;
  const hostMassSolar=orbit.gravitatingMassSolar;
  const escapeVelocity=EARTH_ESCAPE_VELOCITY_KM_PER_SECOND*Math.sqrt(planet.massEarth/planet.radiusEarth);
  const orbitalVelocity=EARTH_ORBITAL_VELOCITY_KM_PER_SECOND*Math.sqrt(hostMassSolar/planet.orbit.semiMajorAxisAu);
  const hillRadius=resonance.proximityAssessment.targetCorridorRadiusAu;
  const planetMassSolar=planet.massEarth/EARTH_MASSES_PER_SOLAR_MASS;
  const hillEscapeVelocity=Math.sqrt(2*TWO_PI_SQUARED*planetMassSolar/hillRadius)*AU_PER_YEAR_TO_KM_PER_SECOND;
  const safronov=0.5*(escapeVelocity/orbitalVelocity)**2;
  const scattering=clamp01(safronov/(1+safronov));

  const proximity=resonance.proximityAssessment;
  let geometry=0;
  if(proximity.radialRangesOverlap) geometry+=0.12;
  if(proximity.approachPossible) geometry+=0.48;
  if(resonance.insideChaoticZone) geometry+=0.28;
  if(resonance.resonanceCandidate) geometry+=0.12;
  geometry=clamp01(geometry);

  const resonanceExcitation=resonance.resonanceCandidate
    ? resonance.resonanceOrder===0 ? 0.42 : 0.62/(1+(resonance.resonanceOrder as number)*0.35)
    : 0;
  const chaoticExcitation=resonance.insideChaoticZone?1:0;
  const perturbation=clamp01(
    0.52*geometry+
    0.28*scattering+
    0.12*chaoticExcitation+
    0.08*resonanceExcitation
  );

  let capture=0;
  let ejection=0;
  if(orbit.isBound) {
    const semimajorCloseness=Math.exp(-Math.abs(orbit.semiMajorAxisAu-planet.orbit.semiMajorAxisAu)/Math.max(1e-12,2*hillRadius));
    const approachFactor=proximity.approachPossible?1:0;
    capture=clamp01(approachFactor*scattering*(0.58*semimajorCloseness+0.22*(resonance.resonanceCandidate?1:0)+0.20*(resonance.insideChaoticZone?1:0)));
    const bindingFragility=Math.sqrt(orbit.semiMajorAxisAu/(orbit.semiMajorAxisAu+planet.orbit.semiMajorAxisAu));
    ejection=clamp01(scattering*geometry*(0.42+0.58*bindingFragility)*(proximity.approachPossible?1:0.72));
  } else {
    const vInfinity=Math.sqrt(2*orbit.specificOrbitalEnergyAu2PerYear2)*AU_PER_YEAR_TO_KM_PER_SECOND;
    const lowExcessSpeed=clamp01(hillEscapeVelocity/(hillEscapeVelocity+vInfinity));
    capture=clamp01((proximity.approachPossible?1:0)*scattering*lowExcessSpeed*1.35);
    ejection=0;
  }

  const regime=minorBodyGiantInfluenceRegimeV1(orbit.isBound,geometry,perturbation,capture,ejection);
  return new MinorBodyGiantInfluenceAssessment(
    resonance,
    planet,
    escapeVelocity,
    orbitalVelocity,
    hillEscapeVelocity,
    safronov,
    scattering,
    geometry,
    perturbation,
    capture,
    ejection,
    regime,
  );
}

function clamp01(value:number):number{return Math.max(0,Math.min(1,value));}
