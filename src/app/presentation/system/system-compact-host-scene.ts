import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { type CompactHostPlanetarySystem } from '../../domain/planetary/compact-host-planetary-system';
import { CompactHostEnvironmentEngine } from '../../simulation/planetary/compact-host-environment-engine';
import { buildSystemScenePlanetSurfacePresentationV1 } from './system-scene-planet-surface-presentation';
import { type ArchiveStellarSystemCardModel } from '../genesis-archive/archive-stellar-system-card';
import { buildLinearFitSystemScale } from './system-scene-scale-projection';
import { projectCompactHostSecondaries } from './system-compact-host-secondary-scene';
import { type SystemSceneSnapshot, type SystemSceneBodySnapshot, type SystemSceneOrbitalMotionSnapshot, type SystemSceneOrbitSnapshot } from './system-scene-snapshot';

const UNRESOLVED_SPIN = Object.freeze({ source:'UNAVAILABLE' as const, rotationPeriodHours:null,
  axialTiltDegrees:null, isRetrograde:null, isSynchronized:false, epochPhaseDegrees:0 });
const CENTER = Object.freeze({x:0,y:0,z:0});

/** Presentation-only: an illustrative disk can help the viewer inspect worlds.
 * These magnitudes never enter host emission, atmospheric or climate engines. */
export const COMPACT_BLACK_HOLE_INSPECTION_LIGHT_FLUX = 0.65;
export const COMPACT_BLACK_HOLE_INSPECTION_PLANET_FILL01 = 0.42;

/** Only the four neutron-star families shrink; approved BH geometry stays as is. */
export function compactHostVisualRadiusScene(kind: CompactHostPlanetarySystem['host']['type']): number {
  return kind === ExtremeType.STELLAR_MASS_BLACK_HOLE ? 0.38 : 0.32 * 0.25;
}

