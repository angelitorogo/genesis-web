import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { type CompactHostPlanet } from '../../domain/planetary/compact-host-planetary-system';
import { CompactPlanetaryHost, type CompactPlanetaryHostType } from '../../domain/stellar/compact-planetary-host';
import { CompactHostEnvironmentEngine, COMPACT_REFERENCE_THERMAL_ABSORPTION,
  COMPACT_REFERENCE_ENERGETIC_ABSORPTION } from './compact-host-environment-engine';

const key = new UniverseGenerationKey(UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V2);
const locator = new SystemLocator(0n, 2n, 7n);
const basePlanet: CompactHostPlanet = Object.freeze({
  locator: new BodyLocator(0n, 2n, 7n, 0n), ordinal: 1,
  bulkKind: 'ROCKY', massEarth: 1, radiusEarth: 1,
  meanDensityKgM3: 5513.4, semiMajorAxisAu: 1,
  eccentricity: 0, periastronAu: 1, apoastronAu: 1,
  orbitalPeriodDays: 365.25, rocheLimitAu: 1e-4,
});

function host(type: CompactPlanetaryHostType) {
  const bh = type === ExtremeType.STELLAR_MASS_BLACK_HOLE;
  return new CompactPlanetaryHost({
    generationKey: key, systemLocator: locator, type,
    scientificState: {
      massSolar: bh ? 8 : 1.45,
      activityRegime: bh ? 'QUIESCENT' : type === ExtremeType.MAGNETAR ? 'MAGNETICALLY_ACTIVE' : 'PULSED',
      thermalLuminositySolar: null,
      highEnergyLuminositySolar: null,
      accretionLuminositySolar: null,
      surfaceMagneticFieldTesla: bh ? null : type === ExtremeType.MAGNETAR ? 1e10 : 1e7,
      rotationPeriodSeconds: bh ? null : type === ExtremeType.MILLISECOND_PULSAR ? 0.005 : 0.5,
    },
  });
}

const types = [ExtremeType.NEUTRON_STAR, ExtremeType.PULSAR,
  ExtremeType.MILLISECOND_PULSAR, ExtremeType.MAGNETAR,
  ExtremeType.STELLAR_MASS_BLACK_HOLE] as const;

