import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import {
  NON_WATER_CONDENSABLE_GASES,
  condensableSaturationPressurePascal,
} from './atmosphere-condensable-thermodynamics';

describe('29.1E-e.2 cryogenic atmospheric phase closure', () => {
  it('includes hydrogen and helium in the non-water phase partition', () => {
    expect(NON_WATER_CONDENSABLE_GASES).toContain(AtmosphereGas.HYDROGEN);
    expect(NON_WATER_CONDENSABLE_GASES).toContain(AtmosphereGas.HELIUM);
  });

  it('collapses a kilopascal-scale hydrogen column at 10 K but keeps it gaseous above the critical temperature', () => {
    const cryogenic = condensableSaturationPressurePascal(AtmosphereGas.HYDROGEN, 10)!;
    const warm = condensableSaturationPressurePascal(AtmosphereGas.HYDROGEN, 40)!;
    expect(cryogenic).toBeLessThan(1_000);
    expect(warm).toBeGreaterThan(1_000_000);
  });

  it('does not force dilute helium to condense at 2.7 K when its partial pressure is below saturation', () => {
    const saturation = condensableSaturationPressurePascal(AtmosphereGas.HELIUM, 2.7)!;
    expect(saturation).toBeGreaterThan(10_000);
  });
});
