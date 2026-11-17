import {describe, expect, it} from 'vitest';
import {DiscoveryState} from '../discovery/discovery-state';
import {KnownDiscovery} from '../discovery/known-discovery';
import {
  BodyLocator, CivilizationLocator, GalaxyLocator, GalacticObjectLocator,
  SectorLocator, SystemLocator,
} from '../generation/procedural-locator';
import {UniverseGenerationKey} from '../generation/universe-generation-key';
import {GeneratorVersion} from '../generation/generator-version';
import {UniverseSeed} from '../universe/universe-seed';
import {confirmedScientificDiscoveries38BisB7,confirmedScientificSystemKeys38BisB7,
  isConfirmedScientificGalaxy38BisB7} from './scientific-confirmation-38-bis-b7';

const key=new UniverseGenerationKey(UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),GeneratorVersion.V3);
const galaxy=new GalaxyLocator(3n);
const sector=new SectorLocator(3n,2n);
const system=new SystemLocator(3n,2n,4n);
const planet=new BodyLocator(3n,2n,4n,1n);
const oldPlanet=new BodyLocator(3n,2n,9n,3n);
const civilization=new CivilizationLocator(3n,2n,4n,1n,0n);
const galacticObject=new GalacticObjectLocator(3n,5n,6n);
const otherGalaxy=new GalaxyLocator(9n);
const row=(locator:ConstructorParameters<typeof KnownDiscovery>[1],state:ConstructorParameters<typeof KnownDiscovery>[2])=>
  new KnownDiscovery(key,locator,state);

describe('38.bis-b7: descubrimiento no es conocimiento científico confirmado',()=>{
  it('mantiene DETECTED → DISCOVERED → VISITED → CATALOGUED fuera del catálogo para cada familia',()=>{
    for(const state of [DiscoveryState.DETECTED,DiscoveryState.DISCOVERED,
      DiscoveryState.VISITED,DiscoveryState.CATALOGUED]){
      const source=[row(galaxy,state),row(system,state),row(galacticObject,state),
        row(planet,state),row(civilization,state),row(sector,state)];
      expect(confirmedScientificDiscoveries38BisB7(source)).toHaveLength(0);
      expect(source).toHaveLength(6); // no borra ni asciende el progreso
      expect(isConfirmedScientificGalaxy38BisB7(state)).toBe(false);
    }
  });

  it('publica galaxias, sistemas, cúmulos/nebulosas/extremos solo desde CONFIRMED',()=>{
    const source=[row(galaxy,DiscoveryState.CONFIRMED),row(system,DiscoveryState.CONFIRMED),
      row(galacticObject,DiscoveryState.CONFIRMED),row(otherGalaxy,DiscoveryState.DISCOVERED),
      row(sector,DiscoveryState.CONFIRMED)];
    expect(confirmedScientificDiscoveries38BisB7(source).map(d=>d.locator))
      .toEqual([galaxy,system,galacticObject]);
    expect(isConfirmedScientificGalaxy38BisB7(DiscoveryState.CONFIRMED)).toBe(true);
  });

  it('la confirmación completa del sistema autoriza cuerpos y civilizaciones de su sistema, nunca vecinos',()=>{
    const source=[row(galaxy,DiscoveryState.DISCOVERED),row(system,DiscoveryState.CONFIRMED),
      row(planet,DiscoveryState.DETECTED),row(oldPlanet,DiscoveryState.CATALOGUED),
      row(civilization,DiscoveryState.DISCOVERED),row(galacticObject,DiscoveryState.DISCOVERED)];
    expect(confirmedScientificSystemKeys38BisB7(source).has('3/2/4')).toBe(true);
    expect(confirmedScientificDiscoveries38BisB7(source).map(d=>d.locator))
      .toEqual([system,planet,civilization]);
    expect(source[0]?.state).toBe(DiscoveryState.DISCOVERED);
  });

  it('un BodyLocator CONFIRMED histórico se conserva, aunque el sistema no esté confirmado',()=>{
    const source=[row(system,DiscoveryState.CATALOGUED),row(oldPlanet,DiscoveryState.CONFIRMED)];
    expect(confirmedScientificDiscoveries38BisB7(source).map(d=>d.locator)).toEqual([oldPlanet]);
  });

  it('descubrir una galaxia no inventa ni confirma todos sus objetos',()=>{
    const source=[row(galaxy,DiscoveryState.DISCOVERED)];
    expect(confirmedScientificDiscoveries38BisB7(source)).toHaveLength(0);
    expect(confirmedScientificSystemKeys38BisB7(source).size).toBe(0);
  });
});
