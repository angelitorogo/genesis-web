/** 37.B: evaluación procedural REAL de VIDA.7 en únicamente 10×10 sectores.
 * Ground Truth es privado al Worker: a la interfaz solo cruza un booleano de
 * detección, nunca locators, especies, cuerpos, sistemas ni recuentos.
 * No hay escritura en IndexedDB ni alteración del estado de descubrimiento.
 */
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { BodyLocator } from '../../domain/generation/procedural-locator';
import { GalaxyGenerator } from '../../simulation/universe/galaxy-generator';
import { GalaxySectorGridGenerator } from '../../simulation/sector/galaxy-sector-grid-generator';
import { GalaxySectorContentGenerator } from '../../simulation/sector/galaxy-sector-content-generator';
import { vida9V3ConfirmedPhysicalTargets } from '../runtime/vida9-v3-confirmed-physical-targets';
import { Vida2PhysicalInput } from '../../simulation/life/life-plausibility-physical-adapter-vida2';
import { ProceduralMicrobialLifeVIDA3 } from '../../simulation/life/procedural-microbial-life-vida3';
import { ProceduralEcologyVIDA4 } from '../../simulation/life/procedural-ecology-vida4';
import { Vida5aEcologyAtmosphere } from '../../simulation/life/vida5a-ecology-atmosphere';
import { Vida5bEcologicalMaturation } from '../../simulation/life/vida5b-ecological-maturation';
import { Vida5cAdvancedBiospheres } from '../../simulation/life/vida5c-advanced-biospheres';
import { Vida6EcosystemsSpecies } from '../../simulation/life/vida6-ecosystems-species';
import { Vida7IntelligenceCivilizations } from '../../simulation/life/vida7-intelligence-civilizations';
import { regionalSectorWindow37b, regionalSignalStatus37b,
  type RegionalSignalRequest37b, type RegionalSignalWorkerReply37b,
} from './regional-technosignature-37b';

const scope = globalThis as unknown as {
  onmessage: (event: MessageEvent<RegionalSignalRequest37b>) => void;
  postMessage: (value: RegionalSignalWorkerReply37b) => void;
};

function inspect(request: RegionalSignalRequest37b): RegionalSignalWorkerReply37b {
  if (request.version !== GeneratorVersion.V3.code) throw Error('37.B requiere un universo V3');
  if (!Number.isSafeInteger(request.centerX) || !Number.isSafeInteger(request.centerY))
    throw Error('Coordenadas regionales inválidas');
  const key = new UniverseGenerationKey(UniverseSeed.parse(request.seed), GeneratorVersion.V3);
  const galaxyIndex = BigInt(request.galaxyIndex);
  const galaxy = GalaxyGenerator.generate(key, galaxyIndex);
  const grid = GalaxySectorGridGenerator.generate(galaxy);
  const cells = regionalSectorWindow37b(grid,
    new GalaxySectorCoordinates(request.centerX, request.centerY));
  let errors = 0;
  for (const cell of cells) {
    try {
      const sector = GalaxySectorContentGenerator.generate(galaxy, cell);
      for (const system of sector.systemLocators) {
        try {
          const source = vida9V3ConfirmedPhysicalTargets(key, system);
          if (source === null) continue;
          for (let i = 0; i < source.planetCount; i++) {
            const body = new BodyLocator(system.galaxyIndex, system.sectorKey,
              system.galacticObjectIndex, BigInt(i));
            try {
              const physical = source.resolvePlanet(body);
              if (!physical) continue; // No inventar un resultado para un mundo no evaluable.
              const identity = {
                universeSeed: request.seed, generatorVersionCode: 3,
                kind: 'PLANET' as const, galaxyIndex: system.galaxyIndex.toString(),
                sectorKey: system.sectorKey.toString(),
                galacticObjectIndex: system.galacticObjectIndex.toString(),
                bodyIndex: body.bodyIndex.toString(), moonIndex: null,
              };
              const microbial = ProceduralMicrobialLifeVIDA3.evaluate(
                identity, Vida2PhysicalInput.planet(physical));
              const ecology = ProceduralEcologyVIDA4.evaluate(microbial);
              const atmosphere = Vida5aEcologyAtmosphere.evaluate(ecology, physical);
              const maturation = Vida5bEcologicalMaturation.evaluate(atmosphere);
              const advanced = Vida5cAdvancedBiospheres.evaluate(
                microbial, ecology, maturation, physical);
              const species = Vida6EcosystemsSpecies.evaluate(microbial, ecology, advanced);
              const civilization = Vida7IntelligenceCivilizations.evaluate(species, advanced);
              if (civilization.civilizationPresent &&
                  civilization.civilization?.tier === 'VERY_ADVANCED') {
                return {kind: 'complete', status: 'DETECTED'};
              }
            } catch { errors++; } // El cuerpo falla aislado; no publicar un negativo definitivo.
          }
        } catch { errors++; } // No detener el resto de sistemas.
      }
    } catch { errors++; } // No detener toda la región por un sector.
  }
  return {kind: 'complete', status: regionalSignalStatus37b(false, errors)};
}

scope.onmessage = (event: MessageEvent<RegionalSignalRequest37b>): void => {
  try { scope.postMessage(inspect(event.data)); }
  catch (error) {
    scope.postMessage({kind: 'error', message: error instanceof Error ? error.message : 'Error regional'});
  }
};
