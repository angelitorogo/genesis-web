import type {Vida6EcosystemSnapshot} from '../../domain/life/vida6-ecosystems-species';
import type {Vida7IntelligenceCivilizationSnapshot} from '../../domain/life/vida7-intelligence-civilizations';
import type {Vida8ColonizationSnapshot} from '../../domain/life/vida8-technological-colonization';
export function vida9TestSources(){
  const identity={universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
    generatorVersionCode:3,kind:'MOON' as const,galaxyIndex:'0',sectorKey:'1',
    galacticObjectIndex:'2',bodyIndex:'3',moonIndex:'0'};
  const ecosystem:Vida6EcosystemSnapshot={revision:'VIDA.6/ecosystems-species/v1',identity,
    bodyStorageKey:'0:1:2:3:MOON:0',microbialRevision:'VIDA.3/microbial/v3-aquifer-lunar-surface',
    microbialDigest:'micro',originalEcologyDigest:'eco4',calibrationDigest:null,
    habitat:'SUBSURFACE',regime:'ISOLATED_SUBSURFACE',effectiveGroups:['MICROORGANISMS'],
    species:[],relations:[],habitatsOccupied:['AQUIFER'],biospherePresent:true,
    intelligentSpeciesGenerated:false,civilizationGenerated:false,digest:'eco6'};
  const intelligence:Vida7IntelligenceCivilizationSnapshot={revision:'VIDA.7/intelligence-civilizations/v1',identity,
    bodyStorageKey:ecosystem.bodyStorageKey,ecosystemRevision:ecosystem.revision,ecosystemDigest:ecosystem.digest,
    calibrationDigest:null,eligibility:'NON_PLANET',intelligentSpecies:null,civilization:null,
    intelligencePresent:false,civilizationPresent:false,digest:'civil7'};
  const colonization:Vida8ColonizationSnapshot={revision:'VIDA.8/technological-colonization/v1',identity,
    bodyStorageKey:ecosystem.bodyStorageKey,ecosystemRevision:ecosystem.revision,ecosystemDigest:ecosystem.digest,
    nativeCivilizationRevision:intelligence.revision,nativeCivilizationDigest:intelligence.digest,
    nativeLifePresent:true,nativeIntelligencePresent:false,nativeCivilizationPresent:false,
    introducedLifePresent:false,colonialPopulationPresent:false,outcome:'NO_ELIGIBLE_ORIGIN',
    colonies:[],digest:'col8'};
  return {ecosystem,intelligence,colonization};
}

