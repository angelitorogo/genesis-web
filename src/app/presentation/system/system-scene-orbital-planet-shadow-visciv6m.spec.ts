import * as THREE from 'three';
import {
  buildSystemSceneOrbitalRingPlansV1,
  createSystemSceneOrbitalRingVisualV1,
  updateOrbitalRingNightLightsVISCIV6g,
  type SystemSceneOrbitalRingVisualV1,
} from './system-scene-artificial-satellites-visciv2';
import {
  planetShadowTransmissionVISCIV6m,
  updateOrbitalPlanetShadowVISCIV6m,
} from './system-scene-orbital-planet-shadow-visciv6m';

function exampleVisualVISCIV6m(seed = 1): SystemSceneOrbitalRingVisualV1 {
  const plan = buildSystemSceneOrbitalRingPlansV1(seed, 'VERY_ADVANCED')[0]!;
  return createSystemSceneOrbitalRingVisualV1(plan, 1);
}

function withVisualVISCIV6m(callback: (visual: SystemSceneOrbitalRingVisualV1) => void): void {
  const visual = exampleVisualVISCIV6m();
  try {
    visual.group.rotation.set(0, 0, 0);
    visual.rotationPivot.rotation.set(0, 0, 0);
    callback(visual);
  } finally {
    visual.resources.forEach(resource => resource.dispose());
  }
}

function firstMetalBandVISCIV6m(visual: SystemSceneOrbitalRingVisualV1): THREE.InstancedMesh {
  return visual.planetShadowVISCIV6m!.batches.find(batch =>
    batch.mesh.name === 'Segmented structural ring',
  )!.mesh;
}

function instanceRedVISCIV6m(mesh: THREE.InstancedMesh, index: number): number {
  const c = new THREE.Color();
  mesh.getColorAt(index, c);
  return c.r;
}