describe('31.3: compact host snapshot radiation/atmosphere/climate contracts', () => {
  it('keeps existing physical planet classes: environmental classes are NOT new planet taxa', () => {
    for (const type of types) {
      const env = CompactHostEnvironmentEngine.project(host(type), basePlanet);
      expect(env.bulkKind).toBe('ROCKY');
      expect(env.newPlanetaryTaxon).toBe(false);
      expect(env.intrinsicSurface).toBe('SOLID_ROCKY_REFERENCE');
      expect(env.actualSurfaceTemperatureK).toBeNull();
      expect(env.surfacePressurePa).toBeNull();
      expect(env.atmosphericComposition).toBeNull();
      expect(env.waterInventory).toBe('UNRESOLVED');
      expect(env.liquidSurfaceWater).toBe('UNRESOLVED_PRESSURE_INVENTORY_AND_HEATING');
      expect(env.atmosphericSurvival).toBe('UNRESOLVED_COMPOSITION_EXOBASE_AND_SHIELDING');
      expect(env.escapeVelocityKmS > 11.1 && env.escapeVelocityKmS < 11.3).toBe(true);
    }
  });

  it('does not pretend a quiescent BH has a stellar photosphere, active disk, or known equilibrium climate', () => {
    const h = host(ExtremeType.STELLAR_MASS_BLACK_HOLE);
    const rad = CompactHostEnvironmentEngine.resolveHostRadiation(h);
    const env = CompactHostEnvironmentEngine.project(h, basePlanet, rad);
    expect(rad.thermalLuminositySolar).toBeNull();
    expect(rad.energeticLuminositySolar).toBeNull();
    expect(rad.bolometricCompleteness).toBe('NO_HOST_EMISSION_MODEL');
    expect(env.regime).toBe('HOST_EMISSION_UNRESOLVED');
    expect(env.modeledIncludedFluxWm2).toBeNull();
    expect(env.referenceRadiativeTemperatureK).toBeNull();
    expect(env.waterPhaseAtReference).toBe('UNRESOLVED');
  });

  it('keeps active BH accretion bolometric and distinct from XUV or stellar thermal emission', () => {
    const h = new CompactPlanetaryHost({
      generationKey: key, systemLocator: locator,
      type: ExtremeType.STELLAR_MASS_BLACK_HOLE,
      scientificState: {
        massSolar: 9, activityRegime: 'ACCRETING',
        thermalLuminositySolar: null, highEnergyLuminositySolar: null,
        accretionLuminositySolar: 0.01, surfaceMagneticFieldTesla: null,
        rotationPeriodSeconds: null,
      },
    });
    const radiation = CompactHostEnvironmentEngine.resolveHostRadiation(h);
    const env = CompactHostEnvironmentEngine.project(h, basePlanet, radiation);
    expect(radiation.accretionBolometricLuminositySolar).toBe(0.01);
    expect(radiation.thermalLuminositySolar).toBeNull();
    expect(radiation.energeticLuminositySolar).toBeNull();
    expect(env.modeledAccretionBolometricFluxWm2! > 0).toBe(true);
    expect(env.modeledEnergeticFluxWm2).toBeNull();
    expect(env.referenceRadiativeTemperatureK! > 0).toBe(true);
    expect(env.atmosphericComposition).toBeNull();
  });

  it('uses explicit present-time neutron-star blackbody scenario, not the invented observed luminosity', () => {
    const h = host(ExtremeType.NEUTRON_STAR);
    const rad = CompactHostEnvironmentEngine.resolveHostRadiation(h);
    const env = CompactHostEnvironmentEngine.project(h, basePlanet, rad);
    expect(rad.thermalBasis).toBe('FIDUCIAL_NEUTRON_SURFACE');
    expect(rad.thermalLuminositySolar! > 0).toBe(true);
    expect(rad.energeticLuminositySolar).toBeNull();
    expect(rad.bolometricCompleteness).toBe('PARTIAL_SCENARIO');
    expect(env.modeledThermalFluxWm2! > 0).toBe(true);
    expect(env.modeledEnergeticFluxWm2).toBeNull();
    expect(env.referenceRadiativeTemperatureK! > 0).toBe(true);
    expect(env.referenceRadiativeTemperatureK! < env.includedFluxBlackbodyEquivalentK!).toBe(true);
    expect(h.scientificState.thermalLuminositySolar).toBeNull();
    expect(Object.isFrozen(env)).toBe(true);
    expect(Object.isFrozen(env.referenceCondensableCapsPa)).toBe(true);
  });

  it('exposes conditional pulsar spin-down and preserves its beaming/emission uncertainty', () => {
    for (const type of [ExtremeType.PULSAR, ExtremeType.MILLISECOND_PULSAR]) {
      const h = host(type);
      const rad = CompactHostEnvironmentEngine.resolveHostRadiation(h);
      const env = CompactHostEnvironmentEngine.project(h, basePlanet, rad);
      expect(rad.energeticBasis).toBe('DIPOLE_REFERENCE_ASSUMPTION');
      expect(rad.dipoleSpinDownPowerSolar! > rad.energeticLuminositySolar!).toBe(true);
      expect(env.energeticExposureAssessment).toBe('MODELED_ENERGETIC_CHANNEL');
      expect(env.modeledEnergeticFluxWm2! > 0).toBe(true);
      expect(env.referenceRadiativeTemperatureK! > 0).toBe(true);
      expect(h.scientificState.highEnergyLuminositySolar).toBeNull();
    }
  });

  it('does not equate magnetar magnetic field strength with an invented magnetic-flare luminosity', () => {
    const rad = CompactHostEnvironmentEngine.resolveHostRadiation(host(ExtremeType.MAGNETAR));
    expect(rad.magneticActivityEmissionUnresolved).toBe(true);
    expect(rad.energeticLuminositySolar).toBeNull();
    expect(rad.thermalBasis).toBe('FIDUCIAL_NEUTRON_SURFACE');
  });

  it('obeys inverse-square irradiance and exact Keplerian orbit-average eccentricity factor', () => {
    const h = host(ExtremeType.NEUTRON_STAR);
    const inner = CompactHostEnvironmentEngine.project(h, basePlanet);
    const outer = CompactHostEnvironmentEngine.project(h, {...basePlanet, semiMajorAxisAu: 2});
    const elliptical = CompactHostEnvironmentEngine.project(h, {...basePlanet, eccentricity: 0.6});
    expect(Math.abs(inner.modeledThermalFluxWm2! / outer.modeledThermalFluxWm2! - 4) < 1e-12).toBe(true);
    expect(Math.abs(elliptical.modeledThermalFluxWm2! / inner.modeledThermalFluxWm2! - 1.25) < 1e-12).toBe(true);
    expect(Math.abs(inner.referenceRadiativeTemperatureK! / outer.referenceRadiativeTemperatureK! - Math.sqrt(2)) < 1e-12).toBe(true);
  });

  it('is repeatable and uses no mutation of intrinsic compact planet or host', () => {
    const h = host(ExtremeType.PULSAR);
    const before = {...basePlanet};
    const a = CompactHostEnvironmentEngine.project(h, basePlanet);
    const b = CompactHostEnvironmentEngine.project(h, basePlanet);
    expect(a).toEqual(b);
    expect(basePlanet).toEqual(before);
    expect(Object.isFrozen(h.scientificState)).toBe(true);
  });

  it('models trace gas condensation CAPS, not an invented atmosphere pressure or gas content', () => {
    const env = CompactHostEnvironmentEngine.project(host(ExtremeType.NEUTRON_STAR), basePlanet);
    const caps = env.referenceCondensableCapsPa;
    expect(caps !== null).toBe(true);
    expect(env.atmosphericComposition).toBeNull();
    expect(env.surfacePressurePa).toBeNull();
    expect(env.waterPhaseAtReference === 'ICE_IF_PRESENT' || env.waterPhaseAtReference === 'PRESSURE_AND_INVENTORY_REQUIRED').toBe(true);
    expect(COMPACT_REFERENCE_THERMAL_ABSORPTION > COMPACT_REFERENCE_ENERGETIC_ABSORPTION).toBe(true);
  });

  it('rejects invalid orbits instead of generating infinities or atmospheric false certainty', () => {
    let threw = false;
    try { CompactHostEnvironmentEngine.project(host(ExtremeType.NEUTRON_STAR), {...basePlanet, semiMajorAxisAu: 0}); }
    catch (error) { threw = error instanceof RangeError; }
    expect(threw).toBe(true);
    threw = false;
    try { CompactHostEnvironmentEngine.project(host(ExtremeType.NEUTRON_STAR), {...basePlanet, eccentricity: 1}); }
    catch (error) { threw = error instanceof RangeError; }
    expect(threw).toBe(true);
  });
});
