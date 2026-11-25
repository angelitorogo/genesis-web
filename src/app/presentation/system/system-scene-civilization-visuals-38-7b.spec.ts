import { describe, expect, it } from 'vitest';
import {
  civilizationVisualMapOf,
  type SystemSceneCivilizationVisualRecord,
} from './system-scene-civilization-visuals';

/** 38.7b: preserve the extended 38.6 infrastructure contract while allowing
 * non-civilized confirmed biospheres to retain their vegetation. */
describe('GENESIS 38.7b · contrato de datos 38.6/38.7', () => {
  it('acepta identidad, luna, planes coloniales y tier nullable', () => {
    const record: SystemSceneCivilizationVisualRecord = Object.freeze({
      universeSeed: '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
      generatorVersionCode: 3,
      systemKey: '0/0/0',
      bodyIndex: '3',
      moonIndex: '0',
      tier: null,
      infrastructurePlans: Object.freeze([]),
      vegetationProfile: null,
    });
    const indexed = civilizationVisualMapOf([record]);
    // 38.7x: a lunar VIDA.9 record cannot overwrite its host planet.
    expect(indexed.has('3')).toBe(false);
    expect(indexed.get('3:MOON:0')).toBe(record);
    expect(indexed.get('3:MOON:0')?.infrastructurePlans).toEqual([]);
    expect(indexed.get('3:MOON:0')?.moonIndex).toBe('0');
    expect(indexed.get('3:MOON:0')?.tier).toBeNull();
  });

  it('continúa admitiendo registros antiguos sin metadatos coloniales', () => {
    const indexed = civilizationVisualMapOf([
      {bodyIndex:'1',tier:'ADVANCED'},
      {bodyIndex:'2',tier:null},
    ]);
    expect(indexed.get('1')?.tier).toBe('ADVANCED');
    expect(indexed.get('2')?.tier).toBeNull();
  });
});
