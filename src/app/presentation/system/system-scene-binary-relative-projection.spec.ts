import { describe, expect, it } from 'vitest';
import { binaryPhysicalSeparationTargetSceneV226 } from './system-scene-multihost-star-cadence';

describe('V2.2.6 binary scientific-distance-aware visual presentation', () => {
  it('reserves two 4.8-unit SINGLE disks and distinguishes 93 AU from 3 AU', () => {
    const compact = binaryPhysicalSeparationTargetSceneV226(3, 0.25);
    const wide = binaryPhysicalSeparationTargetSceneV226(93, 0.25);
    expect(compact).toBeCloseTo(10.7, 10);
    expect(wide).toBeGreaterThan(compact * 2);
    expect(wide).toBeLessThan(25.11);
  });

  it('is monotonic with physical periastron and bounds extreme expansion', () => {
    const radii = [0.3, 3, 12, 93, 220, 1e10]
      .map(au => binaryPhysicalSeparationTargetSceneV226(au, 0.25));
    expect(radii[0]).toBe(radii[1]);
    expect(radii.slice(2).every((value, index) => value > radii[index + 1]!)).toBe(true);
    expect(radii.at(-1)).toBeCloseTo(25.1, 10);
  });

  it('reserves stellar optical clearance and never creates an AU measurement', () => {
    const largeOptical = binaryPhysicalSeparationTargetSceneV226(3, 1.4);
    expect(largeOptical).toBeGreaterThan(2 * (1.4 + 1.45));
    expect(binaryPhysicalSeparationTargetSceneV226(Number.NaN, 0.25)).toBe(10.7);
  });
});
