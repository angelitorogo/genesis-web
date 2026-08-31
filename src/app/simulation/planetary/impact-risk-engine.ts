import { MinorBodyApproachTargetKind } from '../../domain/planetary/minor-body-approach-target-kind';
import { type MinorBodyCloseEncounterCatalog } from '../../domain/planetary/minor-body-close-encounter-catalog';
import { MinorBodyImpactRiskAssessment } from '../../domain/planetary/minor-body-impact-risk-assessment';
import { MinorBodyImpactRiskCatalog } from '../../domain/planetary/minor-body-impact-risk-catalog';
import { MinorBodyImpactRiskRegime } from '../../domain/planetary/minor-body-impact-risk-regime';
import { type MinorBodyOrbitalElements } from '../../domain/planetary/minor-body-orbital-elements';
import { type MinorBodyOrbitalTransition } from '../../domain/planetary/minor-body-orbital-transition';
import { type Planet } from '../../domain/planetary/planet';
import { type PlanetaryOrbitalElements } from '../../domain/planetary/planetary-orbital-elements';
import { type RelevantMoon } from '../../domain/planetary/relevant-moon';

const EARTH_MASSES_PER_SOLAR_MASS=332_946.0487;
const EARTH_RADIUS_KILOMETERS=6_371;
const AU_KILOMETERS=149_597_870.7;
const AU_PER_YEAR_TO_KM_PER_SECOND=4.740470463533349;
const TWO_PI_SQUARED=4*Math.PI*Math.PI;
const PLANE_PARALLEL_TOLERANCE=1e-10;
const RADIAL_TOLERANCE_AU=1e-12;
const COPLANAR_SAMPLE_COUNT=720;

interface MoonPhysicalV1 {readonly massEarth?:number;readonly radiusEarth?:number;}
interface OrbitGeometry {
  readonly semiMajorAxisAu:number;
  readonly eccentricity:number;
  readonly inclinationDegrees:number;
  readonly longitudeAscendingNodeDegrees:number;
  readonly argumentOfPeriapsisDegrees:number;
  readonly periapsisAu:number;
  readonly apoapsisAu:number|null;
}
interface NodeGeometry {readonly mutualInclinationDegrees:number;readonly minimumNodalSeparationAu:number|null;}
interface Vector3 {readonly x:number;readonly y:number;readonly z:number;}
interface OrbitalFrame {readonly periapsisDirection:Vector3;readonly transverseDirection:Vector3;readonly normal:Vector3;}

/**
 * Point-23.7 post-encounter orbital-impact risk engine.
 *
 * The engine recomputes geometry from every point-23.6 outgoing orbit. It does
 * not assign a time-window probability or create an impact event. Planets use
 * shared-focus nodal geometry plus gravitational focusing. Moons remain a
 * host-planet orbital-region exposure because point 21 does not freeze a full
 * heliocentric lunar orientation/phase.
 */
export class ImpactRiskEngine {
  private constructor() {}

  static generate(closeEncounterCatalog:MinorBodyCloseEncounterCatalog):MinorBodyImpactRiskCatalog {
    const proximity=closeEncounterCatalog.proximityCatalog;
    const relevantMoons=proximity.moonSystems.flatMap(system=>system.relevantMoons);
    const assessments:MinorBodyImpactRiskAssessment[]=[];

    for(const transition of closeEncounterCatalog.transitions) {
      const planetGeometry=new Map<number,NodeGeometry>();
      for(const planet of proximity.planets) {
        const source=sourceProximityV1(closeEncounterCatalog,transition,MinorBodyApproachTargetKind.PLANET,planet,null);
        const assessment=planetAssessmentV1(transition,planet,source.targetCorridorRadiusAu);
        assessments.push(assessment);
        planetGeometry.set(planet.planetOrdinal,Object.freeze({
          mutualInclinationDegrees:assessment.mutualInclinationDegrees,
          minimumNodalSeparationAu:assessment.minimumNodalSeparationAu,
        }));
      }
      for(const moon of relevantMoons) {
        const hostPlanet=proximity.planets[moon.hostPlanetOrdinal-1];
        const geometry=planetGeometry.get(moon.hostPlanetOrdinal);
        if(hostPlanet===undefined||geometry===undefined) throw new RangeError('Point-23.7 relevant moon must resolve its exact host-planet post-encounter geometry.');
        const source=sourceProximityV1(closeEncounterCatalog,transition,MinorBodyApproachTargetKind.MOON,hostPlanet,moon);
        assessments.push(moonAssessmentV1(transition,hostPlanet,moon,geometry,source.targetCorridorRadiusAu));
      }
    }

    return new MinorBodyImpactRiskCatalog(closeEncounterCatalog,assessments);
  }
}

