import * as THREE from 'three';

import { type CompactHostMinorBody } from '../../domain/planetary/compact-host-secondary-population';
import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { MinorBodyScientificFicheResolutionKind } from '../minor-body-detail/minor-body-scientific-card';
import { ScientificBodyPreviewKind } from '../scientific/scientific-body-preview';
import {
  buildSystemSceneCometPresentationV1,
  systemSceneCometActivityAtDistanceV1,
} from './system-scene-comet-presentation';
import {
  systemSceneCometActivityVisualParityV1,
} from './system-scene-comet-activity-parity';
import {
  applySystemSceneCometActivityVisualV1,
  createSystemSceneCometRenderableV1,
} from './system-scene-comet-renderable';
import { compactMinorFiche } from './system-compact-host-secondary-fiches';
import { type SystemSceneSnapshot } from './system-scene-snapshot';

// Regression for the separate 31.4g fiche constructor. COM-R2 tested only the
// standard ScientificBodyPreviewAssembler and therefore missed this path.
const id = '0123456789ABCDEF0123456789ABCDEF';
const physicalComet = buildSystemSceneCometPresentationV1({
  proceduralId: id,
  diameterKilometers: 85.205,
  iceFraction01: 0.80788,
  dustFraction01: 0.19212,
  porosityIndex01: 0.42,
  bulkDensityGramsPerCubicCentimeter: 1.469,
  geometricAlbedo01: 0.12934,
  volatileRichnessIndex01: 0.80788,
  periodRegime: 'LONG_PERIOD',
  referenceLuminositySolar: 1000, // Deliberately strong proxy: not proof of outgassing.
  semiMajorAxisAu: 29.579,
  eccentricity: 0.43254,
  periapsisAu: 29.579 * (1 - 0.43254),
  apoapsisAu: 29.579 * (1 + 0.43254),
  orbitalPeriodYears: 50315 / 365.25,
  epochMeanAnomalyDegrees: 94,
  presentationTimeScale: 1,
});
const body = {
  kind: MinorBodyKind.COMET,
  ordinal: 2,
  proceduralId: id,
  diameterKilometers: 85.205,
  bulkDensityGramsCm3: 1.469,
  iceFraction01: 0.80788,
  geometricAlbedo01: 0.12934,
  semiMajorAxisAu: 29.579,
  eccentricity: 0.43254,
  periapsisAu: 29.579 * (1 - 0.43254),
  apoapsisAu: 29.579 * (1 + 0.43254),
  orbitalPeriodDays: 50315,
  inclinationDegrees: 19.19,
} as unknown as CompactHostMinorBody;
const model = {
  stellarSystemCard: { title: 'Sistema compacto de prueba' },
  galaxyIndex: 5281001578907448202n,
  sectorKey: 34359738370n,
  galacticObjectIndex: 0n,
} as unknown as ArchiveDiscoveryDetailModel;
function snapshot(kind: 'NEUTRON_STAR' | 'STELLAR'): SystemSceneSnapshot {
  return {
    generatorVersionCode: 2,
    stars: kind === 'NEUTRON_STAR'
      ? [{ compactHostKind: 'NEUTRON_STAR', sourceLuminositySolar: null,
           compactHostPresentationFlux: 6 }]
      : [{ sourceLuminositySolar: 1000 }],
    minorBodies: [{ id: `minor-${MinorBodyKind.COMET.code}-${id}`,
      minorBodyKind: MinorBodyKind.COMET, cometPresentation: physicalComet }],
  } as unknown as SystemSceneSnapshot;
}

