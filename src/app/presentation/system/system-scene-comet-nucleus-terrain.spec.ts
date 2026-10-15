import {
  buildCometNucleusTerrainV1,
  cometNucleusMaterialNoiseV1,
  sampleCometNucleusTerrainV1,
} from './system-scene-comet-nucleus-terrain';

describe('COM-R1 — Comet nucleus procedural terrain', () => {
  it('keeps the same seeded terrain, with finite bounded pits and ridges', () => {
    const terrain = buildCometNucleusTerrainV1(0xace0beef, 0.58);
    const other = buildCometNucleusTerrainV1(0xace0beef, 0.58);
    expect(terrain).toEqual(other);
    expect(terrain.basins.length).toBe(5);
    expect(terrain.pits.length).toBe(27);
    for (let i = 0; i < 270; i++) {
      const azimuth = i * Math.PI * 2 / 270;
      const z = (i / 269) * 2 - 1;
      const xy = Math.sqrt(1 - z * z);
      const sample = sampleCometNucleusTerrainV1(xy * Math.cos(azimuth), xy * Math.sin(azimuth), z, terrain);
      expect(Number.isFinite(sample.radialOffset)).toBe(true);
      expect(sample.radialOffset).toBeGreaterThanOrEqual(-0.16);
      expect(sample.radialOffset).toBeLessThanOrEqual(0.06);
      expect(sample.hollow01).toBeGreaterThanOrEqual(0);
      expect(sample.rim01).toBeLessThanOrEqual(1);
    }
  });

  it('uses a different layout for another seed, without any random draws', () => {
    const a = buildCometNucleusTerrainV1(1, 0.58);
    const b = buildCometNucleusTerrainV1(2, 0.58);
    expect(a.basins[0]?.direction).not.toEqual(b.basins[0]?.direction);
    expect(cometNucleusMaterialNoiseV1(1, 0.3, 0.2, 17, 15)).toBe(
      cometNucleusMaterialNoiseV1(1, 0.3, 0.2, 17, 15),
    );
  });

  it('does not derive visually exposed ice from ice mass fraction', () => {
    // Terrain depends solely on the render variant and saved irregularity.
    const terrain = buildCometNucleusTerrainV1(55, 0.62);
    expect('iceFraction01' in terrain).toBe(false);
    expect('activityRegime' in terrain).toBe(false);
  });
});