function sourceProximityV1(
  closeCatalog:MinorBodyCloseEncounterCatalog,
  transition:MinorBodyOrbitalTransition,
  targetKind:typeof MinorBodyApproachTargetKind.PLANET|typeof MinorBodyApproachTargetKind.MOON,
  planet:Planet,
  moon:RelevantMoon|null,
) {
  const source=closeCatalog.proximityCatalog.assessments.find(item=>
    item.minorBody===transition.minorBody&&item.targetKind===targetKind&&item.targetPlanet===planet&&item.targetMoon===moon
  );
  if(source===undefined) throw new RangeError('Point-23.7 could not recover the frozen point-23.3 target corridor for a transition/target pair.');
  return source;
}

function planetAssessmentV1(transition:MinorBodyOrbitalTransition,planet:Planet,targetCorridorRadiusAu:number):MinorBodyImpactRiskAssessment {
  const orbit=transition.outgoingOrbitalElements;
  const target=planetOrbitGeometryV1(planet.orbit);
  const radialGapAu=radialIntervalGapAu(orbit.periapsisAu,orbit.apoapsisAu,target.periapsisAu,target.apoapsisAu);
  const radialRangesOverlap=radialGapAu<=RADIAL_TOLERANCE_AU;
  const nodes=nodeGeometryV1(orbit,target);
  return materializeRiskV1(transition,MinorBodyApproachTargetKind.PLANET,planet,null,radialRangesOverlap,radialGapAu,nodes,targetCorridorRadiusAu);
}

function moonAssessmentV1(
  transition:MinorBodyOrbitalTransition,
  planet:Planet,
  moon:RelevantMoon,
  hostNodes:NodeGeometry,
  targetCorridorRadiusAu:number,
):MinorBodyImpactRiskAssessment {
  const orbit=transition.outgoingOrbitalElements;
  const target=planetOrbitGeometryV1(planet.orbit);
  const inner=Math.max(0,target.periapsisAu-targetCorridorRadiusAu);
  const outer=(target.apoapsisAu??target.periapsisAu)+targetCorridorRadiusAu;
  const radialGapAu=radialIntervalGapAu(orbit.periapsisAu,orbit.apoapsisAu,inner,outer);
  return materializeRiskV1(transition,MinorBodyApproachTargetKind.MOON,planet,moon,radialGapAu<=RADIAL_TOLERANCE_AU,radialGapAu,hostNodes,targetCorridorRadiusAu);
}

