import * as THREE from 'three';
import {
  MinorBodyScientificTargetKind,
  type MinorBodyScientificResolvedTarget,
} from '../../simulation/planetary/minor-body-scientific-target-resolver';
import {
  ScientificBodyPreviewAssembler,
  ScientificBodyPreviewKind,
  SCIENTIFIC_COMET_PREVIEW_RADIUS_SCENE,
} from '../scientific/scientific-body-preview';
import {
  buildSystemSceneCometPresentationV1,
  systemSceneCometActivityAtDistanceV1,
  systemSceneCometActivityAtSimulationDayV1,
} from './system-scene-comet-presentation';
import {
  applySystemSceneCometActivityVisualV1,
  createSystemSceneCometRenderableV1,
} from './system-scene-comet-renderable';
import {
  isCometActivityUnresolvedInSceneV1,
  systemSceneCometActivityVisualParityV1,
} from './system-scene-comet-activity-parity';
import {
  type SystemSceneSnapshot,
  type SystemSceneBodySnapshot,
} from './system-scene-snapshot';

const proceduralId = '1234567890ABCDEF1234567890ABCDEF';
const comet = buildSystemSceneCometPresentationV1({
  proceduralId,
  diameterKilometers: 19.294,
  iceFraction01: 0.8763,
  dustFraction01: 0.1237,
  porosityIndex01: 0.614,
  bulkDensityGramsPerCubicCentimeter: 0.7,
  geometricAlbedo01: 0.039,
  volatileRichnessIndex01: 0.937,
  periodRegime: 'SHORT_PERIOD',
  referenceLuminositySolar: 1,
  semiMajorAxisAu: 4,
  eccentricity: 0.75,
  periapsisAu: 1,
  apoapsisAu: 7,
  orbitalPeriodYears: 8,
  epochMeanAnomalyDegrees: 0,
  presentationTimeScale: 1,
});

function scene(kind: 'STELLAR' | 'COMPACT' | 'NONE', version = 2): SystemSceneSnapshot {
  const stars = kind === 'NONE' ? [] : [{
    id: 'host',
    sourceLuminositySolar: kind === 'COMPACT' ? null : 1,
    ...(kind === 'COMPACT' ? {
      compactHostKind: 'NEUTRON_STAR',
      // This number is for graphical inspection only, not source radiation.
      compactHostPresentationFlux: 6,
    } : {}),
  } as SystemSceneBodySnapshot];
  return {
    generatorVersionCode: version,
    stars,
    minorBodies: [{
      id: `minor-comet-${proceduralId}`,
      title: 'Cometa de regresión',
      minorBodyKind: {name: 'COMET'},
      cometPresentation: comet,
    }],
  } as unknown as SystemSceneSnapshot;
}

const target = {
  identity: {designation: 'Cometa de regresión'},
  detail: {kind: MinorBodyScientificTargetKind.COMET},
} as unknown as MinorBodyScientificResolvedTarget;

function assertRenderedActivity(
  visual: ReturnType<typeof systemSceneCometActivityVisualParityV1>,
  expected: Readonly<{coma: boolean; dust: boolean; ion: boolean}>,
) {
  const renderable = createSystemSceneCometRenderableV1(0.014, comet);
  try {
    applySystemSceneCometActivityVisualV1(renderable.binding, visual, new THREE.Vector3(1, 0, 0));
    expect(renderable.binding.comaInner.visible).toBe(expected.coma);
    expect(renderable.binding.comaOuter.visible).toBe(expected.coma);
    expect(renderable.binding.dustTail.visible).toBe(expected.dust);
    expect(renderable.binding.ionTail.visible).toBe(expected.ion);
  } finally {
    renderable.resources.forEach(resource => resource.dispose());
  }
}

function ficheActivity(snapshot: SystemSceneSnapshot) {
  const model = ScientificBodyPreviewAssembler.minorBody(target, proceduralId, snapshot);
  expect(model.kind).toBe(ScientificBodyPreviewKind.COMET);
  if (model.kind !== ScientificBodyPreviewKind.COMET) throw new Error('Expected comet preview');
  return model;
}

