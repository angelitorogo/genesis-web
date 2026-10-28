/** VIDA.9b — read-only effective CT-0 projection for confirmed V3 planet catalogues.
 * This intentionally mirrors the *same* VIDA.3→4→5a→5b→5c chain used by the
 * planet scientific fiche. No independent oxygen/pressure/temperature model,
 * new rolls, IndexedDB writes, or changes to frozen PRE-33 state.
 */
import type { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import type { BodyLocator } from '../../domain/generation/procedural-locator';
import type { PlanetScientificResolvedTarget } from '../../simulation/planetary/planet-scientific-target-resolver';
import { Vida2PhysicalInput } from '../../simulation/life/life-plausibility-physical-adapter-vida2';
import { ProceduralMicrobialLifeVIDA3 } from '../../simulation/life/procedural-microbial-life-vida3';
import { ProceduralEcologyVIDA4 } from '../../simulation/life/procedural-ecology-vida4';
import { Vida5aEcologyAtmosphere } from '../../simulation/life/vida5a-ecology-atmosphere';
import { Vida5bEcologicalMaturation } from '../../simulation/life/vida5b-ecological-maturation';
import { Vida5cAdvancedBiospheres } from '../../simulation/life/vida5c-advanced-biospheres';
import { Vida5BiogenicAtmosphere } from '../../simulation/life/vida5-biogenic-atmosphere';

/** No fake result: an unresolved V3 target must not be rendered as PRE-VIDA.5. */
export function resolveEffectivePlanetVIDA5(
  generationKey: UniverseGenerationKey,
  locator: BodyLocator,
  source: PlanetScientificResolvedTarget,
): PlanetScientificResolvedTarget {
  const assessment = Vida2PhysicalInput.planet(source);
  const microbial = ProceduralMicrobialLifeVIDA3.evaluate({
    universeSeed: generationKey.universeSeed.serialize(),
    generatorVersionCode: 3,
    kind: 'PLANET',
    galaxyIndex: locator.galaxyIndex.toString(),
    sectorKey: locator.sectorKey.toString(),
    galacticObjectIndex: locator.galacticObjectIndex.toString(),
    bodyIndex: locator.bodyIndex.toString(),
    moonIndex: null,
  }, assessment);
  const ecology = ProceduralEcologyVIDA4.evaluate(microbial);
  const coupling = Array.isArray(source.detail.atmosphere.retainedGasComposition)
    ? Vida5aEcologyAtmosphere.evaluate(ecology, source)
    : undefined;
  const maturation = coupling ? Vida5bEcologicalMaturation.evaluate(coupling) : undefined;
  const calibration = maturation
    ? Vida5cAdvancedBiospheres.evaluate(microbial, ecology, maturation, source)
    : undefined;
  const feedback = calibration?.atmosphericFeedback ?? maturation?.atmosphericFeedback;
  return feedback ? Vida5BiogenicAtmosphere.applyToTarget(source, feedback) : source;
}


/**
 * VIDA.9b.2: fail *per body* when a frozen PRE-33 source cannot close its
 * multispecies phase model. This is not a biological reroll or an invitation
 * to fabricate an effective atmosphere. Non-convergence is a legitimate
 * diagnostic for that body, not a fatal failure of a galaxy-wide read model.
 *
 * Other failures remain visible: do not silence broken identity/source
 * contracts, version mismatches or unexpected program errors.
 */
export function safeCatalogPlanetProjectionV3(
  resolve: () => PlanetScientificResolvedTarget | null,
): PlanetScientificResolvedTarget | null {
  try {
    return resolve();
  } catch (error: unknown) {
    if (error instanceof RangeError &&
        error.message.startsWith('PRE-33.03 requires PRE-33.02 coherent pressure/host:') &&
        error.message.includes('NON_CONVERGED_PHASE_MODEL')) {
      return null;
    }
    throw error;
  }
}
