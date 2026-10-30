import { buildSystemScenePlanetTextureV1 } from './system-scene-planet-texture';
import { buildSystemScenePlanetSurfacePresentationV1 } from './system-scene-planet-surface-presentation';
import { buildSystemScenePlanetSurfaceTextureV1, type SystemScenePlanetVegetationProfileV1 } from './system-scene-planet-surface-texture';
import { buildSystemScenePlanetNightLightsV1 } from './system-scene-planet-night-lights-visciv1';
import { civilizationVisualMapOf, decorateSystemSceneSnapshotWithCivilizationTiers } from './system-scene-civilization-visuals';
import type { SystemSceneSnapshot } from './system-scene-snapshot';

const systemIdentity = '618136846955087647|v3|VIS-CIV-TEST';
const planetId = 'planet-3';
const surface = buildSystemScenePlanetSurfacePresentationV1({
  waterInventoryIndex01: 0.60,
  surfaceLiquidWaterCoverageFraction01: 0.14,
  surfaceIceCoverageFraction01: 0.04,
  waterVaporFraction01: 0.10,
  retainedAtmosphericWaterVaporMoleFraction01: 0.024,
  meanSurfaceTemperatureKelvin: 275,
  climateStabilityIndex01: 0.72,
  retainedSurfacePressurePascal: 90_000,
  geologicalActivityIndex01: 0.20,
  volcanismIndex01: 0.12,
  surfaceWaterRegime: 'OCEANS',
  volcanismRegime: 'LOW',
});
const profile: SystemScenePlanetVegetationProfileV1 = Object.freeze({
  coverageFraction01: 0.78,
  lushness01: 0.82,
  floraSpeciesCount: 7,
  paletteHexes: Object.freeze(['#71A65C', '#8C9942', '#83B6A2']),
  paletteEntries: Object.freeze([
    { hex: '#71A65C', weight01: 0.5 },
    { hex: '#8C9942', weight01: 0.25 },
    { hex: '#83B6A2', weight01: 0.25 },
  ]),
});
const baseTexture = buildSystemScenePlanetTextureV1({
  systemIdentity,
  planetId,
  surfaceStyle: 'rocky',
  baseColorHex: '#887B6B',
});

function surfaceMap(vegetationProfile: SystemScenePlanetVegetationProfileV1 | null) {
  return buildSystemScenePlanetSurfaceTextureV1({
    systemIdentity,
    planetId,
    baseTexture,
    surface,
    nightCivilizationTier: 'ADVANCED',
    vegetationProfile: vegetationProfile ?? undefined,
  });
}

function cities(landMask: Uint8Array) {
  return buildSystemScenePlanetNightLightsV1({
    landMask,
    maskWidth: baseTexture.width,
    maskHeight: baseTexture.height,
    width: 1024,
    height: 512,
    seedUint32: 91201,
    tier: 'ADVANCED',
  });
}

function litMidLatitudes(rgba: Uint8Array): number {
  let count = 0;
  for (let y = 128; y < 384; y++) {
    for (let x = 0; x < 1023; x++) {
      const i = (y * 1024 + x) * 4;
      if (rgba[i]! + rgba[i + 1]! + rgba[i + 2]! > 0) count++;
    }
  }
  return count;
}

describe('VISCIV.1d identical observed surface and night geography across fiche and system scene', () => {
  it('uses the actual VIDA.9 vegetation profile when decorating the system body', () => {
    const planet = { id: planetId, visualCivilizationTier: null };
    const base = {
      planets: [planet],
      stars: [],
      scientificPlanetBindings: [{ sceneBodyId: planetId, bodyIndex: '2' }],
    } as unknown as SystemSceneSnapshot;
    const map = civilizationVisualMapOf([{ bodyIndex: '2', tier: 'ADVANCED', vegetationProfile: profile }]);
    const decorated = decorateSystemSceneSnapshotWithCivilizationTiers(base, map);
    expect(decorated.planets[0]!.visualCivilizationTier).toBe('ADVANCED');
    expect(decorated.planets[0]!.visualVegetationProfile).toBe(profile);
  });

  it('generates exactly the same land mask and night map from the shared profile and seed', () => {
    const ficheSurface = surfaceMap(profile);
    const systemSurface = surfaceMap(profile);
    expect(systemSurface.nightLandMask).toEqual(ficheSurface.nightLandMask);
    const ficheCities = cities(ficheSurface.nightLandMask!);
    const systemCities = cities(systemSurface.nightLandMask!);
    expect(systemCities.rgba).toEqual(ficheCities.rgba);
    expect(litMidLatitudes(systemCities.rgba)).toBeGreaterThan(0);
  });

  it('detects the old divergence caused by omitting the vegetation profile', () => {
    const ficheSurface = surfaceMap(profile);
    const oldSystemSurface = surfaceMap(null);
    expect(oldSystemSurface.nightLandMask).not.toEqual(ficheSurface.nightLandMask);
  });
});
