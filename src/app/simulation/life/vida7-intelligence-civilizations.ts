/** VIDA.7 — generacion procedimental determinista y sin simulacion bioquimica.
 * Las selecciones de inteligencia/civilizacion reutilizan EXACTAMENTE los rolls
 * de VIDA.5c para mantener el censo de candidatas por seed; su reparto tecnologico
 * emplea las probabilidades solicitadas para VIDA.7 (65/30/5), independientes
 * de la cantidad o el orden de consultas. Ningun minimo por galaxia.
 */
import {
  vidaT1EligibleCivilizableSpecies,
  vidaT1EligibilityOf, vidaT1SelectFounder,
} from './vida-t1-civilized-founder';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import {
  VIDA5C_REVISION, VIDA7_FUTURE_INTELLIGENCE_RATE_V5C,
  VIDA7_FUTURE_CIVILIZATION_RATE_V5C, type Vida5cAdvancedBiosphere,
} from '../../domain/life/vida5c-advanced-biospheres';
import { VIDA6_REVISION, type Vida6EcosystemSnapshot, type Vida6Species,
  type Vida6HabitatKind } from '../../domain/life/vida6-ecosystems-species';
import { VIDA7_NAMESPACE, VIDA7_REVISION,
  type Vida7CivilizableLineage, type Vida7CivilizationTier,
  type Vida7Civilization, type Vida7IntelligentSpecies,
  type Vida7Communication, type Vida7SocialStructure,
  type Vida7Settlement, type Vida7BuiltForm, type Vida7IntelligenceCivilizationSnapshot,
} from '../../domain/life/vida7-intelligence-civilizations';