describe('COM-R3 — complete compact-host fiche ↔ SystemScene tail parity', () => {
  it('does not invent coma or tails through the real 31.4g fiche route', () => {
    const scene = snapshot('NEUTRON_STAR');
    const original = systemSceneCometActivityAtDistanceV1(
      physicalComet, physicalComet.periapsisAu, 0.42,
    );
    expect(original.hasDustTail).toBe(true); // Confirms the old regression.
    const result = compactMinorFiche(model, body, scene);
    expect(result.kind).toBe(MinorBodyScientificFicheResolutionKind.AVAILABLE);
    if (result.kind !== MinorBodyScientificFicheResolutionKind.AVAILABLE) return;
    expect(result.card.preview.kind).toBe(ScientificBodyPreviewKind.COMET);
    if (result.card.preview.kind !== ScientificBodyPreviewKind.COMET) return;
    const fiche = result.card.preview;
    expect(fiche.accessibleLabel).toContain('no resuelta');
    expect(fiche.activity.hasComa).toBe(false);
    expect(fiche.activity.hasDustTail).toBe(false);
    expect(fiche.activity.hasIonTail).toBe(false);
    expect(fiche.activity.presentationComaOpacity01).toBe(0);
    expect(fiche.activity.presentationDustTailLengthScene).toBe(0);
    expect(fiche.activity.presentationIonTailLengthScene).toBe(0);
    const system = systemSceneCometActivityVisualParityV1(
      scene, physicalComet, original, 0.42, 1000,
    );
    expect(system.hasComa).toBe(fiche.activity.hasComa);
    expect(system.hasDustTail).toBe(fiche.activity.hasDustTail);
    expect(system.hasIonTail).toBe(fiche.activity.hasIonTail);
    const mesh = createSystemSceneCometRenderableV1(0.42, physicalComet);
    try {
      applySystemSceneCometActivityVisualV1(mesh.binding, system, new THREE.Vector3(1, 0, 0));
      expect(mesh.binding.comaInner.visible).toBe(false);
      expect(mesh.binding.dustTail.visible).toBe(false);
      expect(mesh.binding.ionTail.visible).toBe(false);
    } finally {
      mesh.resources.forEach(resource => resource.dispose());
    }
  });



  it('reuses the canonical comet nucleus renderer even when a compact snapshot omitted cometPresentation', () => {
    const scene = {
      generatorVersionCode: 2,
      stars: [{ compactHostKind: 'NEUTRON_STAR', sourceLuminositySolar: null, compactHostPresentationFlux: 6 }],
      minorBodies: [{ id: `minor-${MinorBodyKind.COMET.code}-${id}`, minorBodyKind: MinorBodyKind.COMET }],
    } as unknown as SystemSceneSnapshot;
    const result = compactMinorFiche(model, body, scene);
    expect(result.kind).toBe(MinorBodyScientificFicheResolutionKind.AVAILABLE);
    if (result.kind !== MinorBodyScientificFicheResolutionKind.AVAILABLE) return;
    expect(result.card.preview.kind).toBe(ScientificBodyPreviewKind.COMET);
    if (result.card.preview.kind !== ScientificBodyPreviewKind.COMET) return;
    expect(result.card.preview.primary.version).toBe(1);
    expect(result.card.preview.primary.presentationNucleusIrregularity01).toBeGreaterThan(0.2);
    expect(result.card.preview.activity.hasComa).toBe(false);
    expect(result.card.preview.activity.hasDustTail).toBe(false);
    const mesh = createSystemSceneCometRenderableV1(0.42, {
      ...physicalComet,
      shapeSeedUint32: result.card.preview.primary.visualVariantUint32,
      presentationNucleusColorHex: result.card.preview.primary.presentationNucleusColorHex,
      presentationComaColorHex: result.card.preview.primary.presentationComaColorHex,
      presentationDustTailColorHex: result.card.preview.primary.presentationDustTailColorHex,
      presentationIonTailColorHex: result.card.preview.primary.presentationIonTailColorHex,
      presentationNucleusRoughness01: result.card.preview.primary.presentationNucleusRoughness01,
      presentationNucleusAxisScaleX: result.card.preview.primary.presentationNucleusAxisScaleX,
      presentationNucleusAxisScaleY: result.card.preview.primary.presentationNucleusAxisScaleY,
      presentationNucleusAxisScaleZ: result.card.preview.primary.presentationNucleusAxisScaleZ,
      presentationNucleusIrregularity01: result.card.preview.primary.presentationNucleusIrregularity01,
    });
    try {
      const nucleus = mesh.object.children[0] as THREE.Mesh<THREE.BufferGeometry>;
      expect((nucleus.geometry.getAttribute('position') as THREE.BufferAttribute).count).toBeGreaterThan(6500);
    } finally {
      mesh.resources.forEach(resource => resource.dispose());
    }
  });

  it('does not globally suppress activity: a genuinely luminous conventional source remains eligible', () => {
    const scene = snapshot('STELLAR');
    const result = compactMinorFiche(model, body, scene);
    expect(result.kind).toBe(MinorBodyScientificFicheResolutionKind.AVAILABLE);
    if (result.kind !== MinorBodyScientificFicheResolutionKind.AVAILABLE) return;
    expect(result.card.preview.kind).toBe(ScientificBodyPreviewKind.COMET);
    if (result.card.preview.kind !== ScientificBodyPreviewKind.COMET) return;
    const activity = result.card.preview.activity;
    expect(activity.hasComa).toBe(true);
    expect(activity.hasDustTail).toBe(true);
    const sys = systemSceneCometActivityVisualParityV1(
      scene, physicalComet,
      systemSceneCometActivityAtDistanceV1(physicalComet, physicalComet.periapsisAu, 0.42),
      0.42,
    );
    expect(sys.hasComa).toBe(activity.hasComa);
    expect(sys.hasDustTail).toBe(activity.hasDustTail);
  });
});
