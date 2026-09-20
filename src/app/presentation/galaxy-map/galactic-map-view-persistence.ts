import { type GalacticMapCameraState } from './galactic-map-camera-controller';
import { type GalacticMapLayerVisibility } from './galactic-map-layer-state';
import { type GalacticMapModel } from './galactic-map-model';
import { scientificRouteUniverseRef } from '../scientific/scientific-route-identity';

/** Renderer preferences only: never persist a seed, scientific content or Ground Truth. */
export const GALACTIC_MAP_VIEW_STORAGE_PREFIX = 'genesis.galactic-map.view.v1.';

export interface GalacticMapViewSnapshot {
  readonly version: 1;
  readonly camera: GalacticMapCameraState;
  readonly galaxySpinRadians: number;
  readonly layers: GalacticMapLayerVisibility;
}

export function galacticMapViewStorageKey(model: GalacticMapModel): string {
  return GALACTIC_MAP_VIEW_STORAGE_PREFIX +
    scientificRouteUniverseRef(
      model.generationKey.universeSeed.serialize(),
      model.generationKey.generatorVersionCode,
    ) + '.' + model.galaxyIndex.toString();
}

const LAYER_NAMES: readonly (keyof GalacticMapLayerVisibility)[] = [
  'systems', 'nebulae', 'starClusters', 'extremeObjects', 'regions', 'habitableZone',
];

/** Reject corrupted/outdated storage; do not apply unbounded camera coordinates. */
export function parseGalacticMapViewSnapshot(raw: string | null): GalacticMapViewSnapshot | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value['version'] !== 1 ||
        !isRecord(value['camera']) || !isRecord(value['layers'])) return null;
    const camera = value['camera'];
    const layers = value['layers'];
    const number = (name: string): number | null =>
      typeof camera[name] === 'number' && Number.isFinite(camera[name])
        ? camera[name] as number : null;
    const distance = number('distance');
    const azimuth = number('azimuthRadians');
    const polar = number('polarRadians');
    const targetX = number('targetX');
    const targetY = number('targetY');
    const targetZ = number('targetZ');
    const spin = value['galaxySpinRadians'];
    if (distance === null || distance < 0.25 || distance > 7.2 ||
        azimuth === null || Math.abs(azimuth) > Math.PI * 2 ||
        polar === null || polar < 0.16 || polar > Math.PI - 0.16 ||
        targetX === null || targetY === null || targetZ === null ||
        Math.hypot(targetX, targetY, targetZ) > 1.35 + 1e-6 ||
        typeof spin !== 'number' || !Number.isFinite(spin) || Math.abs(spin) > Math.PI * 2 ||
        typeof camera['rotationEnabled'] !== 'boolean' ||
        !LAYER_NAMES.every(name => typeof layers[name] === 'boolean')) return null;

    return Object.freeze({
      version: 1,
      camera: Object.freeze({
        distance, azimuthRadians: azimuth, polarRadians: polar,
        targetX, targetY, targetZ,
        rotationEnabled: camera['rotationEnabled'] as boolean,
      }),
      galaxySpinRadians: spin,
      layers: Object.freeze({
        systems: layers['systems'] as boolean,
        nebulae: layers['nebulae'] as boolean,
        starClusters: layers['starClusters'] as boolean,
        extremeObjects: layers['extremeObjects'] as boolean,
        regions: layers['regions'] as boolean,
        habitableZone: layers['habitableZone'] as boolean,
      }),
    });
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Storage may be unavailable (private mode, permissions, SSR). Rendering must still work. */
export function readGalacticMapView(key: string): GalacticMapViewSnapshot | null {
  try {
    return parseGalacticMapViewSnapshot(globalThis.localStorage?.getItem(key) ?? null);
  } catch {
    return null;
  }
}

export function saveGalacticMapView(key: string, snapshot: GalacticMapViewSnapshot): void {
  try {
    const azimuth = snapshot.camera.azimuthRadians;
    const normalized = {
      ...snapshot,
      camera: {
        ...snapshot.camera,
        azimuthRadians: Math.atan2(Math.sin(azimuth), Math.cos(azimuth)),
      },
    };
    globalThis.localStorage?.setItem(key, JSON.stringify(normalized));
  } catch {
    // Local preferences are best-effort. Never interrupt navigation or mutate saves.
  }
}
