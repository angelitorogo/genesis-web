import {
  SystemSceneSphereGeometryPoolV1,
} from './system-scene-geometry-pool';

describe('SystemScene shared LOD geometry pool point 25.11', () => {
  it('should reuse one geometry for the same body family and LOD', () => {
    const pool = new SystemSceneSphereGeometryPoolV1();
    const first = pool.get('planet', 'MEDIUM');
    const second = pool.get('planet', 'MEDIUM');
    const high = pool.get('planet', 'HIGH');

    expect(first).toBe(second);
    expect(high).not.toBe(first);
    expect(pool.size()).toBe(2);
    pool.dispose();
  });
});
