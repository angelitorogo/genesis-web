import {
  binaryPhysicalSeparationTargetSceneV226,
} from './system-scene-multihost-star-cadence';
import {
  multihostStellarPostProjectionScaleV222,
} from './system-scene-multihost-hierarchical-layout';
import { SystemSceneProjectionSpace } from './system-scene-scale-projection';

describe('V2.2 binary-only stellar spacing refinement', () => {
  it('reserves room for two complete SINGLE/V3 disks in compact binary systems', () => {
    const compact = binaryPhysicalSeparationTargetSceneV226(3, 0.25);
    expect(compact).toBeCloseTo(10.7, 12);
    expect(compact).toBeGreaterThan(2 * 4.8 + 0.65);
  });

  it('preserves an appreciable physical-distance contrast between 3 and 93 AU', () => {
    const compact = binaryPhysicalSeparationTargetSceneV226(3, 0.25);
    const wide = binaryPhysicalSeparationTargetSceneV226(93, 0.25);
    expect(wide).toBeGreaterThan(compact * 2);
    expect(wide).toBeLessThanOrEqual(25.1);
  });

  it('reserves the larger optical envelope when a luminous star needs it', () => {
    const opticalRadius = 0.8;
    const required = Math.max(2 * 4.8 + 0.65, 2 * (opticalRadius + 4.8 + 0.30));
    const target = binaryPhysicalSeparationTargetSceneV226(3, opticalRadius);
    expect(target).toBeGreaterThanOrEqual(required);
  });

  it('never affects SINGLE or TRIPLE presentation multipliers', () => {
    const inner = {motionId: 'inner', scale: 1};
    expect(multihostStellarPostProjectionScaleV222('SINGLE', inner)).toBe(1);
    expect(multihostStellarPostProjectionScaleV222('BINARY', inner)).toBe(3.1);
    expect(multihostStellarPostProjectionScaleV222('TRIPLE', inner)).toBe(3.2);
    expect(multihostStellarPostProjectionScaleV222('TRIPLE', {
      ...inner, projectionSpace: SystemSceneProjectionSpace.TRIPLE_OUTER,
    })).toBe(4.4);
  });
});
