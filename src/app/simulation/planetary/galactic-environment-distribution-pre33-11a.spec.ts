import {describe,it,expect} from 'vitest';
import {GeneratorVersion} from '../../domain/generation/generator-version';
import {UniverseGenerationKey} from '../../domain/generation/universe-generation-key';
import {UniverseSeed} from '../../domain/universe/universe-seed';
import {GalaxySectorCoordinates} from '../../domain/sector/galaxy-sector-coordinates';
import {GalaxyGenerator} from '../universe/galaxy-generator';
import {GalaxySectorContentGenerator} from '../sector/galaxy-sector-content-generator';
import {GalacticEnvironmentDistributionPRE3311a as Distribution} from './galactic-environment-distribution-pre33-11a';
const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),
  GeneratorVersion.V3,
);
const galaxy = GalaxyGenerator.generate(key,0n);
const sector = GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(23,24));

describe('PRE-33.11a — distribución galáctica física de V3, sin biología',()=>{
  it('lee el mismo perfil de metallicidad y formación del sector real, sin mutar V3',()=>{
    const p=Distribution.sector(galaxy,sector);
    expect(p.formationMetallicitySolarRatio).toBe(p.sectorMetallicitySolarRatio);
    expect(p.solidMaterialIndex).toBeGreaterThanOrEqual(0);
    expect(p.solidMaterialIndex).toBeLessThanOrEqual(1);
    expect(p.giantFormationPropensity).toBeGreaterThanOrEqual(0);
    expect(p.giantFormationPropensity).toBeLessThanOrEqual(1);
    expect(p.metallicityMeaning).toBe('SECTOR_CHARACTERISTIC_NOT_INDIVIDUAL_HOST_ABUNDANCES');
    expect(p.life).toBe('NOT_EVALUATED');
    expect(Object.isFrozen(p)).toBe(true);
  });
  it('reconstrucción repetida devuelve exactamente los mismos datos sin llamadas al PRNG',()=>{
    expect(Distribution.sector(galaxy,sector)).toEqual(Distribution.sector(galaxy,sector));
  });
  it('las lunas solo identidad están presentes pero no se declaran estériles',()=>{
    const a=Distribution.minorMoon(7,10,Distribution.sector(galaxy,sector));
    expect(a.bodyKind).toBe('MOON_IDENTITY_ONLY');
    expect(a.biosphere).toBe('NOT_EVALUATED');
    expect(a.routes.map(r=>r.solvent)).toEqual(['H2O','NH3','CH4']);
    expect(a.routes[0].phase).toBe('IDENTITY_ONLY_NOT_CHARACTERIZED');
    expect(a.routes[1].phase).toBe('UNRESOLVED_PHASE_OR_INVENTORY');
    expect(a.routes[2].phase).toBe('UNRESOLVED_PHASE_OR_INVENTORY');
    expect(a.routes.every(r=>r.observed===false && r.life==='NOT_EVALUATED')).toBe(true);
  });
  it('un ordinal menor inexistente no obtiene habitabilidad por defecto',()=>{
    expect(()=>Distribution.minorMoon(7,0,Distribution.sector(galaxy,sector))).toThrow(RangeError);
  });
});
