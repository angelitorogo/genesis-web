import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalacticNucleusState } from '../../domain/universe/galactic-nucleus-state';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GalaxyGenerator } from '../../simulation/universe/galaxy-generator';
import { createGalaxyAccretionDiskVisualization } from './galaxy-accretion-disk-visualization.model';

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
  throw new RangeError(`Could not find a ${target.name} galaxy within the deterministic search window.`);
}

describe('galaxy-accretion-disk-visualization.model', () => {
  it('should build a deterministic AGN visualization from the generated galaxy nucleus', () => {
    const galaxyIndex = findGalaxyIndexByState(GalacticNucleusState.AGN);

    expect(
      createGalaxyAccretionDiskVisualization(GENERATION_KEY, galaxyIndex),
    ).toEqual(
      createGalaxyAccretionDiskVisualization(GENERATION_KEY, galaxyIndex),
    );
  });

  it('should build a QUASAR visualization when the active nucleus is a quasar', () => {
    const galaxyIndex = findGalaxyIndexByState(GalacticNucleusState.QUASAR);
    const visual = createGalaxyAccretionDiskVisualization(GENERATION_KEY, galaxyIndex);

    expect(visual.kind).toBe('QUASAR');

    if (visual.kind !== 'QUASAR') {
      throw new Error('Expected QUASAR visual contract.');
    }

    expect(visual.quasarModel.diskOuterRadius).toBeGreaterThan(
      visual.quasarModel.diskInnerRadius,
    );
  });
});
