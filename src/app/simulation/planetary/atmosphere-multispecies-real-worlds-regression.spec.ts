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

function locatorAt(x: number, y: number, systemName: string) {
  const galaxy = GalaxyGenerator.generate(GENERATION_KEY, 0n);
  const content = GalaxySectorContentGenerator.generate(
    galaxy,
    new GalaxySectorCoordinates(x, y),
  );
  const physicalKey = multihostPhysicalSourceKey(GENERATION_KEY);
  const locator = content.systemLocators.find(candidate =>
    StellarDesignationGenerator.generate(physicalKey, candidate).name === systemName,
  );
  if (locator === undefined) throw new Error(`Expected ${systemName} in (${x}, ${y}).`);
  return locator;
}

function phase(atmosphere: any) {
  const result = atmosphere.greenhouseEffect.condensableEquilibriumState;
  if (result === null) throw new Error('Expected multispecies condensable equilibrium state.');
  return result;
}

function gas(atmosphere: any, species: AtmosphereGas) {
  const result = phase(atmosphere).species(species);
  if (result === null) throw new Error(`Expected ${species} equilibrium state.`);
  return result;
}

describe('real generated worlds multispecies condensation regression', () => {
  it('Pulaer c resolves a microscopic atmosphere by partial pressure, not percentage alone', () => {
    const single = StellarMultihostFormation.generateV2SingleOrNull(
      GENERATION_KEY,
      locatorAt(15, 9, 'Pulaer'),
    )!;
    const index = single.planets.findIndex(planet => planet.designation.name === 'Pulaer c');
    const atmosphere = single.atmospheres[index];

    expect(atmosphere.retentionState.retainedSurfacePressurePascal).toBeLessThan(1);
    expect(atmosphere.retainedSurfacePressurePascal).toBeGreaterThan(0);
    expect(gas(atmosphere, AtmosphereGas.CARBON_DIOXIDE).condensedFractionOfRetained01)
      .toBeGreaterThan(0.9);
    expect(gas(atmosphere, AtmosphereGas.METHANE).condensedFractionOfRetained01)
      .toBeLessThan(0.01);
  });

  it('Vathum d strongly collapses incompatible retained condensables while preserving retained inventory diagnostics', () => {
    const single = StellarMultihostFormation.generateV2SingleOrNull(
      GENERATION_KEY,
      locatorAt(3, 25, 'Vathum'),
    )!;
    const index = single.planets.findIndex(planet => planet.designation.name === 'Vathum d');
    const atmosphere = single.atmospheres[index];
    const equilibrium = phase(atmosphere);

    expect(atmosphere.retainedSurfacePressurePascal)
      .toBeLessThan(atmosphere.retentionState.retainedSurfacePressurePascal! * 0.5);
    expect(gas(atmosphere, AtmosphereGas.CARBON_DIOXIDE).condensedFractionOfRetained01)
      .toBeGreaterThan(0.99);

    // Vathum d's atmospheric source is allowed to change when the host planet's
    // compositional taxonomy changes. Do not require a condensable species that
    // is no longer present in the retained inventory. Instead, verify the actual
    // retained condensables remain phase-consistent.
    for (const species of equilibrium.speciesEquilibria) {
      expect(species.effectivePartialPressurePascal)
        .toBeLessThanOrEqual(species.sourcePartialPressurePascal * (1 + 1e-7));
      expect(species.effectivePartialPressurePascal - species.saturationPressurePascal)
        .toBeLessThanOrEqual(Math.max(
          0.05,
          1e-7 * Math.max(1, species.sourcePartialPressurePascal, species.saturationPressurePascal),
        ));
    }

    // A large quantitative pressure collapse does not necessarily cross a
    // coarse categorical regime boundary (for example THIN -> THIN). The
    // quantitative pressure-ratio assertion above is the authoritative
    // regression for phase collapse; do not couple it to presentation bands.
  });

  it('Heriia c uses a cold-trap projection without collapsing its trace atmosphere or CO2 arbitrarily', () => {
    const single = StellarMultihostFormation.generateV2SingleOrNull(
      GENERATION_KEY,
      locatorAt(2, 17, 'Heriia'),
    )!;
    const index = single.planets.findIndex(planet => planet.designation.name === 'Heriia c');
    const atmosphere = single.atmospheres[index];
    const equilibrium = phase(atmosphere);

    expect(atmosphere.hostPlanet.isTidallySynchronized).toBe(true);
    expect(equilibrium.coldTrapWeight01).toBeGreaterThan(0);
    expect(equilibrium.effectiveCondensationTemperatureKelvin)
      .toBeLessThan(equilibrium.meanSurfaceTemperatureKelvin);
    expect(atmosphere.retainedSurfacePressurePascal).toBeGreaterThan(10);
    expect(gas(atmosphere, AtmosphereGas.CARBON_DIOXIDE).condensedFractionOfRetained01)
      .toBeLessThan(0.01);
    expect(gas(atmosphere, AtmosphereGas.SULFUR_DIOXIDE).condensedFractionOfRetained01)
      .toBeGreaterThan(0.5);
  });

  it('Triaraia B-4 keeps a substantial intermediate atmosphere because its CO2 remains below saturation', () => {
    const multi = StellarMultihostFormation.generateOrNull(
      GENERATION_KEY,
      locatorAt(22, 20, 'Triaraia'),
    )!;
    const entry = multi.publicPlanets.find(
      planet => planet.host === 'B' && planet.sourcePlanetOrdinal === 4,
    )!;
    const atmosphere = entry.atmosphere;

    expect(atmosphere.retainedSurfacePressurePascal).toBeGreaterThan(150_000);
    expect(gas(atmosphere, AtmosphereGas.CARBON_DIOXIDE).condensedFractionOfRetained01)
      .toBeLessThan(1e-6);
  });

  it('leaves warm Chuthoria A-1 and hot Triaraia A-3 non-water gases unchanged', () => {
    const chuthoria = StellarMultihostFormation.generateOrNull(
      GENERATION_KEY,
      locatorAt(-22, 24, 'Chuthoria'),
    )!;
    const chuthoriaAtmosphere = chuthoria.publicPlanets.find(
      planet => planet.host === 'A' && planet.sourcePlanetOrdinal === 1,
    )!.atmosphere;

    const triaraia = StellarMultihostFormation.generateOrNull(
      GENERATION_KEY,
      locatorAt(22, 20, 'Triaraia'),
    )!;
    const triaraiaAtmosphere = triaraia.publicPlanets.find(
      planet => planet.host === 'A' && planet.sourcePlanetOrdinal === 3,
    )!.atmosphere;

    for (const atmosphere of [chuthoriaAtmosphere, triaraiaAtmosphere]) {
      expect(gas(atmosphere, AtmosphereGas.CARBON_DIOXIDE).condensedFractionOfRetained01).toBe(0);
      expect(gas(atmosphere, AtmosphereGas.SULFUR_DIOXIDE).condensedFractionOfRetained01).toBe(0);
    }
  });

  it('is exactly deterministic for the same V2 public system and frozen physical source', () => {
    const locator = locatorAt(3, 25, 'Vathum');
    expect(StellarMultihostFormation.generateV2SingleOrNull(GENERATION_KEY, locator))
      .toEqual(StellarMultihostFormation.generateV2SingleOrNull(GENERATION_KEY, locator));
  });
});
