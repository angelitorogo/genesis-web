import { SystemLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { vi } from 'vitest';
import { PlanetDeepOceanEnvelopeEnginePRE3303B } from '../planetary/planet-deep-ocean-envelope-pre33-03b';
import { StellarMultihostFormation } from './stellar-multihost-formation';
import { StellarMultihostScientificTargetResolver } from './stellar-multihost-scientific-target-resolver';

/**
 * The URL of an already-persisted system is NOT necessarily a reproducible
 * fresh-formation fixture with a standalone test key. The previous test
 * incorrectly asserted such a fixture always existed, then failed before
 * exercising the desired non-convergence boundary.
 *
 * Use a generated, populated V3 MULTIHOST source and inject ONLY the known
 * PRE-33.03 phase nonconvergence into the optional water projection. The
 * strict engine remains unchanged; only the public fiche contains the error.
 */
describe('VIDA.9b — V3 multiple fiche with unresolved conditional water',()=>{
  it('keeps the public planet identity when its PRE-33.03 water submodel cannot converge',()=>{
    const key=new UniverseGenerationKey(
      UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),GeneratorVersion.V3);
    let source:ReturnType<typeof StellarMultihostFormation.generateOrNull>=null;
    // Search a stable public candidate, NOT a user-route address that may only
    // exist as a persisted V3 alias or under different galaxy/system context.
    for(let i=0n;i<64n && source===null;i++){
      const candidate=StellarMultihostFormation.generateOrNull(key,new SystemLocator(0n,0n,i));
      if(candidate!==null && candidate.publicPlanets.length>0)source=candidate;
    }
    expect(source).not.toBeNull();
    if(source===null)return;
    const entry=source.publicPlanets[0];
    expect(entry).toBeDefined();
    if(!entry)return;
    const realProject=PlanetDeepOceanEnvelopeEnginePRE3303B.project;
    const probe=vi.spyOn(PlanetDeepOceanEnvelopeEnginePRE3303B,'project')
      .mockImplementation((planet,atmosphere,formation,evolution,thermal)=>{
        if(planet===entry.planet && atmosphere===entry.atmosphere)
          throw new RangeError('PRE-33.03 requires PRE-33.02 coherent pressure/host: NON_CONVERGED_PHASE_MODEL');
        return realProject(planet,atmosphere,formation,evolution,thermal);
      });
    try{
      const resolver=new StellarMultihostScientificTargetResolver(source);
      const target=resolver.resolveDetailed(key,entry.publicLocator);
      expect(target).not.toBeNull();
      expect(target?.identity.locator).toBe(entry.publicLocator);
      expect(target?.detail.general.massEarth).toBe(entry.planet.massEarth);
      expect(target?.detail.surface.pre33WaterPhaseLimitation).toBe('NON_CONVERGED_PHASE_MODEL');
      expect(target?.detail.surface.h2oCT0Ledger).toBeUndefined();
      expect(target?.detail.surface.deepStructureScenario).toBeUndefined();
      expect(target?.detail.moons.moonCount).toBe(entry.moonSystem.moonCount);
      expect(probe).toHaveBeenCalled();
    }finally{probe.mockRestore();}
  },120_000);
});
