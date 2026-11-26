import {describe,expect,it} from 'vitest';
import {SystemLocator} from '../../domain/generation/procedural-locator';
import type {StellarPhysicalProperties} from '../../domain/stellar/stellar-physical-properties';
import type {StellarSpectralAppearance} from '../../domain/stellar/stellar-spectral-appearance';
import type {StellarLifetimeProfile} from '../../domain/stellar/stellar-lifetime-profile';
import {
  starCatalogComponent,compareStarsCatalog,projectStarCatalogRowStarcat1,
} from './galaxy-knowledge-stars-catalog.data-source';

const locator=new SystemLocator(4n,12n,25n);
function stellar(evolution:'WHITE_DWARF'|'GIANT'|'MAIN_SEQUENCE',radius:number,temperature:number,
  component:'A'|'B'|'C'='A') {
  // Only the read-model boundary is under test here. Scientific generators
  // validate these shapes in their independent stellar suite.
  const physical={radiusSolar:radius,currentMassSolar:0.9,
    effectiveTemperatureKelvin:temperature,luminositySolar:1.5} as StellarPhysicalProperties;
  const spectral={spectralType:{family:'G',designation:'G2'}} as StellarSpectralAppearance;
  const lifetime={ageBillionYears:5,evolutionAssessment:{evolutionState:{name:evolution},
    postMainSequenceStage:evolution==='GIANT'?{name:'RED_GIANT_BRANCH'}:null}} as StellarLifetimeProfile;
  return starCatalogComponent(locator,'Araleth',component,physical,spectral,lifetime);
}

describe('STARCAT.1 — estrellas individuales confirmables y ordenables',()=>{
  it('conserva una identidad distinta para A/B/C y apunta al mismo sistema público',()=>{
    const a=stellar('WHITE_DWARF',0.009,13500,'A');
    const b=stellar('GIANT',52,3750,'B');
    const c=stellar('MAIN_SEQUENCE',1,5770,'C');
    expect(new Set([a.id,b.id,c.id]).size).toBe(3);
    expect(a.designation).toBe('Araleth A');
    for(const entry of [a,b,c]){
      expect(entry.route).toEqual(['/archive/system','4','12','25']);
      expect(entry.evolution).toBeTruthy();
    }
  });
  it('ordena el radio y la temperatura físicos sin redondear las magnitudes',()=>{
    const white=stellar('WHITE_DWARF',0.009,13500,'A');
    const giant=stellar('GIANT',52,3750,'B');
    const main=stellar('MAIN_SEQUENCE',1,5770,'C');
    expect([giant,main,white].sort((a,b)=>compareStarsCatalog(a,b,'radius','asc')))
      .toEqual([white,main,giant]);
    expect([giant,main,white].sort((a,b)=>compareStarsCatalog(a,b,'temperature','desc')))
      .toEqual([white,main,giant]);
    expect(projectStarCatalogRowStarcat1(white).sortNumbers?.['radius']).toBe(0.009);
    expect(projectStarCatalogRowStarcat1(giant).sortNumbers?.['radius']).toBe(52);
  });
  it('publica etapa RGB explícita y enlaces de sistema y escena sin perder el índice galáctico',()=>{
    const row=projectStarCatalogRowStarcat1(stellar('GIANT',52,3750,'B'));
    expect(row.cells['stage']).toBe('Gigante roja (RGB)');
    expect(row.actions[0]?.route).toEqual(['/archive/system','4','12','25']);
    expect(row.actions[1]?.route).toEqual(['/system','4','12','25']);
    expect(row.sortNumbers?.['temperature']).toBe(3750);
  });
  it('los atributos científicos no dependen de la escala visual de STARVIS.1',()=>{
    const white=stellar('WHITE_DWARF',0.009,13500);
    const row=projectStarCatalogRowStarcat1(white);
    expect(row.cells['radius']).toContain('R☉');
    expect(row.cells['temperature']).toContain('K');
    expect(row.sortNumbers?.['radius']).toBe(white.radiusSolar);
  });
});