/** 31.4 public 3D projection: this NEVER touches the conventional stellar world. */
export function projectCompactHostScene(
  source: Readonly<{ universeSeed:string; generatorVersionCode:number; galaxyIndex:bigint;
    sectorKey:bigint; galacticObjectIndex:bigint; proceduralIdentity:string; discoveryStateLabel:string }>,
  card: ArchiveStellarSystemCardModel,
  state: DiscoveryStateValue,
  system: CompactHostPlanetarySystem,
): SystemSceneSnapshot {
  if (state.code < DiscoveryState.CATALOGUED.code) throw new RangeError('Compact scene requires catalogued identity.');
  const confirmed = state.code >= DiscoveryState.CONFIRMED.code;
  const planets = confirmed ? system.planets : [];
  const outerAu = planets.length ? planets[planets.length-1]!.apoastronAu * 1.18 : 4;
  const scale = buildLinearFitSystemScale(outerAu, 4.8);
  const kind = system.host.type;
  const blackHole = kind === ExtremeType.STELLAR_MASS_BLACK_HOLE;
  // Reference scenario is NOT stored back into the host's scientific state.
  // Rendering compresses its amplitude for legibility; true optical luminosity
  // is not known from the modeled XUV/thermal bolometric channels alone.
  const radiation = CompactHostEnvironmentEngine.resolveHostRadiation(system.host);
  const referenceEmitted = Math.max(0, radiation.thermalLuminositySolar ?? 0) +
    Math.max(0, radiation.energeticLuminositySolar ?? 0) * 0.08 +
    Math.max(0, radiation.accretionBolometricLuminositySolar ?? 0);
  // Compressed, enhanced diagnostic illumination. For NS-like hosts the
  // available emission is often X-ray/energetic: it is NOT an optical flux
  // measurement, even when the scientific bolometric channel is modeled.
  const presentationFlux = referenceEmitted > 0 ?
    Math.min(6, 1.8 + 1.8 * Math.log1p(20 * referenceEmitted)) : 0;
  const stars: readonly SystemSceneBodySnapshot[] = Object.freeze([Object.freeze({
    id:'compact-host-A', kind:'star' as const, compactHostKind:kind,
    compactHostPresentationFlux:presentationFlux,
    compactHostInspectionLightFlux:blackHole ? COMPACT_BLACK_HOLE_INSPECTION_LIGHT_FLUX : 0,
    compactHostAccretionLuminositySolar:system.host.scientificState.accretionLuminositySolar,
    label:'A', title:`${card.title} A`, colorHex:blackHole?'#141A20':'#88BFEA',
    radiusScene:compactHostVisualRadiusScene(kind), position:CENTER, orbitId:null, motionContributions:Object.freeze([]),
    surfaceStyle:'emissive' as const, lightIntensity:0,
    sourceLuminositySolar:null, spin:UNRESOLVED_SPIN,
    surfaceEnvironment:null, giantAtmosphere:null, specialPresentation:null,
  })]);
  const motions: SystemSceneOrbitalMotionSnapshot[] = [];
  const orbits: SystemSceneOrbitSnapshot[] = [];
  const bodies: SystemSceneBodySnapshot[] = [];
  for (const planet of planets) {
    const environment = system.environments[planet.ordinal - 1];
    const characterized = system.characterizations[planet.ordinal - 1]!;
    if (characterized.planetOrdinal !== planet.ordinal) throw new Error('31.4f scene/characterization mismatch.');
    const surfaceEnvironment = buildSystemScenePlanetSurfacePresentationV1({
      source:'COMPACT_HOST_CONDITIONAL_31_4F',
      waterInventoryIndex01:characterized.waterInventoryIndex01,
      surfaceLiquidWaterCoverageFraction01:characterized.surfaceLiquidWaterCoverageFraction01,
      surfaceIceCoverageFraction01:characterized.surfaceIceCoverageFraction01,
      waterVaporFraction01:characterized.waterVaporFraction01,
      retainedAtmosphericWaterVaporMoleFraction01:characterized.atmosphericGasMoleFractions
        ?.find(gas => gas.gas === 'WATER_VAPOR')?.fraction01 ?? 0,
      meanSurfaceTemperatureKelvin:characterized.surfaceTemperatureScenarioK,
      climateStabilityIndex01:characterized.climateStabilityIndex01,
      retainedSurfacePressurePascal:characterized.atmosphericPressurePa,
      geologicalActivityIndex01:characterized.geologyActivityIndex01,
      volcanismIndex01:characterized.volcanismIndex01,
      surfaceWaterRegime:characterized.surfaceLiquidWaterCoverageFraction01===null?'UNRESOLVED':
        characterized.surfaceLiquidWaterCoverageFraction01>0?'LIQUID_POSSIBLE':'NO_PERSISTENT_LIQUID',
      volcanismRegime:characterized.volcanismIndex01>=0.6?'HIGH':'MODELED',
    });
    // Irradiance evaluated at the planet in 31.3; use solely to establish a
    // bright but bounded *visual* daylight. Real spectra/optical albedo remain
    // unknown. An illustrative BH disk provides a restrained inspection fill.
    const normalizedIrradiance = Math.max(0, (environment?.modeledIncludedFluxWm2 ?? 0) / 1361);
    const presentationFill = normalizedIrradiance > 0
      ? Math.min(1, 0.30 + 0.70 * (1 - Math.exp(-Math.sqrt(normalizedIrradiance / 2))))
      : blackHole ? COMPACT_BLACK_HOLE_INSPECTION_PLANET_FILL01 : 0.08;
    const id = `planet-${planet.ordinal}`;
    const orbitId = `compact-orbit-${planet.ordinal}`;
    const motionId = `compact-motion-${planet.ordinal}`;
    const e = planet.eccentricity;
    motions.push(Object.freeze({ id:motionId, semiMajorAxisAu:planet.semiMajorAxisAu,
      eccentricity:e, periodDays:planet.orbitalPeriodDays, rotationDegrees:0,
      inclinationDegrees:0, epochMeanAnomalyDegrees:planet.ordinal * 47 % 360 }));
    orbits.push(Object.freeze({ id:orbitId, kind:'planetary' as const,
      label:`Órbita ${planet.ordinal}`, colorHex:'#6488A6', opacity:0.48,
      semiMajorScene:planet.semiMajorAxisAu*scale.orbitScaleScenePerAu,
      semiMinorScene:planet.semiMajorAxisAu*Math.sqrt(1-e*e)*scale.orbitScaleScenePerAu,
      focusOffsetScene:e*planet.semiMajorAxisAu*scale.orbitScaleScenePerAu,
      rotationDegrees:0, inclinationDegrees:0, motionId, motionScale:1,
      anchorMotionContributions:Object.freeze([]),
    }));
    bodies.push(Object.freeze({ id, kind:'planet' as const,
      label:`${planet.ordinal}`, title:`${card.title} ${planet.ordinal}`,
      colorHex:planet.bulkKind==='SUPER_EARTH'?'#9C8D83':'#9D8F7C',
      radiusScene:0.105*Math.max(0.75,Math.min(1.5,planet.radiusEarth**0.4)),
      position:CENTER, orbitId,
      motionContributions:Object.freeze([Object.freeze({motionId,scale:1})]),
      surfaceStyle:'rocky' as const, lightIntensity:0, sourceLuminositySolar:null,
      compactPlanetPresentationFill01:presentationFill,
      spin:Object.freeze({source:'COMPACT_31_4F' as const,
        rotationPeriodHours:characterized.rotationPeriodHours,
        axialTiltDegrees:characterized.axialTiltDegrees,isRetrograde:characterized.retrograde,
        isSynchronized:false,epochPhaseDegrees:0}),
      surfaceEnvironment, giantAtmosphere:null, specialPresentation:null,
    }));
  }
  const secondaries = confirmed ? projectCompactHostSecondaries(system,bodies,scale,card.title) : null;
  return Object.freeze({
    universeSeed:source.universeSeed, generatorVersionCode:source.generatorVersionCode,
    address:Object.freeze({galaxyIndex:source.galaxyIndex.toString(),sectorKey:source.sectorKey.toString(),galacticObjectIndex:source.galacticObjectIndex.toString()}),
    proceduralIdentity:source.proceduralIdentity, title:card.title, discoveryStateCode:state.code,
    discoveryStateLabel:source.discoveryStateLabel, knowledgeLevel:card.knowledgeLevel,
    multiplicityName:'SINGLE',componentCount:1,
    accessibleLabel:`Anfitrión compacto ${kind}. ${confirmed ? planets.length+' planetas modelados en órbitas Keplerianas.' : 'Planetas ocultos hasta Confirmado.'} Sin fotosfera convencional ni zona habitable inferida. La imagen del agujero negro usa el laboratorio canónico como ilustración, no como evidencia de acreción. La iluminación planetaria es una referencia visual: ${presentationFlux > 0 ? 'escenario condicionado de emisión' : blackHole ? 'luz de inspección del disco ilustrativo, sin luminosidad de acreción acreditada' : 'solo luz de relleno de presentación, sin fuente compacta acreditada'}.`,
    stars, planets:Object.freeze(bodies), moons:secondaries?.moons??Object.freeze([]),
    minorBodies:secondaries?.minorBodies??Object.freeze([]),
    asteroidBelts:secondaries?.belts??Object.freeze([]), habitableZone:null, orbitalRiskTargets:Object.freeze([]),
    layers:Object.freeze({moonCount:secondaries?.moons.length??0,
      minorBodyCount:secondaries?.minorBodies.length??0,habitableZoneAvailable:false,
      orbitalRiskTargetCount:0,orbitalCrossingTargetCount:0,orbitalApproachTargetCount:0,
      orbitalCollisionGeometryTargetCount:0}),
    orbits:Object.freeze([...orbits,...(secondaries?.orbits??[])]),
    motions:Object.freeze([...motions,...(secondaries?.motions??[])]),
    scientificMoonBindings:secondaries?.moonBindings??Object.freeze([]),
    scientificPlanetBindings:Object.freeze(planets.map(p=>Object.freeze({sceneBodyId:`planet-${p.ordinal}`,bodyIndex:(p.ordinal-1).toString()}))),
    simulation:Object.freeze({epochSimulationDay:0,playbackDaysPerRealSecond:1}), scale,
  });
}
