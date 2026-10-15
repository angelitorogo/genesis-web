import * as THREE from 'three';
import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { type CompactHostMinorBody } from '../../domain/planetary/compact-host-secondary-population';
import { type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { ScientificBodyPreviewKind } from '../scientific/scientific-body-preview';
import { MinorBodyScientificFicheResolutionKind } from '../minor-body-detail/minor-body-scientific-card';
import { compactMinorFiche } from './system-compact-host-secondary-fiches';
import { type SystemSceneSnapshot } from './system-scene-snapshot';
import { buildSystemSceneCapturedPresentationV1 } from './system-scene-captured-presentation';
import { createSystemSceneCapturedRenderableV1 } from './system-scene-captured-renderable';

const id = '9B0C9AEE5F3D37ABB734ECF92D71FFC6';
const build = (
  diameterKilometers: number,
  volatileFraction01: number,
  geometricAlbedo01: number,
  proceduralId=id,
  bulkDensityGramsPerCubicCentimeter=1.8165,
  porosityIndex01=0.34,
) => buildSystemSceneCapturedPresentationV1({
  proceduralId,
  diameterKilometers,
  volatileFraction01,
  refractoryFraction01:1-volatileFraction01,
  geometricAlbedo01,
  bulkDensityGramsPerCubicCentimeter,
  porosityIndex01,
  compositionRegime:
    volatileFraction01 > 0.6 ? 'VOLATILE_RICH' :
    volatileFraction01 < 0.3 ? 'ROCK_DOMINATED' : 'MIXED',
});

const model = {stellarSystemCard:{title:'Biphas'},galaxyIndex:0n,
  sectorKey:8n,galacticObjectIndex:1n} as unknown as ArchiveDiscoveryDetailModel;
const body={kind:MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT,proceduralId:id,ordinal:1,
  diameterKilometers:55.837,iceFraction01:0.55967,geometricAlbedo01:0.25347,
  bulkDensityGramsCm3:1.8165,semiMajorAxisAu:22.742,eccentricity:0.16892,
  periapsisAu:18.9,apoapsisAu:26.583,orbitalPeriodDays:33920,
  inclinationDegrees:14.406} as unknown as CompactHostMinorBody;
const scene=(presentation: ReturnType<typeof build> | null): SystemSceneSnapshot => ({
  generatorVersionCode:2, stars:[], minorBodies:[{id:`minor-${MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT.code}-${id}`,
    minorBodyKind:MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT, capturedPresentation:presentation}],
} as unknown as SystemSceneSnapshot);

function rangeOfNormalizedRadii(geometry: THREE.BufferGeometry, radius: number): number {
  const p=geometry.getAttribute('position') as THREE.BufferAttribute;
  let min=Infinity,max=-Infinity;
  for(let i=0;i<p.count;i++) {
    const d=Math.hypot(p.getX(i),p.getY(i),p.getZ(i))/radius;
    min=Math.min(min,d);max=Math.max(max,d);
  }
  return max-min;
}

function render(p: ReturnType<typeof build>, radius: number) {
  const r=createSystemSceneCapturedRenderableV1(radius,p);
  const g=r.surface.geometry as THREE.BufferGeometry;
  const material=r.surface.material as THREE.MeshStandardMaterial;
  return {r,g,material};
}

describe('CAP-R1 — global physically constrained captured-object renderer',()=>{
  it('keeps sub-kilometric captured objects more irregular than large captured bodies',()=>{
    const small=build(0.2806,0.195781,0.101, 'XCAP-001-TEST', 2.632, 0.22);
    const large=build(55.837,0.55967,0.25347);
    expect(small.irregularity01).toBeGreaterThan(large.irregularity01);
    const a=render(small,1),b=render(large,1);
    try {
      expect(rangeOfNormalizedRadii(a.g,1)).toBeGreaterThan(rangeOfNormalizedRadii(b.g,1));
      expect(a.material.flatShading).toBe(false);
      expect(b.material.vertexColors).toBe(true);
    } finally {a.r.resources.forEach(x=>x.dispose());b.r.resources.forEach(x=>x.dispose());}
  });

  it('gives size precedence over seed variation without flattening physical diversity',()=>{
    const diameters = [0.2806, 5, 55.837, 180];
    const values = diameters.map(diameter =>
      build(diameter, 0.55967, 0.25347, 'SIZE-CONTROL', 1.8165, 0.34).irregularity01);
    for (let i = 1; i < values.length; i++) {
      expect(values[i - 1]).toBeGreaterThan(values[i]);
    }
    expect(build(55.837, 0.55967, 0.25347, 'SEED-A').variantUint32)
      .not.toBe(build(55.837, 0.55967, 0.25347, 'SEED-B').variantUint32);
    expect(build(55.837, 0.55967, 0.25347, 'SEED-A'))
      .toEqual(build(55.837, 0.55967, 0.25347, 'SEED-A'));
  });

  it('derives material from volatile fraction and albedo, not from extrasolar provenance',()=>{
    const darkRock=build(0.2806,0.195781,0.101, 'XCAP-001-TEST', 2.632, 0.22);
    const brighterSameMix=build(0.2806,0.195781,0.301, 'XCAP-001-TEST', 2.632, 0.22);
    const volatileRich=build(55.837,0.55967,0.25347);
    expect(new THREE.Color(brighterSameMix.colorHex).getHSL({h:0,s:0,l:0}).l).toBeGreaterThan(
      new THREE.Color(darkRock.colorHex).getHSL({h:0,s:0,l:0}).l);
    expect(volatileRich.colorHex).not.toBe(darkRock.colorHex);
    expect(darkRock.colorHex.startsWith('#')).toBe(true);
  });

  it('is deterministic by source identity, including terrain and materials',()=>{
    const p=build(55.837,0.55967,0.25347);
    expect(build(55.837,0.55967,0.25347)).toEqual(p);
    expect(build(55.837,0.55967,0.25347,'DIFFERENT-CAPTURED')).not.toEqual(p);
    const a=render(p,1),b=render(p,1);
    try {
      expect(Array.from((a.g.getAttribute('position') as THREE.BufferAttribute).array))
        .toEqual(Array.from((b.g.getAttribute('position') as THREE.BufferAttribute).array));
      expect(Array.from((a.g.getAttribute('color') as THREE.BufferAttribute).array))
        .toEqual(Array.from((b.g.getAttribute('color') as THREE.BufferAttribute).array));
    } finally {a.r.resources.forEach(x=>x.dispose());b.r.resources.forEach(x=>x.dispose());}
  });

  it('uses adaptive mesh density and releases all WebGL resources',()=>{
    const p=build(55.837,0.55967,0.25347);
    const near=render(p,1),far=render(p,0.025);
    try {
      expect(near.g.getAttribute('position').count).toBeGreaterThan(far.g.getAttribute('position').count);
      expect(far.g.getAttribute('position').count).toBeLessThan(1300);
      expect(near.r.resources).toHaveLength(2);
    } finally {near.r.resources.forEach(x=>x.dispose());far.r.resources.forEach(x=>x.dispose());}
  });

  it('uses exactly the same surface projection in a compact captured fiche, even when scene data is missing',()=>{
    const projected=build(
      body.diameterKilometers, body.iceFraction01, body.geometricAlbedo01,
      body.proceduralId, body.bulkDensityGramsCm3,
    );
    for (const sceneModel of [scene(projected),scene(null)]) {
      const result=compactMinorFiche(model,body,sceneModel);
      expect(result.kind).toBe(MinorBodyScientificFicheResolutionKind.AVAILABLE);
      if(result.kind!==MinorBodyScientificFicheResolutionKind.AVAILABLE) continue;
      expect(result.card.preview.kind).toBe(ScientificBodyPreviewKind.CAPTURED_EXTRASOLAR_OBJECT);
      if(result.card.preview.kind!==ScientificBodyPreviewKind.CAPTURED_EXTRASOLAR_OBJECT) continue;
      expect(result.card.preview.primary.presentation).toEqual(projected);
      expect(result.card.preview.primary.presentation?.sourceDiameterKilometers).toBe(55.837);
    }
  });
});
