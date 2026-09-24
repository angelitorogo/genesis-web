import { PlanetType } from '../../domain/planetary/planet-type';
import { v2PlanetTimeScale } from './system-scene-v2-planet-cadence';
import { type GeneratedMultipleHost } from '../../simulation/stellar/stellar-multihost-formation';
import {
  stellarMultihostPublicMoonDesignation,
  stellarMultihostPublicPlanetDesignation,
} from '../../simulation/stellar/stellar-multihost-public-designation';
import { projectSystemSceneMotionContributions } from './system-scene-motion-projection';
import { adaptiveSystemPlanetRadiusScene, buildLinearFitSystemScale } from './system-scene-scale-projection';
import { buildSystemScenePlanetSpecialPresentationV1 } from './system-scene-planet-special-presentation';
import { buildSystemSceneMoonPresentationV1 } from './system-scene-moon-presentation';
import { limitSystemSceneMoonPresentationToHostV1 } from './system-scene-moon-host-size-limit';
import { type SystemSceneSnapshot, type SystemSceneOrbitalMotionSnapshot,
  type SystemSceneMotionContributionSnapshot, type SystemSceneBodySnapshot,
  type SystemSceneHabitableZoneSnapshot } from './system-scene-snapshot';

const AU_KILOMETERS = 149_597_870.7;
const MOON_ORBIT_SECONDS = 42;
const COLORS: Readonly<Record<PlanetType, string>> = Object.freeze({
  [PlanetType.ROCKY]: '#9A8F86', [PlanetType.SUPER_EARTH]: '#8FA292',
  [PlanetType.DESERT]: '#C8A36A', [PlanetType.OCEAN]: '#4B7FCB',
  [PlanetType.ICE]: '#DCECF8', [PlanetType.VOLCANIC]: '#C76339',
  [PlanetType.MINI_NEPTUNE]: '#4FB0BE', [PlanetType.GAS_GIANT]: '#D1A16C',
  [PlanetType.ICE_GIANT]: '#7BC3DC',
});

/** Stage 7: project real P planets AND their relevant moons around the A-B
 * barycentre. This is presentation only and does not generate any bodies. */
