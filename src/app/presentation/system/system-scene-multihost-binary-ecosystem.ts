import { buildSystemScenePlanetSurfacePresentationV1 } from './system-scene-planet-surface-presentation';
import { presentationPlanetRadiusFromPhysicsV1 } from './system-scene-planet-size-v1';
import { type MultihostScientificPlanetV241 } from '../../domain/planetary/multihost-scientific-planet-v241';
import { type MultihostMoonSystemV242 } from '../../domain/planetary/multihost-scientific-moon-v242';
import { buildSystemSceneGiantAtmospherePresentationV1 } from './system-scene-giant-atmosphere-presentation';
import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { type MultihostFormedPlanetV22 } from '../../domain/planetary/multihost-formed-planetary-system';
import {
  type BinaryEcosystemV23, type BinaryMinorBodyV23, type BinaryPlanetAppearanceV23,
} from '../../simulation/planetary/multihost-binary-ecosystem-generator';
import { buildSystemScenePlanetSpecialPresentationV1 } from './system-scene-planet-special-presentation';
import { buildSystemSceneAsteroidPresentationV1 } from './system-scene-asteroid-presentation';
import { buildSystemSceneCometPresentationV1 } from './system-scene-comet-presentation';
import { projectSystemSceneMotionContributions } from './system-scene-motion-projection';
import { MULTIHOST_V221_SECONDS_PER_ORBIT, multihostPresentationTimeScaleV221 } from './system-scene-multihost-laboratory-cadence';
import { systemSceneMultihostProjectedRadiusV22,
  type SystemSceneMultihostRadialProjectionV22 } from './system-scene-multihost-radial-projection';
