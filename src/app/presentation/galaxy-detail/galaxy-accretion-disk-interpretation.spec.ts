import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalacticNucleusState } from '../../domain/universe/galactic-nucleus-state';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GalaxyGenerator } from '../../simulation/universe/galaxy-generator';
import { createAgnNucleusRenderModel } from '../laboratory/galactic-objects/agn-nucleus-render-model';
import { createQuasarNucleusRenderModel } from '../laboratory/galactic-objects/quasar-nucleus-render-model';
import { buildAgnAccretionDiskInterpretation, buildQuasarAccretionDiskInterpretation } from './galaxy-accretion-disk-interpretation';

const GENERATION_KEY = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V2,
);

function findGalaxyIndexByState(target: GalacticNucleusState): bigint {
  for (let galaxyIndex = 0n; galaxyIndex < 4096n; galaxyIndex += 1n) {
    const galaxy = GalaxyGenerator.generate(GENERATION_KEY, galaxyIndex);
    if (galaxy.nucleus?.state === target) {
      return galaxyIndex;
    }
  }
  throw new RangeError(`Could not find a ${target.name} galaxy.`);
}

describe('galaxy-accretion-disk-interpretation', () => {
  it('should derive a stable strict-visual interpretation for AGN renders', () => {
    const galaxy = GalaxyGenerator.generate(GENERATION_KEY, findGalaxyIndexByState(GalacticNucleusState.AGN));
    const interpretation = buildAgnAccretionDiskInterpretation(createAgnNucleusRenderModel(galaxy));

    expect(interpretation.readoutFacts).toHaveLength(6);
    expect(interpretation.legendFacts).toHaveLength(4);
    expect(interpretation.regimeLabel).toContain('·');
  });

  it('should derive a stable strict-visual interpretation for quasar renders', () => {
    const galaxy = GalaxyGenerator.generate(GENERATION_KEY, findGalaxyIndexByState(GalacticNucleusState.QUASAR));
    const interpretation = buildQuasarAccretionDiskInterpretation(createQuasarNucleusRenderModel(galaxy));

    expect(interpretation.readoutFacts).toHaveLength(6);
    expect(interpretation.legendFacts).toHaveLength(4);
    expect(interpretation.summary).toContain('quásar');
  });
});