const hash = (value: string): string => bytesToHex(sha256(utf8ToBytes(value)));
function roll(key: string): number {
  const v = sha256(utf8ToBytes(key));
  return (v[0]*0x1000000 + v[1]*0x10000 + v[2]*0x100 + v[3]) / 0x100000000;
}
function choose<T>(items: readonly T[], key: string): T {
  if (!items.length) throw Error('VIDA.7 cannot select from empty candidates');
  return items[Math.min(items.length-1, Math.floor(roll(key)*items.length))];
}
const COMMUNICATION: Readonly<Record<Vida7CivilizableLineage,Vida7Communication>> = {
  HUMANOID:'VOCAL_SYMBOLIC', REPTILIAN:'VISUAL_GESTURAL', INSECTOID:'CHEMOSENSORY_SYMBOLIC',
};
const SOCIAL: Readonly<Record<Vida7CivilizableLineage,Vida7SocialStructure>> = {
  HUMANOID:'COOPERATIVE_BAND', REPTILIAN:'CLAN', INSECTOID:'SWARM_NETWORK',
};
const GOVERNANCE: Readonly<Record<Vida7CivilizableLineage,readonly string[]>> = {
  HUMANOID:['COUNCILS','KINSHIP_ASSEMBLIES','CONSENSUS_TRADITIONS'],
  REPTILIAN:['TERRITORIAL_COUNCILS','SEASONAL_COVENANTS','ELDER_CONCLAVES'],
  INSECTOID:['COLONY_CONSENSUS','CASTE_DELIBERATION','DISTRIBUTED_GUILDS'],
};
const FOCUS: Readonly<Record<Vida7CivilizableLineage,readonly string[]>> = {
  HUMANOID:['STORY_ARCHIVES','CRAFT_TRADITIONS','COOPERATIVE_TRADE'],
  REPTILIAN:['STONE_ARCHIVES','THERMAL_GARDENS','TERRITORIAL_RITUALS'],
  INSECTOID:['COLLECTIVE_MEMORY','FERMENTATION_GARDENS','SCENT_ARCHIVES'],
};
const CAPABILITIES: Readonly<Record<Vida7CivilizationTier,readonly string[]>> = {
  PRIMITIVE:['AGRICULTURE_OR_FORAGING','CERAMICS','HAND_TOOLS','LOCAL_CONSTRUCTION'],
  ADVANCED:['AGRICULTURE_OR_FORAGING','CERAMICS','HAND_TOOLS','LOCAL_CONSTRUCTION',
    'ELECTRIFICATION','INDUSTRIAL_PRODUCTION','TELECOMMUNICATIONS','SCIENTIFIC_INSTRUMENTS'],
  VERY_ADVANCED:['AGRICULTURE_OR_FORAGING','CERAMICS','HAND_TOOLS','LOCAL_CONSTRUCTION',
    'ELECTRIFICATION','INDUSTRIAL_PRODUCTION','TELECOMMUNICATIONS','SCIENTIFIC_INSTRUMENTS',
    'HIGH_DENSITY_ENERGY','AUTOMATED_ENGINEERING','PLANETARY_NETWORKS','ORBITAL_CAPABILITY'],
};
const SETTLEMENT_COUNTS: Readonly<Record<Vida7CivilizationTier,readonly number[]>> = {
  PRIMITIVE:[1,2,3], ADVANCED:[3,4,5], VERY_ADVANCED:[5,6,7],
};
const LINEAGE_SETTLEMENT_HABITATS: Readonly<Record<Vida7CivilizableLineage,readonly Vida6HabitatKind[]>> = {
  HUMANOID:['SURFACE_SOIL','SURFACE_WET_MARGIN','SURFACE_OPEN_TERRAIN','SURFACE_ROCK_SHELTER'],
  REPTILIAN:['SURFACE_WET_MARGIN','SURFACE_OPEN_TERRAIN','SURFACE_ROCK_SHELTER'],
  INSECTOID:['SURFACE_SOIL','SURFACE_WET_MARGIN','SURFACE_CANOPY'],
};
function builtForm(lineage: Vida7CivilizableLineage, tier: Vida7CivilizationTier,
  habitat: Vida6HabitatKind): Vida7BuiltForm {
  if (tier === 'VERY_ADVANCED') return 'INTEGRATED_HABITAT';
  if (habitat === 'SURFACE_WET_MARGIN') return 'WETLAND_PLATFORM';
  if (habitat === 'SURFACE_CANOPY') return 'CANOPY_NEST';
  if (tier === 'ADVANCED') return 'MODULAR_CITY';
  return lineage === 'REPTILIAN' ? 'ROCK_TERRACE' :
    lineage === 'INSECTOID' ? 'COLONY_MOUND' : 'HABITAT_HOMESTEAD';
}
function settlementPurpose(index: number, tier: Vida7CivilizationTier): Vida7Settlement['purpose'] {
  if (index === 0) return 'HABITATION';
  if (tier === 'PRIMITIVE') return index%2 ? 'SUBSISTENCE' : 'CRAFT';
  if (tier === 'ADVANCED') return index%2 ? 'CRAFT' : 'RESEARCH';
  return index%2 ? 'RESEARCH' : 'COORDINATION';
}
function cognitiveProfile(species: Vida6Species, lineage: Vida7CivilizableLineage): Vida7IntelligentSpecies {
  return Object.freeze({speciesId:species.id,lineage,communication:COMMUNICATION[lineage],
    socialStructure:SOCIAL[lineage],cognitionTraits:Object.freeze([
      'SYMBOLIC_LEARNING','SOCIAL_MEMORY','PROBLEM_SOLVING',
      'TOOL_MANIPULATION','COLLECTIVE_PLANNING',
    ] as const)});
}
function buildCivilization(
  intelligent: Vida7IntelligentSpecies, ecosystem: Vida6EcosystemSnapshot,
  tier: Vida7CivilizationTier, namespace: string,
): Vida7Civilization {
  const lineage = intelligent.lineage;
  const habitats = ecosystem.habitatsOccupied.filter(h=>LINEAGE_SETTLEMENT_HABITATS[lineage].includes(h));
  if (!habitats.length) throw Error('VIDA.7 has no legitimate open-surface settlement habitat');
  // Every site references an established VIDA.6 habitat; no invented ocean/orbital sites.
  const count = choose(SETTLEMENT_COUNTS[tier], namespace+'|settlement-count');
  const settlementPatterns: Vida7Settlement[] = [];
  for (let i=0; i<count; i++) {
    const key = namespace+'|settlement|'+i;
    const habitat=choose(habitats,key+'|habitat');
    settlementPatterns.push(Object.freeze({id:`vida7:site:${hash(key).slice(0,24)}`,
      habitat,builtForm:builtForm(lineage,tier,habitat),
      purpose:settlementPurpose(i,tier),
      scale:tier==='PRIMITIVE'?'SMALL':tier==='ADVANCED'?(i%2===0?'MEDIUM':'LARGE'):'LARGE',
    }));
  }
  const socialOrganization: Vida7SocialStructure = tier === 'VERY_ADVANCED' ?
    'PLANETARY_COORDINATION' : tier === 'ADVANCED' ? 'URBAN_NETWORK' : SOCIAL[lineage];
  return Object.freeze({founderSpeciesId:intelligent.speciesId,lineage,tier,
    culture:Object.freeze({socialOrganization,
      governingTradition:choose(GOVERNANCE[lineage],namespace+'|governance'),
      communication:COMMUNICATION[lineage],
      culturalFocus:choose(FOCUS[lineage],namespace+'|cultural-focus')}),
    technology:Object.freeze([...CAPABILITIES[tier]]),
    settlementPatterns:Object.freeze(settlementPatterns),
  });
}
export class Vida7IntelligenceCivilizations {
  private constructor() {}