import {
  type SystemSceneAsteroidBeltSnapshot, type SystemSceneBodySnapshot,
  type SystemSceneMinorBodySnapshot, type SystemSceneMotionContributionSnapshot,
  type SystemSceneOrbitSnapshot, type SystemSceneOrbitalMotionSnapshot,
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

/** Visual V1 algorithms applied to distinctly labelled V2.3 experimental INPUTS. */
export function binaryPlanetVisualV23(
  body: SystemSceneBodySnapshot,
  formed: MultihostFormedPlanetV22,
  appearance: BinaryPlanetAppearanceV23,
): SystemSceneBodySnapshot {
  const giant = appearance.visualKind === 'GAS_GIANT' || appearance.visualKind === 'ICE_GIANT';
  const ice = appearance.visualKind === 'ICE' || appearance.visualKind === 'ICE_GIANT';
  const planetType = appearance.visualKind;
  const density = Math.max(0.15, 5.51 * formed.massEarth / formed.radiusEarth ** 3);
  const special = buildSystemScenePlanetSpecialPresentationV1({
    planetId: body.id, planetType,
    radiusEarth: formed.radiusEarth, densityGramsPerCubicCentimeter: density,
    envelopeMassFraction01: formed.envelopeMassEarth / formed.massEarth,
    iceBearingFractionOfSolids01: ice ? 0.75 : 0.15,
    rotationPeriodHours: formed.rotationPeriodHours,
    axialTiltDegrees: 8 + formed.inclinationDegrees,
    referenceBondAlbedo01: ice ? 0.55 : giant ? 0.42 : 0.22,
    rarityTraits: Object.freeze([]),
    giantMoonProfile: giant ? Object.freeze({
      sourceMoonCount: appearance.tentativeMoonCount,
      sourceSatelliteCapacityIndex01: Math.min(1, formed.massEarth / 100),
      richnessIndex01: Math.min(1, appearance.tentativeMoonCount / 3),
      architectureRegime: 'V2_3_VISUAL_PROXY',
    }) : null,
  });
  const surfaceStyle = giant ? 'gaseous' : appearance.visualKind === 'OCEAN'
    ? 'oceanic' : ice ? 'icy' : appearance.visualKind === 'VOLCANIC'
      ? 'volcanic' : 'rocky';
  return Object.freeze({
    ...body,
    previewOnlyV23: true as const,
    title: `${body.title} · aspecto ${planetType} experimental V2.3 (no agua/atmósfera confirmada)`,
    surfaceStyle,
    colorHex: appearance.colorHex,
    specialPresentation: special,
  });
}

/** V2.4.1 planet handoff: V1 surface and ring/cloud render algorithms, using
 * native V2 physics and distinct V2 source metadata. No unmeasured ocean,
 * chemistry, or phase-20 Atmosphere is fabricated to populate the renderer. */
export function binaryPlanetScientificV241(
  body: SystemSceneBodySnapshot,
  scientific: MultihostScientificPlanetV241,
  appearance: BinaryPlanetAppearanceV23 | undefined,
  moonSystem?: MultihostMoonSystemV242,
): SystemSceneBodySnapshot {
  if (body.id !== scientific.id || body.multihostOrbitV221?.hostId !== scientific.hostId) {
    throw new RangeError('V2.4.1 planet science must match the rendered V2.2 ID and host.');
  }
  const type = scientific.type;
  const visualType = scientific.referenceAppearanceType;
  const isGiant = type === 'GAS_GIANT' || type === 'ICE_GIANT' || type === 'MINI_NEPTUNE';
  const ice = type === 'ICE' || type === 'ICE_GIANT';
  // V1 spectral-reference appearance does NOT imply a real ocean, greenhouse,
  // atmosphere, geological volcanism or companion-adjusted climate.
  const estimatedLiquid = scientific.environment.water.surfaceLiquidWaterCoverageFraction01;
  const estimatedIce = scientific.environment.water.surfaceIceCoverageFraction01;
  const surfaceStyle = isGiant ? 'gaseous' : estimatedLiquid !== null && estimatedLiquid >= 0.25
    ? 'oceanic' : (estimatedIce !== null && estimatedIce >= 0.25) || ice
      ? 'icy' : visualType === 'VOLCANIC' ? 'volcanic' : 'rocky';
  const colors: Readonly<Record<string, string>> = Object.freeze({
    ROCKY: '#958B7C', SUPER_EARTH: '#A49080', DESERT: '#CAA17A',
    OCEAN: '#528BB5', ICE: '#B1D8E9', VOLCANIC: '#AF5D39',
    MINI_NEPTUNE: '#97ACCA', GAS_GIANT: '#D9B48B', ICE_GIANT: '#7CA7C4',
  });
  // The V1 rings are explicitly a presentation proxy even for V1 giants.
  // V2.4.2 satellite counts come from the scientific host-local model.
  const moonCount = moonSystem?.modeledMoonCount ?? appearance?.tentativeMoonCount ?? 0;
  const special = buildSystemScenePlanetSpecialPresentationV1({
    planetId: scientific.formationSeedHex,
    planetType: type,
    radiusEarth: scientific.physics.radiusEarth,
    densityGramsPerCubicCentimeter: scientific.physics.densityGramsPerCubicCentimeter,
    envelopeMassFraction01: scientific.physics.envelopeMassEarth / scientific.physics.massEarth,
    iceBearingFractionOfSolids01: scientific.internalComposition.iceBearingFractionOfSolids01,
    rotationPeriodHours: scientific.physics.rotationPeriodHours,
    axialTiltDegrees: 0, // V2.2 did not produce axial tilt; visual placeholder only.
    referenceBondAlbedo01: scientific.surface.referenceBondAlbedo01,
    rarityTraits: Object.freeze([]),
    giantMoonProfile: isGiant ? Object.freeze({
      sourceMoonCount: moonCount,
      sourceSatelliteCapacityIndex01: moonSystem?.satelliteCapacityIndex01 ?? Math.min(1, scientific.physics.massEarth / 100),
      richnessIndex01: Math.min(1, moonCount / 3),
      architectureRegime: moonSystem === undefined ? 'V2_3_NON_AUTHORITATIVE_MOON_PROXY' :
        'V2_4_2_SATELLITE_MODEL',
    }) : null,
  });
  const environment = scientific.environment;
  const surfaceEnvironment = isGiant ? null : buildSystemScenePlanetSurfacePresentationV1({
    source: 'V2_4_1_HOST_ENVIRONMENT_ESTIMATE',
    waterInventoryIndex01: environment.water.inventoryIndex01,
    surfaceLiquidWaterCoverageFraction01: environment.water.surfaceLiquidWaterCoverageFraction01,
    surfaceIceCoverageFraction01: environment.water.surfaceIceCoverageFraction01,
    waterVaporFraction01: environment.water.vaporFraction01,
    retainedAtmosphericWaterVaporMoleFraction01: environment.atmosphere.vaporMoleFraction01 ?? 0,
    meanSurfaceTemperatureKelvin: environment.climate.meanSurfaceTemperatureKelvin,
    climateStabilityIndex01: environment.climate.stabilityIndex01,
    retainedSurfacePressurePascal: environment.atmosphere.pressurePascal,
    geologicalActivityIndex01: null,
    volcanismIndex01: null,
    surfaceWaterRegime: environment.water.regime,
    volcanismRegime: 'UNKNOWN_V2',
  });
  const giantAtmosphere = isGiant && scientific.thermal.equilibriumTemperatureKelvin !== null
    ? buildSystemSceneGiantAtmospherePresentationV1({
        source: 'V2_4_1_BULK_ENVELOPE_PRESENTATION',
        planetType: type,
        massEarth: scientific.physics.massEarth,
        radiusEarth: scientific.physics.radiusEarth,
        densityGramsPerCubicCentimeter: scientific.physics.densityGramsPerCubicCentimeter,
        envelopeMassFraction01: scientific.physics.envelopeMassEarth / scientific.physics.massEarth,
        iceBearingFractionOfSolids01: scientific.internalComposition.iceBearingFractionOfSolids01,
        rotationPeriodHours: scientific.physics.rotationPeriodHours,
        equilibriumTemperatureKelvin: scientific.thermal.equilibriumTemperatureKelvin,
        referenceBondAlbedo01: scientific.surface.referenceBondAlbedo01,
        retainedMeanMolarMassGramsPerMole: null,
        retainedGasComposition: Object.freeze([]), // V2 gas chemistry not yet measured.
      })
    : null;
  return Object.freeze({
    ...body,
    previewOnlyV23: true as const,
    previewOnlyV241: true as const,
    title: `${scientific.designation} · V2.4.1 ${type} · ${scientific.physics.massEarth.toPrecision(4)} M⊕ · ${scientific.physics.radiusEarth.toPrecision(3)} R⊕. ${scientific.formationPath.explanation} Atmósfera/clima/agua: modelo ESTIMADO desde inventario V2, no observación ni Ground Truth V1; efecto de compañera pendiente. Teq ${environment.equilibriumTemperatureKelvin?.toFixed(1) ?? '—'} K; temperatura superficial ${environment.climate.meanSurfaceTemperatureKelvin?.toFixed(1) ?? 'sin superficie/flujo'} K; presión estimada ${environment.atmosphere.pressurePascal?.toPrecision(3) ?? 'indeterminada'} Pa; agua superficial ${environment.water.regime} (escenario).`,
    colorHex: surfaceStyle === 'oceanic' ? colors['OCEAN'] : surfaceStyle === 'icy'
      ? colors['ICE'] : colors[type] ?? body.colorHex,
    // Exactly the shared V1 renderer function; no binary-specific 0.081 cap.
    radiusScene: presentationPlanetRadiusFromPhysicsV1({
      radiusEarth: scientific.physics.radiusEarth,
      planetType: scientific.type,
      densityGramsPerCubicCentimeter: scientific.physics.densityGramsPerCubicCentimeter,
      envelopeMassFraction01: scientific.physics.envelopeMassEarth / scientific.physics.massEarth,
      isDeepEnvelopeSurface: isGiant,
    }),
    surfaceStyle,
    surfaceEnvironment, // Distinct V2 estimate source; never phase-20 Ground Truth.
    giantAtmosphere,
    specialPresentation: special,
  });
}

export interface BinarySmallBodyProjectionV23 {
  readonly minorBodies: readonly SystemSceneMinorBodySnapshot[];
  readonly asteroidBelts: readonly SystemSceneAsteroidBeltSnapshot[];
}

/** Only S-type bodies, each anchored to the SAME star/projection as its planets. */
export function materializeBinarySmallBodiesV23(
  ecosystem: BinaryEcosystemV23,
  snapshot: SystemSceneSnapshot,
  stars: ReadonlyMap<string, SystemSceneBodySnapshot>,
  radial: ReadonlyMap<string, SystemSceneMultihostRadialProjectionV22>,
  motions: SystemSceneOrbitalMotionSnapshot[],
  orbits: SystemSceneOrbitSnapshot[],
): BinarySmallBodyProjectionV23 {
  const minorBodies: SystemSceneMinorBodySnapshot[] = [];
  const belts: SystemSceneAsteroidBeltSnapshot[] = [];
  const scaleFor = (host: string) => radial.get(host);
  for (const belt of ecosystem.belts) {
    const star = stars.get(belt.hostId);
    const spec = scaleFor(belt.hostId);
    if (star === undefined || spec === undefined) continue;
    // Never render a band that would invade the companion's local disk.
    if (belt.outerEdgeAu > spec.lastApoapsisAu * 1.01) continue;
    belts.push(Object.freeze({
      id: belt.id, label: `${belt.hostId} · cinturón experimental V2.3`, region: 'INNER' as const,
      innerEdgeAu: belt.innerEdgeAu, outerEdgeAu: belt.outerEdgeAu,
      peakAu: belt.peakAu, populationIndex01: belt.populationIndex01,
      innerRadiusScene: systemSceneMultihostProjectedRadiusV22(belt.innerEdgeAu, spec),
      outerRadiusScene: systemSceneMultihostProjectedRadiusV22(belt.outerEdgeAu, spec),
      peakRadiusScene: systemSceneMultihostProjectedRadiusV22(belt.peakAu, spec),
      colorHex: '#998878', opacity: 0.11, peakOpacity: 0.19,
      boundaryOpacity: 0.16,
      anchorMotionContributions: star.motionContributions,
      previewOnlyV23: true as const,
    }));
  }
  for (const item of ecosystem.minorBodies) {
    const star = stars.get(item.hostId);
    const spec = scaleFor(item.hostId);
    if (star === undefined || spec === undefined ||
        item.apoapsisAu > spec.lastApoapsisAu * 1.01) continue;
    const motionId = `${item.id}-motion`;
    const orbitId = `${item.id}-orbit`;
    const motion: SystemSceneOrbitalMotionSnapshot = Object.freeze({
      id: motionId, semiMajorAxisAu: item.semiMajorAxisAu,
      eccentricity: item.eccentricity, periodDays: item.periodDays,
      rotationDegrees: item.rotationDegrees,
      inclinationDegrees: item.inclinationDegrees,
      epochMeanAnomalyDegrees: item.epochMeanAnomalyDegrees,
    });
    const timeScale = multihostPresentationTimeScaleV221(
      item.periodDays, snapshot.simulation.playbackDaysPerRealSecond,
      item.kind === 'COMET' ? 250 : MULTIHOST_V221_SECONDS_PER_ORBIT.PLANET_S * 1.3,
    );
    const local: SystemSceneMotionContributionSnapshot = Object.freeze({
      motionId, scale: 1, presentationTimeScale: timeScale,
      hostRadialProjectionV22: spec,
    });
    const contributions = Object.freeze([...star.motionContributions, local]);
    const project = (au: number) => systemSceneMultihostProjectedRadiusV22(au, spec);
    const asteroid = item.kind === 'ASTEROID';
    const visual = asteroid ? buildSystemSceneAsteroidPresentationV1({
      proceduralId: item.id, previewOnlyV23: true,
      diameterKilometers: item.diameterKilometers,
      compositionRegime: item.composition, structureRegime: 'FRACTURED',
      multiplicityRegime: 'SINGLE',
      carbonaceousFraction01: item.composition === 'CARBONACEOUS' ? 0.7 : 0.1,
      silicateFraction01: item.composition === 'SILICACEOUS' ? 0.7 : 0.1,
      metalFraction01: item.composition === 'METALLIC' ? 0.7 : 0.1,
      iceFraction01: item.composition === 'ICE_RICH' ? 0.7 : 0.1,
      porosityIndex01: 0.3, bulkDensityGramsPerCubicCentimeter: 2.1,
      geometricAlbedo01: 0.13, binaryMassRatio01: null,
      binarySeparationPrimaryRadii: null,
    }) : null;
    const comet = asteroid ? null : buildSystemSceneCometPresentationV1({
      proceduralId: item.id, previewOnlyV23: true,
      diameterKilometers: item.diameterKilometers,
      iceFraction01: 0.68, dustFraction01: 0.32,
      porosityIndex01: 0.53, bulkDensityGramsPerCubicCentimeter: 0.65,
      geometricAlbedo01: 0.04, volatileRichnessIndex01: 0.8,
      periodRegime: 'SHORT_PERIOD',
      referenceLuminositySolar: star.sourceLuminositySolar ?? 1,
      semiMajorAxisAu: item.semiMajorAxisAu, eccentricity: item.eccentricity,
      periapsisAu: item.periapsisAu, apoapsisAu: item.apoapsisAu,
      orbitalPeriodYears: item.periodDays / 365.25,
      epochMeanAnomalyDegrees: item.epochMeanAnomalyDegrees,
      presentationTimeScale: timeScale,
    });
    const orbit: SystemSceneOrbitSnapshot = Object.freeze({
      id: orbitId, kind: 'minor-body' as const,
      label: `${item.hostId} · ${item.kind === 'COMET' ? 'cometa' : 'asteroide'} V2.3`,
      colorHex: asteroid ? '#988C80' : '#92BED1', opacity: 0.22,
      semiMajorScene: project(item.semiMajorAxisAu),
      semiMinorScene: project(item.semiMajorAxisAu * Math.sqrt(1 - item.eccentricity ** 2)),
      focusOffsetScene: project(item.semiMajorAxisAu * item.eccentricity),
      rotationDegrees: item.rotationDegrees, inclinationDegrees: item.inclinationDegrees,
      motionId, motionScale: 1,
      anchorMotionContributions: star.motionContributions, hostRadialProjectionV22: spec,
    });
    const body: SystemSceneMinorBodySnapshot = Object.freeze({
      id: item.id, kind: 'minor-body' as const,
      minorBodyKind: asteroid ? MinorBodyKind.ASTEROID : MinorBodyKind.COMET,
      previewOnlyV23: true as const, hostIdV23: item.hostId,
      label: `${item.hostId}-${item.kind === 'ASTEROID' ? 'AST' : 'COM'}`,
      title: `${item.hostId} · ${item.kind === 'ASTEROID' ? 'asteroide' : 'cometa'} V2.3 (experimental; no Ground Truth V1)`,
      colorHex: asteroid ? visual!.presentationColorHex : comet!.presentationNucleusColorHex,
      radiusScene: asteroid ? 0.011 : 0.014,
      position: projectSystemSceneMotionContributions(
        contributions, id => id === motionId ? motion : motions.find(value => value.id === id),
        snapshot.simulation.epochSimulationDay, snapshot.scale,
      ),
      orbitId, motionContributions: contributions,
      asteroidPresentation: visual, cometPresentation: comet,
    });
    motions.push(motion);
    orbits.push(orbit);
    minorBodies.push(body);
  }
  return Object.freeze({minorBodies: Object.freeze(minorBodies),
    asteroidBelts: Object.freeze(belts)});
}
