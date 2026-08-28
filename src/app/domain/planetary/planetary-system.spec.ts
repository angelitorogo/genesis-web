import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  SystemLocator,
} from '../generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  SystemSeed,
} from '../seed/hierarchical-seeds';

import {
  type StellarSystem,
} from '../stellar/stellar-system';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  PlanetaryFormationMaturityRegime,
} from './planetary-formation-maturity-regime';

import {
  PlanetarySystemFormationBlueprint,
} from './planetary-system-formation-blueprint';

import {
  PlanetarySystem,
} from './planetary-system';

describe(
  'PlanetarySystem point 18.1',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const locator =
      new SystemLocator(
        0n,
        0n,
        0n,
      );

    const seed =
      new SystemSeed(
        '0123456789ABCDEFFEDCBA9876543210',
      );

    const stellarSystem = {
      generationKey,
      locator,
      seed,
    } as unknown as StellarSystem;

    it(
      'should preserve host system identity and the exact frozen phase-17.7 handoff',
      () => {
        const blueprint =
          emptyBlueprint();

        const system =
          new PlanetarySystem(
            stellarSystem,
            blueprint,
          );

        expect(
          system.hostStellarSystem,
        ).toBe(
          stellarSystem,
        );

        expect(
          system.formationBlueprint,
        ).toBe(
          blueprint,
        );

        expect(
          system.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          system.locator,
        ).toBe(
          locator,
        );

        expect(
          system.seed,
        ).toBe(
          seed,
        );

        expect(
          system.seed.kind,
        ).toBe(
          'system',
        );
      },
    );

    it(
      'should expose formation anchors as formation history without inventing mature planets or orbits',
      () => {
        const system =
          new PlanetarySystem(
            stellarSystem,
            emptyBlueprint(),
          );

        expect(
          system.formationAnchorCount,
        ).toBe(0);

        expect(
          system.hasFormationAnchors,
        ).toBe(false);

        expect(
          'planetCount' in system,
        ).toBe(false);

        expect(
          'planets' in system,
        ).toBe(false);

        expect(
          'architecture' in system,
        ).toBe(false);

        expect(
          'orbits' in system,
        ).toBe(false);

        expect(
          'orbitalPeriods' in system,
        ).toBe(false);

        expect(
          'habitableZone' in system,
        ).toBe(false);

        expect(
          'planetDesignations' in system,
        ).toBe(false);
      },
    );
  },
);

function emptyBlueprint():
  PlanetarySystemFormationBlueprint {

  return new PlanetarySystemFormationBlueprint(
    1,
    6,
    20,
    1,
    0.05,
    100,
    4_000,
    10,
    0,
    10,
    0,
    0,
    0,
    0,
    0,
    PlanetaryFormationMaturityRegime.NO_PLANET_FORMING_CORES,
    [],
  );
}
