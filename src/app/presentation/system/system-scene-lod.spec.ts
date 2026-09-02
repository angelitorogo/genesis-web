import {
  systemSceneBodyLodLevelV1,
  systemSceneBodyLodSegmentsV1,
  systemSceneProjectedDiameterPixelsV1,
} from './system-scene-lod';

describe('SystemScene projected-size LOD point 25.11', () => {
  it('should promote bodies as their projected screen diameter grows', () => {
    expect(systemSceneBodyLodLevelV1(8)).toBe('LOW');
    expect(systemSceneBodyLodLevelV1(40)).toBe('MEDIUM');
    expect(systemSceneBodyLodLevelV1(120)).toBe('HIGH');
  });

  it('should keep hysteresis around LOD thresholds', () => {
    expect(systemSceneBodyLodLevelV1(22, 'LOW')).toBe('LOW');
    expect(systemSceneBodyLodLevelV1(25, 'LOW')).toBe('MEDIUM');
    expect(systemSceneBodyLodLevelV1(70, 'HIGH')).toBe('HIGH');
    expect(systemSceneBodyLodLevelV1(60, 'HIGH')).toBe('MEDIUM');
  });

  it('should project apparent size and expose progressively denser sphere tessellation', () => {
    const near = systemSceneProjectedDiameterPixelsV1(0.05, 1, 44, 900);
    const far = systemSceneProjectedDiameterPixelsV1(0.05, 8, 44, 900);
    expect(near).toBeGreaterThan(far);
    expect(systemSceneBodyLodSegmentsV1('planet', 'HIGH').widthSegments)
      .toBeGreaterThan(systemSceneBodyLodSegmentsV1('planet', 'LOW').widthSegments);
  });
});
