import { describe, expect, it } from 'vitest';
import { Vida9aPhysicalBiologyCoherence, type Vida9aPlanetInput, type Vida9aBiologySummary } from './vida9a-physical-biology-coherence';
const biology = (changes: Partial<Vida9aBiologySummary> = {}): Vida9aBiologySummary => ({
  nativeLife: true, nativeIntelligence: true, nativeCivilization: true,
  introducedLife: false, colonialPopulation: false,
  speciesIds: ['vida6:founder','vida6:producer'],relationCount:1,
  intelligenceSpeciesId:'vida6:founder',civilizationFounderSpeciesId:'vida6:founder',
  colonyCount:0, relationEndpoints:[{sourceSpeciesId:'vida6:founder',targetSpeciesId:'vida6:producer'}], ...changes,
});
const hiorus = (): Vida9aPlanetInput => ({
  kind:'PLANET',
  baseline:{temperatureKelvin:300.3,pressurePascal:225787},
  effective:{temperatureKelvin:289.22,pressurePascal:151907.46},
  feedback:{status:'APPLIED', climateDeltaKelvin:-11.08,
    sourcePressurePascal:225787,pressurePascal:151907.46,
    oxygenFraction01:0.229,oxygenPartialPressurePascal:34785,
    nativeCivilizationAtmosphereReady:true},
  surface:{hasDefinedSolidSurface:true,hasPersistentLiquidWater:true,coverage01:0.196},
  surfaceDiverseEcosystem:true,
  geochemistry:{niche:'SOLID_SURFACE',solventState:'UNRESOLVED',
    liquidWaterKilograms:0,hasPositiveResolvedPower:false},
  biology:biology(),
});
describe('VIDA.9a auditoría CT-0 sin mutación',()=>{
  it('reconcilia Hiorus con la etapa biogénica y límites del nicho geoquímico',()=>{
    const input=hiorus(); const frozen=JSON.stringify(input);
    const report=Vida9aPhysicalBiologyCoherence.planet(input);
    expect(report.status).toBe('COHERENT');
    expect(report.findings.map(f=>f.id)).toContain('BIOGENIC_TEMPERATURE_STAGE');
    expect(report.findings.map(f=>f.id)).toContain('BIOGENIC_PRESSURE_STAGE');
    expect(report.findings.map(f=>f.id)).toContain('GEOCHEMISTRY_NICHE_SCOPE');
    expect(report.findings.some(f=>f.severity==='ERROR')).toBe(false);
    expect(JSON.stringify(input)).toBe(frozen);
    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.findings)).toBe(true);
    expect(JSON.stringify(Vida9aPhysicalBiologyCoherence.planet(input))).toBe(JSON.stringify(report));
  });
  it('denuncia una temperatura efectiva que no corresponde al delta atmosférico',()=>{
    const input=hiorus();const report=Vida9aPhysicalBiologyCoherence.planet({
      ...input,effective:{...input.effective,temperatureKelvin:295}});
    expect(report.status).toBe('REVIEW_REQUIRED');
    expect(report.findings.map(x=>x.id)).toContain('CLIMATE_DELTA_MISMATCH');
  });
  it('no permite civilización sin especie inteligente ni fundador coherente',()=>{
    const input=hiorus();const report=Vida9aPhysicalBiologyCoherence.planet({
      ...input,biology:biology({intelligenceSpeciesId:'unrelated'})});
    expect(report.status).toBe('REVIEW_REQUIRED');
    expect(report.findings.map(x=>x.id)).toContain('INTELLIGENT_SPECIES_MISSING');
    expect(report.findings.map(x=>x.id)).toContain('FOUNDER_SPECIES_MISMATCH');
  });
  it('detecta relaciones con especies ajenas al ecosistema',()=>{
    const input=hiorus();const result=Vida9aPhysicalBiologyCoherence.planet({
      ...input,biology:biology({relationEndpoints:[{sourceSpeciesId:'vida6:founder',targetSpeciesId:'unknown'}]})});
    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(result.findings.map(x=>x.id)).toContain('DANGLING_ECOLOGICAL_RELATION');
  });
  it('un océano lunar sin vida no significa contradicción',()=>{
    const b=biology({nativeLife:false,nativeIntelligence:false,nativeCivilization:false,
      speciesIds:[],relationCount:0,relationEndpoints:[],intelligenceSpeciesId:null,civilizationFounderSpeciesId:null});
    const report=Vida9aPhysicalBiologyCoherence.moon({kind:'MOON',
      oceanState:'PRESENT_IN_SIMULATED_MODEL',geochemistry:null,biology:b});
    expect(report.status).toBe('COHERENT');
    expect(report.findings.map(x=>x.id)).toContain('OCEAN_WITHOUT_LIFE');
  });
  it('rechaza referencias ecológicas heredadas si no quedan especies nativas',()=>{
    const b=biology({nativeLife:false,nativeIntelligence:false,nativeCivilization:false,
      speciesIds:[],relationCount:0,intelligenceSpeciesId:null,civilizationFounderSpeciesId:null});
    const report=Vida9aPhysicalBiologyCoherence.moon({kind:'MOON',
      oceanState:null,geochemistry:null,biology:b});
    expect(report.status).toBe('REVIEW_REQUIRED');
    expect(report.findings.map(x=>x.id)).toContain('DANGLING_ECOLOGICAL_RELATION');
  });
  it('detecta civilizaciones lunares nativas indebidas',()=>{
    const report=Vida9aPhysicalBiologyCoherence.moon({kind:'MOON',
      oceanState:'ABSENT_IN_SIMULATED_MODEL',geochemistry:null,biology:biology()});
    expect(report.status).toBe('REVIEW_REQUIRED');
    expect(report.findings.map(x=>x.id)).toContain('NATIVE_LUNAR_CIVILIZATION');
  });
  it('vida introducida no se equipara a vida nativa, ni a colonias sin población',()=>{
    const b=biology({nativeLife:false,nativeIntelligence:false,nativeCivilization:false,
      speciesIds:[],relationCount:0,relationEndpoints:[],intelligenceSpeciesId:null,civilizationFounderSpeciesId:null,
      introducedLife:true,colonialPopulation:true,colonyCount:1});
    const report=Vida9aPhysicalBiologyCoherence.moon({kind:'MOON',
      oceanState:null,geochemistry:null,biology:b});
    expect(report.status).toBe('COHERENT');
  });
});
