import { AtmosphereGas as Gas } from '../../domain/planetary/atmosphere-gas';
import { compareCatalogAtmosphereByKey, catalogAtmosphereSortAvailability, catalogAtmosphereSortValue, catalogEarthDrySimilarityPercent, matchesCatalogAtmosphere,
  atmosphericMolePercent, parseCatalogAtmosphereFilter } from './galaxy-knowledge-atmosphere-filter';

const earth=Object.freeze({
  fractions: Object.freeze({[Gas.NITROGEN]:0.78084,[Gas.OXYGEN]:0.20946,
    [Gas.ARGON]:0.00934,[Gas.CARBON_DIOXIDE]:0.00042}),
  pressureBar:1.01325,conditional:false,
});
const unresolved=Object.freeze({fractions:null,pressureBar:null,conditional:true});

describe('Buscador atmosférico científico V1',()=>{
  it('searches final mole fractions using inclusive exact, upper, lower and combined ranges',()=>{
    const a=parseCatalogAtmosphereFilter({gasRanges:'NITROGEN:78:79;OXYGEN:20:22;CARBON_DIOXIDE::0.05',gasCombine:'AND'},false);
    expect(matchesCatalogAtmosphere(earth,a)).toBe(true);
    expect(matchesCatalogAtmosphere(earth,parseCatalogAtmosphereFilter({gasRanges:'NITROGEN:78.084:78.084'},false))).toBe(true);
    expect(matchesCatalogAtmosphere(earth,parseCatalogAtmosphereFilter({gasRanges:'OXYGEN:25:;CARBON_DIOXIDE::0.05'},false))).toBe(false);
    expect(matchesCatalogAtmosphere(earth,parseCatalogAtmosphereFilter({gasRanges:'OXYGEN:25:;CARBON_DIOXIDE::0.05',gasCombine:'OR'},false))).toBe(true);
  });
  it('does not confuse unresolved pressure/chemistry with a real zero, even for an upper-only filter',()=>{
    const filter=parseCatalogAtmosphereFilter({gasRanges:'OXYGEN::0'},false);
    expect(matchesCatalogAtmosphere(unresolved,filter)).toBe(false);
    expect(matchesCatalogAtmosphere(null,filter)).toBe(false);
    expect(matchesCatalogAtmosphere({fractions:{[Gas.NITROGEN]:1},pressureBar:0.5,conditional:false},filter)).toBe(true);
    expect(atmosphericMolePercent(null,Gas.OXYGEN)).toBeNull();
  });
  it('filters pressure ranges without requiring resolved chemical species',()=>{
    const filter=parseCatalogAtmosphereFilter({pressureMin:'0.1',pressureMax:'2'},false);
    expect(matchesCatalogAtmosphere(earth,filter)).toBe(true);
    expect(matchesCatalogAtmosphere(unresolved,filter)).toBe(false);
    expect(matchesCatalogAtmosphere({...earth,pressureBar:3},filter)).toBe(false);
  });
  it('compares only dry atmospheric chemistry for Earth likeness, not water vapor',()=>{
    expect(catalogEarthDrySimilarityPercent(earth.fractions)).toBeCloseTo(100,1);
    expect(catalogAtmosphereSortValue(earth,'earth-similarity')).toBeCloseTo(100,1);
    expect(catalogEarthDrySimilarityPercent({[Gas.NITROGEN]:.39042,[Gas.OXYGEN]:.10473,[Gas.ARGON]:.00467,
      [Gas.CARBON_DIOXIDE]:.00021,[Gas.WATER_VAPOR]:.5})).toBeCloseTo(100,1);
    expect(catalogEarthDrySimilarityPercent(null)).toBeNull();
    expect(matchesCatalogAtmosphere(earth,parseCatalogAtmosphereFilter({earthMin:'99'},false))).toBe(true);
    expect(matchesCatalogAtmosphere({...earth,fractions:{[Gas.CARBON_DIOXIDE]:1}},parseCatalogAtmosphereFilter({earthMin:'90'},false))).toBe(false);
    expect(catalogAtmosphereSortValue(earth,'gas-CARBON_DIOXIDE')).toBeCloseTo(.042,7);
  });
  it('rejects invalid, duplicated, unsupported lunar and unbounded filters',()=>{
    expect(()=>parseCatalogAtmosphereFilter({gasRanges:'CARBON_DIOXIDE:30:5'},false)).toThrow(RangeError);
    expect(()=>parseCatalogAtmosphereFilter({gasRanges:'NITROGEN::;NITROGEN:10:20'},false)).toThrow(RangeError);
    expect(()=>parseCatalogAtmosphereFilter({gasRanges:'OXYGEN:0:1'},true)).toThrow(RangeError);
    expect(()=>parseCatalogAtmosphereFilter({gasRanges:'OZONE:0:1'},false)).toThrow(RangeError);
    expect(()=>parseCatalogAtmosphereFilter({pressureMin:'3',pressureMax:'2'},false)).toThrow(RangeError);
    expect(()=>parseCatalogAtmosphereFilter({gasRanges:'NITROGEN:101:'},false)).toThrow(RangeError);
    expect(()=>parseCatalogAtmosphereFilter({gasRanges:'NITROGEN:-1:'},false)).toThrow(RangeError);
  });
  it('sorts percentages numerically in BOTH directions and always puts unresolved after measured zero',()=>{
    const zero={fractions:{[Gas.NITROGEN]:1},pressureBar:.7,conditional:false};
    const low={fractions:{[Gas.NITROGEN]:.95,[Gas.OXYGEN]:.05},pressureBar:.8,conditional:false};
    const high={fractions:{[Gas.NITROGEN]:.4,[Gas.OXYGEN]:.6},pressureBar:1,conditional:false};
    const rows=[null,low,zero,high];
    const descending=[...rows].sort((a,b)=>compareCatalogAtmosphereByKey(a,b,'gas-OXYGEN','desc'));
    const ascending=[...rows].sort((a,b)=>compareCatalogAtmosphereByKey(a,b,'gas-OXYGEN','asc'));
    expect(descending).toEqual([high,low,zero,null]);
    expect(ascending).toEqual([zero,low,high,null]);
    expect(catalogAtmosphereSortAvailability(rows,'gas-OXYGEN')).toEqual({
      resolved:3,positive:2,unresolved:1,
    });
    expect(compareCatalogAtmosphereByKey(null,null,'gas-OXYGEN','desc')).toBe(0);
    expect(compareCatalogAtmosphereByKey(high,low,'pressure-atm','desc')).toBeLessThan(0);
  });

  it('treats conditional lunar composition as filterable only if resolved as a scenario',()=>{
    const filter=parseCatalogAtmosphereFilter({gasRanges:'NITROGEN:35:55'},true);
    expect(matchesCatalogAtmosphere({fractions:{[Gas.NITROGEN]:.45},pressureBar:.001,conditional:true},filter)).toBe(true);
    expect(matchesCatalogAtmosphere(unresolved,filter)).toBe(false);
  });
});
