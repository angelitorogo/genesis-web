import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator, MoonLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { type StellarSystemMultiplicity, StellarSystemMultiplicity as Multiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ProceduralTargetResolver } from '../regeneration/procedural-target-resolver';
import { StellarMultihostFormation, type GeneratedSingleHost, type GeneratedMultipleHost } from '../stellar/stellar-multihost-formation';
import { multihostPhysicalSourceKey } from '../stellar/stellar-multihost-physical-source-key';
import { StellarMultihostPublicTargetIndex } from '../stellar/stellar-multihost-public-target-index';
import { StellarSystemMultiplicitySelector } from '../stellar/stellar-system-multiplicity-selector';
import { V2GalacticPhysicalCompatibility } from '../universe/v2-galactic-physical-compatibility';

const ROOT = '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';
const v1 = new UniverseGenerationKey(UniverseSeed.parse(ROOT), GeneratorVersion.V1);
const v2 = new UniverseGenerationKey(UniverseSeed.parse(ROOT), GeneratorVersion.V2);

/** Find real, occupied V2 sector addresses; never use synthetic object indices. */
function realFixtures(): ReadonlyMap<StellarSystemMultiplicity, SystemLocator> {
  const physical = multihostPhysicalSourceKey(v2);
  const found = new Map<StellarSystemMultiplicity, SystemLocator>();
  for (let radius = 0; radius <= 5; radius += 1) {
    for (let y = -radius; y <= radius; y += 1) {
      for (let x = -radius; x <= radius; x += 1) {
        if (Math.max(Math.abs(x), Math.abs(y)) !== radius) continue;
        const sector = V2GalacticPhysicalCompatibility.sector(
          v2, 0n, new GalaxySectorCoordinates(x, y),
        );
        for (const locator of sector.content.systemLocators) {
          const seed = ProceduralTargetResolver.resolveTargetSeed(v2, locator);
          const kind = StellarSystemMultiplicitySelector.select(
            physical, seed as Parameters<typeof StellarSystemMultiplicitySelector.select>[1],
          );
          if (!found.has(kind)) found.set(kind, locator);
        }
        if (found.size === 3) return found;
      }
    }
  }
  throw new Error(`Missing real V2 SINGLE/BINARY/TRIPLE fixtures; only found ${[...found.keys()].map(k => k.name)}.`);
}

function parentAddress(locator: SystemLocator) {
  return [locator.galaxyIndex.toString(), locator.sectorKey.toString(), locator.galacticObjectIndex.toString()];
}

function planetInventory(source: GeneratedSingleHost) {
  expect(source.planets.length).toBe(source.planetarySystem?.planetCount ?? 0);
  expect(source.atmospheres.length).toBe(source.planets.length);
  expect(source.moonSystems.length).toBe(source.planets.length);
  return source.planets.map((planet, index) => {
    const atmosphere = source.atmospheres[index]!;
    const moons = source.moonSystems[index]!;
    expect(planet.hostPlanetarySystem).toBe(source.planetarySystem);
    expect(atmosphere.hostPlanet).toBe(planet);
    expect(moons.hostPlanet).toBe(planet);
    expect(moons.moonCount).toBe(moons.moonIdentities.length);
    expect(moons.relevantMoonCount).toBe(moons.relevantMoons.length);
    expect(moons.moonIdentities.map(identity => identity.moonOrdinal)).toEqual(
      moons.moonIdentities.map((_, i) => i + 1),
    );
    return {
      ordinal: planet.planetOrdinal,
      sourceIndex: planet.locator.bodyIndex.toString(),
      seed: planet.seed.normalizedValue,
      mass: planet.physicalProperties.massEarth,
      radius: planet.physicalProperties.radiusEarth,
      orbit: [planet.orbit.semiMajorAxisAu, planet.orbit.eccentricity,
        planet.orbit.inclinationDegrees, planet.orbitalPeriod.periodDays],
      moons: moons.moonIdentities.map(identity => {
        const relevant = moons.relevantMoons.find(moon => moon.moonOrdinal === identity.moonOrdinal);
        if (relevant !== undefined) expect(relevant.identity).toBe(identity);
        return {
          index: identity.locator.moonIndex.toString(),
          seed: identity.seed.normalizedValue,
          mass: relevant?.physicalProperties.massEarth ?? null,
          orbit: relevant === undefined ? null : [relevant.orbit.semiMajorAxisKilometers,
            relevant.orbit.eccentricity, relevant.orbit.orbitalPeriodDays],
        };
      }),
    };
  });
}

function hostInventory(source: GeneratedSingleHost) {
  expect(source.stellarSystem.seed.kind).toBe('system');
  return {
    host: source.label,
    // These are PRIVATE frozen physical identities; never use them as public routes.
    internalSeed: source.internalGenerationKey.universeSeed.normalizedValue,
    systemSeed: source.stellarSystem.seed.normalizedValue,
    stellar: [source.physical.initialMassSolar, source.physical.radiusSolar,
      source.physical.luminositySolar, source.physical.effectiveTemperatureKelvin],
    protectedExtent: source.protectedExtentAu,
    planets: planetInventory(source),
  };
}