function materializeRiskV1(
  transition:MinorBodyOrbitalTransition,
  targetKind:typeof MinorBodyApproachTargetKind.PLANET|typeof MinorBodyApproachTargetKind.MOON,
  planet:Planet,
  moon:RelevantMoon|null,
  radialRangesOverlap:boolean,
  radialGapAu:number,
  nodes:NodeGeometry,
  targetCorridorRadiusAu:number,
):MinorBodyImpactRiskAssessment {
  const minimumNodalSeparationAu=nodes.minimumNodalSeparationAu;
  const targetCorridorClearanceAu=minimumNodalSeparationAu===null?null:Math.max(0,minimumNodalSeparationAu-targetCorridorRadiusAu);
  const targetCorridorEntered=targetCorridorClearanceAu!==null&&targetCorridorClearanceAu<=RADIAL_TOLERANCE_AU;
  const physicalRadius=targetPhysicalRadiusAuV1(targetKind,planet,moon);
  const targetMassEarth=targetMassEarthV1(targetKind,planet,moon);
  const escapeVelocity=escapeVelocityKmPerSecondV1(targetMassEarth,physicalRadius);
  const relativeSpeed=relativeSpeedKmPerSecondV1(transition.outgoingOrbitalElements,planet,moon,nodes.mutualInclinationDegrees);
  const focusing=1+(escapeVelocity/Math.max(relativeSpeed,1e-9))**2;
  const effectiveImpactRadiusAu=Math.max(physicalRadius,Math.min(targetCorridorRadiusAu,physicalRadius*Math.sqrt(focusing)));
  const collisionCrossSectionFraction01=clamp01((effectiveImpactRadiusAu/targetCorridorRadiusAu)**2);
  const collisionClearance=targetKind===MinorBodyApproachTargetKind.PLANET&&minimumNodalSeparationAu!==null
    ? Math.max(0,minimumNodalSeparationAu-effectiveImpactRadiusAu)
    : null;
  const direct=targetKind===MinorBodyApproachTargetKind.PLANET&&collisionClearance!==null&&collisionClearance<=RADIAL_TOLERANCE_AU;
  const exposure=targetCorridorEntered&&minimumNodalSeparationAu!==null
    ? clamp01(1-minimumNodalSeparationAu/targetCorridorRadiusAu)
    : 0;
  const riskIndex=targetCorridorEntered?clamp01(Math.sqrt(exposure*collisionCrossSectionFraction01)):0;
  const regime=direct
    ? MinorBodyImpactRiskRegime.PLANET_COLLISION_CORRIDOR
    : targetCorridorEntered
      ? targetKind===MinorBodyApproachTargetKind.MOON
        ? MinorBodyImpactRiskRegime.MOON_ORBITAL_REGION
        : MinorBodyImpactRiskRegime.PLANET_APPROACH_CORRIDOR
      : radialRangesOverlap
        ? MinorBodyImpactRiskRegime.RADIAL_CROSSING_ONLY
        : MinorBodyImpactRiskRegime.NONE;

  return new MinorBodyImpactRiskAssessment(
    transition,targetKind,planet,moon,radialRangesOverlap,radialGapAu,nodes.mutualInclinationDegrees,
    minimumNodalSeparationAu,targetCorridorRadiusAu,targetCorridorClearanceAu,targetCorridorEntered,
    physicalRadius,escapeVelocity,relativeSpeed,focusing,effectiveImpactRadiusAu,collisionCrossSectionFraction01,
    collisionClearance,direct,exposure,riskIndex,targetCorridorEntered,regime,
  );
}

function targetPhysicalRadiusAuV1(kind:typeof MinorBodyApproachTargetKind.PLANET|typeof MinorBodyApproachTargetKind.MOON,planet:Planet,moon:RelevantMoon|null):number {
  const radiusEarth=kind===MinorBodyApproachTargetKind.PLANET?planet.radiusEarth:moonRadiusEarthV1(requiredMoon(moon));
  if(!Number.isFinite(radiusEarth)||radiusEarth<=0) throw new RangeError('Point-23.7 impact targets require a positive physical radius.');
  return radiusEarth*EARTH_RADIUS_KILOMETERS/AU_KILOMETERS;
}
function targetMassEarthV1(kind:typeof MinorBodyApproachTargetKind.PLANET|typeof MinorBodyApproachTargetKind.MOON,planet:Planet,moon:RelevantMoon|null):number {
  const mass=kind===MinorBodyApproachTargetKind.PLANET?planet.massEarth:moonMassEarthV1(requiredMoon(moon));
  if(!Number.isFinite(mass)||mass<=0) throw new RangeError('Point-23.7 impact targets require a positive physical mass.');
  return mass;
}
function requiredMoon(moon:RelevantMoon|null):RelevantMoon {if(moon===null) throw new RangeError('Point-23.7 moon target is missing.');return moon;}
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
function escapeVelocityKmPerSecondV1(massEarth:number,radiusAu:number):number {
  const massSolar=massEarth/EARTH_MASSES_PER_SOLAR_MASS;
  return Math.sqrt(2*TWO_PI_SQUARED*massSolar/radiusAu)*AU_PER_YEAR_TO_KM_PER_SECOND;
}
function relativeSpeedKmPerSecondV1(orbit:MinorBodyOrbitalElements,planet:Planet,moon:RelevantMoon|null,mutualInclinationDegrees:number):number {
  const r=planet.orbit.semiMajorAxisAu;
  const mu=TWO_PI_SQUARED*orbit.gravitatingMassSolar;
  const visViva=mu*(2/r-1/orbit.semiMajorAxisAu);
  const bodySpeed=Math.sqrt(Math.max(mu/Math.max(r,Math.abs(orbit.semiMajorAxisAu)),visViva));
  const planetSpeed=Math.sqrt(mu/r);
  const angle=mutualInclinationDegrees*Math.PI/180;
  let relative=Math.sqrt(Math.max(0,bodySpeed**2+planetSpeed**2-2*bodySpeed*planetSpeed*Math.cos(angle)))*AU_PER_YEAR_TO_KM_PER_SECOND;
  if(moon!==null) {
    const moonA=moon.orbit.semiMajorAxisKilometers/AU_KILOMETERS;
    const planetMassSolar=planet.massEarth/EARTH_MASSES_PER_SOLAR_MASS;
    const moonSpeed=Math.sqrt(TWO_PI_SQUARED*planetMassSolar/moonA)*AU_PER_YEAR_TO_KM_PER_SECOND;
    relative=Math.sqrt(relative**2+moonSpeed**2);
  }
  return Math.max(0.05,relative);
}