describe('VISCIV.6m — sombra del planeta sobre anillos orbitales', () => {
  it('traza la oclusión en el sentido correcto, con penumbra suave en el borde planetario', () => {
    const star = new THREE.Vector3(1, 0, 0);
    expect(planetShadowTransmissionVISCIV6m(new THREE.Vector3(2, 0, 0), star, 1)).toBe(1);
    expect(planetShadowTransmissionVISCIV6m(new THREE.Vector3(-2, 0, 0), star, 1)).toBe(0);
    expect(planetShadowTransmissionVISCIV6m(new THREE.Vector3(-2, 1.2, 0), star, 1)).toBe(1);
    expect(planetShadowTransmissionVISCIV6m(new THREE.Vector3(-2, 1, 0), star, 1)).toBeCloseTo(0.5, 10);
    const inside = planetShadowTransmissionVISCIV6m(new THREE.Vector3(-2, 0.98, 0), star, 1);
    const outside = planetShadowTransmissionVISCIV6m(new THREE.Vector3(-2, 1.02, 0), star, 1);
    expect(inside).toBeGreaterThan(0);
    expect(inside).toBeLessThan(0.5);
    expect(outside).toBeGreaterThan(0.5);
    expect(outside).toBeLessThan(1);
    expect(planetShadowTransmissionVISCIV6m(new THREE.Vector3(-2, 0, 0), star.clone().multiplyScalar(4), 1)).toBe(0);
    expect(planetShadowTransmissionVISCIV6m(new THREE.Vector3(-2, 0, 0), new THREE.Vector3(), 1)).toBe(1);
  });

  it('oscurece individualmente los tramos detrás del planeta sin ensombrecer todo el anillo', () => {
    withVisualVISCIV6m(visual => {
      const bands = visual.planetShadowVISCIV6m!.batches;
      expect(bands.length).toBeGreaterThan(10);
      expect(bands.every(batch => batch.mesh.instanceColor !== null)).toBe(true);
      const metal = firstMetalBandVISCIV6m(visual);
      updateOrbitalRingNightLightsVISCIV6g(visual, [{ direction: new THREE.Vector3(1, 0, 0), weight: 1 }]);
      expect(instanceRedVISCIV6m(metal, 0)).toBeCloseTo(1, 7);
      expect(instanceRedVISCIV6m(metal, 48)).toBeCloseTo(0.09, 7);
      expect(instanceRedVISCIV6m(metal, 24)).toBeCloseTo(1, 7);
    });
  });

  it('mezcla correctamente dos o tres estrellas, incluso con distinta intensidad', () => {
    withVisualVISCIV6m(visual => {
      const metal = firstMetalBandVISCIV6m(visual);
      const update = (sources: ReadonlyArray<{ direction: THREE.Vector3; weight: number }>) =>
        updateOrbitalPlanetShadowVISCIV6m(
          visual.planetShadowVISCIV6m!, visual.group, visual.rotationPivot, sources,
        );
      update([{ direction: new THREE.Vector3(1, 0, 0), weight: 1 },
        { direction: new THREE.Vector3(-1, 0, 0), weight: 3 }]);
      expect(instanceRedVISCIV6m(metal, 48)).toBeCloseTo(0.7725, 4);
      update([{ direction: new THREE.Vector3(1, 0, 0), weight: 1 },
        { direction: new THREE.Vector3(-1, 0, 0), weight: 1 },
        { direction: new THREE.Vector3(0, 0, 1), weight: 1 }]);
      const mixed = instanceRedVISCIV6m(metal, 48);
      expect(mixed).toBeGreaterThan(0.60);
      expect(mixed).toBeLessThan(0.80);
      update([]);
      expect(instanceRedVISCIV6m(metal, 48)).toBeCloseTo(1, 7);
    });
  });

  it('recalcula al rotar el anillo y al cambiar la estrella, sin acumular oscuridad', () => {
    withVisualVISCIV6m(visual => {
      const star = [{ direction: new THREE.Vector3(1, 0, 0), weight: 1 }];
      const metal = firstMetalBandVISCIV6m(visual);
      updateOrbitalRingNightLightsVISCIV6g(visual, star);
      const before = instanceRedVISCIV6m(metal, 48);
      visual.rotationPivot.rotation.y = Math.PI;
      updateOrbitalRingNightLightsVISCIV6g(visual, star);
      expect(instanceRedVISCIV6m(metal, 48)).toBeGreaterThan(0.95);
      visual.rotationPivot.rotation.y = 0;
      updateOrbitalRingNightLightsVISCIV6g(visual, star);
      expect(instanceRedVISCIV6m(metal, 48)).toBeCloseTo(before, 7);
    });
  });

  it('no atenúa las ventanas, balizas ni el tráfico artificial durante un eclipse', () => {
    withVisualVISCIV6m(visual => {
      const beacons = visual.nightBeaconsVISCIV6g!;
      const lights = visual.architecturalLightsVISCIV6j![0]!;
      const beaconBefore = new THREE.Color();
      const lightBefore = new THREE.Color();
      beacons.getColorAt(0, beaconBefore);
      lights.mesh.getColorAt(0, lightBefore);
      const matrices = visual.orbitalTrafficVISCIV6k!.batches.map(batch => {
        const matrix = new THREE.Matrix4();
        batch.mesh.getMatrixAt(0, matrix);
        return matrix.toArray();
      });
      updateOrbitalPlanetShadowVISCIV6m(
        visual.planetShadowVISCIV6m!, visual.group, visual.rotationPivot,
        [{ direction: new THREE.Vector3(1, 0, 0), weight: 1 }],
      );
      const beaconAfter = new THREE.Color();
      const lightAfter = new THREE.Color();
      beacons.getColorAt(0, beaconAfter);
      lights.mesh.getColorAt(0, lightAfter);
      expect(beaconAfter.toArray()).toEqual(beaconBefore.toArray());
      expect(lightAfter.toArray()).toEqual(lightBefore.toArray());
      visual.orbitalTrafficVISCIV6k!.batches.forEach((batch, index) => {
        const matrix = new THREE.Matrix4();
        batch.mesh.getMatrixAt(0, matrix);
        expect(matrix.toArray()).toEqual(matrices[index]);
        expect(visual.planetShadowVISCIV6m!.batches.some(entry => entry.mesh === batch.mesh)).toBe(false);
      });
    });
  });

  it('mantiene anillos separados e inclinados y asigna materiales exclusivamente a VERY_ADVANCED', () => {
    expect(buildSystemSceneOrbitalRingPlansV1(19, 'ADVANCED')).toHaveLength(0);
    for (const seed of [1, 145872, 7919]) {
      const rings = buildSystemSceneOrbitalRingPlansV1(seed, 'VERY_ADVANCED');
      const visuals = rings.map(plan => createSystemSceneOrbitalRingVisualV1(plan, 1));
      try {
        for (const visual of visuals) {
          expect(visual.planetShadowVISCIV6m?.planetRadiusScene).toBe(1);
          expect(visual.planetShadowVISCIV6m!.batches.length).toBeGreaterThan(10);
        }
      } finally {
        visuals.forEach(visual => visual.resources.forEach(resource => resource.dispose()));
      }
    }
  });
});
