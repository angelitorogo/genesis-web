import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarEvolutionInput } from '../../domain/stellar/stellar-evolution-input';
import { StellarLifetimeProfile } from '../../domain/stellar/stellar-lifetime-profile';
import { StellarPhysicalProperties } from '../../domain/stellar/stellar-physical-properties';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import {
  StellarMultihostFormation,
  type GeneratedMultipleHost,
  type GeneratedSingleHost,
} from './stellar-multihost-formation';
import { StellarEvolutionEngine } from './stellar-evolution-engine';
import { multihostPhysicalSourceKey } from './stellar-multihost-physical-source-key';
import { StellarPostSupernovaPlanetaryDynamics } from './stellar-post-supernova-planetary-dynamics';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V1,
);

/**
 * Use a real populated phase-18 aggregate, but do not depend on the procedural
 * population happening to contain an already evolved supernova progenitor.
 * The post-SN state is injected explicitly below through the same phase-14
 * evolution contract used by production.
 */
function populatedFixture(
  multiplicity: typeof StellarSystemMultiplicity.BINARY | typeof StellarSystemMultiplicity.TRIPLE,
): GeneratedMultipleHost {
  for (let index = 0n; index < 128n; index += 1n) {
    const source = StellarMultihostFormation.generateOrNull(
      key,
      new SystemLocator(0n, 0n, index),
    );
    if (source === null || source.multiplicity !== multiplicity || source.publicPlanets.length === 0) {
      continue;
    }
    return source;
  }
  throw new Error(`No populated ${multiplicity.name} multihost fixture in first 128 objects.`);
}

function forceGroundTruthComponent(
  source: GeneratedMultipleHost,
  host: GeneratedSingleHost,
  initialMassSolar: number,
  ageBillionYears: number,
): GeneratedSingleHost {
  const physicalKey = multihostPhysicalSourceKey(source.parentGenerationKey);
  const assessment = StellarEvolutionEngine.evaluate(
    physicalKey,
    new StellarEvolutionInput(initialMassSolar, 1, ageBillionYears),
  );
  const terminal = assessment.mainSequenceLifetimeBillionYears === null ||
    assessment.postMainSequenceDurationBillionYears === null
    ? null
    : assessment.mainSequenceLifetimeBillionYears + assessment.postMainSequenceDurationBillionYears;

  return Object.freeze({
    ...host,
    physical: new StellarPhysicalProperties(
      initialMassSolar,
      initialMassSolar,
      host.physical.radiusSolar,
      host.physical.luminositySolar,
      host.physical.effectiveTemperatureKelvin,
    ),
    lifetime: new StellarLifetimeProfile(
      ageBillionYears,
      terminal,
      terminal === null ? null : Math.max(0, terminal - ageBillionYears),
      assessment,
    ),
  });
}

/**
 * Deterministic 29.1E-g integration fixture:
 * - A = 16 M☉ at 1 Gyr -> historical core-collapse remnant.
 * - B/C = 1 M☉ at the same common age -> non-exploded companions.
 *
 * A's pre-SN mass loss plus the compact remnant leaves well below half of the
 * A-B pre-event mass. Therefore the inner pair must be dynamically disrupted;
 * the test does not rely on a lucky natal-kick direction or a rare generated
 * system anymore.
 */
function postSupernovaFixture(
  multiplicity: typeof StellarSystemMultiplicity.BINARY | typeof StellarSystemMultiplicity.TRIPLE,
): GeneratedMultipleHost {
  const source = populatedFixture(multiplicity);
  const components = source.components.map(host => forceGroundTruthComponent(
    source,
    host,
    host.label === 'A' ? 16 : 1,
    1,
  ));

  return Object.freeze({
    ...source,
    components: Object.freeze(components),
  });
}


function readonlySnapshot(value: unknown): string {
  return JSON.stringify(value, (_key, current: unknown) =>
    typeof current === 'bigint' ? `${current.toString()}n` : current,
  );
}

describe('29.1E-g post-supernova multihost planetary dynamics', () => {
  it('is deterministic, read-only and returns only physically closed current orbit states', () => {
    const source = postSupernovaFixture(StellarSystemMultiplicity.BINARY);
    const frozenBefore = readonlySnapshot(source);
    const first = new StellarPostSupernovaPlanetaryDynamics(source);
    const replay = new StellarPostSupernovaPlanetaryDynamics(source);

    expect(first.hierarchy.hasPostSupernovaEvolution).toBe(true);
    expect(replay.hierarchy).toEqual(first.hierarchy);

    const firstPlanets = source.publicPlanets.map(planet => first.resolvePlanet(planet));
    const replayPlanets = source.publicPlanets.map(planet => replay.resolvePlanet(planet));
    expect(replayPlanets).toEqual(firstPlanets);
    expect(readonlySnapshot(source)).toBe(frozenBefore);

    for (let index = 0; index < firstPlanets.length; index += 1) {
      const current = firstPlanets[index]!;
      const sourcePlanet = source.publicPlanets[index]!;
      expect(current.moonStates).toHaveLength(sourcePlanet.moonSystem.relevantMoons.length);

      if (current.disposition === 'BOUND_RECONFIGURED') {
        expect(current.semiMajorAxisAu).not.toBeNull();
        expect(current.semiMajorAxisAu!).toBeGreaterThan(0);
        expect(current.eccentricity).not.toBeNull();
        expect(current.eccentricity!).toBeGreaterThanOrEqual(0);
        expect(current.eccentricity!).toBeLessThan(1);
        expect(current.periodYears).not.toBeNull();
        expect(current.periodYears!).toBeGreaterThan(0);
        expect(current.periastronAu!).toBeLessThanOrEqual(current.apoastronAu!);
      } else if (current.disposition === 'EJECTED' || current.disposition === 'HOST_DISRUPTED') {
        expect(current.semiMajorAxisAu).toBeNull();
        expect(current.eccentricity).toBeNull();
        expect(current.periodYears).toBeNull();
        expect(current.periastronAu).toBeNull();
        expect(current.apoastronAu).toBeNull();
      }
    }
  }, 120_000);

  it('keeps the hierarchy coherent when the inner pair is disrupted', () => {
    const source = postSupernovaFixture(StellarSystemMultiplicity.TRIPLE);
    const hierarchy = new StellarPostSupernovaPlanetaryDynamics(source).hierarchy;

    expect(hierarchy.hasPostSupernovaEvolution).toBe(true);
    expect(hierarchy.innerOrbit.disposition).toBe('EJECTED');
    expect(hierarchy.currentArchitecture).toBe('DISRUPTED_HIERARCHY');
    expect(hierarchy.outerOrbit).not.toBeNull();
    expect(hierarchy.outerOrbit!.disposition).toBe('HIERARCHY_DISRUPTED');
    expect(hierarchy.outerOrbit!.semiMajorAxisAu).toBeNull();
    expect(hierarchy.outerOrbit!.eccentricity).toBeNull();
  }, 120_000);
});
