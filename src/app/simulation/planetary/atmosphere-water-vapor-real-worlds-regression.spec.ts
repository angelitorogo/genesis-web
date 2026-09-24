import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GalaxySectorContentGenerator } from '../sector/galaxy-sector-content-generator';
import { StellarDesignationGenerator } from '../stellar/stellar-designation-generator';
import { StellarMultihostFormation } from '../stellar/stellar-multihost-formation';
import { multihostPhysicalSourceKey } from '../stellar/stellar-multihost-physical-source-key';
import { GalaxyGenerator } from '../universe/galaxy-generator';

const GENERATION_KEY = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),
  GeneratorVersion.V2,
);

function systemLocatorAt(x: number, y: number, systemName: string) {
  const galaxy = GalaxyGenerator.generate(GENERATION_KEY, 0n);
  const content = GalaxySectorContentGenerator.generate(
    galaxy,
    new GalaxySectorCoordinates(x, y),
  );
  const physicalKey = multihostPhysicalSourceKey(GENERATION_KEY);
  const locator = content.systemLocators.find(candidate =>
    StellarDesignationGenerator.generate(physicalKey, candidate).name === systemName,
  );
  if (locator === undefined) {
    throw new Error(`Expected ${systemName} in sector (${x}, ${y}).`);
  }
  return locator;
}

function initialWaterMixingRatio(atmosphere: any): number {
  return atmosphere.retentionState.retainedGasComponents.find(
    (component: any) => component.gas === AtmosphereGas.WATER_VAPOR,
  )?.moleFraction01 ?? 0;
}

function effectiveWaterMixingRatio(atmosphere: any): number {
  return atmosphere.retainedGasComposition.find(
    (component: any) => component.gas === AtmosphereGas.WATER_VAPOR,
  )?.moleFraction01 ?? 0;
}

function assertThermodynamicWaterClosure(atmosphere: any): void {
  const equilibrium = atmosphere.greenhouseEffect.waterVaporEquilibriumState;
  expect(equilibrium).not.toBeNull();
  expect(equilibrium.converged).toBe(true);
  expect(equilibrium.iterationCount).toBeLessThanOrEqual(8);
  expect(equilibrium.effectiveWaterVaporPartialPressurePascal)
    .toBeLessThanOrEqual(equilibrium.saturationVaporPressurePascal * 1.000001);
  expect(equilibrium.effectiveSurfacePressurePascal)
    .toBeLessThanOrEqual(equilibrium.sourceSurfacePressurePascal);
  expect(atmosphere.retainedGasComposition.reduce(
    (sum: number, component: any) => sum + component.moleFraction01,
    0,
  )).toBeCloseTo(1, 10);
  expect(
    atmosphere.waterIceFraction01 +
    atmosphere.waterLiquidFraction01 +
    atmosphere.waterVaporFraction01,
  ).toBeCloseTo(1, 10);
  expect(atmosphere.waterInventory.sourceRetainedAtmosphericWaterVaporMoleFraction01)
    .toBeCloseTo(initialWaterMixingRatio(atmosphere), 12);
}

describe('real generated worlds thermodynamic H2O regression', () => {
  it('keeps Tromia e warm/oceanic while condensing its multi-bar supersaturated H2O inventory', () => {
    const locator = systemLocatorAt(8, -32, 'Tromia');
    const single = StellarMultihostFormation.generateV2SingleOrNull(GENERATION_KEY, locator)!;
    const index = single.planets.findIndex(planet => planet.designation.name === 'Tromia e');
    const atmosphere = single.atmospheres[index];

    assertThermodynamicWaterClosure(atmosphere);
    expect(effectiveWaterMixingRatio(atmosphere)).toBeLessThan(initialWaterMixingRatio(atmosphere));
    expect(atmosphere.greenhouseEffect.waterVaporEquilibriumState!.condensedWaterPartialPressurePascal)
      .toBeGreaterThan(100_000);
    expect(atmosphere.surfaceLiquidWaterCoverageFraction01).toBeGreaterThan(0.5);
    expect(atmosphere.hasPersistentSurfaceLiquidWater).toBe(true);
  });

  it('keeps Menaar B-1 strongly greenhouse but limits H2O to the converged saturation ceiling', () => {
    const locator = systemLocatorAt(18, -30, 'Menaar');
    const multi = StellarMultihostFormation.generateOrNull(GENERATION_KEY, locator)!;
    const entry = multi.publicPlanets.find(planet => planet.host === 'B' && planet.sourcePlanetOrdinal === 1)!;
    const atmosphere = entry.atmosphere;

    assertThermodynamicWaterClosure(atmosphere);
    expect(effectiveWaterMixingRatio(atmosphere)).toBeLessThan(initialWaterMixingRatio(atmosphere));
    expect(atmosphere.greenhouseSurfaceWarmingKelvin).toBeGreaterThan(50);
    expect(atmosphere.tidalHeatingIndex01).toBeLessThanOrEqual(1);
  });

  it('reduces supersaturated H2O on Phoseria d while retaining liquid-water surface conditions', () => {
    const locator = systemLocatorAt(40, 13, 'Phoseria');
    const single = StellarMultihostFormation.generateV2SingleOrNull(GENERATION_KEY, locator)!;
    const index = single.planets.findIndex(planet => planet.designation.name === 'Phoseria d');
    const atmosphere = single.atmospheres[index];

    assertThermodynamicWaterClosure(atmosphere);
    expect(effectiveWaterMixingRatio(atmosphere)).toBeLessThan(initialWaterMixingRatio(atmosphere));
    expect(atmosphere.surfaceLiquidWaterCoverageFraction01).toBeGreaterThan(0);
  });

  it('removes the impossible ~13 percent vapor from temperate Stinaion e without deleting its water inventory', () => {
    const locator = systemLocatorAt(0, 16, 'Stinaion');
    const single = StellarMultihostFormation.generateV2SingleOrNull(GENERATION_KEY, locator)!;
    const index = single.planets.findIndex(planet => planet.designation.name === 'Stinaion e');
    const atmosphere = single.atmospheres[index];

    assertThermodynamicWaterClosure(atmosphere);
    expect(initialWaterMixingRatio(atmosphere)).toBeGreaterThan(0.10);
    expect(effectiveWaterMixingRatio(atmosphere)).toBeLessThan(0.02);

    const waterVaporFraction01 = atmosphere.waterVaporFraction01;
    expect(waterVaporFraction01).not.toBeNull();
    if (waterVaporFraction01 === null) {
      throw new Error('Expected Stinaion e to expose a resolved surface-water vapor fraction.');
    }
    expect(atmosphere.waterLiquidFraction01).toBeGreaterThan(waterVaporFraction01);
  });

  it('leaves Chuthoria A-2 overwhelmingly icy with only trace atmospheric H2O', () => {
    const locator = systemLocatorAt(-22, 24, 'Chuthoria');
    const multi = StellarMultihostFormation.generateOrNull(GENERATION_KEY, locator)!;
    const entry = multi.publicPlanets.find(planet => planet.host === 'A' && planet.sourcePlanetOrdinal === 2)!;
    const atmosphere = entry.atmosphere;

    assertThermodynamicWaterClosure(atmosphere);
    expect(effectiveWaterMixingRatio(atmosphere)).toBeLessThan(0.001);
    expect(atmosphere.waterIceFraction01).toBeGreaterThan(0.95);
    expect(atmosphere.waterVaporFraction01).toBeLessThan(0.01);
    expect(atmosphere.hasPersistentSurfaceLiquidWater).toBe(false);
  });
});
