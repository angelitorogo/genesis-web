/** VIDA.8 — colonizacion local determinista a partir de civilizaciones VIDA.7 EXISTENTES.
 * No inventar linajes extragalacticos, vida local, asentamientos nativos ni transformaciones fisicas.
 */
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import { VIDA6_REVISION, type Vida6EcosystemSnapshot } from '../../domain/life/vida6-ecosystems-species';
import { VIDA7_REVISION, type Vida7IntelligenceCivilizationSnapshot } from '../../domain/life/vida7-intelligence-civilizations';
import { VIDA8_REVISION, VIDA8_NAMESPACE, type Vida8Outcome, type Vida8ColonizationSnapshot, type Vida8Colony,
  type Vida8OriginRef, type Vida8IntroducedOrganism, type Vida8PopulationBand,
  type Vida8ColonialSettlement, type Vida8HabitatTechnology, type Vida8TerraformingProject,
} from '../../domain/life/vida8-technological-colonization';
import type { Vida2WorldAssessment } from './life-plausibility-engine-vida2';

const hash=(s:string)=>bytesToHex(sha256(utf8ToBytes(s)));
function roll(s:string):number {const h=sha256(utf8ToBytes(s));return (h[0]*0x1000000+h[1]*0x10000+h[2]*0x100+h[3])/0x100000000;}
const sameSystem=(a:Vida6EcosystemSnapshot['identity'],b:Vida6EcosystemSnapshot['identity']):boolean=>
  a.universeSeed===b.universeSeed && a.generatorVersionCode===b.generatorVersionCode &&
  a.galaxyIndex===b.galaxyIndex && a.sectorKey===b.sectorKey && a.galacticObjectIndex===b.galacticObjectIndex;
