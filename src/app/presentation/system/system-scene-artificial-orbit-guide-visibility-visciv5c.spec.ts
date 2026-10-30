import * as THREE from 'three';

import {
  applySystemSceneArtificialOrbitGuideVisibilityV1,
} from './system-scene-artificial-orbit-guide-visibility-visciv5c';

describe('VISCIV.5c — Guías orbitales de infraestructura artificial', () => {
  const layers = (orbits: boolean, planets = true, artificialSatellites = true) => ({
    orbits,
    planets,
    artificialSatellites,
  });

  it('oculta las líneas de satélites y estaciones cuando ÓRBITAS está desactivado, sin ocultar sus modelos', () => {
    const group = new THREE.Group();
    const satelliteGuide = new THREE.LineLoop();
    const stationGuide = new THREE.LineLoop();
    const satellite = new THREE.Mesh();
    const station = new THREE.Mesh();
    group.add(satelliteGuide, stationGuide, satellite, station);

    applySystemSceneArtificialOrbitGuideVisibilityV1(
      [satelliteGuide, stationGuide],
      layers(false),
    );

    expect(satelliteGuide.visible).toBe(false);
    expect(stationGuide.visible).toBe(false);
    expect(satellite.visible).toBe(true);
    expect(station.visible).toBe(true);
    expect(group.visible).toBe(true);
  });

  it('recupera las trazas al activar ÓRBITAS sin alterar las infraestructuras', () => {
    const satelliteGuide = new THREE.LineLoop();
    const stationGuide = new THREE.LineLoop();
    const station = new THREE.Mesh();

    applySystemSceneArtificialOrbitGuideVisibilityV1(
      [satelliteGuide, stationGuide],
      layers(false),
    );
    applySystemSceneArtificialOrbitGuideVisibilityV1(
      [satelliteGuide, stationGuide],
      layers(true),
    );

    expect(satelliteGuide.visible).toBe(true);
    expect(stationGuide.visible).toBe(true);
    expect(station.visible).toBe(true);
  });

  it('no expone guías si la capa artificial o el planeta están ocultos', () => {
    const guide = new THREE.LineLoop();
    const guideList = [guide];

    applySystemSceneArtificialOrbitGuideVisibilityV1(guideList, layers(true, true, false));
    expect(guide.visible).toBe(false);

    applySystemSceneArtificialOrbitGuideVisibilityV1(guideList, layers(true, false, true));
    expect(guide.visible).toBe(false);

    applySystemSceneArtificialOrbitGuideVisibilityV1(guideList, layers(true, true, true));
    expect(guide.visible).toBe(true);

    applySystemSceneArtificialOrbitGuideVisibilityV1(guideList, layers(false, true, false));
    expect(guide.visible).toBe(false);
  });

  it('mantiene la compatibilidad de órbitas opcionales sin ocultar anillos artificiales construidos', () => {
    const guide = new THREE.LineLoop();
    const constructedRing = new THREE.Mesh();
    applySystemSceneArtificialOrbitGuideVisibilityV1(
      [guide],
      { planets: true, artificialSatellites: true },
    );
    expect(guide.visible).toBe(true);

    applySystemSceneArtificialOrbitGuideVisibilityV1(
      [guide],
      layers(false),
    );
    expect(guide.visible).toBe(false);
    expect(constructedRing.visible).toBe(true);
  });
});
