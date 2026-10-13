import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { ProceduralTargetResolver } from '../regeneration/procedural-target-resolver';
import { StellarSystemMultiplicitySelector } from '../stellar/stellar-system-multiplicity-selector';
import { multihostPhysicalSourceKey } from '../stellar/stellar-multihost-physical-source-key';
import { CompactHostPlanetarySystemGenerator } from './compact-host-planetary-system-generator';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const v2 = new UniverseGenerationKey(seed, GeneratorVersion.V2);
const v1 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V1);
const physical = multihostPhysicalSourceKey(v2);
const categories = [ExtremeType.NEUTRON_STAR, ExtremeType.PULSAR,
  ExtremeType.MILLISECOND_PULSAR, ExtremeType.MAGNETAR,
  ExtremeType.STELLAR_MASS_BLACK_HOLE];

function familySamples() {
  const result = new Map<string, NonNullable<ReturnType<typeof CompactHostPlanetarySystemGenerator.generateOrNull>>>();
  let withPlanets: NonNullable<ReturnType<typeof CompactHostPlanetarySystemGenerator.generateOrNull>> | null = null;
  let nonCompactSingle: SystemLocator | null = null;
  let multiple: SystemLocator | null = null;
  for (let index = 0n; index < 20000n; index++) {
    const locator = new SystemLocator(0n, 0n, index);
    const parentSeed = ProceduralTargetResolver.resolveTargetSeed(physical, locator);
    const architecture = StellarSystemMultiplicitySelector.select(physical,
      parentSeed as Parameters<typeof StellarSystemMultiplicitySelector.select>[1]);
    if (architecture !== StellarSystemMultiplicity.SINGLE) {
      multiple ??= locator;
      continue;
    }
    const found = CompactHostPlanetarySystemGenerator.generateOrNull(v2, locator);
    if (found) {
      if (!result.has(found.host.type)) result.set(found.host.type, found);
      if (found.planets.length) withPlanets ??= found;
    } else {
      nonCompactSingle ??= locator;
    }
    if (result.size === categories.length && withPlanets && nonCompactSingle && multiple) break;
  }
  if (result.size !== categories.length || !withPlanets || !nonCompactSingle || !multiple) {
    throw new Error('Deterministic compact-host fixture not found in 20,000 candidate system identities.');
  }
  return { result, withPlanets, nonCompactSingle, multiple };
}

// A fixture search across known deterministic system identities is intentional:
// no special-case seed, planet ID, or production override is introduced.
let fixtures: ReturnType<typeof familySamples> | null = null;
function getFixtures() { return fixtures ??= familySamples(); }

