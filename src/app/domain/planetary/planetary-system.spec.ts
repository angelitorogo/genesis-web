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
  PlanetaryOrbitalElements,
} from './planetary-orbital-elements';

import {
  PlanetaryOrbitalPeriod,
} from './planetary-orbital-period';

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
  PlanetarySystemOrbitalLayout,
} from './planetary-system-orbital-layout';

import {
  PlanetarySystemOrbitalPeriodLayout,
} from './planetary-system-orbital-period-layout';

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
  'PlanetarySystem points 18.1-18.4',
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
            emptyOrbitalLayout(),
            emptyOrbitalPeriodLayout(),
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
            singlePlanetOrbitalLayout(),
            singlePlanetOrbitalPeriodLayout(),
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
          system.orbits,
        ).toBe(
          system.orbitalLayout.orbits,
        );

        expect(
          system.orbits[0].semiMajorAxisAu,
        ).toBe(1.05);

        expect(
          system.orbitalPeriods,
        ).toBe(
          system.orbitalPeriodLayout.periods,
        );

        expect(
          system.orbitalPeriods[0].periodYears,
        ).toBeCloseTo(
          Math.sqrt(
            1.05 ** 3,
          ),
          14,
        );

        expect(
          'periodDays' in system.orbits[0],
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
      'should reject point-18.4 periods that change the point-18.3 orbit identity, topology or semi-major axis',
      () => {
        expect(
          () =>
            new PlanetarySystem(
              stellarSystem,
              blueprintForOneAnchor(),
              singlePlanetArchitecture(),
              singlePlanetOrbitalLayout(),
              singlePlanetOrbitalPeriodLayout(
                1.06,
              ),
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetarySystem(
              stellarSystem,
              blueprintForOneAnchor(),
              singlePlanetArchitecture(),
              singlePlanetOrbitalLayout(),
              new PlanetarySystemOrbitalPeriodLayout(
                locator,
                PlanetarySystemOrbitTopology.CIRCUMBINARY,
                1,
                singlePlanetOrbitalPeriodLayout()
                  .periods,
              ),
            ),
        ).toThrow(
          RangeError,
        );
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
              emptyOrbitalLayout(),
              emptyOrbitalPeriodLayout(),
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
              emptyOrbitalLayout(),
              emptyOrbitalPeriodLayout(),
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetarySystem(
              stellarSystem,
              blueprintForOneAnchor(),
              singlePlanetArchitecture(),
              emptyOrbitalLayout(),
              emptyOrbitalPeriodLayout(),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );


    function emptyOrbitalPeriodLayout():
      PlanetarySystemOrbitalPeriodLayout {

      return new PlanetarySystemOrbitalPeriodLayout(
        locator,
        PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
        null,
        [],
      );
    }

    function singlePlanetOrbitalPeriodLayout(
      semiMajorAxisAu =
        1.05,
    ): PlanetarySystemOrbitalPeriodLayout {

      const slot =
        singlePlanetArchitecture()
          .planetSlots[0];

      const periodYears =
        Math.sqrt(
          semiMajorAxisAu **
            3,
        );

      return new PlanetarySystemOrbitalPeriodLayout(
        locator,
        PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
        1,
        [
          new PlanetaryOrbitalPeriod(
            1,
            slot.bodyLocator,
            slot.bodySeed,
            semiMajorAxisAu,
            1,
            periodYears,
            periodYears *
              365.25,
          ),
        ],
      );
    }

    function emptyOrbitalLayout():
      PlanetarySystemOrbitalLayout {

      return new PlanetarySystemOrbitalLayout(
        locator,
        PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
        0.05,
        100,
        [],
      );
    }

    function singlePlanetOrbitalLayout():
      PlanetarySystemOrbitalLayout {

      const slot =
        singlePlanetArchitecture()
          .planetSlots[0];

      return new PlanetarySystemOrbitalLayout(
        locator,
        PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
        0.05,
        100,
        [
          new PlanetaryOrbitalElements(
            1,
            slot.bodyLocator,
            slot.bodySeed,
            1.05,
            0.03,
            1.5,
            30,
            60,
          ),
        ],
      );
    }

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
