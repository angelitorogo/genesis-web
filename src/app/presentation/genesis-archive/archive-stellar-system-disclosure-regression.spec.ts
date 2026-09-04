import {
  vi,
} from 'vitest';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  SeedDeriver,
} from '../../simulation/seed/seed-deriver';

import {
  StellarSystemGenerator,
} from '../../simulation/stellar/stellar-system-generator';

import {
  ArchiveStellarSystemCardAssembler,
  ArchiveStellarSystemKnowledgeLevel,
} from './archive-stellar-system-card';

const GENERATION_KEY =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V1,
  );

const LOCATOR =
  new SystemLocator(
    0n,
    10n,
    7n,
  );

describe(
  'point 26.A.10 stellar-system Ground Truth disclosure regression',
  () => {
    afterEach(
      () => {
        vi.restoreAllMocks();
      },
    );

    it(
      'should not resolve SystemSeed or materialize stellar physics while the system remains DETECTED',
      () => {
        const systemSeedDeriver =
          vi.spyOn(
            SeedDeriver,
            'system',
          );

        const systemGenerator =
          vi.spyOn(
            StellarSystemGenerator,
            'generate',
          );

        const card =
          ArchiveStellarSystemCardAssembler
            .build(
              GENERATION_KEY,
              LOCATOR,
              DiscoveryState.DETECTED,
            );

        expect(
          systemSeedDeriver,
        ).not.toHaveBeenCalled();

        expect(
          systemGenerator,
        ).not.toHaveBeenCalled();

        expect(
          card.knowledgeLevel,
        ).toBe(
          ArchiveStellarSystemKnowledgeLevel.DETECTED,
        );

        expect(
          card.multiplicityLabel,
        ).toBeNull();

        expect(
          card.componentCount,
        ).toBeNull();

        expect(
          card.components,
        ).toHaveLength(0);

        expect(
          card.orbits,
        ).toHaveLength(0);

        expect(
          card.render.components[0]
            ?.massSolar,
        ).toBeNull();
      },
    );

    it(
      'should keep DISCOVERED and VISITED on the exact same identified disclosure layer without physical magnitudes',
      () => {
        const systemGenerator =
          vi.spyOn(
            StellarSystemGenerator,
            'generate',
          );

        const discovered =
          ArchiveStellarSystemCardAssembler
            .build(
              GENERATION_KEY,
              LOCATOR,
              DiscoveryState.DISCOVERED,
            );

        const visited =
          ArchiveStellarSystemCardAssembler
            .build(
              GENERATION_KEY,
              LOCATOR,
              DiscoveryState.VISITED,
            );

        expect(
          discovered,
        ).toEqual(
          visited,
        );

        expect(
          discovered.knowledgeLevel,
        ).toBe(
          ArchiveStellarSystemKnowledgeLevel.IDENTIFIED,
        );

        expect(
          discovered.components.length,
        ).toBeGreaterThan(0);

        expect(
          discovered.components.every(
            component =>
              component.spectralType ===
                null &&
              component.evolutionStateLabel ===
                null &&
              component.facts.length ===
                0,
          ),
        ).toBe(true);

        expect(
          discovered.render.components.every(
            component =>
              component.massSolar ===
                null,
          ),
        ).toBe(true);

        expect(
          discovered.orbits,
        ).toHaveLength(0);

        expect(
          discovered.habitabilityFacts,
        ).toHaveLength(0);

        expect(
          systemGenerator,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'should materialize physical/orbital facts only at CATALOGUED and keep confirmed-only habitability locked until CONFIRMED',
      () => {
        const catalogued =
          ArchiveStellarSystemCardAssembler
            .build(
              GENERATION_KEY,
              LOCATOR,
              DiscoveryState.CATALOGUED,
            );

        const confirmed =
          ArchiveStellarSystemCardAssembler
            .build(
              GENERATION_KEY,
              LOCATOR,
              DiscoveryState.CONFIRMED,
            );

        expect(
          catalogued.knowledgeLevel,
        ).toBe(
          ArchiveStellarSystemKnowledgeLevel.CATALOGUED,
        );

        expect(
          catalogued.components.some(
            component =>
              component.spectralType !==
                null,
          ),
        ).toBe(true);

        expect(
          catalogued.habitabilityFacts,
        ).toHaveLength(0);

        expect(
          catalogued.render.stableHabitableZoneFraction,
        ).toBeNull();

        expect(
          confirmed.knowledgeLevel,
        ).toBe(
          ArchiveStellarSystemKnowledgeLevel.CONFIRMED,
        );

        if (
          confirmed.multiplicityLabel ===
            'Simple'
        ) {
          expect(
            confirmed.habitabilityFacts,
          ).toHaveLength(0);
        } else {
          expect(
            confirmed.habitabilityFacts.length,
          ).toBeGreaterThan(0);

          expect(
            confirmed.habitabilityFacts,
          ).not.toEqual(
            catalogued.habitabilityFacts,
          );
        }
      },
    );
  },
);
