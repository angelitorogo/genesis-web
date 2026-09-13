import {
  BodyLocator,
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
  PlanetScientificTargetResolver,
} from './planet-scientific-target-resolver';

describe(
  'PlanetScientificTargetResolver point 26.4',
  () => {

    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const locator =
      new BodyLocator(
        3n,
        -17n,
        8n,
        0n,
      );

    it(
      'should preserve the 26.3 identity-only boundary when requested explicitly',
      () => {
        const identity =
          PlanetScientificTargetResolver
            .resolve(
              generationKey,
              locator,
            );

        expect(identity).not.toBeNull();
        expect(identity?.locator.bodyIndex).toBe(
          0n,
        );
        expect(identity?.planetOrdinal).toBe(
          1,
        );
        expect(identity?.hostPlanetCount).toBeGreaterThan(
          0,
        );
      },
    );

    it(
      'should materialize one safe phase-19/20/21 detailed projection for 26.4',
      () => {
        const target =
          PlanetScientificTargetResolver
            .resolveDetailed(
              generationKey,
              locator,
            );

        expect(target).not.toBeNull();

        if (
          target ===
            null
        ) {
          throw new Error(
            'Expected a mature planet at the reference system locator.',
          );
        }

        expect(target.identity.locator.bodyIndex).toBe(
          0n,
        );
        expect(target.detail.general.massEarth).toBeGreaterThan(
          0,
        );
        expect(target.detail.general.radiusEarth).toBeGreaterThan(
          0,
        );
        expect(target.detail.orbit.periodDays).toBeGreaterThan(
          0,
        );
        expect(target.detail.climate.equilibriumTemperatureKelvin).toBeGreaterThan(
          0,
        );
        expect(target.detail.moons.relevantMoonCount).toBe(
          target.detail.moons.relevantMoons.length,
        );
        expect(
          Object.isFrozen(
            target.detail,
          ),
        ).toBe(true);
        expect(
          Object.isFrozen(
            target.detail.atmosphere.retainedGasComposition,
          ),
        ).toBe(true);
        expect(
          Object.isFrozen(
            target.detail.moons.relevantMoons,
          ),
        ).toBe(true);

        const serialized =
          JSON.stringify(
            target.detail,
          );

        for (
          const forbidden
          of [
            'bodySeed',
            'systemSeed',
            'moonSeed',
            'generationKey',
            'formationBlueprint',
            'hostPlanet',
            'planetarySystem',
          ]
        ) {
          expect(serialized).not.toContain(
            forbidden,
          );
        }
      },
      30_000,
    );
  },
);
