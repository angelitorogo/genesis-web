import * as THREE from 'three';
import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { type CompactHostMinorBody } from '../../domain/planetary/compact-host-secondary-population';
import { type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { ScientificBodyPreviewKind } from '../scientific/scientific-body-preview';
import { MinorBodyScientificFicheResolutionKind } from '../minor-body-detail/minor-body-scientific-card';
import { compactMinorFiche } from './system-compact-host-secondary-fiches';
import { type SystemSceneSnapshot } from './system-scene-snapshot';
import { buildSystemSceneTnoPresentationV1 } from './system-scene-tno-presentation';
import { createSystemSceneTnoRenderableV1 } from './system-scene-tno-renderable';

const id = 'B80C4FCBE3E46B2FD7B56993EF35256E';
const build = (
  diameterKilometers: number,
  iceFraction01: number,
  geometricAlbedo01: number,
  proceduralId=id,
  bulkDensityGramsPerCubicCentimeter=1.55,
) => buildSystemSceneTnoPresentationV1({
  proceduralId, diameterKilometers, iceFraction01, rockFraction01:1-iceFraction01,
  geometricAlbedo01, bulkDensityGramsPerCubicCentimeter,
});

const model = {stellarSystemCard:{title:'Sistema compacto sintético'},galaxyIndex:0n,
  sectorKey:8n,galacticObjectIndex:1n} as unknown as ArchiveDiscoveryDetailModel;
const body={kind:MinorBodyKind.TRANS_NEPTUNIAN_OBJECT,proceduralId:id,ordinal:1,
  diameterKilometers:2.2586,iceFraction01:0.52424,geometricAlbedo01:0.068527,
  bulkDensityGramsCm3:1.8661,semiMajorAxisAu:15.455,eccentricity:0.07977,
  periapsisAu:14.222,apoapsisAu:16.688,orbitalPeriodDays:18118,
  inclinationDegrees:14.122} as unknown as CompactHostMinorBody;
const scene=(presentation: ReturnType<typeof build> | null): SystemSceneSnapshot => ({
  generatorVersionCode:2, stars:[], minorBodies:[{id:`minor-${MinorBodyKind.TRANS_NEPTUNIAN_OBJECT.code}-${id}`,
    minorBodyKind:MinorBodyKind.TRANS_NEPTUNIAN_OBJECT, tnoPresentation:presentation}],
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
  const r=createSystemSceneTnoRenderableV1(radius,p);
  const g=r.surface.geometry as THREE.BufferGeometry;
  const material=r.surface.material as THREE.MeshStandardMaterial;
  return {r,g,material};
}

describe('TNO-R1 — global physically constrained procedural renderer',()=>{
  it('keeps large dwarf-planet-scale TNOs more spheroidal than kilometer bodies',()=>{
    const small=build(2.2586,0.52424,0.068527);
    const large=build(2197.875,0.6981,0.237);
    expect(small.irregularity01).toBeGreaterThan(large.irregularity01*2);
    const a=render(small,1),b=render(large,1);
    try {
      expect(rangeOfNormalizedRadii(a.g,1)).toBeGreaterThan(rangeOfNormalizedRadii(b.g,1));
      expect(a.material.flatShading).toBe(false);
      expect(b.material.vertexColors).toBe(true);
      expect((b.g.getAttribute('position') as THREE.BufferAttribute).count).toBeGreaterThan(6000);
    } finally {a.r.resources.forEach(x=>x.dispose());b.r.resources.forEach(x=>x.dispose());}
  });

  it('derives the material from modeled albedo and ice, not the dynamical orbit family',()=>{
    const dark=build(2198,0.63,0.068);
    const bright=build(2198,0.63,0.534);
    const carbonish=build(2198,0.12,0.237);
    expect(new THREE.Color(bright.colorHex).getHSL({h:0,s:0,l:0}).l).toBeGreaterThan(
      new THREE.Color(dark.colorHex).getHSL({h:0,s:0,l:0}).l);
    expect(bright.colorHex).not.toBe(carbonish.colorHex);
  });

  it('is deterministic by source identity, including terrain and materials',()=>{
    const p=build(2185.514,0.6692,0.174);
    expect(build(2185.514,0.6692,0.174)).toEqual(p);
    expect(build(2185.514,0.6692,0.174,'DIFFERENT-TNO')).not.toEqual(p);
    const a=render(p,1),b=render(p,1);
    try {
      expect(Array.from((a.g.getAttribute('position') as THREE.BufferAttribute).array))
        .toEqual(Array.from((b.g.getAttribute('position') as THREE.BufferAttribute).array));
      expect(Array.from((a.g.getAttribute('color') as THREE.BufferAttribute).array))
        .toEqual(Array.from((b.g.getAttribute('color') as THREE.BufferAttribute).array));
      expect(new Set(Array.from((a.g.getAttribute('color') as THREE.BufferAttribute).array)
        .map(n=>Number(n).toFixed(4))).size).toBeGreaterThan(20);
    } finally {a.r.resources.forEach(x=>x.dispose());b.r.resources.forEach(x=>x.dispose());}
  });

  it('uses adaptive mesh density and releases all WebGL resources',()=>{
    const p=build(2.2586,0.52,0.07);
    const near=render(p,1),far=render(p,0.025);
    try {
      expect(near.g.getAttribute('position').count).toBeGreaterThan(far.g.getAttribute('position').count);
      expect(far.g.getAttribute('position').count).toBeLessThan(1500);
      expect(near.r.resources).toHaveLength(2);
    } finally {near.r.resources.forEach(x=>x.dispose());far.r.resources.forEach(x=>x.dispose());}
  });

  it('uses exactly the same surface projection in a compact snapshot fiche, even when scene data is missing',()=>{
    // The compact-host body has density 1.8661 g/cm3, not the synthetic 1.55
    // used by other shape tests. Density is an input to TNO-R1 irregularity.
    const projected=build(
      body.diameterKilometers, body.iceFraction01, body.geometricAlbedo01,
      body.proceduralId, body.bulkDensityGramsCm3,
    );
    expect(projected.irregularity01).not.toBe(
      build(body.diameterKilometers, body.iceFraction01,
        body.geometricAlbedo01, body.proceduralId).irregularity01,
    );
    for (const sceneModel of [scene(projected),scene(null)]) {
      const result=compactMinorFiche(model,body,sceneModel);
      expect(result.kind).toBe(MinorBodyScientificFicheResolutionKind.AVAILABLE);
      if(result.kind!==MinorBodyScientificFicheResolutionKind.AVAILABLE) continue;
      expect(result.card.preview.kind).toBe(ScientificBodyPreviewKind.TRANS_NEPTUNIAN_OBJECT);
      if(result.card.preview.kind!==ScientificBodyPreviewKind.TRANS_NEPTUNIAN_OBJECT) continue;
      expect(result.card.preview.primary.presentation).toEqual(projected);
      expect(result.card.preview.primary.presentation?.sourceDiameterKilometers).toBe(2.2586);
    }
  });
});
