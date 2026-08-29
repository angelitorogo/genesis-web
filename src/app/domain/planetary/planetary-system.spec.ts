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
  StellarDesignation,
} from '../stellar/stellar-designation';

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
  PlanetaryDesignation,
} from './planetary-designation';

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
  PlanetarySystemDesignationCatalog,
} from './planetary-system-designation-catalog';

import {
  PlanetarySystemFormationBlueprint,
} from './planetary-system-formation-blueprint';

import {
  PlanetarySystemHabitableZoneDynamicalRegime,
} from './planetary-system-habitable-zone-dynamical-regime';

import {
  PlanetarySystemHabitableZoneEvolutionRegime,
} from './planetary-system-habitable-zone-evolution-regime';

import {
  PlanetaryOrbitHabitableZoneClassification,
} from './planetary-orbit-habitable-zone-classification';

import {
  PlanetaryOrbitHabitableZoneRelation,
} from './planetary-orbit-habitable-zone-relation';

import {
  PlanetarySystemHabitableZone,
} from './planetary-system-habitable-zone';

import {
  PlanetarySystemHabitableZoneClassification,
} from './planetary-system-habitable-zone-classification';

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
  PlanetarySystemStabilityAssessment,
} from './planetary-system-stability-assessment';

import {
  PlanetarySystemStabilityRegime,
} from './planetary-system-stability-regime';

import {
  PlanetarySystem,
} from './planetary-system';

import {
  ProtoplanetCompositionMixture,
} from './protoplanet-composition-mixture';

