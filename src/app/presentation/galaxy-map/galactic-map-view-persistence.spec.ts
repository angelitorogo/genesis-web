import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { INITIAL_GALACTIC_MAP_LAYER_VISIBILITY } from './galactic-map-layer-state';
import { type GalacticMapModel } from './galactic-map-model';
import {
  galacticMapViewStorageKey,
  parseGalacticMapViewSnapshot,
  readGalacticMapView,
  saveGalacticMapView,
  type GalacticMapViewSnapshot,
} from './galactic-map-view-persistence';

describe('Galactic map view persistence (renderer-only)', () => {
  const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
  const model = (version: typeof GeneratorVersion.V1 | typeof GeneratorVersion.V2, index: bigint) =>
    ({ generationKey: new UniverseGenerationKey(seed, version), galaxyIndex: index }) as GalacticMapModel;
  const first = galacticMapViewStorageKey(model(GeneratorVersion.V2, 0n));
  const otherGalaxy = galacticMapViewStorageKey(model(GeneratorVersion.V2, 1n));
  const older = galacticMapViewStorageKey(model(GeneratorVersion.V1, 0n));
  const snapshot: GalacticMapViewSnapshot = {
    version: 1,
    camera: {
      distance: 0.9, azimuthRadians: 0.7, polarRadians: 1.1,
      targetX: 0.25, targetY: -0.2, targetZ: 0.1, rotationEnabled: false,
    },
    galaxySpinRadians: 0.45,
    layers: { ...INITIAL_GALACTIC_MAP_LAYER_VISIBILITY, nebulae: false },
  };

  beforeEach(() => [first, otherGalaxy, older].forEach(key => localStorage.removeItem(key)));
  afterEach(() => [first, otherGalaxy, older].forEach(key => localStorage.removeItem(key)));

  it('uses distinct keys per galaxy and per V1/V2 without storing the raw seed', () => {
    expect(new Set([first, otherGalaxy, older]).size).toBe(3);
    expect(first).not.toContain(seed.serialize());
  });

  it('saves and restores zoom, tilt, orbit target, galaxy spin, rotation toggle and layers', () => {
    saveGalacticMapView(first, snapshot);
    expect(readGalacticMapView(first)).toEqual(snapshot);
    expect(readGalacticMapView(otherGalaxy)).toBeNull();
    expect(readGalacticMapView(older)).toBeNull();
  });

  it('rejects corruption, out-of-range state and invalid layer values', () => {
    expect(parseGalacticMapViewSnapshot('{oops')).toBeNull();
    expect(parseGalacticMapViewSnapshot(JSON.stringify({ ...snapshot, version: 3 }))).toBeNull();
    expect(parseGalacticMapViewSnapshot(JSON.stringify({ ...snapshot, camera: { ...snapshot.camera, distance: -4 } }))).toBeNull();
    expect(parseGalacticMapViewSnapshot(JSON.stringify({ ...snapshot, camera: { ...snapshot.camera, targetX: 999 } }))).toBeNull();
    expect(parseGalacticMapViewSnapshot(JSON.stringify({ ...snapshot, galaxySpinRadians: Number.POSITIVE_INFINITY }))).toBeNull();
    expect(parseGalacticMapViewSnapshot(JSON.stringify({ ...snapshot, layers: { ...snapshot.layers, nebulae: 'yes' } }))).toBeNull();
    localStorage.setItem(first, '{broken');
    expect(readGalacticMapView(first)).toBeNull();
  });

  it('normalizes repeated full camera turns before writing the stored viewpoint', () => {
    saveGalacticMapView(first, {
      ...snapshot,
      camera: { ...snapshot.camera, azimuthRadians: snapshot.camera.azimuthRadians + 4 * Math.PI },
    });
    expect(readGalacticMapView(first)?.camera.azimuthRadians).toBeCloseTo(0.7);
  });
});
