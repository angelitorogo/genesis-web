import {describe,expect,it} from 'vitest';
import {VidaFClosureAudit} from './vida-f-closure-audit';
import {VIDA4_GROUPS} from '../../domain/life/procedural-ecology-vida4';
import type {Vida3MicrobialSnapshot} from '../../domain/life/procedural-microbial-vida3';
import type {Vida5cAdvancedBiosphere} from '../../domain/life/vida5c-advanced-biospheres';
import type {Vida6EcosystemSnapshot,Vida6Species} from '../../domain/life/vida6-ecosystems-species';
import type {Vida7IntelligenceCivilizationSnapshot} from '../../domain/life/vida7-intelligence-civilizations';
import type {Vida8ColonizationSnapshot,Vida8Colony} from '../../domain/life/vida8-technological-colonization';
import {Vida9BiologyExploration} from './vida9-biology-exploration';
import type {VidaFAuditInput} from './vida-f-closure-audit';

function fixture(kind:'PLANET'|'MOON'='MOON',full=false):VidaFAuditInput {
  const identity={universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
    generatorVersionCode:3,kind,galaxyIndex:'0',sectorKey:'1',galacticObjectIndex:'2',
    bodyIndex:'3',moonIndex:kind==='MOON'?'0':null};
  const bodyStorageKey='VIDA-F:'+kind;
  const groups=full?[...VIDA4_GROUPS]:[];
  const species:Vida6Species[]=groups.map((group,n)=>({id:`spec-${n}`,proceduralName:`Especie ${n}`,
    group,habitat:group==='HUMANOIDS'?'SURFACE_OPEN_TERRAIN':'SURFACE_SOIL',
    nutrition:'OMNIVORE',adaptations:[],niche:'SURFACE_SOIL/OMNIVORE',
    phenotype:{bodyPlan:'CELL_COLONY',covering:'MEMBRANE',locomotion:'SESSILE',
      bodyLengthMeters:0.4,primaryColorHex:'#111111',secondaryColorHex:'#222222',
      pattern:'SOLID',appendagePairs:0,bioluminescent:false}}));
  const micro:Vida3MicrobialSnapshot={revision:'VIDA.3/microbial/v3-aquifer-lunar-surface',identity,
    bodyStorageKey,plausibility:full?'PLAUSIBLE':'NOT_PLAUSIBLE',
    selectedRoute:full?'SURFACE':null,habitat:full?'SURFACE_OPEN':null,
    lifePresent:full,biology:full?'MICROBIAL':'NONE',biosphereId:full?'biosphere':null,
    digest:'micro'};
  const e:Vida6EcosystemSnapshot={revision:'VIDA.6/ecosystems-species/v1',identity,bodyStorageKey,
    microbialRevision:micro.revision,microbialDigest:micro.digest,originalEcologyDigest:'eco4',
    calibrationDigest:full?'cal':null,habitat:micro.habitat,
    regime:full?'SURFACE_DIVERSE':'STERILE',effectiveGroups:groups,species,relations:[],
    habitatsOccupied:full?['SURFACE_SOIL','SURFACE_OPEN_TERRAIN']:[],biospherePresent:full,
    intelligentSpeciesGenerated:false,civilizationGenerated:false,digest:'eco6'};
  const i:Vida7IntelligenceCivilizationSnapshot={revision:'VIDA.7/intelligence-civilizations/v1',identity,
    bodyStorageKey,ecosystemRevision:e.revision,ecosystemDigest:e.digest,
    calibrationDigest:full?'cal':null,eligibility:full?'ELIGIBLE':'NON_PLANET',
    intelligentSpecies:full?{speciesId:'spec-7',lineage:'HUMANOID',
      communication:'VOCAL_SYMBOLIC',socialStructure:'CLAN',cognitionTraits:['PROBLEM_SOLVING']}:null,
    civilization:full?{founderSpeciesId:'spec-7',lineage:'HUMANOID',tier:'VERY_ADVANCED',
      culture:{socialOrganization:'PLANETARY_COORDINATION',governingTradition:'Consejo',
        communication:'VOCAL_SYMBOLIC',culturalFocus:'Ciencia'},
      technology:['ORBITAL_CAPABILITY'],settlementPatterns:[{id:'site',habitat:'SURFACE_OPEN_TERRAIN',
        builtForm:'MODULAR_CITY',purpose:'HABITATION',scale:'LARGE'}]}:null,
    intelligencePresent:full,civilizationPresent:full,digest:'civil7'};
  const c:Vida8ColonizationSnapshot={revision:'VIDA.8/technological-colonization/v1',identity,
    bodyStorageKey,ecosystemRevision:e.revision,ecosystemDigest:e.digest,
    nativeCivilizationRevision:i.revision,nativeCivilizationDigest:i.digest,
    nativeLifePresent:full,nativeIntelligencePresent:full,nativeCivilizationPresent:full,
    introducedLifePresent:false,colonialPopulationPresent:false,outcome:'NO_ELIGIBLE_ORIGIN',
    colonies:[],digest:'col8'};
  const cal:Vida5cAdvancedBiosphere={revision:'VIDA.5c/advanced-biosphere/v1',
    identity:{universeSeed:identity.universeSeed,generatorVersionCode:3,galaxyIndex:'0'},bodyStorageKey,
    originalMicrobialDigest:micro.digest,originalEcologyDigest:e.originalEcologyDigest,
    originalMaturationDigest:'mat',originalMicrobialLifePresent:true,effectiveMicrobialLifePresent:true,
    newlyEstablishedMicrobialLife:false,originalEffectiveGroups:groups,effectiveGroups:groups,
    promotedFromPhysicalEvidence:false,advancedAtmosphereSuitable:true,
    atmosphericFeedback:{revision:'VIDA.5/biogenic-atmosphere/v1',status:'APPLIED',ecologyDigest:'eco4',
      sourcePressurePascal:101325,pressurePascal:101325,sourceOxygenFraction01:.03,
      oxygenFraction01:.21,oxygenPartialPressurePascal:21278,aerobicAdvanced:true,effectiveGroups:groups,
      stablePhotosyntheticVegetation:true,advancedAerobicFaunaSupported:true,
      nativeCivilizationAtmosphereReady:true,gasComposition:[],
      meanMolarMassGramsPerMole:29,referenceDensityKilogramsPerCubicMeter:1.2,
      greenhouseTrappingFraction01:.3,climateDeltaKelvin:0,meanSurfaceTemperatureKelvin:290,
      pressureBalanceFactor:1,digest:'feedback'},nativeCivilizationPrerequisitesReady:true,
    futureIntelligenceProbability:.65,futureCivilizationConditionalProbability:.60,digest:'cal'};
  return {ecosystem:e,intelligence:i,colonization:c,microbial:micro,
    ...(full?{calibration:cal}:{}),physicalBefore:'fisica-original',physicalAfter:'fisica-original'};
}
function colony():Vida8Colony {
  const origin=fixture('PLANET',true);
  return {id:'colony-1',provenance:'TECHNOLOGICAL_COLONIZATION',
    origin:{civilizationDigest:'civil7',sourceEcosystemDigest:'eco6',sourceBodyStorageKey:'VIDA-F:PLANET',
      sourceIdentity:origin.ecosystem.identity,founderSpeciesId:'spec-7',lineage:'HUMANOID',tier:'VERY_ADVANCED'},
    settlement:{id:'settlement',habitatTechnology:'SEALED_SURFACE',function:'RESEARCH',
      populationBand:'OUTPOST',colonialPopulationRange:[12,150],supportSystems:['LIFE_SUPPORT']},
    introducedOrganisms:[{originSpeciesId:'spec-0',provenance:'IMPORTED_FROM_ORIGIN',
      role:'CLOSED_LOOP_MICROBES',containment:'SEALED_BIOREACTOR'}],
    terraform:null};
}

