import {describe,expect,it} from 'vitest';
import {lunarAtmosphereBalanceFieldsPRE3306} from './moon-scientific-sections';
import {MoonAtmosphereBalanceEnginePRE3306} from '../../simulation/planetary/moon-atmosphere-balance-engine-pre33-06';
import type {MoonAtmosphereAssessment} from '../../domain/planetary/moon-atmosphere-assessment';
const geometry={hostPlanetOrdinal:1,moonOrdinal:2,massEarth:.01,radiusEarth:.28,surfaceGravityEarth:.13};
const atm={volatileInventoryIndex01:.9,thermalEscapeSupportIndex01:.9,replenishmentSupportIndex01:.9,
 condensationRemovalIndex01:0,estimatedSurfacePressurePascal:null,pressureBasis:'UNRESOLVED',
 species:[],irradiationReferenceEarth:10,chargedParticleEnvironment:'UNRESOLVED',
 hostMagnetosphereShielding:'UNRESOLVED'} as MoonAtmosphereAssessment;
describe('PRE-33.06 — fiche V3 atmosférica',()=>{
 it('anexa cinco campos a la sección Atmósfera sin duplicarla',()=>{
  const fields=lunarAtmosphereBalanceFieldsPRE3306(
    MoonAtmosphereBalanceEnginePRE3306.fromMaterialized(geometry,atm));
  expect(fields).toHaveLength(5);
  expect(fields[0].value).toContain('No identificada');
  expect(fields[1].value).toContain('No evaluables');
  expect(fields[2].value).toContain('EUV');
  expect(fields[3].value).toContain('presión física: No resuelta');
  expect(fields[4].value).toContain('Desconocido');
 });
 it('las fichas V1/V2 no reciben la proyección PRE-33.06',()=>{
  expect(lunarAtmosphereBalanceFieldsPRE3306(null)).toEqual([]);
 });
});