function publicInventory(source: GeneratedMultipleHost) {
  const index = StellarMultihostPublicTargetIndex.build(source);
  expect(index.planets.length).toBe(source.publicPlanets.length);
  expect(index.moons.length).toBe(index.planets.reduce((sum, planet) => sum + planet.moonSystem.moonCount, 0));
  return {
    planets: index.planets.map((planet, i) => {
      expect(planet.publicLocator.bodyIndex).toBe(BigInt(i));
      expect(planet.publicLocator.galaxyIndex).toBe(source.parentLocator.galaxyIndex);
      expect(planet.publicLocator.sectorKey).toBe(source.parentLocator.sectorKey);
      expect(planet.publicLocator.galacticObjectIndex).toBe(source.parentLocator.galacticObjectIndex);
      expect(index.resolvePlanet(planet.publicLocator)).toBe(planet);
      return [planet.publicLocator.bodyIndex.toString(), planet.host,
        planet.sourcePlanetOrdinal, planet.planet.seed.normalizedValue,
        planet.planet.orbit.semiMajorAxisAu, planet.planet.orbit.eccentricity];
    }),
    moons: index.moons.map(moon => {
      expect(index.resolveMoon(moon.publicLocator)).toBe(moon);
      expect(moon.parent.moonSystem.moonIdentities).toContain(moon.sourceIdentity);
      return [moon.publicLocator.bodyIndex.toString(), moon.publicLocator.moonIndex.toString(),
        moon.sourceIdentity.seed.normalizedValue, moon.relevantMoon?.orbit.semiMajorAxisKilometers ?? null];
    }),
  };
}

/** Full, addressable deterministic scientific inventory, not a renderer snapshot. */
function capture(key: UniverseGenerationKey, locator: SystemLocator) {
  const physical = multihostPhysicalSourceKey(key);
  const parentSeed = ProceduralTargetResolver.resolveTargetSeed(key, locator).normalizedValue;
  const selection = StellarSystemMultiplicitySelector.select(
    physical, ProceduralTargetResolver.resolveTargetSeed(physical, locator) as Parameters<typeof StellarSystemMultiplicitySelector.select>[1],
  );
  const multiple = StellarMultihostFormation.generateOrNull(key, locator);
  if (selection === Multiplicity.SINGLE) {
    expect(multiple).toBeNull();
    const single = StellarMultihostFormation.generateV2SingleOrNull(key, locator);
    expect(single).not.toBeNull();
    return {
      key: [key.universeSeed.normalizedValue, key.generatorVersionCode],
      locator: parentAddress(locator), parentSeed, multiplicity: selection.name,
      hosts: [hostInventory(single!)], innerOrbit: null, outerOrbit: null,
      circumbinary: null, public: null,
    };
  }
  expect(multiple).not.toBeNull();
  expect(StellarMultihostFormation.generateV2SingleOrNull(key, locator)).toBeNull();
  expect(multiple!.parentGenerationKey).toBe(key);
  expect(multiple!.parentSystemSeedHex).toBe(parentSeed);
  expect(multiple!.multiplicity).toBe(selection);
  expect(multiple!.components.map(host => host.label)).toEqual(
    selection === Multiplicity.BINARY ? ['A', 'B'] : ['A', 'B', 'C'],
  );
  expect(new Set(multiple!.components.map(host => host.stellarSystem.seed.normalizedValue)).size)
    .toBe(multiple!.components.length);
  return {
    key: [key.universeSeed.normalizedValue, key.generatorVersionCode],
    locator: parentAddress(locator), parentSeed, multiplicity: selection.name,
    hosts: multiple!.components.map(hostInventory),
    innerOrbit: [multiple!.innerOrbit.semiMajorAxisAu, multiple!.innerOrbit.eccentricity,
      multiple!.innerOrbit.periodYears],
    outerOrbit: multiple!.outerOrbit === null ? null : [multiple!.outerOrbit.semiMajorAxisAu,
      multiple!.outerOrbit.eccentricity, multiple!.outerOrbit.periodYears],
    circumbinary: {
      status: multiple!.circumbinary.status,
      candidates: multiple!.circumbinary.candidateCount,
      inner: multiple!.circumbinary.stableInnerAu,
      outer: multiple!.circumbinary.stableOuterAu,
      planetSeeds: multiple!.circumbinary.planets.map(planet => planet.seed.normalizedValue),
      orbits: multiple!.circumbinary.planets.map(planet => [planet.orbit.semiMajorAxisAu,
        planet.orbit.eccentricity, planet.orbitalPeriod.periodYears]),
    },
    public: publicInventory(multiple!),
  };
}

