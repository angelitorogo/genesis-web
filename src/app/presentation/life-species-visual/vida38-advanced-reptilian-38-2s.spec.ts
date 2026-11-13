import { describe, expect, it } from 'vitest';
import { buildVida38AdvancedReptilianGallery38S } from './vida38-advanced-reptilian-fixtures-38-2s';
import { deriveVida38AdvancedReptilianPlan38S, isVida38AdvancedReptilian38S } from './vida38-advanced-reptilian-plan-38-2s';

describe('38.2s — civilizaciones reptilianas avanzadas',()=>{
  it('genera contratos tipados como reptilianos ADVANCED y planes deterministas',()=>{
    const entry=buildVida38AdvancedReptilianGallery38S(12)[0]!;
    expect(isVida38AdvancedReptilian38S(entry.contract)).toBe(true);
    expect(entry.contract.intelligence?.lineage).toBe('REPTILIAN');
    expect(entry.contract.intelligence?.civilizationTier).toBe('ADVANCED');
    expect(deriveVida38AdvancedReptilianPlan38S(entry.contract)).toEqual(entry.plan);
  });

  it('devuelve exactamente 12 o 24 ejemplares únicos',()=>{
    const twelve=buildVida38AdvancedReptilianGallery38S(12);
    const twentyFour=buildVida38AdvancedReptilianGallery38S(24);
    expect(twelve).toHaveLength(12);
    expect(twentyFour).toHaveLength(24);
    expect(new Set(twelve.map(it=>it.contract.speciesId)).size).toBe(12);
    expect(new Set(twentyFour.map(it=>it.contract.speciesId)).size).toBe(24);
  });

  it('cubre variedad de ropa actual, utilitaria y técnica',()=>{
    const entries=buildVida38AdvancedReptilianGallery38S(24);
    const outfits=new Set(entries.map(it=>it.plan.outfit));
    const roles=new Set(entries.map(it=>it.plan.role));
    expect(outfits.size).toBeGreaterThanOrEqual(8);
    expect(roles.size).toBeGreaterThanOrEqual(10);
    expect(entries.some(it=>it.plan.outfit==='PRESSURE_SUIT')).toBe(true);
    expect(entries.some(it=>it.plan.outfit==='LAB_APPAREL' || it.plan.role==='SCIENTIST')).toBe(true);
    expect(entries.some(it=>it.plan.outfit==='UTILITY_OVERALLS')).toBe(true);
    expect(entries.some(it=>it.plan.outfit==='EXECUTIVE_ATTIRE' || it.plan.role==='DIPLOMAT')).toBe(true);
  });
});
