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

const ROCKY_MOON_MAX_ICE_01 = 0.35;
const ICY_MOON_MIN_ICE_01 = 0.65;

interface TypeTotals {
  moonSystems: number;
  moons: number;
  relevant: number;
  identityOnly: number;
  estimatedRegularMinor: number;
  estimatedIrregularMinor: number;
  relevantRocky: number;
  relevantMixedRockIce: number;
  relevantIcy: number;
}

function emptyTypeTotals(): TypeTotals {
  return {
    moonSystems: 0,
    moons: 0,
    relevant: 0,
    identityOnly: 0,
    estimatedRegularMinor: 0,
    estimatedIrregularMinor: 0,
    relevantRocky: 0,
    relevantMixedRockIce: 0,
    relevantIcy: 0,
  };
}

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
    StellarDesignationGenerator.generate(physicalKey, candidate).name === systemName,
  );

  if (locator === undefined) {
    throw new Error(`Expected ${systemName} in (${x}, ${y}).`);
  }

  return locator;
}

function physicalHostsFor(
  locator: SystemLocator,
): readonly GeneratedSingleHost[] {
  const multiple = StellarMultihostFormation.generateOrNull(
    PUBLIC_V2_KEY,
    locator,
  );

  if (multiple !== null) {
    return multiple.components;
  }

  const single = StellarMultihostFormation.generateV2SingleOrNull(
    PUBLIC_V2_KEY,
    locator,
  );

  if (single === null) {
    throw new Error('Expected SINGLE or multiple physical host.');
  }

  return Object.freeze([single]);
}

function moonCompositionBucket(
  iceRichness01: number,
): 'ROCKY' | 'MIXED_ROCK_ICE' | 'ICY' {
  if (iceRichness01 < ROCKY_MOON_MAX_ICE_01) {
    return 'ROCKY';
  }

  if (iceRichness01 >= ICY_MOON_MIN_ICE_01) {
    return 'ICY';
  }

  return 'MIXED_ROCK_ICE';
}

