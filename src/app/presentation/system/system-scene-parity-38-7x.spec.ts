import { ArchiveStellarSystemKnowledgeLevel } from '../genesis-archive/archive-stellar-system-card';
import type { SystemSceneSnapshot } from './system-scene-snapshot';
import {
  bodyIndicesForMoon387x,
  civilizationVisualMapOf,
  decorateSystemSceneSnapshotWithCivilizationTiers,
  systemSceneMoonVisualKey387x,
  systemSceneVisualRecordAuthorized387x,
} from './system-scene-civilization-visuals';

const universeSeed = '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const profile = Object.freeze({
  coverageFraction01: .65, lushness01: .81, floraSpeciesCount: 5,
  paletteHexes: Object.freeze(['#45964C', '#719B38']),
  paletteEntries: Object.freeze([{hex:'#45964C',weight01:.6},{hex:'#719B38',weight01:.4}]),
});

function scene(level: ArchiveStellarSystemKnowledgeLevel = ArchiveStellarSystemKnowledgeLevel.CONFIRMED): SystemSceneSnapshot {
  return {
    universeSeed, generatorVersionCode: 3,
    address: {galaxyIndex: 0n, sectorKey: 9n, galacticObjectIndex: 11n},
    knowledgeLevel: level,
    discoveryStateCode: level === ArchiveStellarSystemKnowledgeLevel.CONFIRMED ? 5 : 4,
    planets: [
      {id: 'planet-1', visualCivilizationTier: null},
      {id: 'planet-2', visualCivilizationTier: null},
    ],
    moons: [{id:'moon-1-1'}, {id:'moon-2-1'}],
    minorBodies: [{id:'asteroid-1'}, {id:'comet-1'}, {id:'tno-1'}, {id:'captured-1'}],
  } as unknown as SystemSceneSnapshot;
}

describe('38.7x — paridad visual de TODOS los cuerpos y no filtración de VIDA.9', () => {
  const record = {
    universeSeed, generatorVersionCode: 3, systemKey: '0/9/11',
    bodyIndex: '0', moonIndex: null, tier: null, vegetationProfile: profile,
  } as const;

  it('proyecta flora confirmada en un planeta sin civilización, sin inventar luces nocturnas', () => {
    const result = decorateSystemSceneSnapshotWithCivilizationTiers(scene(), civilizationVisualMapOf([record]));
    expect(result.planets[0]!.visualVegetationProfile).toEqual(profile);
    expect(result.planets[0]!.visualCivilizationTier ?? null).toBeNull();
    expect(result.planets[1]!.visualVegetationProfile ?? null).toBeNull();
  });

  it('mantiene los cuatro tipos de cuerpos menores idénticos en el snapshot científico', () => {
    const before = scene();
    const result = decorateSystemSceneSnapshotWithCivilizationTiers(before, civilizationVisualMapOf([record]));
    expect(result.minorBodies).toBe(before.minorBodies);
    expect(result.minorBodies.map(body => body.id)).toEqual(['asteroid-1','comet-1','tno-1','captured-1']);
  });

  it('separa planetas de lunas con el mismo bodyIndex', () => {
    const colonias = Object.freeze([{id:'COLONIA-LUNAR'}]) as never;
    const keyed = civilizationVisualMapOf([
      record,
      {bodyIndex:'0',moonIndex:'0',tier:null,infrastructurePlans:colonias,
        universeSeed,generatorVersionCode:3,systemKey:'0/9/11'},
    ]);
    expect(keyed.size).toBe(2);
    expect(keyed.get('0')?.vegetationProfile).toBe(profile);
    expect(keyed.get(systemSceneMoonVisualKey387x('0','0'))?.infrastructurePlans).toBe(colonias);
    const result = decorateSystemSceneSnapshotWithCivilizationTiers(scene(),keyed);
    expect(result.planets[0]!.visualVegetationProfile).toBe(profile);
    expect(result.moons[0]!.visualInfrastructurePlans).toBe(colonias);
    expect(result.moons[1]!.visualInfrastructurePlans ?? null).toBeNull();
  });

  it('bloquea flora, civilizaciones y colonias en sistemas catalogados', () => {
    const hidden = {
      ...scene(ArchiveStellarSystemKnowledgeLevel.CATALOGUED),
      planets: [{...scene().planets[0]!,visualVegetationProfile:profile,visualCivilizationTier:'ADVANCED' as const}],
      moons: [{...scene().moons[0]!,visualInfrastructurePlans:[{id:'NO-REVELAR'}] as never}],
    } as SystemSceneSnapshot;
    const result = decorateSystemSceneSnapshotWithCivilizationTiers(hidden,civilizationVisualMapOf([record]));
    expect(result.planets[0]!.visualVegetationProfile ?? null).toBeNull();
    expect(result.planets[0]!.visualCivilizationTier ?? null).toBeNull();
    expect(result.moons[0]!.visualInfrastructurePlans).toHaveLength(0);
  });

  it('no acepta biología de un sistema o universo diferente', () => {
    const mismatched = {...record, systemKey:'0/9/12'};
    expect(systemSceneVisualRecordAuthorized387x(mismatched,scene())).toBe(false);
    const anotherUniverse = {...record,universeSeed:'OTRO-UNIVERSO'};
    expect(systemSceneVisualRecordAuthorized387x(anotherUniverse,scene())).toBe(false);
    const result = decorateSystemSceneSnapshotWithCivilizationTiers(scene(),civilizationVisualMapOf([mismatched]));
    expect(result.planets[0]!.visualVegetationProfile ?? null).toBeNull();
  });

  it('resuelve índices lunares históricos pero nunca inventa bindings multiestrella', () => {
    expect(bodyIndicesForMoon387x(scene(),'moon-1-1')).toEqual({bodyIndex:'0',moonIndex:'0'});
    expect(bodyIndicesForMoon387x({...scene(),scientificPlanetBindings:[]} as SystemSceneSnapshot,
      'moon-1-1')).toBeNull();
  });
});