describe('31.2: independent compact-host V2 SINGLE snapshot generator', () => {
  it('produces all five exclusive compact families from unmodified V2 parent identities', () => {
    const { result } = getFixtures();
    expect([...result.keys()].sort()).toEqual([...categories].sort());
    for (const [type, system] of result) {
      expect(system.modelVersion).toBe('COMPACT_HOST_SNAPSHOT_31_2_V1');
      expect(system.host.type).toBe(type);
      expect(system.host.generationKey.equals(v2)).toBe(true);
      expect(system.architecture).toBe('SINGLE');
      expect(system.status).toBe('SNAPSHOT_MODEL_UNVALIDATED_N_BODY');
      expect(Object.isFrozen(system.host.scientificState)).toBe(true);
      expect(Object.isFrozen(system.planets)).toBe(true);
      expect(system.planets.length <= 3).toBe(true);
    }
  });

  it('keeps V1, conventional SINGLE and every BINARY/TRIPLE unmodified', () => {
    const { result, nonCompactSingle, multiple } = getFixtures();
    for (const host of result.values()) {
      expect(CompactHostPlanetarySystemGenerator.generateOrNull(v1, host.host.systemLocator)).toBeNull();
    }
    expect(CompactHostPlanetarySystemGenerator.generateOrNull(v2, nonCompactSingle)).toBeNull();
    expect(CompactHostPlanetarySystemGenerator.generateOrNull(v2, multiple)).toBeNull();
  });

  it('31.4 reuses verified physical multiplicity without reselecting or changing generation', () => {
    const { result, nonCompactSingle, multiple } = getFixtures();
    const compact = [...result.values()][0]!;
    const compactLocator = compact.host.systemLocator;
    const multipleSeed = ProceduralTargetResolver.resolveTargetSeed(physical, multiple);
    const multipleMultiplicity = StellarSystemMultiplicitySelector.select(
      physical, multipleSeed as Parameters<typeof StellarSystemMultiplicitySelector.select>[1],
    );
    expect(multipleMultiplicity).not.toBe(StellarSystemMultiplicity.SINGLE);

    const selectSpy = vi.spyOn(StellarSystemMultiplicitySelector, 'select');
    try {
      const ordinary = CompactHostPlanetarySystemGenerator.generateOrNull(v2, compactLocator);
      expect(selectSpy).toHaveBeenCalledTimes(1);
      selectSpy.mockClear();

      const preselected = CompactHostPlanetarySystemGenerator.generateOrNull(
        v2, compactLocator, StellarSystemMultiplicity.SINGLE,
      );
      expect(selectSpy).not.toHaveBeenCalled();
      expect(preselected).toEqual(ordinary);
      expect(preselected?.host).toEqual(compact.host);
      expect(CompactHostPlanetarySystemGenerator.generateOrNull(
        v2, nonCompactSingle, StellarSystemMultiplicity.SINGLE,
      )).toBeNull();
      expect(CompactHostPlanetarySystemGenerator.generateOrNull(
        v2, multiple, multipleMultiplicity,
      )).toBeNull();
      expect(selectSpy).not.toHaveBeenCalled();
    } finally {
      selectSpy.mockRestore();
    }
  });

  it('regenerates identical values without changing parent generation identity', () => {
    const { withPlanets } = getFixtures();
    const locator = withPlanets.host.systemLocator;
    const seedBefore = ProceduralTargetResolver.resolveTargetSeed(physical, locator).normalizedValue;
    const replay = CompactHostPlanetarySystemGenerator.generateOrNull(v2, locator)!;
    expect(replay.host.type).toBe(withPlanets.host.type);
    expect(replay.host.scientificState).toEqual(withPlanets.host.scientificState);
    expect(replay.planets.map(p => ({ ...p, locator: [p.locator.galaxyIndex,
      p.locator.sectorKey, p.locator.galacticObjectIndex, p.locator.bodyIndex] })))
      .toEqual(withPlanets.planets.map(p => ({ ...p, locator: [p.locator.galaxyIndex,
        p.locator.sectorKey, p.locator.galacticObjectIndex, p.locator.bodyIndex] })));
    expect(ProceduralTargetResolver.resolveTargetSeed(physical, locator).normalizedValue).toBe(seedBefore);
    expect(seed.normalizedValue).toBe('7F21A9D418CE4B7092F16A0C6E35D8B1');
  });

  it('maintains positive masses, types, densities, periods, non-crossing orbits and Roche/Hill screens', () => {
    const { withPlanets } = getFixtures();
    expect(withPlanets.planets.length > 0).toBe(true);
    let prior: (typeof withPlanets.planets)[number] | null = null;
    for (const [index, planet] of withPlanets.planets.entries()) {
      expect(planet.ordinal).toBe(index + 1);
      expect(planet.locator.bodyIndex).toBe(BigInt(index));
      expect(planet.massEarth > 0 && planet.radiusEarth > 0).toBe(true);
      expect(planet.meanDensityKgM3 > 0 && planet.orbitalPeriodDays > 0).toBe(true);
      expect(planet.periastronAu > planet.rocheLimitAu).toBe(true);
      expect(planet.apoastronAu > planet.semiMajorAxisAu).toBe(true);
      expect(planet.eccentricity < 0.1).toBe(true);
      expect(planet.bulkKind === 'ROCKY' || planet.bulkKind === 'SUPER_EARTH').toBe(true);
      if (prior) {
        expect(planet.periastronAu > prior.apoastronAu).toBe(true);
        const mutualHill = (prior.semiMajorAxisAu + planet.semiMajorAxisAu) / 2 *
          ((prior.massEarth + planet.massEarth) * 5.9722e24 /
            (3 * withPlanets.host.scientificState.massSolar * 1.98847e30)) ** (1 / 3);
        expect(planet.semiMajorAxisAu - prior.semiMajorAxisAu > 8 * mutualHill).toBe(true);
      }
      prior = planet;
    }
  });

  it('never fabricates accretion luminosity, a BH photosphere or observed irradiation', () => {
    const { result } = getFixtures();
    for (const host of result.values()) {
      expect(host.host.scientificState.accretionLuminositySolar).toBeNull();
      expect(host.host.scientificState.thermalLuminositySolar).toBeNull();
      expect(host.host.scientificState.highEnergyLuminositySolar).toBeNull();
      expect(host.host.extremeObjectLocator).toBeNull();
    }
    const bh = result.get(ExtremeType.STELLAR_MASS_BLACK_HOLE)!;
    expect(bh.host.scientificState.activityRegime).toBe('QUIESCENT');
    expect(bh.host.scientificState.surfaceMagneticFieldTesla).toBeNull();
    const msp = result.get(ExtremeType.MILLISECOND_PULSAR)!;
    expect(msp.host.scientificState.rotationPeriodSeconds! < 0.021).toBe(true);
    const magnetar = result.get(ExtremeType.MAGNETAR)!;
    expect(magnetar.host.scientificState.activityRegime).toBe('MAGNETICALLY_ACTIVE');
  });
});
