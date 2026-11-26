import {describe,expect,it} from 'vitest';
import {stellarCatalogPublicCellLabel,stellarEvolutionPublicLabel,
  stellarStagePublicLabel,stellarFilterPublicLabel} from './stellar-catalog-public-labels';

const evolution:{[key:string]:string}={
  BROWN_DWARF:'Enana marrón',MAIN_SEQUENCE:'Secuencia principal',
  GIANT:'Gigante',SUPERGIANT:'Supergigante',WHITE_DWARF:'Enana blanca',
  NEUTRON_STAR:'Estrella de neutrones',
  STELLAR_BLACK_HOLE:'Remanente de agujero negro estelar',
};

describe('STARCAT.1b — valores públicos en español, códigos científicos intactos',()=>{
  it('traduce los siete estados evolutivos científicos',()=>{
    for(const [code,label] of Object.entries(evolution)){
      expect(stellarEvolutionPublicLabel(code)).toBe(label);
      expect(stellarCatalogPublicCellLabel('stars','evolution',code)).toBe(label);
    }
  });
  it('traduce las dos etapas gigantes sin modificar su identidad',()=>{
    expect(stellarStagePublicLabel('RED_GIANT_BRANCH')).toBe('Gigante roja (RGB)');
    expect(stellarStagePublicLabel('ASYMPTOTIC_GIANT_BRANCH'))
      .toBe('Gigante de rama asintótica (AGB)');
    expect(stellarCatalogPublicCellLabel('stars','stage','—')).toBe('—');
  });
  it('presenta los filtros con textos españoles y mantiene los códigos como claves',()=>{
    expect(stellarFilterPublicLabel('MAIN_SEQUENCE')).toBe('Secuencia principal');
    expect(stellarFilterPublicLabel('WHITE_DWARF')).toBe('Enana blanca');
    expect(stellarFilterPublicLabel('RGB')).toBe('Gigantes rojas (RGB)');
    expect(stellarFilterPublicLabel('G')).toBe('Clase espectral G');
  });
  it('no modifica designaciones ni magnitudes, y no altera otras categorías',()=>{
    expect(stellarCatalogPublicCellLabel('stars','spectral','G2 V')).toBe('G2 V');
    expect(stellarCatalogPublicCellLabel('stars','temperature','12.500 K')).toBe('12.500 K');
    expect(stellarCatalogPublicCellLabel('stars','radius','0,011 R☉')).toBe('0,011 R☉');
    expect(stellarCatalogPublicCellLabel('planets','evolution','MAIN_SEQUENCE'))
      .toBe('MAIN_SEQUENCE');
  });
  it('es idempotente incluso para filas persistidas de revisiones anteriores',()=>{
    expect(stellarCatalogPublicCellLabel('stars','evolution','Enana blanca')).toBe('Enana blanca');
    expect(stellarCatalogPublicCellLabel('stars','evolution',undefined)).toBe('—');
  });
});
