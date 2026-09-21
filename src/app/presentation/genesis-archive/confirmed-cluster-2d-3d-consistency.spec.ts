import {
  ArchiveGalacticObjectKnowledgeLevel as Level,
  ArchiveGalacticObjectRenderKind as Kind,
  ArchiveGalacticObjectRenderProfile as Profile,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';
import { buildConfirmedClusterField } from './confirmed-cluster-field';

const descriptor = (
  kind: 'OPEN' | 'GLOBULAR',
  seed: string,
): ArchiveGalacticObjectRenderDescriptor => Object.freeze({
  kind: kind === 'OPEN' ? Kind.OPEN_CLUSTER : Kind.GLOBULAR_CLUSTER,
  renderProfile: kind === 'OPEN' ? Profile.OPEN_CLUSTER_FIELD : Profile.GLOBULAR_CLUSTER_FIELD,
  knowledgeLevel: Level.CONFIRMED,
  seed,
  accessibleLabel: 'Representación científica de cúmulo',
  variant: null,
  scale: 0.64,
  density: 0.71,
  energy: 0.56,
  concentration: 0.74,
});

describe('26.7 — confirmed cluster 2D ↔ 3D consistency V2.3', () => {
  it('globular clusters keep a compact volumetric body instead of collapsing into a sheet or line', () => {
    const field = buildConfirmedClusterField(descriptor('GLOBULAR', 'GLOBULAR-VOLUMETRIC'), 'GLOBULAR');
    const avgX = averageAbsoluteAxis(field.positions, 0);
    const avgY = averageAbsoluteAxis(field.positions, 1);
    const avgZ = averageAbsoluteAxis(field.positions, 2);
    const maxAvg = Math.max(avgX, avgY, avgZ);
    const minAvg = Math.min(avgX, avgY, avgZ);
    expect(minAvg / maxAvg).toBeGreaterThan(0.46);
    expect(field.zExtent).toBeGreaterThan(field.yExtent * 0.48);
  });

  it('open clusters preserve clear 3D depth and a different shape from nearly isotropic globulars', () => {
    const open = buildConfirmedClusterField(descriptor('OPEN', 'OPEN-PROFILE'), 'OPEN');
    const globular = buildConfirmedClusterField(descriptor('GLOBULAR', 'OPEN-PROFILE'), 'GLOBULAR');
    const openAxes = [0, 1, 2].map(axis => averageAbsoluteAxis(open.positions, axis as 0 | 1 | 2));
    const globularAxes = [0, 1, 2].map(axis => averageAbsoluteAxis(globular.positions, axis as 0 | 1 | 2));
    const openAnisotropy = Math.max(...openAxes) / Math.min(...openAxes);
    const globularAnisotropy = Math.max(...globularAxes) / Math.min(...globularAxes);

    // This tests volume relative to the open cluster's own dimensions.
    expect(openAxes[2]).toBeGreaterThan(open.xExtent * 0.16);
    expect(open.zExtent).toBeGreaterThan(open.yExtent * 0.40);
    // No absolute ordering of Z is valid: the two object types have different scales.
    expect(globularAnisotropy).toBeLessThan(1.55);
    expect(openAnisotropy).toBeGreaterThan(globularAnisotropy * 1.15);
  });

  it('open clusters preserve an irregular sparse frontal signature instead of a dense compact blob', () => {
    const open = buildConfirmedClusterField(descriptor('OPEN', 'OPEN-SIGNATURE'), 'OPEN');
    const xs = axisValues(open.projectedPositions, 0, 2);
    const ys = axisValues(open.projectedPositions, 1, 2);
    const globular = buildConfirmedClusterField(descriptor('GLOBULAR', 'OPEN-SIGNATURE'), 'GLOBULAR');
    const occupiedBins = countOccupiedBins(open.projectedPositions, 12, 7);
    const globularOccupiedBins = countOccupiedBins(globular.projectedPositions, 12, 7);
    // Compare like with like. A fixed 52-bin cutoff stopped matching the V2.3 sample.
    expect(occupiedBins).toBeGreaterThan(24); // no artificial collapse into a line
    expect(occupiedBins).toBeLessThan(globularOccupiedBins - 8);
    expect(spread(xs)).toBeGreaterThan(spread(ys) * 1.05);
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

function axisValues(values: Float32Array, axis: 0 | 1, stride: 2): number[] {
  const output: number[] = [];
  for (let index = axis; index < values.length; index += stride) {
    output.push(values[index] ?? 0);
  }
  return output;
}

function spread(values: number[]): number {
  return Math.max(...values) - Math.min(...values);
}

function countOccupiedBins(values: Float32Array, xBins: number, yBins: number): number {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let index = 0; index < values.length; index += 2) {
    const x = values[index] ?? 0;
    const y = values[index + 1] ?? 0;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const occupied = new Set<string>();
  const width = Math.max(1e-6, maxX - minX);
  const height = Math.max(1e-6, maxY - minY);
  for (let index = 0; index < values.length; index += 2) {
    const x = values[index] ?? 0;
    const y = values[index + 1] ?? 0;
    const bx = Math.max(0, Math.min(xBins - 1, Math.floor(((x - minX) / width) * xBins)));
    const by = Math.max(0, Math.min(yBins - 1, Math.floor(((y - minY) / height) * yBins)));
    occupied.add(`${bx}:${by}`);
  }
  return occupied.size;
}
