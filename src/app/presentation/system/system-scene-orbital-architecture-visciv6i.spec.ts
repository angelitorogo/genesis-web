import * as THREE from 'three';
import {
  buildSystemSceneOrbitalRingPlansV1,
  createSystemSceneOrbitalRingVisualV1,
  type SystemSceneOrbitalRingKindV1,
  type SystemSceneOrbitalRingVisualV1,
} from './system-scene-artificial-satellites-visciv2';

function findPlanByKindVISCIV6i(kind: SystemSceneOrbitalRingKindV1) {
  for (let seed = 0; seed < 4096; seed += 1) {
    const plans = buildSystemSceneOrbitalRingPlansV1(Math.imul(seed + 1, 7919) >>> 0, 'VERY_ADVANCED');
    const match = plans.find(plan => plan.ringKind === kind);
    if (match) return match;
  }
  throw new Error(`VISCIV.6i: no se ha encontrado un anillo ${kind}`);
}

function countInstancedMeshesVISCIV6i(root: THREE.Object3D): number {
  let total = 0;
  root.traverse(object => {
    if (object instanceof THREE.InstancedMesh) total += 1;
  });
  return total;
}

function disposeVisualVISCIV6i(visual: SystemSceneOrbitalRingVisualV1): void {
  for (const resource of visual.resources) resource.dispose();
}

describe('VISCIV.6i — arquitectura monumental de anillos orbitales', () => {
  it('añade superestructura monumental común y un grupo especializado por tipo de anillo', () => {
    const expectedNames: Record<SystemSceneOrbitalRingKindV1, string> = {
      HABITAT: 'VISCIV6i habitat districts',
      INDUSTRIAL: 'VISCIV6i industrial shipyards',
      TRANSPORT: 'VISCIV6i transport corridors',
    };
    const visuals = (Object.keys(expectedNames) as SystemSceneOrbitalRingKindV1[]).map(kind =>
      createSystemSceneOrbitalRingVisualV1(findPlanByKindVISCIV6i(kind), 1),
    );
    try {
      visuals.forEach((visual, index) => {
        const kind = (Object.keys(expectedNames) as SystemSceneOrbitalRingKindV1[])[index]!;
        const monumental = visual.rotationPivot.getObjectByName('VISCIV6i monumental orbital superstructure');
        expect(monumental).toBeInstanceOf(THREE.Group);
        expect(monumental!.getObjectByName('VISCIV6i deck levels')).toBeTruthy();
        expect(monumental!.getObjectByName('VISCIV6i great orbital nodes')).toBeTruthy();
        expect(monumental!.getObjectByName(expectedNames[kind])).toBeTruthy();
      });
    } finally {
      visuals.forEach(disposeVisualVISCIV6i);
    }
  });

  it('incrementa claramente la masa arquitectónica con múltiples lotes instanciados sin romper el núcleo del anillo', () => {
    const habitat = createSystemSceneOrbitalRingVisualV1(findPlanByKindVISCIV6i('HABITAT'), 1);
    const industrial = createSystemSceneOrbitalRingVisualV1(findPlanByKindVISCIV6i('INDUSTRIAL'), 1);
    const transport = createSystemSceneOrbitalRingVisualV1(findPlanByKindVISCIV6i('TRANSPORT'), 1);
    try {
      expect(habitat.rotationPivot.children.filter(child => child instanceof THREE.InstancedMesh)).toHaveLength(2);
      expect(industrial.rotationPivot.children.filter(child => child instanceof THREE.InstancedMesh)).toHaveLength(2);
      expect(transport.rotationPivot.children.filter(child => child instanceof THREE.InstancedMesh)).toHaveLength(2);
      expect(countInstancedMeshesVISCIV6i(habitat.rotationPivot)).toBeGreaterThanOrEqual(16);
      expect(countInstancedMeshesVISCIV6i(industrial.rotationPivot)).toBeGreaterThanOrEqual(18);
      expect(countInstancedMeshesVISCIV6i(transport.rotationPivot)).toBeGreaterThanOrEqual(10);
    } finally {
      disposeVisualVISCIV6i(habitat);
      disposeVisualVISCIV6i(industrial);
      disposeVisualVISCIV6i(transport);
    }
  });

  it('crea distritos, astilleros y nodos con relieve vertical apreciable', () => {
    const visuals = [
      createSystemSceneOrbitalRingVisualV1(findPlanByKindVISCIV6i('HABITAT'), 1),
      createSystemSceneOrbitalRingVisualV1(findPlanByKindVISCIV6i('INDUSTRIAL'), 1),
      createSystemSceneOrbitalRingVisualV1(findPlanByKindVISCIV6i('TRANSPORT'), 1),
    ];
    try {
      const heights = visuals.map(visual => {
        const monumental = visual.rotationPivot.getObjectByName('VISCIV6i monumental orbital superstructure')!;
        const box = new THREE.Box3().setFromObject(monumental);
        const size = new THREE.Vector3();
        box.getSize(size);
        return size.y;
      });
      // VISCIV.6i.a: meaningful visual relief. Keep the original thresholds;
      // validate the actual Three.js bounding boxes rather than lowering them.
      expect(heights[0]!).toBeGreaterThan(0.20);
      expect(heights[1]!).toBeGreaterThan(0.24);
      expect(heights[2]!).toBeGreaterThan(0.12);
      expect(heights[1]!).toBeGreaterThan(heights[2]!);
    } finally {
      visuals.forEach(disposeVisualVISCIV6i);
    }
  });


  it('une físicamente las cubiertas monumentales mediante soportes instanciados sin aumentar draw calls por segmento', () => {
    const kinds = ['HABITAT', 'INDUSTRIAL', 'TRANSPORT'] as const;
    const expectedLanes = [2, 2, 1] as const;
    for (let k = 0; k < kinds.length; k += 1) {
      const visual = createSystemSceneOrbitalRingVisualV1(findPlanByKindVISCIV6i(kinds[k]!), 1);
      try {
        const decks = visual.rotationPivot.getObjectByName('VISCIV6i deck levels')!;
        const supports = decks.children.filter(child => child.name === 'VISCIV6ia interdeck structural pylons');
        expect(supports).toHaveLength(expectedLanes[k]);
        for (const support of supports) {
          expect(support).toBeInstanceOf(THREE.InstancedMesh);
          const mesh = support as THREE.InstancedMesh;
          expect(mesh.count).toBeGreaterThanOrEqual(32);
          const box = new THREE.Box3().setFromObject(mesh);
          const size = new THREE.Vector3();
          box.getSize(size);
          expect(size.y).toBeGreaterThan(kinds[k] === 'INDUSTRIAL' ? 0.27
            : kinds[k] === 'HABITAT' ? 0.22 : 0.16);
        }
      } finally {
        disposeVisualVISCIV6i(visual);
      }
    }
  });
});
