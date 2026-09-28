import { GeneratorVersion } from '../../domain/generation/generator-version';
import { type SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { PlanetType } from '../../domain/planetary/planet-type';
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GalaxySectorContentGenerator } from '../sector/galaxy-sector-content-generator';
import { StellarDesignationGenerator } from '../stellar/stellar-designation-generator';
import {
  StellarMultihostFormation,
  type GeneratedSingleHost,
} from '../stellar/stellar-multihost-formation';
import { multihostPhysicalSourceKey } from '../stellar/stellar-multihost-physical-source-key';
import { GalaxyGenerator } from '../universe/galaxy-generator';
import { type Planet } from '../../domain/planetary/planet';

const PUBLIC_V2_KEY = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),
  GeneratorVersion.V2,
);

function locatorAt(
  x: number,
  y: number,
  systemName: string,
): SystemLocator {
  const physicalKey = multihostPhysicalSourceKey(PUBLIC_V2_KEY);
  const galaxy = GalaxyGenerator.generate(physicalKey, 0n);

  const content = GalaxySectorContentGenerator.generate(
    galaxy,
    new GalaxySectorCoordinates(x, y),
  );

  const locator = content.systemLocators.find(candidate =>
    StellarDesignationGenerator.generate(
      physicalKey,
      candidate,
    ).name === systemName,
  );

  if (locator === undefined) {
    throw new Error(`Expected ${systemName} in (${x}, ${y}).`);
  }

  return locator;
}

function planetsFor(locator: SystemLocator): readonly Planet[] {
  const multiple = StellarMultihostFormation.generateOrNull(
    PUBLIC_V2_KEY,
    locator,
  );

  if (multiple !== null) {
    return Object.freeze(
      multiple.publicPlanets.map(entry => entry.planet),
    );
  }

  const single: GeneratedSingleHost | null =
    StellarMultihostFormation.generateV2SingleOrNull(
      PUBLIC_V2_KEY,
      locator,
    );

  if (single === null) {
    throw new Error('Expected SINGLE or multiple physical host.');
  }

  return single.planets;
}

function planetNamed(
  planets: readonly Planet[],
  name: string,
): Planet {
  const planet = planets.find(candidate => candidate.designation.name === name);

  if (planet === undefined) {
    throw new Error(`Expected real-world regression planet ${name}.`);
  }

  return planet;
}

describe('C2 giant-family precedence real-world regressions', () => {
  it('reclassifies Tresar h and Tresar j as GAS_GIANT because their whole-planet envelope state satisfies the frozen gas rule', () => {
    const triaraia = planetsFor(
      locatorAt(22, 20, 'Triaraia'),
    );

    const tresarH = planetNamed(triaraia, 'Tresar h');
    const tresarJ = planetNamed(triaraia, 'Tresar j');

    expect(tresarH.physicalProperties.massEarth).toBeGreaterThanOrEqual(15);
    expect(tresarH.physicalProperties.envelopeMassFraction01).toBeGreaterThanOrEqual(0.50);
    expect(tresarH.typeClassification.sourceIceBearingSolidFraction01).toBeGreaterThanOrEqual(0.35);
    expect(tresarH.typeClassification.planetType).toBe(PlanetType.GAS_GIANT);

    expect(tresarJ.physicalProperties.massEarth).toBeGreaterThanOrEqual(15);
    expect(tresarJ.physicalProperties.envelopeMassFraction01).toBeGreaterThanOrEqual(0.50);
    expect(tresarJ.typeClassification.sourceIceBearingSolidFraction01).toBeGreaterThanOrEqual(0.35);
    expect(tresarJ.typeClassification.planetType).toBe(PlanetType.GAS_GIANT);
  });

  it('keeps Chuthoria d/e as ICE_GIANT because neither satisfies a frozen GAS_GIANT route', () => {
    const chuthoria = planetsFor(
      locatorAt(-22, 24, 'Chuthoria'),
    );

    const d = planetNamed(chuthoria, 'Chuthoria d');
    const e = planetNamed(chuthoria, 'Chuthoria e');

    expect(d.typeClassification.planetType).toBe(PlanetType.ICE_GIANT);
    expect(e.typeClassification.planetType).toBe(PlanetType.ICE_GIANT);

    expect(
      d.physicalProperties.massEarth >= 30 &&
      d.physicalProperties.envelopeMassFraction01 >= 0.20 ||
      d.physicalProperties.massEarth >= 15 &&
      d.physicalProperties.envelopeMassFraction01 >= 0.50,
    ).toBe(false);

    expect(
      e.physicalProperties.massEarth >= 30 &&
      e.physicalProperties.envelopeMassFraction01 >= 0.20 ||
      e.physicalProperties.massEarth >= 15 &&
      e.physicalProperties.envelopeMassFraction01 >= 0.50,
    ).toBe(false);
  });
});
