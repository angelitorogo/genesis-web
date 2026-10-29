/** VIDA.F — auditoria PURA de coherencia cruzada de la vida generada V3.
 * No genera cuerpos, no modifica la fuente fisica ni escribe en IndexedDB.
 * Los hallazgos son verificaciones sobre snapshots ya calculados.
 */
import type { Vida3MicrobialSnapshot } from '../../domain/life/procedural-microbial-vida3';
import { VIDA4_GROUPS } from '../../domain/life/procedural-ecology-vida4';
import type { Vida5cAdvancedBiosphere } from '../../domain/life/vida5c-advanced-biospheres';
import type { Vida6EcosystemSnapshot } from '../../domain/life/vida6-ecosystems-species';
import type { Vida7IntelligenceCivilizationSnapshot } from '../../domain/life/vida7-intelligence-civilizations';
import type { Vida8ColonizationSnapshot } from '../../domain/life/vida8-technological-colonization';
import type { Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';
import type { Vida2WorldAssessment } from './life-plausibility-engine-vida2';

export const VIDA_F_REVISION='VIDA.F/cierre-auditable/v1' as const;
export type VidaFFindingCode =
  | 'IDENTIDAD_INCOHERENTE' | 'DIGEST_ORIGEN_INCOHERENTE' | 'JERARQUIA_INCOMPLETA'
  | 'ESPECIES_INCOHERENTES' | 'RED_ECOLOGICA_INVALIDA' | 'VIDA_FORZADA'
  | 'OXIGENACION_INSUFICIENTE' | 'INTELIGENCIA_INCOHERENTE'
  | 'CIVILIZACION_INCOHERENTE' | 'COLONIA_INCOHERENTE'
  | 'ORIGEN_COLONIAL_INEXISTENTE' | 'TERRAFORMACION_ALTERA_FISICA'
  | 'REGRESION_FISICA' | 'REGISTRO_PERSISTIDO_INCOHERENTE';
export interface VidaFFinding {
  readonly code:VidaFFindingCode;
  readonly explanation:string;
}
export interface VidaFAuditInput {
  readonly ecosystem:Vida6EcosystemSnapshot;
  readonly intelligence:Vida7IntelligenceCivilizationSnapshot;
  readonly colonization:Vida8ColonizationSnapshot;
  /** Opcional: VIDA.3 para verificar que no se adjudica vida sin justificacion. */
  readonly microbial?:Vida3MicrobialSnapshot;
  /** Opcional: fuente de promocion y oxigenacion planetaria VIDA.5c. */
  readonly calibration?:Vida5cAdvancedBiosphere | null;
  /** Opcional: verificacion de colonizacion de un destino no plausible. */
  readonly physicalAssessment?:Vida2WorldAssessment;
  /** Opcional: fingerprint exacto del target fisico antes y despues de proyectar VIDA. */
  readonly physicalBefore?:string;
  readonly physicalAfter?:string;
  /** Opcional: especies verificadas de cada civilizacion de origen en el mismo sistema. */
  readonly originSpeciesByBody?:Readonly<Record<string,readonly string[]>>;
  readonly record?:Vida9BiologyRecord;
}
export interface VidaFAuditResult {
  readonly revision:typeof VIDA_F_REVISION;
  readonly status:'CORRECTO'|'ERROR';
  readonly kind:'PLANET'|'MOON';
  readonly bodyStorageKey:string;
  readonly observed:{readonly species:number; readonly relations:number;
    readonly nativeLife:boolean;readonly intelligence:boolean;readonly civilization:boolean;
    readonly colonies:number;readonly uninhabitableWithColony:boolean;
    readonly fullHierarchy:boolean;readonly oxygenChecked:boolean;readonly physicalChecked:boolean};
  readonly findings:readonly VidaFFinding[];
}
const fingerprint=(i:Vida6EcosystemSnapshot['identity']):string=>
  [i.universeSeed,i.generatorVersionCode,i.kind,i.galaxyIndex,i.sectorKey,
    i.galacticObjectIndex,i.bodyIndex,i.moonIndex??'-'].join('|');

export class VidaFClosureAudit {
  private constructor(){}
  static evaluate(input:VidaFAuditInput):VidaFAuditResult {
    const {ecosystem:e,intelligence:i,colonization:c,calibration:cal,microbial:m}=input;
    const findings:VidaFFinding[]=[];
    const add=(code:VidaFFindingCode,explanation:string):void=>{findings.push({code,explanation});};
    const ids=new Set(e.species.map(s=>s.id));
    const groupIndex=VIDA4_GROUPS;
    const hasFullHierarchy=groupIndex.length===e.effectiveGroups.length &&
      groupIndex.every((g,n)=>e.effectiveGroups[n]===g);
    if (e.identity.generatorVersionCode!==3 ||
      fingerprint(e.identity)!==fingerprint(i.identity) || fingerprint(e.identity)!==fingerprint(c.identity) ||
      [i.bodyStorageKey,c.bodyStorageKey].some(k=>k!==e.bodyStorageKey) ||
      (m && (fingerprint(m.identity)!==fingerprint(e.identity)||m.bodyStorageKey!==e.bodyStorageKey))) {
      add('IDENTIDAD_INCOHERENTE','Los estados no pertenecen al mismo planeta/luna V3.');
    }
    if (i.ecosystemDigest!==e.digest || c.ecosystemDigest!==e.digest ||
        c.nativeCivilizationDigest!==i.digest ||
        (m && e.microbialDigest!==m.digest) ||
        (cal && (e.calibrationDigest!==cal.digest || cal.bodyStorageKey!==e.bodyStorageKey))) {
      add('DIGEST_ORIGEN_INCOHERENTE','Los digests enlazados VIDA.3/5/6/7/8 no coinciden.');
    }
    if (e.effectiveGroups.some((g,n)=>groupIndex[n]!==g) ||
        (e.identity.kind==='MOON' && e.effectiveGroups.length>2) ||
        (i.civilizationPresent && !hasFullHierarchy) ||
        (e.effectiveGroups.length>0 && e.effectiveGroups.some(g=>!e.species.some(s=>s.group===g)))) {
      add('JERARQUIA_INCOMPLETA','La jerarquia debe ser acumulativa y completa para una civilizacion nativa.');
    }
    if (ids.size!==e.species.length || e.biospherePresent!==(e.species.length>0) ||
        e.species.some(s=>!e.effectiveGroups.includes(s.group) || !Number.isFinite(s.phenotype.bodyLengthMeters) ||
          s.phenotype.bodyLengthMeters<=0) ||
        e.intelligentSpeciesGenerated!==false || e.civilizationGenerated!==false) {
      add('ESPECIES_INCOHERENTES','Especies duplicadas, fuera de la jerarquia, sin fenotipo o banderas nativas indebidas.');
    }
    if (e.relations.some(r=>!ids.has(r.sourceSpeciesId)||!ids.has(r.targetSpeciesId)||
        r.sourceSpeciesId===r.targetSpeciesId||!Number.isFinite(r.intensity01)||
        r.intensity01<0||r.intensity01>1)) {
      add('RED_ECOLOGICA_INVALIDA','La red contiene relaciones no existentes o intensidades invalidas.');
    }
    if (m) {
      const nativeSource=m.lifePresent || !!cal?.effectiveMicrobialLifePresent;
      const justifiedPromotion=!!cal?.newlyEstablishedMicrobialLife &&
        !!cal?.advancedAtmosphereSuitable && m.plausibility==='PLAUSIBLE' &&
        m.habitat==='SURFACE_OPEN' && e.identity.kind==='PLANET';
      if (e.biospherePresent && (!nativeSource ||
          (!m.lifePresent && !justifiedPromotion))) {
        add('VIDA_FORZADA','Se ha introducido vida sin fuente nativa o promocion fisicamente admisible.');
      }
      if (cal?.newlyEstablishedMicrobialLife && !justifiedPromotion) {
        add('VIDA_FORZADA','La nueva vida VIDA.5c carece de soporte planetario superficial elegible.');
      }
    }
    const oxygenChecked=!!cal && e.identity.kind==='PLANET';
    if (cal) {
      const a=cal.atmosphericFeedback;
      if ((i.intelligencePresent || i.civilizationPresent) &&
          (a.status!=='APPLIED'||(a.oxygenFraction01??0)<.16||
            (a.oxygenPartialPressurePascal??0)<16000||!cal.nativeCivilizationPrerequisitesReady)) {
        add('OXIGENACION_INSUFICIENTE','Inteligencia o civilizacion nativa con oxigenacion insuficiente.');
      }
      if (a.stablePhotosyntheticVegetation &&
          (a.status!=='APPLIED'||(a.oxygenFraction01??0)<.12)) {
        add('OXIGENACION_INSUFICIENTE','Vegetacion fotosintetica estable sin O2 atmosferico coherente.');
      }
    }
    if (i.intelligencePresent !== (i.intelligentSpecies!==null) ||
        (i.intelligencePresent && (!ids.has(i.intelligentSpecies!.speciesId)||
          e.identity.kind!=='PLANET')) ||
        (i.intelligencePresent && i.eligibility!=='ELIGIBLE')) {
      add('INTELIGENCIA_INCOHERENTE','La especie inteligente no existe o el cuerpo no es elegible.');
    }
    if (i.civilizationPresent !== (i.civilization!==null) ||
        (i.civilizationPresent && (!i.intelligencePresent ||
          i.civilization!.founderSpeciesId!==i.intelligentSpecies?.speciesId ||
          i.civilization!.lineage!==i.intelligentSpecies?.lineage ||
          !i.civilization!.settlementPatterns.length ||
          i.civilization!.settlementPatterns.some(s=>!e.habitatsOccupied.includes(s.habitat)) ||
          (i.civilization!.tier==='VERY_ADVANCED')!==i.civilization!.technology.includes('ORBITAL_CAPABILITY')))) {
      add('CIVILIZACION_INCOHERENTE','La civilizacion no deriva de la especie y los habitats nativos reales.');
    }
    if (c.nativeLifePresent!==e.biospherePresent ||
        c.nativeIntelligencePresent!==i.intelligencePresent ||
        c.nativeCivilizationPresent!==i.civilizationPresent ||
        c.colonialPopulationPresent!==(c.colonies.length>0) ||
        c.introducedLifePresent!==c.colonies.some(x=>x.introducedOrganisms.length>0) ||
        (c.outcome==='COLONIZED')!==(c.colonies.length>0) ||
        (e.identity.kind==='MOON'&&(i.intelligencePresent||i.civilizationPresent))) {
      add('COLONIA_INCOHERENTE','Se mezclan poblaciones introducidas y vida nativa, o hay colonias inconsistentes.');
    }
    for(const colony of c.colonies){
      const ref=colony.origin;
      if (colony.provenance!=='TECHNOLOGICAL_COLONIZATION' ||
          ref.sourceIdentity.kind!=='PLANET'||
          ref.sourceBodyStorageKey===e.bodyStorageKey||
          ref.sourceIdentity.universeSeed!==e.identity.universeSeed||
          ref.sourceIdentity.galaxyIndex!==e.identity.galaxyIndex||
          ref.sourceIdentity.sectorKey!==e.identity.sectorKey||
          ref.sourceIdentity.galacticObjectIndex!==e.identity.galacticObjectIndex||
          !colony.settlement.supportSystems.length ||
          colony.settlement.colonialPopulationRange[0]<=0 ||
          colony.settlement.colonialPopulationRange[1]<colony.settlement.colonialPopulationRange[0] ||
          colony.introducedOrganisms.some(s=>s.provenance!=='IMPORTED_FROM_ORIGIN'||
            !['SEALED_BIOREACTOR','CLOSED_GROW_MODULE'].includes(s.containment))) {
        add('COLONIA_INCOHERENTE','Una colonia tiene origen, poblacion o contencion incompatibles.');
      }
      if (input.originSpeciesByBody &&
          (!Object.prototype.hasOwnProperty.call(input.originSpeciesByBody,ref.sourceBodyStorageKey) ||
          colony.introducedOrganisms.some(s=>
            !input.originSpeciesByBody![ref.sourceBodyStorageKey]?.includes(s.originSpeciesId)))) {
        add('ORIGEN_COLONIAL_INEXISTENTE','El organismo importado no existe en la biosfera de origen.');
      }
      if (colony.terraform && (colony.terraform.environmentChanged!==false ||
          colony.terraform.ecologicalReleaseAuthorized!==false ||
          !['FEASIBILITY','PILOT_CLOSED'].includes(colony.terraform.stage))) {
        add('TERRAFORMACION_ALTERA_FISICA','La terraformacion cambia el mundo fisico o libera biota.');
      }
    }
    const physicalChecked=input.physicalBefore!==undefined && input.physicalAfter!==undefined;
    if (physicalChecked && input.physicalBefore!==input.physicalAfter) {
      add('REGRESION_FISICA','El target fisico ha cambiado al evaluar VIDA.');
    }
    if (input.record && (fingerprint(input.record.identity)!==fingerprint(e.identity)||
        input.record.ecosystem.digest!==e.digest||input.record.intelligence.digest!==i.digest||
        input.record.colonization.digest!==c.digest||
        input.record.nativeLifePresent!==e.biospherePresent||
        input.record.colonialPopulationPresent!==c.colonialPopulationPresent||
        input.record.epoch!=='CT-0'||input.record.epochOffsetYears!==0||
        input.record.revealPolicy!=='FULL_SYSTEM_REVEAL_ON_CONFIRMED')) {
      add('REGISTRO_PERSISTIDO_INCOHERENTE','La fotografia biologica VIDA.9 difiere del estado nativo o colonial.');
    }
    return Object.freeze({revision:VIDA_F_REVISION,status:findings.length?'ERROR':'CORRECTO',
      kind:e.identity.kind,bodyStorageKey:e.bodyStorageKey,
      observed:{species:e.species.length,relations:e.relations.length,nativeLife:e.biospherePresent,
        intelligence:i.intelligencePresent,civilization:i.civilizationPresent,colonies:c.colonies.length,
        uninhabitableWithColony:input.physicalAssessment?.classification==='NOT_PLAUSIBLE'&&c.colonies.length>0,
        fullHierarchy:hasFullHierarchy,oxygenChecked,physicalChecked},
      findings:Object.freeze(findings)});
  }
}
