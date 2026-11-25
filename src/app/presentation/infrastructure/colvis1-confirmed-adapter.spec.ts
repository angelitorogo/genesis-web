import { Vida9BiologyExploration } from '../../simulation/life/vida9-biology-exploration';
import { vida9TestSources } from '../../simulation/life/vida9-test-fixture';
import { vida38InfrastructurePlansFromConfirmed386 } from './vida38-infrastructure-plan-38-6';
import { colvis1LayoutFromVerifiedPlan } from './colvis1-colonial-architecture';

describe('COLVIS.1 · puente VIDA.9 confirmado → nueva arquitectura',()=>{
  it('conserva el nivel fundador, linaje, función, banda y destino en el plan visual',()=>{
    const source=vida9TestSources();
    const origin={civilizationDigest:'founder-digest',sourceEcosystemDigest:'founder-eco',
      sourceBodyStorageKey:'other-planet',sourceIdentity:{...source.ecosystem.identity,
        kind:'PLANET' as const,bodyIndex:'0',moonIndex:null},
      founderSpeciesId:'founder-species',lineage:'INSECTOID' as const,tier:'VERY_ADVANCED' as const};
    const settlement={id:'verified-colonial-site',habitatTechnology:'ENVIRONMENTAL_SHIELD' as const,
      function:'EXTRACTION' as const,populationBand:'CITY' as const,
      colonialPopulationRange:[5001,120000] as const,supportSystems:['AIR_RECYCLING']};
    const colonization={...source.colonization,outcome:'COLONIZED' as const,
      colonies:[{id:'test-colony',origin,settlement,introducedOrganisms:[],terraform:null,
        provenance:'TECHNOLOGICAL_COLONIZATION' as const}],colonialPopulationPresent:true};
    const record=Vida9BiologyExploration.evaluate(source.ecosystem,source.intelligence,colonization);
    const plans=vida38InfrastructurePlansFromConfirmed386(record);
    expect(plans).toHaveLength(1);
    const p=plans[0]!;
    expect(p.id).toContain('test-colony');
    expect(p.tier).toBe('COLONIAL');
    expect(p.lineage).toBe('INSECTOID');
    expect(p.colonyArchitectureCOLVIS1).toEqual({
      founderTier:'VERY_ADVANCED',destinationKind:record.identity.kind,
      populationRange:[5001,120000],function:'EXTRACTION',
      founderSpeciesId:'founder-species',founderSourceBodyStorageKey:'other-planet',
    });
    expect(colvis1LayoutFromVerifiedPlan(p)?.family).toBe('INSECTOID_VERY_ADVANCED');
    expect(vida38InfrastructurePlansFromConfirmed386({...record,digest:'INVALID'})).toEqual([]);
    expect(JSON.stringify(record)).toBe(JSON.stringify(JSON.parse(JSON.stringify(record))));
  });
});