function planetOrbitGeometryV1(orbit:PlanetaryOrbitalElements):OrbitGeometry {
  return Object.freeze({
    semiMajorAxisAu:orbit.semiMajorAxisAu,eccentricity:orbit.eccentricity,inclinationDegrees:orbit.inclinationDegrees,
    longitudeAscendingNodeDegrees:orbit.longitudeOfAscendingNodeDegrees,argumentOfPeriapsisDegrees:orbit.argumentOfPeriapsisDegrees,
    periapsisAu:orbit.periastronAu,apoapsisAu:orbit.apoastronAu,
  });
}
function radialIntervalGapAu(firstPeriapsis:number,firstApoapsis:number|null,secondPeriapsis:number,secondApoapsis:number|null):number {
  const firstOuter=firstApoapsis??Number.POSITIVE_INFINITY;
  const secondOuter=secondApoapsis??Number.POSITIVE_INFINITY;
  if(firstOuter<secondPeriapsis) return secondPeriapsis-firstOuter;
  if(secondOuter<firstPeriapsis) return firstPeriapsis-secondOuter;
  return 0;
}
function nodeGeometryV1(firstOrbit:MinorBodyOrbitalElements,secondOrbit:OrbitGeometry):NodeGeometry {
  const first=orbitalFrameV1(firstOrbit);const second=orbitalFrameV1(secondOrbit);
  const normalDot=clamp(dot(first.normal,second.normal),-1,1);
  const mutualInclinationDegrees=Math.acos(normalDot)*180/Math.PI;
  const nodeLine=cross(first.normal,second.normal);const nodeMagnitude=magnitude(nodeLine);
  const minimumNodalSeparationAu=nodeMagnitude<=PLANE_PARALLEL_TOLERANCE
    ? coplanarMinimumRadialSeparationAuV1(firstOrbit,secondOrbit,first)
    : mutualNodeRadialSeparationAuV1(firstOrbit,secondOrbit,first,second,scale(nodeLine,1/nodeMagnitude));
  return Object.freeze({mutualInclinationDegrees,minimumNodalSeparationAu});
}
function orbitalFrameV1(orbit:Pick<OrbitGeometry,'inclinationDegrees'|'longitudeAscendingNodeDegrees'|'argumentOfPeriapsisDegrees'>):OrbitalFrame {
  const inclination=radians(orbit.inclinationDegrees),node=radians(orbit.longitudeAscendingNodeDegrees),periapsis=radians(orbit.argumentOfPeriapsisDegrees);
  const cosNode=Math.cos(node),sinNode=Math.sin(node),cosPeriapsis=Math.cos(periapsis),sinPeriapsis=Math.sin(periapsis),cosInclination=Math.cos(inclination),sinInclination=Math.sin(inclination);
  const periapsisDirection=Object.freeze({x:cosNode*cosPeriapsis-sinNode*sinPeriapsis*cosInclination,y:sinNode*cosPeriapsis+cosNode*sinPeriapsis*cosInclination,z:sinPeriapsis*sinInclination});
  const transverseDirection=Object.freeze({x:-cosNode*sinPeriapsis-sinNode*cosPeriapsis*cosInclination,y:-sinNode*sinPeriapsis+cosNode*cosPeriapsis*cosInclination,z:cosPeriapsis*sinInclination});
  return Object.freeze({periapsisDirection,transverseDirection,normal:normalize(cross(periapsisDirection,transverseDirection))});
}
function mutualNodeRadialSeparationAuV1(firstOrbit:OrbitGeometry,secondOrbit:OrbitGeometry,firstFrame:OrbitalFrame,secondFrame:OrbitalFrame,nodeDirection:Vector3):number|null {
  const candidates:number[]=[];
  for(const direction of [nodeDirection,scale(nodeDirection,-1)]) {
    const firstRadius=radiusAtDirectionAuV1(firstOrbit,firstFrame,direction),secondRadius=radiusAtDirectionAuV1(secondOrbit,secondFrame,direction);
    if(firstRadius!==null&&secondRadius!==null) candidates.push(Math.abs(firstRadius-secondRadius));
  }
  return candidates.length===0?null:Math.min(...candidates);
}
function coplanarMinimumRadialSeparationAuV1(firstOrbit:OrbitGeometry,secondOrbit:OrbitGeometry,firstFrame:OrbitalFrame):number|null {
  let minimum=Number.POSITIVE_INFINITY;const secondFrame=orbitalFrameV1(secondOrbit);
  for(let index=0;index<COPLANAR_SAMPLE_COUNT;index+=1) {
    const angle=2*Math.PI*index/COPLANAR_SAMPLE_COUNT;
    const direction=add(scale(firstFrame.periapsisDirection,Math.cos(angle)),scale(firstFrame.transverseDirection,Math.sin(angle)));
    const firstRadius=radiusAtDirectionAuV1(firstOrbit,firstFrame,direction);if(firstRadius===null) continue;
    const secondRadius=radiusAtDirectionAuV1(secondOrbit,secondFrame,direction);if(secondRadius===null) continue;
    minimum=Math.min(minimum,Math.abs(firstRadius-secondRadius));
  }
  return Number.isFinite(minimum)?minimum:null;
}
function radiusAtDirectionAuV1(orbit:OrbitGeometry,frame:OrbitalFrame,direction:Vector3):number|null {
  const x=dot(direction,frame.periapsisDirection),y=dot(direction,frame.transverseDirection);
  const trueAnomaly=Math.atan2(y,x);
  const denominator=1+orbit.eccentricity*Math.cos(trueAnomaly);
  if(denominator<=0) return null;
  const semiLatus=orbit.semiMajorAxisAu*(1-orbit.eccentricity**2);
  const radius=semiLatus/denominator;
  return Number.isFinite(radius)&&radius>0?radius:null;
}
function dot(left:Vector3,right:Vector3):number{return left.x*right.x+left.y*right.y+left.z*right.z;}
function cross(left:Vector3,right:Vector3):Vector3{return {x:left.y*right.z-left.z*right.y,y:left.z*right.x-left.x*right.z,z:left.x*right.y-left.y*right.x};}
function magnitude(value:Vector3):number{return Math.sqrt(dot(value,value));}
function normalize(value:Vector3):Vector3 {const length=magnitude(value);if(length<=0) throw new RangeError('Cannot normalize zero vector.');return scale(value,1/length);}
function scale(value:Vector3,factor:number):Vector3{return {x:value.x*factor,y:value.y*factor,z:value.z*factor};}
function add(left:Vector3,right:Vector3):Vector3{return {x:left.x+right.x,y:left.y+right.y,z:left.z+right.z};}
function radians(degrees:number):number{return degrees*Math.PI/180;}
function clamp01(value:number):number{return clamp(value,0,1);}
function clamp(value:number,min:number,max:number):number{return Math.max(min,Math.min(max,value));}
