import * as THREE from 'three';
import {
  buildSystemSceneAsteroidPresentationV1,
  type SystemSceneAsteroidPresentationInputV1,
} from './system-scene-asteroid-presentation';
import {
  createIrregularAsteroidGeometryV1,
  createSystemSceneAsteroidRenderableV1,
  buildSystemSceneAsteroidLobeLayoutV1,
} from './system-scene-asteroid-geometry';
import {
  asteroidSizeRoundnessV1,
  buildAsteroidTerrainV1,
  sampleAsteroidTerrainV1,
} from './system-scene-asteroid-terrain';

const base: SystemSceneAsteroidPresentationInputV1 = {
  proceduralId: 'AST-IN-001-GENESIS-A-TEST',
  diameterKilometers: 832.167,
  compositionRegime: 'SILICACEOUS',
  structureRegime: 'COHERENT',
  multiplicityRegime: 'SINGLE',
  carbonaceousFraction01: 0.0367,
  silicateFraction01: 0.733,
  metalFraction01: 0.1876,
  iceFraction01: 0.0427,
  porosityIndex01: 0.051,
  bulkDensityGramsPerCubicCentimeter: 2.999,
  geometricAlbedo01: 0.242,
  binaryMassRatio01: null,
  binarySeparationPrimaryRadii: null,
};

function positionsAndColors(geometry: THREE.BufferGeometry) {
  const p = geometry.getAttribute('position') as THREE.BufferAttribute;
  const c = geometry.getAttribute('color') as THREE.BufferAttribute;
  return { p, c };
}

describe('A.1–A.6 — Scientific procedural asteroid appearance', () => {
  it('rounds large asteroid silhouettes more than small rubble without erasing craters', () => {
    expect(asteroidSizeRoundnessV1(830)).toBe(1);
    expect(asteroidSizeRoundnessV1(3)).toBe(0);
    expect(asteroidSizeRoundnessV1(70)).toBeGreaterThan(0);
    expect(asteroidSizeRoundnessV1(70)).toBeLessThan(1);
    const p = buildSystemSceneAsteroidPresentationV1(base);
    const terrain = buildAsteroidTerrainV1(p, 101);
    expect(terrain.craters.length).toBeGreaterThan(20);
    expect(terrain.fractures.length).toBe(2);
    const atCenter = terrain.craters[0]!.direction;
    const sample = sampleAsteroidTerrainV1(atCenter[0], atCenter[1], atCenter[2], terrain);
    expect(sample.craterFloor01).toBeGreaterThan(0.9);
    expect(Number.isFinite(sample.radialOffset)).toBe(true);
  });

  it('produces stable cratered geometry with real color diversity and finite normals', () => {
    const p = buildSystemSceneAsteroidPresentationV1(base);
    const a = createIrregularAsteroidGeometryV1(1, p, 101);
    const b = createIrregularAsteroidGeometryV1(1, p, 101);
    const left = positionsAndColors(a);
    const right = positionsAndColors(b);
    expect(left.p.count).toBeGreaterThan(3000);
    expect(left.c.count).toBe(left.p.count);
    let minimum = Infinity;
    let maximum = -Infinity;
    for (let i = 0; i < left.p.count; i++) {
      expect(left.p.getX(i)).toBe(right.p.getX(i));
      expect(left.c.getY(i)).toBe(right.c.getY(i));
      expect(Number.isFinite(left.p.getZ(i))).toBe(true);
      minimum = Math.min(minimum, left.c.getX(i));
      maximum = Math.max(maximum, left.c.getX(i));
    }
    expect(maximum - minimum).toBeGreaterThan(0.01);
    expect(a.boundingSphere?.radius).toBeGreaterThan(0);
    a.dispose(); b.dispose();
  });

  it('uses the 22.4 families for different weathered materials, not polished metal or painted ice', () => {
    const signature = ['CARBONACEOUS', 'SILICACEOUS', 'METALLIC', 'MIXED_ROCK_ICE']
      .map(compositionRegime => {
        const p = buildSystemSceneAsteroidPresentationV1({
          ...base,
          compositionRegime: compositionRegime as SystemSceneAsteroidPresentationInputV1['compositionRegime'],
        });
        const g = createIrregularAsteroidGeometryV1(1, p, 101);
        const c = g.getAttribute('color') as THREE.BufferAttribute;
        const value = [c.getX(195), c.getY(195), c.getZ(195)].map(x => x.toFixed(5)).join(':');
        g.dispose();
        return value;
      });
    expect(new Set(signature).size).toBe(4);
  });

  it('distinguishes coherent, fractured and rubble bodies and retains bounded double-lobe layout', () => {
    const fractures = ['COHERENT', 'FRACTURED', 'RUBBLE_PILE'].map(structureRegime =>
      buildAsteroidTerrainV1(buildSystemSceneAsteroidPresentationV1({
        ...base,
        structureRegime: structureRegime as SystemSceneAsteroidPresentationInputV1['structureRegime'],
      }), 101).fractures.length,
    );
    expect(fractures).toEqual([2, 7, 4]);
    const contact = buildSystemSceneAsteroidPresentationV1({ ...base, multiplicityRegime: 'CONTACT_BINARY' });
    const binary = buildSystemSceneAsteroidPresentationV1({ ...base, multiplicityRegime: 'BINARY',
      binaryMassRatio01: 0.4, binarySeparationPrimaryRadii: 5 });
    const contactLayout = buildSystemSceneAsteroidLobeLayoutV1(contact);
    const separated = buildSystemSceneAsteroidLobeLayoutV1(binary);
    expect(contactLayout).toHaveLength(2);
    expect(separated).toHaveLength(2);
    expect(contactLayout[1]!.offsetXScale - contactLayout[0]!.offsetXScale)
      .toBeLessThan(contactLayout[0]!.radiusScale + contactLayout[1]!.radiusScale);
    expect(separated[1]!.offsetXScale - separated[0]!.offsetXScale)
      .toBeGreaterThan(separated[0]!.radiusScale + separated[1]!.radiusScale);
    const renderable = createSystemSceneAsteroidRenderableV1(1, binary);
    expect(renderable.lobeCount).toBe(2);
    expect(renderable.resources).toHaveLength(3);
    for (const item of renderable.resources) item.dispose();
  });

  it('keeps data taxonomy immutable and rejects invalid visualization input', () => {
    const p = buildSystemSceneAsteroidPresentationV1(base);
    const initial = JSON.stringify(p);
    const result = createSystemSceneAsteroidRenderableV1(1, p);
    expect(JSON.stringify(p)).toBe(initial);
    expect(Object.isFrozen(p)).toBe(true);
    for (const item of result.resources) item.dispose();
    expect(() => createSystemSceneAsteroidRenderableV1(0, p)).toThrow(RangeError);
  });
});