export function appendSystemSceneMultihostCircumbinary(
  base: SystemSceneSnapshot,
  formation: GeneratedMultipleHost,
  scenePerAu: number,
  abParent: readonly SystemSceneMotionContributionSnapshot[],
  publicSystemDesignation: string,
): SystemSceneSnapshot {
  const source = formation.circumbinary;
  if (!source.planets.length && source.habitability === null) return base;
  const motions: SystemSceneOrbitalMotionSnapshot[] = [...base.motions];
  const orbits: SystemSceneSnapshot['orbits'][number][] = [...base.orbits];
  const planets: SystemSceneBodySnapshot[] = [...base.planets];
  const moons: SystemSceneSnapshot['moons'][number][] = [...base.moons];
  let visualOuterRadius = base.scale.targetOuterRadiusScene;
  const playback = base.simulation.playbackDaysPerRealSecond;
  const position = (parts: readonly SystemSceneMotionContributionSnapshot[]) =>
    Object.freeze(projectSystemSceneMotionContributions(parts,
      motionId => motions.find(m => m.id === motionId), 0, base.scale));
  const circumbinaryPlanets = formation.publicPlanets.filter(entry => entry.host === 'AB');
  const radialRanks = new Map([...circumbinaryPlanets]
    .sort((a, b) => a.planet.orbit.semiMajorAxisAu - b.planet.orbit.semiMajorAxisAu)
    .map((entry, index) => [entry.sourcePlanetOrdinal, index + 1]));
  for (const entry of circumbinaryPlanets) {
    const { planet, moonSystem } = entry;
    if (!source.planets.includes(planet) || moonSystem.hostPlanet !== planet) {
      throw new Error('Circumbinary scene planet does not match the generated scientific identity.');
    }
    const ordinal = entry.sourcePlanetOrdinal;
    const id = `mh-p-planet-${ordinal}`;
    const motionId = `mh-p-motion-${ordinal}`;
    const orbitId = `mh-p-orbit-${ordinal}`;
    const motion: SystemSceneOrbitalMotionSnapshot = Object.freeze({
      id: motionId, semiMajorAxisAu: planet.orbit.semiMajorAxisAu,
      eccentricity: planet.orbit.eccentricity, periodDays: planet.orbitalPeriod.periodDays,
      rotationDegrees: planet.orbit.argumentOfPeriapsisDegrees,
      inclinationDegrees: planet.orbit.inclinationDegrees,
      longitudeAscendingNodeDegrees: planet.orbit.longitudeOfAscendingNodeDegrees,
      argumentOfPeriapsisDegrees: planet.orbit.argumentOfPeriapsisDegrees,
      epochMeanAnomalyDegrees: (ordinal * 67) % 360,
    });
    motions.push(motion);
    const axis = planet.orbit.semiMajorAxisAu * scenePerAu;
    orbits.push(Object.freeze({
      id: orbitId, kind: 'planetary',
      label: stellarMultihostPublicPlanetDesignation(publicSystemDesignation, 'AB', ordinal),
      colorHex: '#69BDDD', opacity: 0.58, semiMajorScene: axis,
      semiMinorScene: axis * Math.sqrt(1 - motion.eccentricity ** 2),
      focusOffsetScene: axis * motion.eccentricity,
      rotationDegrees: motion.rotationDegrees, inclinationDegrees: motion.inclinationDegrees,
      motionId, motionScale: 1, anchorMotionContributions: abParent,
      linearScenePerAu: scenePerAu,
    }));
    const own: SystemSceneMotionContributionSnapshot = Object.freeze({
      motionId, scale: 1, linearScenePerAu: scenePerAu,
      presentationTimeScale: base.generatorVersionCode === 2
        ? v2PlanetTimeScale(motion.periodDays, playback, motion.semiMajorAxisAu,
            radialRanks.get(ordinal)!, circumbinaryPlanets.length)
        : motion.periodDays / (playback * 600),
    });
    const parts = Object.freeze([...abParent, own]);
    const type = planet.planetType;
    const special = buildSystemScenePlanetSpecialPresentationV1({
      planetId: id, planetType: type, radiusEarth: planet.radiusEarth,
      densityGramsPerCubicCentimeter: planet.densityGramsPerCubicCentimeter,
      envelopeMassFraction01: planet.internalComposition.gaseousEnvelopeMassFraction01,
      iceBearingFractionOfSolids01: planet.internalComposition.iceBearingFractionOfSolids01,
      rotationPeriodHours: planet.rotationPeriodHours, axialTiltDegrees: planet.axialTiltDegrees,
      referenceBondAlbedo01: planet.referenceBondAlbedo01,
      rarityTraits: planet.rarityAssessment.traits, giantMoonProfile: null,
    });
    const surface: SystemSceneBodySnapshot['surfaceStyle'] =
      [PlanetType.GAS_GIANT, PlanetType.ICE_GIANT, PlanetType.MINI_NEPTUNE].includes(type)
        ? 'gaseous' : type === PlanetType.OCEAN ? 'oceanic' :
          type === PlanetType.ICE ? 'icy' : type === PlanetType.VOLCANIC ? 'volcanic' : 'rocky';
    const publicPlanetDesignation = stellarMultihostPublicPlanetDesignation(
      publicSystemDesignation, 'AB', ordinal,
    );
    const planetBody: SystemSceneBodySnapshot = Object.freeze({
      id, kind: 'planet', label: publicPlanetDesignation, title: publicPlanetDesignation,
      colorHex: COLORS[type], radiusScene: adaptiveSystemPlanetRadiusScene(planet.radiusEarth),
      position: position(parts), orbitId, motionContributions: parts,
      surfaceStyle: surface, lightIntensity: 0, sourceLuminositySolar: null,
      spin: Object.freeze({ source: 'PLANET_19_3' as const,
        rotationPeriodHours: planet.rotationPeriodHours, axialTiltDegrees: planet.axialTiltDegrees,
        isRetrograde: planet.isRetrogradeRotation, isSynchronized: planet.isTidallySynchronized,
        epochPhaseDegrees: (ordinal * 49) % 360 }),
      surfaceEnvironment: null, giantAtmosphere: null, specialPresentation: special,
    });
    planets.push(planetBody);
    visualOuterRadius = Math.max(visualOuterRadius, axis * (1 + motion.eccentricity) + 0.5);

    for (const [moonIndex, moon] of [...moonSystem.relevantMoons]
      .sort((left, right) => left.orbit.semiMajorAxisKilometers - right.orbit.semiMajorAxisKilometers)
      .entries()) {
      const visual = limitSystemSceneMoonPresentationToHostV1(buildSystemSceneMoonPresentationV1({
        moonIdentity: moon.identity.seed.normalizedValue,
        hostPlanetType: String(type), radiusEarth: moon.physicalProperties.radiusEarth,
        massEarth: moon.physicalProperties.massEarth,
        meanDensityGramsPerCubicCentimeter: moon.physicalProperties.meanDensityGramsPerCubicCentimeter,
        surfaceGravityEarth: moon.physicalProperties.surfaceGravityEarth,
        atmosphereRetentionIndex01: moon.environmentState.atmosphereRetentionIndex01,
        atmosphereRegime: String(moon.environmentState.atmosphereRegime),
        waterInventoryIndex01: moon.environmentState.waterInventoryIndex01,
        inferredIceRichnessIndex01: moon.environmentState.inferredIceRichnessIndex01,
        subsurfaceOceanPotentialIndex01: moon.environmentState.subsurfaceOceanPotentialIndex01,
        surfaceLiquidWaterPotentialIndex01: moon.environmentState.surfaceLiquidWaterPotentialIndex01,
        waterRegime: String(moon.environmentState.waterRegime),
        estimatedSurfaceTemperatureKelvin: moon.environmentState.estimatedSurfaceTemperatureKelvin,
        geologicalActivityIndex01: moon.environmentState.geologicalActivityIndex01,
        tidalHeatingIndex01: moon.tidalState.tidalHeatingIndex01,
        geologyRegime: String(moon.environmentState.geologyRegime),
        overallHabitabilityIndex01: moon.habitabilityState.overallHabitabilityIndex01,
        isPotentiallyHabitable: moon.habitabilityState.isPotentiallyHabitable,
        giantHostSpecialization: moon.giantMoonState.isApplicable,
        giantCompositionRegime: String(moon.giantMoonState.compositionRegime),
        isLargeGiantMoon: moon.giantMoonState.isLargeMoon,
        isTidallyActiveGiantMoon: moon.giantMoonState.isTidallyActive,
        isOceanBearingGiantMoonCandidate: moon.giantMoonState.isOceanBearingCandidate,
      }), planetBody.radiusScene);
      const moonId = `mh-p-moon-${ordinal}-${moon.moonOrdinal}`;
      const moonMotionId = `${moonId}-motion`;
      const moonOrbitId = `mh-p-orbit-moon-${ordinal}-${moon.moonOrdinal}`;
      const semiMajorAxisAu = moon.orbit.semiMajorAxisKilometers / AU_KILOMETERS;
      const targetScene = planetBody.radiusScene + 0.070 + visual.presentationRadiusScene + moonIndex * 0.075;
      const moonScenePerAu = targetScene / semiMajorAxisAu;
      const moonMotion: SystemSceneOrbitalMotionSnapshot = Object.freeze({
        id: moonMotionId, semiMajorAxisAu, eccentricity: moon.orbit.eccentricity,
        periodDays: moon.orbit.orbitalPeriodDays, rotationDegrees: (moon.moonOrdinal * 29) % 360,
        inclinationDegrees: moon.orbit.inclinationDegrees, epochMeanAnomalyDegrees: (moon.moonOrdinal * 61) % 360,
      });
      motions.push(moonMotion);
      const localMoon: SystemSceneMotionContributionSnapshot = Object.freeze({
        motionId: moonMotionId, scale: 1, linearScenePerAu: moonScenePerAu,
        presentationTimeScale: Math.min(1, moonMotion.periodDays / (playback * MOON_ORBIT_SECONDS)),
      });
      const moonParts = Object.freeze([...parts, localMoon]);
      const publicMoonDesignation = stellarMultihostPublicMoonDesignation(
        publicSystemDesignation, 'AB', ordinal, moon.moonOrdinal,
      );
      orbits.push(Object.freeze({
        id: moonOrbitId, kind: 'moon', label: publicMoonDesignation,
        colorHex: '#7EAFC6', opacity: 0.32, semiMajorScene: targetScene,
        semiMinorScene: targetScene * Math.sqrt(1 - moonMotion.eccentricity ** 2),
        focusOffsetScene: targetScene * moonMotion.eccentricity,
        rotationDegrees: moonMotion.rotationDegrees, inclinationDegrees: moonMotion.inclinationDegrees,
        motionId: moonMotionId, motionScale: 1, anchorMotionContributions: parts,
        linearScenePerAu: moonScenePerAu,
      }));
      moons.push(Object.freeze({
        id: moonId, kind: 'moon', label: moon.identity.designation.romanNumeral,
        title: publicMoonDesignation, hostPlanetId: id,
        hostPlanetOrdinal: Number(entry.publicLocator.bodyIndex) + 1,
        colorHex: visual.presentationBaseColorHex, radiusScene: visual.presentationRadiusScene,
        position: position(moonParts), orbitId: moonOrbitId, motionContributions: moonParts,
        spin: Object.freeze({ source: 'MOON_21_4' as const,
          rotationPeriodHours: moon.rotationPeriodHours, axialTiltDegrees: null,
          isRetrograde: null, isSynchronized: moon.isTidallyLocked,
          epochPhaseDegrees: (moon.moonOrdinal * 43) % 360 }),
        visualPresentation: visual,
      }));
    }
  }
  // Reuse ONLY the already-computed stage-16 physical assessment. A triple
  // represented internally by BINARY compatibility has not screened C's
  // irradiation and cannot claim a validated P radiative reference here.
  const zones: SystemSceneHabitableZoneSnapshot[] = [
    ...(base.habitableZones ?? (base.habitableZone ? [base.habitableZone] : [])),
  ];
  const assessment = source.habitability;
  const compatibility = source.compatibility;
  if (assessment?.isRadiativeReferenceApplicable && assessment.hasStableHabitableZone &&
      compatibility !== null && compatibility.hostMultiplicity === formation.multiplicity) {
    const inner = assessment.stableHabitableInnerEdgeAu;
    const outer = assessment.stableHabitableOuterEdgeAu;
    zones.push(Object.freeze({
      topology: 'CIRCUMBINARY', radiativeReferenceApplicable: true,
      radiativeReferenceRegime: assessment.radiativeReferenceRegime,
      radiativeInnerEdgeAu: assessment.radiativeHabitableInnerEdgeAu,
      radiativeOuterEdgeAu: assessment.radiativeHabitableOuterEdgeAu,
      dynamicallyHabitableInnerEdgeAu: inner,
      dynamicallyHabitableOuterEdgeAu: outer,
      radiativeInnerRadiusScene: assessment.radiativeHabitableInnerEdgeAu * scenePerAu,
      radiativeOuterRadiusScene: assessment.radiativeHabitableOuterEdgeAu * scenePerAu,
      dynamicallyHabitableInnerRadiusScene: inner === null ? null : inner * scenePerAu,
      dynamicallyHabitableOuterRadiusScene: outer === null ? null : outer * scenePerAu,
      presentationAdjusted: false,
      dynamicalOverlapFraction01: assessment.stableHabitableZoneFraction,
      circumbinaryStabilityInnerEdgeAu: compatibility.minimumStableSemiMajorAxisAu,
      circumbinaryStabilityOuterEdgeAu: compatibility.maximumStableSemiMajorAxisAu,
      circumbinaryStabilityInnerRadiusScene: compatibility.minimumStableSemiMajorAxisAu * scenePerAu,
      circumbinaryStabilityOuterRadiusScene: compatibility.maximumStableSemiMajorAxisAu === null
        ? null : compatibility.maximumStableSemiMajorAxisAu * scenePerAu,
      anchorMotionContributions: abParent,
    }));
    visualOuterRadius = Math.max(visualOuterRadius,
      assessment.radiativeHabitableOuterEdgeAu * scenePerAu + 0.5);
  }
  const scale = visualOuterRadius > base.scale.targetOuterRadiusScene
    ? buildLinearFitSystemScale(Math.max(base.scale.outerRadiusAu, visualOuterRadius / scenePerAu),
      visualOuterRadius * 1.1) : base.scale;
  return Object.freeze({ ...base, planets: Object.freeze(planets), moons: Object.freeze(moons),
    motions: Object.freeze(motions), orbits: Object.freeze(orbits), scale,
    habitableZone: zones[0] ?? null, habitableZones: Object.freeze(zones),
    layers: Object.freeze({ ...base.layers, moonCount: moons.length,
      habitableZoneAvailable: zones.length > 0 }),
    accessibleLabel: `${base.accessibleLabel} ${source.planets.length} planetas circumbinarios generados alrededor de A–B.`,
  });
}