  static evaluate(ecosystem: Vida6EcosystemSnapshot,
    calibration?: Vida5cAdvancedBiosphere): Vida7IntelligenceCivilizationSnapshot {
    if (ecosystem.revision !== VIDA6_REVISION || ecosystem.identity.generatorVersionCode !== 3 ||
        ecosystem.intelligentSpeciesGenerated !== false || ecosystem.civilizationGenerated !== false)
      throw Error('VIDA.7 requires unmodified VIDA.6 V3 Ground Truth');
    if (calibration && (calibration.revision !== VIDA5C_REVISION ||
        calibration.identity.generatorVersionCode !== 3 ||
        calibration.identity.universeSeed !== ecosystem.identity.universeSeed ||
        calibration.identity.galaxyIndex !== ecosystem.identity.galaxyIndex ||
        calibration.bodyStorageKey !== ecosystem.bodyStorageKey ||
        calibration.originalEcologyDigest !== ecosystem.originalEcologyDigest ||
        calibration.originalMicrobialDigest !== ecosystem.microbialDigest ||
        calibration.digest !== ecosystem.calibrationDigest ||
        calibration.effectiveGroups.length !== ecosystem.effectiveGroups.length ||
        calibration.effectiveGroups.some((g,i)=>g!==ecosystem.effectiveGroups[i]) ||
        calibration.futureIntelligenceProbability !== VIDA7_FUTURE_INTELLIGENCE_RATE_V5C ||
        calibration.futureCivilizationConditionalProbability !== VIDA7_FUTURE_CIVILIZATION_RATE_V5C))
      throw Error('VIDA.7 calibration is not the matching VIDA.5c revision');
    if (!calibration && ecosystem.calibrationDigest !== null)
      throw Error('VIDA.7 missing the source VIDA.5c calibration');
    const ids = new Set<string>();
    for (const sp of ecosystem.species) {
      if (ids.has(sp.id)) throw Error('VIDA.7 duplicate source species');
      ids.add(sp.id);
    }
    const eligibility = vidaT1EligibilityOf({
      kind: ecosystem.identity.kind, habitat: ecosystem.habitat, regime: ecosystem.regime,
      effectiveGroups: ecosystem.effectiveGroups, calibration,
    });
    const namespace = [VIDA7_NAMESPACE,ecosystem.identity.universeSeed,ecosystem.bodyStorageKey].join('|');
    let intelligentSpecies: Vida7IntelligentSpecies | null = null;
    let civilization: Vida7Civilization | null = null;
    if (eligibility === 'ELIGIBLE') {
      const eligible = vidaT1EligibleCivilizableSpecies(ecosystem.species);
      if (eligible.length===0) throw Error('VIDA.7 eligible biosphere lacks civilizable VIDA.6 species');
      const selection = vidaT1SelectFounder(ecosystem.identity.universeSeed,
        ecosystem.bodyStorageKey, eligible);
      if (selection !== null) {
        const species = eligible.find(candidate => candidate.id === selection.speciesId);
        if (species === undefined) throw Error('VIDA.7 missing selected VIDA.T1 founder');
        intelligentSpecies = cognitiveProfile(species, selection.lineage);
        if (selection.civilizationTier !== null) {
          civilization = buildCivilization(intelligentSpecies, ecosystem,
            selection.civilizationTier, namespace);
        }
      }
    }
    // A canonically hashed snapshot always tracks the exact historic source lineage.
    const canonical=JSON.stringify({revision:VIDA7_REVISION,seed:ecosystem.identity.universeSeed,
      body:ecosystem.bodyStorageKey,ecosystemDigest:ecosystem.digest,
      calibrationDigest:calibration?.digest??null,eligibility,intelligentSpecies,civilization});
    return Object.freeze({revision:VIDA7_REVISION,identity:Object.freeze({...ecosystem.identity}),
      bodyStorageKey:ecosystem.bodyStorageKey,ecosystemRevision:VIDA6_REVISION,
      ecosystemDigest:ecosystem.digest,calibrationDigest:calibration?.digest??null,
      eligibility,intelligentSpecies,civilization,intelligencePresent:intelligentSpecies!==null,
      civilizationPresent:civilization!==null,digest:hash(canonical)});
  }
}