describe('COM-R2 — SystemScene / fiche cometary activity parity', () => {
  it('1 — inactive comet: no coma or tails in either view', () => {
    const snapshot = scene('STELLAR');
    const dormant = buildSystemSceneCometPresentationV1({
      proceduralId,
      diameterKilometers: 19.294, iceFraction01: 0.8763,
      dustFraction01: 0.1237, porosityIndex01: 0.614,
      bulkDensityGramsPerCubicCentimeter: 0.7, geometricAlbedo01: 0.039,
      volatileRichnessIndex01: 0.937, periodRegime: 'LONG_PERIOD',
      referenceLuminositySolar: 0.00001, semiMajorAxisAu: 4,
      eccentricity: 0.75, periapsisAu: 1, apoapsisAu: 7,
      orbitalPeriodYears: 8, epochMeanAnomalyDegrees: 0, presentationTimeScale: 1,
    });
    const dormantScene = {...snapshot, minorBodies: [{...snapshot.minorBodies[0]!, cometPresentation: dormant}]};
    const physical = systemSceneCometActivityAtDistanceV1(dormant, dormant.periapsisAu, 0.014);
    const system = systemSceneCometActivityVisualParityV1(dormantScene, dormant, physical, 0.014);
    const fiche = ficheActivity(dormantScene);
    expect(system.hasComa).toBe(false);
    expect(system.hasDustTail).toBe(false);
    expect(system.hasIonTail).toBe(false);
    expect(fiche.activity.hasComa).toBe(false);
    expect(fiche.activity.hasDustTail).toBe(false);
    expect(fiche.activity.hasIonTail).toBe(false);
    assertRenderedActivity(system, {coma: false, dust: false, ion: false});
    assertRenderedActivity({...physical, ...fiche.activity}, {coma: false, dust: false, ion: false});
  });

  it('2 — resolved periapsis: coma and dust tail in both with the same law and matching phase', () => {
    const snapshot = scene('STELLAR');
    const radius = SCIENTIFIC_COMET_PREVIEW_RADIUS_SCENE;
    const physical = systemSceneCometActivityAtDistanceV1(comet, comet.periapsisAu, radius);
    const system = systemSceneCometActivityVisualParityV1(snapshot, comet, physical, radius, 1);
    const fiche = ficheActivity(snapshot);
    expect(system.hasComa).toBe(true);
    expect(system.hasDustTail).toBe(true);
    expect(fiche.activity.hasComa).toBe(true);
    expect(fiche.activity.hasDustTail).toBe(true);
    expect(fiche.activity.presentationDustTailLengthScene).toBeCloseTo(system.presentationDustTailLengthScene, 12);
    expect(fiche.activity.presentationDustTailOpacity01).toBeCloseTo(system.presentationDustTailOpacity01, 12);
    expect(fiche.activity.presentationComaRadiusScene).toBeCloseTo(system.presentationComaRadiusScene, 12);
    assertRenderedActivity(system, {coma: true, dust: true, ion: true});
    assertRenderedActivity({...physical, ...fiche.activity}, {coma: true, dust: true, ion: true});
    // The system still uses actual time-dependent position, not frozen periapsis.
    const apo = systemSceneCometActivityAtSimulationDayV1(comet, comet.orbitalPeriodYears * 365.25 / 2, radius);
    expect(systemSceneCometActivityVisualParityV1(snapshot, comet, apo, radius).hasDustTail).toBe(false);
  });

  it('3 — unresolved compact-host snapshot: never invents a tail from the scientific fixture or visual host glow', () => {
    const snapshot = scene('COMPACT');
    const physical = systemSceneCometActivityAtDistanceV1(comet, comet.periapsisAu, 0.014);
    const system = systemSceneCometActivityVisualParityV1(snapshot, comet, physical, 0.014, 100);
    const fiche = ficheActivity(snapshot);
    expect(isCometActivityUnresolvedInSceneV1(snapshot.stars)).toBe(true);
    for (const visual of [system, fiche.activity]) {
      expect(visual.hasComa).toBe(false);
      expect(visual.hasDustTail).toBe(false);
      expect(visual.hasIonTail).toBe(false);
      expect(visual.presentationDustTailLengthScene).toBe(0);
      expect(visual.presentationIonTailLengthScene).toBe(0);
      expect(visual.presentationComaOpacity01).toBe(0);
    }
    expect(fiche.accessibleLabel).toContain('no está resuelta');
    expect(Object.isFrozen(system)).toBe(true);
    expect(physical.hasDustTail).toBe(true); // The source is NOT modified.
    assertRenderedActivity(system, {coma: false, dust: false, ion: false});
    assertRenderedActivity({...physical, ...fiche.activity}, {coma: false, dust: false, ion: false});
    const withoutStar = scene('NONE');
    expect(systemSceneCometActivityVisualParityV1(withoutStar, comet, physical, 0.014).hasDustTail).toBe(false);
    // A real luminous stellar companion restores the scientifically resolvable
    // source, even in a system that also contains a compact object.
    const withStellarCompanion = {...snapshot, stars: [
      ...snapshot.stars,
      {sourceLuminositySolar: 1} as SystemSceneBodySnapshot,
    ]};
    expect(isCometActivityUnresolvedInSceneV1(withStellarCompanion.stars)).toBe(false);
    expect(systemSceneCometActivityVisualParityV1(withStellarCompanion, comet, physical, 0.014, 1).hasDustTail).toBe(true);
  });
});