describe(
  'PlanetarySystem points 18.1-18.8',
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

    const systemDesignation =
      new StellarDesignation(
        'Testara',
        'GEN-V1-G0-S0-O0-SYS-0123456789ABCDEFFEDCBA9876543210',
      );

    const stellarSystem = {
      generationKey,
      locator,
      seed,
      designation:
        systemDesignation,
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
            emptyStabilityAssessment(),
            singleHabitableZone(),
            emptyHabitableZoneClassification(),
            emptyDesignationCatalog(),
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
      'should expose the complete phase-18 planet identity/orbit/designation stack without creating phase-19 physical planets',
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
            singlePlanetStabilityAssessment(),
            singleHabitableZone(),
            singlePlanetHabitableZoneClassification(),
            singlePlanetDesignationCatalog(),
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
          system.stabilityAssessment.regime,
        ).toBe(
          PlanetarySystemStabilityRegime.STABLE,
        );

        expect(
          system.hasBasicOrbitalStability,
        ).toBe(true);

        expect(
          system.habitableZone,
        ).toBeDefined();

        expect(
          system.hasDynamicallyAvailableHabitableZone,
        ).toBe(true);

        expect(
          system.orbitHabitableZoneClassifications,
        ).toBe(
          system.habitableZoneClassification.orbitClassifications,
        );

        expect(
          system.orbitHabitableZoneClassifications[0]
            .dynamicallyAvailableRelation,
        ).toBe(
          PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
        );

        expect(
          system.hasOrbitIntersectingDynamicallyAvailableHabitableZone,
        ).toBe(true);

        expect(
          system.planetDesignations,
        ).toBe(
          system.designationCatalog.designations,
        );

        expect(
          system.planetDesignations[0].name,
        ).toBe(
          'Testara b',
        );

        expect(
          'planetType' in system.planetSlots[0],
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
              singlePlanetStabilityAssessment(),
              singleHabitableZone(),
              singlePlanetHabitableZoneClassification(),
              singlePlanetDesignationCatalog(),
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
              singlePlanetStabilityAssessment(),
              singleHabitableZone(),
              singlePlanetHabitableZoneClassification(),
              singlePlanetDesignationCatalog(),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a point-18.5 assessment that changes topology, planet count or point-18.4 gravitating mass',
      () => {
        expect(
          () =>
            new PlanetarySystem(
              stellarSystem,
              blueprintForOneAnchor(),
              singlePlanetArchitecture(),
              singlePlanetOrbitalLayout(),
              singlePlanetOrbitalPeriodLayout(),
              new PlanetarySystemStabilityAssessment(
                locator,
                PlanetarySystemOrbitTopology.CIRCUMBINARY,
                PlanetarySystemStabilityRegime.STABLE,
                1,
                1,
                3,
                null,
                0.1,
                null,
                [],
              ),
              singleHabitableZone(),
              singlePlanetHabitableZoneClassification(),
              singlePlanetDesignationCatalog(),
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
              singlePlanetOrbitalPeriodLayout(),
              new PlanetarySystemStabilityAssessment(
                locator,
                PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
                PlanetarySystemStabilityRegime.STABLE,
                1,
                0.9,
                null,
                null,
                null,
                null,
                [],
              ),
              singleHabitableZone(),
              singlePlanetHabitableZoneClassification(),
              singlePlanetDesignationCatalog(),
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
              singlePlanetOrbitalPeriodLayout(),
              emptyStabilityAssessment(),
              singleHabitableZone(),
              singlePlanetHabitableZoneClassification(),
              singlePlanetDesignationCatalog(),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a planet-free stability regime that contradicts the point-18.2 architecture outcome',
      () => {
        expect(
          () =>
            new PlanetarySystem(
              stellarSystem,
              emptyBlueprint(),
              emptyArchitecture(),
              emptyOrbitalLayout(),
              emptyOrbitalPeriodLayout(),
              new PlanetarySystemStabilityAssessment(
                locator,
                PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
                PlanetarySystemStabilityRegime.DYNAMICALLY_EXCLUDED,
                0,
                null,
                null,
                null,
                null,
                null,
                [],
              ),
              singleHabitableZone(),
              emptyHabitableZoneClassification(),
              emptyDesignationCatalog(),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject point-18.7 classifications that change orbit identity or dynamic-HZ availability',
      () => {
        const valid =
          singlePlanetHabitableZoneClassification();

        const classification =
          valid.orbitClassifications[0];

        expect(
          () =>
            new PlanetarySystem(
              stellarSystem,
              blueprintForOneAnchor(),
              singlePlanetArchitecture(),
              singlePlanetOrbitalLayout(),
              singlePlanetOrbitalPeriodLayout(),
              singlePlanetStabilityAssessment(),
              singleHabitableZone(),
              new PlanetarySystemHabitableZoneClassification(
                locator,
                PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
                1,
                true,
                [
                  new PlanetaryOrbitHabitableZoneClassification(
                    1,
                    classification.bodyLocator,
                    classification.bodySeed,
                    classification.sourcePeriastronAu +
                      0.01,
                    classification.sourceApoastronAu,
                    classification.radiativeRelation,
                    classification.dynamicallyAvailableRelation,
                  ),
                ],
              ),
              singlePlanetDesignationCatalog(),
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
              singlePlanetOrbitalPeriodLayout(),
              singlePlanetStabilityAssessment(),
              singleHabitableZone(),
              new PlanetarySystemHabitableZoneClassification(
                locator,
                PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
                1,
                false,
                [
                  new PlanetaryOrbitHabitableZoneClassification(
                    1,
                    classification.bodyLocator,
                    classification.bodySeed,
                    classification.sourcePeriastronAu,
                    classification.sourceApoastronAu,
                    classification.radiativeRelation,
                    null,
                  ),
                ],
              ),
              singlePlanetDesignationCatalog(),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject point-18.8 designations that change parent system or mature Body identity',
      () => {
        const slot =
          singlePlanetArchitecture()
            .planetSlots[0];

        const foreignSystemDesignation =
          new StellarDesignation(
            'Penaoria',
            'GEN-V1-G0-S0-O1-SYS-9A2DAD2C4D324D59C54C8DFDB9E2F84F',
          );

        expect(
          () =>
            new PlanetarySystem(
              stellarSystem,
              blueprintForOneAnchor(),
              singlePlanetArchitecture(),
              singlePlanetOrbitalLayout(),
              singlePlanetOrbitalPeriodLayout(),
              singlePlanetStabilityAssessment(),
              singleHabitableZone(),
              singlePlanetHabitableZoneClassification(),
              new PlanetarySystemDesignationCatalog(
                locator,
                foreignSystemDesignation,
                1,
                [
                  new PlanetaryDesignation(
                    foreignSystemDesignation,
                    1,
                    slot.bodyLocator,
                    slot.bodySeed,
                    'b',
                  ),
                ],
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
              singlePlanetOrbitalPeriodLayout(),
              singlePlanetStabilityAssessment(),
              singleHabitableZone(),
              singlePlanetHabitableZoneClassification(),
              new PlanetarySystemDesignationCatalog(
                locator,
                systemDesignation,
                1,
                [
                  new PlanetaryDesignation(
                    systemDesignation,
                    1,
                    slot.bodyLocator,
                    new BodySeed(
                      '22222222222222222222222222222222',
                    ),
                    'b',
                  ),
                ],
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
              emptyStabilityAssessment(),
              singleHabitableZone(),
              emptyHabitableZoneClassification(),
              emptyDesignationCatalog(),
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
              emptyStabilityAssessment(),
              singleHabitableZone(),
              emptyHabitableZoneClassification(),
              emptyDesignationCatalog(),
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
              emptyStabilityAssessment(),
              singleHabitableZone(),
              emptyHabitableZoneClassification(),
              emptyDesignationCatalog(),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );



    function emptyDesignationCatalog():
      PlanetarySystemDesignationCatalog {

      return new PlanetarySystemDesignationCatalog(
        locator,
        systemDesignation,
        0,
        [],
      );
    }

    function singlePlanetDesignationCatalog():
      PlanetarySystemDesignationCatalog {

      const slot =
        singlePlanetArchitecture()
          .planetSlots[0];

      return new PlanetarySystemDesignationCatalog(
        locator,
        systemDesignation,
        1,
        [
          new PlanetaryDesignation(
            systemDesignation,
            1,
            slot.bodyLocator,
            slot.bodySeed,
            'b',
          ),
        ],
      );
    }

    function emptyHabitableZoneClassification():
      PlanetarySystemHabitableZoneClassification {

      return new PlanetarySystemHabitableZoneClassification(
        locator,
        PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
        0,
        true,
        [],
      );
    }

    function singlePlanetHabitableZoneClassification():
      PlanetarySystemHabitableZoneClassification {

      const orbit =
        singlePlanetOrbitalLayout()
          .orbits[0];

      return new PlanetarySystemHabitableZoneClassification(
        locator,
        PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
        1,
        true,
        [
          new PlanetaryOrbitHabitableZoneClassification(
            1,
            orbit.bodyLocator,
            orbit.bodySeed,
            orbit.periastronAu,
            orbit.apoastronAu,
            PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
            PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
          ),
        ],
      );
    }

    function singleHabitableZone():
      PlanetarySystemHabitableZone {

      const innerFlux =
        1.107;

      const outerFlux =
        0.356;

      const innerEdge =
        Math.sqrt(
          1 /
          innerFlux,
        );

      const outerEdge =
        Math.sqrt(
          1 /
          outerFlux,
        );

      return new PlanetarySystemHabitableZone(
        locator,
        PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
        1,
        innerFlux,
        outerFlux,
        innerEdge,
        outerEdge,
        innerEdge,
        outerEdge,
        1,
        PlanetarySystemHabitableZoneDynamicalRegime.FULL_DYNAMICAL_OVERLAP,
        PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST,
      );
    }

    function emptyStabilityAssessment():
      PlanetarySystemStabilityAssessment {

      return new PlanetarySystemStabilityAssessment(
        locator,
        PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
        PlanetarySystemStabilityRegime.EMPTY,
        0,
        null,
        null,
        null,
        null,
        null,
        [],
      );
    }

    function singlePlanetStabilityAssessment():
      PlanetarySystemStabilityAssessment {

      return new PlanetarySystemStabilityAssessment(
        locator,
        PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
        PlanetarySystemStabilityRegime.STABLE,
        1,
        1,
        null,
        null,
        null,
        null,
        [],
      );
    }

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
