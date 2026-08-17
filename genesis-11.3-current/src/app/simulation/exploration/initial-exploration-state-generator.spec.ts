import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GalaxyLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GenesisUniverse,
} from '../../domain/universe/genesis-universe';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  InitialExplorationStateGenerator,
} from './initial-exploration-state-generator';

describe(
  'InitialExplorationStateGenerator',
  () => {
    const canonicalUniverseSeed =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    const canonicalGenerationKey =
      new UniverseGenerationKey(
        canonicalUniverseSeed,
        GeneratorVersion.V1,
      );

    it(
      'should start focused on the canonical initial galaxy',
      () => {
        const state =
          InitialExplorationStateGenerator
            .generate(
              canonicalGenerationKey,
            );

        expect(
          state.activeGalaxyIndex,
        ).toBe(
          GenesisUniverse
            .INITIAL_GALAXY_INDEX,
        );

        expect(
          state.activeGalaxyIndex,
        ).toBe(
          0n,
        );
      },
    );

    it(
      'should start with exactly zero discovery points',
      () => {
        const state =
          InitialExplorationStateGenerator
            .generate(
              canonicalGenerationKey,
            );

        expect(
          state.discoveryPoints,
        ).toBe(
          0n,
        );
      },
    );

    it(
      'should initially know exactly one procedural target',
      () => {
        const state =
          InitialExplorationStateGenerator
            .generate(
              canonicalGenerationKey,
            );

        expect(
          state
            .knownDiscoveries
            .size,
        ).toBe(
          1,
        );
      },
    );

    it(
      'should reproduce the exact Android V1 bootstrap discovery',
      () => {
        const state =
          InitialExplorationStateGenerator
            .generate(
              canonicalGenerationKey,
            );

        const entries =
          Array.from(
            state
              .knownDiscoveries
              .entries(),
          );

        expect(
          entries,
        ).toHaveLength(
          1,
        );

        const entry =
          entries[0];

        expect(
          entry,
        ).toBeDefined();

        if (
          entry ===
          undefined
        ) {
          throw new Error(
            'Expected the canonical initial discovery entry.',
          );
        }

        const [
          locator,
          discoveryState,
        ] =
          entry;

        expect(
          locator,
        ).toBeInstanceOf(
          GalaxyLocator,
        );

        if (
          !(
            locator instanceof
            GalaxyLocator
          )
        ) {
          throw new Error(
            'Expected the canonical initial locator to be GalaxyLocator.',
          );
        }

        expect(
          locator.galaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          discoveryState,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );
      },
    );

    it(
      'should leave every target except the initial galaxy UNKNOWN by absence',
      () => {
        const state =
          InitialExplorationStateGenerator
            .generate(
              canonicalGenerationKey,
            );

        const locators =
          Array.from(
            state
              .knownDiscoveries
              .keys(),
          );

        expect(
          locators,
        ).toHaveLength(
          1,
        );

        const locator =
          locators[0];

        expect(
          locator,
        ).toBeInstanceOf(
          GalaxyLocator,
        );

        if (
          !(
            locator instanceof
            GalaxyLocator
          )
        ) {
          throw new Error(
            'Expected the only known target to be a GalaxyLocator.',
          );
        }

        expect(
          locator.galaxyIndex,
        ).toBe(
          0n,
        );
      },
    );

    it(
      'should not materialize UNKNOWN in the bootstrap snapshot',
      () => {
        const state =
          InitialExplorationStateGenerator
            .generate(
              canonicalGenerationKey,
            );

        const discoveryStates =
          Array.from(
            state
              .knownDiscoveries
              .values(),
          );

        expect(
          discoveryStates,
        ).not.toContain(
          DiscoveryState.UNKNOWN,
        );

        expect(
          discoveryStates,
        ).toEqual([
          DiscoveryState.DISCOVERED,
        ]);
      },
    );

    it(
      'should be exactly deterministic for the same generation key',
      () => {
        const first =
          InitialExplorationStateGenerator
            .generate(
              canonicalGenerationKey,
            );

        const second =
          InitialExplorationStateGenerator
            .generate(
              canonicalGenerationKey,
            );

        expect(
          second.activeGalaxyIndex,
        ).toBe(
          first.activeGalaxyIndex,
        );

        expect(
          second.discoveryPoints,
        ).toBe(
          first.discoveryPoints,
        );

        expect(
          Array.from(
            second
              .knownDiscoveries
              .entries(),
          ),
        ).toEqual(
          Array.from(
            first
              .knownDiscoveries
              .entries(),
          ),
        );
      },
    );

    it(
      'should preserve the same V1 bootstrap semantics across universe seeds',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '1234-5678-9ABC-DEF0-1234-5678-9ABC-DEF0',
            ),
            GeneratorVersion.V1,
          );

        const canonicalState =
          InitialExplorationStateGenerator
            .generate(
              canonicalGenerationKey,
            );

        const otherState =
          InitialExplorationStateGenerator
            .generate(
              otherGenerationKey,
            );

        expect(
          otherState.activeGalaxyIndex,
        ).toBe(
          canonicalState.activeGalaxyIndex,
        );

        expect(
          otherState.discoveryPoints,
        ).toBe(
          canonicalState.discoveryPoints,
        );

        const canonicalEntries =
          Array.from(
            canonicalState
              .knownDiscoveries
              .entries(),
          );

        const otherEntries =
          Array.from(
            otherState
              .knownDiscoveries
              .entries(),
          );

        expect(
          canonicalEntries,
        ).toHaveLength(
          1,
        );

        expect(
          otherEntries,
        ).toHaveLength(
          1,
        );

        const canonicalEntry =
          canonicalEntries[0];

        const otherEntry =
          otherEntries[0];

        expect(
          canonicalEntry,
        ).toBeDefined();

        expect(
          otherEntry,
        ).toBeDefined();

        if (
          canonicalEntry ===
            undefined ||
          otherEntry ===
            undefined
        ) {
          throw new Error(
            'Expected one bootstrap discovery entry for each universe.',
          );
        }

        const [
          canonicalLocator,
          canonicalDiscoveryState,
        ] =
          canonicalEntry;

        const [
          otherLocator,
          otherDiscoveryState,
        ] =
          otherEntry;

        expect(
          canonicalLocator,
        ).toBeInstanceOf(
          GalaxyLocator,
        );

        expect(
          otherLocator,
        ).toBeInstanceOf(
          GalaxyLocator,
        );

        if (
          !(
            canonicalLocator instanceof
            GalaxyLocator
          ) ||
          !(
            otherLocator instanceof
            GalaxyLocator
          )
        ) {
          throw new Error(
            'Expected bootstrap locators to be GalaxyLocator instances.',
          );
        }

        expect(
          otherLocator.galaxyIndex,
        ).toBe(
          canonicalLocator.galaxyIndex,
        );

        expect(
          otherDiscoveryState,
        ).toBe(
          canonicalDiscoveryState,
        );

        expect(
          otherDiscoveryState,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );
      },
    );

    it(
      'should create independent discovery snapshots on repeated generation',
      () => {
        const first =
          InitialExplorationStateGenerator
            .generate(
              canonicalGenerationKey,
            );

        const second =
          InitialExplorationStateGenerator
            .generate(
              canonicalGenerationKey,
            );

        expect(
          second
            .knownDiscoveries,
        ).not.toBe(
          first
            .knownDiscoveries,
        );

        expect(
          Array.from(
            second
              .knownDiscoveries
              .entries(),
          ),
        ).toEqual(
          Array.from(
            first
              .knownDiscoveries
              .entries(),
          ),
        );
      },
    );

    it(
      'should reject unsupported generator versions',
      () => {
        const unsupportedGenerationKey =
          {
            universeSeed:
              canonicalUniverseSeed,

            generatorVersion: {
              code:
                999,
            },
          } as unknown as
            UniverseGenerationKey;

        expect(
          () =>
            InitialExplorationStateGenerator
              .generate(
                unsupportedGenerationKey,
              ),
        ).toThrow(
          'Unsupported GeneratorVersion: 999.',
        );
      },
    );
  },
);