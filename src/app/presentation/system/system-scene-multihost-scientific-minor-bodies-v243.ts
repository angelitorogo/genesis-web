import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { type MultihostScientificMinorBodyCatalogV243 } from '../../domain/planetary/multihost-scientific-minor-bodies-v243';
import { buildSystemSceneAsteroidPresentationV1 } from './system-scene-asteroid-presentation';
import { buildSystemSceneCometPresentationV1 } from './system-scene-comet-presentation';
import { buildSystemSceneMinorBodyOrbitPresentationV1 } from './system-scene-minor-body-orbit-v1';
import { projectSystemSceneMotionContributions } from './system-scene-motion-projection';
import { multihostPresentationTimeScaleV221, MULTIHOST_V221_SECONDS_PER_ORBIT } from './system-scene-multihost-laboratory-cadence';
import { systemSceneMultihostProjectedRadiusV22,
  type SystemSceneMultihostRadialProjectionV22 } from './system-scene-multihost-radial-projection';
import { type SystemSceneAsteroidBeltSnapshot, type SystemSceneBodySnapshot,
  type SystemSceneMinorBodySnapshot, type SystemSceneMotionContributionSnapshot,
  type SystemSceneOrbitSnapshot, type SystemSceneOrbitalMotionSnapshot,
  type SystemSceneSnapshot } from './system-scene-snapshot';

/** Renderer budgets are *only* presentation limits. All scientific bodies and
 * both independent host inventories remain in scientificMultihostMinorBodiesV243. */
const MAX_VISIBLE_MINOR_BODIES_BINARY = 26;
const MAX_VISIBLE_BELTS_BINARY = 4;

export interface MultihostProjectedMinorBodiesV243 {
  readonly minorBodies: readonly SystemSceneMinorBodySnapshot[];
  readonly asteroidBelts: readonly SystemSceneAsteroidBeltSnapshot[];
}

