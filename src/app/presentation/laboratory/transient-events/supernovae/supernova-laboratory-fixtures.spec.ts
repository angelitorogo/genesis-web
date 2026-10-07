import { SupernovaType } from '../../../../domain/transient/supernova-type';
import { SUPERNOVA_LABORATORY_CASES } from './supernova-laboratory-fixtures';

describe('29.1A — supernova laboratory fixtures', () => {
  it('exposes exactly Ia, II, Ib and Ic and keeps the derived type aligned with the fixture', () => {
    expect(SUPERNOVA_LABORATORY_CASES).toHaveLength(4);
    expect(SUPERNOVA_LABORATORY_CASES.map(item => item.id)).toEqual([
      SupernovaType.TYPE_IA,
      SupernovaType.TYPE_II,
      SupernovaType.TYPE_IB,
      SupernovaType.TYPE_IC,
    ]);

    for (const item of SUPERNOVA_LABORATORY_CASES) {
      expect(item.profile.type).toBe(item.id);
    }
  });
});
