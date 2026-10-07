import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { ProceduralTargetResolver } from '../regeneration/procedural-target-resolver';
import { StellarMultihostFormation } from './stellar-multihost-formation';
import { multihostPhysicalSourceKey } from './stellar-multihost-physical-source-key';
import { StellarSystemMultiplicitySelector } from './stellar-system-multiplicity-selector';

const ROOT =
  '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

const keys = [
  new UniverseGenerationKey(
    UniverseSeed.parse(ROOT),
    GeneratorVersion.V1,
  ),
  new UniverseGenerationKey(
    UniverseSeed.parse(ROOT),
    GeneratorVersion.V2,
  ),
] as const;

function fixture(
  key: UniverseGenerationKey,
  multiplicity: StellarSystemMultiplicity,
): SystemLocator {
  const physicalKey =
    multihostPhysicalSourceKey(key);

  for (
    let index = 0n;
    index < 512n;
    index += 1n
  ) {
    const locator =
      new SystemLocator(
        0n,
        0n,
        index,
      );

    const seed =
      ProceduralTargetResolver.resolveTargetSeed(
        physicalKey,
        locator,
      );

    if (
      StellarSystemMultiplicitySelector.select(
        physicalKey,
        seed as Parameters<
          typeof StellarSystemMultiplicitySelector.select
        >[1],
      ) === multiplicity
    ) {
      return locator;
    }
  }

  throw new Error(
    `No ${multiplicity.name} fixture in first 512 objects.`,
  );
}

describe(
  '29.1E-f multihost common chronological age',
  () => {
    for (const key of keys) {
      for (const multiplicity of [
        StellarSystemMultiplicity.BINARY,
        StellarSystemMultiplicity.TRIPLE,
      ] as const) {
        it(
          `keeps every ${multiplicity.name} A/B/C component coeval in ${key.generatorVersion.name}`,
          () => {
            const locator =
              fixture(
                key,
                multiplicity,
              );

            const first =
              StellarMultihostFormation.generateOrNull(
                key,
                locator,
              )!;

            const replay =
              StellarMultihostFormation.generateOrNull(
                key,
                locator,
              )!;

            const canonicalAge =
              first.components[0]!
                .lifetime
                .ageBillionYears;

            expect(
              first.components.length,
            ).toBe(
              multiplicity.stellarComponentCount,
            );

            expect(
              first.components.every(
                component =>
                  component.lifetime.ageBillionYears ===
                  canonicalAge,
              ),
            ).toBe(true);

            expect(
              replay.components.map(
                component =>
                  component.lifetime.ageBillionYears,
              ),
            ).toEqual(
              first.components.map(
                component =>
                  component.lifetime.ageBillionYears,
              ),
            );

            for (const component of first.components) {
              const assessment =
                component.lifetime.evolutionAssessment;

              const star =
                component.stellarSystem.primaryStar;

              expect(
                star.evolutionState,
              ).toBe(
                assessment.evolutionState,
              );

              expect(
                star.mainSequenceClass,
              ).toBe(
                assessment.mainSequenceClass,
              );

              expect(
                star.brownDwarfClass,
              ).toBe(
                assessment.brownDwarfClass,
              );

              expect(
                star.postMainSequenceStage,
              ).toBe(
                assessment.postMainSequenceStage,
              );

              expect(
                star.whiteDwarfComposition,
              ).toBe(
                assessment.whiteDwarfComposition,
              );

              expect(
                star.neutronStarFormationChannel,
              ).toBe(
                assessment.neutronStarFormationChannel,
              );

              expect(
                star.blackHoleFormationChannel,
              ).toBe(
                assessment.blackHoleFormationChannel,
              );

              if (
                component.planetarySystem !==
                null
              ) {
                expect(
                  component.planetarySystem.hostStellarSystem,
                ).toBe(
                  component.stellarSystem,
                );
              }
            }
          },
        );
      }
    }
  },
);