describe('Point 3 — uncharacterized moon population audit', () => {
  it('separates physically materialized relevant moons from identity-only minor moons without inventing composition', () => {
    const byHostType = new Map<PlanetType, TypeTotals>();

    let sampledPhysicalHosts = 0;
    let sampledPlanets = 0;
    let moonSystemsWithMoons = 0;
    let totalMoons = 0;
    let relevantMoons = 0;
    let identityOnlyMoons = 0;
    let giantIdentityOnlyMoons = 0;
    let nonGiantIdentityOnlyMoons = 0;
    let estimatedRegularMinor = 0;
    let estimatedIrregularMinor = 0;
    let relevantRocky = 0;
    let relevantMixedRockIce = 0;
    let relevantIcy = 0;

    const largestIdentityOnlySystems: Array<{
      system: string;
      hostPlanet: string;
      hostType: PlanetType;
      totalMoons: number;
      relevantMoons: number;
      identityOnlyMoons: number;
      estimatedRegularMinor: number;
      estimatedIrregularMinor: number;
    }> = [];

    for (const fixture of HOME_FIXTURES) {
      const locator = locatorAt(fixture.x, fixture.y, fixture.name);

      for (const host of physicalHostsFor(locator)) {
        sampledPhysicalHosts += 1;

        for (let index = 0; index < host.planets.length; index += 1) {
          const planet = host.planets[index];
          const moonSystem = host.moonSystems[index];

          sampledPlanets += 1;

          expect(moonSystem.hostPlanet).toBe(planet);
          expect(moonSystem.moonIdentities.length).toBe(moonSystem.moonCount);
          expect(
            moonSystem.relevantMoonCount +
              moonSystem.unmaterializedMinorMoonCount,
          ).toBe(moonSystem.moonCount);

          if (moonSystem.moonCount > 0) {
            moonSystemsWithMoons += 1;
          }

          totalMoons += moonSystem.moonCount;
          relevantMoons += moonSystem.relevantMoonCount;
          identityOnlyMoons += moonSystem.unmaterializedMinorMoonCount;

          const giantHost =
            planet.planetType === PlanetType.GAS_GIANT ||
            planet.planetType === PlanetType.ICE_GIANT;

          if (giantHost) {
            giantIdentityOnlyMoons += moonSystem.unmaterializedMinorMoonCount;
            estimatedRegularMinor +=
              moonSystem.giantMoonProfile.estimatedRegularMinorMoonCount;
            estimatedIrregularMinor +=
              moonSystem.giantMoonProfile.estimatedIrregularMinorMoonCount;

            expect(
              moonSystem.giantMoonProfile.estimatedRegularMinorMoonCount +
                moonSystem.giantMoonProfile.estimatedIrregularMinorMoonCount,
            ).toBe(moonSystem.unmaterializedMinorMoonCount);
          } else {
            nonGiantIdentityOnlyMoons += moonSystem.unmaterializedMinorMoonCount;
          }

          const typeTotals =
            byHostType.get(planet.planetType) ??
            emptyTypeTotals();

          typeTotals.moonSystems += 1;
          typeTotals.moons += moonSystem.moonCount;
          typeTotals.relevant += moonSystem.relevantMoonCount;
          typeTotals.identityOnly += moonSystem.unmaterializedMinorMoonCount;
          typeTotals.estimatedRegularMinor +=
            moonSystem.giantMoonProfile.estimatedRegularMinorMoonCount;
          typeTotals.estimatedIrregularMinor +=
            moonSystem.giantMoonProfile.estimatedIrregularMinorMoonCount;

          for (const moon of moonSystem.relevantMoons) {
            const bucket = moonCompositionBucket(
              moon.environmentState.inferredIceRichnessIndex01,
            );

            if (bucket === 'ROCKY') {
              relevantRocky += 1;
              typeTotals.relevantRocky += 1;
            } else if (bucket === 'ICY') {
              relevantIcy += 1;
              typeTotals.relevantIcy += 1;
            } else {
              relevantMixedRockIce += 1;
              typeTotals.relevantMixedRockIce += 1;
            }
          }

          byHostType.set(planet.planetType, typeTotals);

          if (moonSystem.unmaterializedMinorMoonCount > 0) {
            largestIdentityOnlySystems.push({
              system: fixture.name,
              hostPlanet: planet.designation.name,
              hostType: planet.planetType,
              totalMoons: moonSystem.moonCount,
              relevantMoons: moonSystem.relevantMoonCount,
              identityOnlyMoons: moonSystem.unmaterializedMinorMoonCount,
              estimatedRegularMinor:
                moonSystem.giantMoonProfile.estimatedRegularMinorMoonCount,
              estimatedIrregularMinor:
                moonSystem.giantMoonProfile.estimatedIrregularMinorMoonCount,
            });
          }
        }
      }
    }

    largestIdentityOnlySystems.sort(
      (left, right) => right.identityOnlyMoons - left.identityOnlyMoons,
    );

    const byHostTypeObject = Object.fromEntries(
      [...byHostType.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([type, totals]) => [type, totals]),
    );

    const summary = {
      sampledSystems: HOME_FIXTURES.length,
      sampledPhysicalHosts,
      sampledPlanets,
      moonSystemsWithMoons,
      totalMoons,
      relevantMoons,
      identityOnlyMoons,
      relevantFraction:
        totalMoons === 0 ? 0 : Number((relevantMoons / totalMoons).toFixed(4)),
      identityOnlyFraction:
        totalMoons === 0 ? 0 : Number((identityOnlyMoons / totalMoons).toFixed(4)),

      /*
       * These are the only moons for which the current model has enough
       * physical/environmental state to classify ROCKY / MIXED / ICY.
       */
      physicallyClassifiableRelevantMoons: relevantMoons,
      relevantRocky,
      relevantMixedRockIce,
      relevantIcy,

      /*
       * Point 21.8 gives every modeled moon an identity, but point 21.3
       * deliberately materializes only a bounded relevant subset. Therefore
       * the remainder has no MoonPhysicalProperties / MoonEnvironmentState from
       * which a defensible rock/ice classification could be derived.
       */
      identityOnlyMinorMoons: identityOnlyMoons,
      identityOnlyWithMaterializedPhysicalState: 0,

      giantIdentityOnlyMoons,
      nonGiantIdentityOnlyMoons,
      estimatedRegularMinorWithinGiantHosts: estimatedRegularMinor,
      estimatedIrregularMinorWithinGiantHosts: estimatedIrregularMinor,

      byHostType: byHostTypeObject,
      largestIdentityOnlySystems: largestIdentityOnlySystems.slice(0, 20),
    };

    console.log(
      '\nMOON_UNCHARACTERIZED_V2_AUDIT_BEGIN\n' +
        JSON.stringify(summary, null, 2) +
        '\nMOON_UNCHARACTERIZED_V2_AUDIT_END\n',
    );

    expect(relevantRocky + relevantMixedRockIce + relevantIcy)
      .toBe(relevantMoons);

    expect(relevantMoons + identityOnlyMoons)
      .toBe(totalMoons);

    /*
     * This is the central diagnostic contract: current "uncharacterized"
     * telemetry is not a failed composition classifier. It is exactly the
     * point-21.2 population that point 21.3 intentionally did not physically
     * materialize.
     */
    expect(identityOnlyMoons).toBeGreaterThan(0);
  });
});