describe('VIDA.F — cierre científico transversal',()=>{
  it('distingue luna estéril de vida forzada y conserva física y entrada',()=>{
    const input=fixture();const before=JSON.stringify(input);
    const r=VidaFClosureAudit.evaluate(input);
    expect(r.status).toBe('CORRECTO');
    expect(r.observed.nativeLife).toBe(false);
    expect(r.observed.physicalChecked).toBe(true);
    expect(JSON.stringify(input)).toBe(before);
    expect(VidaFClosureAudit.evaluate(input)).toEqual(r);
  });
  it('admite ecosistema planetario completo, O2 y civilización nativa muy avanzada',()=>{
    const input=fixture('PLANET',true);
    const record=Vida9BiologyExploration.evaluate(input.ecosystem,input.intelligence,input.colonization);
    const r=VidaFClosureAudit.evaluate({...input,record});
    expect(r.status).toBe('CORRECTO');
    expect(r.observed.fullHierarchy).toBe(true);
    expect(r.observed.oxygenChecked).toBe(true);
    expect(r.observed.species).toBe(8);
    expect(r.observed.civilization).toBe(true);
  });
  it('detecta jerarquía incompleta, especies inexistentes y linaje incorrecto',()=>{
    const a=fixture('PLANET',true);
    const e={...a.ecosystem,effectiveGroups:a.ecosystem.effectiveGroups.slice(0,7),
      relations:[{sourceSpeciesId:'spec-7',targetSpeciesId:'inexistente',kind:'CONSUMES' as const,
        intensity01:.5}]};
    const bad={...a,ecosystem:e,intelligence:{...a.intelligence,civilization:{
      ...a.intelligence.civilization!,founderSpeciesId:'inexistente'}}};
    const codes=VidaFClosureAudit.evaluate(bad).findings.map(f=>f.code);
    expect(codes).toContain('JERARQUIA_INCOMPLETA');
    expect(codes).toContain('RED_ECOLOGICA_INVALIDA');
    expect(codes).toContain('CIVILIZACION_INCOHERENTE');
  });
  it('detecta oxígeno insuficiente y vida forzada con microbios no plausibles',()=>{
    const a=fixture('PLANET',true);
    const poor={...a,calibration:{...a.calibration!,atmosphericFeedback:{
      ...a.calibration!.atmosphericFeedback,oxygenFraction01:.04,oxygenPartialPressurePascal:4000}}};
    expect(VidaFClosureAudit.evaluate(poor).findings.map(f=>f.code)).toContain('OXIGENACION_INSUFICIENTE');
    const forced={...a,microbial:{...a.microbial!,lifePresent:false,plausibility:'NOT_PLAUSIBLE' as const,
      habitat:null,selectedRoute:null},calibration:{...a.calibration!,
      effectiveMicrobialLifePresent:false,newlyEstablishedMicrobialLife:false}};
    expect(VidaFClosureAudit.evaluate(forced).findings.map(f=>f.code)).toContain('VIDA_FORZADA');
  });
  it('permite colonia sellada en luna no habitable sin adjudicarle vida nativa',()=>{
    const a=fixture(),colonies=[colony()];
    const c:Vida8ColonizationSnapshot={...a.colonization,colonies,
      outcome:'COLONIZED',introducedLifePresent:true,colonialPopulationPresent:true};
    const result=VidaFClosureAudit.evaluate({...a,colonization:c,
      physicalAssessment:{contract:'VIDA.2/plausibility/v2',classification:'NOT_PLAUSIBLE',
        selectedRoute:null,lifeGenerated:false,routes:[]},
      originSpeciesByBody:{'VIDA-F:PLANET':['spec-0','spec-7']}});
    expect(result.status).toBe('CORRECTO');
    expect(result.observed.uninhabitableWithColony).toBe(true);
    expect(result.observed.nativeLife).toBe(false);
    expect(result.observed.colonies).toBe(1);
  });
  it('detecta biota colonial no originaria, terraformación física y cambios PRE-33',()=>{
    const a=fixture(),c=colony();
    const altered={...c,terraform:{stage:'FEASIBILITY' as const,goals:[],
      environmentChanged:true as unknown as false,isFeasibilityOnly:true,ecologicalReleaseAuthorized:false as const}};
    const record={...a.colonization,colonies:[altered],outcome:'COLONIZED' as const,
      introducedLifePresent:true,colonialPopulationPresent:true};
    const r=VidaFClosureAudit.evaluate({...a,colonization:record,
      physicalAfter:'física-modificada',originSpeciesByBody:{'VIDA-F:PLANET':[]}});
    expect(r.findings.map(f=>f.code)).toContain('REGRESION_FISICA');
    expect(r.findings.map(f=>f.code)).toContain('TERRAFORMACION_ALTERA_FISICA');
    expect(r.findings.map(f=>f.code)).toContain('ORIGEN_COLONIAL_INEXISTENTE');
  });
});
