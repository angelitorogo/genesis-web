import * as THREE from 'three';
import {
  buildSystemSceneArtificialSatellitePlansV1,
  buildSystemSceneOrbitalInfrastructureProfileV1,
  buildSystemSceneOrbitalRingPlansV1,
  buildSystemSceneOrbitalStationPlansV1,
  createSystemSceneArtificialSatelliteVisualV1,
  createSystemSceneOrbitalRingVisualV1,
  createSystemSceneOrbitalStationVisualV1,
  type SystemSceneOrbitalStationPlanV1,
} from './system-scene-artificial-satellites-visciv2';
import {
  createOrbitalEngineeringTextureV5,
} from './system-scene-orbital-detail-visciv5';

describe('VISCIV.5 — ingeniería metálica, materiales PBR y detalles deterministas', () => {
  it('genera texturas UV reproducibles y distintas para casco, células y ventanales', () => {
    const first = createOrbitalEngineeringTextureV5(17172, 'HULL');
    const second = createOrbitalEngineeringTextureV5(17172, 'HULL');
    const solar = createOrbitalEngineeringTextureV5(17172, 'SOLAR');
    const glazing = createOrbitalEngineeringTextureV5(17172, 'GLAZING');
    try {
      expect(first.image.width).toBe(64);
      expect(first.image.height).toBe(64);
      expect(textureBytesVISCIV5(first)).toEqual(textureBytesVISCIV5(second));
      expect(textureBytesVISCIV5(first)).not.toEqual(textureBytesVISCIV5(solar));
      expect(textureBytesVISCIV5(solar)).not.toEqual(textureBytesVISCIV5(glazing));
      expect(first.colorSpace).toBe(THREE.SRGBColorSpace);
    } finally {
      first.dispose();
      second.dispose();
      solar.dispose();
      glazing.dispose();
    }
  });

  it('añade a los satélites paneles y montajes detallados sin abandonar su silueta rectilínea ni añadir transparencia', () => {
    for (const tier of ['ADVANCED', 'VERY_ADVANCED'] as const) {
      const [plan] = buildSystemSceneArtificialSatellitePlansV1(0x27ef0a, tier, 1);
      const a = createSystemSceneArtificialSatelliteVisualV1(plan!, 38313);
      const b = createSystemSceneArtificialSatelliteVisualV1(plan!, 38313);
      const boxes: THREE.Mesh[] = [];
      a.group.traverse(object => { if (object instanceof THREE.Mesh) boxes.push(object); });
      expect(boxes.length).toBeGreaterThan(12);
      expect(boxes.every(mesh => mesh.geometry instanceof THREE.BoxGeometry)).toBe(true);
      expect(a.materials.every(binding => binding.material instanceof THREE.MeshStandardMaterial)).toBe(true);
      expect(a.materials.every(binding => !binding.material.transparent && binding.material.opacity === 1)).toBe(true);
      expect(a.materials.some(binding => binding.role === 'panel')).toBe(true);
      expect(a.materials.some(binding => binding.role === 'truss')).toBe(true);
      expect(a.group.children.length).toBe(b.group.children.length);
      expect(a.resources.filter(item => item instanceof THREE.DataTexture).length).toBe(3);
      for (const resource of [...a.resources, ...b.resources]) resource.dispose();
    }
  });

  it('construye estaciones industriales, habitacionales y plataformas con cascos metálicos, textura y uniones visibles', () => {
    for (const installationKind of ['INDUSTRIAL', 'HABITAT', 'PLATFORM'] as const) {
      const plan: SystemSceneOrbitalStationPlanV1 = {
        installationKind,
        orbitRadiusPlanetRadii: 2.45,
        inclinationRadians: 0.17,
        ascendingNodeRadians: 0.23,
        phaseRadians: 0.44,
        angularSpeedRadiansPerDay: 0.1,
        hullColorHex: '#a3b5c1',
        lineColorHex: '#87aac3',
        stationScaleScene: 0.14,
        lineOpacity01: 0.27,
      };
      const visual = createSystemSceneOrbitalStationVisualV1(plan, 71831);
      const meshes: THREE.Mesh[] = [];
      visual.group.traverse(object => { if (object instanceof THREE.Mesh) meshes.push(object); });
      expect(meshes.length).toBeGreaterThan(15);
      expect(meshes.some(mesh => mesh.geometry instanceof THREE.CylinderGeometry)).toBe(installationKind !== 'PLATFORM');
      expect(visual.materials.every(binding => binding.material instanceof THREE.MeshStandardMaterial)).toBe(true);
      expect(visual.materials.every(binding => !binding.material.transparent)).toBe(true);
      expect(visual.materials.some(binding => binding.role === 'truss')).toBe(true);
      expect(visual.resources.filter(item => item instanceof THREE.DataTexture).length).toBe(3);
      expect(visual.resources.every(resource => typeof resource.dispose === 'function')).toBe(true);
      for (const resource of visual.resources) resource.dispose();
    }
  });

  it('mantiene dos objetos instanciados principales por anillo y añade barandillas y refuerzos en subgrupo', () => {
    const seed = Array.from({ length: 512 }, (_, i) => i * 7919).find(candidate =>
      buildSystemSceneOrbitalRingPlansV1(candidate, 'VERY_ADVANCED').length === 2,
    )!;
    const plans = buildSystemSceneOrbitalRingPlansV1(seed, 'VERY_ADVANCED');
    expect(plans).toHaveLength(2);
    for (const plan of plans) {
      const visual = createSystemSceneOrbitalRingVisualV1(plan, 1);
      const directBatches = visual.rotationPivot.children.filter(object => object instanceof THREE.InstancedMesh);
      expect(directBatches).toHaveLength(2);
      const detailGroup = visual.rotationPivot.children.find(object => object.name.includes('VISCIV5'));
      expect(detailGroup).toBeDefined();
      const nestedBatches = detailGroup!.children.filter(object => object instanceof THREE.InstancedMesh);
      expect(nestedBatches).toHaveLength(2);
      expect(visual.materials.every(binding => binding.material instanceof THREE.MeshStandardMaterial)).toBe(true);
      for (const resource of visual.resources) resource.dispose();
    }
  });

  it('no cambia identidades ni probabilidades de configuraciones orbitales VISCIV.4', () => {
    for (const seed of [1, 9, 1009, 71831]) {
      const profile = buildSystemSceneOrbitalInfrastructureProfileV1(seed, 'VERY_ADVANCED');
      expect(profile).toEqual(buildSystemSceneOrbitalInfrastructureProfileV1(seed, 'VERY_ADVANCED'));
      expect(buildSystemSceneOrbitalStationPlansV1(seed, 'ADVANCED', 1)).toHaveLength(0);
      expect(buildSystemSceneOrbitalRingPlansV1(seed, 'ADVANCED')).toHaveLength(0);
      expect(buildSystemSceneOrbitalRingPlansV1(seed, 'VERY_ADVANCED').length).toBe(profile.ringKinds.length);
      expect(buildSystemSceneOrbitalStationPlansV1(seed, 'VERY_ADVANCED', 1).length).toBe(profile.stationKinds.length);
    }
  });
});

/** Three.js tipa DataTexture.image.data como TypedArray | null: el test exige datos reales. */
function textureBytesVISCIV5(texture: THREE.DataTexture): number[] {
  const data = texture.image.data;
  if (data === null) {
    throw new Error('VISCIV.5: la textura procedural no contiene datos de píxeles');
  }
  return Array.from(data);
}
