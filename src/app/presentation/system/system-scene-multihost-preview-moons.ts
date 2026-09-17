import { type MultihostFormedPlanetV22 } from '../../domain/planetary/multihost-formed-planetary-system';
import {
  buildSystemSceneMoonPresentationV1,
} from './system-scene-moon-presentation';
import { limitSystemSceneMoonPresentationToHostV1 } from './system-scene-moon-host-size-limit';
import {
  type SystemSceneBodySnapshot,
  type SystemSceneMoonSnapshot,
  type SystemSceneOrbitSnapshot,
  type SystemSceneOrbitalMotionSnapshot,
  type SystemSceneSnapshot,
} from './system-scene-snapshot';
import { projectSystemSceneMotionContributions } from './system-scene-motion-projection';
import {
  MULTIHOST_V221_SECONDS_PER_ORBIT,
  multihostPresentationTimeScaleV221,
} from './system-scene-multihost-laboratory-cadence';

const EARTH_PER_SOLAR = 332_946.0487;
const EARTH_RADIUS_AU = 0.0000426341;

export interface MultihostPreviewMoonV221 {
  readonly body: SystemSceneMoonSnapshot;
  readonly orbit: SystemSceneOrbitSnapshot;
  readonly motion: SystemSceneOrbitalMotionSnapshot;
}

/**
 * This is a VISUAL moon proxy, NOT a generated phase-21 moon or a prediction
 * that this particular planet formed a satellite. It is isolated in QA only.
 * A basic Hill/Roche interval guard avoids blatantly impossible proxy orbits.
 */
