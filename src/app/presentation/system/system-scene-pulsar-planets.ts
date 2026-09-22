import { type PulsarSecondGenerationPopulation } from '../../domain/planetary/pulsar-second-generation-planet';
import { v2PlanetTimeScale } from './system-scene-v2-planet-cadence';
import {
  type SystemSceneBodySnapshot, type SystemSceneOrbitSnapshot,
  type SystemSceneOrbitalMotionSnapshot, type SystemSceneSnapshot,
} from './system-scene-snapshot';
import { systemSceneProjectedRadiusAu } from './system-scene-scale-projection';

/**
 * Isolated render-only projection. Unlike phase-18 planet identifiers, these
 * are separate second-generation bodies with NO legacy planet fiche route.
 * Geometry is not an astrophysical calculation and never writes back to domain.
 */
export function projectPulsarSecondGenerationPlanets(
  population: PulsarSecondGenerationPopulation,
  snapshot: SystemSceneSnapshot,
): Readonly<{
  planets: readonly SystemSceneBodySnapshot[];
  orbits: readonly SystemSceneOrbitSnapshot[];
  motions: readonly SystemSceneOrbitalMotionSnapshot[];
}> {
  if (snapshot.generatorVersionCode !== 2 || snapshot.multiplicityName !== 'SINGLE' ||
      snapshot.knowledgeLevel !== 'CATALOGUED' && snapshot.knowledgeLevel !== 'CONFIRMED' ||
      !snapshot.stars.length) {
    throw new RangeError('Second-generation planets require a catalogued V2 SINGLE source.');
  }
  const bodies: SystemSceneBodySnapshot[] = [];
  const orbits: SystemSceneOrbitSnapshot[] = [];
  const motions: SystemSceneOrbitalMotionSnapshot[] = [];
  for (const planet of population.planets) {
    const id = `pulsar-sg-${planet.identityHex}`;
    const orbitId = `orbit-${id}`;
    const motionId = `motion-${id}`;
    const radiusScene = systemSceneProjectedRadiusAu(planet.semiMajorAxisAu, snapshot.scale);
    const presentationTimeScale = v2PlanetTimeScale(
      planet.orbitalPeriodDays, snapshot.simulation.playbackDaysPerRealSecond,
      planet.semiMajorAxisAu, planet.ordinal, population.planets.length,
    );
    const contribution = Object.freeze({ motionId, scale: 1, presentationTimeScale });
    motions.push(Object.freeze({
      id: motionId, semiMajorAxisAu: planet.semiMajorAxisAu,
      eccentricity: planet.eccentricity, periodDays: planet.orbitalPeriodDays,
      rotationDegrees: 0, inclinationDegrees: 0, epochMeanAnomalyDegrees: 0,
    }));
    orbits.push(Object.freeze({
      id: orbitId, kind: 'planetary', label: `Órbita postcolapso ${planet.ordinal}`,
      colorHex: '#8fb2ce', opacity: 0.39,
      semiMajorScene: radiusScene,
      semiMinorScene: radiusScene * Math.sqrt(1 - planet.eccentricity ** 2),
      focusOffsetScene: radiusScene * planet.eccentricity,
      rotationDegrees: 0, inclinationDegrees: 0, motionId, motionScale: 1,
      anchorMotionContributions: Object.freeze([]),
    }));
    bodies.push(Object.freeze({
      id, kind: 'planet', label: `PSG-${planet.ordinal}`,
      title: `Planeta postcolapso ${planet.ordinal} · hipótesis de formación`,
      colorHex: '#a99b8d', radiusScene: Math.max(0.043, Math.min(0.11, 0.052 * planet.radiusEarth)),
      position: Object.freeze({ x: radiusScene, y: 0, z: 0 }), orbitId,
      motionContributions: Object.freeze([contribution]),
      surfaceStyle: 'rocky', lightIntensity: 0.04, sourceLuminositySolar: null,
      spin: Object.freeze({ source: 'UNAVAILABLE', rotationPeriodHours: null,
        axialTiltDegrees: null, isRetrograde: null, isSynchronized: false,
        epochPhaseDegrees: 0 }),
      surfaceEnvironment: null, giantAtmosphere: null, specialPresentation: null,
    }));
  }
  return Object.freeze({ planets: Object.freeze(bodies), orbits: Object.freeze(orbits),
    motions: Object.freeze(motions) });
}
