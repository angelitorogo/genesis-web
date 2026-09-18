import { PlanetType } from '../../../domain/planetary/planet-type';
import { adaptiveSystemPlanetRadiusScene, buildLinearFitSystemScale } from '../../system/system-scene-scale-projection';
import { projectSystemSceneMotionContributions } from '../../system/system-scene-motion-projection';
import { buildSystemScenePlanetSpecialPresentationV1 } from '../../system/system-scene-planet-special-presentation';
import type {
  SystemSceneBodySnapshot, SystemSceneHabitableZoneSnapshot,
  SystemSceneMotionContributionSnapshot, SystemSceneOrbitalMotionSnapshot,
  SystemSceneOrbitSnapshot, SystemSceneSnapshot,
} from '../../system/system-scene-snapshot';
import type { LaboratoryCircumbinaryPopulation } from './stellar-system-laboratory-circumbinary-generation';

/** Renderer-only time lapse: physical P periods remain unchanged in the domain. */
export const LAB_P_VISUAL_ORBIT_SECONDS = 600;

const COLORS: Readonly<Record<PlanetType, string>> = Object.freeze({
  [PlanetType.ROCKY]: '#9A8F86',
  [PlanetType.SUPER_EARTH]: '#8FA292',
  [PlanetType.DESERT]: '#C8A36A',
  [PlanetType.OCEAN]: '#4B7FCB',
  [PlanetType.ICE]: '#DCECF8',
  [PlanetType.VOLCANIC]: '#C76339',
  [PlanetType.MINI_NEPTUNE]: '#4FB0BE',
  [PlanetType.GAS_GIANT]: '#D1A16C',
  [PlanetType.ICE_GIANT]: '#7BC3DC',
});

/** Adds the independently GENERATED P population to its original A/B/C scene.
 * No physics or planet is synthesized here; scene coordinates alone are projected.
 * In TRIPLE the parent is the A-B barycentre, NOT either star or the A-B-C barycentre.
 */
