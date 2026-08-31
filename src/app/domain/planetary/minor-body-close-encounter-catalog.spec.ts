import { MinorBodyCloseEncounterCatalog } from './minor-body-close-encounter-catalog';

describe('MinorBodyCloseEncounterCatalog point 23.6',()=>{
  it('should support a system with no point-23.3 approach candidates',()=>{
    const body={};
    const orbital={entries:[body]};
    const proximity={orbitalCatalog:orbital,assessments:[]};
    const resonance={orbitalCatalog:orbital,proximityCatalog:proximity};
    const giant={resonanceCatalog:resonance};
    const transition={minorBody:body,encounterAssessment:null};
    const catalog=new MinorBodyCloseEncounterCatalog(giant as any,[],[transition as any]);
    expect(catalog.approachCandidateCount).toBe(0);
    expect(catalog.encounterCount).toBe(0);
  });
});
