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
import {
  gasEnvelopeAccretionCapacityEarthV1,
  gasEnvelopeRunawayReadinessV1,
} from './gas-envelope-accretion-capacity';
import { type Planet } from '../../domain/planetary/planet';

/**
 * Read-only audit for the real home-seed V2 formation route.
 *
 * This spec deliberately changes no physics and asserts no desired population
 * percentage. It traces the actual values that decide whether current
 * MINI_NEPTUNE worlds ever reach the runaway branch and, if they do, whether
 * the finite system gas budget prevents the realized envelope from approaching
 * the local core-accretion capacity.
 *
 * The fixture set reuses systems already frozen by real-world regression tests,
 * so no production name/seed exception is introduced.
 */
const PUBLIC_V2_KEY = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),
  GeneratorVersion.V2,
);

const HOME_FIXTURES = Object.freeze([
  { x: 15, y: 9, name: 'Pulaer' },
  { x: 3, y: 25, name: 'Vathum' },
  { x: 2, y: 17, name: 'Heriia' },
  { x: 22, y: 20, name: 'Triaraia' },
  { x: -22, y: 24, name: 'Chuthoria' },
  { x: 22, y: 12, name: 'Kiraum' },
  { x: 18, y: -30, name: 'Menaar' },
  { x: 40, y: 13, name: 'Phoseria' },
  { x: 0, y: 16, name: 'Stinaion' },
]);

interface RunawayTrace {
  readonly systemName: string;
  readonly planetName: string;
  readonly planetType: PlanetType;
  readonly coreMassEarth: number;
  readonly envelopePotential01: number;
  readonly runawayReadiness01: number;
  readonly localEnvelopeCapacityEarth: number;
  readonly actualEnvelopeMassEarth: number;
  readonly capacityRealization01: number;
  readonly totalMassEarth: number;
  readonly envelopeMassFraction01: number;
  readonly systemGasBudgetEarth: number;
  readonly systemBudgetShare01: number;
  readonly gasGiantRouteA: boolean;
  readonly gasGiantRouteB: boolean;
}

function locatorAt(
  x: number,
  y: number,
  systemName: string,
): SystemLocator {
  const physicalKey = multihostPhysicalSourceKey(PUBLIC_V2_KEY);
  const physicalGalaxy = GalaxyGenerator.generate(physicalKey, 0n);
  const content = GalaxySectorContentGenerator.generate(
    physicalGalaxy,
    new GalaxySectorCoordinates(x, y),
  );

  const locator = content.systemLocators.find(candidate =>
    StellarDesignationGenerator.generate(physicalKey, candidate).name === systemName,
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
    throw new Error('Expected the locator to resolve as SINGLE or multiple.');
  }

  return single.planets;
}

function tracePlanet(systemName: string, planet: Planet): RunawayTrace {
  const coreMassEarth =
    planet.architectureSlot.inheritedSolidCoreMassEarth;

  const envelopePotential01 =
    planet.architectureSlot.inheritedEnvelopeAcquisitionPotential01;

  const runawayReadiness01 =
    gasEnvelopeRunawayReadinessV1(
      coreMassEarth,
      envelopePotential01,
    );

  const localEnvelopeCapacityEarth =
    gasEnvelopeAccretionCapacityEarthV1(
      coreMassEarth,
      envelopePotential01,
    );

  const totalMassEarth =
    planet.physicalProperties.massEarth;

  const actualEnvelopeMassEarth =
    Math.max(
      0,
      totalMassEarth - coreMassEarth,
    );

  const capacityRealization01 =
    localEnvelopeCapacityEarth <= 0
      ? 0
      : Math.min(
          1,
          actualEnvelopeMassEarth / localEnvelopeCapacityEarth,
        );

  const envelopeMassFraction01 =
    planet.physicalProperties.envelopeMassFraction01;

  return Object.freeze({
    systemName,
    planetName: planet.designation.name,
    planetType: planet.typeClassification.planetType,
    coreMassEarth,
    envelopePotential01,
    runawayReadiness01,
    localEnvelopeCapacityEarth,
    actualEnvelopeMassEarth,
    capacityRealization01,
    totalMassEarth,
    envelopeMassFraction01,
    systemGasBudgetEarth:
      planet.hostPlanetarySystem
        .formationBlueprint
        .maxGasCaptureBudgetEarth,

    systemBudgetShare01:
      planet.hostPlanetarySystem
        .formationBlueprint
        .maxGasCaptureBudgetEarth <= 0
        ? 0
        : actualEnvelopeMassEarth /
          planet.hostPlanetarySystem
            .formationBlueprint
            .maxGasCaptureBudgetEarth,

    // Current classifier routes, copied only as diagnostic predicates.
    gasGiantRouteA:
      totalMassEarth >= 30 &&
      envelopeMassFraction01 >= 0.20,

    gasGiantRouteB:
      totalMassEarth >= 15 &&
      envelopeMassFraction01 >= 0.50,
  });
}