export function createMultihostPreviewMoonV221(
  formed: MultihostFormedPlanetV22,
  host: SystemSceneBodySnapshot,
  snapshot: SystemSceneSnapshot,
  existingMotions: readonly SystemSceneOrbitalMotionSnapshot[],
  satelliteIndex = 0,
): MultihostPreviewMoonV221 | null {
  if (!(formed.massEarth > 0 && formed.radiusEarth > 0 &&
    formed.semiMajorAxisAu > 0 && formed.gravitatingMassSolar > 0)) return null;
  const hostOffset: Readonly<Record<string, number>> = Object.freeze({
    A: 0, B: 1, C: 2, AB: 3, ABC: 4,
  });
  const proxyEligible = formed.bulkType === 'GAS_ENVELOPE' ||
    (formed.massEarth >= 0.6 &&
      (formed.ordinal + (hostOffset[formed.hostId] ?? 0)) % 2 === 0);
  if (!proxyEligible) return null;
  const planetaryRadiusAu = formed.radiusEarth * EARTH_RADIUS_AU;
  const hillRadiusAu = formed.periapsisAu *
    Math.cbrt(formed.massEarth / (3 * formed.gravitatingMassSolar * EARTH_PER_SOLAR));
  const moonAxisAu = planetaryRadiusAu * (12 + satelliteIndex * 10);
  if (moonAxisAu >= 0.22 * hillRadiusAu ||
    moonAxisAu <= 4 * planetaryRadiusAu) return null;
  const id = `${formed.id}-moon-qa${satelliteIndex === 0 ? '' : '-' + satelliteIndex}`;
  const motionId = `${id}-motion`;
  const orbitId = `${id}-orbit`;
  const periodDays = 365.25 * Math.sqrt(moonAxisAu ** 3 /
    (formed.massEarth / EARTH_PER_SOLAR));
  if (!(Number.isFinite(periodDays) && periodDays > 0)) return null;
  const motion = Object.freeze({
    id: motionId, semiMajorAxisAu: moonAxisAu, eccentricity: 0.01,
    periodDays, rotationDegrees: (formed.ordinal * 31) % 360,
    inclinationDegrees: 3, epochMeanAnomalyDegrees: (formed.ordinal * 137) % 360,
  });
  const moonPreviewRadius = Math.min(0.024, Math.max(0.010, host.radiusScene * 0.24));
  const orbitRadiusScene = host.radiusScene + moonPreviewRadius + 0.072 + satelliteIndex * 0.045;
  const linearScenePerAu = orbitRadiusScene / moonAxisAu;
  const local = Object.freeze({
    motionId, scale: 1, linearScenePerAu,
    presentationTimeScale: multihostPresentationTimeScaleV221(
      periodDays, snapshot.simulation.playbackDaysPerRealSecond,
      MULTIHOST_V221_SECONDS_PER_ORBIT.QA_MOON),
  });
  const contributions = Object.freeze([...host.motionContributions, local]);
  const allMotions = [...existingMotions, motion];
  const position = projectSystemSceneMotionContributions(
    contributions, mid => allMotions.find(entry => entry.id === mid),
    snapshot.simulation.epochSimulationDay, snapshot.scale,
  );
  // The V1 texture engine needs an input profile. Derive an explicitly
  // hypothetical one from the unique V2 planet seed and satellite ordinal;
  // this is visual variety, NOT phase-21 lunar science or a water claim.
  const visualProfiles = ['ROCKY', 'ICY', 'VOLCANIC', 'MIXED', 'OCEANIC'] as const;
  const visualSeed = Number.parseInt(formed.formationSeedHex.slice(-6), 16);
  const visualKind = visualProfiles[(visualSeed + satelliteIndex) % visualProfiles.length]!;
  const icy = visualKind === 'ICY' || visualKind === 'MIXED';
  const oceanic = visualKind === 'OCEANIC';
  const volcanic = visualKind === 'VOLCANIC';
  const radiusEarth = 0.09 + (visualSeed % 11) * 0.014;
  const massEarth = 0.001 + (visualSeed % 9) * 0.001;
  // Required by the existing Three.js moon renderer. All scientific-looking
  // inputs here are explicit QA proxy defaults, NEVER lunar Ground Truth.
  const display = buildSystemSceneMoonPresentationV1({
    moonIdentity: `V2.2.1:VISUAL-ONLY:${id}`,
    hostPlanetType: `QA_MOON_PROXY_${visualKind}`,
    radiusEarth, massEarth,
    meanDensityGramsPerCubicCentimeter: icy ? 1.8 : 3.2,
    surfaceGravityEarth: massEarth / radiusEarth ** 2,
    atmosphereRetentionIndex01: oceanic ? 0.2 : 0,
    atmosphereRegime: 'NONE',
    waterInventoryIndex01: icy ? 0.65 : oceanic ? 0.75 : 0,
    inferredIceRichnessIndex01: icy ? 0.85 : 0,
    subsurfaceOceanPotentialIndex01: 0,
    surfaceLiquidWaterPotentialIndex01: oceanic ? 0.7 : 0,
    waterRegime: icy ? 'SURFACE_ICE' : oceanic ? 'SURFACE_LIQUID' : 'NONE',
    estimatedSurfaceTemperatureKelvin: icy ? 175 : volcanic ? 390 : oceanic ? 290 : 245,
    geologicalActivityIndex01: volcanic ? 0.9 : 0.06,
    tidalHeatingIndex01: volcanic ? 0.65 : 0,
    geologyRegime: volcanic ? 'EXTREME' : 'LOW_ACTIVITY',
    overallHabitabilityIndex01: 0,
    isPotentiallyHabitable: false,
    giantHostSpecialization: false,
    giantCompositionRegime: 'NONE',
    isLargeGiantMoon: false,
    isTidallyActiveGiantMoon: false,
    isOceanBearingGiantMoonCandidate: false,
  });
  const visualPresentation = limitSystemSceneMoonPresentationToHostV1(
    display, host.radiusScene);
  const body: SystemSceneMoonSnapshot = Object.freeze({
    id, kind: 'moon' as const, previewOnlyV221: true as const,
    label: `QA-${satelliteIndex + 1} · ${visualKind}`, title: `${formed.designation} · luna de aspecto ${visualKind} experimental V2.3; sin composición/agua confirmada y NO formada ni persistida`,
    hostPlanetId: host.id, hostPlanetOrdinal: formed.ordinal,
    colorHex: visualPresentation.presentationBaseColorHex,
    radiusScene: visualPresentation.presentationRadiusScene,
    position, orbitId, motionContributions: contributions,
    spin: Object.freeze({
      source: 'V2_2_1_LAB_MOON' as const,
      rotationPeriodHours: periodDays * 24,
      axialTiltDegrees: null, isRetrograde: null,
      isSynchronized: false, epochPhaseDegrees: 0,
    }),
    visualPresentation,
  });
  const orbit: SystemSceneOrbitSnapshot = Object.freeze({
    id: orbitId, kind: 'moon' as const,
    label: `${formed.designation} · satélite QA`, colorHex: '#82A5C2', opacity: 0.47,
    semiMajorScene: orbitRadiusScene,
    semiMinorScene: orbitRadiusScene * Math.sqrt(1 - motion.eccentricity ** 2),
    focusOffsetScene: orbitRadiusScene * motion.eccentricity,
    rotationDegrees: motion.rotationDegrees,
    inclinationDegrees: motion.inclinationDegrees,
    motionId, motionScale: 1,
    anchorMotionContributions: host.motionContributions,
    linearScenePerAu,
  });
  return Object.freeze({body, orbit, motion});
}
