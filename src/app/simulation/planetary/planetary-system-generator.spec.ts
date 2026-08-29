import {
  BodyLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  CircumbinaryHabitabilityAssessment,
  CircumbinaryPlanetaryStabilityRegime,
  CircumbinaryStellarEvolutionRegime,
} from '../../domain/habitability/circumbinary-habitability-assessment';

import {
  PlanetaryOrbitHabitableZoneRelation,
} from '../../domain/planetary/planetary-orbit-habitable-zone-relation';

import {
  PlanetaryFormationAnchor,
} from '../../domain/planetary/planetary-formation-anchor';

import {
  PlanetaryFormationMaturityRegime,
} from '../../domain/planetary/planetary-formation-maturity-regime';

import {
  PlanetarySystemArchitectureRegime,
} from '../../domain/planetary/planetary-system-architecture-regime';

import {
  PlanetarySystemFormationBlueprint,
} from '../../domain/planetary/planetary-system-formation-blueprint';

import {
  PlanetarySystemHabitableZoneDynamicalRegime,
} from '../../domain/planetary/planetary-system-habitable-zone-dynamical-regime';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  PlanetarySystemStabilityRegime,
} from '../../domain/planetary/planetary-system-stability-regime';

import {
  ProtoplanetCompositionMixture,
} from '../../domain/planetary/protoplanet-composition-mixture';

import {
  GalaxySectorStellarPopulationProperties,
} from '../../domain/sector/galaxy-sector-stellar-population-properties';

import {
  type StellarSystem,
} from '../../domain/stellar/stellar-system';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  StellarPopulationProfile,
  StellarPopulationRegime,
} from '../../domain/stellar/stellar-population-profile';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  StellarSystemGenerator,
} from '../stellar/stellar-system-generator';

import {
  PlanetarySystemGenerator,
} from './planetary-system-generator';

