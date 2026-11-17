import * as THREE from 'three';
import { ArchiveStellarSystemKnowledgeLevel } from '../genesis-archive/archive-stellar-system-card';
import {
  buildSystemSceneOrbitalInfrastructureManifestVISCIV6e,
} from './system-scene-orbital-infrastructure-visciv6e';
import {
  createSystemSceneOrbitalRingVisualV1,
  createSystemSceneOrbitalStationVisualV1,
} from './system-scene-artificial-satellites-visciv2';
import {
  civilizationVisualMapOf,
  decorateSystemSceneSnapshotWithCivilizationTiers,
} from './system-scene-civilization-visuals';
import type { SystemSceneSnapshot } from './system-scene-snapshot';

const cataloguedSystem = (): SystemSceneSnapshot => ({
  universeSeed: '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
  generatorVersionCode: 3,
  address: { galaxyIndex: '0', sectorKey: '3', galacticObjectIndex: '11' },
  knowledgeLevel: ArchiveStellarSystemKnowledgeLevel.CONFIRMED,
  stars: [],
  moons: [],
  planets: [{ id: 'planet-advanced', radiusScene: 0.77, label: 'Prueba VISCIV.6e', visualCivilizationTier: null }],
  scientificPlanetBindings: [{ sceneBodyId: 'planet-advanced', bodyIndex: '6' }],
}) as unknown as SystemSceneSnapshot;

const tiers = civilizationVisualMapOf([{
  universeSeed: '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
  generatorVersionCode: 3,
  systemKey: '0/3/11',
  bodyIndex: '6',
  moonIndex: null,
  tier: 'VERY_ADVANCED',
}]);

describe('VISCIV.6e — reparación y contrato orbital compartido', () => {
  it('en 512 semillas VERY_ADVANCED mantiene al menos 9 satélites y una estación', () => {
    for (let i = 0; i < 512; i++) {
      const seed = Math.imul(7919, i + 1) >>> 0;
      const plan = buildSystemSceneOrbitalInfrastructureManifestVISCIV6e(seed, 'VERY_ADVANCED', 0.77);
      expect(plan.tier).toBe('VERY_ADVANCED');
      expect(plan.satelliteCount).toBeGreaterThanOrEqual(9);
      expect(plan.stationCount).toBeGreaterThanOrEqual(1);
      expect(plan.ringCount).toBeGreaterThanOrEqual(1);
      expect(plan.ringCount).toBeLessThanOrEqual(3);
      expect(plan.totalCount).toBe(plan.satelliteCount + plan.stationCount + plan.ringCount);
    }
  });

  it('conserva los perfiles de 1, 2 y 3 aros y el determinismo CT-0', () => {
    const seeds = Array.from({ length: 512 }, (_, i) => i * 7919);
    const counts = new Set(seeds.map(seed =>
      buildSystemSceneOrbitalInfrastructureManifestVISCIV6e(seed, 'VERY_ADVANCED', 1).ringCount));
    expect(counts).toEqual(new Set([1, 2, 3]));
    const sample = buildSystemSceneOrbitalInfrastructureManifestVISCIV6e(145872, 'VERY_ADVANCED', 1);
    expect(sample).toEqual(buildSystemSceneOrbitalInfrastructureManifestVISCIV6e(145872, 'VERY_ADVANCED', 1));
  });

  it('ADVANCED solo produce satélites; PRIMITIVE y sin tier no filtran infraestructura', () => {
    for (const tier of ['ADVANCED', 'PRIMITIVE', null] as const) {
      const plan = buildSystemSceneOrbitalInfrastructureManifestVISCIV6e(8881, tier, 1);
      expect(plan.stationCount).toBe(0);
      expect(plan.ringCount).toBe(0);
      if (tier === 'ADVANCED') {
        expect(plan.satelliteCount).toBeGreaterThanOrEqual(3);
        expect(plan.satelliteCount).toBeLessThanOrEqual(5);
      } else {
        expect(plan.satelliteCount).toBe(0);
      }
    }
  });

  it('conserva VERY_ADVANCED a través de scientificPlanetBindings y snapshot confirmado', () => {
    const base = cataloguedSystem();
    const after = decorateSystemSceneSnapshotWithCivilizationTiers(base, tiers);
    expect(after.planets[0]!.visualCivilizationTier).toBe('VERY_ADVANCED');
    const manifest = buildSystemSceneOrbitalInfrastructureManifestVISCIV6e(
      16390, after.planets[0]!.visualCivilizationTier, after.planets[0]!.radiusScene,
    );
    expect(manifest.stationCount).toBeGreaterThan(0);
    expect(manifest.satelliteCount).toBeGreaterThan(8);
    const forbidden = { ...base, knowledgeLevel: ArchiveStellarSystemKnowledgeLevel.CATALOGUED } as SystemSceneSnapshot;
    expect(decorateSystemSceneSnapshotWithCivilizationTiers(forbidden, tiers)).toBe(forbidden);
  });

  it('no asocia un tier persistido a otro sistema o universo', () => {
    const wrongSystem: SystemSceneSnapshot = { ...cataloguedSystem(), address: { galaxyIndex: '1', sectorKey: '3', galacticObjectIndex: '11' } };
    const decorated = decorateSystemSceneSnapshotWithCivilizationTiers(wrongSystem, tiers);
    expect(decorated.planets[0]!.visualCivilizationTier ?? null).toBeNull();
  });

  it('crea mallas reales de estaciones y anillos para que no desaparezcan sin avisar', () => {
    const sample = Array.from({ length: 512 }, (_, i) => i * 7919)
      .map(seed => buildSystemSceneOrbitalInfrastructureManifestVISCIV6e(seed, 'VERY_ADVANCED', 0.9))
      .find(manifest => manifest.ringCount === 2)!;
    expect(sample).toBeDefined();
    const station = createSystemSceneOrbitalStationVisualV1(sample.stations[0]!, 331);
    const ring = createSystemSceneOrbitalRingVisualV1(sample.rings[0]!, 0.9);
    expect(station.group.children.length).toBeGreaterThan(0);
    expect(ring.rotationPivot.children.some(child => child instanceof THREE.InstancedMesh)).toBe(true);
    for (const obj of station.resources) obj.dispose();
    for (const obj of ring.resources) obj.dispose();
  });
});
