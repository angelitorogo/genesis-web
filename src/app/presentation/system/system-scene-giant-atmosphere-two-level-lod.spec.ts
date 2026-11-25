import { describe, expect, it } from 'vitest';
import { giantAtmosphereFocusWidthVISCATM1 } from './system-scene-giant-atmosphere-multires-viscatm1';
import { PLANET_TEXTURE_DETAIL_SIZES_V1 } from './system-scene-planet-texture-refinement';

describe('GENESIS LOD2.1 — dos atlas gaseosos en SystemScene', () => {
  it('iguala el atlas de detalle de los planetas sólidos', () => {
    expect(PLANET_TEXTURE_DETAIL_SIZES_V1.distant.width).toBe(256);
    expect(PLANET_TEXTURE_DETAIL_SIZES_V1.closeSystem.width).toBe(512);
    for (const width of [null, 512, 1024]) {
      for (const diameter of [0, 210, 299, 300, 370, 512, 1000]) {
        expect(giantAtmosphereFocusWidthVISCATM1(diameter, width)).toBe(512);
      }
    }
  });
  it('rechaza tamaños proyectados inválidos', () => {
    expect(() => giantAtmosphereFocusWidthVISCATM1(Number.NaN, null)).toThrow(RangeError);
    expect(() => giantAtmosphereFocusWidthVISCATM1(-1, null)).toThrow(RangeError);
    expect(() => giantAtmosphereFocusWidthVISCATM1(350, 4096)).toThrow(RangeError);
  });
});
