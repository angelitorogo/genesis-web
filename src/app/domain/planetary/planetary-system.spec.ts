import {
  BodyLocator,
  SystemLocator,
} from '../generation/procedural-locator';

import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  BodySeed,
  SystemSeed,
} from '../seed/hierarchical-seeds';

import {
  type StellarSystem,
} from '../stellar/stellar-system';

import {
  StellarSystemMultiplicity,
} from '../stellar/stellar-system-multiplicity';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  PlanetaryArchitectureSlot,
} from './planetary-architecture-slot';

import {
  PlanetaryFormationAnchor,
} from './planetary-formation-anchor';

import {
  PlanetaryFormationMaturityRegime,
} from './planetary-formation-maturity-regime';

import {
  PlanetarySystemArchitecture,
} from './planetary-system-architecture';

import {
  PlanetarySystemArchitectureRegime,
} from './planetary-system-architecture-regime';

import {
  PlanetarySystemFormationBlueprint,
} from './planetary-system-formation-blueprint';

import {
  PlanetarySystemOrbitTopology,
} from './planetary-system-orbit-topology';

import {
  PlanetarySystem,
} from './planetary-system';

import {
  ProtoplanetCompositionMixture,
} from './protoplanet-composition-mixture';

describe(
  'PlanetarySystem points 18.1-18.2',
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
      multiplicity:
        StellarSystemMultiplicity.SINGLE,
    } as unknown as StellarSystem;

    it(
      'should preserve phase-18 identity/handoff and expose the point-18.2 mature architecture',
      () => {
        const blueprint =
          emptyBlueprint();

        const architecture =
          emptyArchitecture();

        const system =
          new PlanetarySystem(
            stellarSystem,
            blueprint,
            architecture,
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
          system.architecture,
        ).toBe(
          architecture,
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
          system.planetCount,
        ).toBe(0);

        expect(
          system.hasPlanets,
        ).toBe(false);
      },
    );

    it(
      'should expose mature planet slots without prematurely creating final orbits or phase-19 planets',
      () => {
        const architecture =
          singlePlanetArchitecture();

        const system =
          new PlanetarySystem(
            stellarSystem,
            blueprintForOneAnchor(),
            architecture,
          );

        expect(
          system.planetCount,
        ).toBe(1);

        expect(
          system.planetSlots,
        ).toBe(
          architecture.planetSlots,
        );

        expect(
          'planets' in system,
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

    it(
      'should reject an architecture from another SystemLocator or an incomplete anchor handoff',
      () => {
        const foreignArchitecture =
          new PlanetarySystemArchitecture(
            new SystemLocator(
              1n,
              0n,
              0n,
            ),
            PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
            PlanetarySystemArchitectureRegime.EMPTY,
            0,
            0,
            0,
            0,
            [],
          );

        expect(
          () =>
            new PlanetarySystem(
              stellarSystem,
              emptyBlueprint(),
              foreignArchitecture,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetarySystem(
              stellarSystem,
              blueprintForOneAnchor(),
              emptyArchitecture(),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function emptyArchitecture():
      PlanetarySystemArchitecture {

      return new PlanetarySystemArchitecture(
        locator,
        PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
        PlanetarySystemArchitectureRegime.EMPTY,
        0,
        0,
        0,
        0,
        [],
      );
    }

    function singlePlanetArchitecture():
      PlanetarySystemArchitecture {

      return new PlanetarySystemArchitecture(
        locator,
        PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
        PlanetarySystemArchitectureRegime.SINGLE_PLANET,
        1,
        1,
        0,
        0,
        [
          new PlanetaryArchitectureSlot(
            1,
            new BodyLocator(
              locator.galaxyIndex,
              locator.sectorKey,
              locator.galacticObjectIndex,
              0n,
            ),
            new BodySeed(
              '11111111111111111111111111111111',
            ),
            [
              1,
            ],
            [
              1,
            ],
            1,
            1,
            new ProtoplanetCompositionMixture(
              0,
              1,
              0,
              0,
            ),
            0.8,
            0.2,
            0.4,
            0.1,
            0,
            0,
          ),
        ],
      );
    }
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

function blueprintForOneAnchor():
  PlanetarySystemFormationBlueprint {

  const anchor =
    new PlanetaryFormationAnchor(
      1,
      [
        1,
      ],
      1,
      1,
      new ProtoplanetCompositionMixture(
        0,
        1,
        0,
        0,
      ),
      0.8,
      0.2,
      0.4,
      0.1,
      0,
    );

  return new PlanetarySystemFormationBlueprint(
    1,
    6,
    20,
    1,
    0.05,
    100,
    4_000,
    6,
    1,
    5,
    0.1,
    1,
    1,
    0,
    0,
    PlanetaryFormationMaturityRegime.SOLID_CORE_SYSTEM,
    [
      anchor,
    ],
  );
}
