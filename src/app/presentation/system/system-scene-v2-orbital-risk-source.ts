import { type GeneratedSingleHost } from '../../simulation/stellar/stellar-multihost-formation';
import { type MinorBodyOrbitalElementsCatalog } from '../../domain/planetary/minor-body-orbital-elements-catalog';
import { type MinorBodyImpactRiskCatalog } from '../../domain/planetary/minor-body-impact-risk-catalog';
import { MinorBodyDynamicsEngine } from '../../simulation/planetary/minor-body-dynamics-engine';

/**
 * RISK-R1 — read-only V2 scene adapter for the already materialized SINGLE
 * physical host. Reuse the EXACT minor-body orbital catalog rendered by the
 * same scene, and the exact host planets and relevant moons; no V1 public
 * identity fallback, new orbital elements, evolution or impact realization.
 */
export function v2HostMinorBodyImpactRiskCatalog(
  host: GeneratedSingleHost,
  catalog: MinorBodyOrbitalElementsCatalog | null,
): MinorBodyImpactRiskCatalog | null {
  if (catalog === null) return null;
  if (host.planetarySystem === null || host.asteroidBelts === null ||
      catalog.dynamicsState.hostPlanetarySystem !== host.planetarySystem ||
      catalog.dynamicsState.asteroidBeltSystem !== host.asteroidBelts ||
      !host.internalGenerationKey.equals(host.planetarySystem.generationKey) ||
      host.planets.some(planet => planet.hostPlanetarySystem !== host.planetarySystem) ||
      host.moonSystems.some(system => !host.planets.includes(system.hostPlanet))) {
    throw new Error('V2 orbital risk requires the identical frozen physical host and orbital catalog.');
  }
  // Without targets or minor-body trajectories, there is no assessable matrix.
  if (host.planets.length === 0 || catalog.entries.length === 0) return null;

  const proximity = MinorBodyDynamicsEngine.proximities(
    catalog, host.planets, host.moonSystems,
  );
  const resonances = MinorBodyDynamicsEngine.resonances(catalog, proximity);
  const giantInfluences = MinorBodyDynamicsEngine.giantInfluences(resonances);
  const encounters = MinorBodyDynamicsEngine.closeEncounters(giantInfluences);
  return MinorBodyDynamicsEngine.impactRisks(encounters);
}
