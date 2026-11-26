import { systemSceneStarvis1Profile, systemSceneStarvis1SafeRadius } from './system-scene-star-visual-profile-starvis1';
import { buildSystemSceneHostVisualEnvelopeV3 } from './system-scene-host-visual-envelope';
import { buildSystemSceneStellarOrbitClearanceV5 } from './system-scene-stellar-orbit-clearance';
import { buildSystemSceneMultistellarPresentationV4 } from './system-scene-multistellar-presentation';

const star = (state: 'WHITE_DWARF' | 'BROWN_DWARF' | 'MAIN_SEQUENCE' | 'GIANT' | 'SUPERGIANT',
  spectralFamily: 'G' | 'M' | 'L' | 'O' | 'K' | 'A' = 'G', radiusSolar = 1,
  giantStage: 'RED_GIANT_BRANCH' | 'ASYMPTOTIC_GIANT_BRANCH' | 'SUPERGIANT' | null = null) =>
  systemSceneStarvis1Profile({ evolutionState: state, spectralFamily, radiusSolar,
    effectiveTemperatureKelvin: 5800, giantStage })!;

describe('GENESIS STARVIS.1 — identidad y separación geométrica', () => {
  it('las enanas blancas son <=30% de una solar y las gigantes RGB/AGB mucho mayores', () => {
    const g = star('MAIN_SEQUENCE').requestedRadiusScene;
    const white = star('WHITE_DWARF', 'G', 0.012).requestedRadiusScene;
    const rgb = star('GIANT', 'M', 70, 'RED_GIANT_BRANCH').requestedRadiusScene;
    const agb = star('GIANT', 'M', 150, 'ASYMPTOTIC_GIANT_BRANCH').requestedRadiusScene;
    const supergiant = star('SUPERGIANT', 'O', 500).requestedRadiusScene;
    expect(white / g).toBeLessThan(0.30);
    expect(rgb).toBeGreaterThan(g * 2.5);
    expect(agb).toBeGreaterThan(rgb);
    expect(supergiant).toBeGreaterThan(agb);
  });

  it('enanas marrones, M, K, G, A y O tienen progresión visual diferenciada', () => {
    const bd = star('BROWN_DWARF', 'L', 0.1).requestedRadiusScene;
    const m = star('MAIN_SEQUENCE', 'M', 0.3).requestedRadiusScene;
    const k = star('MAIN_SEQUENCE', 'K', 0.8).requestedRadiusScene;
    const g = star('MAIN_SEQUENCE', 'G', 1).requestedRadiusScene;
    const a = star('MAIN_SEQUENCE', 'A', 1.8).requestedRadiusScene;
    const o = star('MAIN_SEQUENCE', 'O', 12).requestedRadiusScene;
    expect(bd).toBeLessThan(m);
    expect(m).toBeLessThan(k);
    expect(k).toBeLessThan(g);
    expect(g).toBeLessThan(a);
    expect(a).toBeLessThan(o);
  });

  it('los estados evolutivos dominan sobre el tipo espectral para evitar confundir una gigante con una enana M', () => {
    expect(star('GIANT', 'M', 80, 'RED_GIANT_BRANCH').family).toBe('RGB');
    expect(star('WHITE_DWARF', 'O', 0.01).family).toBe('WHITE_DWARF');
    expect(star('SUPERGIANT', 'O', 300).family).toBe('SUPERGIANT');
    expect(star('GIANT', 'M', 90, 'ASYMPTOTIC_GIANT_BRANCH').family).toBe('AGB');
  });

  it('remantes compactos mantienen su modelo de laboratorio y no reciben fotosfera STARVIS', () => {
    for (const evolutionState of ['NEUTRON_STAR', 'STELLAR_BLACK_HOLE'] as const) {
      expect(systemSceneStarvis1Profile({ evolutionState, spectralFamily: 'O',
        radiusSolar: 0.0001, effectiveTemperatureKelvin: 100000 })).toBeNull();
    }
  });

  it('la óptica de una enana blanca y una marrón es más contenida, sin agrandar el cuerpo para seleccionarlo', () => {
    const white = star('WHITE_DWARF', 'G', 0.01);
    const giant = star('GIANT', 'M', 80, 'RED_GIANT_BRANCH');
    expect(white.opticalScale).toBeLessThan(0.25);
    expect(white.glareScale).toBeLessThan(0.25);
    expect(giant.glareScale).toBeLessThan(0.5);
    expect(star('BROWN_DWARF', 'L', .1).opticalScale).toBeLessThan(white.opticalScale);
  });

  it('en un sistema simple el tamaño grande respeta periapsis, cuerpo y margen >=20%', () => {
    for (const peri of [0.08, 0.25, 0.5, 1, 5]) {
      const radius = systemSceneStarvis1SafeRadius({ requestedRadiusScene: 3,
        planetPeriapsisScene: peri, maxRelativeCenterExcursionScene: 0,
        planetRadiusScene: 0.025 });
      expect(radius + 0.025).toBeLessThan(peri);
      expect(radius).toBeLessThanOrEqual(3);
    }
  });

  it('en órbita excéntrica usa el periapsis y no la distancia media', () => {
    const a = 1.5, e = 0.8;
    const limit = systemSceneStarvis1SafeRadius({ requestedRadiusScene: 1.2,
      planetPeriapsisScene: a * (1 - e), maxRelativeCenterExcursionScene: 0,
      planetRadiusScene: 0.05 });
    expect(limit + 0.05).toBeLessThan(a * (1 - e));
    expect(limit).toBeLessThan(0.3);
  });

  it('sistemas binarios/triples: resta el mayor desplazamiento del baricentro y el tamaño planetario', () => {
    for (const excursion of [0.1, 0.4, 1, 2]) {
      const peri = 3.2;
      const radius = systemSceneStarvis1SafeRadius({ requestedRadiusScene: 1.8,
        planetPeriapsisScene: peri, maxRelativeCenterExcursionScene: excursion,
        planetRadiusScene: 0.07 });
      expect(excursion + radius + 0.07).toBeLessThan(peri);
    }
  });

  it('si el centro estelar ya invade un corredor, falla cerrando la fotosfera en cero', () => {
    expect(systemSceneStarvis1SafeRadius({ requestedRadiusScene: 1,
      planetPeriapsisScene: 0.2, maxRelativeCenterExcursionScene: 0.3,
      planetRadiusScene: 0.04 })).toBe(0);
  });

  it('sin planetas no reduce tamaños arbitrariamente', () => {
    expect(systemSceneStarvis1SafeRadius({ requestedRadiusScene: 1.2,
      planetPeriapsisScene: null, maxRelativeCenterExcursionScene: 0,
      planetRadiusScene: 0 })).toBe(1.2);
  });

  it('integración con envoltura V3 y despeje V5 no vuelve a agrandar una enana blanca', () => {
    const dwarf = star('WHITE_DWARF', 'G', 0.01).requestedRadiusScene;
    const envelope = buildSystemSceneHostVisualEnvelopeV3([
      { id: 'a', baseRadiusScene: dwarf, maxCenterExcursionScene: 0,
        participatesInHabitableZoneHost: true, starvis1OptIn: true },
    ], 1, 1);
    const clearance = buildSystemSceneStellarOrbitClearanceV5([
      { id: 'a', label: 'A', baseRadiusScene: envelope.stars[0]!.radiusScene,
        baseOpticalRadiusScene: envelope.stars[0]!.opticalRadiusScene,
        maxCenterExcursionScene: 0, participatesInPlanetaryHostClearance: true,
        starvis1OptIn: true },
    ], 1, null, 0.02);
    expect(clearance.stars[0]!.radiusScene).toBeLessThanOrEqual(dwarf + 1e-12);
    expect(clearance.stars[0]!.radiusScene).toBeLessThan(0.075);
  });

  it('una gigante conserva su tamaño expandido si el periapsis proyectado deja espacio', () => {
    const rgb = star('GIANT', 'M', 75, 'RED_GIANT_BRANCH').requestedRadiusScene;
    const envelope = buildSystemSceneHostVisualEnvelopeV3([
      { id: 'a', baseRadiusScene: rgb, maxCenterExcursionScene: 0,
        participatesInHabitableZoneHost: true, starvis1OptIn: true },
    ], 7, 4);
    const clearance = buildSystemSceneStellarOrbitClearanceV5([
      { id: 'a', label: 'A', baseRadiusScene: envelope.stars[0]!.radiusScene,
        baseOpticalRadiusScene: envelope.stars[0]!.opticalRadiusScene,
        maxCenterExcursionScene: 0, participatesInPlanetaryHostClearance: true,
        starvis1OptIn: true },
    ], 4, null, 0.05);
    expect(clearance.stars[0]!.radiusScene).toBeGreaterThan(0.7);
    expect(clearance.stars[0]!.radiusScene).toBeLessThan(4);
  });

  it('V3/V5 mantienen su comportamiento legacy cuando no hay opt-in STARVIS.1', () => {
    const envelope = buildSystemSceneHostVisualEnvelopeV3([
      { id: 'a', baseRadiusScene: .3, maxCenterExcursionScene: 0,
        participatesInHabitableZoneHost: true },
    ], .8, .8);
    expect(envelope.stars[0]!.radiusScene).toBeLessThanOrEqual(.8 * .22 + 1e-12);
    const clearance = buildSystemSceneStellarOrbitClearanceV5([
      { id: 'a', label: 'A', baseRadiusScene: .5,
        baseOpticalRadiusScene: .6, maxCenterExcursionScene: 0,
        participatesInPlanetaryHostClearance: true },
    ], .62);
    expect(clearance.stars[0]!.opticalRadiusScene).toBeLessThan(.62);
  });

  it('V4 conserva el límite de separación entre fotosferas en sistemas estelares múltiples', () => {
    const binary = buildSystemSceneMultistellarPresentationV4('BINARY', [
      { id: 'a', label: 'A', baseRadiusScene: 1.2, opticalRadiusScene: 1.3 },
      { id: 'b', label: 'B', baseRadiusScene: .5, opticalRadiusScene: .6 },
    ], 1.4, null);
    expect(binary.stars.reduce((sum, s) => sum + s.radiusScene, 0))
      .toBeLessThanOrEqual(binary.innerPairPhotosphereBudgetScene + 1e-9);
  });
});
