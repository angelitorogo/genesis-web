import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import { MoonTidalState, moonTidalMigrationRegimeV1, synchronousOrbitPlanetRadiiV1 } from '../../domain/planetary/moon-tidal-state';
import { MoonTidalLockingRegime } from '../../domain/planetary/moon-tidal-locking-regime';
import { MoonTidalRegime } from '../../domain/planetary/moon-tidal-regime';
import { MoonInternalWaterEngine } from './moon-internal-water-engine';

const G = 6.67430e-11;
const EARTH_MASS_KG = 5.9722e24;
const EARTH_RADIUS_KM = 6371;

function tidal(
  physical: MoonPhysicalProperties,
  eccentricity: number,
  heatingIndex01: number,
  synchronized = true,
  hostMassEarth = 318,
  hostRadiusEarth = 11.2,
  semiMajorAxisPlanetRadii = 20,
): MoonTidalState {
  const axisKm = semiMajorAxisPlanetRadii * hostRadiusEarth * EARTH_RADIUS_KM;
  const periodDays = 2 * Math.PI * Math.sqrt((axisKm * 1000) ** 3 /
    (G * (hostMassEarth + physical.massEarth) * EARTH_MASS_KG)) / 86400;
  const synchronousRadius = synchronousOrbitPlanetRadiiV1(hostMassEarth, hostRadiusEarth, 12);
  return new MoonTidalState(
    1, 1, hostMassEarth, hostRadiusEarth, 12, false,
    physical.massEarth, physical.radiusEarth,
    semiMajorAxisPlanetRadii, axisKm, eccentricity, periodDays,
    synchronousRadius,
    0.6, heatingIndex01,
    heatingIndex01 < 0.05 ? MoonTidalRegime.NEGLIGIBLE :
      heatingIndex01 < 0.20 ? MoonTidalRegime.WEAK :
      heatingIndex01 < 0.45 ? MoonTidalRegime.MODERATE :
      heatingIndex01 < 0.75 ? MoonTidalRegime.STRONG : MoonTidalRegime.EXTREME,
    synchronized ? 0.8 : 0.1,
    synchronized ? MoonTidalLockingRegime.SYNCHRONIZED : MoonTidalLockingRegime.UNLOCKED,
    synchronized ? periodDays * 24 : 30,
    moonTidalMigrationRegimeV1(false, semiMajorAxisPlanetRadii, synchronousRadius),
  );
}

describe('C — Lunar cryosphere, tidal energy and thermodynamics', () => {
  const icy = new MoonPhysicalProperties(1, 1, 0.0225, 0.404, 1.88, 0.138);

  it('uses actual orbital eccentricity and bulk properties, not the legacy tidal index as watts', () => {
    const zero = MoonInternalWaterEngine.assess(icy, tidal(icy, 0, 0.8), 90, 0.85, 0.85);
    const low = MoonInternalWaterEngine.assess(icy, tidal(icy, 0.01, 0.8), 90, 0.85, 0.85);
    const high = MoonInternalWaterEngine.assess(icy, tidal(icy, 0.02, 0.8), 90, 0.85, 0.85);
    expect(zero.tidalHeatFluxMaximumWattsPerSquareMeter).toBe(0);
    expect(zero.iceShellThermalRegime).toBe('TIDAL_HEAT_INSUFFICIENT_IN_SCENARIO');
    expect(high.tidalHeatFluxMaximumWattsPerSquareMeter).toBeCloseTo(
      (low.tidalHeatFluxMaximumWattsPerSquareMeter ?? 0) * 4, 8,
    );
    expect(high.radiogenicHeatResolved).toBe(false);
    expect(high.oceanConfirmed).toBe(false);
  });

  it('does not construct an ice shell on an intensely irradiated large moon', () => {
    const hot = MoonInternalWaterEngine.assess(icy, tidal(icy, 0.02, 0.4), 541.3, 0.2, 0.2);
    expect(hot.iceShellThermalRegime).toBe('NO_STABLE_SURFACE_ICE');
    expect(hot.conductiveShellThicknessMinimumKilometers).toBeNull();
    expect(hot.cryovolcanism).toBe('NOT_EVALUABLE');
  });

  it('does not declare an ocean without icy volatile inventory', () => {
    const dry = MoonInternalWaterEngine.assess(icy, tidal(icy, 0.05, 0.9), 90, 0.02, 0.03);
    expect(dry.iceShellThermalRegime).toBe('ICE_INVENTORY_LIMITED');
    expect(dry.oceanConfirmed).toBe(false);
  });

  it('can flag cryovolcanism only as a conditional possibility for strongly forced cold ice', () => {
    const result = MoonInternalWaterEngine.assess(icy, tidal(icy, 0.1, 0.7, true, 318, 11.2, 12), 90, 0.8, 0.8);
    expect(result.cryovolcanism).toBe('CONDITIONAL');
    expect(result.oceanConfirmed).toBe(false);
    expect(result.tidalHeatFluxMinimumWattsPerSquareMeter).toBeGreaterThanOrEqual(0);
  });

  it('does not apply synchronous eccentricity-tide formula to an unlocked moon', () => {
    const result = MoonInternalWaterEngine.assess(icy, tidal(icy, 0.1, 0.7, false), 90, 0.8, 0.8);
    expect(result.iceShellThermalRegime).toBe('NOT_EVALUABLE_NON_SYNCHRONOUS');
    expect(result.tidalHeatFluxMinimumWattsPerSquareMeter).toBeNull();
    expect(result.cryovolcanism).toBe('NOT_EVALUABLE');
  });

  it('rejects applying small-e tides to highly eccentric satellite trajectories', () => {
    const result = MoonInternalWaterEngine.assess(icy, tidal(icy, 0.5, 0.7), 90, 0.8, 0.8);
    expect(result.iceShellThermalRegime).toBe('NOT_EVALUABLE_HIGH_ECCENTRICITY');
    expect(result.tidalHeatFluxMaximumWattsPerSquareMeter).toBeNull();
  });

  it('is deterministic and rejects cross-object mismatch', () => {
    const state = tidal(icy, 0.03, 0.6);
    expect(MoonInternalWaterEngine.assess(icy, state, 90, 0.8, 0.8))
      .toEqual(MoonInternalWaterEngine.assess(icy, state, 90, 0.8, 0.8));
    expect(() => MoonInternalWaterEngine.assess(
      new MoonPhysicalProperties(1, 2, 0.0225, 0.404, 1.88, 0.138), state, 90, 0.8, 0.8,
    )).toThrow(RangeError);
  });
});
