import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import { type MoonTidalState } from '../../domain/planetary/moon-tidal-state';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { MoonAtmosphereEngine } from './moon-atmosphere-engine';

function assess(
  mass: number, radius: number, density: number, gravity: number,
  temperature: number, tidalHeating: number,
) {
  const physical = new MoonPhysicalProperties(1, 1, mass, radius, density, gravity);
  const tidal = {
    hostPlanetOrdinal: 1, moonOrdinal: 1, tidalHeatingIndex01: tidalHeating,
  } as MoonTidalState;
  const iceRichness = Math.max(0, Math.min(1, (3.6 - density) / 2));
  return MoonAtmosphereEngine.assess(physical, tidal, temperature, iceRichness, 0.01);
}

describe('Lunar B — chemically bounded conditional atmospheric scenarios', () => {
  it('retains a possible nitrogen/methane column on a cold Titan-scale moon', () => {
    const state = assess(0.0225, 0.404, 1.88, 0.138, 94, 0.10);
    expect(state.pressureBasis).toBe('CONDITIONAL_SCENARIO');
    expect(state.estimatedSurfacePressurePascal).toBeGreaterThan(100);
    expect(state.species[0]?.gas).toBe(AtmosphereGas.NITROGEN);
    expect(state.species.some(gas => gas.gas === AtmosphereGas.METHANE)).toBe(true);
    expect(state.species.reduce((sum, gas) => sum + gas.moleFraction01, 0)).toBeCloseTo(1, 3);
  });

  it('does not invent a thick hydrostatic atmosphere for a warm Earth-Moon analogue', () => {
    const state = assess(0.0109353, 0.258576, 3.488, 0.16355, 275, 0.04);
    expect(state.estimatedSurfacePressurePascal).toBeNull();
    expect(state.pressureBasis).toBe('UNRESOLVED');
    expect(state.species).toEqual([]);
  });

  it('removes condensable gas from extremely cold ice-rich moons', () => {
    const cold = assess(0.0225, 0.404, 1.88, 0.138, 41, 0.10);
    const warmer = assess(0.0225, 0.404, 1.88, 0.138, 94, 0.10);
    expect(cold.condensationRemovalIndex01).toBeGreaterThan(0.9);
    expect(cold.estimatedSurfacePressurePascal).toBeNull();
    expect(warmer.condensationRemovalIndex01).toBeLessThan(cold.condensationRemovalIndex01);
  });

  it('distinguishes volcanic replenishment from thermal gas retention', () => {
    const cold = assess(0.015, 0.286, 3.53, 0.183, 110, 0);
    const active = assess(0.015, 0.286, 3.53, 0.183, 110, 1);
    expect(active.replenishmentSupportIndex01).toBeGreaterThan(cold.replenishmentSupportIndex01);
    expect(active.estimatedSurfacePressurePascal).toBeNull(); // freezing still limits global column
  });

  it('is deterministic and does not invent a resolved radiation or magnetic shielding', () => {
    const a = assess(0.0225, 0.404, 1.88, 0.138, 94, 0.10);
    const b = assess(0.0225, 0.404, 1.88, 0.138, 94, 0.10);
    expect(a).toEqual(b);
    expect(Object.isFrozen(a)).toBe(true);
    expect(Object.isFrozen(a.species)).toBe(true);
    expect(a.chargedParticleEnvironment).toBe('UNRESOLVED');
    expect(a.hostMagnetosphereShielding).toBe('UNRESOLVED');
  });

  it('rejects unaligned moon sources and physically invalid values', () => {
    const physical = new MoonPhysicalProperties(1, 1, 0.01, 0.2, 2.5, 0.1);
    const unaligned = { hostPlanetOrdinal: 1, moonOrdinal: 2, tidalHeatingIndex01: 0.1 } as MoonTidalState;
    expect(() => MoonAtmosphereEngine.assess(physical, unaligned, 100, 0.5, 0.01)).toThrow();
    const aligned = { hostPlanetOrdinal: 1, moonOrdinal: 1, tidalHeatingIndex01: 0.1 } as MoonTidalState;
    expect(() => MoonAtmosphereEngine.assess(physical, aligned, -10, 0.5, 0.01)).toThrow();
    expect(() => MoonAtmosphereEngine.assess(physical, aligned, 100, 1.5, 0.01)).toThrow();
  });
});
