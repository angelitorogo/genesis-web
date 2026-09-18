import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { type SystemSceneSnapshot } from './system-scene-snapshot';
import { systemSceneV2ReferenceFiche } from './system-scene-v2-reference-fiche';

const planetId = 'v22-seed-A-01';
const moonId = 'v242-seed-A-01-01';
const cometId = 'v243-seed-B-comet-01';

/** Minimal, intentionally independent fixture: V2 IDs are not V1 BodyLocators. */
function scene(): SystemSceneSnapshot {
  return {
    multiplicityName: 'BINARY',
    discoveryStateCode: DiscoveryState.CONFIRMED.code,
    planets: [{id: planetId}],
    moons: [{id: moonId}],
    minorBodies: [{id: cometId}],
    scientificMultihostPlanetsV241: {planets: [{
      id: planetId, designation: 'A · b', hostId: 'A', type: 'ROCKY',
      physics: {massEarth: 1, radiusEarth: 1, semiMajorAxisAu: 1,
        periapsisAu: .9, apoapsisAu: 1.1, periodDays: 365},
      formationPath: {regime: 'IN_SITU'},
      environment: {atmosphere: {regime: 'RETAINED'},
        climate: {meanSurfaceTemperatureKelvin: 285}, water: {regime: 'LIQUID_CANDIDATE'}},
    }]},
    scientificMultihostMoonsV242: {moons: [{
      id: moonId, designation: 'A · b-I', hostId: 'A', hostPlanetId: planetId,
      massEarth: .01, radiusEarth: .25, semiMajorAxisPlanetRadii: 20,
      periodDays: 9, rocheLimitPlanetRadii: 2, hillRadiusPlanetRadii: 150,
      environment: {waterRegime: 'SURFACE_ICE'},
    }]},
    scientificMultihostMinorBodiesV243: {bodies: [{
      id: cometId, designation: 'B · COM-001', hostId: 'B', kind: 'COMET',
      diameterKilometers: 11, massEarth: 0.00001, composition: 'ICE_RICH',
      eccentricity: .81, periapsisAu: .2, apoapsisAu: 6,
      cometOrbitClass: 'INBOUND_VISITOR',
    }]},
    scientificMultihostHabitabilityV244: {planets: [{
      planetId, radiativeRelation: 'WHOLLY_WITHIN_ZONE',
    }]},
  } as unknown as SystemSceneSnapshot;
}

describe('V1 parity boundary: V2 scientific fiches remain truth-safe', () => {
  it('opens the actual V2 planet reference with environment and habitability', () => {
    const fiche = systemSceneV2ReferenceFiche(scene(), planetId);
    expect(fiche?.kind).toBe('PLANET');
    expect(fiche?.hostId).toBe('A');
    expect(fiche?.facts.find(item => item.label === 'Agua estimada')?.value)
      .toBe('LIQUID_CANDIDATE');
    expect(fiche?.facts.find(item => item.label === 'Relación con HZ A/B')?.value)
      .toBe('WHOLLY_WITHIN_ZONE');
    expect(fiche?.provenance).toContain('no es una observación');
  });

  it('resolves planet-relative moon data without routing through a V1 moon ID', () => {
    const fiche = systemSceneV2ReferenceFiche(scene(), moonId);
    expect(fiche?.kind).toBe('MOON');
    expect(fiche?.hostId).toBe('A');
    expect(fiche?.facts.find(item => item.label === 'Planeta anfitrión')?.value)
      .toBe('A · b');
  });

  it('resolves eccentric comet records around their own host B', () => {
    const fiche = systemSceneV2ReferenceFiche(scene(), cometId);
    expect(fiche?.kind).toBe('COMET');
    expect(fiche?.hostId).toBe('B');
    expect(fiche?.facts.find(item => item.label === 'Origen cometario')?.value)
      .toBe('INBOUND_VISITOR');
  });

  it('never exposes unconfirmed, nonbinary, unselected or absent scientific catalogues', () => {
    const valid = scene();
    expect(systemSceneV2ReferenceFiche({...valid, discoveryStateCode: DiscoveryState.CATALOGUED.code}, planetId))
      .toBeNull();
    expect(systemSceneV2ReferenceFiche({...valid, multiplicityName: 'SINGLE'}, planetId))
      .toBeNull();
    expect(systemSceneV2ReferenceFiche({...valid, scientificMultihostMoonsV242: undefined}, planetId))
      .toBeNull();
    expect(systemSceneV2ReferenceFiche(valid, 'not-visible')).toBeNull();
    expect(systemSceneV2ReferenceFiche({...valid, planets: []}, planetId)).toBeNull();
  });
});
