import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { buildSystemSceneTnoPresentationV1 } from './system-scene-tno-presentation';
import { type CompactHostPlanetarySystem } from '../../domain/planetary/compact-host-planetary-system';
import { type CompactHostMoon, type CompactHostMinorBody } from '../../domain/planetary/compact-host-secondary-population';
import { buildSystemSceneMoonPresentationV1 } from './system-scene-moon-presentation';
import { limitSystemSceneMoonPresentationToHostV1 } from './system-scene-moon-host-size-limit';
import { buildSystemSceneAsteroidPresentationV1 } from './system-scene-asteroid-presentation';
import { buildSystemSceneCometPresentationV1 } from './system-scene-comet-presentation';
import { CompactHostEnvironmentEngine } from '../../simulation/planetary/compact-host-environment-engine';
import { type SystemSceneBodySnapshot, type SystemSceneMoonSnapshot,
  type SystemSceneMinorBodySnapshot, type SystemSceneOrbitSnapshot,
  type SystemSceneOrbitalMotionSnapshot, type SystemSceneAsteroidBeltSnapshot,
  type SystemSceneMotionContributionSnapshot } from './system-scene-snapshot';
import { type SystemSceneScaleSnapshot } from './system-scene-scale-projection';
import { moonRomanNumeralV1 } from '../../domain/planetary/moon-designation';

export interface CompactSecondarySceneProjection {
  readonly moons: readonly SystemSceneMoonSnapshot[];
  readonly minorBodies: readonly SystemSceneMinorBodySnapshot[];
  readonly belts: readonly SystemSceneAsteroidBeltSnapshot[];
  readonly motions: readonly SystemSceneOrbitalMotionSnapshot[];
  readonly orbits: readonly SystemSceneOrbitSnapshot[];
  readonly moonBindings: readonly Readonly<{sceneBodyId:string;bodyIndex:string;moonIndex:string}>[];
}

const MIN_COMET_REFERENCE_LUMINOSITY_SOLAR = 1e-6;

function buildCompactHostCometPresentationV1(
  body: CompactHostMinorBody,
  referenceLuminositySolar: number,
) {
  return buildSystemSceneCometPresentationV1({
    proceduralId: body.proceduralId,
    diameterKilometers: body.diameterKilometers,
    iceFraction01: body.iceFraction01,
    dustFraction01: 1 - body.iceFraction01,
    porosityIndex01: 0.42,
    bulkDensityGramsPerCubicCentimeter: body.bulkDensityGramsCm3,
    geometricAlbedo01: body.geometricAlbedo01,
    volatileRichnessIndex01: body.iceFraction01,
    periodRegime: 'LONG_PERIOD',
    // 31.4g compact-host snapshots may lack an accredited luminous channel.
    // The renderer still needs the canonical COM-R1 nucleus everywhere, so we
    // floor the value to a tiny positive seed-only proxy. Activity parity and
    // unresolved gates remain responsible for withholding coma/tails.
    referenceLuminositySolar: Math.max(
      referenceLuminositySolar,
      MIN_COMET_REFERENCE_LUMINOSITY_SOLAR,
    ),
    semiMajorAxisAu: body.semiMajorAxisAu,
    eccentricity: body.eccentricity,
    periapsisAu: body.periapsisAu,
    apoapsisAu: body.apoapsisAu,
    orbitalPeriodYears: body.orbitalPeriodDays / 365.25,
    epochMeanAnomalyDegrees: body.ordinal * 47,
    presentationTimeScale: 1,
  });
}

/** 31.4g bridge using canonical moon, asteroid and comet renderer inputs.
 * Different outer/inner presentation AU scales are visual only, preserving AU
 * dynamics, host–planet distances and fiche identity as immutable source facts. */