const range:Readonly<Record<Vida8PopulationBand,readonly [number,number]>>={
  OUTPOST:[12,150],SETTLEMENT:[151,5000],CITY:[5001,120000],NETWORK:[120001,1500000],
};
export interface Vida8CivilizationSource {
  readonly ecosystem: Vida6EcosystemSnapshot;
  readonly civilization: Vida7IntelligenceCivilizationSnapshot;
}
export interface Vida8ColonyTarget {
  readonly ecosystem: Vida6EcosystemSnapshot;
  readonly nativeCivilization: Vida7IntelligenceCivilizationSnapshot;
  readonly physical: Vida2WorldAssessment;
  /** Evidencia de base solida V3, no deducida de agua, presion ni habitabilidad. */
  readonly solidSurface: boolean;
}
function eligibleOrigin(src:Vida8CivilizationSource, target:Vida8ColonyTarget):boolean {
  const {ecosystem, civilization}=src;
  const civ=civilization.civilization;
  return ecosystem.revision===VIDA6_REVISION && civilization.revision===VIDA7_REVISION &&
    ecosystem.identity.kind==='PLANET' && civilization.identity.kind==='PLANET' &&
    sameSystem(ecosystem.identity,target.ecosystem.identity) &&
    ecosystem.bodyStorageKey!==target.ecosystem.bodyStorageKey &&
    ecosystem.digest===civilization.ecosystemDigest &&
    ecosystem.bodyStorageKey===civilization.bodyStorageKey &&
    sameSystem(ecosystem.identity,civilization.identity) &&
    ecosystem.identity.bodyIndex===civilization.identity.bodyIndex &&
    ecosystem.identity.moonIndex===civilization.identity.moonIndex &&
    civ!==null && civilization.civilizationPresent && civilization.intelligencePresent &&
    (civ.tier==='ADVANCED' || civ.tier==='VERY_ADVANCED') &&
    ecosystem.species.some(sp=>sp.id===civ.founderSpeciesId) &&
    civilization.intelligentSpecies?.speciesId===civ.founderSpeciesId &&
    (civ.tier==='VERY_ADVANCED' ? civ.technology.includes('ORBITAL_CAPABILITY') :
      civ.technology.includes('INDUSTRIAL_PRODUCTION') && civ.technology.includes('SCIENTIFIC_INSTRUMENTS'));
}
export class Vida8TechnologicalColonization {
  private constructor(){}
  static evaluate(target:Vida8ColonyTarget, origins:readonly Vida8CivilizationSource[]):Vida8ColonizationSnapshot {
    const {ecosystem, nativeCivilization, physical, solidSurface}=target;
    if (ecosystem.revision!==VIDA6_REVISION || nativeCivilization.revision!==VIDA7_REVISION ||
      ecosystem.identity.generatorVersionCode!==3 || ecosystem.digest!==nativeCivilization.ecosystemDigest ||
      ecosystem.bodyStorageKey!==nativeCivilization.bodyStorageKey ||
      nativeCivilization.identity.kind!==ecosystem.identity.kind ||
      nativeCivilization.identity.universeSeed!==ecosystem.identity.universeSeed ||
      !sameSystem(ecosystem.identity,nativeCivilization.identity) ||
      nativeCivilization.identity.bodyIndex!==ecosystem.identity.bodyIndex ||
      nativeCivilization.identity.moonIndex!==ecosystem.identity.moonIndex ||
      physical.contract!=='VIDA.2/plausibility/v2' || typeof solidSurface!=='boolean')
      throw Error('VIDA.8 incompatible native sources or V3 physical contract');
    const filtered=origins.filter(origin=>eligibleOrigin(origin,target));
    const distinct=new Map<string,Vida8CivilizationSource>();
    for(const src of filtered){
      if(distinct.has(src.ecosystem.bodyStorageKey)){
        const prev=distinct.get(src.ecosystem.bodyStorageKey)!;
        if(prev.civilization.digest!==src.civilization.digest || prev.ecosystem.digest!==src.ecosystem.digest)
          throw Error('VIDA.8 conflicting origin digests');
      }
      distinct.set(src.ecosystem.bodyStorageKey,src);
    }
    const candidates=[...distinct.values()].sort((a,b)=>a.ecosystem.bodyStorageKey.localeCompare(b.ecosystem.bodyStorageKey));
    const colonies:Vida8Colony[]=[];
    for(const source of candidates){
      if(!solidSurface) continue;
      const civ=source.civilization.civilization!;
      if(civ.tier==='PRIMITIVE')continue;
      const key=[VIDA8_NAMESPACE,ecosystem.identity.universeSeed,source.ecosystem.bodyStorageKey,
        source.civilization.digest,ecosystem.bodyStorageKey].join('|');
      // ADVANCED: limited spaceflight capability is a separate R&D milestone, not automatically orbital.
      // VERY_ADVANCED: VIDA.7 already established ORBITAL_CAPABILITY.
      // R&D/viabilidad de ESTA mision; no concede capacidad orbital general a VIDA.7.
      if(civ.tier==='ADVANCED' && roll(key+'|transport')>=.32)continue;
      const surface=physical.routes.find(r=>r.route==='SURFACE');
      const viability=surface?.factors.protection==='FAVORABLE'&&surface?.factors.temperature==='FAVORABLE';
      const selection=(civ.tier==='VERY_ADVANCED' ? .78 : .47) * (viability ? 1 : .75);
      if(roll(key+'|colonize')>=selection)continue;
      const habitat:Vida8HabitatTechnology=roll(key+'|habitat')<.35
        ? 'SUBSURFACE_VAULT':civ.tier==='VERY_ADVANCED'&&roll(key+'|shield')<.5
          ? 'ENVIRONMENTAL_SHIELD':'SEALED_SURFACE';
      const band:Vida8PopulationBand=civ.tier==='VERY_ADVANCED'
        ? (roll(key+'|size')<.3?'SETTLEMENT':roll(key+'|size')<.9?'CITY':'NETWORK')
        : (roll(key+'|size')<.75?'OUTPOST':'SETTLEMENT');
      const ref:Vida8OriginRef={civilizationDigest:source.civilization.digest,
        sourceEcosystemDigest:source.ecosystem.digest,sourceBodyStorageKey:source.ecosystem.bodyStorageKey,
        sourceIdentity:{...source.ecosystem.identity},founderSpeciesId:civ.founderSpeciesId,
        lineage:civ.lineage,tier:civ.tier};
      const settlement:Vida8ColonialSettlement={id:'vida8-settlement-'+hash(key+'|settlement').slice(0,20),
        habitatTechnology:habitat,
        function:roll(key+'|purpose')<.28?'RESEARCH':roll(key+'|purpose')<.5?'EXTRACTION':
          roll(key+'|purpose')<.85?'HABITATION':'BIOSPHERE_CONSERVATION',
        populationBand:band,colonialPopulationRange:range[band],
        supportSystems:habitat==='SUBSURFACE_VAULT'
          ? ['PRESSURIZED_CAVERN','CLOSED_WATER_LOOP','WASTE_RECYCLING','THERMAL_CONTROL']
          : habitat==='ENVIRONMENTAL_SHIELD'
            ? ['ACTIVE_RADIATION_SHIELD','AIR_RECYCLING','TEMPERATURE_CONTROL','SEALED_PERIMETER']
            : ['PRESSURIZED_HULL','LIFE_SUPPORT','CLOSED_WATER_LOOP','RADIATION_SHELTER'],
      };
      // Imported organisms MUST correspond to real source species. No native species insertion.
      const imported:Vida8IntroducedOrganism[]=source.ecosystem.species
        .filter(s=>s.group==='MICROORGANISMS'||s.group==='FUNGI'||s.group==='PLANTS_TREES')
        .slice(0,2).map(s=>({originSpeciesId:s.id,provenance:'IMPORTED_FROM_ORIGIN' as const,
          role:s.group==='MICROORGANISMS'?'CLOSED_LOOP_MICROBES' as const:'CONTROLLED_CULTIVATION' as const,
          containment:s.group==='MICROORGANISMS'?'SEALED_BIOREACTOR' as const:'CLOSED_GROW_MODULE' as const}));
      let terraform:Vida8TerraformingProject|null=null;
      if(civ.tier==='VERY_ADVANCED' && ecosystem.identity.kind==='PLANET' &&
        !viability && roll(key+'|terraform')<.42) {
        const stage=roll(key+'|stage')<.7?'FEASIBILITY' as const:'PILOT_CLOSED' as const;
        terraform={stage,
          goals:['ATMOSPHERIC_PROCESSING','RADIATION_SHIELDING','THERMAL_REGULATION','WATER_RECYCLING'],
          environmentChanged:false,isFeasibilityOnly:stage==='FEASIBILITY',ecologicalReleaseAuthorized:false};
      }
      colonies.push({id:'vida8-colony-'+hash(key).slice(0,24),origin:ref,settlement,
        introducedOrganisms:imported,terraform,provenance:'TECHNOLOGICAL_COLONIZATION'});
    }
    const outcome:Vida8Outcome=colonies.length?'COLONIZED':!candidates.length?'NO_ELIGIBLE_ORIGIN':
      !solidSurface?'NO_SOLID_SURFACE':'NOT_SELECTED';
    const canonical={revision:VIDA8_REVISION,identity:ecosystem.identity,
      bodyStorageKey:ecosystem.bodyStorageKey,ecosystemDigest:ecosystem.digest,
      nativeCivilizationDigest:nativeCivilization.digest,
      nativeLifePresent:ecosystem.biospherePresent,nativeIntelligencePresent:nativeCivilization.intelligencePresent,
      nativeCivilizationPresent:nativeCivilization.civilizationPresent,colonies,outcome};
    return Object.freeze({...canonical, ecosystemRevision:VIDA6_REVISION,
      nativeCivilizationRevision:VIDA7_REVISION,
      introducedLifePresent:colonies.some(c=>c.introducedOrganisms.length>0),
      colonialPopulationPresent:colonies.length>0,colonies:Object.freeze(colonies),digest:hash(JSON.stringify(canonical))});
  }
}
