import { type GeneratedSingleHost } from '../../simulation/stellar/stellar-multihost-formation';
import { type MinorBodyOrbitalElementsCatalog } from '../../domain/planetary/minor-body-orbital-elements-catalog';
import { CometGenerator } from '../../simulation/planetary/comet-generator';
import { TransNeptunianObjectGenerator } from '../../simulation/planetary/trans-neptunian-object-generator';
import { InterstellarObjectGenerator } from '../../simulation/planetary/interstellar-object-generator';
import { CapturedExtrasolarObjectGenerator } from '../../simulation/planetary/captured-extrasolar-object-generator';
import { MinorBodyDynamicsEngine } from '../../simulation/planetary/minor-body-dynamics-engine';

/**
 * V2 renderer-only adapter: use the SAME private V1 host, disk, belt and seed
 * already materialized for this stellar component. No synthetic objects, no
 * replacement of physical distribution and no public V1 body identities.
 * The caller must check CONFIRMED access before invoking this function.
 */
export function v2HostMinorBodyOrbitalCatalog(
  host: GeneratedSingleHost,
): MinorBodyOrbitalElementsCatalog | null {
  const system = host.planetarySystem;
  const belts = host.asteroidBelts;
  if (system === null || belts === null) return null;
  if (!host.internalGenerationKey.equals(system.generationKey) ||
      belts.hostPlanetarySystem !== system) {
    throw new Error('V2 minor-body projection requires the exact physical host and belt.');
  }
  const key = host.internalGenerationKey;
  const dynamics = MinorBodyDynamicsEngine.initialize(
    key, system, belts,
    CometGenerator.generate(key, system),
    TransNeptunianObjectGenerator.generate(key, system),
    InterstellarObjectGenerator.generate(key, system),
    CapturedExtrasolarObjectGenerator.generate(key, system),
  );
  return MinorBodyDynamicsEngine.orbitalElements(dynamics);
}