export function materializeBinaryScientificMinorBodiesV243(
  catalog: MultihostScientificMinorBodyCatalogV243,
  snapshot: SystemSceneSnapshot,
  stars: ReadonlyMap<string, SystemSceneBodySnapshot>,
  radial: ReadonlyMap<string, SystemSceneMultihostRadialProjectionV22>,
  motions: SystemSceneOrbitalMotionSnapshot[],
  orbits: SystemSceneOrbitSnapshot[],
): MultihostProjectedMinorBodiesV243 {
  const minorBodies: SystemSceneMinorBodySnapshot[] = [];
  const asteroidBelts: SystemSceneAsteroidBeltSnapshot[] = [];
  if (snapshot.multiplicityName !== 'BINARY') {
    throw new RangeError('V2.4.3 renderer is binary-only.');
  }
  for (const belt of catalog.belts) {
    if (asteroidBelts.length >= MAX_VISIBLE_BELTS_BINARY) break;
    const star = stars.get(belt.hostId);
    const spec = radial.get(belt.hostId);
    if (star === undefined || spec === undefined ||
        belt.outerEdgeAu > spec.lastApoapsisAu * 1.01) continue;
    asteroidBelts.push(Object.freeze({
      id: belt.id, label: `${belt.hostId} · cinturón V2.4.3 · ~${belt.estimatedPopulation} asteroides`,
      region: belt.region, innerEdgeAu: belt.innerEdgeAu,
      outerEdgeAu: belt.outerEdgeAu, peakAu: belt.peakAu,
      populationIndex01: belt.populationIndex01,
      innerRadiusScene: systemSceneMultihostProjectedRadiusV22(belt.innerEdgeAu, spec),
      outerRadiusScene: systemSceneMultihostProjectedRadiusV22(belt.outerEdgeAu, spec),
      peakRadiusScene: systemSceneMultihostProjectedRadiusV22(belt.peakAu, spec),
      colorHex: belt.composition === 'ICE_RICH' ? '#A0BAC3' : '#998878',
      opacity: 0.11, peakOpacity: 0.19, boundaryOpacity: 0.16,
      anchorMotionContributions: star.motionContributions,
      scientificV243: true as const, hostIdV243: belt.hostId,
    }));
  }
  // Round-robin A/B so a rich disk cannot starve the other host of draw slots.
  const groups = [
    catalog.bodies.filter(item => item.hostId === 'A' &&
      (item.kind !== 'COMET' || item.cometOrbitClass === 'INBOUND_VISITOR' ||
        item.eccentricity >= 0.35))
      .sort((a, b) => Number(b.cometOrbitClass === 'INBOUND_VISITOR') -
        Number(a.cometOrbitClass === 'INBOUND_VISITOR')),
    catalog.bodies.filter(item => item.hostId === 'B' &&
      (item.kind !== 'COMET' || item.cometOrbitClass === 'INBOUND_VISITOR' ||
        item.eccentricity >= 0.35))
      .sort((a, b) => Number(b.cometOrbitClass === 'INBOUND_VISITOR') -
        Number(a.cometOrbitClass === 'INBOUND_VISITOR')),
  ];
  const queue: typeof catalog.bodies[number][] = [];
  for (let index = 0; queue.length < MAX_VISIBLE_MINOR_BODIES_BINARY; index++) {
    let appended = false;
    for (const group of groups) {
      const item = group[index];
      if (item !== undefined) { queue.push(item); appended = true; }
      if (queue.length >= MAX_VISIBLE_MINOR_BODIES_BINARY) break;
    }
    if (!appended) break;
  }
  for (const item of queue) {
    const star = stars.get(item.hostId);
    const spec = radial.get(item.hostId);
    if (star === undefined || spec === undefined ||
        (item.kind === 'ASTEROID' && item.apoapsisAu > spec.lastApoapsisAu * 1.01)) continue;
    // The production SINGLE V1 renderer builds a complete focus-based Kepler
    // ellipse and, where necessary, expands ALL its axes by the SAME factor.
    // A log/radial projection applied per vertex distorted the comet ellipse
    // into a warped loop: use the V1 semi-axis scale as ONE affine AU->scene
    // factor for its line and its moving nucleus. Other V2 planet/belt layers
    // retain their frozen V2.3.4 radial projection, untouched.
    const asteroid = item.kind === 'ASTEROID';
    const cometOrbitV1 = asteroid ? null : buildSystemSceneMinorBodyOrbitPresentationV1({
      semiMajorAxisAu: item.semiMajorAxisAu,
      eccentricity: item.eccentricity,
      projectedSemiMajorScene: systemSceneMultihostProjectedRadiusV22(item.semiMajorAxisAu, spec),
      maximumVisibleStarRadiusScene: Math.max(
        star.radiusScene, star.opticalRadiusScene ?? star.radiusScene,
      ),
    });
    const cometScenePerAu = cometOrbitV1 === null ? null :
      cometOrbitV1.semiMajorScene / item.semiMajorAxisAu;
    const motionId = `${item.id}-motion`;
    const orbitId = `${item.id}-orbit`;
    const motion: SystemSceneOrbitalMotionSnapshot = Object.freeze({
      id: motionId, semiMajorAxisAu: item.semiMajorAxisAu,
      eccentricity: item.eccentricity, periodDays: item.periodDays,
      rotationDegrees: item.rotationDegrees,
      inclinationDegrees: item.inclinationDegrees,
      ...(item.kind === 'COMET' ? {
        longitudeAscendingNodeDegrees: item.longitudeAscendingNodeDegrees,
        argumentOfPeriapsisDegrees: item.argumentOfPeriapsisDegrees,
      } : {}),
      epochMeanAnomalyDegrees: item.epochMeanAnomalyDegrees,
    });
    const timeScale = multihostPresentationTimeScaleV221(
      item.periodDays, snapshot.simulation.playbackDaysPerRealSecond,
      item.kind === 'COMET' ? 250 : MULTIHOST_V221_SECONDS_PER_ORBIT.PLANET_S * 1.3);
    const local: SystemSceneMotionContributionSnapshot = Object.freeze({
      motionId, scale: 1, presentationTimeScale: timeScale,
      ...(cometScenePerAu !== null ? {linearScenePerAu: cometScenePerAu} :
        {hostRadialProjectionV22: spec}),
    });
    const contributions = Object.freeze([...star.motionContributions, local]);
    const project = (au: number) => systemSceneMultihostProjectedRadiusV22(au, spec);
    const ice = item.iceFraction01;
    const carbon = item.composition === 'CARBONACEOUS' ? 0.7 : 0.1;
    const metal = item.composition === 'METALLIC' ? 0.7 : 0.1;
    const silicate = item.composition === 'SILICACEOUS' ? 0.7 : 0.1;
    // V1 input fractions are explicitly *presentation weights*, not an
    // independently measured chemical assay. Normalize to the V1 invariant.
    const denominator = carbon + metal + silicate + ice;
    const asteroidVisual = asteroid ? buildSystemSceneAsteroidPresentationV1({
      proceduralId: item.formationSeedHex, scientificV243: true,
      diameterKilometers: item.diameterKilometers,
      compositionRegime: item.composition, structureRegime: item.structure,
      multiplicityRegime: 'SINGLE',
      carbonaceousFraction01: carbon / denominator,
      silicateFraction01: silicate / denominator,
      metalFraction01: metal / denominator,
      iceFraction01: ice / denominator,
      porosityIndex01: item.porosityIndex01,
      bulkDensityGramsPerCubicCentimeter: item.densityGramsPerCubicCentimeter,
      geometricAlbedo01: item.geometricAlbedo01,
      binaryMassRatio01: null, binarySeparationPrimaryRadii: null,
    }) : null;
    const cometVisual = asteroid ? null : buildSystemSceneCometPresentationV1({
      proceduralId: item.formationSeedHex, scientificV243: true,
      diameterKilometers: item.diameterKilometers,
      iceFraction01: item.iceFraction01, dustFraction01: item.dustFraction01,
      porosityIndex01: item.porosityIndex01,
      bulkDensityGramsPerCubicCentimeter: item.densityGramsPerCubicCentimeter,
      geometricAlbedo01: item.geometricAlbedo01,
      volatileRichnessIndex01: item.volatileRichnessIndex01,
      periodRegime: item.periodDays / 365.25 < 200 ? 'SHORT_PERIOD' : 'LONG_PERIOD',
      referenceLuminositySolar: star.sourceLuminositySolar ?? 1,
      semiMajorAxisAu: item.semiMajorAxisAu, eccentricity: item.eccentricity,
      periapsisAu: item.periapsisAu, apoapsisAu: item.apoapsisAu,
      orbitalPeriodYears: item.periodDays / 365.25,
      epochMeanAnomalyDegrees: item.epochMeanAnomalyDegrees,
      presentationTimeScale: timeScale,
    });
    const orbit: SystemSceneOrbitSnapshot = Object.freeze({
      id: orbitId, kind: 'minor-body', label: item.designation,
      colorHex: asteroid ? '#988C80' : '#92BED1',
      opacity: asteroid ? 0.18 : 0.28 + (cometOrbitV1!.presentationExpansionFactor > 1 ? 0.10 : 0),
      semiMajorScene: cometOrbitV1?.semiMajorScene ?? project(item.semiMajorAxisAu),
      semiMinorScene: cometOrbitV1?.semiMinorScene ??
        project(item.semiMajorAxisAu * Math.sqrt(1 - item.eccentricity ** 2)),
      focusOffsetScene: cometOrbitV1?.focusOffsetScene ??
        project(item.semiMajorAxisAu * item.eccentricity),
      rotationDegrees: item.rotationDegrees, inclinationDegrees: item.inclinationDegrees,
      motionId, motionScale: 1,
      anchorMotionContributions: star.motionContributions,
      ...(cometScenePerAu !== null ? {linearScenePerAu: cometScenePerAu} :
        {hostRadialProjectionV22: spec}),
    });
    const body: SystemSceneMinorBodySnapshot = Object.freeze({
      id: item.id, kind: 'minor-body',
      minorBodyKind: asteroid ? MinorBodyKind.ASTEROID : MinorBodyKind.COMET,
      scientificV243: true, hostIdV243: item.hostId,
      label: item.designation,
      title: `${item.designation} · V2.4.3 referencia científica · diámetro ${item.diameterKilometers.toPrecision(4)} km · masa ${item.massEarth.toExponential(3)} M⊕ · órbita ${item.semiMajorAxisAu.toPrecision(4)} UA${item.kind === 'COMET' ? ` · origen reservorio frío S-type ${item.hostId} · ${item.cometOrbitClass === 'INBOUND_VISITOR' ? `visitante tipo V1, e=${item.eccentricity.toFixed(3)}, inclinación=${item.inclinationDegrees.toFixed(1)}°, cruza intervalos radiales planetarios (sin colisión probada)` : 'núcleo exterior ligado al reservorio'}` : ''}; sin observación ni Ground Truth V1`,
      colorHex: asteroid ? asteroidVisual!.presentationColorHex : cometVisual!.presentationNucleusColorHex,
      // Identical diameter-to-presentation radius law as V1 minorBodyRadiusScene.
      radiusScene: Math.max(0.011, Math.min(0.028,
        0.010 + 0.004 * Math.log10(1 + item.diameterKilometers))),
      position: projectSystemSceneMotionContributions(
        contributions, id => id === motionId ? motion : motions.find(value => value.id === id),
        snapshot.simulation.epochSimulationDay, snapshot.scale),
      orbitId, motionContributions: contributions,
      asteroidPresentation: asteroidVisual, cometPresentation: cometVisual,
    });
    motions.push(motion);
    orbits.push(orbit);
    minorBodies.push(body);
  }
  return Object.freeze({
    minorBodies: Object.freeze(minorBodies), asteroidBelts: Object.freeze(asteroidBelts),
  });
}