export function appendLaboratoryCircumbinaryScene(
  base: SystemSceneSnapshot,
  population: LaboratoryCircumbinaryPopulation,
): SystemSceneSnapshot {
  if (base.multiplicityName !== 'BINARY' && base.multiplicityName !== 'TRIPLE') {
    throw new RangeError('P-type laboratory projection needs a BINARY or hierarchical TRIPLE.');
  }
  const inner = base.motions.find(motion => motion.id === 'lab-binary-relative');
  if (!inner) throw new Error('Inner A-B motion is missing.');
  const starAnchor = base.stars[0]?.motionContributions.find(part => part.motionId === inner.id);
  if (starAnchor?.linearScenePerAu === undefined) {
    throw new Error('Missing exact laboratory stellar AU projection scale.');
  }
  const scenePerAu = starAnchor.linearScenePerAu;
  const outerAnchor = base.multiplicityName === 'TRIPLE'
    ? base.stars[0]?.motionContributions.find(part => part.motionId === 'lab-triple-outer-relative')
    : undefined;
  if (base.multiplicityName === 'TRIPLE' && !outerAnchor) {
    throw new Error('Triple P planets need the A-B barycentre outer-motion anchor.');
  }
  const parent: readonly SystemSceneMotionContributionSnapshot[] = Object.freeze(
    outerAnchor ? [outerAnchor] : [],
  );
  const motions: SystemSceneOrbitalMotionSnapshot[] = [...base.motions];
  const orbits: SystemSceneOrbitSnapshot[] = [...base.orbits];
  const planets: SystemSceneBodySnapshot[] = [...base.planets];
  const orbitIds = new Set(orbits.map(orbit => orbit.id));
  const motionIds = new Set(motions.map(motion => motion.id));
  let outermostScene = base.scale.targetOuterRadiusScene;
  for (const planet of population.planets) {
    const ordinal = planet.planetOrdinal;
    const id = `lab-p-planet-${ordinal}`;
    const orbitId = `lab-p-orbit-${ordinal}`;
    const motionId = `lab-p-motion-${ordinal}`;
    if (orbitIds.has(orbitId) || motionIds.has(motionId) ||
        base.planets.some(body => body.id === id)) {
      throw new Error(`Repeated circumbinary presentation identity: ${id}`);
    }
    orbitIds.add(orbitId);
    motionIds.add(motionId);
    const { orbit, orbitalPeriod } = planet;
    const motion: SystemSceneOrbitalMotionSnapshot = Object.freeze({
      id: motionId,
      semiMajorAxisAu: orbit.semiMajorAxisAu,
      eccentricity: orbit.eccentricity,
      periodDays: orbitalPeriod.periodDays,
      rotationDegrees: orbit.argumentOfPeriapsisDegrees,
      inclinationDegrees: orbit.inclinationDegrees,
      longitudeAscendingNodeDegrees: orbit.longitudeOfAscendingNodeDegrees,
      argumentOfPeriapsisDegrees: orbit.argumentOfPeriapsisDegrees,
      epochMeanAnomalyDegrees: (ordinal * 67) % 360,
    });
    motions.push(motion);
    const semiMajorScene = orbit.semiMajorAxisAu * scenePerAu;
    const guide: SystemSceneOrbitSnapshot = Object.freeze({
      id: orbitId,
      kind: 'planetary',
      label: `P${ordinal} · circumbinaria A–B`,
      colorHex: '#69BDDD',
      opacity: 0.58,
      semiMajorScene,
      semiMinorScene: semiMajorScene * Math.sqrt(1 - orbit.eccentricity ** 2),
      focusOffsetScene: semiMajorScene * orbit.eccentricity,
      rotationDegrees: motion.rotationDegrees,
      inclinationDegrees: motion.inclinationDegrees,
      motionId,
      motionScale: 1,
      anchorMotionContributions: parent,
      linearScenePerAu: scenePerAu,
    });
    orbits.push(guide);
    const timeScale = orbitalPeriod.periodDays /
      (base.simulation.playbackDaysPerRealSecond * LAB_P_VISUAL_ORBIT_SECONDS);
    const ownMotion: SystemSceneMotionContributionSnapshot = Object.freeze({
      motionId, scale: 1, linearScenePerAu: scenePerAu,
      presentationTimeScale: timeScale,
    });
    const contributions = Object.freeze([...parent, ownMotion]);
    const position = Object.freeze(projectSystemSceneMotionContributions(
      contributions, candidate => motions.find(item => item.id === candidate),
      base.simulation.epochSimulationDay, base.scale,
    ));
    const type = planet.planetType;
    const specialPresentation = buildSystemScenePlanetSpecialPresentationV1({
      planetId: id,
      planetType: type,
      radiusEarth: planet.radiusEarth,
      densityGramsPerCubicCentimeter: planet.densityGramsPerCubicCentimeter,
      envelopeMassFraction01: planet.internalComposition.gaseousEnvelopeMassFraction01,
      iceBearingFractionOfSolids01: planet.internalComposition.iceBearingFractionOfSolids01,
      rotationPeriodHours: planet.rotationPeriodHours,
      axialTiltDegrees: planet.axialTiltDegrees,
      referenceBondAlbedo01: planet.referenceBondAlbedo01,
      rarityTraits: planet.rarityAssessment.traits,
      giantMoonProfile: null,
    });
    const surfaceStyle: SystemSceneBodySnapshot['surfaceStyle'] =
      [PlanetType.GAS_GIANT, PlanetType.ICE_GIANT, PlanetType.MINI_NEPTUNE].includes(type)
        ? 'gaseous' : type === PlanetType.OCEAN ? 'oceanic'
          : type === PlanetType.ICE ? 'icy' : type === PlanetType.VOLCANIC ? 'volcanic' : 'rocky';
    planets.push(Object.freeze({
      id, kind: 'planet', label: `P${ordinal}`,
      title: `P${ordinal} · ${planet.designation.name} · planeta circumbinario A–B (${type})`,
      colorHex: COLORS[type], radiusScene: adaptiveSystemPlanetRadiusScene(planet.radiusEarth),
      position, orbitId, motionContributions: contributions,
      surfaceStyle, lightIntensity: 0, sourceLuminositySolar: null,
      spin: Object.freeze({
        source: 'PLANET_19_3' as const,
        rotationPeriodHours: planet.rotationPeriodHours,
        axialTiltDegrees: planet.axialTiltDegrees,
        isRetrograde: planet.isRetrogradeRotation,
        isSynchronized: planet.isTidallySynchronized,
        epochPhaseDegrees: (ordinal * 49) % 360,
      }),
      surfaceEnvironment: null, giantAtmosphere: null, specialPresentation,
    }));
    outermostScene = Math.max(outermostScene,
      semiMajorScene * (1 + orbit.eccentricity) + 0.5);
  }
  const zones: SystemSceneHabitableZoneSnapshot[] = [
    ...(base.habitableZones ?? (base.habitableZone ? [base.habitableZone] : [])),
  ];
  const assessment = population.habitability;
  const compatibility = population.compatibility;
  // Only a physically applicable radiative reference may become a coloured HZ.
  if (assessment?.isRadiativeReferenceApplicable && assessment.hasStableHabitableZone &&
      compatibility !== null && compatibility !== undefined) {
    const innerStable = assessment.stableHabitableInnerEdgeAu;
    const outerStable = assessment.stableHabitableOuterEdgeAu;
    const zone: SystemSceneHabitableZoneSnapshot = Object.freeze({
      topology: 'CIRCUMBINARY',
      radiativeReferenceApplicable: true,
      radiativeReferenceRegime: assessment.radiativeReferenceRegime,
      radiativeInnerEdgeAu: assessment.radiativeHabitableInnerEdgeAu,
      radiativeOuterEdgeAu: assessment.radiativeHabitableOuterEdgeAu,
      dynamicallyHabitableInnerEdgeAu: innerStable,
      dynamicallyHabitableOuterEdgeAu: outerStable,
      radiativeInnerRadiusScene: assessment.radiativeHabitableInnerEdgeAu * scenePerAu,
      radiativeOuterRadiusScene: assessment.radiativeHabitableOuterEdgeAu * scenePerAu,
      dynamicallyHabitableInnerRadiusScene: innerStable === null ? null : innerStable * scenePerAu,
      dynamicallyHabitableOuterRadiusScene: outerStable === null ? null : outerStable * scenePerAu,
      presentationAdjusted: false,
      dynamicalOverlapFraction01: assessment.stableHabitableZoneFraction,
      circumbinaryStabilityInnerEdgeAu: compatibility.minimumStableSemiMajorAxisAu,
      circumbinaryStabilityOuterEdgeAu: compatibility.maximumStableSemiMajorAxisAu,
      circumbinaryStabilityInnerRadiusScene: compatibility.minimumStableSemiMajorAxisAu * scenePerAu,
      circumbinaryStabilityOuterRadiusScene: compatibility.maximumStableSemiMajorAxisAu === null
        ? null : compatibility.maximumStableSemiMajorAxisAu * scenePerAu,
      anchorMotionContributions: parent,
    });
    zones.push(zone);
    outermostScene = Math.max(outermostScene, zone.radiativeOuterRadiusScene + 0.5);
  }
  // Star/planet angular coordinates remain intact; expand only the camera fit
  // if the true P orbit extends beyond the old binary/triple field of view.
  const scale = outermostScene > base.scale.targetOuterRadiusScene
    ? buildLinearFitSystemScale(
      Math.max(base.scale.outerRadiusAu, outermostScene / scenePerAu),
      outermostScene * 1.1,
    )
    : base.scale;
  return Object.freeze({
    ...base,
    planets: Object.freeze(planets), orbits: Object.freeze(orbits),
    motions: Object.freeze(motions),
    habitableZone: zones[0] ?? null,
    habitableZones: Object.freeze(zones),
    layers: Object.freeze({ ...base.layers, habitableZoneAvailable: zones.length > 0 }),
    scale,
    accessibleLabel: `${base.accessibleLabel} ${population.status} Población P independiente alrededor de A–B.`,
  });
}