export function projectCompactHostSecondaries(system: CompactHostPlanetarySystem,
  planets: readonly SystemSceneBodySnapshot[], scale:SystemSceneScaleSnapshot,
  systemName:string):CompactSecondarySceneProjection {
  const moons:SystemSceneMoonSnapshot[]=[];
  const minorBodies:SystemSceneMinorBodySnapshot[]=[];
  const belts:SystemSceneAsteroidBeltSnapshot[]=[];
  const motions:SystemSceneOrbitalMotionSnapshot[]=[];
  const orbits:SystemSceneOrbitSnapshot[]=[];
  const moonBindings:{sceneBodyId:string;bodyIndex:string;moonIndex:string}[]=[];
  const secondaries=system.secondaries;

  for (const moon of secondaries.moons) {
    const planet=planets[moon.parentPlanetOrdinal-1];
    if (!planet) throw new Error('31.4g orphan moon: no public planet.');
    const ordinal=moon.ordinal;
    const moonId=`compact-moon-${moon.parentPlanetOrdinal}-${ordinal}`;
    const motionId=`${moonId}-motion`;
    const orbitId=`${moonId}-orbit`;
    const visual=limitSystemSceneMoonPresentationToHostV1(buildSystemSceneMoonPresentationV1({
      moonIdentity:moonId+'|'+system.host.systemLocator.sectorKey.toString(),
      hostPlanetType:system.planets[moon.parentPlanetOrdinal-1]?.bulkKind??'ROCKY',
      radiusEarth:moon.radiusEarth,massEarth:moon.massEarth,
      meanDensityGramsPerCubicCentimeter:moon.densityGramsCm3,
      surfaceGravityEarth:moon.massEarth/moon.radiusEarth**2,
      atmosphereRetentionIndex01:0,atmosphereRegime:'NONE',
      waterInventoryIndex01:moon.waterInventoryIndex01,
      inferredIceRichnessIndex01:moon.iceRichnessIndex01,
      subsurfaceOceanPotentialIndex01:0,surfaceLiquidWaterPotentialIndex01:0,
      waterRegime:moon.temperatureScenarioK!==null && moon.temperatureScenarioK<245 &&
        moon.iceRichnessIndex01>0.4?'SURFACE_ICE':'NONE',
      estimatedSurfaceTemperatureKelvin:moon.temperatureScenarioK??100,
      geologicalActivityIndex01:moon.tidalHeatingIndex01,
      tidalHeatingIndex01:moon.tidalHeatingIndex01,
      geologyRegime:moon.tidalHeatingIndex01>0.2?'TIDALLY_ACTIVE':'INERT',
      overallHabitabilityIndex01:0,isPotentiallyHabitable:false,
      giantHostSpecialization:false,giantCompositionRegime:'NOT_APPLICABLE',
      isLargeGiantMoon:false,isTidallyActiveGiantMoon:false,
      isOceanBearingGiantMoonCandidate:false,
    }),planet.radiusScene);
    // Orbital presentation space is host-relative. The physical AU orbit and
    // period remain unchanged; small moons are visually separated for picking.
    const localDistance=planet.radiusScene+visual.presentationRadiusScene+0.12+(ordinal-1)*0.18;
    const localScale=localDistance/moon.semiMajorAxisAu;
    const parent=planet.motionContributions;
    const child:Object = Object.freeze({motionId,scale:1,linearScenePerAu:localScale,
      presentationTimeScale:Math.min(1,moon.orbitalPeriodDays/480)});
    const motionParts=Object.freeze([...parent,child as SystemSceneMotionContributionSnapshot]);
    motions.push(Object.freeze({id:motionId,semiMajorAxisAu:moon.semiMajorAxisAu,
      eccentricity:moon.eccentricity,periodDays:moon.orbitalPeriodDays,
      rotationDegrees:ordinal*29,inclinationDegrees:moon.inclinationDegrees,
      epochMeanAnomalyDegrees:ordinal*61}));
    orbits.push(Object.freeze({id:orbitId,kind:'moon' as const,label:`Órbita lunar ${ordinal}`,
      colorHex:'#7492AE',opacity:0.36,semiMajorScene:localDistance,
      semiMinorScene:localDistance*Math.sqrt(1-moon.eccentricity**2),
      focusOffsetScene:localDistance*moon.eccentricity,
      rotationDegrees:ordinal*29,inclinationDegrees:moon.inclinationDegrees,
      motionId,motionScale:1,linearScenePerAu:localScale,anchorMotionContributions:parent}));
    moons.push(Object.freeze({id:moonId,kind:'moon' as const,
      label:moonRomanNumeralV1(ordinal),title:`${systemName} ${moon.parentPlanetOrdinal} ${moonRomanNumeralV1(ordinal)}`,
      hostPlanetId:planet.id,hostPlanetOrdinal:moon.parentPlanetOrdinal,
      colorHex:visual.presentationBaseColorHex,radiusScene:visual.presentationRadiusScene,
      position:Object.freeze({x:0,y:0,z:0}),orbitId,motionContributions:motionParts,
      spin:Object.freeze({source:'MOON_21_4' as const,rotationPeriodHours:moon.orbitalPeriodDays*24,
        axialTiltDegrees:null,isRetrograde:false,isSynchronized:true,epochPhaseDegrees:ordinal*43}),
      visualPresentation:visual}));
    moonBindings.push(Object.freeze({sceneBodyId:moonId,
      bodyIndex:(moon.parentPlanetOrdinal-1).toString(),moonIndex:(ordinal-1).toString()}));
  }

  const maxApo=Math.max(1,...secondaries.minorBodies.map(b=>b.apoapsisAu),
    ...secondaries.debrisBelts.map(b=>b.outerEdgeAu));
  const minorScale=Math.min(scale.orbitScaleScenePerAu,4.8/maxApo);
  const radiation=CompactHostEnvironmentEngine.resolveHostRadiation(system.host);
  // Unaccredited photons cannot drive a physical comet tail.
  const physicalLuminosity=(radiation.thermalLuminositySolar??0)+
    (radiation.accretionBolometricLuminositySolar??0);
  for (const body of secondaries.minorBodies) {
    const sceneBodyId=`minor-${body.kind.code}-${body.proceduralId}`;
    const motionId=`${sceneBodyId}-motion`;
    const orbitId=`${sceneBodyId}-orbit`;
    const shape=body.kind===MinorBodyKind.ASTEROID ? buildSystemSceneAsteroidPresentationV1({
      proceduralId:body.proceduralId,diameterKilometers:body.diameterKilometers,
      compositionRegime:body.iceFraction01>0.42?'ICE_RICH':'SILICACEOUS',
      structureRegime:'FRACTURED',multiplicityRegime:'SINGLE',
      carbonaceousFraction01:0.1,silicateFraction01:0.9-body.iceFraction01,
      metalFraction01:0,iceFraction01:body.iceFraction01,
      porosityIndex01:0.32,bulkDensityGramsPerCubicCentimeter:body.bulkDensityGramsCm3,
      geometricAlbedo01:body.geometricAlbedo01,binaryMassRatio01:null,binarySeparationPrimaryRadii:null,
    }) : null;
    const comet=body.kind===MinorBodyKind.COMET
      ? buildCompactHostCometPresentationV1(body, physicalLuminosity)
      : null;
    const tno=body.kind===MinorBodyKind.TRANS_NEPTUNIAN_OBJECT
      ? buildSystemSceneTnoPresentationV1({
          proceduralId:body.proceduralId,diameterKilometers:body.diameterKilometers,
          iceFraction01:body.iceFraction01,rockFraction01:1-body.iceFraction01,
          geometricAlbedo01:body.geometricAlbedo01,
          bulkDensityGramsPerCubicCentimeter:body.bulkDensityGramsCm3,
        }) : null;
    motions.push(Object.freeze({id:motionId,semiMajorAxisAu:body.semiMajorAxisAu,
      eccentricity:body.eccentricity,periodDays:body.orbitalPeriodDays,
      rotationDegrees:body.longitudeNodeDegrees,inclinationDegrees:body.inclinationDegrees,
      epochMeanAnomalyDegrees:body.ordinal*47}));
    orbits.push(Object.freeze({id:orbitId,kind:'minor-body' as const,
      label:`Órbita ${body.kind.name.toLowerCase()} ${body.ordinal}`,
      colorHex:'#687987',opacity:0.18,semiMajorScene:body.semiMajorAxisAu*minorScale,
      semiMinorScene:body.semiMajorAxisAu*Math.sqrt(1-body.eccentricity**2)*minorScale,
      focusOffsetScene:body.semiMajorAxisAu*body.eccentricity*minorScale,
      rotationDegrees:body.longitudeNodeDegrees,inclinationDegrees:body.inclinationDegrees,
      motionId,motionScale:1,linearScenePerAu:minorScale,
      anchorMotionContributions:Object.freeze([])}));
    minorBodies.push(Object.freeze({id:sceneBodyId,kind:'minor-body' as const,
      minorBodyKind:body.kind,label:`${body.ordinal}`,title:`${systemName} · ${body.kind.name} ${body.ordinal}`,
      colorHex:body.kind===MinorBodyKind.COMET?'#95C0CC':'#A6A29C',
      radiusScene:Math.min(0.034,0.009+0.014*Math.cbrt(body.diameterKilometers/100)),
      position:Object.freeze({x:0,y:0,z:0}),orbitId,
      motionContributions:Object.freeze([Object.freeze({motionId,scale:1,linearScenePerAu:minorScale})]),
      asteroidPresentation:shape,cometPresentation:comet,tnoPresentation:tno}));
  }
  for (const belt of secondaries.debrisBelts) {
    belts.push(Object.freeze({id:`compact-belt-${belt.region}`,label:`Material residual ${belt.region}`,
      region:belt.region,innerEdgeAu:belt.innerEdgeAu,outerEdgeAu:belt.outerEdgeAu,
      peakAu:null,populationIndex01:belt.populationIndex01,
      innerRadiusScene:belt.innerEdgeAu*minorScale,outerRadiusScene:belt.outerEdgeAu*minorScale,
      peakRadiusScene:null,colorHex:'#73839B',opacity:0.16,peakOpacity:0.22,
      boundaryOpacity:0.18,anchorMotionContributions:Object.freeze([])}));
  }
  return Object.freeze({moons:Object.freeze(moons),minorBodies:Object.freeze(minorBodies),
    belts:Object.freeze(belts),motions:Object.freeze(motions),orbits:Object.freeze(orbits),
    moonBindings:Object.freeze(moonBindings)});
}