describe(
  'PlanetarySystemGenerator points 18.2-18.7',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const sector =
      new GalaxySectorStellarPopulationProperties(
        1,
        4.6,
      );

    const population =
      new StellarPopulationProfile(
        4.6,
        0.45,
        0.20,
        0.55,
        0.25,
        0.82,
        0.72,
        0.30,
        0.22,
        StellarPopulationRegime.MIXED,
      );

    it(
      'should preserve the point-18.1 host, blueprint and canonical SystemSeed while adding architecture, orbital geometry and periods',
      () => {
        const locator =
          new SystemLocator(
            4n,
            -12n,
            7n,
          );

        const stellarSystem =
          singleSystem(
            locator,
          );

        const formation =
          blueprint([]);

        const system =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              stellarSystem,
              formation,
            );

        const canonicalSystemSeed =
          ProceduralTargetResolver
            .resolveTargetSeed(
              generationKey,
              locator,
            );

        expect(
          system.hostStellarSystem,
        ).toBe(
          stellarSystem,
        );

        expect(
          system.formationBlueprint,
        ).toBe(
          formation,
        );

        expect(
          system.seed,
        ).toBe(
          stellarSystem.seed,
        );

        expect(
          system.seed.normalizedValue,
        ).toBe(
          canonicalSystemSeed.normalizedValue,
        );


        expect(
          system.habitableZone.referenceLuminositySolar,
        ).toBeGreaterThan(0);

        expect(
          system.habitableZone.orbitTopology,
        ).toBe(
          PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
        );

        expect(
          system.orbitHabitableZoneClassifications,
        ).toEqual([]);
      },
    );

    it(
      'should preserve a formation with no anchors as a truly empty mature planetary architecture',
      () => {
        const stellarSystem =
          singleSystem(
            new SystemLocator(
              0n,
              0n,
              0n,
            ),
          );

        const system =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              stellarSystem,
              blueprint([]),
            );

        expect(
          system.planetCount,
        ).toBe(0);

        expect(
          system.architecture.regime,
        ).toBe(
          PlanetarySystemArchitectureRegime.EMPTY,
        );

        expect(
          system.architecture.orbitTopology,
        ).toBe(
          PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
        );

        expect(
          system.architecture.excludedSourceAnchorCount,
        ).toBe(0);

        expect(
          system.orbits,
        ).toEqual([]);

        expect(
          system.orbitalLayout.generationInnerLimitAu,
        ).toBe(0.05);

        expect(
          system.orbitalLayout.generationOuterLimitAu,
        ).toBe(100);

        expect(
          system.orbitalPeriods,
        ).toEqual([]);

        expect(
          system.orbitalPeriodLayout.gravitatingMassSolar,
        ).toBeNull();
      },
    );

    it(
      'should keep well-separated formation anchors as distinct final planet identities in radial order',
      () => {
        const stellarSystem =
          singleSystem(
            new SystemLocator(
              2n,
              15n,
              9n,
            ),
          );

        const formation =
          blueprint([
            anchor(
              1,
              1,
              0.20,
            ),
            anchor(
              2,
              1.7,
              0.25,
            ),
            anchor(
              3,
              6,
              0.30,
            ),
          ]);

        const system =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              stellarSystem,
              formation,
            );

        expect(
          system.planetCount,
        ).toBe(3);

        expect(
          system.architecture.regime,
        ).toBe(
          PlanetarySystemArchitectureRegime.MULTI_ZONE_MULTIPLANET,
        );

        expect(
          system.architecture.radialZoneCount,
        ).toBe(2);

        expect(
          system.planetSlots.map(
            slot =>
              slot.sourceAnchorOrdinals,
          ),
        ).toEqual([
          [
            1,
          ],
          [
            2,
          ],
          [
            3,
          ],
        ]);

        expect(
          system.planetSlots.map(
            slot =>
              slot.bodyLocator.bodyIndex,
          ),
        ).toEqual([
          0n,
          1n,
          2n,
        ]);

        expect(
          system.orbits.length,
        ).toBe(3);

        for (
          let index = 0;
          index <
            system.orbits.length;
          index += 1
        ) {
          const orbit =
            system.orbits[index];

          const slot =
            system.planetSlots[index];

          expect(
            orbit.bodyLocator,
          ).toBe(
            slot.bodyLocator,
          );

          expect(
            orbit.bodySeed,
          ).toBe(
            slot.bodySeed,
          );

          expect(
            Math.abs(
              Math.log(
                orbit.semiMajorAxisAu /
                slot.referenceAssemblyRadiusAu,
              ),
            ),
          ).toBeLessThanOrEqual(
            Math.log(1.031),
          );

          expect(
            orbit.eccentricity,
          ).toBeGreaterThanOrEqual(0);

          expect(
            orbit.eccentricity,
          ).toBeLessThan(0.43);

          expect(
            orbit.inclinationDegrees,
          ).toBeGreaterThanOrEqual(0);

          expect(
            orbit.longitudeOfAscendingNodeDegrees,
          ).toBeGreaterThanOrEqual(0);

          expect(
            orbit.longitudeOfAscendingNodeDegrees,
          ).toBeLessThan(360);

          expect(
            orbit.argumentOfPeriapsisDegrees,
          ).toBeGreaterThanOrEqual(0);

          expect(
            orbit.argumentOfPeriapsisDegrees,
          ).toBeLessThan(360);

          const period =
            system.orbitalPeriods[index];

          expect(
            period.bodyLocator,
          ).toBe(
            orbit.bodyLocator,
          );

          expect(
            period.bodySeed,
          ).toBe(
            orbit.bodySeed,
          );

          expect(
            period.sourceSemiMajorAxisAu,
          ).toBe(
            orbit.semiMajorAxisAu,
          );

          expect(
            period.periodYears,
          ).toBeCloseTo(
            Math.sqrt(
              orbit.semiMajorAxisAu **
                3,
            ),
            14,
          );

          expect(
            period.periodDays,
          ).toBeCloseTo(
            period.periodYears *
              365.25,
            12,
          );
        }

        for (
          let index = 1;
          index <
            system.orbits.length;
          index += 1
        ) {
          expect(
            system.orbits[index - 1]
              .apoastronAu,
          ).toBeLessThan(
            system.orbits[index]
              .periastronAu,
          );
        }
      },
    );

    it(
      'should consolidate dynamically unresolved neighboring anchors without losing mass, composition or lineage',
      () => {
        const stellarSystem =
          singleSystem(
            new SystemLocator(
              4n,
              -12n,
              7n,
            ),
          );

        const first =
          anchor(
            1,
            1,
            1,
            new ProtoplanetCompositionMixture(
              0,
              1,
              0,
              0,
            ),
          );

        const second =
          anchor(
            2,
            1.02,
            3,
            new ProtoplanetCompositionMixture(
              0,
              0,
              1,
              0,
            ),
          );

        const system =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              stellarSystem,
              blueprint([
                first,
                second,
              ]),
            );

        expect(
          system.planetCount,
        ).toBe(1);

        const slot =
          system.planetSlots[0];

        expect(
          slot.sourceAnchorOrdinals,
        ).toEqual([
          1,
          2,
        ]);

        expect(
          slot.sourceFormationOrdinals,
        ).toEqual([
          1,
          2,
        ]);

        expect(
          slot.phase18ConsolidationCount,
        ).toBe(1);

        expect(
          slot.inheritedSolidCoreMassEarth,
        ).toBe(4);

        expect(
          slot.referenceAssemblyRadiusAu,
        ).toBeCloseTo(
          1.015,
          12,
        );

        expect(
          slot.inheritedCompositionMixture.rockyFraction01,
        ).toBeCloseTo(
          0.25,
          12,
        );

        expect(
          slot.inheritedCompositionMixture.iceRichFraction01,
        ).toBeCloseTo(
          0.75,
          12,
        );

        expect(
          system.architecture.assignedSolidCoreMassEarth,
        ).toBe(4);

        expect(
          system.architecture.consolidatedAnchorCount,
        ).toBe(1);
      },
    );

    it(
      'should use the mutual-Hill criterion so massive close cores consolidate even beyond the hard radius floor',
      () => {
        const stellarSystem =
          singleSystem(
            new SystemLocator(
              1n,
              6n,
              2n,
            ),
          );

        const system =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              stellarSystem,
              blueprint(
                [
                  anchor(
                    1,
                    1,
                    20,
                  ),
                  anchor(
                    2,
                    1.10,
                    20,
                  ),
                ],
                0.1,
              ),
            );

        expect(
          system.planetCount,
        ).toBe(1);

        expect(
          system.planetSlots[0]
            .phase18ConsolidationCount,
        ).toBe(1);
      },
    );

    it(
      'should derive canonical BodySeed identities from contiguous final planet ordinals without a new seed level',
      () => {
        const locator =
          new SystemLocator(
            8n,
            21n,
            3n,
          );

        const stellarSystem =
          singleSystem(
            locator,
          );

        const system =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              stellarSystem,
              blueprint([
                anchor(
                  1,
                  1,
                  0.1,
                ),
                anchor(
                  2,
                  2,
                  0.1,
                ),
              ]),
            );

        for (
          const slot
          of system.planetSlots
        ) {
          const canonical =
            ProceduralTargetResolver
              .resolveTargetSeed(
                generationKey,
                new BodyLocator(
                  locator.galaxyIndex,
                  locator.sectorKey,
                  locator.galacticObjectIndex,
                  slot.bodyLocator.bodyIndex,
                ),
              );

          expect(
            slot.bodySeed.normalizedValue,
          ).toBe(
            canonical.normalizedValue,
          );
        }

        expect(
          system.seed,
        ).toBe(
          stellarSystem.seed,
        );
      },
    );

    it(
      'should explicitly exclude mature P-type planets when the frozen multiple-star architecture has no stable circumbinary annulus',
      () => {
        const locator =
          new SystemLocator(
            3n,
            4n,
            5n,
          );

        const stellarSystem = {
          generationKey,
          locator,
          seed:
            singleSystem(
              locator,
            ).seed,
          multiplicity:
            StellarSystemMultiplicity.TRIPLE,
          isMultiple:
            true,
          supportsCircumbinaryPlanets:
            false,
          circumbinaryHabitabilityAssessment:
            noStableCircumbinaryHabitability(
              StellarSystemMultiplicity.TRIPLE,
            ),
        } as unknown as StellarSystem;

        const formation =
          blueprint([
            anchor(
              1,
              1,
              1,
            ),
            anchor(
              2,
              4,
              2,
            ),
          ]);

        const system =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              stellarSystem,
              formation,
            );

        expect(
          system.planetCount,
        ).toBe(0);

        expect(
          system.architecture.regime,
        ).toBe(
          PlanetarySystemArchitectureRegime.DYNAMICALLY_EXCLUDED,
        );

        expect(
          system.architecture.orbitTopology,
        ).toBe(
          PlanetarySystemOrbitTopology.CIRCUMBINARY,
        );

        expect(
          system.architecture.excludedSourceAnchorCount,
        ).toBe(2);

        expect(
          system.architecture.excludedSolidCoreMassEarth,
        ).toBe(3);


        expect(
          system.habitableZone.dynamicalRegime,
        ).toBe(
          PlanetarySystemHabitableZoneDynamicalRegime.NO_DYNAMICAL_OVERLAP,
        );
      },
    );

    it(
      'should assign P-type orbital geometry inside the frozen circumbinary compatibility envelope',
      () => {
        const locator =
          new SystemLocator(
            6n,
            7n,
            8n,
          );

        const stellarSystem = {
          generationKey,
          locator,
          seed:
            singleSystem(
              locator,
            ).seed,
          multiplicity:
            StellarSystemMultiplicity.BINARY,
          isMultiple:
            true,
          supportsCircumbinaryPlanets:
            true,
          circumbinaryHabitabilityAssessment:
            noStableCircumbinaryHabitability(
              StellarSystemMultiplicity.BINARY,
            ),
          secondaryCompanion: {
            physicalProperties: {
              initialMassSolar:
                0.5,
            },
          },
          circumbinaryPlanetCompatibility: {
            isCompatible:
              true,
            minimumStableSemiMajorAxisAu:
              3,
            maximumStableSemiMajorAxisAu:
              null,
          },
        } as unknown as StellarSystem;

        const system =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              stellarSystem,
              blueprint([
                anchor(
                  1,
                  2,
                  0.2,
                ),
                anchor(
                  2,
                  5,
                  0.3,
                ),
              ]),
            );

        expect(
          system.architecture.orbitTopology,
        ).toBe(
          PlanetarySystemOrbitTopology.CIRCUMBINARY,
        );

        expect(
          system.planetCount,
        ).toBe(2);

        expect(
          'semiMajorAxisAu' in
            system.planetSlots[0],
        ).toBe(false);

        expect(
          'eccentricity' in
            system.planetSlots[0],
        ).toBe(false);

        expect(
          'orbitalPeriodDays' in
            system.planetSlots[0],
        ).toBe(false);

        expect(
          system.orbits.length,
        ).toBe(2);

        expect(
          system.orbitalPeriodLayout.gravitatingMassSolar,
        ).toBe(1.5);

        expect(
          system.orbitalPeriods[0].periodYears,
        ).toBeCloseTo(
          Math.sqrt(
            system.orbits[0].semiMajorAxisAu **
              3 /
            1.5,
          ),
          14,
        );

        expect(
          system.orbits[0].semiMajorAxisAu,
        ).toBeGreaterThanOrEqual(3);

        expect(
          system.orbits[1].semiMajorAxisAu,
        ).toBeGreaterThan(
          system.orbits[0].semiMajorAxisAu,
        );

        expect(
          system.orbits[0].apoastronAu,
        ).toBeLessThan(
          system.orbits[1].periastronAu,
        );

        expect(
          'orbitalPeriodDays' in
            system.orbits[0],
        ).toBe(false);
      },
    );

    it(
      'should preserve compact and distributed point-18.2 classifications after point-18.3 orbital materialization',
      () => {
        const compact =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              singleSystem(
                new SystemLocator(
                  7n,
                  7n,
                  7n,
                ),
              ),
              blueprint([
                anchor(
                  1,
                  1,
                  0.1,
                ),
                anchor(
                  2,
                  1.6,
                  0.1,
                ),
                anchor(
                  3,
                  2.4,
                  0.1,
                ),
              ]),
            );

        const distributed =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              singleSystem(
                new SystemLocator(
                  9n,
                  9n,
                  9n,
                ),
              ),
              blueprint([
                anchor(
                  1,
                  1,
                  0.1,
                ),
                anchor(
                  2,
                  2.1,
                  0.1,
                ),
                anchor(
                  3,
                  5.5,
                  0.1,
                ),
              ]),
            );

        expect(
          compact.architecture.regime,
        ).toBe(
          PlanetarySystemArchitectureRegime.COMPACT_MULTIPLANET,
        );

        expect(
          distributed.architecture.regime,
        ).toBe(
          PlanetarySystemArchitectureRegime.DISTRIBUTED_MULTIPLANET,
        );
      },
    );

    it(
      'should compress inherited radial ordering into a finite triple circumbinary annulus without crossing orbits',
      () => {
        const locator =
          new SystemLocator(
            12n,
            13n,
            14n,
          );

        const stellarSystem = {
          generationKey,
          locator,
          seed:
            singleSystem(
              locator,
            ).seed,
          multiplicity:
            StellarSystemMultiplicity.TRIPLE,
          isMultiple:
            true,
          supportsCircumbinaryPlanets:
            true,
          circumbinaryHabitabilityAssessment:
            noStableCircumbinaryHabitability(
              StellarSystemMultiplicity.TRIPLE,
            ),
          secondaryCompanion: {
            physicalProperties: {
              initialMassSolar:
                0.5,
            },
          },
          tertiaryCompanion: {
            physicalProperties: {
              initialMassSolar:
                0.2,
            },
          },
          circumbinaryPlanetCompatibility: {
            isCompatible:
              true,
            minimumStableSemiMajorAxisAu:
              2.5,
            maximumStableSemiMajorAxisAu:
              8,
          },
        } as unknown as StellarSystem;

        const system =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              stellarSystem,
              blueprint([
                anchor(
                  1,
                  0.5,
                  0.2,
                ),
                anchor(
                  2,
                  5,
                  0.3,
                ),
                anchor(
                  3,
                  40,
                  0.4,
                ),
              ]),
            );

        expect(
          system.orbitalLayout.generationInnerLimitAu,
        ).toBe(2.5);

        expect(
          system.orbitalLayout.generationOuterLimitAu,
        ).toBe(8);

        expect(
          system.orbits.length,
        ).toBe(3);

        expect(
          system.orbitalPeriodLayout.gravitatingMassSolar,
        ).toBe(1.5);

        for (
          const orbit
          of system.orbits
        ) {
          expect(
            orbit.semiMajorAxisAu,
          ).toBeGreaterThanOrEqual(2.5);

          expect(
            orbit.semiMajorAxisAu,
          ).toBeLessThanOrEqual(8);

          expect(
            orbit.eccentricity,
          ).toBeGreaterThanOrEqual(0);

          expect(
            orbit.eccentricity,
          ).toBeLessThan(1);

          expect(
            orbit.inclinationDegrees,
          ).toBeGreaterThanOrEqual(0);
        }

        for (
          let index = 1;
          index <
            system.orbits.length;
          index += 1
        ) {
          expect(
            system.orbits[index - 1]
              .apoastronAu,
          ).toBeLessThan(
            system.orbits[index]
              .periastronAu,
          );
        }
      },
    );

    it(
      'should be exactly deterministic and independent from unrelated architecture materialization order',
      () => {
        const locator =
          new SystemLocator(
            10n,
            -20n,
            30n,
          );

        const stellarSystem =
          singleSystem(
            locator,
          );

        const formation =
          blueprint([
            anchor(
              1,
              1,
              0.4,
            ),
            anchor(
              2,
              3,
              0.6,
            ),
          ]);

        const before =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              stellarSystem,
              formation,
            );

        PlanetarySystemGenerator
          .generate(
            generationKey,
            singleSystem(
              new SystemLocator(
                99n,
                88n,
                77n,
              ),
            ),
            blueprint([
              anchor(
                1,
                0.5,
                0.2,
              ),
            ]),
          );

        const after =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              stellarSystem,
              formation,
            );

        expect(
          after.architecture.regime,
        ).toBe(
          before.architecture.regime,
        );

        expect(
          after.planetSlots.map(
            slot => ({
              seed:
                slot.bodySeed.normalizedValue,
              radius:
                slot.referenceAssemblyRadiusAu,
              anchors:
                slot.sourceAnchorOrdinals,
            })),
        ).toEqual(
          before.planetSlots.map(
            slot => ({
              seed:
                slot.bodySeed.normalizedValue,
              radius:
                slot.referenceAssemblyRadiusAu,
              anchors:
                slot.sourceAnchorOrdinals,
            })),
        );

        expect(
          after.orbits.map(
            orbit => ({
              seed:
                orbit.bodySeed.normalizedValue,
              semiMajorAxisAu:
                orbit.semiMajorAxisAu,
              eccentricity:
                orbit.eccentricity,
              inclinationDegrees:
                orbit.inclinationDegrees,
              node:
                orbit.longitudeOfAscendingNodeDegrees,
              periapsis:
                orbit.argumentOfPeriapsisDegrees,
            })),
        ).toEqual(
          before.orbits.map(
            orbit => ({
              seed:
                orbit.bodySeed.normalizedValue,
              semiMajorAxisAu:
                orbit.semiMajorAxisAu,
              eccentricity:
                orbit.eccentricity,
              inclinationDegrees:
                orbit.inclinationDegrees,
              node:
                orbit.longitudeOfAscendingNodeDegrees,
              periapsis:
                orbit.argumentOfPeriapsisDegrees,
            })),
        );

        expect(
          after.orbitalPeriods.map(
            period => ({
              seed:
                period.bodySeed.normalizedValue,
              semiMajorAxisAu:
                period.sourceSemiMajorAxisAu,
              massSolar:
                period.gravitatingMassSolar,
              periodYears:
                period.periodYears,
              periodDays:
                period.periodDays,
            })),
        ).toEqual(
          before.orbitalPeriods.map(
            period => ({
              seed:
                period.bodySeed.normalizedValue,
              semiMajorAxisAu:
                period.sourceSemiMajorAxisAu,
              massSolar:
                period.gravitatingMassSolar,
              periodYears:
                period.periodYears,
              periodDays:
                period.periodDays,
            })),
        );

        expect(
          after.orbitHabitableZoneClassifications.map(
            classification => ({
              seed:
                classification.bodySeed.normalizedValue,
              periastronAu:
                classification.sourcePeriastronAu,
              apoastronAu:
                classification.sourceApoastronAu,
              radiativeRelation:
                classification.radiativeRelation,
              dynamicRelation:
                classification.dynamicallyAvailableRelation,
            })),
        ).toEqual(
          before.orbitHabitableZoneClassifications.map(
            classification => ({
              seed:
                classification.bodySeed.normalizedValue,
              periastronAu:
                classification.sourcePeriastronAu,
              apoastronAu:
                classification.sourceApoastronAu,
              radiativeRelation:
                classification.radiativeRelation,
              dynamicRelation:
                classification.dynamicallyAvailableRelation,
            })),
        );
      },
    );

    it(
      'should integrate point 18.7 orbit-to-HZ classification without changing the frozen 18.2-18.6 products',
      () => {
        const system =
          PlanetarySystemGenerator
            .generate(
              generationKey,
              singleSystem(
                new SystemLocator(
                  12n,
                  13n,
                  14n,
                ),
              ),
              blueprint([
                anchor(
                  1,
                  1,
                  0.1,
                ),
                anchor(
                  2,
                  3,
                  0.1,
                ),
              ]),
            );

        expect(
          system.stabilityAssessment.planetCount,
        ).toBe(
          system.planetCount,
        );

        expect(
          system.stabilityAssessment.pairCount,
        ).toBe(1);

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
          system.habitableZone.radiativeInnerEdgeAu,
        ).toBeGreaterThan(0);

        expect(
          system.habitableZone.radiativeOuterEdgeAu,
        ).toBeGreaterThan(
          system.habitableZone.radiativeInnerEdgeAu,
        );

        expect(
          system.orbitHabitableZoneClassifications.length,
        ).toBe(
          system.planetCount,
        );

        for (
          let index = 0;
          index <
            system.orbits.length;
          index += 1
        ) {
          const orbit =
            system.orbits[index];

          const classification =
            system.orbitHabitableZoneClassifications[index];

          expect(
            classification.bodyLocator,
          ).toBe(
            orbit.bodyLocator,
          );

          expect(
            classification.bodySeed,
          ).toBe(
            orbit.bodySeed,
          );

          expect(
            classification.sourcePeriastronAu,
          ).toBe(
            orbit.periastronAu,
          );

          expect(
            classification.sourceApoastronAu,
          ).toBe(
            orbit.apoastronAu,
          );

          expect(
            Object.values(
              PlanetaryOrbitHabitableZoneRelation,
            ),
          ).toContain(
            classification.radiativeRelation,
          );

          expect(
            classification.dynamicallyAvailableRelation,
          ).not.toBeNull();
        }
      },
    );

    it(
      'should reject a stellar system that belongs to another universe generation key',
      () => {
        const locator =
          new SystemLocator(
            0n,
            0n,
            0n,
          );

        const foreignKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '1122-3344-5566-7788-99AA-BBCC-DDEE-FF00',
            ),
            GeneratorVersion.V1,
          );

        const foreignSystem =
          StellarSystemGenerator
            .generateSingle(
              foreignKey,
              locator,
              sector,
              population,
            );

        expect(
          () =>
            PlanetarySystemGenerator
              .generate(
                generationKey,
                foreignSystem,
                blueprint([]),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function singleSystem(
      locator:
        SystemLocator,
    ): StellarSystem {

      return StellarSystemGenerator
        .generateSingle(
          generationKey,
          locator,
          sector,
          population,
        );
    }
  },
);

