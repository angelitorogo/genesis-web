import {
  ArchiveGalacticObjectKnowledgeLevel as Level,
  ArchiveGalacticObjectRenderKind as Kind,
  ArchiveGalacticObjectRenderProfile as Profile,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';
import { buildConfirmedClusterField } from './confirmed-cluster-field';

const descriptor = (
  kind: 'OPEN' | 'GLOBULAR',
  seed = 'CLUSTER-26-7-3D-V2',
): ArchiveGalacticObjectRenderDescriptor => Object.freeze({
  kind: kind === 'OPEN' ? Kind.OPEN_CLUSTER : Kind.GLOBULAR_CLUSTER,
  renderProfile: kind === 'OPEN' ? Profile.OPEN_CLUSTER_FIELD : Profile.GLOBULAR_CLUSTER_FIELD,
  knowledgeLevel: Level.CONFIRMED,
  seed,
  accessibleLabel: 'Cúmulo confirmado',
  variant: null,
  scale: 0.5,
  density: 0.8,
  energy: 0.4,
  concentration: 0.8,
});

describe('26.7 — confirmed cluster three-dimensional presentation V2', () => {
  for (const kind of ['OPEN', 'GLOBULAR'] as const) {
    it(`${kind}: creates one bounded, repeatable 3D visual sample with preserved 2D projection and thermal diversity`, () => {
      const first = buildConfirmedClusterField(descriptor(kind), kind);
      const second = buildConfirmedClusterField(descriptor(kind), kind);
      expect(first.sampleCount).toBe(kind === 'OPEN' ? 1750 : 3900);
      expect(first.positions.length).toBe(first.sampleCount * 3);
      expect(first.projectedPositions.length).toBe(first.sampleCount * 2);
      expect(first.colors.length).toBe(first.sampleCount * 3);
      expect(first.sizes.length).toBe(first.sampleCount);
      expect(Array.from(first.positions)).toEqual(Array.from(second.positions));
      expect(Array.from(first.projectedPositions)).toEqual(Array.from(second.projectedPositions));
      expect(Array.from(first.colors)).toEqual(Array.from(second.colors));
      expect(Array.from(first.sizes)).toEqual(Array.from(second.sizes));
      expect([...first.positions].every(Number.isFinite)).toBe(true);
      expect(Math.min(...first.positions.filter((_, index) => index % 3 === 2))).toBeLessThan(-0.05);
      expect(Math.max(...first.positions.filter((_, index) => index % 3 === 2))).toBeGreaterThan(0.05);
      expect(new Set(
        Array.from(first.colors)
          .filter((_, index) => index % 3 === 0)
          .map((x) => x.toFixed(2)),
      ).size).toBeGreaterThan(5);
      expect(first.xExtent).toBeGreaterThan(0.5);
      expect(first.yExtent).toBeGreaterThan(0.3);
    });

    it(`${kind}: keeps the frontal 3D projection equal to its stored 2D sample coordinates`, () => {
      const field = buildConfirmedClusterField(descriptor(kind), kind);
      for (let index = 0; index < field.sampleCount; index += 1) {
        expect(field.positions[index * 3]).toBeCloseTo(field.projectedPositions[index * 2], 6);
        expect(field.positions[index * 3 + 1]).toBeCloseTo(field.projectedPositions[index * 2 + 1], 6);
      }
    });

    it(`${kind}: keeps its structural signature independent of observed aggregate brightness`, () => {
      const original = descriptor(kind);
      const moreBrightness = Object.freeze({ ...original, density: 0.3, energy: 0.9, scale: 0.9 });
      const first = buildConfirmedClusterField(original, kind);
      const second = buildConfirmedClusterField(moreBrightness, kind);
      expect(Array.from(first.positions)).toEqual(Array.from(second.positions));
      expect(Array.from(first.projectedPositions)).toEqual(Array.from(second.projectedPositions));
      expect(Array.from(first.colors)).toEqual(Array.from(second.colors));
    });

    it(`${kind}: changes visible distribution when its seed changes`, () => {
      const first = buildConfirmedClusterField(descriptor(kind), kind);
      const second = buildConfirmedClusterField(descriptor(kind, 'ANOTHER-CLUSTER-V2'), kind);
      expect(Array.from(first.positions.slice(0, 24))).not.toEqual(Array.from(second.positions.slice(0, 24)));
    });

    it(`${kind}: refuses to create interactive geometry before confirmation`, () => {
      for (const level of [Level.SIGNAL, Level.IDENTIFIED, Level.CATALOGUED]) {
        expect(() => buildConfirmedClusterField({ ...descriptor(kind), knowledgeLevel: level }, kind))
          .toThrow(/CONFIRMED/);
      }
    });

    it(`${kind}: opens at the V2.3.1 maximum zoom while retaining the saved field geometry`, () => {
      const field = buildConfirmedClusterField(descriptor(kind), kind);
      expect(field.initialZoom).toBe(6.0);
      expect(field.sampleCount).toBe(kind === 'OPEN' ? 1750 : 3900);
    });
  }

  it('keeps globulars volumetric and open clusters genuinely deep without comparing incompatible absolute scales', () => {
    const globular = buildConfirmedClusterField(descriptor('GLOBULAR', 'DEPTH-COMPARISON'), 'GLOBULAR');
    const open = buildConfirmedClusterField(descriptor('OPEN', 'DEPTH-COMPARISON'), 'OPEN');
    const globularAxisMeans = [0, 1, 2].map(axis =>
      averageAbsoluteAxis(globular.positions, axis as 0 | 1 | 2));
    const openAverageAbsZ = averageAbsoluteAxis(open.positions, 2);

    // A globular must have substantial depth relative to BOTH frontal axes.
    expect(Math.min(...globularAxisMeans) / Math.max(...globularAxisMeans)).toBeGreaterThan(0.65);
    // V2.3 intentionally increased open-cluster depth: it should not be a flat plane.
    expect(openAverageAbsZ).toBeGreaterThan(open.xExtent * 0.16);
    // Depth remains bounded by the size of the complete illustrated volume.
    expect(openAverageAbsZ).toBeLessThan(Math.max(open.xExtent, open.yExtent, open.zExtent) * 0.50);
  });
});

function averageAbsoluteAxis(values: Float32Array, axis: 0 | 1 | 2): number {
  let total = 0;
  const count = Math.floor(values.length / 3);
  for (let index = 0; index < count; index += 1) {
    total += Math.abs(values[index * 3 + axis] ?? 0);
  }
  return total / Math.max(1, count);
}
