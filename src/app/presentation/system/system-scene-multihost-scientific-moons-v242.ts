import { type MultihostScientificMoonV242 } from '../../domain/planetary/multihost-scientific-moon-v242';
import { type MultihostScientificPlanetV241 } from '../../domain/planetary/multihost-scientific-planet-v241';
import { buildSystemSceneMoonPresentationV1 } from './system-scene-moon-presentation';
import { limitSystemSceneMoonPresentationToHostV1 } from './system-scene-moon-host-size-limit';
import { projectSystemSceneMotionContributions } from './system-scene-motion-projection';
import { MULTIHOST_V221_SECONDS_PER_ORBIT, multihostPresentationTimeScaleV221 } from './system-scene-multihost-laboratory-cadence';
import {
  type SystemSceneBodySnapshot, type SystemSceneMoonSnapshot,
  type SystemSceneOrbitSnapshot, type SystemSceneOrbitalMotionSnapshot,
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

/** Materializes already-generated V2.4.2 moons. Visual compression never changes
 * scientific periods, Roche/Hill limits, mass or planetocentric orbital axis. */
export function projectMultihostScientificMoonV242(
  moon: MultihostScientificMoonV242,
  parent: SystemSceneBodySnapshot,
  parentScience: MultihostScientificPlanetV241,
  snapshot: SystemSceneSnapshot,
  existingMotions: readonly SystemSceneOrbitalMotionSnapshot[],
): Readonly<{
  body: SystemSceneMoonSnapshot;
  orbit: SystemSceneOrbitSnapshot;
  motion: SystemSceneOrbitalMotionSnapshot;
}> {
  if (parent.id !== moon.hostPlanetId || parentScience.id !== parent.id ||
      parent.multihostOrbitV221?.hostId !== moon.hostId ||
      !(moon.massEarth > 0 && moon.periodDays > 0 && moon.semiMajorAxisAu > 0) ||
      !(moon.semiMajorAxisPlanetRadii * (1 - moon.eccentricity) > moon.rocheLimitPlanetRadii) ||
      !(moon.semiMajorAxisPlanetRadii * (1 + moon.eccentricity) < moon.progradeOuterLimitPlanetRadii)) {
    throw new RangeError(`V2.4.2 refuses a moon without the exact planet and a valid Roche/Hill orbit: ${moon.id}.`);
  }
  const environment = moon.environment;
  const isGiant = ['GAS_GIANT', 'ICE_GIANT', 'MINI_NEPTUNE'].includes(parentScience.type);
  const display = buildSystemSceneMoonPresentationV1({
    moonIdentity: moon.formationSeedHex,
    hostPlanetType: parentScience.type,
    radiusEarth: moon.radiusEarth,
    massEarth: moon.massEarth,
    meanDensityGramsPerCubicCentimeter: moon.densityGramsPerCubicCentimeter,
    surfaceGravityEarth: moon.surfaceGravityEarth,
    atmosphereRetentionIndex01: environment.atmosphereRetentionIndex01,
    atmosphereRegime: environment.atmosphereRegime,
    waterInventoryIndex01: environment.waterInventoryPotentialIndex01,
    inferredIceRichnessIndex01: environment.inferredIceRichnessIndex01,
    subsurfaceOceanPotentialIndex01: environment.subsurfaceOceanPotentialIndex01,
    surfaceLiquidWaterPotentialIndex01: environment.surfaceLiquidWaterPotentialIndex01,
    waterRegime: environment.waterRegime,
    estimatedSurfaceTemperatureKelvin: environment.estimatedSurfaceTemperatureKelvin ?? 200,
    geologicalActivityIndex01: moon.tidalHeatingIndex01,
    tidalHeatingIndex01: moon.tidalHeatingIndex01,
    geologyRegime: environment.geologyRegime,
    overallHabitabilityIndex01: 0,
    isPotentiallyHabitable: false,
    giantHostSpecialization: isGiant,
    giantCompositionRegime: isGiant ? (environment.inferredIceRichnessIndex01 >= 0.55 ? 'ICE_RICH' : 'ROCKY') : 'NONE',
    isLargeGiantMoon: isGiant && moon.radiusEarth >= 0.2,
    isTidallyActiveGiantMoon: isGiant && moon.tidalHeatingIndex01 >= 0.45,
    isOceanBearingGiantMoonCandidate: isGiant && environment.subsurfaceOceanPotentialIndex01 >= 0.35,
  });
  const visual = limitSystemSceneMoonPresentationToHostV1(display, parent.radiusScene);
  const orbitRadiusScene = parent.radiusScene + visual.presentationRadiusScene +
    0.065 + 0.042 * (moon.ordinal - 1);
  const linearScenePerAu = orbitRadiusScene / moon.semiMajorAxisAu;
  const motionId = `${moon.id}-motion`;
  const orbitId = `${moon.id}-orbit`;
  const motion: SystemSceneOrbitalMotionSnapshot = Object.freeze({
    id: motionId, semiMajorAxisAu: moon.semiMajorAxisAu,
    eccentricity: moon.eccentricity, periodDays: moon.periodDays,
    inclinationDegrees: moon.inclinationDegrees,
    rotationDegrees: moon.rotationDegrees,
    epochMeanAnomalyDegrees: moon.epochMeanAnomalyDegrees,
  });
  const local = Object.freeze({
    motionId, scale: 1, linearScenePerAu,
    presentationTimeScale: multihostPresentationTimeScaleV221(
      moon.periodDays, snapshot.simulation.playbackDaysPerRealSecond,
      MULTIHOST_V221_SECONDS_PER_ORBIT.QA_MOON,
    ),
  });
  const contributions = Object.freeze([...parent.motionContributions, local]);
  const position = projectSystemSceneMotionContributions(
    contributions,
    id => id === motionId ? motion : existingMotions.find(item => item.id === id),
    snapshot.simulation.epochSimulationDay,
    snapshot.scale,
  );
  const body: SystemSceneMoonSnapshot = Object.freeze({
    id: moon.id, kind: 'moon' as const, scientificV242: true as const,
    label: moon.designation,
    title: `${moon.designation} · V2.4.2 luna modelada en órbita de ${parentScience.designation} (${moon.hostId}); ` +
      `${moon.massEarth.toPrecision(3)} M⊕; ${moon.radiusEarth.toPrecision(3)} R⊕; ` +
      `${moon.semiMajorAxisPlanetRadii.toPrecision(4)} radios planetarios; periodo ${moon.periodDays.toPrecision(4)} días. ` +
      `Roche/Hill físicos verificados. Clima/agua/mareas estimados, no confirmados; no persistida.`,
    hostPlanetId: parent.id, hostPlanetOrdinal: moon.hostPlanetOrdinal,
    colorHex: visual.presentationBaseColorHex,
    radiusScene: visual.presentationRadiusScene,
    position, orbitId, motionContributions: contributions,
    spin: Object.freeze({
      source: 'V2_4_2_SCIENTIFIC_MOON' as const,
      rotationPeriodHours: moon.locking === 'LIKELY_SYNCHRONOUS' ? moon.periodDays * 24 : null,
      axialTiltDegrees: null, isRetrograde: null,
      isSynchronized: moon.locking === 'LIKELY_SYNCHRONOUS',
      epochPhaseDegrees: moon.epochMeanAnomalyDegrees,
    }),
    visualPresentation: visual,
  });
  const orbit: SystemSceneOrbitSnapshot = Object.freeze({
    id: orbitId, kind: 'moon' as const, label: `${moon.designation} · órbita planetocéntrica V2.4.2`,
    colorHex: '#82A5C2', opacity: 0.45,
    semiMajorScene: orbitRadiusScene,
    semiMinorScene: orbitRadiusScene * Math.sqrt(1 - moon.eccentricity ** 2),
    focusOffsetScene: orbitRadiusScene * moon.eccentricity,
    rotationDegrees: moon.rotationDegrees, inclinationDegrees: moon.inclinationDegrees,
    motionId, motionScale: 1,
    anchorMotionContributions: parent.motionContributions,
    linearScenePerAu,
  });
  return Object.freeze({body, orbit, motion});
}