function round(value: number, digits = 4): number {
  return Number(value.toFixed(digits));
}

function compact(trace: RunawayTrace) {
  return {
    system: trace.systemName,
    planet: trace.planetName,
    type: trace.planetType,
    coreMearth: round(trace.coreMassEarth, 3),
    potential: round(trace.envelopePotential01),
    readiness: round(trace.runawayReadiness01),
    localCapacityMearth: round(trace.localEnvelopeCapacityEarth, 3),
    actualEnvelopeMearth: round(trace.actualEnvelopeMassEarth, 3),
    capacityRealization: round(trace.capacityRealization01),
    totalMearth: round(trace.totalMassEarth, 3),
    envelopeFraction: round(trace.envelopeMassFraction01),
    systemBudgetMearth: round(trace.systemGasBudgetEarth, 3),
    systemBudgetShare: round(trace.systemBudgetShare01),
  };
}

describe('V2 runaway audit — real home-seed trace', () => {
  it('proves public V2 reaches the frozen V1 physical formation branch', () => {
    const physicalKey = multihostPhysicalSourceKey(PUBLIC_V2_KEY);

    expect(PUBLIC_V2_KEY.generatorVersion).toBe(GeneratorVersion.V2);
    expect(physicalKey.generatorVersion).toBe(GeneratorVersion.V1);
    expect(physicalKey.universeSeed.normalizedValue)
      .toBe(PUBLIC_V2_KEY.universeSeed.normalizedValue);
  });

  it('traces core -> potential -> runaway -> realized envelope -> final type on real V2 worlds', () => {
    const traces: RunawayTrace[] = [];

    for (const fixture of HOME_FIXTURES) {
      const locator = locatorAt(fixture.x, fixture.y, fixture.name);
      for (const planet of planetsFor(locator)) {
        traces.push(tracePlanet(fixture.name, planet));
      }
    }

    expect(traces.length).toBeGreaterThan(0);

    const miniNeptunes = traces.filter(
      trace => trace.planetType === PlanetType.MINI_NEPTUNE,
    );

    const gasGiants = traces.filter(
      trace => trace.planetType === PlanetType.GAS_GIANT,
    );

    const iceGiants = traces.filter(
      trace => trace.planetType === PlanetType.ICE_GIANT,
    );

    const coreAboveOnset = traces.filter(
      trace => trace.coreMassEarth > 4.5,
    );

    const potentialAboveOnset = traces.filter(
      trace => trace.envelopePotential01 > 0.35,
    );

    const runawayReady = traces.filter(
      trace => trace.runawayReadiness01 > 0,
    );

    const runawayMiniNeptunes = miniNeptunes.filter(
      trace => trace.runawayReadiness01 > 0,
    );

    const stronglyBudgetLimitedRunaway = runawayReady.filter(
      trace =>
        trace.localEnvelopeCapacityEarth > 0 &&
        trace.capacityRealization01 < 0.25,
    );

    const thresholdQualified = traces.filter(
      trace => trace.gasGiantRouteA || trace.gasGiantRouteB,
    );

    const maxCore =
      Math.max(...traces.map(trace => trace.coreMassEarth));

    const maxPotential =
      Math.max(...traces.map(trace => trace.envelopePotential01));

    const maxReadiness =
      Math.max(...traces.map(trace => trace.runawayReadiness01));

    const maxMiniMass =
      miniNeptunes.length === 0
        ? 0
        : Math.max(...miniNeptunes.map(trace => trace.totalMassEarth));

    const maxMiniEnvelopeFraction =
      miniNeptunes.length === 0
        ? 0
        : Math.max(...miniNeptunes.map(trace => trace.envelopeMassFraction01));

    const topMiniByReadiness =
      [...miniNeptunes]
        .sort((a, b) =>
          b.runawayReadiness01 - a.runawayReadiness01 ||
          b.totalMassEarth - a.totalMassEarth,
        )
        .slice(0, 12)
        .map(compact);

    const topRunawayByBudgetLimitation =
      [...runawayReady]
        .sort((a, b) =>
          a.capacityRealization01 - b.capacityRealization01 ||
          b.runawayReadiness01 - a.runawayReadiness01,
        )
        .slice(0, 12)
        .map(compact);

    const summary = {
      sampledSystems: HOME_FIXTURES.length,
      sampledPlanets: traces.length,
      miniNeptunes: miniNeptunes.length,
      gasGiants: gasGiants.length,
      iceGiants: iceGiants.length,
      coreAboveRunawayOnset: coreAboveOnset.length,
      potentialAboveRunawayOnset: potentialAboveOnset.length,
      runawayReadyPlanets: runawayReady.length,
      runawayReadyMiniNeptunes: runawayMiniNeptunes.length,
      stronglyBudgetLimitedRunaway: stronglyBudgetLimitedRunaway.length,
      classifierThresholdQualified: thresholdQualified.length,
      maxCoreMassEarth: round(maxCore, 3),
      maxEnvelopePotential01: round(maxPotential),
      maxRunawayReadiness01: round(maxReadiness),
      maxMiniNeptuneMassEarth: round(maxMiniMass, 3),
      maxMiniNeptuneEnvelopeFraction01: round(maxMiniEnvelopeFraction),
      topMiniByReadiness,
      topRunawayByBudgetLimitation,
    };

    // Deliberate diagnostic output: paste this block back into the audit chat.
    console.log(
      '\nRUNAWAY_V2_AUDIT_BEGIN\n' +
      JSON.stringify(summary, null, 2) +
      '\nRUNAWAY_V2_AUDIT_END\n',
    );

    // Boundary/integrity assertions only. The audit must not encode a desired
    // population ratio before we know which stage is actually binding.
    expect(miniNeptunes.length).toBeGreaterThan(0);
    expect(maxCore).toBeGreaterThan(0);
    expect(maxPotential).toBeGreaterThanOrEqual(0);
    expect(maxPotential).toBeLessThanOrEqual(1);
    expect(maxReadiness).toBeGreaterThanOrEqual(0);
    expect(maxReadiness).toBeLessThanOrEqual(1);

    /*
     * Regression boundary for the producer/consumer scale mismatch diagnosed
     * by the first audit: real post-dynamics critical cores must now be able
     * to enter the potential range consumed by runaway. This does NOT force a
     * gas-giant population ratio or a taxonomy result.
     */
    expect(maxPotential).toBeGreaterThan(0.35);
    expect(potentialAboveOnset.length).toBeGreaterThan(0);
    expect(runawayReady.length).toBeGreaterThan(0);

    for (const trace of traces) {
      expect(trace.actualEnvelopeMassEarth).toBeGreaterThanOrEqual(0);
      expect(trace.localEnvelopeCapacityEarth).toBeGreaterThanOrEqual(0);
      expect(trace.capacityRealization01).toBeGreaterThanOrEqual(0);
      expect(trace.capacityRealization01).toBeLessThanOrEqual(1);
      expect(trace.envelopeMassFraction01).toBeGreaterThanOrEqual(0);
      expect(trace.envelopeMassFraction01).toBeLessThanOrEqual(1);

      if (trace.planetType === PlanetType.GAS_GIANT) {
        expect(trace.gasGiantRouteA || trace.gasGiantRouteB).toBe(true);
      }
    }
  });

  it('locks the mathematical runaway boundary independently of taxonomy', () => {
    expect(
      gasEnvelopeRunawayReadinessV1(4.5, 1),
    ).toBe(0);

    expect(
      gasEnvelopeRunawayReadinessV1(100, 0.35),
    ).toBe(0);

    expect(
      gasEnvelopeRunawayReadinessV1(9, 0.75),
    ).toBe(1);

    const intermediate =
      gasEnvelopeRunawayReadinessV1(
        6.75,
        0.55,
      );

    expect(intermediate).toBeGreaterThan(0);
    expect(intermediate).toBeLessThan(1);

    const ordinaryCapacity =
      gasEnvelopeAccretionCapacityEarthV1(
        3,
        0.30,
      );

    const runawayCapacity =
      gasEnvelopeAccretionCapacityEarthV1(
        9,
        0.75,
      );

    expect(runawayCapacity).toBeGreaterThan(ordinaryCapacity);
  });
});