describe('12.3 — deterministic V2 SINGLE/BINARY/TRIPLE physical system generation', () => {
  const locators = new Map<StellarSystemMultiplicity, SystemLocator>();
  const baseline = new Map<StellarSystemMultiplicity, ReturnType<typeof capture>>();

  beforeAll(() => {
    const located = realFixtures();
    for (const kind of [Multiplicity.SINGLE, Multiplicity.BINARY, Multiplicity.TRIPLE]) {
      const locator = located.get(kind)!;
      locators.set(kind, locator);
      baseline.set(kind, capture(v2, locator));
    }
  }, 120_000);

  it.each([Multiplicity.SINGLE, Multiplicity.BINARY, Multiplicity.TRIPLE])(
    'regenerates complete %s science from a copied/serialized V2 key', kind => {
      const locator = locators.get(kind)!;
      const restored = new UniverseGenerationKey(
        UniverseSeed.parse(v2.universeSeed.serialize()),
        GeneratorVersion.fromCode(v2.generatorVersionCode),
      );
      expect(restored).not.toBe(v2);
      expect(capture(restored, new SystemLocator(
        locator.galaxyIndex, locator.sectorKey, locator.galacticObjectIndex,
      ))).toEqual(baseline.get(kind));
    }, 120_000,
  );

  it('produces the same three complete systems in reverse generation order', () => {
    for (const kind of [Multiplicity.TRIPLE, Multiplicity.BINARY, Multiplicity.SINGLE]) {
      expect(capture(v2, locators.get(kind)!)).toEqual(baseline.get(kind));
    }
  }, 120_000);

  it('keeps V1 parent seeds/multiplicity and existing V1 binary formation untouched', () => {
    const locator = locators.get(Multiplicity.BINARY)!;
    const before = StellarMultihostFormation.generateOrNull(v1, locator)!;
    const beforeInventory = [before.parentSystemSeedHex, before.components.map(hostInventory),
      publicInventory(before), before.innerOrbit.semiMajorAxisAu];
    expect(ProceduralTargetResolver.resolveTargetSeed(v1, locator).normalizedValue).toBe(
      ProceduralTargetResolver.resolveTargetSeed(v2, locator).normalizedValue,
    );
    capture(v2, locators.get(Multiplicity.TRIPLE)!);
    const after = StellarMultihostFormation.generateOrNull(v1, locator)!;
    expect([after.parentSystemSeedHex, after.components.map(hostInventory),
      publicInventory(after), after.innerOrbit.semiMajorAxisAu]).toEqual(beforeInventory);
    expect(() => StellarMultihostFormation.generateV2SingleOrNull(v1, locator)).toThrow(RangeError);
  }, 120_000);

  it('isolates distinct root seeds and distinct system addresses', () => {
    const locator = locators.get(Multiplicity.SINGLE)!;
    const nextAddress = new SystemLocator(locator.galaxyIndex, locator.sectorKey,
      locator.galacticObjectIndex + 1n);
    const differentRoot = new UniverseGenerationKey(
      UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2'), GeneratorVersion.V2,
    );
    expect(ProceduralTargetResolver.resolveTargetSeed(v2, locator).normalizedValue)
      .not.toBe(ProceduralTargetResolver.resolveTargetSeed(v2, nextAddress).normalizedValue);
    expect(ProceduralTargetResolver.resolveTargetSeed(v2, locator).normalizedValue)
      .not.toBe(ProceduralTargetResolver.resolveTargetSeed(differentRoot, locator).normalizedValue);
    expect(new Set([...baseline.values()].map(entry => entry.parentSeed)).size).toBe(3);
  });

  it('preserves parent-only resolution and rejects public V2 planet/moon ordinals until stage 13', () => {
    const locator = locators.get(Multiplicity.BINARY)!;
    expect(() => ProceduralTargetResolver.resolveTargetSeed(v2,
      new BodyLocator(locator.galaxyIndex, locator.sectorKey, locator.galacticObjectIndex, 0n)))
      .toThrow('stage-13 multihost public index');
    expect(() => ProceduralTargetResolver.resolveTargetSeed(v2,
      new MoonLocator(locator.galaxyIndex, locator.sectorKey, locator.galacticObjectIndex, 0n, 0n)))
      .toThrow('stage-13 multihost public index');
  });

  it('regenerates a real galactic-sector catalogue without changing addresses or system seed', () => {
    const first = V2GalacticPhysicalCompatibility.sector(v2, 0n, new GalaxySectorCoordinates(0, 0));
    const replay = V2GalacticPhysicalCompatibility.sector(v2.copy(), 0n, new GalaxySectorCoordinates(0, 0));
    expect(first.content.seed.normalizedValue).toBe(replay.content.seed.normalizedValue);
    expect(first.content.systemLocators).toEqual(replay.content.systemLocators);
    expect(first.content.generationKey.generatorVersion).toBe(GeneratorVersion.V2);
    for (const locator of first.content.systemLocators.slice(0, 3)) {
      expect(ProceduralTargetResolver.resolveTargetSeed(v2, locator).normalizedValue)
        .toBe(ProceduralTargetResolver.resolveTargetSeed(v1, locator).normalizedValue);
    }
  });
});