function noStableCircumbinaryHabitability(
  multiplicity:
    StellarSystemMultiplicity,
): CircumbinaryHabitabilityAssessment {

  const luminositySolar =
    1;

  const innerEdge =
    Math.sqrt(
      luminositySolar /
      1.107,
    );

  const outerEdge =
    Math.sqrt(
      luminositySolar /
      0.356,
    );

  return new CircumbinaryHabitabilityAssessment(
    multiplicity,
    luminositySolar,
    innerEdge,
    outerEdge,
    null,
    null,
    0,
    CircumbinaryPlanetaryStabilityRegime.NO_STABLE_HABITABLE_ZONE,
    CircumbinaryStellarEvolutionRegime.MAIN_SEQUENCE_PAIR,
  );
}

function blueprint(
  anchors:
    readonly PlanetaryFormationAnchor[],

  centralMassSolar =
    1,
): PlanetarySystemFormationBlueprint {

  const sourceCandidateCount =
    anchors.reduce(
      (
        total,
        anchorValue,
      ) =>
        total +
        anchorValue
          .sourceFormationOrdinals
          .length,
      0,
    );

  const sourceSurvivorCount =
    anchors.length;

  const sourceCollisionCount =
    sourceCandidateCount -
    sourceSurvivorCount;

  const sourceCandidateSolidMassEarth =
    anchors.reduce(
      (
        total,
        anchorValue,
      ) =>
        total +
        anchorValue
          .solidCoreMassEarth,
      0,
    );

  const residualDustMassEarth =
    5;

  return new PlanetarySystemFormationBlueprint(
    1,
    6,
    20,
    centralMassSolar,
    0.05,
    100,
    4_000,
    sourceCandidateSolidMassEarth +
      residualDustMassEarth,
    sourceCandidateSolidMassEarth,
    residualDustMassEarth,
    Math.min(
      0.5,
      4_000,
    ),
    sourceCandidateCount,
    sourceSurvivorCount,
    0,
    sourceCollisionCount,
    anchors.length ===
      0
      ? PlanetaryFormationMaturityRegime.NO_PLANET_FORMING_CORES
      : PlanetaryFormationMaturityRegime.SOLID_CORE_SYSTEM,
    anchors,
  );
}

function anchor(
  ordinal:
    number,

  radiusAu:
    number,

  solidMassEarth:
    number,

  composition =
    new ProtoplanetCompositionMixture(
      0,
      1,
      0,
      0,
    ),

  consolidationIndex01 =
    0.8,

  dynamicalExcitationIndex01 =
    0.1,
): PlanetaryFormationAnchor {

  return new PlanetaryFormationAnchor(
    ordinal,
    [
      ordinal,
    ],
    radiusAu,
    solidMassEarth,
    composition,
    consolidationIndex01,
    0.25,
    0.65,
    dynamicalExcitationIndex01,
    0,
  );
}
