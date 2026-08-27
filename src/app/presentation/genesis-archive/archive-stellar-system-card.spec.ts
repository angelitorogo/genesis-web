import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ProceduralTargetResolver,
} from '../../simulation/regeneration/procedural-target-resolver';

import {
  StellarSystemMultiplicitySelector,
} from '../../simulation/stellar/stellar-system-multiplicity-selector';

import {
  ArchiveStellarSystemCardAssembler,
  ArchiveStellarSystemKnowledgeLevel,
} from './archive-stellar-system-card';

const generationKey =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V1,
  );

describe(
  'ArchiveStellarSystemCardAssembler point 16.7',
  () => {
    it(
      'should keep DETECTED renderer-only and not require a physically valid sector to avoid leaking Ground Truth',
      () => {
        const card =
          ArchiveStellarSystemCardAssembler
            .build(
              generationKey,
              new SystemLocator(
                0n,
                (1n << 63n) - 1n,
                99n,
              ),
              DiscoveryState.DETECTED,
            );

        expect(card.knowledgeLevel).toBe(
          ArchiveStellarSystemKnowledgeLevel.DETECTED,
        );

        expect(card.title).toBe(
          'Sistema estelar sin resolver',
        );

        expect(card.multiplicityLabel).toBeNull();
        expect(card.componentCount).toBeNull();
        expect(card.components).toEqual([]);
        expect(card.orbits).toEqual([]);
        expect(card.render.multiplicity).toBeNull();
      },
    );

    it(
      'should reveal only designation and multiplicity at DISCOVERED without exposing stellar physical facts or orbit elements',
      () => {
        const card =
          ArchiveStellarSystemCardAssembler
            .build(
              generationKey,
              new SystemLocator(
                0n,
                0n,
                0n,
              ),
              DiscoveryState.DISCOVERED,
            );

        expect(card.knowledgeLevel).toBe(
          ArchiveStellarSystemKnowledgeLevel.IDENTIFIED,
        );

        expect(card.title).toBe(
          'Jotheria',
        );

        expect(card.multiplicityLabel).toBe(
          'Simple',
        );

        expect(card.componentCount).toBe(1);
        expect(card.components).toHaveLength(1);
        expect(card.components[0]?.designation).toBe(
          'Jotheria A',
        );
        expect(card.components[0]?.facts).toEqual([]);
        expect(card.orbits).toEqual([]);
        expect(card.circumbinaryFacts).toEqual([]);
        expect(card.habitabilityFacts).toEqual([]);
      },
    );

    it(
      'should materialize component and orbit fiches for one catalogued BINARY while keeping point-16.6 habitability hidden until CONFIRMED',
      () => {
        const locator =
          findLocatorForMultiplicity(
            StellarSystemMultiplicity.BINARY,
          );

        const card =
          ArchiveStellarSystemCardAssembler
            .build(
              generationKey,
              locator,
              DiscoveryState.CATALOGUED,
            );

        expect(card.knowledgeLevel).toBe(
          ArchiveStellarSystemKnowledgeLevel.CATALOGUED,
        );

        expect(card.multiplicityLabel).toBe(
          'Binario',
        );

        expect(card.components).toHaveLength(2);
        expect(card.components[0]?.componentLabel).toBe('A');
        expect(card.components[1]?.componentLabel).toBe('B');
        expect(card.components[0]?.facts.length).toBeGreaterThan(0);
        expect(card.components[1]?.facts.length).toBeGreaterThan(0);
        expect(card.orbits).toHaveLength(1);
        expect(card.circumbinaryFacts.length).toBeGreaterThan(0);
        expect(card.habitabilityFacts).toEqual([]);
        expect(card.render.innerOrbitEccentricity).not.toBeNull();
        expect(card.render.stableHabitableZoneFraction).toBeNull();
      },
      15_000,
    );

    it(
      'should expose the complete confirmed triple fiche including A-B/C hierarchy and point-16.6 habitability assessment',
      () => {
        const locator =
          findLocatorForMultiplicity(
            StellarSystemMultiplicity.TRIPLE,
          );

        const card =
          ArchiveStellarSystemCardAssembler
            .build(
              generationKey,
              locator,
              DiscoveryState.CONFIRMED,
            );

        expect(card.knowledgeLevel).toBe(
          ArchiveStellarSystemKnowledgeLevel.CONFIRMED,
        );

        expect(card.multiplicityLabel).toBe(
          'Triple',
        );

        expect(card.components.map(
          component => component.componentLabel,
        )).toEqual([
          'A',
          'B',
          'C',
        ]);

        expect(card.orbits).toHaveLength(2);
        expect(card.circumbinaryFacts.length).toBeGreaterThan(0);
        expect(card.habitabilityFacts.length).toBeGreaterThan(0);
        expect(card.render.innerOrbitEccentricity).not.toBeNull();
        expect(card.render.outerOrbitEccentricity).not.toBeNull();
        expect(card.render.stableHabitableZoneFraction).not.toBeNull();
      },
      15_000,
    );
  },
);

function findLocatorForMultiplicity(
  target:
    StellarSystemMultiplicity,
): SystemLocator {

  for (
    let index = 0;
    index < 4_096;
    index += 1
  ) {
    const locator =
      new SystemLocator(
        0n,
        0n,
        BigInt(index),
      );

    const seed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        ) as SystemSeed;

    if (
      StellarSystemMultiplicitySelector
        .select(
          generationKey,
          seed,
        ) ===
      target
    ) {
      return locator;
    }
  }

  throw new Error(
    `No fixture found for multiplicity ${target.name}.`,
  );
}
